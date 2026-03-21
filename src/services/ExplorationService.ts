import { useCharacterStore } from '../stores/useCharacterStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useUIStore } from '../stores/useUIStore';
import { gameOverSlides } from '../data/events';
import explorationEventsData from '../data/exploration_events.json';

export interface ExplorationResult {
  type: 'nothing' | 'resource' | 'combat' | 'unique' | 'item' | 'damage';
  title: string;
  description: string;
  image?: string;
  data?: {
    itemId?: string;
    quantity?: number;
    enemies?: string[];
    wolfCount?: number;
    hpLoss?: number;
    energyGain?: number;
    eventId?: string;
  };
}

interface ExplorationEventDefinition {
  id: string;
  weight: number;
  locations?: string[];
  condition?: string;
  result: ExplorationResult;
}

export class ExplorationService {
  static processResult(result: ExplorationResult): void {
    const charStore = useCharacterStore.getState();
    const invStore = useInventoryStore.getState();
    const skillStore = useSkillStore.getState();
    const uiStore = useUIStore.getState();
    const worldStore = useWorldStateStore.getState();

    // Grant XP for exploration
    skillStore.addXp('exploration', 10);

    // Handle Resources and Items
    if (result.type === 'resource' || result.type === 'item') {
      if (result.data?.itemId) {
         if (result.data.itemId === 'coins') {
             charStore.addCurrency('copper', result.data.quantity || 0);
         } else {
             invStore.addItem(result.data.itemId, result.data.quantity || 1);
         }
      }
      if (result.data?.energyGain) {
        useCharacterStore.setState((state) => ({
          energy: Math.min(state.energy + result.data!.energyGain!, 100)
        }));
      }
    }

    // Handle Damage
    if (result.type === 'damage' && result.data?.hpLoss) {
        const newHp = Math.max(0, charStore.hp - result.data.hpLoss);
        useCharacterStore.setState({ hp: newHp });
        
        if (newHp === 0) {
             uiStore.setEventSlides(gameOverSlides);
             uiStore.setCurrentEventId('game_over');
             uiStore.setScreen('event');
        }
    }

    // Handle Unique Logic
    if (result.type === 'unique') {
      if (result.data?.itemId === 'loc_cabin_unlock') {
        worldStore.setFlag('loc_cabin_unlocked', true);
      }
    }
  }

  static explore(locationId: string): ExplorationResult {
    // 1. Load events
    const events: ExplorationEventDefinition[] = explorationEventsData as any; // Cast to avoid strict JSON type issues

    // 2. Filter valid events based on conditions
    const validEvents = events.filter(event => {
      if (event.locations && !event.locations.includes(locationId)) return false;
      if (!event.locations && locationId !== 'driftwatch_woods') return false;

      if (!event.condition) return true;
      
      // Simple condition parsing
      if (event.condition.startsWith('!')) {
        const flagName = event.condition.substring(1);
        return !useWorldStateStore.getState().getFlag(flagName);
      } else {
        return useWorldStateStore.getState().getFlag(event.condition);
      }
    });

    // 3. Calculate total weight
    const totalWeight = validEvents.reduce((sum, event) => sum + event.weight, 0);

    // 4. Roll random number
    const roll = Math.floor(Math.random() * totalWeight);
    console.log(`[ExplorationService] Explored ${locationId} - Roll: ${roll}/${totalWeight}`);

    // 5. Select event
    let currentWeight = 0;
    for (const event of validEvents) {
      currentWeight += event.weight;
      if (roll < currentWeight) {
        // Special handling for dynamic content (like random wolf count)
        if (event.id === 'wolf_pack') {
          return this.generateWolfEncounter(event.result);
        }
        return event.result;
      }
    }

    // Fallback (should not be reached if weights are correct)
    return {
      type: 'nothing',
      title: 'Quiet Woods',
      description: 'You explored for 30 minutes and found nothing interesting.',
      image: '/assets/locations/driftwatch_woods_day.png',
    };
  }

  private static generateWolfEncounter(baseResult: ExplorationResult): ExplorationResult {
      // 60% 1 Wolf, 30% 2 Wolves, 10% 4 Wolves
      const combatRoll = Math.random();
      let wolfCount = 1;
      if (combatRoll > 0.6) wolfCount = 2;
      if (combatRoll > 0.9) wolfCount = 4;

      return {
        ...baseResult,
        description: `You encountered a pack of ${wolfCount} wolf(s)!`,
        data: {
          wolfCount: wolfCount,
          enemies: Array(wolfCount).fill('Forest Wolf'),
        },
      };
  }
}

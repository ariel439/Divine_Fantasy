import { useCharacterStore } from '../stores/useCharacterStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useUIStore } from '../stores/useUIStore';
import { gameOverSlides } from '../data/events';

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
             // Future: invStore.addGold(result.data.quantity || 0);
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
    // 1. Roll d100
    const roll = Math.floor(Math.random() * 100) + 1;
    console.log(`[ExplorationService] Explored ${locationId} - Roll: ${roll}`);

    // 2. Determine Event Category
    // 01-10: Nothing (10%)
    if (roll <= 10) {
      return {
        type: 'nothing',
        title: 'Quiet Woods',
        description: 'You explored for 30 minutes and found nothing interesting.',
        image: '/assets/locations/driftwatch_woods_day.png',
      };
    }

    // 11-25: Fallen Log (Woodcutting) (15%)
    if (roll <= 25) {
      return {
        type: 'unique',
        title: 'Fallen Log',
        description: 'You find a large fallen log blocking the path.',
        image: '/assets/events/event_fallen_log.png',
        data: { eventId: 'fallen_log_event' },
      };
    }

    // 26-40: Wild Apple Tree (Choice Event) (15%)
    if (roll <= 40) {
      return {
        type: 'unique',
        title: 'Wild Apple Tree',
        description: 'You find a wild apple tree heavy with ripe fruit.',
        image: '/assets/events/event_apple_tree.png',
        data: { eventId: 'apple_tree_event' }, // Fixed ID to match Game.tsx
      };
    }

    // 41-50: Abandoned Campsite (Rest or Loot) (10%)
    if (roll <= 50) {
      return {
        type: 'unique',
        title: 'Abandoned Campsite',
        description: 'You stumble upon a small abandoned campsite.',
        image: '/assets/events/event_abandoned_campsite.png',
        data: { eventId: 'abandoned_campsite_event' },
      };
    }

    // 51-60: Hollow Tree Stump (Gamble) (10%)
    if (roll <= 60) {
      return {
        type: 'unique',
        title: 'Hollow Stump',
        description: 'You spot a moss-covered stump with a dark, hollow center.',
        image: '/assets/events/event_hollow_stump.png',
        data: { eventId: 'hollow_stump_event' },
      };
    }

    // 61-85: Combat (Wolves) (25%)
    if (roll <= 85) {
      // 60% 1 Wolf, 30% 2 Wolves, 10% 4 Wolves
      const combatRoll = Math.random();
      let wolfCount = 1;
      if (combatRoll > 0.6) wolfCount = 2;
      if (combatRoll > 0.9) wolfCount = 4;

      return {
        type: 'combat',
        title: 'Wild Wolves',
        description: `You encountered a pack of ${wolfCount} wolf(s)!`,
        image: '/assets/portraits/Wolf.png',
        data: {
          wolfCount: wolfCount,
          enemies: Array(wolfCount).fill('Forest Wolf'),
        },
      };
    }

    // 86-95: Unique (Overgrown Path) (10%)
    if (roll <= 95) {
      if (!useWorldStateStore.getState().getFlag('loc_cabin_unlocked')) {
        return {
          type: 'unique',
          title: 'Overgrown Path',
          description: 'You see a dense thicket of vines blocking an old path.',
          image: '/assets/locations/driftwatch_woods_day.png',
          data: { eventId: 'overgrown_path_event' },
        };
      }
      
      return {
        type: 'nothing',
        title: 'Quiet Woods',
        description: 'You explored for 30 minutes and found nothing interesting.',
        image: '/assets/locations/driftwatch_woods_day.png',
      };
    }

    // 96-100: Nothing (Remaining 5%)
    return {
      type: 'nothing',
      title: 'Quiet Woods',
      description: 'You explored for 30 minutes and found nothing interesting.',
      image: '/assets/locations/driftwatch_woods_day.png',
    };
  }


}

import { useCharacterStore } from '../stores/useCharacterStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';

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
  static explore(locationId: string): ExplorationResult {
    // 1. Roll d100
    const roll = Math.floor(Math.random() * 100) + 1;
    console.log(`[ExplorationService] Explored ${locationId} - Roll: ${roll}`);

    // 2. Determine Event Category
    // 01-20: Nothing
    if (roll <= 20) {
      return {
        type: 'nothing',
        title: 'Quiet Woods',
        description: 'You explored for 30 minutes and found nothing interesting.',
        image: '/assets/locations/driftwatch_woods_day.png',
      };
    }

    // 21-30: Fallen Log (Woodcutting)
    if (roll <= 30) {
      const hasAxe = useInventoryStore.getState().getItemQuantity('axe_basic') > 0;
      if (hasAxe) {
        return {
          type: 'resource',
          title: 'Fallen Log',
          description: 'You found a fallen log and used your axe to chop some wood.',
          image: '/assets/events/event_fallen_log.png',
          data: { itemId: 'log', quantity: Math.floor(Math.random() * 2) + 2 }, // 2-3 logs
        };
      } else {
        return {
          type: 'nothing',
          title: 'Fallen Log',
          description: 'You found a fallen log, but you don\'t have an axe to chop it.',
          image: '/assets/events/event_fallen_log.png',
        };
      }
    }

    // 31-40: Wild Apple Tree (Choice Event)
    if (roll <= 40) {
      return {
        type: 'unique',
        title: 'Wild Apple Tree',
        description: 'You find a wild apple tree heavy with ripe fruit.',
        image: '/assets/events/event_apple_tree.png',
        data: { eventId: 'apple_tree' },
      };
    }

    // 41-45: Abandoned Campsite (Rest or Loot)
    if (roll <= 45) {
      const subRoll = Math.random();
      if (subRoll < 0.5) {
        // Rest
        return {
          type: 'resource', // Using resource for generic positive effect
          title: 'Abandoned Campsite',
          description: 'You found an abandoned campsite and took a quick nap.',
          image: '/assets/events/event_abandoned_campsite.png',
          data: { energyGain: 20 },
        };
      } else {
        // Steal
        return {
          type: 'item',
          title: 'Abandoned Campsite',
          description: 'You scavenged through an abandoned campsite.',
          image: '/assets/events/event_abandoned_campsite.png',
          data: { itemId: 'rope', quantity: 1 }, // Placeholder item
        };
      }
    }

    // 46-50: Hollow Tree Stump (Gamble)
    if (roll <= 50) {
      const subRoll = Math.random();
      if (subRoll < 0.5) {
        // Loot
        return {
          type: 'item',
          title: 'Hollow Stump',
          description: 'You reached into a hollow stump and found something shiny!',
          image: '/assets/events/event_hollow_stump.png',
          data: { itemId: 'coins', quantity: Math.floor(Math.random() * 10) + 5 },
        };
      } else {
        // Poison/Damage
        return {
          type: 'damage',
          title: 'Hollow Stump',
          description: 'You reached into a hollow stump and got bitten by something!',
          image: '/assets/events/event_hollow_stump.png',
          data: { hpLoss: 10 },
        };
      }
    }

    // 51-95: Combat (Wolves)
    if (roll <= 95) {
      // 60% 1 Wolf, 30% 2 Wolves, 10% 4 Wolves
      const combatRoll = Math.random();
      let wolfCount = 1;
      if (combatRoll > 0.6) wolfCount = 2;
      if (combatRoll > 0.9) wolfCount = 4;

      return {
        type: 'combat',
        title: 'Wolf Pack',
        description: `You encountered a pack of ${wolfCount} wolf(s)!`,
        image: '/assets/portraits/Wolf.png',
        data: {
          wolfCount: wolfCount,
          enemies: Array(wolfCount).fill('Forest Wolf'),
        },
      };
    }

    // 96-98: Unique (Overgrown Path)
    if (roll <= 98) {
      if (!useWorldStateStore.getState().getFlag('loc_cabin_unlocked')) {
        return {
          type: 'unique',
          title: 'Overgrown Path',
          description: 'You see a dense thicket of vines blocking an old path.',
          image: '/assets/locations/driftwatch_woods_day.png',
          data: { eventId: 'overgrown_path_event' },
        };
      }
      // If already unlocked, fall through to nothing or maybe reroll? 
      // For now, let's just fall through to the default return (nothing) or treat as nothing found.
       return {
          type: 'nothing',
          title: 'Quiet Woods',
          description: 'You explored for 30 minutes and found nothing interesting.',
          image: '/assets/locations/driftwatch_woods_day.png',
        };
    }

    // 99-100: Unique (Wolf Puppy)
    const worldStore = useWorldStateStore.getState();
    if (worldStore.getFlag('wolf_puppy_resolved')) {
      return {
        type: 'nothing',
        title: 'Quiet Woods',
        description: 'You explored for 30 minutes and found nothing interesting.',
        image: '/assets/locations/driftwatch_woods_day.png',
      };
    }

    return {
      type: 'unique',
      title: 'Whimpering Sound',
      description: 'You hear a whimpering sound coming from a nearby bush...',
      image: '/assets/events/rescue_wolf.png',
      data: { eventId: 'rescue_wolf' }
    };
  }

  static processResult(result: ExplorationResult): void {
    const charStore = useCharacterStore.getState();
    const invStore = useInventoryStore.getState();
    const skillStore = useSkillStore.getState();
    const worldStore = useWorldStateStore.getState();

    // Grant XP for exploration
    skillStore.addXp('exploration', 10); // Assuming 'exploration' skill exists, or use generic

    if (result.type === 'resource' || result.type === 'item') {
      if (result.data?.itemId) {
        // Special case for coins if they are not items but currency
        if (result.data.itemId === 'coins') {
          // Assuming we have a way to add gold, otherwise treat as item
           // invStore.addGold(result.data.quantity || 0); // If exists
        } else {
          invStore.addItem(result.data.itemId, result.data.quantity || 1);
        }
      }
      if (result.data?.energyGain) {
        useCharacterStore.setState((state) => ({
          energy: Math.min(state.energy + result.data!.energyGain!, 100) // Or dynamic max
        }));
      }
    }

    if (result.type === 'damage') {
      if (result.data?.hpLoss) {
        useCharacterStore.setState((state) => ({
          hp: Math.max(0, state.hp - result.data!.hpLoss!)
        }));
      }
    }

    if (result.type === 'unique') {
      if (result.data?.itemId === 'loc_cabin_unlock') {
        worldStore.setFlag('loc_cabin_unlocked', true);
        // Maybe add a diary entry
      }
    }

    // Combat is handled by the UI modal trigger in LocationScreen
  }
}

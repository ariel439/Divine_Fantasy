import { create } from 'zustand';
import { useWorldTimeStore } from './useWorldTimeStore';

interface CharacterState {
  // Core Attributes
  attributes: {
    Strength: number;
    Agility: number;
    Intelligence: number;
    Wisdom: number;
    Charisma: number;
  };
  // Core Vitals
  hp: number;
  energy: number;
  hunger: number;
  // Currency
  currency: {
    copper: number;
    silver: number;
    gold: number;
  };
  // Carry Weight
  maxWeight: number;
  // Actions
  eat: (itemId: string) => void;
  sleep: (bedType: string) => void;
  wait: (hours: number) => void;
  addCurrency: (copper: number, silver?: number, gold?: number) => void;
  removeCurrency: (copper: number, silver?: number, gold?: number) => boolean;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  // Initial state - will be set by GameManagerService on new game
  attributes: {
    Strength: 1,
    Agility: 1,
    Intelligence: 1,
    Wisdom: 1,
    Charisma: 1,
  },
  hp: 100,
  energy: 100,
  hunger: 0,
  currency: {
    copper: 0,
    silver: 0,
    gold: 0,
  },
  maxWeight: 50,
  eat: (itemId) => {
    // Load item data (simplified - in real implementation, load from items.json)
    const itemEffects: Record<string, any> = {
      'bread': { hunger: -20 },
      'cheese': { hunger: -15 },
      'fish_sardine': { hunger: -5 },
      'fish_trout': { hunger: -10 },
      'fish_pike': { hunger: -20 },
      'food_sardine_grilled': { hunger: -15 },
      'food_trout_grilled': { hunger: -30 },
      'food_pike_grilled': { hunger: -60 },
      'ale': { energy: 10 }
    };

    const effect = itemEffects[itemId];
    if (effect) {
      set((state) => ({
        hunger: Math.max(0, state.hunger + (effect.hunger || 0)),
        energy: Math.min(100, state.energy + (effect.energy || 0))
      }));
      // Pass 5 minutes eating
      useWorldTimeStore.getState().passTime(5);
    }
  },
  sleep: (bedType) => {
    const bedMultipliers: Record<string, number> = {
      'free': 0.5, // Poor sleep quality
      'inn': 1.0,  // Normal sleep
      'home': 1.2  // Good sleep
    };

    const multiplier = bedMultipliers[bedType] || 1.0;
    const hours = bedType === 'free' ? 8 : 8; // All sleep is 8 hours for now

    set((state) => ({
      hp: Math.min(100, state.hp + (20 * multiplier)),
      energy: Math.min(100, state.energy + (50 * multiplier))
    }));

    // Pass time for sleep
    useWorldTimeStore.getState().passTime(hours * 60);
  },
  wait: (hours) => {
    useWorldTimeStore.getState().passTime(hours * 60);
  },
  addCurrency: (copper, silver = 0, gold = 0) => {
    set((state) => ({
      currency: {
        copper: state.currency.copper + copper + (silver * 100) + (gold * 10000),
        silver: state.currency.silver,
        gold: state.currency.gold
      }
    }));
  },
  removeCurrency: (copper, silver = 0, gold = 0) => {
    const totalCopper = copper + (silver * 100) + (gold * 10000);
    const state = get();
    if (state.currency.copper >= totalCopper) {
      set((state) => ({
        currency: {
          copper: state.currency.copper - totalCopper,
          silver: state.currency.silver,
          gold: state.currency.gold
        }
      }));
      return true;
    }
    return false;
  },
}));

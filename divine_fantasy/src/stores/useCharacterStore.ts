import { create } from 'zustand';

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
  eat: (item: any) => void;
  sleep: (bedType: string) => void;
  wait: (hours: number) => void;
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
  eat: (item) => {
    // TODO: Implement eat logic
    console.log('Eating item:', item);
  },
  sleep: (bedType) => {
    // TODO: Implement sleep logic
    console.log('Sleeping in:', bedType);
  },
  wait: (hours) => {
    // TODO: Implement wait logic
    console.log('Waiting for hours:', hours);
  },
}));

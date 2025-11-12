import { create } from 'zustand';

interface Companion {
  id: string;
  name: string;
  type: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
  };
  equippedItems: string[]; // item IDs
}

interface CompanionState {
  activeCompanion: Companion | null;
  // Actions
  setCompanion: (companion: Companion | null) => void;
  updateCompanionStats: (updates: Partial<Companion['stats']>) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (itemId: string) => void;
}

export const useCompanionStore = create<CompanionState>((set, get) => ({
  activeCompanion: null,
  setCompanion: (companion) => {
    set({ activeCompanion: companion });
  },
  updateCompanionStats: (updates) => {
    set((state) => ({
      activeCompanion: state.activeCompanion ? {
        ...state.activeCompanion,
        stats: {
          ...state.activeCompanion.stats,
          ...updates,
        },
      } : null,
    }));
  },
  equipItem: (itemId) => {
    set((state) => ({
      activeCompanion: state.activeCompanion ? {
        ...state.activeCompanion,
        equippedItems: [...state.activeCompanion.equippedItems, itemId],
      } : null,
    }));
  },
  unequipItem: (itemId) => {
    set((state) => ({
      activeCompanion: state.activeCompanion ? {
        ...state.activeCompanion,
        equippedItems: state.activeCompanion.equippedItems.filter(id => id !== itemId),
      } : null,
    }));
  },
}));

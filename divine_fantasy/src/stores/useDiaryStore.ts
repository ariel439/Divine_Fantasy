import { create } from 'zustand';

interface Relationship {
  friendship: number;
  love?: number;
  fear?: number;
  obedience?: number;
}

interface DiaryState {
  relationships: Record<string, Relationship>;
  interactionHistory: string[];
  // Actions
  updateRelationship: (npcId: string, changes: Partial<Relationship>) => void;
  addInteraction: (interaction: string) => void;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  relationships: {},
  interactionHistory: [],
  updateRelationship: (npcId, changes) => {
    set((state) => ({
      relationships: {
        ...state.relationships,
        [npcId]: {
          ...state.relationships[npcId],
          ...changes,
        },
      },
    }));
  },
  addInteraction: (interaction) => {
    set((state) => ({
      interactionHistory: [...state.interactionHistory, interaction],
    }));
  },
}));

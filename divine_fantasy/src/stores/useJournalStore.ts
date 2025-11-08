import { create } from 'zustand';

interface Quest {
  id: string;
  title: string;
  description: string;
  stages: any[]; // TODO: Define proper stage interface
  rewards: any; // TODO: Define proper rewards interface
  completed: boolean;
  active: boolean;
}

interface JournalState {
  quests: Record<string, Quest>;
  // Actions
  addQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  completeQuest: (questId: string) => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  quests: {},
  addQuest: (quest) => {
    set((state) => ({
      quests: {
        ...state.quests,
        [quest.id]: quest,
      },
    }));
  },
  updateQuest: (questId, updates) => {
    set((state) => ({
      quests: {
        ...state.quests,
        [questId]: {
          ...state.quests[questId],
          ...updates,
        },
      },
    }));
  },
  completeQuest: (questId) => {
    set((state) => ({
      quests: {
        ...state.quests,
        [questId]: {
          ...state.quests[questId],
          completed: true,
          active: false,
        },
      },
    }));
  },
}));

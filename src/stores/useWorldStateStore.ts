import { create } from 'zustand';

interface WorldState {
  worldFlags: Record<string, boolean>;
  eventCooldowns: Record<string, number>;
  knownNpcs: string[];
  introMode: boolean;
  introCompleted: boolean;
  tutorialStep: number;
  seenRoomTutorial: boolean;
  seenLeoTutorial: boolean;
  setFlag: (flag: string, value: boolean) => void;
  getFlag: (flag: string) => boolean;
  setCooldown: (event: string, timestamp: number) => void;
  isOnCooldown: (event: string) => boolean;
  addKnownNpc: (npcId: string) => void;
  setIntroMode: (value: boolean) => void;
  setIntroCompleted: (value: boolean) => void;
  setTutorialStep: (step: number) => void;
  setSeenRoomTutorial: (value: boolean) => void;
  setSeenLeoTutorial: (value: boolean) => void;
}

export const useWorldStateStore = create<WorldState>((set, get) => ({
  worldFlags: {},
  eventCooldowns: {},
  knownNpcs: [],
  introMode: false,
  introCompleted: false,
  tutorialStep: 0,
  seenRoomTutorial: false,
  seenLeoTutorial: false,
  setFlag: (flag, value) => {
    set((state) => ({
      worldFlags: {
        ...state.worldFlags,
        [flag]: value,
      },
    }));
  },
  getFlag: (flag) => {
    return get().worldFlags[flag] || false;
  },
  setCooldown: (event, timestamp) => {
    set((state) => ({
      eventCooldowns: {
        ...state.eventCooldowns,
        [event]: timestamp,
      },
    }));
  },
  isOnCooldown: (event) => {
    const cooldown = get().eventCooldowns[event];
    return cooldown ? Date.now() < cooldown : false;
  },
  addKnownNpc: (npcId) => {
    set((state) => {
      if (!state.knownNpcs.includes(npcId)) {
        return {
          knownNpcs: [...state.knownNpcs, npcId],
        };
      }
      return {};
    });
  },
  setIntroMode: (value) => {
    set({ introMode: value });
  },
  setIntroCompleted: (value) => {
    set({ introCompleted: value });
  },
  setTutorialStep: (step) => {
    set({ tutorialStep: step });
  },
  setSeenRoomTutorial: (value) => {
    set({ seenRoomTutorial: value });
  },
  setSeenLeoTutorial: (value) => {
    set({ seenLeoTutorial: value });
  },
}));

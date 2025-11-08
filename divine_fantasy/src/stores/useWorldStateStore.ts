import { create } from 'zustand';

interface WorldState {
  worldFlags: Record<string, boolean>;
  eventCooldowns: Record<string, number>; // timestamp
  // Actions
  setFlag: (flag: string, value: boolean) => void;
  getFlag: (flag: string) => boolean;
  setCooldown: (event: string, timestamp: number) => void;
  isOnCooldown: (event: string) => boolean;
}

export const useWorldStateStore = create<WorldState>((set, get) => ({
  worldFlags: {},
  eventCooldowns: {},
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
}));

import { create } from 'zustand';

interface WorldTimeState {
  day: number;
  hour: number;
  minute: number;
  clockPaused: boolean;
  // Actions
  passTime: (minutes: number) => void;
  getFormattedTime: () => string;
  getFormattedDate: () => string;
  setClockPaused: (paused: boolean) => void;
}

export const useWorldTimeStore = create<WorldTimeState>((set, get) => ({
  day: 1,
  hour: 8,
  minute: 0,
  clockPaused: false,
  passTime: (minutes) => {
    set((state) => {
      let newMinute = state.minute + minutes;
      let newHour = state.hour;
      let newDay = state.day;

      while (newMinute >= 60) {
        newMinute -= 60;
        newHour += 1;
      }

      while (newHour >= 24) {
        newHour -= 24;
        newDay += 1;
      }

      return {
        day: newDay,
        hour: newHour,
        minute: newMinute,
      };
    });
  },
  setClockPaused: (paused: boolean) => set({ clockPaused: paused }),
  getFormattedTime: () => {
    const { hour, minute } = get();
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  },
  getFormattedDate: () => {
    const { day } = get();
    return `Day ${day}`;
  },
}));

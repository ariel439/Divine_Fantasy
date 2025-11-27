import { create } from 'zustand';
import { useWorldStateStore } from './useWorldStateStore';

type Weather = 'Sunny' | 'Cloudy' | 'Rainy' | 'Snowy';
type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

interface WorldTimeState {
  day: number;
  hour: number;
  minute: number;
  clockPaused: boolean;
  weather: Weather;
  season: Season;
  // Actions
  passTime: (minutes: number) => void;
  getFormattedTime: () => string;
  getFormattedDate: () => string;
  setClockPaused: (paused: boolean) => void;
  updateEnvironment: () => void;
  getSeason: () => Season;
  getWeather: () => Weather;
}

export const useWorldTimeStore = create<WorldTimeState>((set, get) => ({
  day: 1,
  hour: 8,
  minute: 0,
  clockPaused: false,
  weather: 'Sunny',
  season: 'Spring',
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
    get().updateEnvironment();
  },
  setClockPaused: (paused: boolean) => set({ clockPaused: paused }),
  getFormattedTime: () => {
    const { hour, minute } = get();
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  },
  getFormattedDate: () => {
    const intro = useWorldStateStore.getState().introMode;
    if (intro) return '12 August 773';
    return '3 May 780';
  },
  updateEnvironment: () => {
    set((state) => {
      const { day, minute } = state;
      const seasonIndex = Math.floor((day - 1) / 30) % 4;
      const newSeason = ['Spring', 'Summer', 'Autumn', 'Winter'][seasonIndex] as Season;

      const weatherCycle: Weather[] = ['Sunny', 'Cloudy', 'Rainy', 'Snowy'];
      const weatherIndex = Math.floor((minute / 15) % weatherCycle.length);
      const newWeather = weatherCycle[weatherIndex];

      return { season: newSeason, weather: newWeather };
    });
  },
  getSeason: () => {
    const { day } = get();
    const seasonIndex = Math.floor((day - 1) / 30) % 4;
    return ['Spring', 'Summer', 'Autumn', 'Winter'][seasonIndex] as Season;
  },
  getWeather: () => {
    const { minute } = get();
    const weatherCycle: Weather[] = ['Sunny', 'Cloudy', 'Rainy', 'Snowy'];
    const weatherIndex = Math.floor((minute / 15) % weatherCycle.length);
    return weatherCycle[weatherIndex];
  },
}));

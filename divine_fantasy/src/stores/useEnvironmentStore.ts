import { create } from 'zustand';

type Weather = 'clear' | 'rainy' | 'stormy' | 'snowy';
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface EnvironmentState {
  weather: Weather;
  season: Season;
  // Actions
  setWeather: (weather: Weather) => void;
  setSeason: (season: Season) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  weather: 'clear',
  season: 'spring',
  setWeather: (weather) => {
    set({ weather });
  },
  setSeason: (season) => {
    set({ season });
  },
}));

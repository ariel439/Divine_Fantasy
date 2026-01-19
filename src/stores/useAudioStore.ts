import { create } from 'zustand';

interface AudioState {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  weatherEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  weatherVolume: number;
  // Actions
  toggleMusic: () => void;
  toggleSFX: () => void;
  toggleWeather: () => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSFXEnabled: (enabled: boolean) => void;
  setWeatherEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setSFXVolume: (volume: number) => void;
  setWeatherVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  musicEnabled: false,
  sfxEnabled: false,
  weatherEnabled: false,
  musicVolume: 0.5, // Default 0.5
  sfxVolume: 0.5, // Default 0.5
  weatherVolume: 0.5, // Default 0.5
  toggleMusic: () => {
    set((state) => ({ musicEnabled: !state.musicEnabled }));
  },
  toggleSFX: () => {
    set((state) => ({ sfxEnabled: !state.sfxEnabled }));
  },
  toggleWeather: () => {
    set((state) => ({ weatherEnabled: !state.weatherEnabled }));
  },
  setMusicEnabled: (enabled) => {
    set({ musicEnabled: enabled });
  },
  setSFXEnabled: (enabled) => {
    set({ sfxEnabled: enabled });
  },
  setWeatherEnabled: (enabled) => {
    set({ weatherEnabled: enabled });
  },
  setMusicVolume: (volume) => {
    set({ musicVolume: volume });
  },
  setSFXVolume: (volume) => {
    set({ sfxVolume: volume });
  },
  setWeatherVolume: (volume) => {
    set({ weatherVolume: volume });
  },
}));

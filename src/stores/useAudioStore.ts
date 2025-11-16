import { create } from 'zustand';

interface AudioState {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  // Actions
  toggleMusic: () => void;
  toggleSFX: () => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSFXEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setSFXVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  musicEnabled: false,
  sfxEnabled: false,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  toggleMusic: () => {
    set((state) => ({ musicEnabled: !state.musicEnabled }));
  },
  toggleSFX: () => {
    set((state) => ({ sfxEnabled: !state.sfxEnabled }));
  },
  setMusicEnabled: (enabled) => {
    set({ musicEnabled: enabled });
  },
  setSFXEnabled: (enabled) => {
    set({ sfxEnabled: enabled });
  },
  setMusicVolume: (volume) => {
    set({ musicVolume: volume });
  },
  setSFXVolume: (volume) => {
    set({ sfxVolume: volume });
  },
}));

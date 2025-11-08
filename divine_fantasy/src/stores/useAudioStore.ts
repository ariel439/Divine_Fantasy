import { create } from 'zustand';

interface AudioState {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  // Actions
  toggleMusic: () => void;
  toggleSFX: () => void;
  setMusicVolume: (volume: number) => void;
  setSFXVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  toggleMusic: () => {
    set((state) => ({ musicEnabled: !state.musicEnabled }));
  },
  toggleSFX: () => {
    set((state) => ({ sfxEnabled: !state.sfxEnabled }));
  },
  setMusicVolume: (volume) => {
    set({ musicVolume: volume });
  },
  setSFXVolume: (volume) => {
    set({ sfxVolume: volume });
  },
}));

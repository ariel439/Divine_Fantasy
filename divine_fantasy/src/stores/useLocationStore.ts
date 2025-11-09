import { create } from 'zustand';
import locations from '../data/locations.json';

interface Location {
  id: string;
  name: string;
  description: string;
  background: string;
  music_track: string;
  actions: Array<{
    text: string;
    type: string;
    target: string;
    condition?: string;
  }>;
}

interface LocationState {
  currentLocationId: string;
  // Actions
  setLocation: (locationId: string) => void;
  getCurrentLocation: () => Location;
  getLocation: (locationId: string) => Location | null;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocationId: 'driftwatch_docks', // Starting location
  setLocation: (locationId) => {
    set({ currentLocationId: locationId });
  },
  getCurrentLocation: () => {
    const { currentLocationId } = get();
    return get().getLocation(currentLocationId)!;
  },
  getLocation: (locationId) => {
    const locationData = locations[locationId as keyof typeof locations];
    if (!locationData) return null;

    const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6; // Simple night check
    const description = isNight ? locationData.night_description : locationData.day_description;
    const background = isNight ? locationData.night_background : locationData.day_background;

    return {
      id: locationId,
      name: locationData.name,
      description,
      background,
      music_track: locationData.music_track,
      actions: locationData.actions,
    };
  },
}));

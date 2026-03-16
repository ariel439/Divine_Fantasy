import { create } from 'zustand';
import locations from '../data/locations.json';
import { useWorldTimeStore } from './useWorldTimeStore';
import { useJournalStore } from './useJournalStore';
import { useWorldStateStore } from './useWorldStateStore'; // Import useWorldStateStore

interface Location {
  id: string;
  name: string;
  description: string;
  background: string;
  music_track: string;
  is_indoor?: boolean;
  day_background?: string; // Make optional
  night_background?: string; // Make optional
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
  currentLocationId: 'driftwatch', // Starting location at central hub
  setLocation: (locationId) => {
    set({ currentLocationId: locationId });
  },
  getCurrentLocation: () => {
    const { currentLocationId } = get();
    return get().getLocation(currentLocationId)!;
  },
  getLocation: (locationId) => {
    const locationData: any = locations[locationId as keyof typeof locations] as any;
    if (!locationData) return null;

    // The component using this should handle reactivity for description/background
    // based on time and flags.
    return {
      id: locationId,
      name: locationData.name,
      description: locationData.day_description, // Default
      background: locationData.day_background || locationData.background || '',
      music_track: locationData.music_track,
      is_indoor: locationData.is_indoor || false,
      actions: locationData.actions,
    };
  },
}));

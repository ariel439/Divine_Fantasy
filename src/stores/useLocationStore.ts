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

    // Use in-game clock instead of system time
    const { hour } = useWorldTimeStore.getState();
    const isNight = hour >= 18 || hour < 6;
    const description = isNight ? locationData.night_description : locationData.day_description;
    let background = '';

    if (locationId === 'tide_trade') {
      const isWallRepaired = useWorldStateStore.getState().worldFlags['tide_trade_wall_repaired'];
      if (isWallRepaired) {
        background = '/assets/locations/tide_trade_repaired.png';
      } else {
        background = '/assets/locations/tide_trade.png';
      }
    } else if (locationData.is_indoor) {
      background = isNight && locationData.night_background
        ? locationData.night_background
        : (locationData.day_background || '');
    } else {
      background = (isNight ? locationData.night_background : locationData.day_background) || '';
    }

    return {
      id: locationId,
      name: locationData.name,
      description,
      background,
      music_track: locationData.music_track,
      is_indoor: locationData.is_indoor || false,
      actions: locationData.actions,
    };
  },
}));

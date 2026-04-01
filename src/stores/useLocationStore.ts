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
    const world = useWorldStateStore.getState();

    const isTideTradeUpgraded = locationId === 'tide_trade' && world.getFlag('tide_trade_upgraded');
    const isTideTradeRepaired = locationId === 'tide_trade' && world.getFlag('tide_trade_wall_repaired');
    const description = isTideTradeUpgraded
      ? 'Tide & Trade finally looks set right. The patched walls hold firm, the counter is sturdier, and the whole place feels more inviting than it did before.'
      : isTideTradeRepaired
      ? 'The storm damage is gone now. Tide & Trade still looks humble, but the repaired wall and steadier room make it feel less one bad tide from collapse.'
      : locationData.day_description;
    const background = isTideTradeUpgraded
      ? '/assets/locations/tide_trade_upgraded.png'
      : isTideTradeRepaired
      ? '/assets/locations/tide_trade_repaired.png'
      : (locationData.day_background || locationData.background || '');

    // The component using this should handle reactivity for description/background
    // based on time and flags.
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

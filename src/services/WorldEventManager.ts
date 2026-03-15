// src/services/WorldEventManager.ts
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useToastStore } from '../stores/useToastStore';
import locationsData from '../data/locations.json';

export class WorldEventManager {
  private static lastCheckedHour: number = -1;
  private static lastWeather: string = '';
  private static isInitialState: boolean = true;

  static init() {
    this.isInitialState = true; // Reset on init
    // Subscribe to time changes
    useWorldTimeStore.subscribe((state) => {
      this.checkAll(state);
    });
  }

  private static checkAll(timeState: any) {
    const worldState = useWorldStateStore.getState();
    const introMode = worldState.introMode;

    // 1. Weather Toasts
    this.checkWeather(timeState);

    // 2. Shop Closing Logic (Firewalled for Intro)
    if (!introMode) {
      this.checkShopClosing(timeState);
    }
  }

  private static checkWeather(timeState: any) {
    const weather = timeState.getWeather();

    // If it's the very first weather state we've seen, just record it and exit.
    if (this.isInitialState) {
      this.lastWeather = weather;
      this.isInitialState = false;
      return;
    }

    if (weather !== this.lastWeather) {
      const introMode = useWorldStateStore.getState().introMode;
      
      // Don't toast during intro
      if (!introMode) { 
        const toastStore = useToastStore.getState();
        const isNight = timeState.hour >= 18 || timeState.hour < 6;
        
        let message = '';
        let type: 'info' | 'success' | 'warning' | 'error' = 'info';

        // Logic for when weather *stops* being rainy
        if (this.lastWeather === 'Rainy' && weather !== 'Rainy') {
            message = isNight ? "The rain stops, leaving a clear night sky." : "The rain has stopped.";
            type = 'success';
        } else {
            switch (weather) {
              case 'Sunny':
                message = isNight ? "The clouds clear, revealing a starry sky." : "The sun breaks through the clouds.";
                type = 'success';
                break;
              case 'Cloudy':
                message = "Clouds begin to gather overhead.";
                type = 'info';
                break;
              case 'Rainy':
                message = "It starts to rain.";
                type = 'warning';
                break;
              case 'Snowy':
                message = "Snow begins to fall softly.";
                type = 'info';
                break;
            }
        }

        if (message) {
          toastStore.addToast(message, type);
        }
      }
      this.lastWeather = weather;
    }
  }

  private static checkShopClosing(timeState: any) {
    // Only check once per game hour to avoid spamming
    if (timeState.hour === this.lastCheckedHour) return;
    this.lastCheckedHour = timeState.hour;

    const locationStore = useLocationStore.getState();
    const currentLocationId = locationStore.currentLocationId;
    const locationData = (locationsData as any)[currentLocationId];

    if (!locationData || !locationData.is_indoor) return;

    const { opening_hour, closing_hour, exit_location } = locationData;

    // If no hours defined, it's 24/7
    if (opening_hour === undefined || closing_hour === undefined) return;

    const currentHour = timeState.hour;
    const isClosed = opening_hour <= closing_hour
      ? (currentHour < opening_hour || currentHour >= closing_hour)
      : (currentHour >= closing_hour && currentHour < opening_hour);

    if (isClosed) {
      const toastStore = useToastStore.getState();
      toastStore.addToast(`${locationData.name} is closing.`, 'warning');
      
      const targetExit = exit_location || 'driftwatch_main_street';
      locationStore.setLocation(targetExit);
    }
  }
}

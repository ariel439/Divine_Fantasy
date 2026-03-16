// src/services/WorldEventManager.ts
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useToastStore } from '../stores/useToastStore';
import { LocationService } from './LocationService';
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

  static reset() {
    this.isInitialState = true;
    this.lastWeather = '';
    this.lastCheckedHour = -1;
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

    if (!LocationService.isLocationOpen(currentLocationId)) {
      const locationName = LocationService.getLocationName(currentLocationId);
      const toastStore = useToastStore.getState();
      toastStore.addToast(`${locationName} is closing.`, 'warning');
      
      const targetExit = LocationService.getExitLocation(currentLocationId);
      locationStore.setLocation(targetExit);
    }
  }
}

// src/services/LocationService.ts
import locationsData from '../data/locations.json';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';

export class LocationService {
  /**
   * Checks if a specific location is currently open based on its business hours.
   * Respects introMode firewall (shops are always open during the tutorial).
   */
  static isLocationOpen(locationId: string): boolean {
    const worldState = useWorldStateStore.getState();
    const timeStore = useWorldTimeStore.getState();
    const { introMode, hour } = { introMode: worldState.introMode, hour: timeStore.hour };

    // Firewall: Everything is open during the tutorial (Intro) to prevent soft-locks.
    if (introMode) return true;

    const location = (locationsData as any)[locationId];
    if (!location) return true;

    // Special Rule: Lighthouse for Adults
    if (locationId === 'leo_lighthouse') {
      // Adults are only allowed in during the day (7 AM to 6 PM)
      return hour >= 7 && hour < 18;
    }

    // Default Rule: Check opening/closing hours
    const { opening_hour, closing_hour } = location;
    if (opening_hour === undefined || closing_hour === undefined) {
      return true; // 24/7 or not a shop
    }

    // Handle standard and overnight closing hours
    if (opening_hour <= closing_hour) {
      return hour >= opening_hour && hour < closing_hour;
    } else {
      // Overnight (e.g., opens 22:00, closes 04:00)
      return hour >= opening_hour || hour < closing_hour;
    }
  }

  /**
   * Returns the exit location for a given place.
   * Defaults to 'driftwatch_main_street' if no explicit exit is defined.
   */
  static getExitLocation(locationId: string): string {
    const location = (locationsData as any)[locationId];
    return location?.exit_location || 'driftwatch_main_street';
  }

  /**
   * Gets the display name of a location.
   */
  static getLocationName(locationId: string): string {
    const location = (locationsData as any)[locationId];
    return location?.name || 'Unknown Location';
  }
}

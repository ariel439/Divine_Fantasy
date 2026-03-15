// src/services/NPCService.ts
import npcsData from '../data/npcs.json';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';

export interface DynamicNPCAction {
  id: string;
  name: string;
  type: 'dialogue';
  target: string;
  text: string;
}

export class NPCService {
  /**
   * Returns a list of NPCs currently at a specific location based on their schedules.
   * Respects introMode firewall.
   */
  static getPresentNPCs(locationId: string): DynamicNPCAction[] {
    const worldState = useWorldStateStore.getState();
    const timeStore = useWorldTimeStore.getState();
    const { introMode, hour } = { introMode: worldState.introMode, hour: timeStore.hour };

    // Firewall: Dynamic schedules are disabled during the intro tutorial.
    if (introMode) return [];

    return Object.entries(npcsData)
      .filter(([id, npc]) => {
        const schedules = (npc as any).schedules;
        if (!schedules) return false;

        const currentSchedule = schedules.find((s: any) => {
          if (s.location_id !== locationId) return false;
          
          // Handle standard and overnight schedules
          if (s.start_hour <= s.end_hour) {
            return hour >= s.start_hour && hour < s.end_hour;
          } else {
            // Overnight schedule (e.g., 22:00 - 04:00)
            return hour >= s.start_hour || hour < s.end_hour;
          }
        });

        return !!currentSchedule;
      })
      .map(([id, npc]) => ({
        id,
        name: npc.name,
        type: 'dialogue',
        target: id,
        text: `Talk to ${npc.name}`
      }));
  }
}

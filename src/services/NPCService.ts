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
    const { introMode, hour, month, dayOfMonth } = {
      introMode: worldState.introMode,
      hour: timeStore.hour,
      month: timeStore.month,
      dayOfMonth: timeStore.dayOfMonth,
    };

    // Firewall: Dynamic schedules are disabled during the intro tutorial.
    if (introMode) return [];

    return Object.entries(npcsData)
      .filter(([id, npc]) => {
        const requiredFlag = (npc as any).required_flag;
        const hiddenFlag = (npc as any).hidden_if_flag;
        if (requiredFlag && !worldState.getFlag(requiredFlag)) return false;
        if (hiddenFlag && worldState.getFlag(hiddenFlag)) return false;

        const availableFrom = (npc as any).available_from;
        const availableUntil = (npc as any).available_until;
        const currentDayOfYear = ((month - 1) * 30) + dayOfMonth;
        if (availableFrom) {
          const fromDayOfYear = (((availableFrom.month ?? 1) - 1) * 30) + (availableFrom.dayOfMonth ?? 1);
          if (currentDayOfYear < fromDayOfYear) return false;
        }
        if (availableUntil) {
          const untilDayOfYear = (((availableUntil.month ?? 12) - 1) * 30) + (availableUntil.dayOfMonth ?? 30);
          if (currentDayOfYear > untilDayOfYear) return false;
        }

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

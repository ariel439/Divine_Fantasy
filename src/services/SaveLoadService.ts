// SaveLoadService.ts
// Handles saving and loading game state for web platform

import { useCharacterStore } from '../stores/useCharacterStore';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useJournalStore } from '../stores/useJournalStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useCompanionStore } from '../stores/useCompanionStore';
import { useJobStore } from '../stores/useJobStore';
import { useRoomStore } from '../stores/useRoomStore';
import { useShopStore } from '../stores/useShopStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useUIStore } from '../stores/useUIStore';

export interface GameSaveData {
  version: string;
  timestamp: string;
  saveName: string;
  screenshotUrl?: string;
  character: any;
  diary: any;
  inventory: any;
  journal: any;
  skills: any;
  worldTime: any;
  worldState: any;
  companion: any;
  jobs: any;
  rooms: any;
  shops: any;
  location: any;
}

export interface SaveSlotMetadata {
  id: string; // 'autosave' or 'slot_1', 'slot_2', etc.
  timestamp: string;
  saveName: string;
  isEmpty: boolean;
  screenshotUrl?: string;
}

export class SaveLoadService {
  private static readonly SAVE_VERSION = '1.0';
  private static readonly STORAGE_PREFIX = 'divine_fantasy_save_';

  private static collectGameState(saveName: string): GameSaveData {
    const currentLocation = useLocationStore.getState().getCurrentLocation();
    
    return {
      version: this.SAVE_VERSION,
      timestamp: new Date().toISOString(),
      saveName,
      screenshotUrl: currentLocation?.background,
      character: useCharacterStore.getState(),
      diary: useDiaryStore.getState(),
      inventory: useInventoryStore.getState(),
      journal: useJournalStore.getState(),
      skills: useSkillStore.getState(),
      worldTime: useWorldTimeStore.getState(),
      worldState: useWorldStateStore.getState(),
      companion: useCompanionStore.getState(),
      jobs: useJobStore.getState(),
      rooms: useRoomStore.getState(),
      shops: useShopStore.getState(),
      location: useLocationStore.getState(),
    };
  }

  private static restoreGameState(data: GameSaveData) {
    // Version check could go here

    // Load data into stores
    useCharacterStore.setState(data.character);
    useDiaryStore.setState(data.diary);
    useInventoryStore.setState(data.inventory);
    useJournalStore.setState(data.journal);
    useSkillStore.setState(data.skills);
    useWorldTimeStore.setState(data.worldTime);
    useWorldStateStore.setState(data.worldState);
    useCompanionStore.setState(data.companion);
    useJobStore.setState(data.jobs);
    useRoomStore.setState(data.rooms);
    useShopStore.setState(data.shops);
    useLocationStore.setState(data.location);

    // Force UI updates if needed
    // e.g. set current screen to inGame to ensure we don't get stuck in main menu
    useUIStore.getState().setScreen('inGame');
    
    console.log('Game loaded successfully from:', data.timestamp);
  }

  static getSlots(): SaveSlotMetadata[] {
    const slots: SaveSlotMetadata[] = [];
    
    // Autosave slot
    const autosaveJson = localStorage.getItem(`${this.STORAGE_PREFIX}autosave`);
    if (autosaveJson) {
      try {
        const data = JSON.parse(autosaveJson) as GameSaveData;
        slots.push({
          id: 'autosave',
          timestamp: data.timestamp,
          saveName: 'Autosave',
          isEmpty: false,
          screenshotUrl: data.screenshotUrl
        });
      } catch (e) {
        slots.push({ id: 'autosave', timestamp: '', saveName: 'Autosave', isEmpty: true });
      }
    } else {
      slots.push({ id: 'autosave', timestamp: '', saveName: 'Autosave', isEmpty: true });
    }

    // Regular slots 1-5
    for (let i = 1; i <= 5; i++) {
      const id = `slot_${i}`;
      const json = localStorage.getItem(`${this.STORAGE_PREFIX}${id}`);
      if (json) {
        try {
          const data = JSON.parse(json) as GameSaveData;
          slots.push({
            id,
            timestamp: data.timestamp,
            saveName: data.saveName || `Save Slot ${i}`,
            isEmpty: false,
            screenshotUrl: data.screenshotUrl
          });
        } catch (e) {
          slots.push({ id, timestamp: '', saveName: `Save Slot ${i}`, isEmpty: true });
        }
      } else {
        slots.push({ id, timestamp: '', saveName: `Save Slot ${i}`, isEmpty: true });
      }
    }
    return slots;
  }

  static saveToSlot(slotId: string, saveName: string): void {
    try {
      const data = this.collectGameState(saveName);
      localStorage.setItem(`${this.STORAGE_PREFIX}${slotId}`, JSON.stringify(data));
      console.log(`Saved to slot ${slotId}`);
    } catch (e) {
      console.error('Failed to save game:', e);
      alert('Failed to save game. Local storage might be full.');
    }
  }

  static loadFromSlot(slotId: string): boolean {
    try {
      const json = localStorage.getItem(`${this.STORAGE_PREFIX}${slotId}`);
      if (!json) return false;
      const data = JSON.parse(json) as GameSaveData;
      this.restoreGameState(data);
      return true;
    } catch (e) {
      console.error('Failed to load game:', e);
      return false;
    }
  }

  static deleteSlot(slotId: string): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}${slotId}`);
  }

  // File Export/Import (Keep existing functionality but updated)
  static exportSaveData(saveName: string = 'save'): void {
    console.log('Exporting save...');
    const saveData = this.collectGameState(saveName);
    const jsonString = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `divine_fantasy_${saveName}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  static importSaveData(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const saveData: GameSaveData = JSON.parse(event.target?.result as string);
          if (saveData.version !== this.SAVE_VERSION) {
            console.warn('Save file version mismatch. Attempting to load anyway...');
          }
          this.restoreGameState(saveData);
          resolve();
        } catch (error) {
          console.error('Failed to load save file:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

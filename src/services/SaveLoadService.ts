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
  private static readonly SAVE_VERSION = '1.1';
  private static readonly STORAGE_PREFIX = 'divine_fantasy_save_';

  private static migrate(data: any): GameSaveData {
    const version = data.version || '1.0';

    if (version === '1.0') {
      // Example migration: If a field was renamed
      // if (data.character && data.character.oldField) {
      //   data.character.newField = data.character.oldField;
      //   delete data.character.oldField;
      // }
      console.log('Migrating save data from v1.0 to v1.1');
    }

    // Always update to the latest version after migration steps
    data.version = this.SAVE_VERSION;
    return data as GameSaveData;
  }

  private static collectGameState(saveName: string): GameSaveData {
    const { getState: getCharacterState } = useCharacterStore;
    const { getState: getDiaryState } = useDiaryStore;
    const { getState: getInventoryState } = useInventoryStore;
    const { getState: getJournalState } = useJournalStore;
    const { getState: getSkillState } = useSkillStore;
    const { getState: getWorldTimeState } = useWorldTimeStore;
    const { getState: getWorldState } = useWorldStateStore;
    const { getState: getCompanionState } = useCompanionStore;
    const { getState: getJobState } = useJobStore;
    const { getState: getRoomState } = useRoomStore;
    const { getState: getShopState } = useShopStore;
    const { getState: getLocationState } = useLocationStore;

    // Sanitize data by picking only what's necessary
    const character = { ...getCharacterState() };
    // Remove non-serializable or transient state if any, e.g. functions
    // delete (character as any).someFunction;

    return {
      version: this.SAVE_VERSION,
      timestamp: new Date().toISOString(),
      saveName,
      screenshotUrl: getLocationState().getCurrentLocation()?.background,
      character,
      diary: getDiaryState(),
      inventory: getInventoryState(),
      journal: getJournalState(),
      skills: getSkillState(),
      worldTime: getWorldTimeState(),
      worldState: getWorldState(),
      companion: getCompanionState(),
      jobs: getJobState(),
      rooms: getRoomState(),
      shops: getShopState(),
      location: {
        currentLocationId: getLocationState().currentLocationId,
      },
    };
  }

  private static restoreGameState(data: GameSaveData) {
    const migratedData = this.migrate(data);

    // Load data into stores
    useCharacterStore.setState(migratedData.character);
    useDiaryStore.setState(migratedData.diary);
    useInventoryStore.setState(migratedData.inventory);
    useJournalStore.setState(migratedData.journal);
    useSkillStore.setState(migratedData.skills);
    useWorldTimeStore.setState(migratedData.worldTime);
    useWorldStateStore.setState(migratedData.worldState);
    useCompanionStore.setState(migratedData.companion);
    useJobStore.setState(migratedData.jobs);
    useRoomStore.setState(migratedData.rooms);
    useShopStore.setState(migratedData.shops);
    
    // Restore location and trigger necessary UI updates
    if (migratedData.location.currentLocationId) {
      useLocationStore.getState().setLocation(migratedData.location.currentLocationId);
    }

    // Force UI updates if needed
    // e.g. set current screen to inGame to ensure we don't get stuck in main menu
    useUIStore.getState().setScreen('inGame');
    
    console.log('Game loaded successfully from:', migratedData.timestamp);
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
      let data = JSON.parse(json) as GameSaveData;
      data = this.migrate(data);
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
          let saveData: GameSaveData = JSON.parse(event.target?.result as string);
          saveData = this.migrate(saveData);
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

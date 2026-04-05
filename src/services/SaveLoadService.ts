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
import { publishDomainEvent } from './events/DomainEventBus';

type StripFunctions<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? never : K]: T[K];
};

type CharacterSnapshot = StripFunctions<ReturnType<typeof useCharacterStore.getState>>;
type DiarySnapshot = StripFunctions<ReturnType<typeof useDiaryStore.getState>>;
type InventorySnapshot = StripFunctions<ReturnType<typeof useInventoryStore.getState>>;
type JournalSnapshot = StripFunctions<ReturnType<typeof useJournalStore.getState>>;
type SkillSnapshot = StripFunctions<ReturnType<typeof useSkillStore.getState>>;
type WorldTimeSnapshot = StripFunctions<ReturnType<typeof useWorldTimeStore.getState>>;
type WorldStateSnapshot = StripFunctions<ReturnType<typeof useWorldStateStore.getState>>;
type CompanionSnapshot = StripFunctions<ReturnType<typeof useCompanionStore.getState>>;
type JobSnapshot = StripFunctions<ReturnType<typeof useJobStore.getState>>;
type RoomSnapshot = StripFunctions<ReturnType<typeof useRoomStore.getState>>;
type ShopSnapshot = StripFunctions<ReturnType<typeof useShopStore.getState>>;

interface LocationSnapshot {
  currentLocationId: string | null;
}

export interface GameSaveData {
  version: string;
  timestamp: string;
  saveName: string;
  screenshotUrl?: string;
  character: CharacterSnapshot;
  diary: DiarySnapshot;
  inventory: InventorySnapshot;
  journal: JournalSnapshot;
  skills: SkillSnapshot;
  worldTime: WorldTimeSnapshot;
  worldState: WorldStateSnapshot;
  companion: CompanionSnapshot;
  jobs: JobSnapshot;
  rooms: RoomSnapshot;
  shops: ShopSnapshot;
  location: LocationSnapshot;
}

export interface SaveSlotMetadata {
  id: string; // 'autosave' or 'slot_1', 'slot_2', etc.
  timestamp: string;
  saveName: string;
  isEmpty: boolean;
  screenshotUrl?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);

const asNumber = (value: unknown, fallback = 0): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

function stripFunctionFields<T extends object>(state: T): StripFunctions<T> {
  const entries = Object.entries(state as Record<string, unknown>).filter(([, value]) => typeof value !== 'function');
  return Object.fromEntries(entries) as StripFunctions<T>;
}

export class SaveLoadService {
  private static readonly SAVE_VERSION = '1.3';
  private static readonly STORAGE_PREFIX = 'divine_fantasy_save_';

  static migrate(data: unknown): GameSaveData {
    const source = asRecord(data);
    const version = asString(source.version, '1.0');
    if (version === '1.0') {
      console.log('Migrating save data from v1.0 to v1.3');
    }

    const character = asRecord(source.character) as CharacterSnapshot;
    const characterEffectsRaw = asRecord(character.effects);
    character.effects = {
      bleeding: asNumber(characterEffectsRaw.bleeding, 0),
      bleedMinutesAccumulated: asNumber(characterEffectsRaw.bleedMinutesAccumulated, 0),
    };

    const locationRaw = asRecord(source.location);
    const location: LocationSnapshot = {
      currentLocationId: typeof locationRaw.currentLocationId === 'string' ? locationRaw.currentLocationId : null,
    };

    return {
      version: this.SAVE_VERSION,
      timestamp: asString(source.timestamp, new Date().toISOString()),
      saveName: asString(source.saveName, 'Imported Save'),
      screenshotUrl: typeof source.screenshotUrl === 'string' ? source.screenshotUrl : undefined,
      character,
      diary: asRecord(source.diary) as DiarySnapshot,
      inventory: asRecord(source.inventory) as InventorySnapshot,
      journal: asRecord(source.journal) as JournalSnapshot,
      skills: asRecord(source.skills) as SkillSnapshot,
      worldTime: asRecord(source.worldTime) as WorldTimeSnapshot,
      worldState: asRecord(source.worldState) as WorldStateSnapshot,
      companion: asRecord(source.companion) as CompanionSnapshot,
      jobs: asRecord(source.jobs) as JobSnapshot,
      rooms: asRecord(source.rooms) as RoomSnapshot,
      shops: asRecord(source.shops) as ShopSnapshot,
      location,
    };
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

    return {
      version: this.SAVE_VERSION,
      timestamp: new Date().toISOString(),
      saveName,
      screenshotUrl: getLocationState().getCurrentLocation()?.background,
      character: stripFunctionFields(getCharacterState()),
      diary: stripFunctionFields(getDiaryState()),
      inventory: stripFunctionFields(getInventoryState()),
      journal: stripFunctionFields(getJournalState()),
      skills: stripFunctionFields(getSkillState()),
      worldTime: stripFunctionFields(getWorldTimeState()),
      worldState: stripFunctionFields(getWorldState()),
      companion: stripFunctionFields(getCompanionState()),
      jobs: stripFunctionFields(getJobState()),
      rooms: stripFunctionFields(getRoomState()),
      shops: stripFunctionFields(getShopState()),
      location: {
        currentLocationId: getLocationState().currentLocationId,
      },
    };
  }

  private static restoreGameState(data: GameSaveData) {
    const migratedData = this.migrate(data);

    // Load data into stores
    useCharacterStore.setState(migratedData.character as Partial<ReturnType<typeof useCharacterStore.getState>>);
    useDiaryStore.setState(migratedData.diary as Partial<ReturnType<typeof useDiaryStore.getState>>);
    useInventoryStore.setState(migratedData.inventory as Partial<ReturnType<typeof useInventoryStore.getState>>);
    useJournalStore.setState(migratedData.journal as Partial<ReturnType<typeof useJournalStore.getState>>);
    useSkillStore.setState(migratedData.skills as Partial<ReturnType<typeof useSkillStore.getState>>);
    useWorldTimeStore.setState(migratedData.worldTime as Partial<ReturnType<typeof useWorldTimeStore.getState>>);
    useWorldStateStore.setState(migratedData.worldState as Partial<ReturnType<typeof useWorldStateStore.getState>>);
    useCompanionStore.setState(migratedData.companion as Partial<ReturnType<typeof useCompanionStore.getState>>);
    useJobStore.setState(migratedData.jobs as Partial<ReturnType<typeof useJobStore.getState>>);
    useRoomStore.setState(migratedData.rooms as Partial<ReturnType<typeof useRoomStore.getState>>);
    useShopStore.setState(migratedData.shops as Partial<ReturnType<typeof useShopStore.getState>>);

    // Restore location and trigger necessary UI updates
    if (migratedData.location.currentLocationId) {
      useLocationStore.getState().setLocation(migratedData.location.currentLocationId);
    }

    // Ensure game resumes from gameplay screen.
    useUIStore.getState().setScreen('inGame');

    console.log('Game loaded successfully from:', migratedData.timestamp);
  }

  static getSlots(): SaveSlotMetadata[] {
    const slots: SaveSlotMetadata[] = [];

    // Autosave slot
    const autosaveJson = localStorage.getItem(`${this.STORAGE_PREFIX}autosave`);
    if (autosaveJson) {
      try {
        const data = this.migrate(JSON.parse(autosaveJson));
        slots.push({
          id: 'autosave',
          timestamp: data.timestamp,
          saveName: 'Autosave',
          isEmpty: false,
          screenshotUrl: data.screenshotUrl,
        });
      } catch {
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
          const data = this.migrate(JSON.parse(json));
          slots.push({
            id,
            timestamp: data.timestamp,
            saveName: data.saveName || `Save Slot ${i}`,
            isEmpty: false,
            screenshotUrl: data.screenshotUrl,
          });
        } catch {
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
      publishDomainEvent('SAVE_CREATED', {
        slotId,
        saveName,
        timestamp: data.timestamp,
      });
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
      const data = this.migrate(JSON.parse(json));
      this.restoreGameState(data);
      publishDomainEvent('SAVE_LOADED', {
        slotId,
        saveName: data.saveName,
        timestamp: data.timestamp,
      });
      return true;
    } catch (e) {
      console.error('Failed to load game:', e);
      return false;
    }
  }

  static deleteSlot(slotId: string): void {
    localStorage.removeItem(`${this.STORAGE_PREFIX}${slotId}`);
  }

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
          const saveData = this.migrate(JSON.parse(event.target?.result as string));
          this.restoreGameState(saveData);
          publishDomainEvent('SAVE_LOADED', {
            slotId: 'imported_file',
            saveName: saveData.saveName,
            timestamp: saveData.timestamp,
          });
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

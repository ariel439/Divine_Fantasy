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

interface GameSaveData {
  version: string;
  timestamp: string;
  character: any;
  diary: any;
  inventory: any;
  journal: any;
  skills: any;
  worldTime: any;
  worldState: any;
  companion: any;
}

export class SaveLoadService {
  private static readonly SAVE_VERSION = '1.0';

  static saveGame(slotName: string = 'save'): void {
    console.log('Saving game...');

    const saveData: GameSaveData = {
      version: this.SAVE_VERSION,
      timestamp: new Date().toISOString(),
      character: useCharacterStore.getState(),
      diary: useDiaryStore.getState(),
      inventory: useInventoryStore.getState(),
      journal: useJournalStore.getState(),
      skills: useSkillStore.getState(),
      worldTime: useWorldTimeStore.getState(),
      worldState: useWorldStateStore.getState(),
      companion: useCompanionStore.getState(),
    };

    const jsonString = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${slotName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    console.log('Game saved successfully');
  }

  static loadGame(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const saveData: GameSaveData = JSON.parse(event.target?.result as string);

          // Version check
          if (saveData.version !== this.SAVE_VERSION) {
            console.warn('Save file version mismatch. Attempting to load anyway...');
          }

          // Load data into stores
          useCharacterStore.setState(saveData.character);
          useDiaryStore.setState(saveData.diary);
          useInventoryStore.setState(saveData.inventory);
          useJournalStore.setState(saveData.journal);
          useSkillStore.setState(saveData.skills);
          useWorldTimeStore.setState(saveData.worldTime);
          useWorldStateStore.setState(saveData.worldState);
          useCompanionStore.setState(saveData.companion);

          console.log('Game loaded successfully from:', saveData.timestamp);
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

  static exportSaveData(): string {
    const saveData: GameSaveData = {
      version: this.SAVE_VERSION,
      timestamp: new Date().toISOString(),
      character: useCharacterStore.getState(),
      diary: useDiaryStore.getState(),
      inventory: useInventoryStore.getState(),
      journal: useJournalStore.getState(),
      skills: useSkillStore.getState(),
      worldTime: useWorldTimeStore.getState(),
      worldState: useWorldStateStore.getState(),
      companion: useCompanionStore.getState(),
    };

    return JSON.stringify(saveData, null, 2);
  }

  static importSaveData(jsonString: string): void {
    try {
      const saveData: GameSaveData = JSON.parse(jsonString);

      if (saveData.version !== this.SAVE_VERSION) {
        console.warn('Save data version mismatch. Attempting to load anyway...');
      }

      useCharacterStore.setState(saveData.character);
      useDiaryStore.setState(saveData.diary);
      useInventoryStore.setState(saveData.inventory);
      useJournalStore.setState(saveData.journal);
      useSkillStore.setState(saveData.skills);
      useWorldTimeStore.setState(saveData.worldTime);
      useWorldStateStore.setState(saveData.worldState);
      useCompanionStore.setState(saveData.companion);

      console.log('Save data imported successfully');
    } catch (error) {
      console.error('Failed to import save data:', error);
      throw error;
    }
  }
}

// GameManagerService.ts
// Handles high-level game flow and initialization

import { useCharacterStore } from '../stores/useCharacterStore';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useJournalStore } from '../stores/useJournalStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useCompanionStore } from '../stores/useCompanionStore';

export class GameManagerService {
  static startNewGame(templateId: string): void {
    // TODO: Load character template from character_templates.json
    // TODO: Reset all stores to initial state
    // TODO: Apply template data to stores
    console.log('Starting new game with template:', templateId);

    // Reset stores
    useCharacterStore.setState({
      attributes: { Strength: 1, Agility: 1, Intelligence: 1, Wisdom: 1, Charisma: 1 },
      hp: 100,
      energy: 100,
      hunger: 0,
      currency: { copper: 0, silver: 0, gold: 0 },
      maxWeight: 50,
    });

    useDiaryStore.setState({
      relationships: {},
      interactionHistory: [],
    });

    useInventoryStore.setState({
      items: [],
      currentWeight: 0,
    });

    useJournalStore.setState({
      quests: {},
    });

    useSkillStore.setState({
      skills: {},
    });

    useWorldTimeStore.setState({
      day: 1,
      hour: 8,
      minute: 0,
    });

    useWorldStateStore.setState({
      worldFlags: {},
      eventCooldowns: {},
    });

    useCompanionStore.setState({
      activeCompanion: null,
    });

    // TODO: Apply template-specific data
  }

  static endGame(): void {
    // TODO: Handle game over logic
    console.log('Game ended');
  }

  static pauseGame(): void {
    // TODO: Pause game logic
    console.log('Game paused');
  }

  static resumeGame(): void {
    // TODO: Resume game logic
    console.log('Game resumed');
  }
}

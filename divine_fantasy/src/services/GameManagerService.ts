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
import characterTemplates from '../data/character_templates.json';

export class GameManagerService {
  static startNewGame(templateId: string): void {
    console.log('Starting new game with template:', templateId);

    // Load template data
    const template = characterTemplates[templateId as keyof typeof characterTemplates];
    if (!template) {
      console.error('Template not found:', templateId);
      return;
    }

    // Reset and initialize all stores
    useCharacterStore.setState({
      attributes: { ...template.starting_attributes },
      hp: 100,
      energy: 100,
      hunger: 0,
      currency: { ...template.starting_bonuses.currency },
      maxWeight: 50,
    });

    useDiaryStore.setState({
      relationships: { ...template.starting_relationships },
      interactionHistory: [],
    });

    useInventoryStore.setState({
      items: template.starting_bonuses.items.map((itemId: string) => ({ id: itemId, quantity: 1 })),
      currentWeight: 0, // Will be calculated when items are added
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

    // Add starting items to inventory (after stores are initialized)
    template.starting_bonuses.items.forEach((itemId: string) => {
      useInventoryStore.getState().addItem(itemId, 1);
    });

    console.log('New game started successfully with template:', templateId);
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

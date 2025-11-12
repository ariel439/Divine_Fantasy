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
import { useShopStore } from '../stores/useShopStore'; // Import useShopStore
import characterTemplates from '../data/character_templates.json';
import npcsData from '../data/npcs.json';

export class GameManagerService {
  private static currentDay: number = 0;

  static init(): void {
    // Subscribe to world time changes for weekly resets
    useWorldTimeStore.subscribe(
      (state) => {
        const day = state.day;
        if (day !== GameManagerService.currentDay) {
          GameManagerService.currentDay = day;
          // Check for weekly reset (e.g., every 7 days)
          if (day > 1 && (day - 1) % 7 === 0) { // Reset on day 8, 15, 22, etc.
            console.log('Weekly store reset triggered!');
            useShopStore.getState().resetAllShops();
          }
        }
      }
    );
  }

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
      bio: {
        name: template.name,
        image: 'https://i.imgur.com/gUNzyBA.jpeg', // TODO: Add image to template
        description: template.description,
        gender: 'Male', // TODO: Add to template
        race: 'Human', // TODO: Add to template
        birthplace: 'Driftwatch', // TODO: Add to template
        born: '10th of July, 760', // TODO: Add to template
      },
    });

    useDiaryStore.setState({
      relationships: { ...template.starting_relationships },
      interactionHistory: [],
    });

    useInventoryStore.setState({
      items: [], // Initialize with an empty array
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
      knownNpcs: [
        'npc_sarah',
        'npc_old_leo',
        'npc_robert',
        'npc_kyle',
      ],
    });

    useCompanionStore.setState({
      activeCompanion: null,
    });

    // Add starting items to inventory (after stores are initialized)
    template.starting_bonuses.items.forEach((itemId: string) => {
      useInventoryStore.getState().addItem(itemId, 1);
    });

    // After all items are added, recalculate currentWeight
    useInventoryStore.getState().getCurrentWeight();

    // Developer convenience: seed 10 wooden planks to start
    // This helps quickly verify Roberta's quest progression and completion.
    useInventoryStore.getState().addItem('wooden_plank', 10);

    // If the quest is already accepted before seeding (e.g., dev flows), sync progress
    try {
      const journal = useJournalStore.getState() as any;
      if (typeof journal.syncQuestProgress === 'function') {
        journal.syncQuestProgress('roberta_planks_for_the_past');
      }
    } catch (e) {
      console.warn('Quest progress sync not available yet:', e);
    }

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

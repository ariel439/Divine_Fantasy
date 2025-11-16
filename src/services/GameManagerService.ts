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
import { useShopStore } from '../stores/useShopStore';
import { useCombatStore } from '../stores/useCombatStore';
import { useUIStore } from '../stores/useUIStore';
import characterTemplates from '../data/character_templates.json';
import enemiesJson from '../data/enemies.json';
import type { CombatParticipant } from '../stores/useCombatStore';

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
      attributes: {
        strength: template.starting_attributes.Strength,
        agility: template.starting_attributes.Agility,
        intelligence: template.starting_attributes.Intelligence,
        wisdom: template.starting_attributes.Wisdom,
        charisma: template.starting_attributes.Charisma,
      },
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

  static startWoodsCombat(wolfCountParam?: number): void {
    const character = useCharacterStore.getState();
    const companion = useCompanionStore.getState().activeCompanion;

    // Pick 1-4 wolves randomly
    const finalWolfCount = wolfCountParam || Math.floor(Math.random() * 4) + 1; // 1 to 4
    const wolfId = 'wolf_forest'; // Only forest wolves for now
    const selectedWolves: CombatParticipant[] = [];
    for (let i = 0; i < finalWolfCount; i++) {

      const wolfTemplate = enemiesJson[wolfId];
      if (wolfTemplate) {
        selectedWolves.push({
          id: `wolf_${i}_${Date.now()}`,
          name: wolfTemplate.name,
          hp: wolfTemplate.stats.hp,
          maxHp: wolfTemplate.stats.hp,


          attack: wolfTemplate.stats.attack,
          defence: wolfTemplate.stats.defence,
          agility: wolfTemplate.stats.agility,
          portraitUrl: 'https://i.imgur.com/gUNzyBA.jpeg', // TODO: Add wolf portrait
          isPlayer: false,
          isCompanion: false,
        });
      }
    }

    // Create player combatant
    const player: CombatParticipant = {
      id: 'player',
      name: character.bio.name,
      hp: character.hp,
      maxHp: 100,


      attack: character.attributes.strength,
      defence: character.attributes.strength,
      agility: character.attributes.agility,
      portraitUrl: character.bio.image,
      isPlayer: true,
      isCompanion: false,
    };

    // Create companion combatant if available
    let companionCombatant: CombatParticipant | null = null;
    if (companion) {
      companionCombatant = {
        id: 'companion',
        name: companion.name,
        hp: companion.stats.hp,
        maxHp: companion.stats.maxHp,
        attack: companion.stats.attack,
        defence: companion.stats.defence,


        agility: companion.stats.agility,
        portraitUrl: '', // TODO: Add companion portrait URL
        isPlayer: false,
        isCompanion: true,
      };
    }

    // Start combat
    useCombatStore.getState().startCombat(player, companionCombatant, selectedWolves);
    useUIStore.getState().setScreen('combat');
  }
}
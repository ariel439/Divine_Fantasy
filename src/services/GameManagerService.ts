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
import itemsJson from '../data/items.json';
import type { CombatParticipant, Item } from '../types';
import { DataValidator } from './DataValidator';

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
    try {
      const issues = DataValidator.run();
      if (issues.length > 0) {
        console.warn('[DataValidator] Issues detected:', issues);
      }
    } catch {}
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
      characterId: templateId,
      attributes: {
        strength: template.starting_attributes.Strength,
        dexterity: template.starting_attributes.Dexterity,
        intelligence: template.starting_attributes.Intelligence,
        wisdom: template.starting_attributes.Wisdom,
        charisma: template.starting_attributes.Charisma,
      },
      hp: 50 + (template.starting_attributes.Strength * 10),
      energy: 100,
      hunger: 60,
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
    try {
      useCharacterStore.getState().recalculateStats();
      const maxSocial = useCharacterStore.getState().maxSocialEnergy;
      useCharacterStore.setState({ socialEnergy: maxSocial });
    } catch {}

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
      year: 780,
      month: 5,
      dayOfMonth: 3,
      day: 1,
      hour: 8,
      minute: 0,
      clockPaused: false,
    });
    try {
      useWorldTimeStore.getState().rollDailyEnvironment();
      useWorldTimeStore.getState().applyHourlyEnvironment();
    } catch {}

    useWorldStateStore.setState({
      worldFlags: {},
      eventCooldowns: {},
      knownNpcs: [
        'npc_sarah',
        'npc_old_leo',
        'npc_kyle',
        'npc_finn',
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
          dexterity: wolfTemplate.stats.dexterity,
          portraitUrl: '/assets/portraits/Wolf.png',
          isPlayer: false,
          isCompanion: false,
        });
      }
    }

    const playerStats = GameManagerService.calculatePlayerStats(character);
    const playerName = character.bio?.name || 'Adventurer';
    const playerPortrait = character.bio?.image || 'https://i.imgur.com/gUNzyBA.jpeg';

    const player: CombatParticipant = {
      id: 'player',
      name: playerName,
      hp: character.hp,
      maxHp: character.maxHp || 100,
      attack: playerStats.attack,
      defence: playerStats.defence,
      dexterity: playerStats.dexterity,
      portraitUrl: playerPortrait,
      isPlayer: true,
      isCompanion: false,
    };

    // Add companion if present
    let companionCombatant: CombatParticipant | null = null;
    if (companion) {
      companionCombatant = {
        id: companion.id,
        name: companion.name,
        hp: companion.stats.hp,
        maxHp: companion.stats.maxHp,
        attack: companion.stats.attack,
        defence: companion.stats.defence,
        dexterity: companion.stats.dexterity,
        portraitUrl: '/assets/portraits/WolfPuppy.png', // TODO: Add companion portrait
        isPlayer: false,
        isCompanion: true,
      };
    }

    // Start combat
    useCombatStore.getState().startCombat(player, companionCombatant, selectedWolves);
    useUIStore.getState().setScreen('combat');
  }

  static startSmugglerCombat(): void {
    const character = useCharacterStore.getState();
    const companion = useCompanionStore.getState().activeCompanion;

    const enemyTemplate = enemiesJson['smuggler_dockhand'];
    const enemies: CombatParticipant[] = [];
    for (let i = 0; i < 4; i++) {
      enemies.push({
        id: `smuggler_${i}_${Date.now()}`,
        name: enemyTemplate?.name || 'Smuggler',
        hp: enemyTemplate?.stats.hp || 60,
        maxHp: enemyTemplate?.stats.hp || 60,
        attack: enemyTemplate?.stats.attack || 7,
        defence: enemyTemplate?.stats.defence || 5,
        dexterity: enemyTemplate?.stats.dexterity || 6,
        portraitUrl: '/assets/portraits/Smuggler.png',
        isPlayer: false,
        isCompanion: false,
      });
    }

    const playerStats = GameManagerService.calculatePlayerStats(character);

    const player: CombatParticipant = {
      id: 'player',
      name: character.bio.name,
      hp: character.hp,
      maxHp: 100,
      attack: playerStats.attack,
      defence: playerStats.defence,
      dexterity: playerStats.dexterity,
      portraitUrl: character.bio.image,
      isPlayer: true,
      isCompanion: false,
    };

    let companionCombatant: CombatParticipant | null = null;
    if (companion) {
      companionCombatant = {
        id: 'companion',
        name: companion.name,
        hp: companion.stats.hp,
        maxHp: companion.stats.maxHp,
        attack: companion.stats.attack,
        defence: companion.stats.defence,
        dexterity: companion.stats.dexterity,
        portraitUrl: '/assets/portraits/Robert.png',
        isPlayer: false,
        isCompanion: true,
      };
    }

    useCombatStore.getState().startCombat(player, companionCombatant, enemies);
    useWorldStateStore.getState().setFlag('smuggler_scripted_loss', true);
    useUIStore.getState().setScreen('combat');
  }

  static startRaidCombat(): void {
    const character = useCharacterStore.getState();
    const inventory = useInventoryStore.getState();

    // 1. Equip Iron Set
    const itemsToEquip = ['iron_helmet', 'iron_chainmail', 'iron_leggings', 'iron_sword'];
    
    itemsToEquip.forEach(itemId => {
      // Add to inventory first (simulating "given" items)
      inventory.addItem(itemId, 1);
      
      // Get full item data
      const itemData = itemsJson[itemId as keyof typeof itemsJson] as any;
      if (itemData) {
        // Cast to unknown first then to Item to satisfy TS
        character.equipItem({ ...itemData, id: itemId } as unknown as Item);
      }
    });

    // 2. Setup Enemies (Finn + 3 Thugs)
    const finnTemplate = enemiesJson['finn_boss'];
    const thugTemplate = enemiesJson['thug_generic'];

    const enemies: CombatParticipant[] = [];
    
    // Add Finn
    enemies.push({
      id: `finn_${Date.now()}`,
      name: finnTemplate?.name || 'Finn',
      hp: finnTemplate?.stats.hp || 200,
      maxHp: finnTemplate?.stats.hp || 200,
      attack: finnTemplate?.stats.attack || 25,
      defence: finnTemplate?.stats.defence || 10,
      dexterity: finnTemplate?.stats.dexterity || 8,
      portraitUrl: finnTemplate?.image || '/assets/portraits/OldManFinn.png',
      isPlayer: false,
      isCompanion: false,
    });

    // Add 3 Thugs (Weaker as requested)
    for (let i = 0; i < 3; i++) {
      enemies.push({
        id: `thug_${i}_${Date.now()}`,
        name: thugTemplate?.name || 'Thug',
        hp: (thugTemplate?.stats.hp || 80) * 0.8, // 20% weaker
        maxHp: (thugTemplate?.stats.hp || 80) * 0.8,
        attack: (thugTemplate?.stats.attack || 12) * 0.8,
        defence: (thugTemplate?.stats.defence || 4) * 0.8,
        dexterity: thugTemplate?.stats.dexterity || 5,
        portraitUrl: thugTemplate?.image || '/assets/portraits/Thug.png',
        isPlayer: false,
        isCompanion: false,
      });
    }

    // 3. Setup Player
    const playerStats = GameManagerService.calculatePlayerStats(character);
    const player: CombatParticipant = {
      id: 'player',
      name: character.bio?.name || 'Adventurer',
      hp: character.hp,
      maxHp: character.maxHp || 100,
      attack: playerStats.attack,
      defence: playerStats.defence,
      dexterity: playerStats.dexterity,
      portraitUrl: character.bio?.image || 'https://i.imgur.com/gUNzyBA.jpeg',
      isPlayer: true,
      isCompanion: false,
    };

    // 4. Setup Companions (Rodrick, Matthias, Stan)
    const companions: CombatParticipant[] = [
      {
        id: 'rodrick_companion',
        name: 'Sergeant Rodrick',
        hp: 300,
        maxHp: 300,
        attack: 30,
        defence: 15,
        dexterity: 10,
        portraitUrl: '/assets/portraits/Rodrick.png',
        isPlayer: false,
        isCompanion: true,
      },
      {
        id: 'matthias_companion',
        name: 'Matthias',
        hp: 250,
        maxHp: 250,
        attack: 25,
        defence: 12,
        dexterity: 12,
        portraitUrl: '/assets/portraits/Matthias.png', // Placeholder
        isPlayer: false,
        isCompanion: true,
      },
      {
        id: 'stan_companion',
        name: 'Private Stan',
        hp: 200,
        maxHp: 200,
        attack: 20,
        defence: 10,
        dexterity: 9,
        portraitUrl: '/assets/portraits/Guard_Generic.png',
        isPlayer: false,
        isCompanion: true,
      }
    ];

    useCombatStore.getState().startCombat(player, companions, enemies);
    useUIStore.getState().setScreen('combat');
  }

  static startFinnBetrayalCombat(): void {
    const character = useCharacterStore.getState();

    const finnTemplate = enemiesJson['finn_boss'];
    const thugTemplate = enemiesJson['thug_generic'];

    const enemies: CombatParticipant[] = [];

    enemies.push({
      id: `finn_${Date.now()}`,
      name: finnTemplate?.name || 'Finn',
      hp: finnTemplate?.stats.hp || 200,
      maxHp: finnTemplate?.stats.hp || 200,
      attack: finnTemplate?.stats.attack || 25,
      defence: finnTemplate?.stats.defence || 10,
      dexterity: finnTemplate?.stats.dexterity || 8,
      portraitUrl: finnTemplate?.image || '/assets/portraits/OldManFinn.png',
      isPlayer: false,
      isCompanion: false,
    });

    for (let i = 0; i < 3; i++) {
      enemies.push({
        id: `thug_${i}_${Date.now()}`,
        name: thugTemplate?.name || 'Thug',
        hp: (thugTemplate?.stats.hp || 80) * 0.8,
        maxHp: (thugTemplate?.stats.hp || 80) * 0.8,
        attack: (thugTemplate?.stats.attack || 12) * 0.8,
        defence: (thugTemplate?.stats.defence || 4) * 0.8,
        dexterity: thugTemplate?.stats.dexterity || 5,
        portraitUrl: thugTemplate?.image || '/assets/portraits/Thug.png',
        isPlayer: false,
        isCompanion: false,
      });
    }

    const playerStats = GameManagerService.calculatePlayerStats(character);
    const player: CombatParticipant = {
      id: 'player',
      name: character.bio?.name || 'Adventurer',
      hp: character.hp,
      maxHp: character.maxHp || 100,
      attack: playerStats.attack,
      defence: playerStats.defence,
      dexterity: playerStats.dexterity,
      portraitUrl: character.bio?.image || 'https://i.imgur.com/gUNzyBA.jpeg',
      isPlayer: true,
      isCompanion: false,
    };

    useCombatStore.getState().startCombat(player, null, enemies);
    useUIStore.getState().setScreen('combat');
  }

  private static calculatePlayerStats(character: any): { attack: number; defence: number; dexterity: number } {
    let totalAttack = character.attributes.strength || 0;
    // Base defence is average of strength and dexterity
    let totalDefence = Math.floor(((character.attributes.strength || 0) + (character.attributes.dexterity || 0)) / 2);
    let totalDexterity = character.attributes.dexterity || 0;

    if (character.equippedItems) {
      Object.values(character.equippedItems).forEach((item: any) => {
        if (item && item.stats) {
          // Normalize keys to lowercase to handle potential inconsistencies (Attack vs attack)
          const stats = Object.keys(item.stats).reduce((acc: any, key) => {
            acc[key.toLowerCase()] = item.stats[key];
            return acc;
          }, {});

          if (typeof stats.attack === 'number') totalAttack += stats.attack;
          if (typeof stats.strength === 'number') totalAttack += stats.strength; // Strength adds to attack power
          if (typeof stats.defence === 'number') totalDefence += stats.defence;
          if (typeof stats.dexterity === 'number') totalDexterity += stats.dexterity;
        }
      });
    }

    console.log('[GameManagerService] Calculated Player Stats:', {
      baseStrength: character.attributes.strength,
      baseDexterity: character.attributes.dexterity,
      totalAttack,
      totalDefence,
      totalDexterity
    });

    return { attack: totalAttack, defence: totalDefence, dexterity: totalDexterity };
  }
}

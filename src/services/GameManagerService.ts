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
import { useLocationStore } from '../stores/useLocationStore';
import characterTemplates from '../data/character_templates.json';
import enemiesJson from '../data/enemies.json';
import itemsJson from '../data/items.json';
import type { CombatParticipant, Item } from '../types';
import type { Companion } from '../stores/useCompanionStore';
import { DataValidator } from './DataValidator';
import { WorldEventManager } from './WorldEventManager';
import { QuestObserverService } from './QuestObserverService';
import { DialogueService } from './DialogueService';
import { timeoutSlides, starvationSlides, gameOverSlides } from '../data/events';

export class GameManagerService {
  private static currentDay: number = 0;
  private static initialized: boolean = false;
  private static readonly DRIFTWATCH_PROPER_LOCATIONS = new Set([
    'driftwatch',
    'driftwatch_main_street',
    'driftwatch_noble_quarter',
    'driftwatch_docks',
    'driftwatch_slums',
    'salty_mug',
    'salty_mug_rented_room',
    'tide_trade',
    'beryls_general_goods',
    'harbor_clothier',
    'kaelens_forge',
    'grand_library',
    'mosswatch_keep',
    'tidehunter_quarter',
    'herbalists_hovel',
  ]);

  static isDriftwatchProper(locationId: string | null | undefined): boolean {
    return Boolean(locationId && this.DRIFTWATCH_PROPER_LOCATIONS.has(locationId));
  }

  private static getWeekdayIndex(month: number, dayOfMonth: number): number {
    const firstDayOfWeekForMonth = ((month - 1) * 30) % 7;
    return (firstDayOfWeekForMonth + dayOfMonth - 1) % 7;
  }

  static refreshWeeklyExplorationEscapes(): void {
    const agilityLevel = useSkillStore.getState().getSkillLevel('agility');
    const dexterity = useCharacterStore.getState().attributes.dexterity || 0;
    const maxExplorationEscapes = Math.max(0, Math.floor(agilityLevel / 10) + dexterity);
    useCharacterStore.setState({
      maxExplorationEscapes,
      explorationEscapes: maxExplorationEscapes,
    });
  }

  private static isFinnTimeoutActiveOrResolved(): boolean {
    const world = useWorldStateStore.getState();
    const ui = useUIStore.getState();
    return (
      !world.getFlag('finn_debt_collection_active') ||
      world.getFlag('finn_timeout_triggered') ||
      world.getFlag('finn_dead') ||
      world.getFlag('finn_rebel_branch_complete') ||
      world.getFlag('finn_whitefang_branch_complete') ||
      ui.currentScreen === 'combat' ||
      ui.currentEventId === 'timeout_game_over' ||
      ui.currentEventId === 'game_over' ||
      ui.currentEventId === 'starvation_game_over'
    );
  }

  private static updateFinnTimeoutReadiness(currentDay: number): void {
    const world = useWorldStateStore.getState();
    if (!world.introCompleted || !world.getFlag('finn_debt_collection_active')) return;

    const deadlineRaw = world.getData('finn_debt_deadline_day');
    const deadline = deadlineRaw ? Number(deadlineRaw) : 0;
    if (deadline <= 0 || currentDay <= deadline) return;

    if (!world.getFlag('finn_timeout_ready')) {
      world.setFlag('finn_timeout_ready', true);
    }
  }

  private static tryTriggerFinnTimeout(locationId?: string | null): void {
    const world = useWorldStateStore.getState();
    if (!world.getFlag('finn_timeout_ready')) return;
    if (this.isFinnTimeoutActiveOrResolved()) return;
    if (!this.isDriftwatchProper(locationId ?? useLocationStore.getState().currentLocationId)) return;

    world.setFlag('finn_timeout_triggered', true);
    const ui = useUIStore.getState();
    ui.setEventSlides(timeoutSlides);
    ui.setCurrentEventId('timeout_game_over');
    ui.setScreen('event');
  }
  
  private static getEnemyPortrait(templateId: string, template: any): string {
    if (template?.image) return template.image;
    if (templateId.includes('wolf')) return '/assets/portraits/wolf.png';
    if (templateId.includes('smuggler')) return '/assets/portraits/smuggler.png';
    if (templateId.includes('finn')) return '/assets/portraits/oldmanfinn.png';
    if (templateId.includes('guard')) return '/assets/portraits/stan.png';
    return '/assets/portraits/thug.png';
  }

  private static buildEnemyCombatant(templateId: string, index: number): CombatParticipant | null {
    const template = enemiesJson[templateId as keyof typeof enemiesJson];
    if (!template) return null;

    return {
      id: `${templateId}_${index}_${Date.now()}`,
      name: template.name,
      hp: template.stats.hp,
      maxHp: template.stats.hp,
      attack: template.stats.attack,
      defence: template.stats.defence,
      dexterity: template.stats.dexterity,
      portraitUrl: this.getEnemyPortrait(templateId, template),
      isPlayer: false,
      isCompanion: false,
      attack_sound: template.attack_sound,
      combatTags: template.combat_tags,
      accuracyModifier: template.accuracy_modifier,
      lootTable: template.loot_table,
    };
  }

  private static buildDebugAllyCombatant(templateId: string, index: number): CombatParticipant | null {
    const allyTemplates: Record<string, CombatParticipant> = {
      wolf_puppy: {
        id: `wolf_puppy_debug_${index}_${Date.now()}`,
        name: 'Wolf Puppy',
        hp: 40,
        maxHp: 40,
        attack: 5,
        defence: 2,
        dexterity: 12,
        portraitUrl: '/assets/portraits/wolfpuppy.png',
        isPlayer: false,
        isCompanion: true,
      },
      robert: {
        id: `robert_debug_${index}_${Date.now()}`,
        name: 'Robert',
        hp: 70,
        maxHp: 70,
        attack: 7,
        defence: 6,
        dexterity: 7,
        portraitUrl: '/assets/portraits/robert.png',
        isPlayer: false,
        isCompanion: true,
      },
      lin_shao: {
        id: `lin_shao_debug_${index}_${Date.now()}`,
        name: 'Captain Lin Shao',
        hp: 180,
        maxHp: 180,
        attack: 15,
        defence: 10,
        dexterity: 9,
        portraitUrl: '/assets/portraits/linshao.png',
        isPlayer: false,
        isCompanion: true,
        attack_sound: '/assets/sfx/combat_sword_swing.mp3',
      },
      wei_taren: {
        id: `wei_taren_debug_${index}_${Date.now()}`,
        name: 'Wei Taren',
        hp: 160,
        maxHp: 160,
        attack: 14,
        defence: 9,
        dexterity: 8,
        portraitUrl: '/assets/portraits/weitaren.png',
        isPlayer: false,
        isCompanion: true,
        attack_sound: '/assets/sfx/combat_sword_swing.mp3',
      },
      qiao_ren: {
        id: `qiao_ren_debug_${index}_${Date.now()}`,
        name: 'Qiao Ren',
        hp: 150,
        maxHp: 150,
        attack: 13,
        defence: 8,
        dexterity: 10,
        portraitUrl: '/assets/portraits/qiaoren.png',
        isPlayer: false,
        isCompanion: true,
        attack_sound: '/assets/sfx/combat_sword_swing.mp3',
      },
      ronald: {
        id: `ronald_debug_${index}_${Date.now()}`,
        name: 'Ronald',
        hp: 120,
        maxHp: 120,
        attack: 10,
        defence: 7,
        dexterity: 10,
        portraitUrl: '/assets/portraits/ronald.png',
        isPlayer: false,
        isCompanion: true,
        attack_sound: '/assets/sfx/combat_axe_swing.mp3',
      },
    };

    const template = allyTemplates[templateId];
    return template ? { ...template } : null;
  }

  private static getCompanionPortrait(companion: Companion): string {
    if (companion.portraitUrl) return companion.portraitUrl;
    if (companion.type === 'wolf') return '/assets/portraits/wolfpuppy.png';
    if (companion.id.includes('robert') || companion.type === 'human') return '/assets/portraits/robert.png';
    return '/assets/portraits/CompanionPlaceholder.png';
  }

  private static buildPartyCompanionCombatants(): CombatParticipant[] {
    return useCompanionStore.getState().getPartyCompanions().map((companion) => ({
      id: companion.id,
      name: companion.name,
      hp: companion.stats.hp,
      maxHp: companion.stats.maxHp,
      attack: companion.stats.attack,
      defence: companion.stats.defence,
      dexterity: companion.stats.dexterity,
      portraitUrl: this.getCompanionPortrait(companion),
      isPlayer: false,
      isCompanion: true,
    }));
  }

  static init(): void {
    if (GameManagerService.initialized) return;
    GameManagerService.initialized = true;

    WorldEventManager.init();
    QuestObserverService.init();

      // Subscribe to world time changes
    useWorldTimeStore.subscribe(
      (state) => {
        // Since Zustand 5 subscribe doesn't give prevState, we track it manually or use current state
        const day = state.day;
        // Use local static variables to track changes across subscription fires
        if (GameManagerService.currentDay === 0) {
            GameManagerService.currentDay = day;
            return;
        }

        if (day !== GameManagerService.currentDay) {
          console.log(`Day changed from ${GameManagerService.currentDay} to ${day}`);
          GameManagerService.currentDay = day;
          
          // Check for weekly reset (e.g., every 7 days)
          if (day > 1 && (day - 1) % 7 === 0) { // Reset on day 8, 15, 22, etc.
            console.log('Weekly store reset triggered!');
            useShopStore.getState().resetAllShops();
          }

          if (GameManagerService.getWeekdayIndex(state.month, state.dayOfMonth) === 1) {
            GameManagerService.refreshWeeklyExplorationEscapes();
          }

          // Apply daily hunger penalty/regen
          // (Previously this was delta-based, but since we lost delta, we can do it daily or just keep it simple)
          // For now, hunger tick is handled below every minute.
        }

        GameManagerService.updateFinnTimeoutReadiness(day);
        GameManagerService.tryTriggerFinnTimeout();
      }
    );

    useLocationStore.subscribe((state) => {
      GameManagerService.tryTriggerFinnTimeout(state.currentLocationId);
    });

    // Subscribe to character stats (HP/Hunger) for Death/Starvation
    useCharacterStore.subscribe((state) => {
        const ui = useUIStore.getState();
        const world = useWorldStateStore.getState();
        
        // Skip checks during intro or if already dead
        if (!world.introCompleted || ui.currentEventId === 'game_over' || ui.currentEventId === 'starvation_game_over' || ui.currentEventId === 'timeout_game_over') {
            return;
        }

        if (state.hp <= 0) {
            // Check if starvation (hunger is 0 and caused the drain)
            if (state.hunger <= 0) {
                console.log('Game Over: Starvation');
                ui.setEventSlides(starvationSlides);
                ui.setCurrentEventId('starvation_game_over');
                ui.setScreen('event');
            } else if (ui.currentScreen !== 'combat') {
                // Generic death outside combat (e.g. event choice)
                console.log('Game Over: Generic Death');
                ui.setEventSlides(gameOverSlides);
                ui.setCurrentEventId('game_over');
                ui.setScreen('event');
            }
        }
    });

    // Subscribe to inventory changes to sync quest progress
    // This decouples the inventory store from the journal store
    useInventoryStore.subscribe(() => {
        try {
            useJournalStore.getState().syncQuestProgress();
        } catch (e) {
            console.warn('Failed to sync quest progress on inventory change:', e);
        }
    });

    try {
      const issues = DataValidator.run();
      if (issues.length > 0) {
        console.warn('[DataValidator] Issues detected:', issues);
      }
    } catch {}
  }

  static startNewGame(templateId: string): void {
    console.log('Starting new game with template:', templateId);
    GameManagerService.currentDay = 0;

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
      charisma: template.starting_attributes.Charisma,
      },
      hp: 100,
      energy: 100,
      hunger: 100,
      explorationEscapes: 0,
      maxExplorationEscapes: 0,
      currency: { ...template.starting_bonuses.currency },
      maxWeight: 50,
      languages: {
        veyric: 'Native',
        shenhaic: 'None',
      },
      bio: {
        name: template.name,
        image: '/assets/portraits/luke_kid.png',
        description: template.description,
        gender: 'Male', // TODO: Add to template
        race: 'Human', // TODO: Add to template
        birthplace: 'Driftwatch', // TODO: Add to template
        born: '10th of July, 760', // TODO: Add to template
      },
      equippedItems: {},
      equipmentLoadouts: {
        1: {},
        2: {},
      },
      activeEquipmentLoadout: 1,
    });
    useSkillStore.setState({
      skills: {},
    });
    useCharacterStore.setState({ constitutionBonusHp: 0 });
    try {
      useCharacterStore.getState().recalculateStats();
      useCharacterStore.getState().refreshSocialEnergyCap();
      useCharacterStore.setState((state) => ({ socialEnergy: state.maxSocialEnergy }));
      GameManagerService.refreshWeeklyExplorationEscapes();
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
    useCharacterStore.setState({ constitutionBonusHp: 0 });

    useWorldTimeStore.setState({
      year: 780,
      month: 5,
      dayOfMonth: 3,
      day: 1,
      hour: 8,
      minute: 0,
      clockPaused: false,
    });
    useUIStore.setState({
      currentScreen: 'mainMenu',
      activeModal: null,
      dialogueNpcId: null,
      shopId: null,
      sleepWaitMode: null,
      sleepQuality: null,
      eventSlides: null,
      currentEventId: null,
      libraryBooks: null,
      selectedLibraryBookId: null,
      libraryReturnScreen: 'inGame',
      craftingSkill: null,
      craftingMode: 'standard',
      confirmationType: null,
      diaryTab: 'diary',
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
      introMode: false,
      introCompleted: false,
      gameMode: 'story',
      tutorialStep: 0,
      seenRoomTutorial: false,
      seenLeoTutorial: false,
      stringData: {},
    });
    useWorldStateStore.getState().setFlag('whitefang_week_closed', false);

    useCompanionStore.setState({
      activeCompanion: null,
      companions: [],
      formation: ['player', null, null, null],
    });

    useShopStore.getState().loadShops();

    // Add starting items to inventory (after stores are initialized)
    template.starting_bonuses.items.forEach((itemId: string) => {
      useInventoryStore.getState().addItem(itemId, 1);
    });

    // Luke starts in a proper ragged outfit instead of abstract "nothing"
    ['ragged_shirt', 'ragged_legs'].forEach((itemId) => {
      useInventoryStore.getState().addItem(itemId, 1);
      const itemData = itemsJson[itemId as keyof typeof itemsJson] as any;
      if (itemData) {
        useCharacterStore.getState().equipItem({ ...itemData, id: itemId } as unknown as Item);
      }
    });
    useCharacterStore.getState().saveEquipmentLoadout(1);

    // After all items are added, recalculate currentWeight
    useInventoryStore.getState().getCurrentWeight();

    WorldEventManager.reset();

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

  static applyMainGameStoryVitals(): void {
    useCharacterStore.setState((state) => ({
      ...state,
      hp: state.maxHp || 100,
      energy: 60,
    }));
  }

  static closeWhiteFangWeekWindow(): void {
    const world = useWorldStateStore.getState();
    world.setFlag('whitefang_week_closed', true);

    const whiteFangQuest = useJournalStore.getState().quests['white_fang_route'];
    if (whiteFangQuest && whiteFangQuest.active && !whiteFangQuest.completed) {
      try { useJournalStore.getState().failQuest('white_fang_route'); } catch {}
    }
  }

  static applyPostEndingWeekRecovery(): void {
    useWorldTimeStore.getState().passTime(7 * 24 * 60);
    this.closeWhiteFangWeekWindow();

    useCharacterStore.setState((state) => ({
      ...state,
      hp: state.maxHp,
      energy: 100,
      hunger: 100,
      socialEnergy: state.maxSocialEnergy,
    }));
  }

  static skipStoryIntroToFinnWeek(): void {
    useWorldStateStore.getState().setIntroMode(false);
    useWorldStateStore.getState().setIntroCompleted(true);
    useWorldStateStore.getState().setFlag('intro_completed', true);
    useWorldStateStore.getState().setTutorialStep(100);
    useWorldStateStore.getState().addKnownNpc('npc_robert');
    useWorldStateStore.getState().setFlag('robert_status_unknown', true);
    useCompanionStore.getState().setCompanion(null);
    useWorldStateStore.getState().setFlag('finn_debt_intro_pending', false);

    useWorldTimeStore.setState({
      year: 780,
      month: 5,
      dayOfMonth: 3,
      day: 1,
      hour: 8,
      minute: 0,
    });

    useLocationStore.getState().setLocation('salty_mug');
    DialogueService.executeAction('start_quest:finn_debt_collection');
    DialogueService.executeAction('start_debt_collection');

    useCharacterStore.setState((state) => ({
      ...state,
      bio: state.bio ? { ...state.bio, image: '/assets/portraits/luke.jpg' } : state.bio,
      hunger: 20,
    }));
    GameManagerService.applyMainGameStoryVitals();
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

    // Pick 1-4 wolves randomly
    const finalWolfCount = wolfCountParam || Math.floor(Math.random() * 4) + 1; // 1 to 4
    const wolfId = 'wolf_forest'; // Only forest wolves for now
    const selectedWolves: CombatParticipant[] = [];
    for (let i = 0; i < finalWolfCount; i++) {
      const wolfCombatant = this.buildEnemyCombatant(wolfId, i);
      if (wolfCombatant) selectedWolves.push(wolfCombatant);
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
    const companionCombatants = this.buildPartyCompanionCombatants();

    // Start combat
    useCombatStore.getState().startCombat(player, companionCombatants.length > 0 ? companionCombatants : null, selectedWolves);
    useUIStore.getState().setScreen('combat');
  }

  static startRonaldWolfPackCombat(): void {
    const character = useCharacterStore.getState();

    const wolves: CombatParticipant[] = [];
    for (let i = 0; i < 4; i++) {
      const wolfCombatant = this.buildEnemyCombatant('wolf_forest', i);
      if (wolfCombatant) wolves.push(wolfCombatant);
    }
    if (wolves.length === 0) return;

    const playerStats = GameManagerService.calculatePlayerStats(character);
    const player: CombatParticipant = {
      id: 'player',
      name: character.bio?.name || 'Luke',
      hp: character.hp,
      maxHp: character.maxHp || 100,
      attack: playerStats.attack,
      defence: playerStats.defence,
      dexterity: playerStats.dexterity,
      portraitUrl: character.bio?.image || '/assets/portraits/luke.jpg',
      isPlayer: true,
      isCompanion: false,
    };

    const ronald = this.buildDebugAllyCombatant('ronald', 0);
    useCombatStore.getState().startCombat(player, ronald ? [ronald] : null, wolves, {
      allowFlee: false,
      victoryEventId: 'ronald_wolf_pup_choice',
      victoryToast: 'The last wolf drops, and the woods finally seem to breathe again.',
    });
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
          portraitUrl: '/assets/portraits/smuggler.png',
          isPlayer: false,
          isCompanion: false,
          attack_sound: enemyTemplate?.attack_sound,
          combatTags: enemyTemplate?.combat_tags,
          accuracyModifier: enemyTemplate?.accuracy_modifier,
          lootTable: enemyTemplate?.loot_table,
        });
    }

    const playerStats = GameManagerService.calculatePlayerStats(character);

    const player: CombatParticipant = {
      id: 'player',
      name: character.bio?.name || 'Luke',
      hp: character.hp,
      maxHp: character.maxHp || 100,
      attack: playerStats.attack,
      defence: playerStats.defence,
      dexterity: playerStats.dexterity,
      portraitUrl: character.bio?.image || '/assets/portraits/luke.jpg',
      isPlayer: true,
      isCompanion: false,
    };

    let companionCombatant: CombatParticipant | null = null;
    if (companion) {
      companionCombatant = {
        id: 'companion',
        name: companion.name || 'Companion',
        hp: companion.stats?.hp || 70,
        maxHp: companion.stats?.maxHp || 70,
        attack: companion.stats?.attack || 7,
        defence: companion.stats?.defence || 6,
        dexterity: companion.stats?.dexterity || 7,
        portraitUrl: '/assets/portraits/robert.png',
        isPlayer: false,
        isCompanion: true,
      };
    }

    useCombatStore.getState().startCombat(player, companionCombatant, enemies, {
      forcePlayerFirstTurn: true,
      allowFlee: false,
    });
    useWorldStateStore.getState().setFlag('smuggler_scripted_loss', true);
    useUIStore.getState().setScreen('combat');
  }

  static startBenBrawl(): void {
    const character = useCharacterStore.getState();
    const template = enemiesJson['drunk_tavern'];

    const enemy: CombatParticipant = {
      id: `ben_brawl_${Date.now()}`,
      name: 'Ben',
      hp: template?.stats.hp || 45,
      maxHp: template?.stats.hp || 45,
      attack: template?.stats.attack || 7,
      defence: template?.stats.defence || 1,
      dexterity: template?.stats.dexterity || 3,
        portraitUrl: '/assets/portraits/ben.png',
        isPlayer: false,
        isCompanion: false,
        attack_sound: template?.attack_sound || '/assets/sfx/combat_punch.mp3',
        combatTags: template?.combat_tags,
        accuracyModifier: template?.accuracy_modifier,
        lootTable: template?.loot_table,
      };

    const playerStats = GameManagerService.calculatePlayerStats(character);
    const player: CombatParticipant = {
      id: 'player',
      name: character.bio?.name || 'Luke',
      hp: character.hp,
      maxHp: character.maxHp || 100,
      attack: GameManagerService.calculateBrawlAttack(character),
      defence: playerStats.defence,
      dexterity: playerStats.dexterity,
      portraitUrl: character.bio?.image || '/assets/portraits/luke.jpg',
      isPlayer: true,
      isCompanion: false,
    };

    useCombatStore.getState().startCombat(player, null, [enemy], {
      encounterType: 'brawl',
      defeatMode: 'knockout',
      victoryActions: [
        'collect_debt_from:npc_ben',
        'update_relationship:npc_ben:-50',
        'update_relationship:npc_ben:20:fear',
      ],
      victoryToast: 'You rough Ben up and take Finn\'s silver.',
      defeatToast: 'Ben leaves you bruised and throws you out of the fight.',
    });
    useUIStore.getState().setScreen('combat');
  }

  static startDebugCombat(
    enemyTemplateIds: string[],
    config?: { encounterType?: 'standard' | 'brawl'; knockoutOnDefeat?: boolean },
    allyTemplateIds?: string[]
  ): void {
    const character = useCharacterStore.getState();

    const enemies = enemyTemplateIds
      .map((templateId, index) => this.buildEnemyCombatant(templateId, index))
      .filter(Boolean) as CombatParticipant[];

    if (enemies.length === 0) return;

    const playerStats = GameManagerService.calculatePlayerStats(character);
    const player: CombatParticipant = {
      id: 'player',
      name: character.bio?.name || 'Luke',
      hp: character.hp,
      maxHp: character.maxHp || 100,
      attack: playerStats.attack,
      defence: playerStats.defence,
      dexterity: playerStats.dexterity,
      portraitUrl: character.bio?.image || '/assets/portraits/luke.jpg',
      isPlayer: true,
      isCompanion: false,
    };

    const companions = (allyTemplateIds || [])
      .map((templateId, index) => this.buildDebugAllyCombatant(templateId, index))
      .filter(Boolean) as CombatParticipant[];

    useCombatStore.getState().startCombat(player, companions.length > 0 ? companions : null, enemies, {
      encounterType: config?.encounterType || 'standard',
      defeatMode: config?.knockoutOnDefeat ? 'knockout' : 'standard',
    });
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
      portraitUrl: finnTemplate?.image || '/assets/portraits/oldmanfinn.png',
      isPlayer: false,
      isCompanion: false,
      attack_sound: finnTemplate?.attack_sound,
      combatTags: finnTemplate?.combat_tags,
      accuracyModifier: finnTemplate?.accuracy_modifier,
      lootTable: finnTemplate?.loot_table,
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
        portraitUrl: thugTemplate?.image || '/assets/portraits/thug.png',
        isPlayer: false,
        isCompanion: false,
        attack_sound: thugTemplate?.attack_sound,
        combatTags: thugTemplate?.combat_tags,
        accuracyModifier: thugTemplate?.accuracy_modifier,
        lootTable: thugTemplate?.loot_table,
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
        portraitUrl: '/assets/portraits/rodrick.png',
        isPlayer: false,
        isCompanion: true,
        attack_sound: '/assets/sfx/combat_sword_swing.mp3',
      },
      {
        id: 'matthias_companion',
        name: 'Matthias',
        hp: 250,
        maxHp: 250,
        attack: 25,
        defence: 12,
        dexterity: 12,
        portraitUrl: '/assets/portraits/matthias.png', // Placeholder
        isPlayer: false,
        isCompanion: true,
        attack_sound: '/assets/sfx/combat_sword_swing.mp3',
      },
      {
        id: 'stan_companion',
        name: 'Private Stan',
        hp: 200,
        maxHp: 200,
        attack: 20,
        defence: 10,
        dexterity: 9,
        portraitUrl: '/assets/portraits/stan.png',
        isPlayer: false,
        isCompanion: true,
        attack_sound: '/assets/sfx/combat_sword_swing.mp3',
      }
    ];

    useCombatStore.getState().startCombat(player, companions, enemies, {
      victoryEventId: 'raid_victory',
      allowFlee: false,
    });
    useUIStore.getState().setScreen('combat');
  }

  static startFinnTimeoutCombat(): void {
    const character = useCharacterStore.getState();
    const whiteFangBound = useWorldStateStore.getState().getFlag('whitefang_bound');

    const enemies: CombatParticipant[] = [];

    // 1. Finn (Boss)
    const finnTemplate = enemiesJson['finn_boss'];
    enemies.push({
      id: `finn_boss_${Date.now()}`,
      name: finnTemplate?.name || 'Finn',
      hp: finnTemplate?.stats.hp || 150,
      maxHp: finnTemplate?.stats.hp || 150,
      attack: finnTemplate?.stats.attack || 15,
      defence: finnTemplate?.stats.defence || 8,
      dexterity: finnTemplate?.stats.dexterity || 10,
      portraitUrl: finnTemplate?.image || '/assets/portraits/oldmanfinn.png',
      isPlayer: false,
      isCompanion: false,
      attack_sound: finnTemplate?.attack_sound,
      combatTags: finnTemplate?.combat_tags,
      accuracyModifier: finnTemplate?.accuracy_modifier,
      lootTable: finnTemplate?.loot_table,
    });

    // 2. Add 3 Thugs
    const thugTemplate = enemiesJson['thug_generic'];
    for (let i = 0; i < 3; i++) {
      enemies.push({
        id: `thug_${i}_${Date.now()}`,
        name: thugTemplate?.name || 'Thug',
        hp: thugTemplate?.stats.hp || 80,
        maxHp: thugTemplate?.stats.hp || 80,
        attack: thugTemplate?.stats.attack || 12,
        defence: thugTemplate?.stats.defence || 4,
        dexterity: thugTemplate?.stats.dexterity || 5,
        portraitUrl: thugTemplate?.image || '/assets/portraits/thug.png',
        isPlayer: false,
        isCompanion: false,
        attack_sound: thugTemplate?.attack_sound,
        combatTags: thugTemplate?.combat_tags,
        accuracyModifier: thugTemplate?.accuracy_modifier,
        lootTable: thugTemplate?.loot_table,
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

    useCombatStore.getState().startCombat(player, null, enemies, {
      victoryEventId: whiteFangBound ? 'whitefang_finn_end' : 'finn_personal_kill_end',
      allowFlee: false,
    });
    useUIStore.getState().setScreen('combat');
  }

  static startFinnBetrayalCombat(): void {
    const character = useCharacterStore.getState();
    const whiteFangBound = useWorldStateStore.getState().getFlag('whitefang_bound');

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
      portraitUrl: finnTemplate?.image || '/assets/portraits/oldmanfinn.png',
      isPlayer: false,
      isCompanion: false,
      attack_sound: finnTemplate?.attack_sound,
      combatTags: finnTemplate?.combat_tags,
      accuracyModifier: finnTemplate?.accuracy_modifier,
      lootTable: finnTemplate?.loot_table,
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
        portraitUrl: thugTemplate?.image || '/assets/portraits/thug.png',
        isPlayer: false,
        isCompanion: false,
        attack_sound: thugTemplate?.attack_sound,
        combatTags: thugTemplate?.combat_tags,
        accuracyModifier: thugTemplate?.accuracy_modifier,
        lootTable: thugTemplate?.loot_table,
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

    useCombatStore.getState().startCombat(player, null, enemies, {
      victoryEventId: whiteFangBound ? 'whitefang_finn_end' : 'finn_personal_kill_end',
      allowFlee: false,
    });
    useUIStore.getState().setScreen('combat');
  }

  static startWhiteFangCombat(): void {
    const character = useCharacterStore.getState();
    const shadow = this.buildEnemyCombatant('ren_zhen_shadow', 0);
    if (!shadow) return;

    const playerStats = GameManagerService.calculatePlayerStats(character);
    const player: CombatParticipant = {
      id: 'player',
      name: character.bio?.name || 'Luke',
      hp: character.hp,
      maxHp: character.maxHp || 100,
      attack: playerStats.attack,
      defence: playerStats.defence,
      dexterity: playerStats.dexterity,
      portraitUrl: character.bio?.image || '/assets/portraits/luke.jpg',
      isPlayer: true,
      isCompanion: false,
    };

    const retainers: CombatParticipant[] = [
        {
          id: 'lin_shao_retainer',
          name: 'Captain Lin Shao',
          hp: 150,
          maxHp: 150,
          attack: 12,
          defence: 7,
          dexterity: 9,
          portraitUrl: '/assets/portraits/linshao.png',
          isPlayer: false,
          isCompanion: true,
          attack_sound: '/assets/sfx/combat_sword_swing.mp3',
        },
        {
          id: 'wei_taren_retainer',
          name: 'Wei Taren',
          hp: 120,
          maxHp: 120,
          attack: 10,
          defence: 6,
          dexterity: 8,
          portraitUrl: '/assets/portraits/weitaren.png',
          isPlayer: false,
          isCompanion: true,
          attack_sound: '/assets/sfx/combat_sword_swing.mp3',
        },
        {
          id: 'qiao_ren_retainer',
          name: 'Qiao Ren',
          hp: 110,
          maxHp: 110,
          attack: 10,
          defence: 6,
          dexterity: 10,
          portraitUrl: '/assets/portraits/qiaoren.png',
          isPlayer: false,
          isCompanion: true,
        attack_sound: '/assets/sfx/combat_sword_swing.mp3',
      },
    ];

    useCombatStore.getState().startCombat(player, retainers, [shadow], {
      victoryToast: 'The storm falls silent. Something older than victory waits for you in the dark.',
      allowFlee: false,
    });
    useUIStore.getState().setScreen('combat');
  }

  static bindWhiteFangToLuke(): void {
    const world = useWorldStateStore.getState();
    if (world.getFlag('whitefang_bound')) return;

    const rebelQuest = useJournalStore.getState().quests['rebel_path'];
    if (rebelQuest?.active && !rebelQuest.completed) {
      try { useJournalStore.getState().updateQuest('rebel_path', { currentStage: 0 }); } catch {}
      try { useJournalStore.getState().failQuest('rebel_path'); } catch {}
    }

    world.setFlag('whitefang_bound', true);
    world.setFlag('whitefang_resisted', false);
    world.setFlag('whitefang_camp_unlocked', true);
    world.setFlag('raid_ready', false);

    const inventory = useInventoryStore.getState();
    const character = useCharacterStore.getState();
    const whiteFang = itemsJson['white_fang_of_heaven' as keyof typeof itemsJson] as any;

    if (inventory.getItemQuantity('white_fang_of_heaven') <= 0) {
      inventory.addItem('white_fang_of_heaven', 1);
    }

    if (whiteFang) {
      useCharacterStore.setState((state) => ({
        ...state,
        attributes: {
          strength: state.attributes.strength + 2,
          dexterity: state.attributes.dexterity + 2,
          intelligence: state.attributes.intelligence + 2,
          charisma: state.attributes.charisma + 2,
        },
        bio: state.bio
          ? {
              ...state.bio,
              image: '/assets/portraits/lukewhitefang.png',
            }
          : state.bio,
      }));
      useCharacterStore.getState().recalculateStats();
      useCharacterStore.getState().refreshSocialEnergyCap();
      useCharacterStore.setState((state) => ({
        ...state,
        hp: Math.min(state.maxHp, state.hp + 30),
      }));

      const currentlyEquipped = useCharacterStore.getState().equippedItems.weapon;
      if (!currentlyEquipped || currentlyEquipped.id !== 'white_fang_of_heaven') {
        useCharacterStore.getState().equipItem({ ...whiteFang, id: 'white_fang_of_heaven' } as unknown as Item);
      }
    }

    useDiaryStore.getState().updateRelationship('npc_shihan', { friendship: 5 });
    useDiaryStore.getState().addInteraction('White Fang of Heaven has bound itself to Luke.');
  }

  static resistWhiteFang(): void {
    const world = useWorldStateStore.getState();
    if (world.getFlag('whitefang_bound') || world.getFlag('whitefang_resisted')) return;

    const rebelQuest = useJournalStore.getState().quests['rebel_path'];
    if (rebelQuest?.active && !rebelQuest.completed) {
      try { useJournalStore.getState().updateQuest('rebel_path', { currentStage: 0 }); } catch {}
      try { useJournalStore.getState().failQuest('rebel_path'); } catch {}
    }

    world.setFlag('whitefang_resisted', true);
    world.setFlag('whitefang_camp_unlocked', true);
    world.setFlag('raid_ready', false);

    useDiaryStore.getState().addInteraction('Luke resisted White Fang of Heaven and left it sealed beneath the mountain.');
  }

  private static calculatePlayerStats(character: any): { attack: number; defence: number; dexterity: number } {
    let totalAttack = character.attributes.strength || 0;
    // Base defence is average of strength and dexterity
    let totalDefence = Math.floor(((character.attributes.strength || 0) + (character.attributes.dexterity || 0)) / 2);
    let totalDexterity = character.attributes.dexterity || 0;

    if (character.equippedItems) {
      Object.entries(character.equippedItems).forEach(([slot, item]: any) => {
        if (item && item.stats) {
          if (slot === 'shield' && item.combatTags?.includes('two_handed')) return;
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

  private static calculateBrawlAttack(character: any): number {
    let totalAttack = character.attributes.strength || 0;

    if (character.equippedItems) {
      Object.entries(character.equippedItems).forEach(([slot, item]: any) => {
        if (!item || !item.stats || slot === 'weapon') return;
        const stats = Object.keys(item.stats).reduce((acc: any, key) => {
          acc[key.toLowerCase()] = item.stats[key];
          return acc;
        }, {});

        if (typeof stats.attack === 'number') totalAttack += stats.attack;
        if (typeof stats.strength === 'number') totalAttack += stats.strength;
      });
    }

    return totalAttack;
  }
}

import React, { useEffect, useState } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useShopStore } from '../stores/useShopStore';
import { useJournalStore } from '../stores/useJournalStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useCombatStore } from '../stores/useCombatStore';
import { useCompanionStore } from '../stores/useCompanionStore';
import { useToastStore } from '../stores/useToastStore';
import { useSkillStore } from '../stores/useSkillStore';
import { GameManagerService } from '../services/GameManagerService';
import { DialogueService } from '../services/DialogueService';

import MainMenu from './screens/MainMenu';
import CharacterSelection from './screens/CharacterSelection';
import EventScreen from './screens/EventScreen';
import LocationScreen from './screens/LocationScreen';
import DialogueScreen from './screens/DialogueScreen';
import CharacterScreen from './screens/CharacterScreen';
import InventoryScreen from './screens/InventoryScreen';
import JournalScreen from './screens/JournalScreen';
import DiaryScreen from './screens/DiaryScreen';
import LibraryScreen from './screens/LibraryScreen';
import TradeScreen from './screens/TradeScreen';
import TradeConfirmationScreen from './screens/TradeConfirmationScreen';
import CraftingScreen from './screens/CraftingScreen';
import ChoiceEventScreen from './screens/ChoiceEventScreen';
import CombatManager from './CombatManager';
import { LootScreen } from './screens/LootScreen';

const DebugMenuScreen = React.lazy(() => import('./screens/DebugMenuScreen'));
const CombatDebugScreen = React.lazy(() => import('./screens/CombatDebugScreen'));

import npcsData from '../data/npcs.json';
import { 
  lukePrologueSlides, 
  finnDebtIntroSlides, 
  gameOverSlides, 
  choiceEvents, 
  benCheatEventSlides, 
  elaraDeliverySlides, 
  berylDeliverySlides, 
  rebelVictorySlides,
  raidVictoryWeekPassageSlides,
  evilEndingWeekPassageSlides,
  introRobertTrainingSlides,
  introKidsHelpingSlides,
  introStudyShenhaicSlides,
  whitefangBindingSlides
  ,
  robertaKissSlides
} from '../data/events';
import { getIntimidationSummary } from '../utils/socialPresentation';
import { ROBERTA_UPGRADE_FLAGS, robertaUpgradeRecipes } from '../data/robertaUpgrades';

const ScreenManager: React.FC = () => {
  const { currentScreen, setScreen, shopId, dialogueNpcId } = useUIStore();
  const ui = useUIStore();
  const robertaCounterDone = useWorldStateStore((state) => state.worldFlags.roberta_upgrade_counter_done);
  const robertaDisplaysDone = useWorldStateStore((state) => state.worldFlags.roberta_upgrade_displays_done);
  const robertaStorefrontDone = useWorldStateStore((state) => state.worldFlags.roberta_upgrade_storefront_done);
  const { loadShops } = useShopStore();
  
  // New State for Event Results
  const [eventResult, setEventResult] = useState<{ text: string, choices: any[] } | null>(null);

  // Clear event result when screen changes or eventId changes
  useEffect(() => {
    if (currentScreen !== 'choiceEvent') {
        setEventResult(null);
    }
  }, [currentScreen, ui.currentEventId]);

  const [dialogueNode, setDialogueNode] = useState<any>(null);
  const [dialogueHistory, setDialogueHistory] = useState<any[]>([]);

  const markNpcDeath = (npcId: string) => {
    const world = useWorldStateStore.getState();
    const npcKey = npcId.replace(/^npc_/, '');
    world.setFlag(`${npcKey}_dead`, true);
    if (!world.getData(`${npcId}_death_date`)) {
      world.setData(`${npcId}_death_date`, useWorldTimeStore.getState().getFormattedDate());
    }
  };

  const finishWeekLockedWhiteFangEnding = (locationId: string) => {
    GameManagerService.applyPostEndingWeekRecovery();
    useLocationStore.getState().setLocation(locationId);
    setScreen('inGame');
  };

  const completeIntroPastime = (fallbackChoice: 'robert' | 'kids' | 'study') => {
    const world = useWorldStateStore.getState();
    const selectedPastime = world.getData('intro_pastime_choice') || fallbackChoice;

    // Keep the childhood-choice rewards deterministic so old state cannot leak in.
    useSkillStore.getState().setSkillLevel('defence', 1);
    useCharacterStore.setState((state) => ({
      ...state,
      languages: {
        ...state.languages,
        shenhaic: 'None',
      },
    }));
    world.setFlag('knows_shenhaic_basic', false);

    if (selectedPastime === 'robert') {
      useDiaryStore.getState().updateRelationship('npc_robert', { friendship: 12 });
      useSkillStore.getState().setSkillLevel('defence', 3);
    } else if (selectedPastime === 'kids') {
      useDiaryStore.getState().updateRelationship('npc_sarah', { friendship: 8 });
      useDiaryStore.getState().updateRelationship('npc_kyle', { friendship: 8 });
      useSkillStore.getState().setSkillLevel('carpentry', 3);
    } else if (selectedPastime === 'study') {
      useCharacterStore.setState((state) => ({
        ...state,
        languages: {
          ...state.languages,
          shenhaic: 'Basic',
        },
      }));
      world.setFlag('knows_shenhaic_basic', true);
    }

    world.setTutorialStep(6);
    world.setData('intro_pastime_choice', '');
    try { useJournalStore.getState().setQuestStage('luke_tutorial', 6); } catch {}
    useWorldTimeStore.setState({ hour: 20, minute: 0 });
    ui.setEventSlides(null);
    ui.setCurrentEventId(null);
    setScreen('inGame');
  };

  useEffect(() => {
    if (currentScreen === 'dialogue') {
      const npcId = dialogueNpcId;
      if (npcId) {
        const node = DialogueService.startDialogue(npcId);
        setDialogueNode(node);
        setDialogueHistory(DialogueService.getDialogueHistory());
      }
    } else {
      setDialogueNode(null);
      setDialogueHistory([]);
    }
  }, [currentScreen, dialogueNpcId]);

  const handleDialogueOption = (option: any, index: number) => {
    const nextNode = DialogueService.selectResponse(index);
    setDialogueHistory(DialogueService.getDialogueHistory());
    
    if (nextNode) {
      setDialogueNode(nextNode);
    } else {
      handleEndDialogue();
    }
  };

  const handleEndDialogue = () => {
    const npcId = useUIStore.getState().dialogueNpcId;
    DialogueService.endDialogue();
    useUIStore.getState().setDialogueNpcId(null);
    // If a combat was started by a dialogue action, prioritize entering combat screen
    try {
      const activeCombat = useCombatStore.getState().participants.length > 0;
      if (activeCombat) {
        setScreen('combat');
        return;
      }
    } catch {}
    try {
      const world = useWorldStateStore.getState();
      const lastNpcId = npcId;
      if (lastNpcId === 'npc_finn' && world.getFlag('finn_debt_intro_pending')) {
        useWorldStateStore.getState().setFlag('finn_debt_intro_pending', false);
      }
      const loc = useLocationStore.getState().getCurrentLocation();
      
      // Intro: Roberta at Lighthouse (Step 2 -> 3)
      if (world.introMode && loc.id === 'intro_lighthouse' && world.tutorialStep <= 2 && npcId === 'npc_old_leo') {
        useWorldStateStore.getState().setTutorialStep(3);
        useWorldTimeStore.setState({ hour: 9, minute: 0 });
        try { useJournalStore.getState().setQuestStage('luke_tutorial', 4); } catch {}
        
        const spokeRoberta = world.getFlag('intro_spoke_roberta');
        if (spokeRoberta) {
          useWorldStateStore.getState().addKnownNpc('npc_roberta');
          const current = useDiaryStore.getState().relationships['npc_roberta']?.friendship?.value || 0;
          const delta = 20 - current;
          useDiaryStore.getState().updateRelationship('npc_roberta', { friendship: delta });
        }
      } 
      // Smuggler Event: Kyle Dialogue -> Help Robert
      else if (useUIStore.getState().currentEventId === 'kyle_smuggler_alert' && npcId === 'npc_kyle') {
        // Fix for "Help Robert" crash: Wrap in setTimeout
        setTimeout(() => {
            const uiState = useUIStore.getState();
            uiState.setCurrentEventId(null);
            useWorldTimeStore.setState({ hour: 22, minute: 0 });
            useLocationStore.getState().setLocation('intro_docks');
            
            useCompanionStore.getState().setCompanion({
              id: 'npc_robert_companion',
              name: 'Robert',
              type: 'human',
              stats: { hp: 70, maxHp: 70, attack: 7, defence: 6, dexterity: 7 },
              equippedItems: [],
            });
            
            useWorldStateStore.getState().setFlag('smuggler_help_available', true);
            uiState.setScreen('inGame');
        }, 50);
        return;
      }
    } catch (e) {
        console.error("Error in handleEndDialogue:", e);
    }

    const uiState = useUIStore.getState();
    if (uiState.currentEventId) {
      setScreen('event');
    } else {
      setScreen('inGame');
    }
  };

  switch (currentScreen) {
      case 'mainMenu':
        return <MainMenu />;
      case 'characterSelection':
        return <CharacterSelection />;
      case 'prologue':
        return (
          <EventScreen
            slides={lukePrologueSlides}
            onComplete={() => {
              useCharacterStore.setState((state) => ({ ...state, hunger: 20 }));
              useWorldStateStore.getState().setIntroCompleted(true);
              useWorldStateStore.getState().setFlag('intro_completed', true);
              useWorldStateStore.getState().setIntroMode(false);
              useWorldStateStore.getState().setFlag('smuggler_help_available', false);
              useWorldStateStore.getState().setFlag('robert_smuggler_incident', false);
              useWorldTimeStore.setState({ hour: 8, minute: 0, year: 780 });
              useLocationStore.getState().setLocation('salty_mug');
              useWorldStateStore.getState().setFlag('finn_debt_intro_pending', true);
              ui.setEventSlides(finnDebtIntroSlides);
              ui.setCurrentEventId('finn_debt_intro');
              try { useJournalStore.getState().completeQuest('luke_tutorial'); } catch {}
              setScreen('event');
            }}
          />
        );
  case 'event': {
    const slides = ui.eventSlides || [];
    return (
      <EventScreen
        slides={slides}
        onComplete={() => {
          const id = ui.currentEventId;
          if (id === 'wakeup') {
            try { useJournalStore.getState().completeQuest('luke_tutorial'); } catch {}
          }
          if (id === 'finn_debt_intro') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useWorldStateStore.getState().setIntroMode(false);
            useWorldStateStore.getState().removeKnownNpc('npc_robert');
            useCompanionStore.getState().setCompanion(null);
            useWorldStateStore.getState().setIntroCompleted(true);
            useWorldStateStore.getState().setFlag('intro_completed', true);
            useWorldStateStore.getState().setFlag('smuggler_help_available', false);
            useWorldStateStore.getState().setFlag('robert_smuggler_incident', false);
            try { useJournalStore.getState().completeQuest('luke_tutorial'); } catch {}
            useUIStore.getState().setDialogueNpcId('npc_finn');
            setScreen('dialogue');
            return;
          }
          if (id === 'smuggler_trap') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useLocationStore.getState().setLocation('intro_docks');
            setScreen('inGame');
            return;
          }
          if (id === 'debug_smuggler_intro') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            if (import.meta.env.DEV) {
              useLocationStore.getState().setLocation('intro_docks');
              GameManagerService.startSmugglerCombat();
            } else {
              setScreen('inGame');
            }
            return;
          }
          if (id === 'robert_caught') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useLocationStore.getState().setLocation('intro_orphanage_room');
            useCompanionStore.getState().setCompanion(null);
            useWorldStateStore.getState().setFlag('start_finn_debt_on_sleep', true);
            setScreen('inGame');
            return;
          }
          if (id === 'beryl_secret_meeting') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useWorldStateStore.getState().setFlag('beryl_secret_meeting_seen', true);
            setScreen('inGame');
            return;
          }
          if (id === 'ben_cheat_slides') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useWorldStateStore.getState().setFlag('ben_cheat_done', true);
            useWorldStateStore.getState().setFlag('ben_cheat_collect_pending', true);
            useWorldTimeStore.getState().passTime(120);
            useCharacterStore.getState().updateStats({ energy: -15 });
            useUIStore.getState().setDialogueNpcId('npc_ben');
            setScreen('dialogue');
            return;
          }
          if (id === 'sell_locket_event') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useInventoryStore.getState().removeItem('antique_locket', 1);
            useCharacterStore.getState().addCurrency('silver', 10);
            useWorldStateStore.getState().setFlag('debt_paid_by_ben', true);
            useDiaryStore.getState().addInteraction('Sold the antique locket to a noble for 10 silver.');
            useLocationStore.getState().setLocation('driftwatch_noble_quarter');
            setScreen('inGame');
            return;
          }
          if (id === 'ben_cheat_event') {
            ui.setEventSlides(benCheatEventSlides);
            ui.setCurrentEventId('ben_cheat_slides');
            setScreen('event');
            return;
          }
          if (id === 'intro_robert_training') {
            completeIntroPastime('robert');
            return;
          }
          if (id === 'intro_kids_helping') {
            completeIntroPastime('kids');
            return;
          }
          if (id === 'intro_study_shenhaic') {
            completeIntroPastime('study');
            return;
          }
          if (id === 'raid_salty_mug_intro') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            GameManagerService.startRaidCombat();
            return;
          }
          if (id === 'roberta_kiss_event') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useUIStore.getState().setDialogueNpcId('npc_roberta');
            setScreen('dialogue');
            return;
          }
          if (id === 'raid_victory') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useWorldStateStore.getState().setFlag('finn_rebel_branch_complete', true);
            markNpcDeath('npc_finn');
            useWorldStateStore.getState().setFlag('finn_resolved', true);
            useWorldStateStore.getState().setFlag('finn_debt_collection_active', false);
            useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
            useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
            try { useJournalStore.getState().failQuest('finn_debt_collection'); } catch {}
            try { useJournalStore.getState().completeQuest('rebel_path'); } catch {}
            ui.setEventSlides(raidVictoryWeekPassageSlides);
            ui.setCurrentEventId('raid_victory_week_passage');
            setScreen('event');
            return;
          }
          if (id === 'timeout_game_over') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            GameManagerService.startFinnTimeoutCombat();
            return;
          }
          if (id === 'game_over' || id === 'starvation_game_over') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            setScreen('mainMenu');
            return;
          }
          if (id === 'evil_path_end') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            ui.setEventSlides(evilEndingWeekPassageSlides);
            ui.setCurrentEventId('evil_path_end_week_passage');
            setScreen('event');
            return;
          }
          if (id === 'finn_hybrid_end') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useLocationStore.getState().setLocation('salty_mug');
            setScreen('inGame');
            return;
          }
          if (id === 'whitefang_finn_end') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useWorldStateStore.getState().setFlag('finn_whitefang_branch_complete', true);
            markNpcDeath('npc_finn');
            useWorldStateStore.getState().setFlag('finn_resolved', true);
            useWorldStateStore.getState().setFlag('finn_debt_collection_active', false);
            useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
            useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
            useWorldStateStore.getState().setFlag('raid_ready', false);
            try { useJournalStore.getState().failQuest('finn_debt_collection'); } catch {}
            useLocationStore.getState().setLocation('shihan_camp');
            setScreen('inGame');
            return;
          }
          if (id === 'finn_personal_kill_end') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useWorldStateStore.getState().setFlag('finn_hybrid_branch_complete', true);
            markNpcDeath('npc_finn');
            useWorldStateStore.getState().setFlag('finn_resolved', true);
            useWorldStateStore.getState().setFlag('finn_debt_collection_active', false);
            useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
            useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
            useWorldStateStore.getState().setFlag('raid_ready', false);
            try { useJournalStore.getState().failQuest('finn_debt_collection'); } catch {}
            setScreen('inGame');
            return;
          }
          if (id === 'rebel_victory') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useWorldStateStore.getState().setFlag('finn_rebel_branch_complete', true);
            markNpcDeath('npc_finn');
            useWorldStateStore.getState().setFlag('finn_resolved', true);
            useWorldStateStore.getState().setFlag('finn_debt_collection_active', false);
            useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
            useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
            try { useJournalStore.getState().failQuest('finn_debt_collection'); } catch {}
            try { useJournalStore.getState().completeQuest('rebel_path'); } catch {}
            ui.setEventSlides(raidVictoryWeekPassageSlides);
            ui.setCurrentEventId('rebel_victory_week_passage');
            setScreen('event');
            return;
          }
          if (id === 'raid_victory_week_passage' || id === 'rebel_victory_week_passage') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            finishWeekLockedWhiteFangEnding('driftwatch_slums');
            return;
          }
          if (id === 'evil_path_end_week_passage') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            finishWeekLockedWhiteFangEnding('salty_mug');
            return;
          }
          if (id === 'elara_delivery_event') {
            ui.setEventSlides(elaraDeliverySlides);
            ui.setCurrentEventId('elara_delivery_slides');
            setScreen('event');
            return;
          }
          if (id === 'elara_delivery_slides') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useWorldStateStore.getState().setFlag('elara_delivery_done', true);
            useWorldStateStore.getState().setFlag('elara_helped_drug', true);
            useInventoryStore.getState().removeItem('elara_medicine_parcel', 1);
            useWorldTimeStore.getState().passTime(120);
            useCharacterStore.getState().updateStats({ energy: -10 });
            useDiaryStore.getState().addInteraction('Delivered the medicine parcel to the sewers.');
            setScreen('inGame');
            return;
          }
          if (id === 'beryl_delivery_event') {
            ui.setEventSlides(berylDeliverySlides);
            ui.setCurrentEventId('beryl_delivery_slides');
            setScreen('event');
            return;
          }
          if (id === 'beryl_delivery_slides') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useWorldStateStore.getState().setFlag('beryl_delivery_done', true);
            useWorldStateStore.getState().setFlag('beryl_helped_pimp', true);
            useInventoryStore.getState().removeItem('beryl_noble_parcel', 1);
            useWorldTimeStore.getState().passTime(120);
            useCharacterStore.getState().updateStats({ energy: -10 });
            useDiaryStore.getState().addInteraction('Delivered the discreet package to the Noble Quarter.');
            setScreen('inGame');
            return;
          }
          if (id === 'whitefang_woods_unreadable' || id === 'whitefang_beach_unreadable' || id === 'whitefang_mountain_unreadable') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            setScreen('inGame');
            return;
          }
          if (id === 'whitefang_woods_vision' || id === 'whitefang_beach_vision' || id === 'whitefang_mountain_vision') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            setScreen('inGame');
            return;
          }
          if (id === 'whitefang_cave_blocked') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            setScreen('inGame');
            return;
          }
          if (id === 'whitefang_expedition_breach') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            GameManagerService.startWhiteFangCombat();
            return;
          }
          if (id === 'whitefang_binding_accept') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            GameManagerService.bindWhiteFangToLuke();
            useJournalStore.getState().completeQuest('white_fang_route');
            useLocationStore.getState().setLocation('shihan_camp');
            ui.setDialogueNpcId('npc_shihan_camp');
            setScreen('dialogue');
            return;
          }

          ui.setEventSlides(null);
          ui.setCurrentEventId(null);
          setScreen('inGame');
        }}
      />
    );
  }
      case 'inGame':
        return <LocationScreen />;
      case 'dialogue': {
        const npcId = useUIStore.getState().dialogueNpcId;
        if (!npcId || !dialogueNode) return null;

        const npc = npcsData[npcId as keyof typeof npcsData];
        const options = (dialogueNode.player_choices || []).map((c: any) => ({
          text: c.text,
          closesDialogue: c.closes_dialogue,
          disabled: c.disabled,
          nextPortraitUrl: c.next_portrait_url || c.nextPortraitUrl,
          variant: c.variant || 'default',
        }));

        return (
          <DialogueScreen
            npcId={npcId}
            npcName={npc?.name || 'NPC'}
            npcPortraitUrl={npc?.portrait || '/assets/icons/DivineFantasy.png'}
            playerPortraitUrl={useCharacterStore.getState().bio?.image || '/assets/portraits/luke.jpg'}
            history={dialogueHistory}
            activePrompt={DialogueService.getCurrentMenuPrompt()}
            options={options}
            onOptionSelect={handleDialogueOption}
            onEndDialogue={handleEndDialogue}
            socialEnergy={useCharacterStore.getState().socialEnergy}
            maxSocialEnergy={useCharacterStore.getState().maxSocialEnergy}
          />
        );
      }
      case 'characterScreen':
        return <CharacterScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'journal':
        return <JournalScreen />;
      case 'diary':
        return <DiaryScreen />;
      case 'library':
        return <LibraryScreen onClose={() => setScreen('inGame')} />;
      case 'trade':
        return shopId ? (
          <TradeScreen
            shopId={shopId}
            onConfirmTrade={() => {}}
            onClose={() => {
              const uiState = useUIStore.getState();
              if (uiState.dialogueNpcId) {
                setScreen('dialogue');
              } else {
                setScreen('inGame');
              }
            }}
          />
        ) : (
          <div className="text-white">No shop selected.</div>
        );
      case 'tradeConfirmation':
        return (
          <TradeConfirmationScreen
            onConfirm={() => setScreen('inGame')}
            onCancel={() => setScreen('trade')}
            playerOffer={[]}
            merchantOffer={[]}
            balance={0}
          />
        );
      case 'crafting': {
        const craftingMode = useUIStore.getState().craftingMode;
        const activeCraftingRecipes = craftingMode === 'robertaUpgrades'
          ? robertaUpgradeRecipes.filter((recipe) => {
              const completedFlag = {
                roberta_counter_refit: ROBERTA_UPGRADE_FLAGS.counter,
                roberta_display_crates: ROBERTA_UPGRADE_FLAGS.displays,
                roberta_storefront_finish: ROBERTA_UPGRADE_FLAGS.storefront,
              }[recipe.id];

              if (!completedFlag) {
                return true;
              }

              const completedMap = {
                [ROBERTA_UPGRADE_FLAGS.counter]: robertaCounterDone,
                [ROBERTA_UPGRADE_FLAGS.displays]: robertaDisplaysDone,
                [ROBERTA_UPGRADE_FLAGS.storefront]: robertaStorefrontDone,
              };

              return !completedMap[completedFlag];
            })
          : undefined;
        return (
          <CraftingScreen
            onClose={() => {
              useUIStore.getState().setCraftingMode('standard');
              setScreen('inGame');
            }}
            initialSkill={useUIStore.getState().craftingSkill}
            recipes={activeCraftingRecipes}
            title={craftingMode === 'robertaUpgrades' ? 'Tide & Trade Upgrades' : undefined}
            craftVerb={craftingMode === 'robertaUpgrades' ? 'Complete Upgrade' : 'Craft'}
            lockQuantity={craftingMode === 'robertaUpgrades'}
            onStartCrafting={(recipe, quantity) => {
              const inventory = useInventoryStore.getState();
              const character = useCharacterStore.getState();
              const worldTime = useWorldTimeStore.getState();
              const toast = useToastStore.getState();
              const skillStore = useSkillStore.getState();
              const world = useWorldStateStore.getState();
              const journal = useJournalStore.getState();

              // 0. Validate Level
              const playerLevel = skillStore.getSkillLevel(recipe.skill.toLowerCase());
              if (playerLevel < recipe.levelRequired) {
                toast.addToast(`Your ${recipe.skill} level is too low. Required: ${recipe.levelRequired}`, 'error', 3000, 'Level Requirement');
                return;
              }

              // 0.5. Validate Energy
              const totalEnergyCost = (recipe.energyCost || 0) * quantity;
              if (character.energy < totalEnergyCost) {
                toast.addToast("You are too exhausted to craft this.", 'error', 3000, 'Not Enough Energy');
                return;
              }

              // 1. Validate Resources
              const canAfford = recipe.ingredients.every(ing => 
                inventory.getItemQuantity(ing.itemId) >= ing.quantity * quantity
              );
              
              let specialCostMet = true;
              if (recipe.result.id === 'wooden_plank') {
                 // Hardcoded copper cost for planks
                 specialCostMet = character.currency.copper >= 2 * quantity;
              }

              if (!canAfford || !specialCostMet) {
                toast.addToast("You don't have the required materials.", 'error', 3000, 'Not Enough Resources');
                return;
              }

              // 2. Consume Resources
              recipe.ingredients.forEach(ing => {
                inventory.removeItem(ing.itemId, ing.quantity * quantity);
              });
              
              if (recipe.result.id === 'wooden_plank') {
                character.removeCurrency(2 * quantity);
              }

              // 2.5. Deduct Energy
              if (totalEnergyCost > 0) {
                character.updateStats({ energy: character.energy - totalEnergyCost });
              }

              // 3. Add Result & XP
              const isCooking = recipe.skill.toLowerCase() === 'cooking';
              let successes = 0;
              let failures = 0;

              if (isCooking) {
                // Cooking Success Chance: 60% base + 10% per level above recipe requirement
                // Guaranteed success at PlayerLevel >= RecipeLevel + 4
                const levelDiff = playerLevel - recipe.levelRequired;
                const successChance = Math.min(100, Math.max(5, 60 + (levelDiff * 10)));

                for (let i = 0; i < quantity; i++) {
                  if (Math.random() * 100 < successChance) {
                    successes++;
                  } else {
                    failures++;
                  }
                }

                if (successes > 0) {
                  inventory.addItem(recipe.result.id, successes * (recipe.result.quantity || 1));
                }
                if (failures > 0) {
                  const burnedId = recipe.result.id === 'cooked_meat' ? 'burned_meat' : 'burned_food';
                  inventory.addItem(burnedId, failures);
                }

                // Grant XP: Full for success, 25% for failure
                const totalXp = (successes * recipe.xpGranted) + (failures * Math.floor(recipe.xpGranted * 0.25));
                skillStore.addXp(recipe.skill.toLowerCase(), totalXp);

              } else {
                if (craftingMode === 'robertaUpgrades') {
                  skillStore.addXp(recipe.skill.toLowerCase(), recipe.xpGranted * quantity);
                } else {
                  // Non-cooking crafting is always successful for now
                  const resultQty = (recipe.result.quantity || 1) * quantity;
                  inventory.addItem(recipe.result.id, resultQty);
                  skillStore.addXp(recipe.skill.toLowerCase(), recipe.xpGranted * quantity);
                }
              }

              // 4. Pass Time
              if (recipe.timeCost) {
                worldTime.passTime(recipe.timeCost * quantity);
              }

              if (craftingMode === 'robertaUpgrades') {
                const recipeFlagMap: Record<string, string> = {
                  roberta_counter_refit: ROBERTA_UPGRADE_FLAGS.counter,
                  roberta_display_crates: ROBERTA_UPGRADE_FLAGS.displays,
                  roberta_storefront_finish: ROBERTA_UPGRADE_FLAGS.storefront,
                };
                const completedFlag = recipeFlagMap[recipe.id];
                if (completedFlag) {
                  world.setFlag(completedFlag, true);
                }

                const allUpgradesComplete = world.getFlag(ROBERTA_UPGRADE_FLAGS.counter)
                  && world.getFlag(ROBERTA_UPGRADE_FLAGS.displays)
                  && world.getFlag(ROBERTA_UPGRADE_FLAGS.storefront);

                if (allUpgradesComplete) {
                  world.setFlag(ROBERTA_UPGRADE_FLAGS.complete, true);
                  world.setFlag('tide_trade_upgraded', true);
                  try { journal.setQuestStage('roberta_set_the_shop_right', 4); } catch {}
                } else {
                  try { journal.syncQuestProgress('roberta_set_the_shop_right'); } catch {}
                }
              }
            }}
          />
        );
      }
      case 'choiceEvent': {
        const eventId = useUIStore.getState().currentEventId as keyof typeof choiceEvents | null;
        if (!eventId || !(eventId in choiceEvents)) {
          return (
            <ChoiceEventScreen
              eventText={"An event occurs."}
              choices={[{ text: 'Continue', onSelect: () => setScreen('inGame') }]}
            />
          );
        }

        const cfg = choiceEvents[eventId];
        const closeChoiceEvent = () => {
          setEventResult(null);
          useUIStore.getState().setCurrentEventId(null);
          setScreen('inGame');
        };

        // RENDER EVENT RESULT IF EXISTS
        if (eventResult) {
            return (
                <ChoiceEventScreen
                    title={cfg.title}
                    imageUrl={cfg.imageUrl}
                    eventText={eventResult.text}
                    choices={eventResult.choices}
                />
            );
        }

        if (eventId === 'beryl_letter_pickup') {
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Take the letter',
                  variant: 'quest',
                  onSelect: () => {
                    useInventoryStore.getState().addItem('beryl_noble_letter', 1);
                    useWorldStateStore.getState().setFlag('beryl_letter_found', true);
                    useDiaryStore.getState().addInteraction('Picked up Crumpled Letter.');
                    setEventResult({
                        text: 'You picked up the crumpled letter. It seems to be from a noble house.',
                        choices: [{
                            text: 'Continue',
                            onSelect: () => {
                                useUIStore.getState().setCurrentEventId(null);
                                setScreen('inGame');
                            }
                        }]
                    });
                  },
                },
                {
                  text: 'Leave it',
                  onSelect: () => {
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
              ]}
            />
          );
        }

        if (eventId === 'forge_crate_note_pickup') {
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Take the note',
                  variant: 'quest',
                  onSelect: () => {
                    useInventoryStore.getState().addItem('marked_crate_note', 1);
                    useWorldStateStore.getState().setFlag('forge_crate_note_found', true);
                    try { useJournalStore.getState().setQuestStage('rebel_path', 3); } catch {}
                    useDiaryStore.getState().addInteraction('Picked up Marked Crate Note.');
                    setEventResult({
                      text: "The tally note lists marked crates moving from the forge to the Salty Mug cellar after dusk. Between this and Cyrus's prototype, Finn's route finally has a shape.",
                      choices: [{
                        text: 'Continue',
                        onSelect: () => {
                          useUIStore.getState().setCurrentEventId(null);
                          setScreen('inGame');
                        }
                      }]
                    });
                  },
                },
                {
                  text: 'Leave it',
                  onSelect: () => {
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
              ]}
            />
          );
        }

        if (eventId === 'intro_pastime_choice') {
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Train with Robert',
                  onSelect: () => {
                    useWorldStateStore.getState().setData('intro_pastime_choice', 'robert');
                    useUIStore.getState().setEventSlides(introRobertTrainingSlides);
                    useUIStore.getState().setCurrentEventId('intro_robert_training');
                    setScreen('event');
                  },
                },
                {
                  text: 'Look After the Younger Kids',
                  onSelect: () => {
                    useWorldStateStore.getState().setData('intro_pastime_choice', 'kids');
                    useUIStore.getState().setEventSlides(introKidsHelpingSlides);
                    useUIStore.getState().setCurrentEventId('intro_kids_helping');
                    setScreen('event');
                  },
                },
                {
                  text: 'Study Shenhaic',
                  onSelect: () => {
                    useWorldStateStore.getState().setData('intro_pastime_choice', 'study');
                    useUIStore.getState().setEventSlides(introStudyShenhaicSlides);
                    useUIStore.getState().setCurrentEventId('intro_study_shenhaic');
                    setScreen('event');
                  },
                },
              ]}
            />
          );
        }

        if (eventId === 'whitefang_binding_choice') {
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Give in to the pull',
                  variant: 'quest',
                  onSelect: () => {
                    useUIStore.getState().setEventSlides(whitefangBindingSlides);
                    useUIStore.getState().setCurrentEventId('whitefang_binding_accept');
                    setScreen('event');
                  },
                },
                {
                  text: 'Resist it',
                  onSelect: () => {
                    setEventResult(null);
                    useUIStore.getState().setCurrentEventId(null);
                    GameManagerService.resistWhiteFang();
                    useJournalStore.getState().completeQuest('white_fang_route');
                    useLocationStore.getState().setLocation('shihan_camp');
                    useUIStore.getState().setDialogueNpcId('npc_shihan_camp');
                    useWorldStateStore.getState().setFlag('shihan_camp_intro_seen', false);
                    setScreen('dialogue');
                  },
                },
              ]}
            />
          );
        }

        if (eventId === 'apple_tree_event') {
          const inventory = useInventoryStore.getState();
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Pick some apples',
                  onSelect: () => {
                    const qty = Math.floor(Math.random() * 3) + 1;
                    inventory.addItem('apple', qty);
                    const takeDamage = Math.random() < 0.3;
                    if (takeDamage) {
                       const damage = 5;
                       useCharacterStore.setState((state) => {
                           const newHp = Math.max(0, state.hp - damage);
                           if (newHp === 0) {
                                // If dead, show death message and trigger game over on continue
                                setEventResult({
                                    text: `You picked ${qty} apples, but fell from the tree! You took ${damage} damage and died.`,
                                    choices: [{
                                        text: 'End',
                                        onSelect: () => {
                                            useUIStore.getState().setEventSlides(gameOverSlides);
                                            useUIStore.getState().setCurrentEventId('game_over');
                                            setScreen('event');
                                        }
                                    }]
                                });
                           } else {
                                // If alive, show result and continue
                                setEventResult({
                                    text: `You picked ${qty} apples, but scratched yourself on a branch. You took ${damage} damage.`,
                                    choices: [{
                                        text: 'Continue',
                                        onSelect: () => {
                                            useUIStore.getState().setCurrentEventId(null);
                                            setScreen('inGame');
                                        }
                                    }]
                                });
                           }
                           return { hp: newHp };
                       });
                       useDiaryStore.getState().addInteraction(`Picked ${qty} apples but got scratched (-5 HP).`);
                    } else {
                      useDiaryStore.getState().addInteraction(`Picked ${qty} apples.`);
                      setEventResult({
                          text: `Success! You managed to pick ${qty} apples without any trouble.`,
                          choices: [{
                              text: 'Continue',
                              onSelect: () => {
                                  useUIStore.getState().setCurrentEventId(null);
                                  setScreen('inGame');
                              }
                          }]
                      });
                    }
                  },
                },
                {
                  text: 'Leave the tree alone',
                  onSelect: () => {
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
              ]}
            />
          );
        }



        if (eventId === 'fallen_log_event') {
          const inventory = useInventoryStore.getState();
          const hasAxe = inventory.getItemQuantity('axe_basic') > 0;
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Chop wood (Requires Axe)',
                  disabled: !hasAxe,
                  onSelect: () => {
                    const qty = Math.floor(Math.random() * 3) + 1; // 1-3 logs
                    inventory.addItem('log', qty);
                    useDiaryStore.getState().addInteraction(`Chopped ${qty} logs.`);
                    setEventResult({
                        text: `You used your axe to chop the fallen log. You gathered ${qty} logs.`,
                        choices: [{
                            text: 'Continue',
                            onSelect: () => {
                                useUIStore.getState().setCurrentEventId(null);
                                setScreen('inGame');
                            }
                        }]
                    });
                  },
                },
                {
                  text: 'Leave it be',
                  onSelect: () => {
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
              ]}
            />
          );
        }

        if (eventId === 'abandoned_campsite_event') {
          const inventory = useInventoryStore.getState();
          const character = useCharacterStore.getState();
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Search for supplies',
                  onSelect: () => {
                    // Random loot: Rope or Coins
                    if (Math.random() > 0.5) {
                         inventory.addItem('rope', 1);
                         useDiaryStore.getState().addInteraction('Found a rope at the campsite.');
                         setEventResult({
                             text: 'You searched the campsite and found a sturdy rope.',
                             choices: [{
                                 text: 'Continue',
                                 onSelect: () => {
                                     useUIStore.getState().setCurrentEventId(null);
                                     setScreen('inGame');
                                 }
                             }]
                         });
                    } else {
                         const coins = Math.floor(Math.random() * 10) + 5;
                         character.addCurrency('copper', coins);
                         useDiaryStore.getState().addInteraction(`Found ${coins} copper coins.`);
                         setEventResult({
                             text: `You searched the campsite and found ${coins} copper coins hidden in a pouch.`,
                             choices: [{
                                 text: 'Continue',
                                 onSelect: () => {
                                     useUIStore.getState().setCurrentEventId(null);
                                     setScreen('inGame');
                                 }
                             }]
                         });
                    }
                  },
                },
              ]}
            />
          );
        }

        if (eventId === 'slum_quiet_run' || eventId === 'slum_scrounged_copper' || eventId === 'slum_found_food') {
          const world = useWorldStateStore.getState();
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={world.getData('slum_explore_result_text') || cfg.text}
              choices={[
                {
                  text: 'Continue',
                  onSelect: () => {
                    world.setData('slum_explore_result_text', '');
                    world.setData('slum_explore_result_item', '');
                    world.setData('slum_explore_result_quantity', '');
                    closeChoiceEvent();
                  },
                },
              ]}
            />
          );
        }

        return (
          <ChoiceEventScreen
            eventText={"An event occurs."}
            choices={[{ text: 'Continue', onSelect: () => setScreen('inGame') }]}
          />
        );
      }
      case 'combat':
        return <CombatManager />;
      case 'combatVictory':
        const combatStore = useCombatStore.getState();
        const combatRewards = combatStore.rewards;
        const participants = combatStore.participants;
        const finnDefeated = participants.some(p => p.id.startsWith('finn_') && p.hp <= 0);

        return (
          <LootScreen 
            loot={combatRewards.loot} 
            onClose={() => {
              combatStore.endCombat();
              if (finnDefeated) {
                 useUIStore.getState().setEventSlides(rebelVictorySlides);
                 useUIStore.getState().setCurrentEventId('rebel_victory');
                 setScreen('event');
              } else {
                 setScreen('inGame');
                 useWorldTimeStore.getState().passTime(5);
              }
            }} 
          />
        );
      case 'debugMenu':
        const showDebug = import.meta.env.VITE_SHOW_DEBUG_MENU === 'true' || import.meta.env.DEV;
        return showDebug ? (
          <React.Suspense fallback={<div className="text-white">Loading Debug...</div>}>
            <DebugMenuScreen />
          </React.Suspense>
        ) : <MainMenu />;
      case 'combatDebug':
        return (
          <React.Suspense fallback={<div className="text-white">Loading Combat Debug...</div>}>
            <CombatDebugScreen />
          </React.Suspense>
        );
      default:
        return <MainMenu />;
    }
};

export default ScreenManager;

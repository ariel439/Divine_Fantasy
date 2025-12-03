import React, { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useShopStore } from '../stores/useShopStore';
import { GameManagerService } from '../services/GameManagerService'; // Import GameManagerService
import MainMenu from './screens/MainMenu';
import CharacterSelection from './screens/CharacterSelection';
import EventScreen from './screens/EventScreen';
import SleepWaitModal from './modals/SleepWaitModal';
import ConfirmationModal from './modals/ConfirmationModal';
import LocationScreen from './screens/LocationScreen';
import DialogueScreen from './screens/DialogueScreen';
import dialogueData from '../data/dialogue.json';
import npcsData from '../data/npcs.json';
import { DialogueService } from '../services/DialogueService';
import { useJournalStore } from '../stores/useJournalStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useJobStore } from '../stores/useJobStore';
import CharacterScreen from './screens/CharacterScreen';
import InventoryScreen from './screens/InventoryScreen';
import JobScreen from './screens/JobScreen';
import JournalScreen from './screens/JournalScreen';
import DiaryScreen from './screens/DiaryScreen';
import LibraryScreen from './screens/LibraryScreen';
import TradeScreen from './screens/TradeScreen';
import TradeConfirmationScreen from './screens/TradeConfirmationScreen';
import CraftingScreen from './screens/CraftingScreen';
import ChoiceEventScreen from './screens/ChoiceEventScreen';
import CombatScreen from './screens/CombatScreen';
import VictoryScreen from './screens/VictoryScreen';
import CompanionScreen from './screens/CompanionScreen';
import CombatManager from './CombatManager';
import LocationNav from './LocationNav';
import OptionsModal from './modals/OptionsModal';
import TutorialModal from './modals/TutorialModal';
import { lukePrologueSlides, playEventSlidesSarah, playEventSlidesRobert, wakeupEventSlides, finnDebtIntroSlides } from '../data';
import { useAudioStore } from '../stores/useAudioStore';

const Game: React.FC = () => {
  const { currentScreen, setScreen, shopId, activeModal, openModal, closeModal } = useUIStore();
  const ui = useUIStore();
  const { day, hour, minute, passTime } = useWorldTimeStore();
  const { getCurrentLocation, currentLocationId } = useLocationStore();
  const { loadShops } = useShopStore();
  const { musicEnabled, sfxEnabled, musicVolume, sfxVolume } = useAudioStore();

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sfxSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const shelfNodeRef = useRef<BiquadFilterNode | null>(null);
  
  

  // Initialize GameManagerService on component mount
  useEffect(() => {
    GameManagerService.init();
    loadShops();
  }, [loadShops]);

  useEffect(() => {
    if (!musicRef.current) {
      musicRef.current = new Audio('/assets/musics/Whisper of the Pines.mp3');
      musicRef.current.loop = true;
    }
    if (musicRef.current) {
      musicRef.current.volume = musicVolume;
      if (musicEnabled) {
        musicRef.current.play().catch(() => {});
      } else {
        musicRef.current.pause();
      }
    }
  }, [musicEnabled, musicVolume]);

  useEffect(() => {
    const loc = getCurrentLocation();
    let desiredSrc: string | undefined;
    let applyMuffle = false;
    if (currentScreen === 'inGame') {
      if (loc.id === 'salty_mug') {
        desiredSrc = '/assets/sfx/bar.mp3';
      } else if (loc.is_indoor) {
        desiredSrc = hour >= 6 && hour < 18 ? '/assets/sfx/coastal.mp3' : '/assets/sfx/waves.mp3';
        applyMuffle = true;
      } else if (new Set(['driftwatch', 'driftwatch_main_street', 'driftwatch_noble_quarter', 'driftwatch_docks', 'driftwatch_slums', 'mosswatch_keep']).has(loc.id)) {
        desiredSrc = hour >= 6 && hour < 18 ? '/assets/sfx/coastal.mp3' : '/assets/sfx/waves.mp3';
      }
    }

    const src = desiredSrc || (hour >= 6 && hour < 18 ? '/assets/sfx/coastal.mp3' : '/assets/sfx/waves.mp3');

    if (!sfxRef.current) {
      sfxRef.current = new Audio(src || '/assets/sfx/coastal.mp3');
      sfxRef.current.loop = true;
      if (!audioCtxRef.current) {
        try {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch {}
      }
      if (audioCtxRef.current && sfxRef.current && !sfxSourceRef.current) {
        try {
          sfxSourceRef.current = audioCtxRef.current.createMediaElementSource(sfxRef.current);
        } catch {}
      }
    }

    if (sfxRef.current) {
      sfxRef.current.volume = applyMuffle ? Math.max(0, Math.min(1, sfxVolume * 0.8)) : sfxVolume;
      if (desiredSrc && sfxEnabled) {
        if (sfxRef.current.src.indexOf(src) === -1) {
          sfxRef.current.src = src;
        }

        if (audioCtxRef.current && sfxSourceRef.current) {
          try {
            sfxSourceRef.current.disconnect();
          } catch {}
          if (applyMuffle) {
            if (!filterNodeRef.current && audioCtxRef.current) {
              filterNodeRef.current = audioCtxRef.current.createBiquadFilter();
              filterNodeRef.current.type = 'lowpass';
              filterNodeRef.current.frequency.value = 800;
              filterNodeRef.current.Q.value = 0.7;
            }
            if (!shelfNodeRef.current && audioCtxRef.current) {
              shelfNodeRef.current = audioCtxRef.current.createBiquadFilter();
              shelfNodeRef.current.type = 'highshelf';
              shelfNodeRef.current.frequency.value = 3000;
              shelfNodeRef.current.gain.value = -12;
            }
            if (filterNodeRef.current) {
              sfxSourceRef.current.connect(filterNodeRef.current);
              if (shelfNodeRef.current) {
                filterNodeRef.current.connect(shelfNodeRef.current);
                shelfNodeRef.current.connect(audioCtxRef.current.destination);
              } else {
                filterNodeRef.current.connect(audioCtxRef.current.destination);
              }
            } else {
              sfxSourceRef.current.connect(audioCtxRef.current.destination);
            }
          } else {
            sfxSourceRef.current.connect(audioCtxRef.current.destination);
          }
          try {
            audioCtxRef.current.resume();
          } catch {}
        }
        sfxRef.current.play().catch(() => {});
      } else {
        sfxRef.current.pause();
      }
    }
  }, [hour, sfxEnabled, sfxVolume, currentLocationId, currentScreen]);

  // Game clock logic
  useEffect(() => {
    const timerId = setInterval(() => {
      const store = useWorldTimeStore.getState();
      if (!store.clockPaused) {
        store.passTime(1);
      }
    }, 2000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const wt = useWorldTimeStore.getState();
    const modalOpen = Boolean(activeModal);
    const shouldPause = modalOpen || currentScreen === 'dialogue' || currentScreen !== 'inGame';
    wt.setClockPaused(shouldPause);
  }, [currentScreen, activeModal]);

  useEffect(() => {
    if (currentScreen === 'dialogue') {
      const npcId = useUIStore.getState().dialogueNpcId;
      if (npcId) {
        const ws = useWorldStateStore.getState();
        const flag = `greeted_${npcId}`;
        if (!ws.getFlag(flag)) {
          ws.setFlag(flag, true);
        }
        if (!ws.knownNpcs.includes(npcId)) {
          ws.addKnownNpc(npcId);
        }
      }
    }
  }, [currentScreen]);

  const buildInitialDialogue = (npcId: string) => {
    const npc = npcsData[npcId as keyof typeof npcsData];
    if (!npc) return null;
    // Choose alternate dialogue if quest is already active
    let dialogueId = npc.default_dialogue_id as keyof typeof dialogueData;
    const world = useWorldStateStore.getState();
    console.log('[Dialogue][build] npcId=', npcId);
    if (world.introMode) {
      if (npcId === 'npc_old_leo') dialogueId = 'old_leo_intro' as keyof typeof dialogueData;
      if (npcId === 'npc_sarah') dialogueId = 'sarah_intro' as keyof typeof dialogueData;
      if (npcId === 'npc_robert') dialogueId = 'robert_intro' as keyof typeof dialogueData;
    }
    if (npcId === 'npc_finn' && useWorldStateStore.getState().getFlag('finn_debt_intro_pending')) {
      dialogueId = 'finn_debt_intro' as keyof typeof dialogueData;
    }
    if (npcId === 'npc_roberta') {
      const robertaQuest = useJournalStore.getState().quests['roberta_planks_for_the_past'];
      if (robertaQuest && robertaQuest.active && !robertaQuest.completed) {
        dialogueId = 'roberta_planks_active' as keyof typeof dialogueData;
      } else if (robertaQuest && robertaQuest.completed) {
        dialogueId = 'roberta_planks_completed' as keyof typeof dialogueData;
      }
    }
    if (npcId === 'npc_boric') {
      const js = useJobStore.getState();
      const aj = js.activeJob;
      const greetedFlagBoric = 'greeted_npc_boric';
      const greeted = useWorldStateStore.getState().getFlag(greetedFlagBoric);
      console.log('[Dialogue][build] boric state', { greeted, activeJob: aj?.jobId, fired: Boolean(js.firedJobs && js.firedJobs['job_dockhand']) });
      if (aj?.jobId === 'job_dockhand') {
        dialogueId = 'boric_employee' as keyof typeof dialogueData;
      } else if (js.firedJobs && js.firedJobs['job_dockhand']) {
        dialogueId = 'boric_fired' as keyof typeof dialogueData;
      } else {
        if (!greeted) {
          dialogueId = 'boric_intro' as keyof typeof dialogueData;
        }
      }
    }
    console.log('[Dialogue][build] selected dialogueId=', dialogueId);
    const dialogue = dialogueData[dialogueId];
    if (!dialogue) return null;
    const firstNode = dialogue.nodes['0'];
    const greetedFlag = `greeted_${npcId}`;
    const shouldGreet = !useWorldStateStore.getState().getFlag(greetedFlag);
    console.log('[Dialogue][build] shouldGreet=', shouldGreet);
    const checkCondition = (condition?: string): boolean => {
      if (!condition || typeof condition !== 'string') return true;
      const parts = condition.split('&&').map(s => s.trim());
      const journal = useJournalStore.getState();
      const world = useWorldStateStore.getState();
      const diary = useDiaryStore.getState();
      for (const expr of parts) {
        let op = '==';
        if (expr.includes('>=')) op = '>=';
        else if (expr.includes('<=')) op = '<=';
        else if (expr.includes('>')) op = '>';
        else if (expr.includes('<')) op = '<';
        const [lhsRaw, rhsRaw] = expr.split(op).map(s => s.trim());
        const lhs = lhsRaw;
        const rhsNum = Number(rhsRaw);
        const rhsBool = rhsRaw === 'true' ? true : rhsRaw === 'false' ? false : undefined;
        if (lhs.startsWith('quest.')) {
          const [, questId, field] = lhs.split('.');
          const q = journal.quests[questId];
          if (field === 'active') {
            const val = q?.active || false;
            if (op !== '==' || rhsBool === undefined) return false;
            if (val !== rhsBool) return false;
          } else if (field === 'completed') {
            const val = q?.completed || false;
            if (op !== '==' || rhsBool === undefined) return false;
            if (val !== rhsBool) return false;
          } else if (field === 'stage') {
            const val = q?.currentStage ?? 0;
            if (op === '==') { if (val !== rhsNum) return false; }
            else if (op === '>=') { if (!(val >= rhsNum)) return false; }
            else if (op === '<=') { if (!(val <= rhsNum)) return false; }
            else if (op === '>') { if (!(val > rhsNum)) return false; }
            else if (op === '<') { if (!(val < rhsNum)) return false; }
          }
        } else if (lhs.startsWith('world_flags.')) {
          const flag = lhs.replace('world_flags.', '');
          const val = world.getFlag(flag);
          if (op !== '==' || rhsBool === undefined) return false;
          if (val !== rhsBool) return false;
        } else if (lhs.startsWith('relationship.')) {
          const npcId = lhs.replace('relationship.', '');
          const val = diary.relationships[npcId]?.friendship?.value || 0;
          if (op === '==') { if (val !== rhsNum) return false; }
          else if (op === '>=') { if (!(val >= rhsNum)) return false; }
          else if (op === '<=') { if (!(val <= rhsNum)) return false; }
          else if (op === '>') { if (!(val > rhsNum)) return false; }
          else if (op === '<') { if (!(val < rhsNum)) return false; }
        }
      }
      return true;
    };

    const mapChoices = (nodeId: string, visited: Set<string> = new Set()): any[] => {
      // Guard against cycles in dialogue graphs
      if (visited.has(nodeId)) return [];
      visited.add(nodeId);
      const node = dialogue.nodes[nodeId as keyof typeof dialogue.nodes];
      if (!node || !node.player_choices) return [];
      const filtered = node.player_choices.filter((choice: any) => {
        // Hide start_quest choices if quest already accepted or completed
        if (choice.action && typeof choice.action === 'string' && choice.action.startsWith('start_quest:')) {
          const questId = choice.action.split(':')[1];
          const existing = useJournalStore.getState().quests[questId];
          if (existing && (existing.active || existing.completed)) {
            return false;
          }
        }
        // Apply optional condition field if present
        if (choice.condition && !checkCondition(choice.condition)) {
          return false;
        }
        return true;
      });
      return filtered.map((choice: any) => {
        const nextNodeId = choice.next_node as string | undefined;
        const nextNode = nextNodeId ? dialogue.nodes[nextNodeId as keyof typeof dialogue.nodes] : undefined;
        return {
          text: choice.text,
          responseText: nextNodeId === '0' ? '' : nextNode?.npc_text,
          // Use a branched visited set per choice to avoid cross-branch pruning
          nextOptions: nextNodeId ? mapChoices(nextNodeId, new Set(visited)) : [],
          closesDialogue: Boolean(choice.closes_dialogue),
          onSelect: () => {
            if (choice.action) {
              const actionStr = String(choice.action);
              DialogueService.executeAction(actionStr);
            }
          },
        };
      });
    };
    const text = (() => {
      const idStr = String(dialogueId);
      if (idStr === 'finn_debt_intro') return firstNode.npc_text;
      if (npcId === 'npc_boric') return firstNode.npc_text;
      return shouldGreet ? `Hello. I'm ${npc.name}. ${firstNode.npc_text}` : firstNode.npc_text;
    })();
    return {
      text,
      options: mapChoices('0'),
    };
  };

  const renderScreen = () => {
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
              useWorldStateStore.getState().setIntroCompleted(true);
              useWorldStateStore.getState().setFlag('intro_completed', true);
              useWorldStateStore.getState().setIntroMode(false);
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
                useUIStore.getState().setDialogueNpcId('npc_finn');
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
        const npcId = useUIStore.getState().dialogueNpcId || 'npc_roberta';
        const npc = npcsData[npcId as keyof typeof npcsData];
        const built = buildInitialDialogue(npcId);
        const initial = { text: built?.text || '...', options: built?.options || [] };
        
        return (
          <DialogueScreen
            npcName={npc?.name || 'NPC'}
            npcPortraitUrl={npc?.portrait || '/assets/icons/DivineFantasy.png'}
            playerPortraitUrl={'/assets/portraits/luke.jpg'}
            initialDialogue={initial || { text: '...', options: [] }}
            onEndDialogue={() => {
              useUIStore.getState().setDialogueNpcId(null);
              try {
                const world = useWorldStateStore.getState();
                const lastNpcId = npcId;
                if (lastNpcId === 'npc_finn' && world.getFlag('finn_debt_intro_pending')) {
                  useWorldStateStore.getState().setFlag('finn_debt_intro_pending', false);
                }
                const loc = useLocationStore.getState().getCurrentLocation();
                if (world.introMode && loc.id === 'leo_lighthouse' && world.tutorialStep <= 2 && npcId === 'npc_old_leo') {
                  useWorldStateStore.getState().setTutorialStep(3);
                  try { useJournalStore.getState().setQuestStage('luke_tutorial', 4); } catch {}
                  // Ensure Roberta known + relationship applied if player selected her in intro
                  const spokeRoberta = world.getFlag('intro_spoke_roberta');
                  if (spokeRoberta) {
                    useWorldStateStore.getState().addKnownNpc('npc_roberta');
                    const current = useDiaryStore.getState().relationships['npc_roberta']?.friendship?.value || 0;
                    const delta = 20 - current;
                    useDiaryStore.getState().updateRelationship('npc_roberta', { friendship: delta });
                  }
                } else if (world.introMode && loc.id === 'leo_lighthouse' && world.tutorialStep === 5 && (npcId === 'npc_sarah' || npcId === 'npc_robert')) {
                  useWorldStateStore.getState().setTutorialStep(6);
                  try { useJournalStore.getState().setQuestStage('luke_tutorial', 6); } catch {}
                  const ui = useUIStore.getState();
                  if (npcId === 'npc_sarah') {
                    ui.setEventSlides(playEventSlidesSarah);
                    ui.setCurrentEventId('play_sarah');
                  } else {
                    ui.setEventSlides(playEventSlidesRobert);
                    ui.setCurrentEventId('play_robert');
                  }
                  useUIStore.getState().setScreen('event');
                }
              } catch {}
              const uiState = useUIStore.getState();
              if (uiState.currentEventId) {
                setScreen('event');
              } else {
                setScreen('inGame');
              }
            }}
          />
        );
      }
      case 'dialogueRoberta': {
        const npcId = 'npc_roberta';
        const npc = npcsData[npcId as keyof typeof npcsData];
        const initialFromService = DialogueService.startDialogue(npcId);
        const built = buildInitialDialogue(npcId);
        const initial = { text: built?.text || initialFromService?.npc_text || 'Welcome.', options: built?.options || [] };
        return (
          <DialogueScreen
            npcName={npc?.name || 'Roberta'}
            npcPortraitUrl={npc?.portrait || '/assets/portraits/Roberta.png'}
            playerPortraitUrl={'/assets/portraits/luke.jpg'}
            initialDialogue={initial || { text: 'Welcome.', options: [] }}
            onEndDialogue={() => {
              useUIStore.getState().setDialogueNpcId(null);
              setScreen('inGame');
            }}
          />
        );
      }
      case 'characterScreen':
        return <CharacterScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'jobScreen':
        return <JobScreen />;
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
            onClose={() => setScreen('inGame')}
            onCancel={() => setScreen('trade')}
            playerOffer={[]}
            merchantOffer={[]}
            tradeMode="idle"
          />
        );
      case 'crafting':
        return (
          <CraftingScreen
            onClose={() => setScreen('inGame')}
            initialSkill={useUIStore.getState().craftingSkill}
            onStartCrafting={(recipe, quantity) => {
              if (recipe.result.id === 'wooden_plank') {
                DialogueService.executeAction(`convert_logs_to_planks:${quantity}`);
              }
            }}
          />
        );
      case 'choiceEvent':
        return (
          <ChoiceEventScreen
            eventText={"An event occurs."}
            choices={[{ text: 'Continue', onSelect: () => setScreen('inGame') }]}
          />
        );
      case 'combat':
        return <CombatManager />;
      case 'combatVictory':
        return <VictoryScreen rewards={{ items: [], copper: 0 }} onContinue={() => setScreen('inGame')} />;
      case 'companion':
        return <CompanionScreen hasPet={false} />;
      default:
        return <MainMenu />;
    }
  };

  const isSolidBg = ['characterScreen', 'inventory', 'journal', 'diary', 'trade', 'crafting', 'jobScreen', 'library', 'companion'].includes(currentScreen);
  const isInGame = ['inGame', 'characterScreen', 'inventory', 'journal', 'diary', 'jobScreen', 'companion'].includes(currentScreen);

  useEffect(() => {
    const world = useWorldStateStore.getState();
    const npcId = useUIStore.getState().dialogueNpcId;
    if (currentScreen === 'dialogue' && world.introMode && npcId === 'npc_old_leo' && world.tutorialStep <= 2 && !world.seenLeoTutorial && activeModal !== 'tutorial') {
      openModal('tutorial');
    }
  }, [currentScreen, activeModal]);

  // (removed duplicate modal opener effect)



  const handleNavigate = (screen: any) => {
    setScreen(screen);
  };

  const handleOpenSleepWaitModal = (mode: 'sleep' | 'wait') => {
    ui.setSleepWaitMode(mode);
    useWorldTimeStore.getState().setClockPaused(true);
    openModal('sleepWait');
  };

  const handleOpenOptionsModal = () => {
    openModal('options');
  };

  const handleOpenSaveLoadModal = () => {
    // TODO: Implement save/load modal
    console.log('Open save/load modal');
  };

  return (
    <div className="fixed inset-0 overflow-hidden text-white bg-black font-sans">
      {/* Background and overlays */}
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          isSolidBg
            ? 'bg-zinc-900'
            : `bg-center bg-no-repeat ${currentScreen === 'mainMenu' || currentScreen === 'choiceEvent' ? 'animate-kenburns' : ''}`
        }`}
        style={
          isSolidBg
            ? {}
            : {
                backgroundImage: `url(${currentScreen === 'inGame'
                  ? getCurrentLocation().background
                  : (currentScreen === 'mainMenu' ? '/assets/portraits/MainMenu.png' : 'https://i.imgur.com/WsODuhO.png')
                })`,
                // Zoom slightly on wide screens, fill on others
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                // Fade edges to black by masking background (transparent reveals black root background)
                WebkitMaskImage: currentScreen === 'inGame' ? 'radial-gradient(130% 130% at 50% 50%, white 70%, transparent 100%)' : undefined,
                maskImage: currentScreen === 'inGame' ? 'radial-gradient(130% 130% at 50% 50%, white 70%, transparent 100%)' : undefined,
              }
        }
      ></div>
      <div className={`absolute inset-0 ${isSolidBg ? 'bg-black/60' : 'bg-black/40'} transition-all duration-700`}></div>
      <div className="relative z-10 w-full h-full">
        <div key={currentScreen} className="w-full h-full animate-fade-in">
          {renderScreen()}
        </div>
        {/* Global navigation for in-game screens */}
        {isInGame && (
          <LocationNav
            onNavigate={handleNavigate}
            variant={isSolidBg ? 'compact' : 'floating'}
            activeScreen={currentScreen}
            onOpenSleepWaitModal={handleOpenSleepWaitModal}
            showTimeControls={currentScreen === 'inGame'}
            onOpenOptionsModal={handleOpenOptionsModal}
            onOpenSaveLoadModal={handleOpenSaveLoadModal}
          />
        )}
        
        {activeModal === 'options' && (
          <OptionsModal isOpen={true} onClose={closeModal} />
        )}
        {activeModal === 'sleepWait' && (
          (() => {
            const world = useWorldStateStore.getState();
            const loc = useLocationStore.getState().getCurrentLocation();
          const isIntroSleep = world.introMode && world.tutorialStep === 6 && loc.id === 'orphanage_room';
            const currentSeconds = isIntroSleep ? (20 * 3600) : (useWorldTimeStore.getState().hour * 3600 + useWorldTimeStore.getState().minute * 60);
            const fixedDuration = isIntroSleep ? 12 : undefined;
            return (
              <SleepWaitModal
                isOpen={true}
                mode={ui.sleepWaitMode || 'wait'}
                sleepQuality={ui.sleepQuality ?? 1.0}
                currentTimeInSeconds={currentSeconds}
                fixedDuration={fixedDuration}
                onComplete={(hours) => {
                  console.log(`[SleepWait] complete mode=${ui.sleepWaitMode} hours=${fixedDuration ?? hours}`);
                  const worldState = useWorldStateStore.getState();
                  const currentLoc = useLocationStore.getState().getCurrentLocation();
                  if (ui.sleepWaitMode === 'sleep') {
                    const quality = ui.sleepQuality ?? 1.0;
                    const restore = (fixedDuration ?? hours) * 10 * quality;
                    useCharacterStore.setState((state) => ({ energy: Math.min(100, state.energy + Math.floor(restore)) }));
                  }
                if (isIntroSleep) {
                    useWorldTimeStore.setState({ hour: 8, minute: 0 });
                    useWorldStateStore.getState().setIntroCompleted(true);
                    useWorldStateStore.getState().setFlag('intro_completed', true);
                    useWorldStateStore.getState().setIntroMode(false);
                    useWorldTimeStore.setState({ year: 780 });
                    useLocationStore.getState().setLocation('salty_mug');
                    useWorldStateStore.getState().setFlag('finn_debt_intro_pending', true);
                    ui.setEventSlides(finnDebtIntroSlides);
                    ui.setCurrentEventId('finn_debt_intro');
                    try { useJournalStore.getState().completeQuest('luke_tutorial'); } catch {}
                    setScreen('event');
                  } else {
                    const durationMin = (fixedDuration ?? hours) * 60;
                    console.log(`[SleepWait] passTime ${durationMin}m`);
                    useWorldTimeStore.getState().passTime(durationMin);
                  }
                  useWorldTimeStore.getState().setClockPaused(false);
                  closeModal();
                }}
                onCancel={() => { useWorldTimeStore.getState().setClockPaused(false); closeModal(); }}
              />
            );
          })()
        )}
        {activeModal === 'confirmation' && (() => {
          const loc = getCurrentLocation();
          const { tutorialStep, introMode } = useWorldStateStore.getState();
          const isIntroSkip = introMode && loc.id === 'orphanage_room' && tutorialStep === 0;
          const message = isIntroSkip ? (
            <div>
              <p className="mb-2">Are you sure you want to skip the intro?</p>
              <p className="text-zinc-400 text-sm">You will start at the Salty Mug without receiving any intro rewards.</p>
            </div>
          ) : (
            <p>Are you sure?</p>
          );
          const onConfirm = () => {
            if (isIntroSkip) {
              useWorldTimeStore.setState({ hour: 8, minute: 0 });
              useWorldStateStore.getState().setIntroCompleted(true);
              useWorldStateStore.getState().setFlag('intro_completed', true);
              useWorldStateStore.getState().setIntroMode(false);
              useWorldTimeStore.setState({ year: 780 });
              useLocationStore.getState().setLocation('salty_mug');
              ui.setEventSlides(finnDebtIntroSlides);
              ui.setCurrentEventId('finn_debt_intro');
              try { useJournalStore.getState().completeQuest('luke_tutorial'); } catch {}
              setScreen('event');
            }
            useWorldTimeStore.getState().setClockPaused(false);
            closeModal();
          };
          const onCancel = () => {
            useWorldTimeStore.getState().setClockPaused(false);
            closeModal();
          };
          return (
            <ConfirmationModal
              isOpen={true}
              title={isIntroSkip ? 'Skip Intro' : undefined}
              message={message}
              onConfirm={onConfirm}
              onCancel={onCancel}
              confirmText={isIntroSkip ? 'Skip Intro' : 'Confirm'}
              cancelText={'Cancel'}
            />
          );
        })()}
        {activeModal === 'tutorial' && (() => {
          const loc = getCurrentLocation();
          const { tutorialStep } = useWorldStateStore.getState();
          let message = 'Follow the highlighted action to proceed.';
          if (loc.id === 'orphanage_room' && tutorialStep === 0) {
            message = 'Locations display the current time and weather, with available actions listed to the right. Please select the highlighted action to leave the room.';
          } else if (currentScreen === 'dialogue' && useUIStore.getState().dialogueNpcId === 'npc_old_leo' && tutorialStep <= 2) {
            message = 'Conversations present choices. Speak with Old Leo and select one starting path to begin your day.';
          }
          const handleClose = () => {
            const world = useWorldStateStore.getState();
            if (loc.id === 'orphanage_room' && world.tutorialStep === 0) {
              useWorldStateStore.getState().setSeenRoomTutorial(true);
            }
            if (currentScreen === 'dialogue' && useUIStore.getState().dialogueNpcId === 'npc_old_leo' && world.tutorialStep <= 2) {
              useWorldStateStore.getState().setSeenLeoTutorial(true);
            }
            closeModal();
          };
          const handleSkipIntro = () => {
            useWorldTimeStore.setState({ hour: 8, minute: 0 });
            useWorldStateStore.getState().setIntroCompleted(true);
            useWorldStateStore.getState().setFlag('intro_completed', true);
            useWorldStateStore.getState().setIntroMode(false);
            useWorldStateStore.getState().setFlag('finn_debt_intro_pending', true);
            useWorldTimeStore.setState({ year: 780 });
            useLocationStore.getState().setLocation('salty_mug');
            ui.setEventSlides(finnDebtIntroSlides);
            ui.setCurrentEventId('finn_debt_intro');
            try { useJournalStore.getState().completeQuest('luke_tutorial'); } catch {}
            setScreen('event');
            closeModal();
          };
          return (
            <TutorialModal isOpen={true} title="Tutorial" message={message} onClose={handleClose} secondaryActionText={loc.id === 'orphanage_room' && tutorialStep === 0 ? 'Skip Intro' : undefined} onSecondary={loc.id === 'orphanage_room' && tutorialStep === 0 ? handleSkipIntro : undefined} />
          );
        })()}
      </div>
    </div>
  );
};

export default Game;

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
import { useInventoryStore } from '../stores/useInventoryStore';
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
import { lukePrologueSlides, playEventSlidesSarah, playEventSlidesRobert, playEventSlidesKyle, wakeupEventSlides, finnDebtIntroSlides, robertCaughtSlides, backToLighthouseSlides } from '../data';
import { useAudioStore } from '../stores/useAudioStore';
import { useCompanionStore } from '../stores/useCompanionStore';

const Game: React.FC = () => {
  const { currentScreen, setScreen, shopId, activeModal, openModal, closeModal, dialogueNpcId } = useUIStore();
  const ui = useUIStore();
  const { day, hour, minute, passTime } = useWorldTimeStore();
  const { getCurrentLocation, currentLocationId } = useLocationStore();
  const { loadShops } = useShopStore();
  const { musicEnabled, sfxEnabled, musicVolume, sfxVolume } = useAudioStore();

  const [dialogueNode, setDialogueNode] = useState<any>(null);
  const [dialogueHistory, setDialogueHistory] = useState<any[]>([]);

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
        const spokeRoberta = world.getFlag('intro_spoke_roberta');
        if (spokeRoberta) {
          useWorldStateStore.getState().addKnownNpc('npc_roberta');
          const current = useDiaryStore.getState().relationships['npc_roberta']?.friendship?.value || 0;
          const delta = 20 - current;
          useDiaryStore.getState().updateRelationship('npc_roberta', { friendship: delta });
        }
      } else if (world.introMode && loc.id === 'leo_lighthouse' && world.tutorialStep === 5 && (npcId === 'npc_sarah' || npcId === 'npc_kyle')) {
        useWorldStateStore.getState().setTutorialStep(6);
        try { useJournalStore.getState().setQuestStage('luke_tutorial', 6); } catch {}
        const ui = useUIStore.getState();
        if (npcId === 'npc_sarah') {
          ui.setEventSlides(playEventSlidesSarah);
          ui.setCurrentEventId('play_sarah');
        } else {
          ui.setEventSlides(playEventSlidesKyle);
          ui.setCurrentEventId('play_kyle');
        }
        useUIStore.getState().setScreen('event');
      } else if (useUIStore.getState().currentEventId === 'kyle_smuggler_alert' && npcId === 'npc_kyle') {
        const uiState = useUIStore.getState();
        uiState.setCurrentEventId(null);
        useWorldTimeStore.setState({ hour: 22, minute: 0 });
        useLocationStore.getState().setLocation('driftwatch_docks');
        useCompanionStore.getState().setCompanion({
          id: 'npc_robert_companion',
          name: 'Robert',
          type: 'human',
          stats: { hp: 70, maxHp: 70, attack: 7, defence: 6, agility: 7 },
          equippedItems: [],
        });
        useWorldStateStore.getState().setFlag('smuggler_help_available', true);
      }
    } catch {}
    const uiState = useUIStore.getState();
    if (uiState.currentEventId) {
      setScreen('event');
    } else {
      setScreen('inGame');
    }
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
            useWorldStateStore.getState().setIntroMode(false);
            useWorldStateStore.getState().removeKnownNpc('npc_robert');
            useWorldStateStore.getState().setIntroCompleted(true);
            useWorldStateStore.getState().setFlag('intro_completed', true);
            try { useJournalStore.getState().completeQuest('luke_tutorial'); } catch {}
            useUIStore.getState().setDialogueNpcId('npc_finn');
            setScreen('dialogue');
            return;
          }
          if (id === 'smuggler_trap') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useLocationStore.getState().setLocation('driftwatch_docks');
            setScreen('inGame');
            return;
          }
          if (id === 'robert_caught') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useLocationStore.getState().setLocation('orphanage_room');
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
        }));

        return (
          <DialogueScreen
            npcName={npc?.name || 'NPC'}
            npcPortraitUrl={npc?.portrait || '/assets/icons/DivineFantasy.png'}
            playerPortraitUrl={'/assets/portraits/luke.jpg'}
            history={dialogueHistory}
            options={options}
            onOptionSelect={handleDialogueOption}
            onEndDialogue={handleEndDialogue}
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
        const eventId = useUIStore.getState().currentEventId;
        if (eventId === 'beryl_letter_pickup') {
           return (
             <ChoiceEventScreen
               title="Crumpled Letter"
               imageUrl="/assets/items/crumpled_letter.png"
               eventText="A crumpled letter lies in the puddle. It's soaked but legible."
               choices={[
                 { 
                   text: 'Take the letter', 
                   onSelect: () => {
                     useInventoryStore.getState().addItem('beryl_noble_letter', 1);
                     useWorldStateStore.getState().setFlag('beryl_letter_found', true);
                     useDiaryStore.getState().addInteraction('Picked up Crumpled Letter.');
                     useUIStore.getState().setCurrentEventId(null);
                     setScreen('inGame');
                   } 
                 }
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
    if (currentScreen === 'combat' && !world.getFlag('combat_tutorial_seen') && activeModal !== 'tutorial') {
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
                  : (currentScreen === 'mainMenu' ? '/assets/backgrounds/main_menu.png' : '/assets/backgrounds/minimal_bg.png')
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
            const isIntroSleep = world.introMode && (world.tutorialStep === 6 || world.tutorialStep === 7) && loc.id === 'orphanage_room';
            const currentSeconds = isIntroSleep ? (20 * 3600) : (useWorldTimeStore.getState().hour * 3600 + useWorldTimeStore.getState().minute * 60);
            const fixedDuration = isIntroSleep ? 10 : undefined;
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
                  if (useWorldStateStore.getState().getFlag('start_finn_debt_on_sleep')) {
                    useWorldStateStore.getState().setFlag('start_finn_debt_on_sleep', false);
                    useWorldTimeStore.setState({ hour: 8, minute: 0, year: 780 });
                    useLocationStore.getState().setLocation('salty_mug');
                    useWorldStateStore.getState().setFlag('finn_debt_intro_pending', true);
                    ui.setEventSlides(finnDebtIntroSlides);
                    ui.setCurrentEventId('finn_debt_intro');
                    setScreen('event');
                  } else if (isIntroSleep) {
                    useWorldTimeStore.setState({ hour: 6, minute: 0 });
                    useWorldStateStore.getState().setFlag('robert_smuggler_incident', true);
                    try { useJournalStore.getState().setQuestStage('luke_tutorial', 7); } catch {}
                    useLocationStore.getState().setLocation('leo_lighthouse');
                    ui.setCurrentEventId('kyle_smuggler_alert');
                    useUIStore.getState().setDialogueNpcId('npc_kyle');
                    setScreen('dialogue');
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
              useWorldStateStore.getState().removeKnownNpc('npc_robert');
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
          } else if (currentScreen === 'combat' && !useWorldStateStore.getState().getFlag('combat_tutorial_seen')) {
            message = 'In combat, select a target on the right, then press Attack.';
            useWorldStateStore.getState().setFlag('combat_tutorial_active', true);
          }
          const handleClose = () => {
            const world = useWorldStateStore.getState();
            if (loc.id === 'orphanage_room' && world.tutorialStep === 0) {
              useWorldStateStore.getState().setSeenRoomTutorial(true);
            }
            if (currentScreen === 'dialogue' && useUIStore.getState().dialogueNpcId === 'npc_old_leo' && world.tutorialStep <= 2) {
              useWorldStateStore.getState().setSeenLeoTutorial(true);
            }
            if (currentScreen === 'combat' && world.getFlag('combat_tutorial_active')) {
              useWorldStateStore.getState().setFlag('combat_tutorial_active', false);
              useWorldStateStore.getState().setFlag('combat_tutorial_seen', true);
            }
            closeModal();
          };
          const handleSkipIntro = () => {
            useWorldTimeStore.setState({ hour: 8, minute: 0 });
            useWorldStateStore.getState().setIntroCompleted(true);
            useWorldStateStore.getState().setFlag('intro_completed', true);
            useWorldStateStore.getState().setIntroMode(false);
            useWorldStateStore.getState().removeKnownNpc('npc_robert');
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

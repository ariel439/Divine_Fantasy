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
import DebugMenuScreen from './screens/DebugMenuScreen';
import CombatManager from './CombatManager';
import LocationNav from './LocationNav';
import OptionsModal from './modals/OptionsModal';
import TutorialModal from './modals/TutorialModal';
import { lukePrologueSlides, playEventSlidesSarah, playEventSlidesRobert, playEventSlidesKyle, wakeupEventSlides, finnDebtIntroSlides, robertCaughtSlides, choiceEvents } from '../data/events';
import { useAudioStore } from '../stores/useAudioStore';
import { useCompanionStore } from '../stores/useCompanionStore';

const Game: React.FC = () => {
  const { currentScreen, setScreen, shopId, activeModal, openModal, closeModal, dialogueNpcId } = useUIStore();
  const ui = useUIStore();
  const { day, hour, minute, passTime, weather } = useWorldTimeStore();
  const { getCurrentLocation, currentLocationId } = useLocationStore();
  const { loadShops } = useShopStore();
  const { musicEnabled, sfxEnabled, weatherEnabled, musicVolume, sfxVolume, weatherVolume } = useAudioStore();

  const [dialogueNode, setDialogueNode] = useState<any>(null);
  const [dialogueHistory, setDialogueHistory] = useState<any[]>([]);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackPathRef = useRef<string | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const currentSfxPathRef = useRef<string | null>(null);
  const weatherRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sfxSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const shelfNodeRef = useRef<BiquadFilterNode | null>(null);
  const weatherSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize GameManagerService on component mount
  useEffect(() => {
    GameManagerService.init();
    loadShops();
  }, [loadShops]);

  // Force specific weather during Intro Mode
  useEffect(() => {
    const handleIntroWeather = (introMode: boolean) => {
      if (introMode) {
        const charId = useCharacterStore.getState().characterId;
        // Logic for character-specific intro weather
        if (charId === 'fire_mage') {
             useWorldTimeStore.getState().setWeather('Sunny');
        } else {
             // Default (Luke) is Rainy
             useWorldTimeStore.getState().setWeather('Rainy');
        }
      }
    };

    const unsub = useWorldStateStore.subscribe((state) => {
      handleIntroWeather(state.introMode);
    });

    // Initial check
    handleIntroWeather(useWorldStateStore.getState().introMode);
    
    return unsub;
  }, []);

  // Music Logic
  useEffect(() => {
    let desiredMusicSrc = '/assets/musics/driftwatch_region.mp3'; // Default / Exploration

    if (currentScreen === 'mainMenu' || currentScreen === 'characterSelection') {
      desiredMusicSrc = '/assets/musics/Whisper of the Pines.mp3';
    } else if (currentScreen === 'combat') {
      desiredMusicSrc = '/assets/musics/combat_theme.mp3';
    } else if ((currentScreen === 'dialogue' || currentScreen === 'event') && currentTrackPathRef.current) {
      // Keep playing current music during dialogue/events
      desiredMusicSrc = currentTrackPathRef.current;
    }

    if (!musicRef.current) {
      musicRef.current = new Audio(desiredMusicSrc);
      musicRef.current.loop = true;
      currentTrackPathRef.current = desiredMusicSrc;
    }

    const audio = musicRef.current;
    
    // Change track if needed
    if (currentTrackPathRef.current !== desiredMusicSrc) {
        audio.src = desiredMusicSrc;
        currentTrackPathRef.current = desiredMusicSrc;
        if (musicEnabled) {
            audio.play().catch(() => {});
        }
    }

    // Apply a scaling factor to music volume so it's not too loud even at 100%
    // User sees 50%, code uses 0.5 * 0.4 = 0.2 actual volume
    audio.volume = musicVolume * 0.4; 
    
    if (musicEnabled) {
      if (audio.paused) audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [musicEnabled, musicVolume, currentScreen]);

  // Combined Audio Logic (Ambience & Weather & Muffling)
  useEffect(() => {
    // 1. Initialize Audio Context
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported');
      }
    }

    const ctx = audioCtxRef.current;

    // 2. Initialize Filters
    if (ctx) {
      if (!filterNodeRef.current) {
        filterNodeRef.current = ctx.createBiquadFilter();
        filterNodeRef.current.type = 'lowpass';
        filterNodeRef.current.frequency.value = 800;
        filterNodeRef.current.Q.value = 0.7;
      }
      if (!shelfNodeRef.current) {
        shelfNodeRef.current = ctx.createBiquadFilter();
        shelfNodeRef.current.type = 'highshelf';
        shelfNodeRef.current.frequency.value = 3000;
        shelfNodeRef.current.gain.value = -12;
      }
    }

    // 3. Initialize Audio Elements
    if (!sfxRef.current) {
      sfxRef.current = new Audio();
      sfxRef.current.loop = true;
    }
    if (!weatherRef.current) {
      weatherRef.current = new Audio('/assets/sfx/weather_rain.mp3');
      weatherRef.current.loop = true;
    }

    // 4. Initialize Sources
    if (ctx) {
      if (!sfxSourceRef.current && sfxRef.current) {
        try { sfxSourceRef.current = ctx.createMediaElementSource(sfxRef.current); } catch {}
      }
      if (!weatherSourceRef.current && weatherRef.current) {
        try { weatherSourceRef.current = ctx.createMediaElementSource(weatherRef.current); } catch {}
      }
    }

    // 5. Determine Logic
    // We use currentLocationId from store (via hook in component) to ensure reactivity
    const loc = useLocationStore.getState().getLocation(currentLocationId) || useLocationStore.getState().getCurrentLocation();
    
    // Muffle Logic
    // Indoor check: Use store property OR hardcoded list for fallback
    const isIndoor = loc.is_indoor || ['leo_lighthouse', 'orphanage_room', 'beryls_general_goods', 'kaelens_forge', 'grand_library', 'tide_trade', 'salty_mug', 'salty_mug_rented_room', 'herbalists_hovel'].includes(loc.id);
    
    // Apply muffle if indoor AND NOT in Main Menu or Combat
    // We want muffling in: inGame, dialogue, event, inventory, journal, diary, etc.
    const applyMuffle = isIndoor && currentScreen !== 'mainMenu' && currentScreen !== 'combat' && currentScreen !== 'characterSelection' && currentScreen !== 'prologue';

    // Debug Audio Logic
        console.log('Audio Debug:', { locId: loc.id, isIndoor, currentScreen, applyMuffle, weather });

    // 6. Routing
    if (ctx && filterNodeRef.current && shelfNodeRef.current) {
      const connectSource = (source: MediaElementAudioSourceNode | null) => {
        if (!source) return;
        try {
            source.disconnect();
        } catch {} // Ignore if not connected
        
        if (applyMuffle) {
          try { source.connect(filterNodeRef.current!); } catch {}
        } else {
          try { source.connect(ctx.destination); } catch {}
        }
      };

      connectSource(sfxSourceRef.current);
      connectSource(weatherSourceRef.current);

      // Connect filters chain
      try { filterNodeRef.current.disconnect(); } catch {}
      try { shelfNodeRef.current.disconnect(); } catch {}
      
      if (applyMuffle) {
        try {
            filterNodeRef.current.connect(shelfNodeRef.current);
            shelfNodeRef.current.connect(ctx.destination);
        } catch {}
      }
      
      if (ctx.state === 'suspended') ctx.resume();
    }

    // 7. Update Ambience Track
    let desiredSfxSrc: string | undefined;
    const ruralLocations = ['the_crossroads', 'homestead_farm', 'driftwatch_woods', 'hunters_cabin', 'sawmill'];
    const isRural = ruralLocations.includes(loc.id);

    // Determine base ambience
    if (currentScreen === 'inGame' || ['inventory', 'journal', 'diary', 'characterScreen', 'jobScreen', 'companion'].includes(currentScreen)) {
        if (loc.id === 'salty_mug') {
             desiredSfxSrc = '/assets/sfx/bar.mp3';
        } else if (isRural) {
             desiredSfxSrc = (hour >= 6 && hour < 18) ? '/assets/sfx/ambience_rural_day.mp3' : '/assets/sfx/ambience_rural_night.mp3';
        } else {
             desiredSfxSrc = (hour >= 6 && hour < 18) ? '/assets/sfx/coastal.mp3' : '/assets/sfx/waves.mp3';
        }
    } else if (['dialogue', 'event', 'choiceEvent'].includes(currentScreen)) {
         if (loc.id === 'salty_mug') {
             desiredSfxSrc = '/assets/sfx/bar.mp3';
         } else if (isRural) {
             desiredSfxSrc = (hour >= 6 && hour < 18) ? '/assets/sfx/ambience_rural_day.mp3' : '/assets/sfx/ambience_rural_night.mp3';
         } else {
             desiredSfxSrc = (hour >= 6 && hour < 18) ? '/assets/sfx/coastal.mp3' : '/assets/sfx/waves.mp3';
         }
    }

    const sfxAudio = sfxRef.current;
    if (sfxAudio) {
       sfxAudio.volume = applyMuffle ? Math.max(0, Math.min(1, sfxVolume * 0.3)) : sfxVolume * 0.5;
       
       if (desiredSfxSrc && sfxEnabled) {
          if (currentSfxPathRef.current !== desiredSfxSrc) {
             sfxAudio.src = desiredSfxSrc;
             currentSfxPathRef.current = desiredSfxSrc;
             sfxAudio.play().catch(() => {});
          } else if (sfxAudio.paused) {
             sfxAudio.play().catch(() => {});
          }
       } else {
          if (!sfxAudio.paused) sfxAudio.pause();
       }
    }

    // 8. Update Weather Track
    const weatherAudio = weatherRef.current;
    if (weatherAudio) {
        weatherAudio.volume = applyMuffle ? Math.max(0, Math.min(1, weatherVolume * 0.2)) : weatherVolume * 0.5;
        
        if (weatherEnabled && weather === 'Rainy') {
            if (weatherAudio.paused) weatherAudio.play().catch(() => {});
        } else {
            if (!weatherAudio.paused) weatherAudio.pause();
        }
    }

  }, [hour, sfxEnabled, sfxVolume, weatherEnabled, weatherVolume, weather, currentLocationId, currentScreen]);

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
      
      // Intro: Roberta at Lighthouse (Step 2 -> 3)
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
      } 
      // Intro: Sarah/Kyle at Lighthouse (Step 5 -> 6)
      else if (world.introMode && loc.id === 'leo_lighthouse' && world.tutorialStep === 5 && (npcId === 'npc_sarah' || npcId === 'npc_kyle')) {
        // Use setTimeout to avoid synchronous state conflicts
        setTimeout(() => {
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
            ui.setScreen('event');
        }, 50);
        return;
      }
      // Smuggler Event: Kyle Dialogue -> Help Robert
      else if (useUIStore.getState().currentEventId === 'kyle_smuggler_alert' && npcId === 'npc_kyle') {
        // Fix for "Help Robert" crash: Wrap in setTimeout
        setTimeout(() => {
            const uiState = useUIStore.getState();
            uiState.setCurrentEventId(null);
            useWorldTimeStore.setState({ hour: 22, minute: 0 });
            useLocationStore.getState().setLocation('driftwatch_docks');
            
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

        if (eventId === 'beryl_letter_pickup') {
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Take the letter',
                  onSelect: () => {
                    useInventoryStore.getState().addItem('beryl_noble_letter', 1);
                    useWorldStateStore.getState().setFlag('beryl_letter_found', true);
                    useDiaryStore.getState().addInteraction('Picked up Crumpled Letter.');
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
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
                  text: 'Pick some apples (1–3, small risk of injury)',
                  onSelect: () => {
                    const qty = Math.floor(Math.random() * 3) + 1;
                    inventory.addItem('apple', qty);
                    const takeDamage = Math.random() < 0.3;
                    if (takeDamage) {
                      useCharacterStore.setState((state) => ({
                        hp: Math.max(0, state.hp - 5),
                      }));
                    }
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
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

        if (eventId === 'rescue_wolf_choice') {
          const world = useWorldStateStore.getState();
          const companionStore = useCompanionStore.getState();
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Adopt the puppy',
                  onSelect: () => {
                    companionStore.setCompanion({
                      id: 'wolf_puppy',
                      name: 'Wolf Puppy',
                      type: 'wolf',
                      stats: { hp: 80, maxHp: 80, attack: 8, defence: 3, dexterity: 12 },
                      equippedItems: [],
                    });
                    world.setFlag('wolf_puppy_resolved', true);
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
                {
                  text: 'Kill the puppy',
                  onSelect: () => {
                    world.setFlag('wolf_puppy_resolved', true);
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
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
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
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
                    } else {
                         character.addCurrency('copper', Math.floor(Math.random() * 10) + 5);
                    }
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
                {
                  text: 'Rest for a while (+20 Energy)',
                  onSelect: () => {
                    useCharacterStore.setState((state) => ({ energy: Math.min(100, state.energy + 20) }));
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
                {
                  text: 'Leave',
                  onSelect: () => {
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
              ]}
            />
          );
        }

        if (eventId === 'hollow_stump_event') {
          const character = useCharacterStore.getState();
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Reach inside',
                  onSelect: () => {
                    if (Math.random() > 0.5) {
                        // Loot
                        character.addCurrency('copper', Math.floor(Math.random() * 15) + 5);
                    } else {
                        // Damage
                        useCharacterStore.setState((state) => ({ hp: Math.max(0, state.hp - 10) }));
                    }
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
                {
                  text: 'Leave it alone',
                  onSelect: () => {
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
              ]}
            />
          );
        }

        if (eventId === 'overgrown_path_event') {
          const inventory = useInventoryStore.getState();
          const world = useWorldStateStore.getState();
          const hasAxe = inventory.getItemQuantity('axe_basic') > 0;
          return (
            <ChoiceEventScreen
              title={cfg.title}
              imageUrl={cfg.imageUrl}
              eventText={cfg.text}
              choices={[
                {
                  text: 'Clear the path (Requires Axe)',
                  disabled: !hasAxe,
                  onSelect: () => {
                    world.setFlag('loc_cabin_unlocked', true);
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
                  },
                },
                {
                  text: 'Turn back',
                  onSelect: () => {
                    useUIStore.getState().setCurrentEventId(null);
                    setScreen('inGame');
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
        return <VictoryScreen rewards={{ items: [], copper: 0 }} onContinue={() => setScreen('inGame')} />;
      case 'companion':
        return <CompanionScreen hasPet={false} />;
      case 'debugMenu':
        return <DebugMenuScreen />;
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
                    const duration = fixedDuration ?? hours;
                    useCharacterStore.getState().sleep(duration, quality);
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
              useCharacterStore.setState({ hunger: 100 });
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
          }
          const handleClose = () => {
            const world = useWorldStateStore.getState();
            if (loc.id === 'orphanage_room' && world.tutorialStep === 0) {
              useWorldStateStore.getState().setSeenRoomTutorial(true);
            }
            if (currentScreen === 'dialogue' && useUIStore.getState().dialogueNpcId === 'npc_old_leo' && world.tutorialStep <= 2) {
              useWorldStateStore.getState().setSeenLeoTutorial(true);
            }
            if (currentScreen === 'combat') {
              // Mark tutorial as seen so it doesn't reopen
              useWorldStateStore.getState().setFlag('combat_tutorial_seen', true);
              // Ensure active flag is false so we don't get stuck state
              useWorldStateStore.getState().setFlag('combat_tutorial_active', false);
            }
            closeModal();
          };
          const handleSkipIntro = () => {
            useWorldTimeStore.setState({ hour: 8, minute: 0 });
            useCharacterStore.setState({ hunger: 100 });
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

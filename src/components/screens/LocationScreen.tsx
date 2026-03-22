import React, { useState, useEffect, useCallback } from 'react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';
import { useLocationStore } from '../../stores/useLocationStore';
import { useUIStore } from '../../stores/useUIStore';
import { useDiaryStore } from '../../stores/useDiaryStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { GameManagerService } from '../../services/GameManagerService';
import { NPCService } from '../../services/NPCService';
import { LocationService } from '../../services/LocationService';
import { Sun, Moon, MessageSquare, Hammer, Fish, MapPin, ShoppingCart, CookingPot, Bed, Search, Swords, Leaf, Snowflake, Sprout, Cloud, CloudRain, BookOpen, User, Package, Briefcase, Heart, Library, Zap, Award, Utensils, Clock } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import ActionButton from '../ui/ActionButton';
import WeatherParticles from '../effects/WeatherParticles';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import TimedActionModal from '../modals/TimedActionModal';
import ActionSummaryModal from '../modals/ActionSummaryModal';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useSkillStore } from '../../stores/useSkillStore';
import { useJobStore } from '../../stores/useJobStore';
import type { ActionSummary, Slide } from '../../types';
import { ExplorationService } from '../../services/ExplorationService';
import { mockBooks } from '../../data';
import locationsData from '../../data/locations.json';
import { breakfastEventSlides, playEventSlidesSarah, playEventSlidesRobert, playEventSlidesAlone, rebelRaidIntroSlides, sellLocketSlides, elaraDeliverySlides, berylDeliverySlides, benCheatEventSlides } from '../../data/events';
import { useToastStore } from '../../stores/useToastStore';

const LocationScreen: React.FC = () => {
  const { hp, maxHp, energy, hunger } = useCharacterStore();
  const { month, dayOfMonth, hour, getFormattedTime, getFormattedDate, getSeason, getWeather, temperatureC } = useWorldTimeStore();
  const { getCurrentLocation } = useLocationStore();
  const { setScreen } = useUIStore();
  const worldFlags = useWorldStateStore(state => state.worldFlags);

  const currentLocation = getCurrentLocation();
  const isNight = hour >= 18 || hour < 6;

  const timeString = getFormattedTime();
  const dateString = getFormattedDate();
  const firstDayOfWeekForMonth = ((month - 1) * 30) % 7; // 0=Sunday
  const weekdayIndex = (firstDayOfWeekForMonth + dayOfMonth - 1) % 7;
  const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const weekday = weekdayNames[weekdayIndex];

  const season = getSeason();
  const weather = getWeather();

  const worldState = useWorldStateStore.getState();
  const introMode = worldState.introMode;
  const tutorialStep = worldState.tutorialStep;
  
  const dynamicNpcs = NPCService.getPresentNPCs(currentLocation.id);

  // Travel state
  const [travelModalOpen, setTravelModalOpen] = useState(false);
  const [travelProgressModalOpen, setTravelProgressModalOpen] = useState(false);
  const [pendingTravelAction, setPendingTravelAction] = useState<any>(null);
  const [travelProgress, setTravelProgress] = useState<any>(null);
  const [pendingTravelMinutes, setPendingTravelMinutes] = useState<number | null>(null);

  // Skilling (Woodcutting/Fishing)
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [pendingSkillAction, setPendingSkillAction] = useState<any>(null);
  const [skillProgress, setSkillProgress] = useState<any>(null);
  const [selectedSkillHours, setSelectedSkillHours] = useState<number>(1);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<ActionSummary | null>(null);
  const [encounterModalOpen, setEncounterModalOpen] = useState(false);
  const [pendingEncounter, setPendingEncounter] = useState<any>(null);
  const [jobEnergyModalOpen, setJobEnergyModalOpen] = useState(false);
  const [jobEnergyMessage, setJobEnergyMessage] = useState<React.ReactNode>('');
  const [exploreProgressModalOpen, setExploreProgressModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const seasonIcons = {
    Spring: Sprout,
    Summer: Sun,
    Autumn: Leaf,
    Winter: Snowflake,
  };
  const SeasonIcon = seasonIcons[season];

  const getWeatherDisplay = () => {
    let weatherText: string = weather;
    let WeatherIcon: React.FC<{ size: number; className?: string }> = Sun;

    switch (weather) {
      case 'Sunny':
        weatherText = isNight ? 'Clear' : 'Sunny';
        WeatherIcon = isNight ? Moon : Sun;
        break;
      case 'Cloudy':
        WeatherIcon = Cloud;
        break;
      case 'Rainy':
        WeatherIcon = CloudRain;
        break;
      case 'Snowy':
        WeatherIcon = Snowflake;
        break;
    }

    const getIconColor = () => {
      if (isNight && weather !== 'Rainy' && weather !== 'Snowy') return "text-sky-200";
      switch(weather) {
        case 'Sunny': return "text-yellow-300";
        case 'Cloudy': return "text-zinc-300";
        case 'Rainy': return "text-blue-300";
        case 'Snowy': return "text-cyan-200";
        default: return "text-yellow-300";
      }
    };

    const temp = Math.round(temperatureC);
    return { temp, weatherText, WeatherIcon: <WeatherIcon size={22} className={getIconColor()} /> };
  };

  const { temp, weatherText, WeatherIcon } = getWeatherDisplay();

  const berylSecretMeetingSlides: Slide[] = [
    {
      text: "The main street is quiet under the moonlight until you hear a sob from an alleyway. Peeking around, you spot Beryl receiving a crumpled letter from a ragged urchin. He reads it in despair, pays the child, then crushes the letter and throws it into a puddle before storming back inside.",
      image: "/assets/events/beryl_secret_meeting.png"
    }
  ];

  useEffect(() => {
    if (!introMode) return;
    const loc = useLocationStore.getState().getCurrentLocation();
    if (loc.id === 'orphanage_room' && tutorialStep === 0 && !useWorldStateStore.getState().seenRoomTutorial) {
      useUIStore.getState().openModal('tutorial');
    }
  }, [introMode, tutorialStep, currentLocation.id]);

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'dialogue':
        useUIStore.getState().setDialogueNpcId(action.target);
        setScreen('dialogue');
        break;
      case 'trigger_event': {
        const eventId = action.eventId;
        if (eventId === 'beryl_secret_meeting') {
          useUIStore.getState().setEventSlides(berylSecretMeetingSlides);
          useUIStore.getState().setCurrentEventId('beryl_secret_meeting');
          setScreen('event');
        } else if (eventId === 'beryl_letter_pickup') {
          useUIStore.getState().setCurrentEventId('beryl_letter_pickup');
          setScreen('choiceEvent');
        } else if (eventId === 'smuggler_combat_start') {
          GameManagerService.startSmugglerCombat();
        } else if (eventId === 'raid_salty_mug') {
          useUIStore.getState().setEventSlides(rebelRaidIntroSlides);
          useUIStore.getState().setCurrentEventId('raid_salty_mug_intro');
          setScreen('event');
        } else if (eventId === 'elara_delivery_event') {
          useInventoryStore.getState().removeItem('elara_medicine_parcel', 1);
          useWorldStateStore.getState().setFlag('elara_delivery_done', true);
          useUIStore.getState().setEventSlides(elaraDeliverySlides);
          useUIStore.getState().setCurrentEventId('elara_delivery_slides');
          setScreen('event');
        } else if (eventId === 'beryl_delivery_event') {
          useInventoryStore.getState().removeItem('beryl_noble_parcel', 1);
          useWorldStateStore.getState().setFlag('beryl_delivery_done', true);
          useUIStore.getState().setEventSlides(berylDeliverySlides);
          useUIStore.getState().setCurrentEventId('beryl_delivery_slides');
          setScreen('event');
        } else if (eventId === 'ben_cheat_event') {
          useWorldStateStore.getState().setFlag('ben_cheat_done', true);
          useUIStore.getState().setEventSlides(benCheatEventSlides);
          useUIStore.getState().setCurrentEventId('ben_cheat_slides');
          setScreen('event');
        } else if (eventId === 'sell_locket_event') {
          useUIStore.getState().setEventSlides(sellLocketSlides);
          useUIStore.getState().setCurrentEventId('sell_locket_event');
          setScreen('event');
        } else if (eventId === 'slum_night_roam') {
          useWorldTimeStore.getState().passTime(15);
          const roll = Math.random();
          if (roll < 0.28) {
            useUIStore.getState().setCurrentEventId('slum_thug_ambush');
            setScreen('choiceEvent');
          } else if (roll < 0.42) {
            useUIStore.getState().setCurrentEventId('slum_knife_thug_ambush');
            setScreen('choiceEvent');
          } else if (roll < 0.62) {
            const foundCopper = Math.floor(Math.random() * 7) + 3;
            useCharacterStore.getState().addCurrency('copper', foundCopper);
            useDiaryStore.getState().addInteraction(`You work the alleys and come away with ${foundCopper} copper.`);
            useToastStore.getState().addToast(`You scrounge up ${foundCopper} copper in the dark.`, 'success', 2600, 'Street Luck');
          } else if (roll < 0.78) {
            const hungerLoss = Math.random() < 0.5 ? 1 : 2;
            useCharacterStore.getState().updateStats({ hunger: -hungerLoss });
            useDiaryStore.getState().addInteraction('You drift through the slums, hear scraps of rumor, and learn nothing you can sell.');
            useToastStore.getState().addToast('You hear rumors, but nothing useful comes of them.', 'info', 2600, 'Loose Talk');
          } else {
            useDiaryStore.getState().addInteraction('You work the alleys for a while and keep your head low. Nothing breaks your way tonight.');
            useToastStore.getState().addToast('Nothing comes of the alley run tonight.', 'info', 2600, 'Quiet Night');
          }
        } else {
          useUIStore.getState().setCurrentEventId(eventId);
          setScreen('choiceEvent');
        }
        break;
      }
      case 'craft': {
        const skill = action.target === 'craft_basic' ? 'Crafting' : 'Carpentry';
        useUIStore.getState().setCraftingSkill(skill);
        setScreen('crafting');
        break;
      }
      case 'cook': {
        useUIStore.getState().setCraftingSkill('Cooking');
        setScreen('crafting');
        break;
      }
      case 'library': {
        useUIStore.getState().setLibraryBooks(mockBooks);
        useUIStore.getState().setSelectedLibraryBookId(null);
        useUIStore.getState().setLibraryReturnScreen('inGame');
        setScreen('library');
        break;
      }
      case 'fish':
        setPendingSkillAction(action);
        setSkillProgress(null);
        setSkillModalOpen(true);
        break;
      case 'woodcut':
        setPendingSkillAction(action);
        setSkillProgress(null);
        setSkillModalOpen(true);
        break;
      case 'explore': {
        const debugInfiniteEnergy = import.meta.env.DEV && useWorldStateStore.getState().getFlag('debug_infinite_energy');
        if (!debugInfiniteEnergy && useCharacterStore.getState().energy < 20) {
          setJobEnergyMessage('You are too tired to explore.');
          setJobEnergyModalOpen(true);
          break;
        }

        setIsProcessing(true);
        setExploreProgressModalOpen(true);
        setTimeout(() => {
          setIsProcessing(false);
          setExploreProgressModalOpen(false);
          useWorldTimeStore.getState().passTime(30);
          if (!debugInfiniteEnergy) {
            useCharacterStore.setState(s => ({ 
              energy: Math.max(0, s.energy - 20),
              hunger: Math.max(0, s.hunger - 1)
            }));
          }

          const result = ExplorationService.explore(currentLocation.id);
          ExplorationService.processResult(result);

          if (result.type === 'combat' && result.data && result.data.wolfCount) {
            if (currentLocation.id === 'driftwatch_woods') {
              const wolfCount = result.data.wolfCount;
              const enemies = result.data.enemies && result.data.enemies.length > 0
                ? result.data.enemies
                : [`${wolfCount}x Forest Wolf`];

              const encounter = {
                type: 'combat' as const,
                description: result.description,
                enemies,
                wolfCount
              };

              setPendingEncounter(encounter);
              setEncounterModalOpen(true);
            } else {
              GameManagerService.startWoodsCombat(result.data.wolfCount);
            }
          } else if (result.type === 'unique' && result.data?.eventId) {
            let eventId = result.data.eventId;
            if (eventId === 'rescue_wolf') {
              eventId = 'rescue_wolf_choice';
            } else if (eventId === 'apple_tree') {
              eventId = 'apple_tree_event';
            }
            useUIStore.getState().setCurrentEventId(eventId);
            setSummaryModalOpen(false);
            setSummaryData(null);
            setScreen('choiceEvent');
          } else {
            const summary: ActionSummary = {
              title: result.title,
              description: result.description,
              image: result.image,
              durationInMinutes: 30,
              vitalsChanges: debugInfiniteEnergy ? [] : [{ vital: 'Energy', change: -5, icon: <Zap size={20} className="text-blue-300"/> }],
              rewards: (result.type === 'item' || result.type === 'resource') && result.data?.itemId
                ? [{ name: result.data.itemId, quantity: result.data.quantity || 1 }] 
                : []
            };
            setSummaryData(summary);
            setSummaryModalOpen(true);
          }
        }, 1000);
        break;
      }
      case 'job': {
        const js = useJobStore.getState();
        js.loadJobs();
        const active = js.activeJob;
        if (!active || active.jobId !== action.target) {
          setScreen('jobScreen');
          break;
        }
        const job = js.jobs[active.jobId];
        if (!job || job.locationId !== currentLocation.id) {
          setScreen('jobScreen');
          break;
        }
        const energyAvail = useCharacterStore.getState().energy;
        const minEnergy = Math.min(30, job.energyCost / 2);
        if (energyAvail < minEnergy) {
          setJobEnergyMessage(
            <div>
              <p className="mb-2">You don’t have enough energy to start this shift.</p>
              <p className="text-zinc-300">Required: <strong>{minEnergy}</strong> Energy • Current: <strong>{energyAvail}</strong> Energy</p>
              <p className="mt-2 text-zinc-400">Sleep or eat to recover, then try again.</p>
            </div>
          );
          setJobEnergyModalOpen(true);
          break;
        }
        const outcome = js.workShift();
        if (!outcome) {
          const t = useWorldTimeStore.getState();
          const todayKey = `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.dayOfMonth).padStart(2, '0')}`;
          const hiredToday = active.hiredOn === todayKey;
          const summary: ActionSummary = {
            title: hiredToday ? 'Starts Tomorrow' : 'Missed Shift',
            durationInMinutes: 0,
            vitalsChanges: [],
            rewards: [{ name: 'No Pay', quantity: 0 }],
          } as any;
          setSummaryData(summary);
          setSummaryModalOpen(true);
          break;
        }
        const summary: ActionSummary = {
          title: outcome.status === 'insufficient' ? 'Too Tired' : outcome.status === 'exhausted' ? 'Exhausted' : (outcome.status === 'late' ? 'Late Shift' : 'Worked Shift'),
          durationInMinutes: outcome.minutesWorked,
          vitalsChanges: outcome.energySpent ? [{ vital: 'Energy', change: -outcome.energySpent }] : [],
          rewards: [{ name: 'Copper', quantity: outcome.payCopper }],
        };
        setSummaryData(summary);
        setSummaryModalOpen(true);
        break;
      }
      case 'tutorial_lunch': {
        useWorldTimeStore.getState().passTime(60);
        useWorldStateStore.getState().setTutorialStep(5);
        break;
      }
      case 'tutorial_breakfast': {
        useWorldTimeStore.getState().passTime(30);
        useCharacterStore.setState({ hunger: 100 });
        useWorldStateStore.getState().setTutorialStep(5);
        try { useJournalStore.getState().setQuestStage('luke_tutorial', 5); } catch {}
        useUIStore.getState().setEventSlides(breakfastEventSlides);
        useUIStore.getState().setCurrentEventId('breakfast');
        setScreen('event');
        break;
      }
      case 'tutorial_play_sarah': {
        useDiaryStore.getState().updateRelationship('npc_sarah', { friendship: 10 });
        useWorldStateStore.getState().setTutorialStep(5);
        useUIStore.getState().setEventSlides(playEventSlidesSarah);
        useUIStore.getState().setCurrentEventId('play_sarah');
        setScreen('event');
        break;
      }
      case 'tutorial_play_robert': {
        useDiaryStore.getState().updateRelationship('npc_robert', { friendship: 0 });
        useWorldStateStore.getState().setTutorialStep(5);
        useUIStore.getState().setEventSlides(playEventSlidesRobert);
        useUIStore.getState().setCurrentEventId('play_robert');
        setScreen('event');
        break;
      }
      case 'tutorial_play_alone': {
        useWorldStateStore.getState().setFlag('played_midday', true);
        useWorldStateStore.getState().setTutorialStep(6);
        try { useJournalStore.getState().setQuestStage('luke_tutorial', 6); } catch {}
        useUIStore.getState().setEventSlides(playEventSlidesAlone);
        useUIStore.getState().setCurrentEventId('play_alone');
        setScreen('event');
        break;
      }
      case 'tutorial_sleep': {
        const step = useWorldStateStore.getState().tutorialStep;
        if (step === 6) {
          useWorldStateStore.getState().setFlag('robert_smuggler_incident', true);
          useJournalStore.getState().setQuestStage('luke_tutorial', 7);
          useWorldStateStore.getState().setTutorialStep(7);
          useWorldTimeStore.setState({ hour: 20, minute: 0 });
          useUIStore.getState().setSleepWaitMode('sleep');
          useWorldTimeStore.getState().setClockPaused(true);
          useUIStore.getState().setSleepQuality(1.0);
          useUIStore.getState().openModal('sleepWait');
        } else if (step === 7) {
          const currentTime = useWorldTimeStore.getState();
          if (currentTime.hour < 20) {
            useWorldTimeStore.setState({ hour: 20, minute: 0 });
          }
          useUIStore.getState().setSleepWaitMode('sleep');
          useWorldTimeStore.getState().setClockPaused(true);
          useUIStore.getState().setSleepQuality(1.0);
          useUIStore.getState().openModal('sleepWait');
        } else {
          useWorldTimeStore.getState().setClockPaused(true);
          useUIStore.getState().openModal('confirmation');
        }
        break;
      }
      case 'sleep': {
        useUIStore.getState().setSleepWaitMode('sleep');
        const target = String(action.target || '');
        let quality = 1.0;
        if (target === 'sleep_floor') quality = 0.5;
        if (target === 'sleep_bed') quality = 1.0;
        useUIStore.getState().setSleepQuality(quality);
        useWorldTimeStore.getState().setClockPaused(true);
        useUIStore.getState().openModal('sleepWait');
        break;
      }
      case 'shop': {
        const shopId = action.target;
        useUIStore.getState().setShopId(shopId);
        useUIStore.getState().setScreen('trade');
        break;
      }
      case 'rescue_wolf': {
        useUIStore.getState().setCurrentEventId('rescue_wolf_choice');
        setScreen('choiceEvent');
        break;
      }
      case 'end_intro': {
        useCharacterStore.setState((state) => ({ ...state, hunger: 20 }));
        useWorldStateStore.getState().setIntroCompleted(true);
        useWorldStateStore.getState().setFlag('intro_completed', true);
        useWorldStateStore.getState().setIntroMode(false);
        useWorldStateStore.getState().removeKnownNpc('npc_robert');
        useWorldTimeStore.setState({ year: 780 });
        useLocationStore.getState().setLocation('salty_mug');
        GameManagerService.applyMainGameStoryVitals();
        useWorldStateStore.getState().setFlag('finn_debt_intro_pending', true);
        useUIStore.getState().setEventSlides(rebelRaidIntroSlides); // Corrected to use a placeholder or relevant slides
        useUIStore.getState().setCurrentEventId('finn_debt_intro');
        try { useJournalStore.getState().completeQuest('luke_tutorial'); } catch {}
        setScreen('event');
        break;
      }
      case 'use': {
        if (action.target === 'repair_wall') {
          const journal = useJournalStore.getState();
          const questId = 'roberta_planks_for_the_past';
          const q = journal.quests[questId];
          const inventory = useInventoryStore.getState();
          const planks = inventory.getItemQuantity('wooden_plank');
          const nails = inventory.getItemQuantity('iron_nails');
          const hammer = inventory.getItemQuantity('hammer');

          if (q && q.active && !q.completed && (q.currentStage ?? 0) === 3) {
            if (planks >= 10 && nails >= 20 && hammer >= 1) {
              const removedPlanks = inventory.removeItem('wooden_plank', 10);
              const removedNails = inventory.removeItem('iron_nails', 20);
              
              if (removedPlanks && removedNails) {
                journal.setQuestStage(questId, 4);
                useWorldStateStore.getState().setFlag('tide_trade_wall_repaired', true);

                const summary: ActionSummary = {
                  title: 'Wall Repaired',
                  durationInMinutes: 30,
                  vitalsChanges: [{ vital: 'Energy', change: -10, icon: <Zap size={20} className="text-blue-300"/> }],
                  expended: [
                    { name: 'Wooden Plank', quantity: 10, icon: <Package size={20} className="text-zinc-300"/> },
                    { name: 'Iron Nails', quantity: 20, icon: <Package size={20} className="text-zinc-300"/> }
                  ],
                  rewards: [{ name: 'Wall Fixed', quantity: 1, icon: <Hammer size={20} className="text-green-300"/> }],
                };
                setSummaryData(summary);
                setSummaryModalOpen(true);
              }
            } else {
              const missing = [];
              if (planks < 10) missing.push(`${10 - planks} more Planks`);
              if (nails < 20) missing.push(`${20 - nails} more Nails`);
              if (hammer < 1) missing.push('a Hammer');
              
              setJobEnergyMessage(
                <div>
                  <p className="mb-2">You don't have the required materials/tools.</p>
                  <p className="text-zinc-400">Missing: {missing.join(', ')}</p>
                </div>
              );
              setJobEnergyModalOpen(true);
            }
          }
        }
        break;
      }
      case 'navigate': {
        const targetId = action.target;
        
        if (!LocationService.isLocationOpen(targetId)) {
          const name = LocationService.getLocationName(targetId);
          useToastStore.getState().addToast(`${name} is currently closed.`, 'warning');
          break;
        }

        if (action.time_cost && action.time_cost > 0) {
          setPendingTravelAction(action);
          setTravelModalOpen(true);
        } else {
          useLocationStore.getState().setLocation(targetId);
          if (introMode && targetId === 'leo_lighthouse' && tutorialStep === 0) {
            useWorldStateStore.getState().setTutorialStep(1);
          }
          if (introMode && targetId === 'orphanage_room' && tutorialStep === 6) {
            useWorldStateStore.getState().setTutorialStep(7);
          }
          setPendingTravelAction(null);
        }
        break;
      }
      default:
        console.log('Action not implemented:', action);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'dialogue': return <MessageSquare size={20} className="text-sky-300" />;
      case 'shop': return <ShoppingCart size={20} className="text-yellow-300" />;
      case 'fish': return <Fish size={20} className="text-orange-400" />;
      case 'woodcut': return <Leaf size={20} className="text-orange-400" />;
      case 'craft': return <Hammer size={20} className="text-orange-300" />;
      case 'cook': return <CookingPot size={20} className="text-amber-400" />;
      case 'job': return <Briefcase size={20} className="text-orange-400" />;
      case 'library': return <BookOpen size={20} className="text-zinc-300" />;
      case 'sleep': case 'tutorial_sleep': return <Bed size={20} className="text-zinc-300" />;
      case 'navigate': return <MapPin size={20} className="text-green-300" />;
      default: return <Search size={20} className="text-zinc-300" />;
    }
  };

  const getActionCategory = (type: string) => {
    switch (type) {
      case 'dialogue': return 'dialogue';
      case 'shop': return 'commerce';
      case 'fish': case 'job': case 'woodcut': case 'craft': case 'cook': return 'action';
      case 'library': case 'sleep': case 'tutorial_sleep': return 'explore';
      case 'navigate': return 'travel';
      default: return 'explore';
    }
  };

  const handleConfirmTravel = () => {
    if (!pendingTravelAction) return;

    let modifiedTimeCost = pendingTravelAction.time_cost || 0;
    let weatherModifier = 1;

    switch (weather) {
      case 'Rainy': weatherModifier = 1.5; break;
      case 'Snowy': weatherModifier = 2; break;
    }

    modifiedTimeCost *= weatherModifier;
    setTravelModalOpen(false);

    if (modifiedTimeCost > 0) {
      useWorldTimeStore.getState().setClockPaused(true);
      setTravelProgressModalOpen(true);
      const world = useWorldTimeStore.getState();
      const startSeconds = world.hour * 3600 + world.minute * 60;
      const totalSeconds = modifiedTimeCost * 60;
      setPendingTravelMinutes(modifiedTimeCost);
      setTravelProgress({ currentTime: 0, totalTime: totalSeconds, startTime: startSeconds });
    } else {
      useLocationStore.getState().setLocation(pendingTravelAction.target);
      setPendingTravelAction(null);
      setPendingTravelMinutes(null);
    }
  };

  const handleCancelTravel = () => {
    setTravelModalOpen(false);
    setPendingTravelAction(null);
  };

  const handleTimedActionClose = useCallback(() => {
    if (!pendingTravelAction) {
      useWorldTimeStore.getState().setClockPaused(false);
      setTravelProgressModalOpen(false);
      setTravelProgress(null);
      return;
    }
    if (pendingTravelAction) {
      useLocationStore.getState().setLocation(pendingTravelAction.target);
      const minutes = pendingTravelMinutes ?? (pendingTravelAction.time_cost || 0);
      useWorldTimeStore.getState().passTime(Math.round(minutes));
    }
    useWorldTimeStore.getState().setClockPaused(false);
    setTravelProgressModalOpen(false);
    setPendingTravelAction(null);
    setTravelProgress(null);
    setPendingTravelMinutes(null);
  }, [pendingTravelAction, pendingTravelMinutes]);

  const calculateSkillPreview = useCallback((hours: number) => {
    if (!pendingSkillAction) return { energyCost: 0, rewardsSummary: '' };
    const totalMinutes = hours * 60;
    if (pendingSkillAction.type === 'woodcut') {
      const iterations = Math.floor(totalMinutes / 30);
      const energyCost = iterations * 10;
      const rewardsSummary = `${iterations} logs, ${iterations * 30} Woodcutting XP`;
      return { energyCost, rewardsSummary };
    }
    if (pendingSkillAction.type === 'fish') {
      const iterations = Math.floor(totalMinutes / 20);
      const energyCost = iterations * 5;
      const loc = pendingSkillAction.target;
      const rewardsSummary = loc === 'fish_docks'
        ? `~${iterations} casts; Sardines scale with Fishing level`
        : `~${iterations} casts; Trout (lvl 5+), Pike (lvl 7+); lower catch rate`;
      return { energyCost, rewardsSummary };
    }
    return { energyCost: 0, rewardsSummary: '' };
  }, [pendingSkillAction]);

  const handleStartSkilling = useCallback((hours: number) => {
    setSelectedSkillHours(hours);
    const world = useWorldTimeStore.getState();
    useWorldTimeStore.getState().setClockPaused(true);
    setSkillProgress({ currentTime: 0, totalTime: hours * 3600, startTime: world.hour * 3600 + world.minute * 60 });
  }, []);

  const handleSkillCancel = useCallback(() => {
    useWorldTimeStore.getState().setClockPaused(false);
    setSkillModalOpen(false);
    setSkillProgress(null);
    setPendingSkillAction(null);
  }, []);

  const handleSkillClose = useCallback(() => {
    if (!pendingSkillAction) {
      setSkillModalOpen(false);
      setSkillProgress(null);
      return;
    }

    const totalMinutes = selectedSkillHours * 60;
    const expended: ActionSummary['expended'] = [];
    const rewards: ActionSummary['rewards'] = [];

    const inventory = useInventoryStore.getState();
    const skills = useSkillStore.getState();

    const applyEnergyCost = (cost: number) => {
      useCharacterStore.setState((state) => ({ energy: Math.max(0, state.energy - cost) }));
      expended!.push({ name: 'Energy', quantity: cost, icon: <Zap size={20} className="text-blue-300"/> });
    };

    const applyHungerCost = (minutes: number) => {
        const cost = Math.floor(4 * (minutes / 60));
        if (cost > 0) {
            useCharacterStore.setState((state) => ({ hunger: Math.max(0, state.hunger - cost) }));
        }
    };

    const addReward = (name: string, quantity: number, icon?: React.ReactElement) => {
      rewards.push({ name, quantity, icon: icon || <Award size={20} className="text-yellow-300"/> });
    };

    const hasTool = (toolId: string) => inventory.getItemQuantity(toolId) > 0;

    if (pendingSkillAction.type === 'woodcut') {
      if (!hasTool('axe_basic')) {
        setSummaryData({ title: 'Missing Tool', durationInMinutes: 0, vitalsChanges: [], expended: [], rewards: [] });
        setSummaryModalOpen(true);
        useWorldTimeStore.getState().setClockPaused(false);
        setSkillModalOpen(false);
        setSkillProgress(null);
        setPendingSkillAction(null);
        return;
      }
      const iterations = Math.floor(totalMinutes / 30);
      const energyCost = iterations * 10;
      applyEnergyCost(energyCost);
      applyHungerCost(totalMinutes);

      let logsAdded = 0;
      for (let i = 0; i < iterations; i++) {
        if (inventory.addItem('log', 1)) {
          logsAdded += 1;
          skills.addXp('woodcutting', 30);
        } else {
          skills.addXp('woodcutting', 5);
        }
      }
      if (logsAdded > 0) addReward('Logs', logsAdded, <Package size={20} className="text-amber-600"/>);
    } else if (pendingSkillAction.type === 'fish') {
      if (!hasTool('fishing_rod')) {
        setSummaryData({ title: 'Missing Tool', durationInMinutes: 0, vitalsChanges: [], expended: [], rewards: [] });
        setSummaryModalOpen(true);
        useWorldTimeStore.getState().setClockPaused(false);
        setSkillModalOpen(false);
        setSkillProgress(null);
        setPendingSkillAction(null);
        return;
      }
      const iterations = Math.floor(totalMinutes / 20);
      const energyCost = iterations * 5;
      applyEnergyCost(energyCost);
      applyHungerCost(totalMinutes);

      let sardines = 0;
      let trout = 0;
      let pike = 0;
      const fishingLevel = skills.getSkillLevel('fishing');
      for (let i = 0; i < iterations; i++) {
        const roll = Math.random();
        if (pendingSkillAction.target === 'fish_docks') {
          const sardineChance = fishingLevel >= 7 ? 0.75 : fishingLevel >= 5 ? 0.7 : fishingLevel >= 3 ? 0.65 : 0.6;
          if (roll < sardineChance) {
            if (inventory.addItem('fish_sardine', 1)) { sardines += 1; skills.addXp('fishing', 15); }
            else { skills.addXp('fishing', 2); }
          } else { skills.addXp('fishing', 2); }
        } else {
          if (roll < 0.35) {
            if (fishingLevel >= 5) {
                if (inventory.addItem('fish_trout', 1)) { trout += 1; skills.addXp('fishing', 15); }
                else { skills.addXp('fishing', 5); }
            } else { skills.addXp('fishing', 5); }
          } else if (roll < 0.45) {
            if (fishingLevel >= 7) {
              if (inventory.addItem('fish_pike', 1)) { pike += 1; skills.addXp('fishing', 40); }
              else { skills.addXp('fishing', 10); }
            } else { skills.addXp('fishing', 10); }
          } else { skills.addXp('fishing', 5); }
        }
      }
      if (sardines > 0) addReward('Sardines', sardines, <Fish size={20} className="text-blue-400"/>);
      if (trout > 0) addReward('Trout', trout, <Fish size={20} className="text-orange-400"/>);
      if (pike > 0) addReward('Pike', pike, <Fish size={20} className="text-zinc-400"/>);
    }

    useWorldTimeStore.getState().passTime(totalMinutes);
    useWorldTimeStore.getState().setClockPaused(false);

    const title = pendingSkillAction.type === 'woodcut' ? 'Woodcutting Complete' : 'Fishing Complete';
    setSummaryData({ title, durationInMinutes: totalMinutes, vitalsChanges: [], expended, rewards });
    setSummaryModalOpen(true);

    setSkillModalOpen(false);
    setSkillProgress(null);
    setPendingSkillAction(null);
  }, [pendingSkillAction, selectedSkillHours]);

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden">
      {/* Weather Particles (outdoor only) */}
      {(!currentLocation.is_indoor) && <WeatherParticles weather={weather} />}

      {/* 1. Header Area (7vh) - Stats & Time/Weather */}
      <header className="relative z-20 w-full h-[7vh] min-h-[56px] px-8 flex justify-between items-center border-b border-zinc-800/50 backdrop-blur-xl shrink-0 bg-zinc-950/50">
        {/* Left: Vitals (HP, Energy, Hunger) */}
        <div className="flex items-center gap-6 w-1/3">
          <div className="flex items-center gap-3 w-40">
            <Heart size={14} className="text-red-500 shrink-0" />
            <ProgressBar label="" value={Math.floor(hp)} max={Math.floor(maxHp)} colorClass="bg-red-500" variant="weight" showText={false} />
          </div>
          <div className="flex items-center gap-3 w-40">
            <Zap size={14} className="text-blue-500 shrink-0" />
            <ProgressBar label="" value={Math.floor(energy)} max={100} colorClass="bg-blue-500" variant="weight" showText={false} />
          </div>
          <div className="flex items-center gap-3 w-40">
            <Utensils size={14} className="text-orange-500 shrink-0" />
            <ProgressBar label="" value={Math.floor(hunger)} max={100} colorClass="bg-orange-500" variant="weight" showText={false} />
          </div>
        </div>

        {/* Center: Location Name */}
        <div className="text-center w-1/3">
          <h1 className="text-xl font-bold text-white tracking-[0.3em] uppercase truncate" style={{ fontFamily: 'Cinzel, serif' }}>
            {currentLocation.name}
          </h1>
        </div>

        {/* Right: Time, Date, Weather */}
        <div className="flex items-center justify-end gap-6 w-1/3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-white font-black text-xs tracking-widest">
              <Clock size={14} className="text-zinc-400" />
              {timeString}
            </div>
            <div className="text-[9px] font-black uppercase tracking-tighter text-zinc-500">
              {weekday}, {dateString}
            </div>
          </div>
          
          <div className="h-8 w-px bg-zinc-800/50" />

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-white font-black text-xs tracking-widest uppercase">
                {WeatherIcon}
                {weatherText}
              </div>
              <div className="text-[9px] font-black uppercase tracking-tighter text-zinc-500 flex items-center gap-1">
                <SeasonIcon size={10} />
                {season} • {temp}°C
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area (86vh) - Immersion & Actions */}
      <main className="relative z-10 w-full h-[86vh] flex flex-col lg:flex-row gap-8 p-6 lg:p-12 items-end justify-end overflow-hidden">
        {/* Right Side: Actions Panel (Floating Card) */}
        <div className="w-full lg:w-[400px] xl:w-[450px] h-full lg:h-full animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="bg-zinc-950/50 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 shadow-2xl flex flex-col h-full overflow-hidden bg-gradient-to-b from-zinc-950/40 to-zinc-950/60">
            {/* Top glass accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />
            
            <div className="overflow-y-auto flex-grow pr-2 space-y-3 custom-scrollbar mt-2">
              {dynamicNpcs.map((npc) => (
                <ActionButton
                  key={`dynamic-${npc.id}`}
                  onClick={() => handleAction(npc)}
                  category="dialogue"
                  icon={<MessageSquare size={20} className="text-sky-300" />}
                  text={npc.text}
                />
              ))}
              {currentLocation.actions
                .slice()
                .sort((a: any, b: any) => {
                  const getPriority = (action: any) => {
                    if (action.type === 'navigate') return 5;
                    if (action.type === 'dialogue') return 4;
                    if (action.type === 'shop') return 3;
                    if (['job', 'craft', 'woodcut', 'fish'].includes(action.type)) return 2;
                    return 1;
                  };
                  const pA = getPriority(a);
                  const pB = getPriority(b);
                  if (pA !== pB) return pA - pB;
                  if (a.type === 'navigate' && b.type === 'navigate') {
                    const isAHub = a.target === 'driftwatch' || /Hub/i.test(a.text);
                    const isBHub = b.target === 'driftwatch' || /Hub/i.test(b.text);
                    if (isAHub && !isBHub) return 1;
                    if (!isAHub && isBHub) return -1;
                  }
                  return 0;
                })
                .filter((action: any) => {
                  // NEW: Filter out navigation to closed shops
                  if (action.type === 'navigate') {
                    if (!LocationService.isLocationOpen(action.target)) return false;
                  }

                  if (action.type === 'job') {
                    const js = useJobStore.getState();
                    const activeJob = js.activeJob;
                    if (!activeJob) return false;
                    const job = js.jobs[activeJob.jobId];
                    if (!job) return false;
                    if (currentLocation.id !== job.locationId) return false;
                    if (action.target !== activeJob.jobId) return false;
                    const t = useWorldTimeStore.getState();
                    const firstDow = ((t.month - 1) * 30) % 7;
                    const weekday = (firstDow + t.dayOfMonth - 1) % 7;
                    if (weekday === 0 || weekday === 6) return false;
                    const todayKey = `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.dayOfMonth).padStart(2, '0')}`;
                    if (activeJob.hiredOn === todayKey) return false;
                    const now = t.hour * 60 + t.minute;
                    const start = job.schedule.startHour * 60;
                    const graceEnd = start + job.schedule.lateGracePeriodHours * 60;
                    const preWindowStart = Math.max(0, start - 60);
                    return (now >= preWindowStart && now <= graceEnd);
                  }
                  return true;
                })
                .filter((action: any) => {
                  const condition = action.condition;
                  if (!condition) return true;
                  const parts = String(condition).split('&&').map(s => s.trim());
                  const journal = useJournalStore.getState();
                  const world = useWorldStateStore.getState();
                  const timeStore = useWorldTimeStore.getState();
                  const inventory = useInventoryStore.getState();

                  for (const expr of parts) {
                    let operator = '==';
                    let lhs = expr;
                    let rhsRaw = 'true';

                    if (expr.includes('==')) { [lhs, rhsRaw] = expr.split('=='); }
                    else if (expr.includes('!=')) { [lhs, rhsRaw] = expr.split('!='); operator = '!='; }
                    else if (expr.includes('>=')) { [lhs, rhsRaw] = expr.split('>='); operator = '>='; }
                    else if (expr.includes('<=')) { [lhs, rhsRaw] = expr.split('<='); operator = '<='; }
                    else if (expr.includes('>')) { [lhs, rhsRaw] = expr.split('>'); operator = '>'; }
                    else if (expr.includes('<')) { [lhs, rhsRaw] = expr.split('<'); operator = '<'; }

                    lhs = lhs.trim();
                    rhsRaw = rhsRaw ? rhsRaw.trim() : 'true';
                    const rhsBool = rhsRaw === 'true' ? true : rhsRaw === 'false' ? false : undefined;
                    const rhsNum = rhsBool === undefined ? Number(rhsRaw) : undefined;
                    let actualValue: any = undefined;
                    let targetValue: any = rhsBool !== undefined ? rhsBool : rhsNum;

                    if (lhs.startsWith('quest.')) {
                      const [, questId, field] = lhs.split('.');
                      const q = journal.quests[questId];
                      if (field === 'active') actualValue = q?.active || false;
                      else if (field === 'completed') actualValue = q?.completed || false;
                      else if (field === 'stage') actualValue = q?.currentStage ?? 0;
                    } else if (lhs.startsWith('world_flags.')) {
                      const flag = lhs.replace('world_flags.', '');
                      actualValue = world.getFlag(flag);
                    } else if (lhs.startsWith('inventory.')) {
                      const itemId = lhs.split('.')[1];
                      actualValue = inventory.getItemQuantity(itemId);
                    } else if (lhs.startsWith('has_item:')) {
                      const itemId = lhs.split(':')[1];
                      actualValue = inventory.getItemQuantity(itemId) > 0;
                      if (operator === '==' && rhsRaw === 'true') targetValue = true;
                    } else if (lhs === 'time.is_day') {
                      actualValue = timeStore.hour >= 6 && timeStore.hour < 18;
                    } else if (lhs === 'time.is_night') {
                      actualValue = timeStore.hour < 6 || timeStore.hour >= 18;
                    } else if (lhs === 'time.hour_lt') {
                       actualValue = timeStore.hour;
                       operator = '<';
                    } else if (lhs === 'time.hour_gte') {
                       actualValue = timeStore.hour;
                       operator = '>=';
                    } else if (lhs === 'time.hour') {
                        actualValue = timeStore.hour;
                    } else if (lhs === 'time.weekday') {
                      const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                      const firstDow = ((timeStore.month - 1) * 30) % 7;
                      const weekday = (firstDow + timeStore.dayOfMonth - 1) % 7;
                      actualValue = names[weekday];
                      targetValue = rhsRaw;
                    } else if (lhs.startsWith('relationship.')) {
                        const npcId = lhs.split('.')[1];
                        const rel = useDiaryStore.getState().relationships[npcId];
                        actualValue = rel?.friendship?.value || 0;
                    }

                    if (actualValue === undefined) continue;
                    let result = false;
                    switch (operator) {
                        case '==': result = actualValue === targetValue; break;
                        case '!=': result = actualValue !== targetValue; break;
                        case '>': result = actualValue > targetValue; break;
                        case '<': result = actualValue < targetValue; break;
                        case '>=': result = actualValue >= targetValue; break;
                        case '<=': result = actualValue <= targetValue; break;
                    }
                    if (!result) return false;
                  }
                  return true;
                })
                .filter((action: any) => {
                  if (!introMode) return !String(action.type).startsWith('tutorial_') && action.type !== 'end_intro';
                  
                  const locId = currentLocation.id;
                  const world = useWorldStateStore.getState();

                  // 🛡️ INTRO FIREWALL: Strict action filtering for the Year 775 tutorial
                  switch (locId) {
                    case 'orphanage_room':
                      if (tutorialStep === 0) return action.type === 'navigate' && action.target === 'leo_lighthouse';
                      if (tutorialStep === 6 || tutorialStep === 7) return action.type === 'tutorial_sleep';
                      return false;

                    case 'leo_lighthouse':
                      if (tutorialStep <= 2) return action.type === 'dialogue' && action.target === 'npc_old_leo';
                      if (tutorialStep === 3) return action.type === 'tutorial_breakfast';
                      if (tutorialStep === 5) return (action.type === 'dialogue' && (action.target === 'npc_sarah' || action.target === 'npc_kyle')) || action.type === 'tutorial_play_alone';
                      if (tutorialStep === 6) return (action.type === 'navigate' && action.target === 'orphanage_room');
                      return false;

                    case 'driftwatch_main_street':
                      // Only allow moving to Docks (for the quest) or back to Lighthouse
                      return action.type === 'navigate' && (action.target === 'driftwatch_docks' || action.target === 'leo_lighthouse');

                    case 'driftwatch_docks':
                      // If the smuggler event is active, you MUST help Robert. 
                      // No wandering off to Tide & Trade or the Hub as a child.
                      const combatAvailable = world.getFlag('smuggler_help_available');
                      if (combatAvailable) {
                        return action.type === 'trigger_event' && action.eventId === 'smuggler_combat_start';
                      }
                      // After the fight, you can leave back to the main Hub area
                      return action.type === 'navigate' && action.target === 'driftwatch';

                    case 'beryls_general_goods':
                    case 'kaelens_forge':
                      // In case the player wanders into shops, only allow leaving
                      return action.type === 'navigate' && action.target === 'driftwatch_main_street';

                    default:
                      // Block all other locations during intro
                      return false;
                  }
                })
                .map((action: any, index: number) => {
                  let highlight = false;
                  if (introMode) {
                    const locId = currentLocation.id;
                    if (locId === 'orphanage_room') { highlight = true; } 
                    else if (locId === 'leo_lighthouse') {
                      if (tutorialStep <= 2) highlight = true;
                      else if (tutorialStep === 3) highlight = true;
                      else if (tutorialStep === 5) highlight = (action.type === 'dialogue' && (action.target === 'npc_sarah' || action.target === 'npc_kyle')) || action.type === 'tutorial_play_alone';
                      else if (tutorialStep === 6) highlight = (action.type === 'navigate' && action.target === 'orphanage_room');
                    } else if (locId === 'orphanage_room') {
                      if (tutorialStep === 6 || tutorialStep === 7) highlight = action.type === 'tutorial_sleep';
                    } else if (locId === 'driftwatch_docks') {
                      if (action.eventId === 'smuggler_combat_start') highlight = true;
                    }
                  }
                  return (
                    <ActionButton
                      key={index}
                      onClick={() => handleAction(action)}
                      category={highlight ? 'highlighted' : getActionCategory(action.type)}
                      icon={getActionIcon(action.type)}
                      text={action.text}
                      highlight={highlight}
                    />
                  );
                })}
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer Spacer (7vh) - To match other screens and clear LocationNav */}
      <footer className="relative z-20 w-full h-[7vh] min-h-[56px] shrink-0 pointer-events-none" />

      {/* Overlays & Modals */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>

      {/* Travel Confirmation Modal */}
      <ConfirmationModal
        isOpen={travelModalOpen}
        title="Confirm Travel"
        message={
          <div>
            <p className="mb-2">Are you sure you want to travel to this location?</p>
            {pendingTravelAction && (
              <div className="mt-4 p-3 bg-zinc-800 rounded-lg">
                <p className="text-sm text-zinc-300 mb-1">
                  <strong>Destination:</strong> {pendingTravelAction.text.replace('Travel to ', '')}
                </p>
                {pendingTravelAction.time_cost > 0 && (
                  <p className="text-sm text-zinc-300">
                    <strong>Time Cost:</strong> {pendingTravelAction.time_cost * (weather === 'Rainy' ? 1.5 : weather === 'Snowy' ? 2 : 1)} minutes
                  </p>
                )}
                {(weather === 'Rainy' || weather === 'Snowy') && (
                  <p className="text-sm text-amber-400 mt-2">
                    Travel will be slower due to {weather.toLowerCase()} conditions.
                  </p>
                )}
                {pendingTravelAction.time_cost === 0 && (
                  <p className="text-sm text-green-300">
                    <strong>Instant Travel</strong> - No time cost
                  </p>
                )}
              </div>
            )}
          </div>
        }
        onConfirm={handleConfirmTravel}
        onCancel={handleCancelTravel}
        confirmText="Travel"
        cancelText="Cancel"
      />

      {/* Travel Progress Modal */}
      <TimedActionModal
        key={travelProgress?.startTime ?? 'travel'}
        isOpen={travelProgressModalOpen}
        actionName="Traveling..."
        progress={travelProgress}
        onClose={handleTimedActionClose}
      />

      {/* Skilling Setup / Progress Modal */}
      <TimedActionModal
        isOpen={skillModalOpen}
        actionName={pendingSkillAction?.type === 'woodcut' ? 'Woodcutting' : pendingSkillAction?.type === 'fish' ? 'Fishing' : 'Action'}
        maxDuration={Math.max(1, Math.min(12, Math.floor(energy / (pendingSkillAction?.type === 'woodcut' ? 20 : 15))))}
        calculatePreview={calculateSkillPreview}
        onStart={handleStartSkilling}
        onCancel={handleSkillCancel}
        progress={skillProgress}
        onClose={handleSkillClose}
        currentEnergy={energy}
      />

      {exploreProgressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-zinc-950 rounded-xl border border-zinc-700 shadow-2xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
              Exploring...
            </h2>
            <p className="text-zinc-300 mb-4">
              You venture deeper into the area, keeping an eye out for anything unusual.
            </p>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 explore-progress-bar"></div>
            </div>
            <style>{`
              @keyframes exploreProgress {
                from { width: 0%; }
                to { width: 100%; }
              }
              .explore-progress-bar {
                width: 0%;
                animation: exploreProgress 1s linear forwards;
              }
            `}</style>
          </div>
        </div>
      )}

      {encounterModalOpen && pendingEncounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-zinc-950 rounded-xl border border-zinc-700 shadow-2xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
              Encounter
            </h2>
            <div className="text-zinc-300 leading-relaxed mb-4">
              <p className="mb-3">{pendingEncounter.description}</p>
              {pendingEncounter.enemies && pendingEncounter.enemies.length > 0 && (
                <div className="bg-zinc-800 rounded-lg p-3">
                  <p className="text-sm text-zinc-400 mb-2">You will face:</p>
                  <ul className="space-y-1">
                    {pendingEncounter.enemies.map((enemy: string, index: number) => (
                      <li key={index} className="text-red-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full" />
                        {enemy}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEncounterModalOpen(false);
                  GameManagerService.startWoodsCombat(pendingEncounter?.wolfCount);
                  setPendingEncounter(null);
                }}
                className="px-5 py-2 text-sm font-semibold tracking-wide text-white/90 bg-red-700 border border-red-500 rounded-md transition-all duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Enter Combat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Summary Modal */}
      {summaryData && (
        <ActionSummaryModal
          isOpen={summaryModalOpen}
          summary={summaryData}
          onClose={() => setSummaryModalOpen(false)}
        />
      )}
      <ConfirmationModal
        isOpen={jobEnergyModalOpen}
        title="Too Tired"
        message={jobEnergyMessage}
        onConfirm={() => setJobEnergyModalOpen(false)}
        onCancel={() => setJobEnergyModalOpen(false)}
        confirmText="OK"
        singleButton={true}
      />
    </div>
  );
};

export default LocationScreen;

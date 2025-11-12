import React, { useState, useEffect, useCallback } from 'react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';
import { useLocationStore } from '../../stores/useLocationStore';
import { useUIStore } from '../../stores/useUIStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { Sun, Moon, MessageSquare, Hammer, Fish, MapPin, ShoppingCart, CookingPot, Bed, Search, Swords, Leaf, Snowflake, Sprout, Cloud, CloudRain, BookOpen, User, Package, Briefcase, Heart, Library, Zap, Award } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import ActionButton from '../ui/ActionButton';
import LocationNav from '../LocationNav';
import WeatherParticles from '../effects/WeatherParticles';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import TimedActionModal from '../modals/TimedActionModal';
import ActionSummaryModal from '../modals/ActionSummaryModal';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useSkillStore } from '../../stores/useSkillStore';
import type { ActionSummary } from '../../types';
import { DialogueService } from '../../services/DialogueService';

  const LocationScreen: React.FC = () => {
  const { attributes, hp, energy, hunger, maxWeight } = useCharacterStore();
  const { day, hour, minute, getFormattedTime, getFormattedDate, getSeason, getWeather } = useWorldTimeStore();
  const { getCurrentLocation } = useLocationStore();
  const { setScreen, currentScreen } = useUIStore();

  const currentLocation = getCurrentLocation();
  const isNight = hour >= 18 || hour < 6;

  const timeString = getFormattedTime();
  const dateString = getFormattedDate();

  const season = getSeason();
  const weather = getWeather();
  
  // Travel state
  const [travelModalOpen, setTravelModalOpen] = useState(false);
  const [travelProgressModalOpen, setTravelProgressModalOpen] = useState(false);
  const [pendingTravelAction, setPendingTravelAction] = useState<any>(null);
  const [travelProgress, setTravelProgress] = useState<any>(null);

  // Skilling (Woodcutting/Fishing)
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [pendingSkillAction, setPendingSkillAction] = useState<any>(null);
  const [skillProgress, setSkillProgress] = useState<any>(null);
  const [selectedSkillHours, setSelectedSkillHours] = useState<number>(1);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<ActionSummary | null>(null);

  const seasonIcons = {
    Spring: Sprout,
    Summer: Sun,
    Autumn: Leaf,
    Winter: Snowflake,
  };
  const SeasonIcon = seasonIcons[season];

  const getWeatherDisplay = () => {
    let temp = 15;
    let weatherText: string = weather;
    let WeatherIcon: React.FC<{ size: number; className?: string }> = Sun;

    switch (season) {
      case 'Summer': temp = 24; break;
      case 'Autumn': temp = 12; break;
      case 'Winter': temp = -2; break;
    }

    switch (weather) {
      case 'Sunny':
        weatherText = isNight ? 'Clear' : 'Sunny';
        WeatherIcon = isNight ? Moon : Sun;
        break;
      case 'Cloudy':
        WeatherIcon = Cloud;
        temp -= 4;
        break;
      case 'Rainy':
        WeatherIcon = CloudRain;
        temp -= 2;
        break;
      case 'Snowy':
        WeatherIcon = Snowflake;
        temp -= 6;
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

    return { temp, weatherText, WeatherIcon: <WeatherIcon size={22} className={getIconColor()} /> };
  };

  const { temp, weatherText, WeatherIcon } = getWeatherDisplay();

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'dialogue':
        // Set selected NPC for dialogue and open the dialogue screen
        useUIStore.getState().setDialogueNpcId(action.target);
        DialogueService.startDialogue(action.target);
        setScreen('dialogue');
        break;
      case 'shop':
        setScreen('trade');
        break;
      case 'fish':
        // Open skilling setup modal for Fishing
        setPendingSkillAction(action);
        setSkillProgress(null);
        setSkillModalOpen(true);
        break;
      case 'woodcut':
        // Open skilling setup modal for Woodcutting
        setPendingSkillAction(action);
        setSkillProgress(null);
        setSkillModalOpen(true);
        break;
      case 'job':
        setScreen('jobScreen');
        break;
      case 'use': {
        // Handle context actions like repairing the wall at Tide & Trade
        if (action.target === 'repair_wall') {
          const journal = useJournalStore.getState();
          const questId = 'roberta_planks_for_the_past';
          const q = journal.quests[questId];
          const inventory = useInventoryStore.getState();
          const planks = inventory.getItemQuantity('wooden_plank');
          if (q && q.active && !q.completed && (q.currentStage ?? 0) === 2) {
            if (planks >= 10) {
              // Consume 10 planks and complete the quest
              const removed = inventory.removeItem('wooden_plank', 10);
              if (removed) {
                // Advance to final talk stage (stage 3); do not complete yet
                journal.setQuestStage(questId, 3);
                // Set a world flag for future conditions (e.g., different dialogue or visuals)
                useWorldStateStore.getState().setFlag('tide_trade_wall_repaired', true);

                // Show summary modal
                const summary: ActionSummary = {
                  title: 'Wall Repaired',
                  durationInMinutes: 15,
                  vitalsChanges: [],
                  expended: [{ name: 'Wooden Plank', quantity: 10, icon: <Package size={20} className="text-zinc-300"/> }],
                  rewards: [{ name: 'Wall Fixed', quantity: 1, icon: <Hammer size={20} className="text-green-300"/> }],
                };
                setSummaryData(summary);
                setSummaryModalOpen(true);
              }
            } else {
              console.log('Not enough planks to repair. Need 10, have', planks);
            }
          }
        }
        break;
      }
      case 'navigate':
        // Free travel: no modal. Timed travel: show confirmation modal
        if (action.time_cost && action.time_cost > 0) {
          setPendingTravelAction(action);
          setTravelModalOpen(true);
        } else {
          useLocationStore.getState().setLocation(action.target);
          setPendingTravelAction(null);
        }
        break;
      default:
        console.log('Action not implemented:', action);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'dialogue': return <MessageSquare size={20} className="text-sky-300" />;
      case 'shop': return <ShoppingCart size={20} className="text-yellow-300" />;
    case 'fish': return <Fish size={20} className="text-orange-400" />;
    case 'woodcut': return <Leaf size={20} className="text-orange-400" />; // match Fishing orange card
      case 'job': return <Briefcase size={20} className="text-orange-300" />;
      case 'navigate': return <MapPin size={20} className="text-green-300" />;
      default: return <Search size={20} className="text-zinc-300" />;
    }
  };

  const getActionCategory = (type: string) => {
    switch (type) {
      case 'dialogue': return 'dialogue';
      case 'shop': return 'commerce';
      case 'fish': case 'job': case 'woodcut': return 'action';
      case 'navigate': return 'travel';
      default: return 'explore';
    }
  };

  const handleNavigate = (screen: any) => {
    setScreen(screen);
  };

  const handleOpenSleepWaitModal = (mode: 'sleep' | 'wait') => {
    // TODO: Implement sleep/wait modal
    console.log('Open sleep/wait modal:', mode);
  };

  const handleOpenOptionsModal = () => {
    // TODO: Implement options modal
    console.log('Open options modal');
  };

  const handleOpenSaveLoadModal = () => {
    // TODO: Implement save/load modal
    console.log('Open save/load modal');
  };

  const handleConfirmTravel = () => {
    if (!pendingTravelAction) return;

    let modifiedTimeCost = pendingTravelAction.time_cost || 0;
    let weatherModifier = 1;

    switch (weather) {
      case 'Rainy':
        weatherModifier = 1.5;
        break;
      case 'Snowy':
        weatherModifier = 2;
        break;
    }

    modifiedTimeCost *= weatherModifier;

    setTravelModalOpen(false);

    if (modifiedTimeCost > 0) {
      useWorldTimeStore.getState().setClockPaused(true);
      setTravelProgressModalOpen(true);
      const world = useWorldTimeStore.getState();
      const startSeconds = world.hour * 3600 + world.minute * 60;
      const totalSeconds = modifiedTimeCost * 60;
      setTravelProgress({ currentTime: 0, totalTime: totalSeconds, startTime: startSeconds });
    } else {
      useLocationStore.getState().setLocation(pendingTravelAction.target);
      setPendingTravelAction(null);
    }
  };

  const handleCancelTravel = () => {
    setTravelModalOpen(false);
    setPendingTravelAction(null);
  };

  const handleTimedActionClose = useCallback(() => {
    if (pendingTravelAction) {
      useLocationStore.getState().setLocation(pendingTravelAction.target);
      useWorldTimeStore.getState().passTime(pendingTravelAction.time_cost || 0);
    }
    // Resume the global clock after timed travel completes
    useWorldTimeStore.getState().setClockPaused(false);
    setTravelProgressModalOpen(false);
    setPendingTravelAction(null);
    setTravelProgress(null);
  }, [pendingTravelAction]);

  // Skilling preview for TimedActionModal setup view
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
        ? `~${iterations} casts; mainly Sardines; XP per catch`
        : `~${iterations} casts; Trout common, Pike rare (lvl 5+); XP per catch`;
      return { energyCost, rewardsSummary };
    }
    return { energyCost: 0, rewardsSummary: '' };
  }, [pendingSkillAction]);

  // Start skilling: switch to progress animation and pause clock
  const handleStartSkilling = useCallback((hours: number) => {
    setSelectedSkillHours(hours);
    const world = useWorldTimeStore.getState();
    useWorldTimeStore.getState().setClockPaused(true);
    setSkillProgress({ currentTime: 0, totalTime: hours * 3600, startTime: world.hour * 3600 + world.minute * 60 });
  }, []);

  // Apply skilling results, advance time, resume clock, and show summary
  const handleSkillClose = useCallback(() => {
    if (!pendingSkillAction) {
      setSkillModalOpen(false);
      setSkillProgress(null);
      return;
    }

    const totalMinutes = selectedSkillHours * 60;
    const vitalsChanges: ActionSummary['vitalsChanges'] = [];
    const expended: ActionSummary['expended'] = [];
    const rewards: ActionSummary['rewards'] = [];

    const inventory = useInventoryStore.getState();
    const character = useCharacterStore.getState();
    const skills = useSkillStore.getState();

    const applyEnergyCost = (cost: number) => {
      useCharacterStore.setState((state) => ({ energy: Math.max(0, state.energy - cost) }));
      vitalsChanges.push({ vital: 'Energy', change: -cost, icon: <Zap size={20} className="text-blue-300"/> });
      expended!.push({ name: 'Energy', quantity: cost, icon: <Zap size={20} className="text-blue-300"/> });
    };

    const addReward = (name: string, quantity: number) => {
      rewards.push({ name, quantity, icon: <Award size={20} className="text-yellow-300"/> });
    };

    // Tool requirements
    const hasTool = (toolId: string) => inventory.getItemQuantity(toolId) > 0;

    if (pendingSkillAction.type === 'woodcut') {
      if (!hasTool('axe_basic')) {
        setSummaryData({
          title: 'Missing Tool',
          durationInMinutes: 0,
          vitalsChanges: [],
          expended: [],
          rewards: [],
        });
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

      // Award items and XP
      let logsAdded = 0;
      for (let i = 0; i < iterations; i++) {
        const added = inventory.addItem('log', 1);
        if (added) logsAdded += 1;
        skills.addXp('woodcutting', 30);
      }
      if (logsAdded > 0) addReward('Logs', logsAdded);
      addReward('Woodcutting XP', iterations * 30);
    } else if (pendingSkillAction.type === 'fish') {
      if (!hasTool('fishing_rod')) {
        setSummaryData({
          title: 'Missing Tool',
          durationInMinutes: 0,
          vitalsChanges: [],
          expended: [],
          rewards: [],
        });
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

      let sardines = 0;
      let trout = 0;
      let pike = 0;
      const fishingLevel = skills.getSkillLevel('fishing');
      for (let i = 0; i < iterations; i++) {
        const roll = Math.random();
        if (pendingSkillAction.target === 'fish_docks') {
          // 90% sardine, 10% miss
          if (roll < 0.9) {
            if (inventory.addItem('fish_sardine', 1)) sardines += 1;
            skills.addXp('fishing', 15);
          } else {
            // got away: no item, no XP
          }
        } else {
          // river: 70% trout, 20% pike (lvl 5+ to catch), 10% miss
          if (roll < 0.7) {
            if (inventory.addItem('fish_trout', 1)) trout += 1;
            skills.addXp('fishing', 15);
          } else if (roll < 0.9) {
            skills.addXp('fishing', 40);
            if (fishingLevel >= 5) {
              if (inventory.addItem('fish_pike', 1)) pike += 1;
            } else {
              // Not skilled enough to catch pike; only XP awarded
            }
          } else {
            // got away: no item, no XP
          }
        }
      }
      if (sardines > 0) addReward('Sardines', sardines);
      if (trout > 0) addReward('Trout', trout);
      if (pike > 0) addReward('Pike', pike);
      const totalFishingXp = (sardines * 15) + (trout * 15) + (pike * 40); // only counted catches above
      if (totalFishingXp > 0) addReward('Fishing XP', totalFishingXp);
    }

    // Advance in-game time equal to selected duration
    useWorldTimeStore.getState().passTime(totalMinutes);
    useWorldTimeStore.getState().setClockPaused(false);

    // Prepare summary data
    const title = pendingSkillAction.type === 'woodcut' ? 'Woodcutting Complete' : 'Fishing Complete';
    const summary: ActionSummary = {
      title,
      durationInMinutes: totalMinutes,
      vitalsChanges,
      expended,
      rewards,
    };
    setSummaryData(summary);
    setSummaryModalOpen(true);

    // Reset skilling state
    setSkillModalOpen(false);
    setSkillProgress(null);
    setPendingSkillAction(null);
  }, [pendingSkillAction, selectedSkillHours]);

  return (
    <>
      {/* Weather Particles (outdoor only) */}
      {(!currentLocation.is_indoor) && <WeatherParticles weather={weather} />}

      {/* Gradient Overlay for Text Readability */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none"></div>

      {/* Top-Left: Stats */}
      <div className="absolute top-8 left-8 z-10 flex flex-col space-y-2 p-3 bg-zinc-950/85 backdrop-blur-xl rounded-lg border border-zinc-700/80 w-64">
        <ProgressBar label="HP" value={hp} max={100} colorClass="bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
        <ProgressBar label="Energy" value={energy} max={100} colorClass="bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
        <ProgressBar label="Hunger" value={hunger} max={100} colorClass="bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]" />
      </div>

      {/* Right-Side: Information & Actions Panel */}
      <aside className="absolute top-8 right-8 bottom-24 z-10 w-full max-w-sm bg-zinc-950/85 backdrop-blur-xl rounded-xl border border-zinc-700/80 p-4 flex flex-col">
        {/* Date & Time Header */}
        <div className="flex-shrink-0 mb-4 px-2">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl font-bold font-mono tracking-tighter" style={{lineHeight: '1'}}>{timeString}</h2>
            <div className="flex items-center space-x-2 text-lg text-white/90">
              <span className="font-semibold">{temp}°C {weatherText}</span>
              {WeatherIcon}
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-white/70">{dateString}</p>
            <div className="flex items-center space-x-2 text-sm text-zinc-300">
              <SeasonIcon size={18} />
              <span className="font-semibold">{season}</span>
            </div>
          </div>
          <div className="w-full h-px bg-zinc-700 mt-3"></div>
        </div>

        {/* Scrollable Actions */}
        <div className="overflow-y-auto flex-grow pr-2 space-y-3 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800/50 hover:scrollbar-thumb-zinc-500">
          {currentLocation.actions
            .slice()
            .sort((a: any, b: any) => {
              const isAHub = a.type === 'navigate' && (a.target === 'driftwatch' || /Hub/i.test(a.text));
              const isBHub = b.type === 'navigate' && (b.target === 'driftwatch' || /Hub/i.test(b.text));
              if (isAHub && !isBHub) return 1;
              if (!isAHub && isBHub) return -1;
              return 0;
            })
            .filter((action: any) => {
              // Evaluate optional condition field
              const condition = action.condition;
              if (!condition) return true;
              const parts = String(condition).split('&&').map(s => s.trim());
              const journal = useJournalStore.getState();
              const world = useWorldStateStore.getState();
              for (const expr of parts) {
                const [lhs, rhsRaw] = expr.split('==').map(s => s.trim());
                const rhs = rhsRaw === 'true' ? true : rhsRaw === 'false' ? false : Number(rhsRaw);
                if (lhs.startsWith('quest.')) {
                  const [, questId, field] = lhs.split('.');
                  const q = journal.quests[questId];
                  if (field === 'active') {
                    if ((q?.active || false) !== rhs) return false;
                  } else if (field === 'completed') {
                    if ((q?.completed || false) !== rhs) return false;
                  } else if (field === 'stage') {
                    const stage = q?.currentStage ?? 0;
                    if (stage !== rhs) return false;
                  }
                } else if (lhs.startsWith('world_flags.')) {
                  const flag = lhs.replace('world_flags.', '');
                  const val = world.getFlag(flag);
                  if (val !== rhs) return false;
                }
              }
              return true;
            })
            .map((action: any, index: number) => (
            <ActionButton
              key={index}
              onClick={() => handleAction(action)}
              category={getActionCategory(action.type)}
              icon={getActionIcon(action.type)}
              text={action.text}
            />
          ))}
        </div>
      </aside>

      {/* Bottom-Left: Location Info */}
      <main className="absolute bottom-28 left-8 z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider text-white drop-shadow-xl" style={{ fontFamily: 'serif' }}>
          {currentLocation.name}
        </h1>
        <p className="mt-3 text-white/80 max-w-2xl leading-relaxed drop-shadow-lg">
          {currentLocation.description}
        </p>
      </main>

      {/* Navigation */}
      <LocationNav
        onNavigate={handleNavigate}
        variant="floating"
        activeScreen={currentScreen}
        onOpenSleepWaitModal={handleOpenSleepWaitModal}
        showTimeControls={true}
        onOpenOptionsModal={handleOpenOptionsModal}
        onOpenSaveLoadModal={handleOpenSaveLoadModal}
      />

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
        isOpen={travelProgressModalOpen}
        actionName="Traveling..."
        progress={travelProgress}
        onClose={handleTimedActionClose}
      />

      {/* Skilling Setup / Progress Modal */}
      <TimedActionModal
        isOpen={skillModalOpen}
        actionName={pendingSkillAction?.type === 'woodcut' ? 'Woodcutting' : pendingSkillAction?.type === 'fish' ? 'Fishing' : 'Action'}
        maxDuration={4}
        calculatePreview={calculateSkillPreview}
        onStart={handleStartSkilling}
        progress={skillProgress}
        onClose={handleSkillClose}
      />

      {/* Action Summary Modal */}
      {summaryData && (
        <ActionSummaryModal
          isOpen={summaryModalOpen}
          summary={summaryData}
          onClose={() => setSummaryModalOpen(false)}
        />
      )}
    </>
  );
};

export default LocationScreen;

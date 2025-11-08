

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { FC } from 'react';
import type { GameState, OfferItem, CraftingSkill, Vitals, Choice, Combatant, Season, Weather, DialogueOption, Item, ActionSummary, Recipe } from './types';
import { lukePrologueSlides, mockParty, mockEnemies, mockSaveSlots, eliasDialogue, robertaDialogue, mockInventory } from './data';
import { Coins, Zap } from 'lucide-react';

import MainMenu from './components/screens/MainMenu';
import CharacterSelection from './components/screens/CharacterSelection';
import EventScreen from './components/screens/EventScreen';
import InGameUI from './components/screens/InGameUI';
import DialogueScreen from './components/screens/DialogueScreen';
import CharacterScreen from './components/screens/CharacterScreen';
import InventoryScreen from './components/screens/InventoryScreen';
import JobScreen from './components/screens/JobScreen';
import JournalScreen from './components/screens/JournalScreen';
import DiaryScreen from './components/screens/DiaryScreen';
import LibraryScreen from './components/screens/LibraryScreen';
import TradeScreen from './components/screens/TradeScreen';
import TradeConfirmationScreen from './components/screens/TradeConfirmationScreen';
import InGameNav from './components/InGameNav';
import CraftingScreen from './components/screens/CraftingScreen';
import TimedActionModal from './components/modals/TimedActionModal';
import { ConfirmationModal } from './components/modals/ConfirmationModal';
import SleepWaitModal from './components/modals/SleepWaitModal';
import ChoiceEventScreen from './components/screens/ChoiceEventScreen';
import CombatScreen from './components/screens/CombatScreen';
import VictoryScreen from './components/screens/VictoryScreen';
import CompanionScreen from './components/screens/CompanionScreen';
import OptionsModal from './components/modals/OptionsModal';
import SaveLoadModal from './components/modals/SaveLoadModal';
import WeatherParticles from './components/effects/WeatherParticles';
import ActionSummaryModal from './components/modals/ActionSummaryModal';


const App: FC = () => {
  const [gameState, setGameState] = useState<GameState>('mainMenu');
  const [tradeOffer, setTradeOffer] = useState<{ player: OfferItem[], merchant: OfferItem[] }>({ player: [], merchant: [] });
  const [activeCraftingSkill, setActiveCraftingSkill] = useState<CraftingSkill | null>(null);
  
  const [playerVitals, setPlayerVitals] = useState<Vitals>({
    hp: { current: 100, max: 100 },
    energy: { current: 80, max: 100 },
    hunger: { current: 50, max: 100 },
  });
  
  const [isWorkConfirmOpen, setIsWorkConfirmOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [saveLoadModalState, setSaveLoadModalState] = useState<{ isOpen: boolean; context: 'mainMenu' | 'inGame' }>({ isOpen: false, context: 'inGame' });
  const [sleepWaitModalState, setSleepWaitModalState] = useState<{ isOpen: boolean; mode: 'sleep' | 'wait' }>({ isOpen: false, mode: 'sleep' });
  // FIX: Moved timedActionState declaration before its use in the useEffect hook to resolve the "used before its declaration" error.
  const [timedActionState, setTimedActionState] = useState<{
        isOpen: boolean;
        config: {
            actionName: string;
            maxDuration: number;
            calculatePreview: (hours: number) => { energyCost?: number; rewardsSummary: string; };
        } | null;
        progress: {
            currentTime: number;
            totalTime: number; // NOTE: This is now IN-GAME seconds for the animation
            startTime: number; // in-game seconds
        } | null;
        summary: ActionSummary | null;
    }>({ isOpen: false, config: null, progress: null, summary: null });
  const [actionSummary, setActionSummary] = useState<ActionSummary | null>(null);
  const [hasPet, setHasPet] = useState(true);
  const [choiceEvent, setChoiceEvent] = useState<{
    title?: string;
    imageUrl?: string;
    eventText: string | React.ReactNode;
    choices: Choice[];
  } | null>(null);

  const [combatState, setCombatState] = useState<{
    party: Combatant[];
    enemies: Combatant[];
    activeCharacterId: string;
    selectedTargetId: string | null;
    isPlayerTurn: boolean;
    combatLog: string[];
  } | null>(null);
  
  const [combatRewards, setCombatRewards] = useState<{ items: Item[], copper: number } | null>(null);

  const [gameTimeInMinutes, setGameTimeInMinutes] = useState(8 * 60); // Start at 08:00 on day 1
  const [weather, setWeather] = useState<Weather>('Sunny');

    useEffect(() => {
        const isModalOpen = timedActionState.isOpen || sleepWaitModalState.isOpen || isWorkConfirmOpen || !!actionSummary || isOptionsModalOpen || saveLoadModalState.isOpen;

        if (gameState !== 'inGame' || isModalOpen) {
            return; // Pause game clock if not in-game or if a modal is open
        }

        const timerId = setInterval(() => {
            setGameTimeInMinutes(prev => prev + 1);
        }, 2000); // 1 game minute passes every 2 seconds.
        
        return () => clearInterval(timerId);
    }, [gameState, timedActionState.isOpen, sleepWaitModalState.isOpen, isWorkConfirmOpen, actionSummary, isOptionsModalOpen, saveLoadModalState.isOpen]);


    const day = Math.floor(gameTimeInMinutes / (24 * 60)) + 1;
    const hour = Math.floor((gameTimeInMinutes % (24 * 60)) / 60);
    const minute = gameTimeInMinutes % 60;
    const isNight = hour >= 20 || hour < 5;

    const getSeason = (currentDay: number): Season => {
        const dayOfYear = (currentDay - 1) % 120; // 120-day year
        if (dayOfYear < 30) return 'Spring';
        if (dayOfYear < 60) return 'Summer';
        if (dayOfYear < 90) return 'Autumn';
        return 'Winter';
    };

    const season = useMemo(() => getSeason(day), [day]);

    useEffect(() => {
        let newWeather: Weather = 'Sunny'; // Default

        // DEMO weather logic for Day 1
        if (day === 1) {
            if (hour === 8) {
                if (minute >= 9) {
                    newWeather = 'Snowy';
                } else if (minute >= 5) {
                    newWeather = 'Sunny';
                } else if (minute >= 2) {
                    newWeather = 'Rainy';
                } else {
                    newWeather = 'Sunny';
                }
            } else if (hour > 8) {
                newWeather = 'Snowy';
            } else {
                newWeather = 'Sunny';
            }
        } else {
            // Seasonal logic for other days
            switch (season) {
                case 'Spring': newWeather = 'Sunny'; break;
                case 'Summer': newWeather = 'Sunny'; break;
                case 'Autumn': newWeather = 'Cloudy'; break;
                case 'Winter': newWeather = 'Snowy'; break;
            }
        }

        // Only call setWeather if the state has actually changed to prevent re-renders
        if (newWeather !== weather) {
            setWeather(newWeather);
        }
    }, [day, hour, minute, season, weather]);


    const hasRecentSave = useMemo(() => mockSaveSlots.some(slot => !slot.isEmpty), []);

    const handleContinue = () => {
        console.log('Continuing from latest save...');
        setGameState('inGame');
    };

    const handleInitiateWork = () => {
        setIsWorkConfirmOpen(true);
    };
    
    const handleInvestigate = () => {
        setChoiceEvent({
            title: "A Cry for Help",
            imageUrl: "https://i.imgur.com/WsODuhO.png",
            eventText: "Walking through the slums, you see a city guard cornering a young boy who looks terrified. The guard is accusing him of theft, but the boy swears he is innocent. The guard raises his baton.",
            choices: [
                {
                    text: "Try to de-escalate the situation peacefully.",
                    skillCheck: { skill: 'Charisma', level: 7 },
                    // Assuming player charisma (3) is less than 7
                    disabled: true,
                    onSelect: () => {},
                },
                {
                    text: "Step in and defend the boy.",
                    onSelect: () => {
                        console.log('Aggressive intervention selected');
                        setGameState('inGame');
                    },
                },
                {
                    text: "Keep walking and ignore the situation.",
                    onSelect: () => {
                        console.log('Ignored the situation');
                        setGameState('inGame');
                    },
                },
            ]
        });
        setGameState('choiceEvent');
    };

    const handleConfirmWork = () => {
        setIsWorkConfirmOpen(false);
        const hours = 8;
        const energyCost = 40;
        const copperGained = 160;

        if (playerVitals.energy.current < energyCost) {
            console.log("Not enough energy to work.");
             // TODO: show notification
            return;
        }
        
        const summary: ActionSummary = {
            title: 'Work at the Docks',
            durationInMinutes: hours * 60,
            vitalsChanges: [{ vital: 'Energy', change: -energyCost, icon: <Zap size={16} /> }],
            rewards: [
                { name: 'Copper', quantity: copperGained, icon: <Coins size={16} className="text-orange-400" /> },
            ]
        };

        // Open the modal for the animation. Game state will be updated in handleCloseTimedAction.
        setTimedActionState({
            isOpen: true,
            config: null,
            progress: { currentTime: 0, totalTime: hours * 3600, startTime: gameTimeInMinutes * 60 },
            summary: summary,
        });
    };
    
    const handleOpenFishingModal = () => {
        const energyCostPerHour = 8;
        const maxHours = Math.floor(playerVitals.energy.current / energyCostPerHour);

        if (maxHours < 1) {
            console.log("Not enough energy to fish for at least one hour.");
             // TODO: show notification
            return;
        }
        
        setTimedActionState({
            isOpen: true,
            config: {
                actionName: 'Fish at Canals',
                maxDuration: maxHours,
                calculatePreview: (hours: number) => ({
                    energyCost: hours * energyCostPerHour,
                    rewardsSummary: `~${hours * 3} Fish`,
                }),
            },
            progress: null,
            summary: null,
        });
    };

    const handleStartTimedAction = (hours: number) => {
        if (!timedActionState.config) return;

        const preview = timedActionState.config.calculatePreview(hours);
        const energyCost = preview.energyCost || 0;
        
        if (playerVitals.energy.current < energyCost) {
            console.error("Not enough energy!");
            return;
        }
        
        const fishCaught = Math.floor(Math.random() * 2 * hours) + hours; // 1-3 fish per hour
        
        const summary: ActionSummary = {
            title: timedActionState.config.actionName,
            durationInMinutes: hours * 60,
            vitalsChanges: [{ vital: 'Energy', change: -energyCost, icon: <Zap size={16} /> }],
            rewards: [
                { name: 'Fish', quantity: fishCaught, icon: mockInventory.find(i => i.name === 'Salted Fish')?.icon },
            ]
        };

        // Set the modal to its progress state to show the animation. Game state will be updated on close.
        setTimedActionState(prev => ({ 
            ...prev,
            config: null,
            progress: { currentTime: 0, totalTime: hours * 3600, startTime: gameTimeInMinutes * 60 },
            summary: summary,
        }));
    };
    
    const handleCloseTimedAction = () => {
        const summary = timedActionState.summary;

        if (summary) {
            // 1. Apply game state changes now that animation is done
            setGameTimeInMinutes(prev => prev + summary.durationInMinutes);

            summary.vitalsChanges.forEach(change => {
                if (change.vital === 'Energy') {
                     setPlayerVitals(prev => ({
                        ...prev,
                        energy: { ...prev.energy, current: Math.max(0, prev.energy.current + change.change) }
                    }));
                }
            });
            
            console.log(`Action '${summary.title}' completed. Rewards added.`);
            // In a real game, add rewards to inventory here.

            // 2. Show the summary modal
            setActionSummary(summary);
        }

        // 3. Reset the timed action state
        setTimedActionState({ isOpen: false, config: null, progress: null, summary: null });
    };


    const handleOpenSleepWaitModal = (mode: 'sleep' | 'wait') => {
        setSleepWaitModalState({ isOpen: true, mode });
    };
    
    const handleSleepWaitComplete = (hours: number) => {
        const mode = sleepWaitModalState.mode;
        setSleepWaitModalState({ isOpen: false, mode: 'sleep' }); // Close the modal first

        console.log(`${mode} for ${hours} hours.`);
        setGameTimeInMinutes(prev => prev + hours * 60);

        if (mode === 'sleep') {
            // Restore energy. Example: 10 energy per hour.
            const energyRestored = hours * 10;
            setPlayerVitals(prev => ({
                ...prev,
                energy: {
                    ...prev.energy,
                    current: Math.min(prev.energy.max, prev.energy.current + energyRestored)
                }
            }));
        }
    };

    const handleConfirmTrade = (playerOffer: OfferItem[], merchantOffer: OfferItem[]) => {
        setTradeOffer({ player: playerOffer, merchant: merchantOffer });
        setGameState('tradeConfirmation');
    };

    const handleOpenCraftingMenu = (skill: CraftingSkill) => {
        setActiveCraftingSkill(skill);
        setGameState('crafting');
    };

    const handleStartCrafting = (recipe: Recipe, quantity: number) => {
        const energyCost = recipe.energyCost * quantity;
        if (playerVitals.energy.current < energyCost) {
            console.log("Not enough energy to craft."); // TODO: show notification
            return;
        }
        
        const totalMinutes = recipe.timeCost * quantity;
        
        const expendedItems = recipe.ingredients.map(ing => {
            const itemDetails = mockInventory.find(i => i.id === ing.itemId);
            return {
                name: itemDetails?.name || 'Unknown Item',
                quantity: ing.quantity * quantity,
                icon: itemDetails?.icon,
            };
        });

        const summary: ActionSummary = {
            title: `Crafted: ${recipe.result.name} (x${quantity})`,
            durationInMinutes: totalMinutes,
            vitalsChanges: [{ vital: 'Energy', change: -energyCost, icon: <Zap size={16} /> }],
            rewards: [
                { name: recipe.result.name, quantity: quantity, icon: recipe.result.icon },
            ],
            expended: expendedItems,
        };

        // In a real game, you would deduct ingredients from inventory here.
        console.log(`Deducting ingredients for ${quantity}x ${recipe.result.name}...`);
        
        setTimedActionState({
            isOpen: true,
            config: null,
            progress: { currentTime: 0, totalTime: totalMinutes * 60, startTime: gameTimeInMinutes * 60 },
            summary: summary,
        });
    };

    const handleStartCombat = () => {
        setCombatState({
            party: JSON.parse(JSON.stringify(mockParty)),
            enemies: JSON.parse(JSON.stringify(mockEnemies)),
            activeCharacterId: 'luke',
            selectedTargetId: null,
            isPlayerTurn: true,
            combatLog: ["A pack of wolves appear!"]
        });
        setGameState('combat');
    };

    const handleSelectTarget = (enemyId: string) => {
        setCombatState(prev => prev ? { ...prev, selectedTargetId: enemyId } : null);
    };

    const handleAttack = () => {
        if (!combatState || !combatState.isPlayerTurn || !combatState.selectedTargetId) return;

        const attacker = combatState.party.find(p => p.id === combatState.activeCharacterId);
        const target = combatState.enemies.find(e => e.id === combatState.selectedTargetId);
        if (!attacker || !target) return;

        const damage = Math.floor(Math.random() * 10) + 5;
        
        const prospectiveEnemies = combatState.enemies.map(enemy => 
            enemy.id === target.id ? { ...enemy, hp: Math.max(0, enemy.hp - damage) } : enemy
        );
        const allEnemiesDefeated = prospectiveEnemies.every(e => e.hp === 0);
        
        setCombatState(prev => {
            if (!prev) return null;
            const newEnemies = prev.enemies.map(enemy => 
                enemy.id === target.id ? { ...enemy, hp: Math.max(0, enemy.hp - damage) } : enemy
            );
            const newLog = [...prev.combatLog, `${attacker.name} attacks ${target.name} for ${damage} damage.`];
            
            const defeatedEnemy = newEnemies.find(e => e.id === target.id);
            if (defeatedEnemy?.hp === 0) {
                newLog.push(`${target.name} has been defeated!`);
            }
            
            if (allEnemiesDefeated) {
                newLog.push("You are victorious!");
                const rewards = {
                    items: [mockInventory[0], mockInventory[5]], // Wolf pelt, iron ore
                    copper: Math.floor(Math.random() * 50) + 25,
                };
                setCombatRewards(rewards);
            }

            return { ...prev, enemies: newEnemies, combatLog: newLog, isPlayerTurn: false };
        });
        
        if (allEnemiesDefeated) {
             setTimeout(() => {
                setGameState('combatVictory');
                setCombatState(null);
            }, 1500);
            return;
        }

        setTimeout(() => {
            setCombatState(prev => {
                if (!prev) return null;
                // In a real game, this would trigger enemy AI. For now, we just give the turn back.
                return { ...prev, isPlayerTurn: true, combatLog: [...prev.combatLog, "It's your turn."] };
            });
        }, 1500);
    };

    const handleDefend = () => {
         if (!combatState || !combatState.isPlayerTurn) return;
         const attacker = combatState.party.find(p => p.id === combatState.activeCharacterId);
         if (!attacker) return;
         setCombatState(prev => prev ? { 
             ...prev, isPlayerTurn: false, combatLog: [...prev.combatLog, `${attacker.name} takes a defensive stance.`]
         } : null);
         setTimeout(() => setCombatState(prev => prev ? {...prev, isPlayerTurn: true, combatLog: [...prev.combatLog, "It's your turn."]} : null), 1500);
    };

    const handleFlee = () => {
        if (!combatState || !combatState.isPlayerTurn) return;
        const success = Math.random() > 0.5;
        if (success) {
            alert("You successfully fled from combat.");
            setGameState('inGame');
            setCombatState(null);
        } else {
            setCombatState(prev => prev ? {
                ...prev, isPlayerTurn: false, combatLog: [...prev.combatLog, `You failed to flee!`]
            } : null);
            setTimeout(() => setCombatState(prev => prev ? {...prev, isPlayerTurn: true, combatLog: [...prev.combatLog, "It's your turn."]} : null), 1500);
        }
    };
    
  const renderContent = () => {
    switch (gameState) {
        case 'mainMenu':
            return <MainMenu 
                onNewGame={() => setGameState('characterSelection')} 
                onContinue={handleContinue}
                hasRecentSave={hasRecentSave}
                onOpenOptionsModal={() => setIsOptionsModalOpen(true)} 
                onOpenSaveLoadModal={() => setSaveLoadModalState({ isOpen: true, context: 'mainMenu' })} 
            />;
        case 'characterSelection':
            return <CharacterSelection onBack={() => setGameState('mainMenu')} onBeginJourney={() => setGameState('prologue')} />;
        case 'prologue':
            return <EventScreen slides={lukePrologueSlides} onComplete={() => setGameState('inGame')} />;
        case 'inGame':
            return <InGameUI 
                        vitals={playerVitals}
                        day={day}
                        hour={hour}
                        minute={minute} 
                        isNight={isNight}
                        season={season}
                        weather={weather}
                        onTalkToElias={() => setGameState('dialogue')} 
                        onTalkToRoberta={() => setGameState('dialogueRoberta')}
                        onTrade={() => setGameState('trade')} 
                        onStartCrafting={handleOpenCraftingMenu} 
                        onWork={handleInitiateWork} 
                        onFish={handleOpenFishingModal}
                        onSleep={() => handleOpenSleepWaitModal('sleep')}
                        onInvestigate={handleInvestigate}
                        onStartCombat={handleStartCombat}
                        onVisitLibrary={() => setGameState('library')}
                    />;
        case 'dialogue':
            return <DialogueScreen
                npcName="Captain Elias"
                npcPortraitUrl="https://i.imgur.com/vzq2Ab7.png"
                playerPortraitUrl="https://i.imgur.com/gUNzyBA.jpeg"
                initialDialogue={eliasDialogue}
                onEndDialogue={() => setGameState('inGame')}
            />;
        case 'dialogueRoberta':
            return <DialogueScreen
                npcName="Roberta"
                npcPortraitUrl="https://i.imgur.com/uhOoVzS.png"
                playerPortraitUrl="https://i.imgur.com/gUNzyBA.jpeg"
                initialDialogue={robertaDialogue}
                onEndDialogue={() => setGameState('inGame')}
            />;
        case 'characterScreen':
            return <CharacterScreen vitals={playerVitals} />;
        case 'inventory':
            return <InventoryScreen />;
        case 'jobScreen':
            return <JobScreen />;
        case 'journal':
            return <JournalScreen />;
        case 'diary':
            return <DiaryScreen />;
        case 'library':
            return <LibraryScreen onClose={() => setGameState('inGame')} />;
        case 'trade':
            return <TradeScreen onClose={() => setGameState('inGame')} onConfirmTrade={handleConfirmTrade} />;
        case 'tradeConfirmation':
             return <TradeConfirmationScreen 
                onClose={() => setGameState('inGame')} 
                onCancel={() => setGameState('trade')}
                playerOffer={tradeOffer.player}
                merchantOffer={tradeOffer.merchant}
            />;
        case 'crafting':
             return <CraftingScreen 
                onClose={() => setGameState('inGame')} 
                initialSkill={activeCraftingSkill}
                onStartCrafting={handleStartCrafting}
            />;
        case 'choiceEvent':
            return choiceEvent ? <ChoiceEventScreen {...choiceEvent} /> : <p>Error: No choice event data.</p>;
        case 'combat':
            return combatState ? <CombatScreen 
                {...combatState}
                onSelectTarget={handleSelectTarget}
                onAttack={handleAttack}
                onDefend={handleDefend}
                onFlee={handleFlee}
            /> : <p>Loading combat...</p>;
        case 'combatVictory':
            return combatRewards ? <VictoryScreen 
                rewards={combatRewards}
                onContinue={() => setGameState('inGame')}
            /> : <p>Loading rewards...</p>;
        case 'companion':
            return <CompanionScreen hasPet={hasPet} />;
        default:
            return <MainMenu 
                onNewGame={() => setGameState('characterSelection')} 
                onContinue={handleContinue}
                hasRecentSave={hasRecentSave}
                onOpenOptionsModal={() => setIsOptionsModalOpen(true)} 
                onOpenSaveLoadModal={() => setSaveLoadModalState({ isOpen: true, context: 'mainMenu' })} 
            />;
    }
  }

  const isSolidBg = ['characterScreen', 'inventory', 'journal', 'diary', 'trade', 'crafting', 'tradeConfirmation', 'companion', 'jobScreen', 'library'].includes(gameState);
  const isCombatScreen = ['combat', 'combatVictory'].includes(gameState);
  const isLocationScreen = ['inGame'].includes(gameState);

  const dayNightState: 'day' | 'dusk' | 'night' | 'dawn' = useMemo(() => {
    if (hour >= 20 || hour < 5) return 'night';
    if (hour >= 18) return 'dusk';
    if (hour >= 7) return 'day';
    if (hour >= 5) return 'dawn';
    return 'night'; // Fallback
  }, [hour]);

  const getBaseBackgroundImage = () => {
    if (gameState === 'choiceEvent' && choiceEvent?.imageUrl) return `url(${choiceEvent.imageUrl})`;
    if (gameState === 'prologue') return `url(${lukePrologueSlides[0].image})`;
    if (gameState === 'mainMenu') return "url('https://i.imgur.com/WsODuhO.png')";
    return "none"; // For in-game, handled separately
  };


  return (
    <div className="fixed inset-0 overflow-hidden text-white bg-black font-sans">
      {/* BACKGROUND & OVERLAYS */}
      <div className="absolute inset-0 z-0">
         {isLocationScreen ? (
            <>
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('https://i.imgur.com/UVZuGiT.jpeg')" }}
                />
                <div 
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[4000ms] ease-in-out`}
                    style={{ 
                        backgroundImage: "url('https://i.imgur.com/0HGce6M.jpeg')",
                        opacity: (dayNightState === 'night' || dayNightState === 'dusk') ? 1 : 0
                    }}
                />
                <div 
                    className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-[4000ms] ease-in-out`}
                    style={{ 
                        opacity: (dayNightState === 'night' || dayNightState === 'dusk') ? 0.6 : 0
                    }}
                ></div>

                {/* Weather Darkening Overlay */}
                <div 
                    className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-[3000ms] ease-in-out`}
                    style={{ opacity: (weather === 'Rainy' || weather === 'Snowy') ? 0.3 : 0 }}
                ></div>

                {/* Weather Particles */}
                <div className="absolute inset-0 z-[5] pointer-events-none">
                    <WeatherParticles weather={weather} />
                </div>
            </>
         ) : (
            <div 
              className={`w-full h-full bg-cover bg-center transition-all duration-500 ${isSolidBg ? 'bg-zinc-900' : ''} ${gameState === 'mainMenu' || gameState === 'choiceEvent' ? 'animate-kenburns' : ''} ${isCombatScreen ? 'vignette-overlay' : ''}`}
              style={{ 
                backgroundImage: isCombatScreen 
                    ? 'radial-gradient(ellipse at center, #18181b 0%, #000000 100%)'
                    : (isSolidBg ? 'none' : getBaseBackgroundImage()) 
              }}
            />
         )}
        
        {/* Static Dark overlay for non-gameplay screens */}
        {(gameState !== 'inGame' && gameState !== 'prologue' && !isSolidBg && gameState !== 'dialogue' && gameState !== 'dialogueRoberta' && !isCombatScreen) && 
            <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>}
      </div>
      
      {/* UI CONTENT */}
      <div className="relative z-10 w-full h-full">
        <div key={gameState} className="w-full h-full animate-fade-in">
            {renderContent()}
        </div>

        {/* MODALS & GLOBAL NAV */}
        <ConfirmationModal
            isOpen={isWorkConfirmOpen}
            title="Work at the Docks"
            message="Start an 8-hour shift at the docks? This will take some time."
            onConfirm={handleConfirmWork}
            onCancel={() => setIsWorkConfirmOpen(false)}
            confirmText="Start Shift"
            cancelText="Not Now"
        />

        {timedActionState.isOpen && (
            <TimedActionModal
                isOpen={timedActionState.isOpen}
                actionName={timedActionState.config?.actionName}
                maxDuration={timedActionState.config?.maxDuration}
                calculatePreview={timedActionState.config?.calculatePreview}
                onStart={handleStartTimedAction}
                onClose={handleCloseTimedAction}
                progress={timedActionState.progress}
            />
        )}
        
        {actionSummary && (
            <ActionSummaryModal
                isOpen={!!actionSummary}
                summary={actionSummary}
                onClose={() => setActionSummary(null)}
            />
        )}
        
        <SleepWaitModal
            isOpen={sleepWaitModalState.isOpen}
            mode={sleepWaitModalState.mode}
            onComplete={handleSleepWaitComplete}
            onCancel={() => setSleepWaitModalState({ isOpen: false, mode: 'sleep' })}
            currentTimeInSeconds={gameTimeInMinutes * 60}
        />
        
        <OptionsModal 
            isOpen={isOptionsModalOpen}
            onClose={() => setIsOptionsModalOpen(false)}
        />
        
        <SaveLoadModal
            isOpen={saveLoadModalState.isOpen}
            context={saveLoadModalState.context}
            onClose={() => setSaveLoadModalState({ isOpen: false, context: 'inGame' })}
        />

        {(['inGame', 'characterScreen', 'inventory', 'journal', 'diary', 'companion', 'jobScreen'].includes(gameState)) && (
            <InGameNav 
                onNavigate={setGameState} 
                variant={(['characterScreen', 'inventory', 'journal', 'diary', 'companion', 'jobScreen'].includes(gameState)) ? 'solid' : 'floating'}
                activeScreen={gameState}
                onOpenSleepWaitModal={handleOpenSleepWaitModal}
                showTimeControls={isLocationScreen}
                onOpenOptionsModal={() => setIsOptionsModalOpen(true)}
                onOpenSaveLoadModal={() => setSaveLoadModalState({ isOpen: true, context: 'inGame' })}
            />
        )}
      </div>
    </div>
  );
};

export default App;
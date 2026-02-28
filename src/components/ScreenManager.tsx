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
import { GameManagerService } from '../services/GameManagerService';
import { DialogueService } from '../services/DialogueService';

import MainMenu from './screens/MainMenu';
import CharacterSelection from './screens/CharacterSelection';
import EventScreen from './screens/EventScreen';
import LocationScreen from './screens/LocationScreen';
import DialogueScreen from './screens/DialogueScreen';
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
import CombatManager from './CombatManager';
import { LootScreen } from './screens/LootScreen';
import CompanionScreen from './screens/CompanionScreen';
import DebugMenuScreen from './screens/DebugMenuScreen';

import npcsData from '../data/npcs.json';
import { 
  lukePrologueSlides, 
  playEventSlidesSarah, 
  playEventSlidesKyle, 
  finnDebtIntroSlides, 
  gameOverSlides, 
  choiceEvents, 
  benCheatEventSlides, 
  elaraDeliverySlides, 
  berylDeliverySlides, 
  rebelVictorySlides 
} from '../data/events';

const ScreenManager: React.FC = () => {
  const { currentScreen, setScreen, shopId, dialogueNpcId } = useUIStore();
  const ui = useUIStore();
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
          if (id === 'ben_cheat_slides') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            useWorldStateStore.getState().setFlag('ben_cheat_done', true);
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
            useJournalStore.getState().advanceQuestStage('finn_debt_collection');
            useDiaryStore.getState().addInteraction('Sold the antique locket to a noble for 10 silver.');
            setScreen('inGame');
            return;
          }
          if (id === 'ben_cheat_event') {
            ui.setEventSlides(benCheatEventSlides);
            ui.setCurrentEventId('ben_cheat_slides');
            setScreen('event');
            return;
          }
          if (id === 'raid_salty_mug_intro') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            GameManagerService.startRaidCombat();
            return;
          }
          if (id === 'raid_victory') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            setScreen('mainMenu');
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
            setScreen('mainMenu');
            return;
          }
          if (id === 'finn_hybrid_end') {
            ui.setEventSlides(null);
            ui.setCurrentEventId(null);
            setScreen('mainMenu');
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
                    setEventResult({
                        text: 'You used your axe to clear the thick vines. The path ahead is now open.',
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
                  text: 'Turn back',
                  onSelect: () => {
                    setEventResult({
                        text: 'You decided not to risk clearing the path for now.',
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
      case 'companion':
        return <CompanionScreen hasPet={false} />;
      case 'debugMenu':
        return <DebugMenuScreen />;
      default:
        return <MainMenu />;
    }
};

export default ScreenManager;

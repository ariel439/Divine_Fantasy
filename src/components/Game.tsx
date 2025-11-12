import React, { useEffect, useState } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useShopStore } from '../stores/useShopStore';
import { GameManagerService } from '../services/GameManagerService'; // Import GameManagerService
import MainMenu from './screens/MainMenu';
import CharacterSelection from './screens/CharacterSelection';
import EventScreen from './screens/EventScreen';
import LocationScreen from './screens/LocationScreen';
import DialogueScreen from './screens/DialogueScreen';
import dialogueData from '../data/dialogue.json';
import npcsData from '../data/npcs.json';
import { DialogueService } from '../services/DialogueService';
import { useJournalStore } from '../stores/useJournalStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
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
import LocationNav from './LocationNav';
import { lukePrologueSlides } from '../data';

const Game: React.FC = () => {
  const { currentScreen, setScreen, shopId } = useUIStore();
  const { day, hour, minute, passTime } = useWorldTimeStore();
  const { getCurrentLocation } = useLocationStore();
  const { loadShops } = useShopStore();

  // Initialize GameManagerService on component mount
  useEffect(() => {
    GameManagerService.init();
    loadShops();
  }, [loadShops]);

  // Game clock logic
  useEffect(() => {
    const timerId = setInterval(() => {
      passTime(1); // Pass 1 minute every 2 seconds
    }, 2000);

    return () => clearInterval(timerId);
  }, [passTime]);

  const buildInitialDialogue = (npcId: string) => {
    const npc = npcsData[npcId as keyof typeof npcsData];
    if (!npc) return null;
    // Choose alternate dialogue if quest is already active
    let dialogueId = npc.default_dialogue_id as keyof typeof dialogueData;
    if (npcId === 'npc_roberta') {
      const robertaQuest = useJournalStore.getState().quests['roberta_planks_for_the_past'];
      if (robertaQuest && robertaQuest.active && !robertaQuest.completed) {
        dialogueId = 'roberta_planks_active' as keyof typeof dialogueData;
      } else if (robertaQuest && robertaQuest.completed) {
        dialogueId = 'roberta_planks_completed' as keyof typeof dialogueData;
      }
    }
    const dialogue = dialogueData[dialogueId];
    if (!dialogue) return null;
    const firstNode = dialogue.nodes['0'];
    const checkCondition = (condition?: string): boolean => {
      if (!condition || typeof condition !== 'string') return true;
      const parts = condition.split('&&').map(s => s.trim());
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
          responseText: nextNode?.npc_text,
          // Use a branched visited set per choice to avoid cross-branch pruning
          nextOptions: nextNodeId ? mapChoices(nextNodeId, new Set(visited)) : [],
          closesDialogue: Boolean(choice.closes_dialogue),
          onSelect: () => {
            if (choice.action) {
              DialogueService.executeAction(choice.action);
            }
          },
        };
      });
    };
    return {
      text: firstNode.npc_text,
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
        return <EventScreen slides={lukePrologueSlides} onComplete={() => setScreen('inGame')} />;
      case 'inGame':
        return <LocationScreen />;
      case 'dialogue': {
        const npcId = useUIStore.getState().dialogueNpcId || 'npc_roberta';
        const npc = npcsData[npcId as keyof typeof npcsData];
        DialogueService.startDialogue(npcId);
        const initial = buildInitialDialogue(npcId);
        return (
          <DialogueScreen
            npcName={npc?.name || 'NPC'}
            npcPortraitUrl={npc?.portrait || '/assets/icons/DivineFantasy.png'}
            playerPortraitUrl={'/assets/portraits/luke.jpg'}
            initialDialogue={initial || { text: '...', options: [] }}
            onEndDialogue={() => {
              useUIStore.getState().setDialogueNpcId(null);
              setScreen('inGame');
            }}
          />
        );
      }
      case 'dialogueRoberta': {
        const npcId = 'npc_roberta';
        const npc = npcsData[npcId as keyof typeof npcsData];
        DialogueService.startDialogue(npcId);
        const initial = buildInitialDialogue(npcId);
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
        return <LibraryScreen />;
      case 'trade':
        return shopId ? <TradeScreen shopId={shopId} onConfirmTrade={() => {}} onClose={() => setScreen('inGame')} /> : <div className="text-white">No shop selected.</div>;
      case 'tradeConfirmation':
        return <TradeConfirmationScreen />;
      case 'crafting':
        return <CraftingScreen />;
      case 'choiceEvent':
        return <ChoiceEventScreen />;
      case 'combat':
        return <CombatScreen />;
      case 'combatVictory':
        return <VictoryScreen />;
      case 'companion':
        return <CompanionScreen />;
      default:
        return <MainMenu />;
    }
  };

  const isSolidBg = ['characterScreen', 'inventory', 'journal', 'diary', 'trade', 'crafting', 'jobScreen', 'library', 'companion'].includes(currentScreen);
  const isInGame = ['inGame', 'characterScreen', 'inventory', 'journal', 'diary', 'jobScreen', 'companion'].includes(currentScreen);



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
            variant={isSolidBg ? 'solid' : 'floating'}
            activeScreen={currentScreen}
            onOpenSleepWaitModal={handleOpenSleepWaitModal}
            showTimeControls={currentScreen === 'inGame'}
            onOpenOptionsModal={handleOpenOptionsModal}
            onOpenSaveLoadModal={handleOpenSaveLoadModal}
          />
        )}
      </div>
    </div>
  );
};

export default Game;

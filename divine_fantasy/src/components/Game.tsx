import React, { useEffect, useState } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useLocationStore } from '../stores/useLocationStore';
import MainMenu from './screens/MainMenu';
import CharacterSelection from './screens/CharacterSelection';
import EventScreen from './screens/EventScreen';
import LocationScreen from './screens/LocationScreen';
import DialogueScreen from './screens/DialogueScreen';
import dialogueData from '../data/dialogue.json';
import npcsData from '../data/npcs.json';
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
  const { currentScreen, setScreen } = useUIStore();
  const { day, hour, minute, passTime } = useWorldTimeStore();
  const { getCurrentLocation } = useLocationStore();

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
    const dialogueId = npc.default_dialogue_id as keyof typeof dialogueData;
    const dialogue = dialogueData[dialogueId];
    if (!dialogue) return null;
    const firstNode = dialogue.nodes['0'];
    const mapChoices = (nodeId: string): any[] => {
      const node = dialogue.nodes[nodeId as keyof typeof dialogue.nodes];
      if (!node || !node.player_choices) return [];
      return node.player_choices.map((choice: any) => {
        const nextNode = choice.next_node ? dialogue.nodes[choice.next_node as keyof typeof dialogue.nodes] : undefined;
        return {
          text: choice.text + (choice.closes_dialogue ? ' (Leave)' : ''),
          responseText: nextNode?.npc_text,
          nextOptions: nextNode ? mapChoices(choice.next_node) : [],
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
        return <TradeScreen />;
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

  // Responsive background sizing for in-game screens
  const [useContainBg, setUseContainBg] = useState(true);
  useEffect(() => {
    const updateBgMode = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = w / h;
      // Wide screens: prefer contain to avoid aggressive cropping; otherwise cover
      setUseContainBg(aspect >= 1.6);
    };
    updateBgMode();
    window.addEventListener('resize', updateBgMode);
    return () => window.removeEventListener('resize', updateBgMode);
  }, []);

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
                backgroundSize: currentScreen === 'inGame' ? (useContainBg ? '110%' : 'cover') : 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                // Fade edges to black by masking background (transparent reveals black root background)
                WebkitMaskImage: currentScreen === 'inGame' ? 'radial-gradient(130% 130% at 50% 50%, black 70%, transparent 100%)' : undefined,
                maskImage: currentScreen === 'inGame' ? 'radial-gradient(130% 130% at 50% 50%, black 70%, transparent 100%)' : undefined,
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

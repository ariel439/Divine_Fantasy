import React, { useEffect } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import MainMenu from './screens/MainMenu';
import CharacterSelection from './screens/CharacterSelection';
import EventScreen from './screens/EventScreen';
import InGameUI from './screens/InGameUI';
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
import CombatScreen from './screens/CombatScreen';
import VictoryScreen from './screens/VictoryScreen';
import CompanionScreen from './screens/CompanionScreen';

const Game: React.FC = () => {
  const { currentScreen, setScreen } = useUIStore();
  const { day, hour, minute, passTime } = useWorldTimeStore();

  // Game clock logic
  useEffect(() => {
    const timerId = setInterval(() => {
      passTime(1); // Pass 1 minute every 2 seconds
    }, 2000);

    return () => clearInterval(timerId);
  }, [passTime]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'mainMenu':
        return <MainMenu />;
      case 'characterSelection':
        return <CharacterSelection />;
      case 'prologue':
        return <EventScreen />;
      case 'inGame':
        return <InGameUI />;
      case 'dialogue':
        return <DialogueScreen />;
      case 'dialogueRoberta':
        return <DialogueScreen />;
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

  return (
    <div className="fixed inset-0 overflow-hidden text-white bg-black font-sans">
      {/* Background and overlays would go here */}
      <div className="relative z-10 w-full h-full">
        <div key={currentScreen} className="w-full h-full animate-fade-in">
          {renderScreen()}
        </div>
        {/* Modals and global nav would go here */}
      </div>
    </div>
  );
};

export default Game;

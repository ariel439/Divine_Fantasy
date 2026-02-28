import React from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import LocationNav from './LocationNav';
import ModalManager from './ModalManager';
import AudioManager from './AudioManager';

interface GameLayoutProps {
  children: React.ReactNode;
}

const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  const { currentScreen, setScreen, setSleepWaitMode, openModal } = useUIStore();
  const { getCurrentLocation } = useLocationStore();

  const isSolidBg = ['characterScreen', 'inventory', 'journal', 'diary', 'trade', 'crafting', 'jobScreen', 'library', 'companion'].includes(currentScreen);
  const isInGame = ['inGame', 'characterScreen', 'inventory', 'journal', 'diary', 'jobScreen', 'companion'].includes(currentScreen);

  const handleNavigate = (screen: any) => {
    setScreen(screen);
  };

  const handleOpenSleepWaitModal = (mode: 'sleep' | 'wait') => {
    setSleepWaitMode(mode);
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
      <AudioManager />
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
          {children}
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
        
        <ModalManager />
      </div>
    </div>
  );
};

export default GameLayout;

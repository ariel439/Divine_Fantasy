import React from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import LocationNav from './LocationNav';
import ModalManager from './ModalManager';
import AudioManager from './AudioManager';
import { ToastContainer } from './ToastContainer';

interface GameLayoutProps {
  children: React.ReactNode;
}

const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  const { currentScreen, setScreen, setSleepWaitMode, openModal, activeModal, closeModal } = useUIStore();
  const { getCurrentLocation } = useLocationStore();

  const handleOpenSleepWaitModal = React.useCallback((mode: 'sleep' | 'wait') => {
    setSleepWaitMode(mode);
    useWorldTimeStore.getState().setClockPaused(true);
    openModal('sleepWait');
  }, [setSleepWaitMode, openModal]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Only allow shortcuts if we are "in game" or in a sub-screen
      const isGameplayState = ['inGame', 'characterScreen', 'inventory', 'journal', 'diary', 'jobScreen', 'companion', 'crafting', 'trade', 'library'].includes(currentScreen);
      
      if (!isGameplayState) return;

      switch (e.key.toLowerCase()) {
        case 'i':
            if (activeModal) break; // Don't toggle screens if a modal is open
            if (currentScreen === 'inventory') setScreen('inGame');
            else setScreen('inventory');
            break;
        case 'c':
            if (activeModal) break;
            if (currentScreen === 'characterScreen') setScreen('inGame');
            else setScreen('characterScreen');
            break;
        case 'j':
            if (activeModal) break;
            if (currentScreen === 'journal') setScreen('inGame');
            else setScreen('journal');
            break;
        case 'd':
            if (activeModal) break;
            if (currentScreen === 'diary') setScreen('inGame');
            else setScreen('diary');
            break;
        case 't':
            if (activeModal) break;
            if (currentScreen !== 'inGame') break;
            handleOpenSleepWaitModal('wait');
            break;
        case 'escape':
            if (activeModal) {
                closeModal();
            } else if (currentScreen !== 'inGame') {
                setScreen('inGame');
            } else {
                openModal('systemMenu');
            }
            break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, activeModal, setScreen, openModal, closeModal, handleOpenSleepWaitModal]);

  const isSolidBg = ['characterScreen', 'inventory', 'journal', 'diary', 'trade', 'crafting', 'jobScreen', 'library', 'companion'].includes(currentScreen);
  const isInGame = ['inGame', 'characterScreen', 'inventory', 'journal', 'diary', 'jobScreen', 'companion'].includes(currentScreen);

  const handleNavigate = (screen: any) => {
    setScreen(screen);
  };

  return (
    <div className="fixed inset-0 overflow-hidden text-white bg-black font-sans">
      <AudioManager />
      <ToastContainer />
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
            onOpenSystemMenu={() => openModal('systemMenu')}
          />
        )}
        
        <ModalManager />
      </div>
    </div>
  );
};

export default GameLayout;

import React, { useEffect } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useShopStore } from '../stores/useShopStore';
import { GameManagerService } from '../services/GameManagerService';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useCompanionStore } from '../stores/useCompanionStore';
import GameLayout from './GameLayout';
import ScreenManager from './ScreenManager';

const Game: React.FC = () => {
  const { currentScreen, activeModal, openModal } = useUIStore();
  const { loadShops } = useShopStore();
  
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

  // Hotfix: Nerf existing wolf puppy if stats are old OP values
  useEffect(() => {
    const companion = useCompanionStore.getState().activeCompanion;
    if (companion && companion.id === 'wolf_puppy' && companion.stats.attack > 5) {
        console.log('Nerfing Wolf Puppy stats...');
        useCompanionStore.getState().updateCompanionStats({ 
            hp: 40, 
            maxHp: 40, 
            attack: 5, 
            defence: 2,
            dexterity: 12 
        });
    }
  }, []);

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
    const world = useWorldStateStore.getState();
    const npcId = useUIStore.getState().dialogueNpcId;
    if (currentScreen === 'dialogue' && world.introMode && npcId === 'npc_old_leo' && world.tutorialStep <= 2 && !world.seenLeoTutorial && activeModal !== 'tutorial') {
      openModal('tutorial');
    }
    if (currentScreen === 'combat' && !world.getFlag('combat_tutorial_seen') && activeModal !== 'tutorial') {
      openModal('tutorial');
    }
  }, [currentScreen, activeModal]);

  return (
    <GameLayout>
      <ScreenManager />
    </GameLayout>
  );
};

export default Game;

import { create } from 'zustand';

type Screen = 'mainMenu' | 'characterSelection' | 'prologue' | 'inGame' | 'dialogue' | 'dialogueRoberta' | 'characterScreen' | 'inventory' | 'jobScreen' | 'journal' | 'diary' | 'library' | 'trade' | 'tradeConfirmation' | 'crafting' | 'choiceEvent' | 'combat' | 'combatVictory' | 'companion';

type Modal = 'confirmation' | 'options' | 'saveLoad' | 'sleepWait' | 'timedAction' | 'actionSummary' | 'quantity' | null;

interface UIState {
  currentScreen: Screen;
  activeModal: Modal;
  // Actions
  setScreen: (screen: Screen) => void;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  currentScreen: 'mainMenu',
  activeModal: null,
  setScreen: (screen) => {
    set({ currentScreen: screen });
  },
  openModal: (modal) => {
    set({ activeModal: modal });
  },
  closeModal: () => {
    set({ activeModal: null });
  },
}));

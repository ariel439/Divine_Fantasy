import { create } from 'zustand';

type Screen = 'mainMenu' | 'characterSelection' | 'event' | 'location' | 'character' | 'inventory' | 'diary' | 'journal' | 'dialogue' | 'trade' | 'crafting' | 'combat' | 'victory' | 'companion' | 'choiceEvent' | 'tradeConfirmation' | 'job' | 'library';

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

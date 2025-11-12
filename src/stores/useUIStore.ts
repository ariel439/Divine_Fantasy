import { create } from 'zustand';

type Screen = 'mainMenu' | 'characterSelection' | 'prologue' | 'inGame' | 'dialogue' | 'dialogueRoberta' | 'characterScreen' | 'inventory' | 'jobScreen' | 'journal' | 'diary' | 'library' | 'trade' | 'tradeConfirmation' | 'crafting' | 'choiceEvent' | 'combat' | 'combatVictory' | 'companion';

type Modal = 'confirmation' | 'options' | 'saveLoad' | 'sleepWait' | 'timedAction' | 'actionSummary' | 'quantity' | null;

interface UIState {
  currentScreen: Screen;
  activeModal: Modal;
  dialogueNpcId: string | null;
  shopId: string | null;
  // Actions
  setScreen: (screen: Screen) => void;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
  setDialogueNpcId: (npcId: string | null) => void;
  setShopId: (shopId: string | null) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  currentScreen: 'mainMenu',
  activeModal: null,
  dialogueNpcId: null,
  shopId: null,
  setScreen: (screen) => {
    set({ currentScreen: screen });
  },
  openModal: (modal) => {
    set({ activeModal: modal });
  },
  closeModal: () => {
    set({ activeModal: null });
  },
  setDialogueNpcId: (npcId) => {
    set({ dialogueNpcId: npcId });
  },
  setShopId: (shopId) => {
    set({ shopId: shopId });
  },
}));

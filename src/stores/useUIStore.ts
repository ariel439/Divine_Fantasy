import { create } from 'zustand';

type Screen = 'mainMenu' | 'characterSelection' | 'prologue' | 'event' | 'inGame' | 'dialogue' | 'dialogueRoberta' | 'characterScreen' | 'inventory' | 'jobScreen' | 'journal' | 'diary' | 'library' | 'trade' | 'tradeConfirmation' | 'crafting' | 'choiceEvent' | 'combat' | 'combatVictory' | 'companion';

type Modal = 'confirmation' | 'options' | 'saveLoad' | 'sleepWait' | 'timedAction' | 'actionSummary' | 'quantity' | 'tutorial' | null;

interface UIState {
  currentScreen: Screen;
  activeModal: Modal;
  dialogueNpcId: string | null;
  shopId: string | null;
  sleepWaitMode: 'sleep' | 'wait' | null;
  eventSlides: import('../types').Slide[] | null;
  currentEventId: string | null;
  // Actions
  setScreen: (screen: Screen) => void;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
  setDialogueNpcId: (npcId: string | null) => void;
  setShopId: (shopId: string | null) => void;
  setSleepWaitMode: (mode: 'sleep' | 'wait') => void;
  setEventSlides: (slides: import('../types').Slide[] | null) => void;
  setCurrentEventId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  currentScreen: 'mainMenu',
  activeModal: null,
  dialogueNpcId: null,
  shopId: null,
  sleepWaitMode: null,
  eventSlides: null,
  currentEventId: null,
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
  setSleepWaitMode: (mode) => {
    set({ sleepWaitMode: mode });
  },
  setEventSlides: (slides) => {
    set({ eventSlides: slides });
  },
  setCurrentEventId: (id) => {
    set({ currentEventId: id });
  },
}));

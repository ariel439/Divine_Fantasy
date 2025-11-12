import { create } from 'zustand';
import { useCharacterStore } from './useCharacterStore';
import { useJournalStore } from './useJournalStore';
import itemsData from '../data/items.json';

interface InventoryItem {
  id: string;
  quantity: number;
}

interface InventoryState {
  items: InventoryItem[];
  currentWeight: number;
  // Actions
  addItem: (itemId: string, quantity: number) => boolean;
  removeItem: (itemId: string, quantity: number) => boolean;
  useItem: (itemId: string) => boolean;
  getCurrentWeight: () => number;
  getItemQuantity: (itemId: string) => number;
  canAddItem: (itemId: string, quantity: number) => boolean;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  currentWeight: 0,
  addItem: (itemId, quantity) => {
    const itemData = itemsData[itemId as keyof typeof itemsData];
    if (!itemData) return false;

    const newWeight = get().currentWeight + (itemData.weight * quantity);
    const maxWeight = useCharacterStore.getState().maxWeight;

    if (newWeight > maxWeight) return false;

    set((state) => {
      const existingItem = state.items.find(item => item.id === itemId);
      if (existingItem) {
        existingItem.quantity += quantity;
        return {
          items: [...state.items],
          currentWeight: newWeight
        };
      } else {
        return {
          items: [...state.items, { id: itemId, quantity }],
          currentWeight: newWeight
        };
      }
    });
    // Sync quest progress (e.g., Roberta's planks quest)
    try {
      useJournalStore.getState().syncQuestProgress('roberta_planks_for_the_past');
    } catch (e) {
      // Ignore if journal store not ready
    }
    return true;
  },
  removeItem: (itemId, quantity) => {
    const itemData = itemsData[itemId as keyof typeof itemsData];
    if (!itemData) return false;

    set((state) => {
      const existingItem = state.items.find(item => item.id === itemId);
      if (!existingItem || existingItem.quantity < quantity) return state;

      const newWeight = state.currentWeight - (itemData.weight * quantity);
      existingItem.quantity -= quantity;

      if (existingItem.quantity <= 0) {
        return {
          items: state.items.filter(item => item.id !== itemId),
          currentWeight: newWeight
        };
      } else {
        return {
          items: [...state.items],
          currentWeight: newWeight
        };
      }
    });
    // Sync quest progress after removal too (in case quantities drop below thresholds)
    try {
      useJournalStore.getState().syncQuestProgress('roberta_planks_for_the_past');
    } catch (e) {
      // Ignore if journal store not ready
    }
    return true;
  },
  useItem: (itemId) => {
    const itemData = itemsData[itemId as keyof typeof itemsData];
    if (!itemData) return false;

    // For consumables, use the eat action
    if (itemData.type === 'consumable') {
      const removed = get().removeItem(itemId, 1);
      if (removed) {
        useCharacterStore.getState().eat(itemId);
      }
      return removed;
    }

    // For other items, just log for now
    console.log('Using item:', itemId);
    return true;
  },
  getCurrentWeight: () => {
    return get().currentWeight;
  },
  getItemQuantity: (itemId) => {
    const item = get().items.find(item => item.id === itemId);
    return item?.quantity || 0;
  },
  canAddItem: (itemId, quantity) => {
    const itemData = itemsData[itemId as keyof typeof itemsData];
    if (!itemData) return false;

    const newWeight = get().currentWeight + (itemData.weight * quantity);
    return newWeight <= useCharacterStore.getState().maxWeight;
  },
}));

import { create } from 'zustand';
import { useCharacterStore } from './useCharacterStore';
import { useJournalStore } from './useJournalStore';
import { useUIStore } from './useUIStore';
import { useLocationStore } from './useLocationStore';
import { useWorldStateStore } from './useWorldStateStore';
import { useToastStore } from './useToastStore';
import itemsData from '../data/items.json';
import booksData from '../data/books.json';

interface InventoryItem {
  id: string;
  quantity: number;
  uuid?: string; // Add uuid to InventoryItem interface
}

export interface InventoryState {
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

    set((state) => {
      const itemData = itemsData[itemId as keyof typeof itemsData];
      if (itemData.stackable) {
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
      } else {
        // If not stackable, add as new individual items with unique UUIDs
        const newItems = [];
        for (let i = 0; i < quantity; i++) {
          newItems.push({ id: itemId, quantity: 1, uuid: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) });
        }
        return {
          items: [...state.items, ...newItems],
          currentWeight: newWeight
        };
      }
    });
    return true;
  },
  removeItem: (itemId, quantity) => {
    const itemData = itemsData[itemId as keyof typeof itemsData];
    if (!itemData) return false;

    let removedSuccessfully = false;

    set((state) => {
      const itemData = itemsData[itemId as keyof typeof itemsData];
      if (itemData.stackable) {
        const existingItem = state.items.find(item => item.id === itemId);
        if (!existingItem || existingItem.quantity < quantity) {
          // If item doesn't exist or not enough quantity, return current state and indicate failure
          removedSuccessfully = false;
          return state;
        }

        const newWeight = state.currentWeight - (itemData.weight * quantity);
        existingItem.quantity -= quantity;

        if (existingItem.quantity <= 0) {
          removedSuccessfully = true;
          return {
            items: state.items.filter(item => item.id !== itemId),
            currentWeight: newWeight
          };
        } else {
          removedSuccessfully = true;
          return {
            items: [...state.items],
            currentWeight: newWeight
          };
        }
      } else {
        // If not stackable, remove individual items
        let itemsToRemove = quantity;
        const newItems = [];
        let currentWeightRemoved = 0;

        for (const item of state.items) {
          if (item.id === itemId && itemsToRemove > 0) {
            currentWeightRemoved += itemData.weight;
            itemsToRemove--;
          } else {
            newItems.push(item);
          }
        }

        if (itemsToRemove === 0) {
          removedSuccessfully = true;
          return {
            items: newItems,
            currentWeight: state.currentWeight - currentWeightRemoved
          };
        } else {
          removedSuccessfully = false;
          return state;
        }
      }
    });
    // Sync quest progress after removal too (in case quantities drop below thresholds)
    try {
      useJournalStore.getState().syncQuestProgress('roberta_planks_for_the_past');
    } catch (e) {
      // Ignore if journal store not ready
    }
    return removedSuccessfully;
  },
  useItem: (itemId) => {
    const itemData = itemsData[itemId as keyof typeof itemsData];
    if (!itemData) return false;

    if (itemId === 'bandage') {
      const character = useCharacterStore.getState();
      const addToast = useToastStore.getState().addToast;
      if (character.effects.bleeding <= 0) {
        addToast('You are not bleeding.', 'info', 2000);
        return false;
      }

      const removed = get().removeItem(itemId, 1);
      if (!removed) return false;

      character.reduceBleeding(4);
      const remainingBleed = useCharacterStore.getState().effects.bleeding;
      addToast(
        remainingBleed > 0
          ? `You bind the wound. ${remainingBleed}h of bleeding remain.`
          : 'You bind the wound and stop the bleeding.',
        'success',
        2500,
        'Bandage Applied'
      );
      return true;
    }

    const rawFoodBlocked = ['raw_meat', 'fish_sardine', 'fish_trout', 'fish_pike'];
    if (rawFoodBlocked.includes(itemId)) {
      return false;
    }

    // For consumables, use the eat action
    if (itemData.type === 'consumable') {
      const removed = get().removeItem(itemId, 1);
      if (removed) {
        useCharacterStore.getState().eat(itemId);
      }
      return removed;
    }

    const bookId = (itemData as any).bookId as string | undefined;
    if (bookId) {
      const book = booksData[bookId as keyof typeof booksData];
      if (!book) return false;

      const ui = useUIStore.getState();
      ui.setLibraryBooks([book as any]);
      ui.setSelectedLibraryBookId(bookId);
      ui.setLibraryReturnScreen('inventory');
      ui.setScreen('library');
      return true;
    }

    if (itemId === 'spade') {
      const currentLocation = useLocationStore.getState().currentLocationId;
      const world = useWorldStateStore.getState();
      const addToast = useToastStore.getState().addToast;

      if (
        currentLocation === 'isolated_beach' &&
        world.getFlag('whitefang_beach_necklace_buried') &&
        !world.getFlag('whitefang_beach_necklace_recovered')
      ) {
        const ui = useUIStore.getState();
        ui.setCurrentEventId('whitefang_beach_necklace_pickup');
        ui.setScreen('choiceEvent');
        return true;
      }

      addToast('Nothing here looks worth digging up.', 'info', 2000);
      return false;
    }

    // For other items, just log for now
    console.log('Using item:', itemId);
    return true;
  },
  getCurrentWeight: () => {
    const inventoryWeight = get().currentWeight;
    const character = useCharacterStore.getState();
    const combatEquippedWeight = Object.entries(character.equippedItems).reduce((sum, [slot, item]) => {
      if (!item) return sum;
      if (slot === 'shield' && item.combatTags?.includes('two_handed')) return sum;
      return sum + (item.weight * 0.5);
    }, 0);
    const socialEquippedWeight = Object.values(character.equipmentLoadouts[2] || {}).reduce((sum, itemId) => {
      if (!itemId) return sum;
      const itemData = itemsData[itemId as keyof typeof itemsData];
      if (!itemData) return sum;
      return sum + (itemData.weight * 0.5);
    }, 0);

    return inventoryWeight + combatEquippedWeight + socialEquippedWeight;
  },
  getItemQuantity: (itemId) => {
    const item = get().items.find(item => item.id === itemId);
    return item?.quantity || 0;
  },
  canAddItem: (itemId, quantity) => {
    const itemData = itemsData[itemId as keyof typeof itemsData];
    if (!itemData) return false;
    return quantity > 0;
  },
}));

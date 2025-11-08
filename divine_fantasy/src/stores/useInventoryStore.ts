import { create } from 'zustand';

interface InventoryItem {
  id: string;
  quantity: number;
}

interface InventoryState {
  items: InventoryItem[];
  currentWeight: number;
  // Actions
  addItem: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string, quantity: number) => void;
  useItem: (itemId: string) => void;
  getCurrentWeight: () => number;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  currentWeight: 0,
  addItem: (itemId, quantity) => {
    // TODO: Implement add item logic with weight check
    console.log('Adding item:', itemId, quantity);
  },
  removeItem: (itemId, quantity) => {
    // TODO: Implement remove item logic
    console.log('Removing item:', itemId, quantity);
  },
  useItem: (itemId) => {
    // TODO: Implement use item logic
    console.log('Using item:', itemId);
  },
  getCurrentWeight: () => {
    // TODO: Calculate current weight from items
    return get().currentWeight;
  },
}));

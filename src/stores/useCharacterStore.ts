import { create } from 'zustand';
import { useWorldTimeStore } from './useWorldTimeStore';
import { useInventoryStore } from './useInventoryStore';
import type { EquipmentSlot, Item } from '../types';

interface CharacterState {
  // Core Attributes
  attributes: {
    strength: number;
    agility: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  // Core Vitals
  hp: number;
  energy: number;
  hunger: number;
  // Currency
  currency: {
    copper: number;
    silver: number;
    gold: number;
  };
  // Carry Weight
  maxWeight: number;
  // Bio
  bio?: {
    name: string;
    image: string;
    description: string;
    gender: string;
    race: string;
    birthplace: string;
    born: string;
  };
  // Equipment
  equippedItems: Partial<Record<EquipmentSlot, Item>>;
  // Actions
  eat: (itemId: string) => void;
  sleep: (bedType: string) => void;
  wait: (hours: number) => void;
  addCurrency: (type: 'copper' | 'silver' | 'gold', amount: number) => void;
  removeCurrency: (copper: number, silver?: number, gold?: number) => boolean;
  equipItem: (item: Item) => void;
  unequipItem: (item: Item) => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  // Initial state - will be set by GameManagerService on new game
  attributes: {
    strength: 1,
    agility: 1,
    intelligence: 1,
    wisdom: 1,
    charisma: 1,
  },
  hp: 100,
  energy: 100,
  hunger: 0,
  currency: {
    copper: 0,
    silver: 0,
    gold: 0,
  },
  maxWeight: 50,
  equippedItems: {},
  eat: (itemId) => {
    // Load item data (simplified - in real implementation, load from items.json)
    const itemEffects: Record<string, any> = {
      'bread': { hunger: -20 },
      'cheese': { hunger: -15 },
      'fish_sardine': { hunger: -5 },
      'fish_trout': { hunger: -10 },
      'fish_pike': { hunger: -20 },
      'food_sardine_grilled': { hunger: -15 },
      'food_trout_grilled': { hunger: -30 },
      'food_pike_grilled': { hunger: -60 },
      'ale': { energy: 10 }
    };

    const effect = itemEffects[itemId];
    if (effect) {
      set((state) => ({
        hunger: Math.max(0, state.hunger + (effect.hunger || 0)),
        energy: Math.min(100, state.energy + (effect.energy || 0))
      }));
      // Pass 5 minutes eating
      useWorldTimeStore.getState().passTime(5);
    }
  },
  sleep: (bedType) => {
    const bedMultipliers: Record<string, number> = {
      'free': 0.5, // Poor sleep quality
      'inn': 1.0,  // Normal sleep
      'home': 1.2  // Good sleep
    };

    const multiplier = bedMultipliers[bedType] || 1.0;
    const hours = bedType === 'free' ? 8 : 8; // All sleep is 8 hours for now

    set((state) => ({
      hp: Math.min(100, state.hp + (20 * multiplier)),
      energy: Math.min(100, state.energy + (50 * multiplier))
    }));

    // Pass time for sleep
    useWorldTimeStore.getState().passTime(hours * 60);
  },
  wait: (hours) => {
    useWorldTimeStore.getState().passTime(hours * 60);
  },
  addCurrency: (type, amount) => {
    set((state) => {
      let c = state.currency.copper;
      let s = state.currency.silver;
      let g = state.currency.gold;
      if (type === 'copper') c += amount; else if (type === 'silver') s += amount; else g += amount;
      // Normalize
      if (c >= 100) { s += Math.floor(c / 100); c = c % 100; }
      if (s >= 100) { g += Math.floor(s / 100); s = s % 100; }
      return { currency: { copper: c, silver: s, gold: g } };
    });
  },
  removeCurrency: (copper, silver = 0, gold = 0) => {
    const totalCopper = copper + (silver * 100) + (gold * 10000);
    const state = get();
    const availableCopper = state.currency.copper + state.currency.silver * 100 + state.currency.gold * 10000;
    if (availableCopper >= totalCopper) {
      let remaining = availableCopper - totalCopper;
      const newGold = Math.floor(remaining / 10000);
      remaining = remaining % 10000;
      const newSilver = Math.floor(remaining / 100);
      const newCopper = remaining % 100;
      set({ currency: { gold: newGold, silver: newSilver, copper: newCopper } });
      return true;
    }
    return false;
  },
  equipItem: (item) => {
    const { equipmentSlot } = item;
    if (!equipmentSlot) return;

    const { equippedItems } = get();
    const currentlyEquipped = equippedItems[equipmentSlot];

    // Remove from inventory first
    const removed = useInventoryStore.getState().removeItem(item.id, 1);
    if (!removed) return; // Item not in inventory or failed to remove

    // If there was an item equipped, add it back to inventory
    if (currentlyEquipped) {
      useInventoryStore.getState().addItem(currentlyEquipped.id, 1);
    }

    // Equip the new item
    set((state) => ({
      equippedItems: {
        ...state.equippedItems,
        [equipmentSlot]: item,
      },
    }));
  },
  unequipItem: (item) => {
    const { equipmentSlot } = item;
    if (!equipmentSlot) return;

    // Add to inventory first
    const added = useInventoryStore.getState().addItem(item.id, 1);
    if (!added) return; // Inventory full or failed to add

    // Unequip the item
    set((state) => {
      const newEquippedItems = { ...state.equippedItems };
      delete newEquippedItems[equipmentSlot];
      return { equippedItems: newEquippedItems };
    });
  },
}));

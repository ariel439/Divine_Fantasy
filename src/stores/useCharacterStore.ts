import { create } from 'zustand';
import { useWorldTimeStore } from './useWorldTimeStore';
import { useInventoryStore } from './useInventoryStore';
import { useAudioStore } from './useAudioStore';
import itemsData from '../data/items.json';
import type { EquipmentSlot, Item } from '../types';

interface CharacterState {
  // Core Attributes
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  characterId?: string;
  // Core Vitals
  hp: number;
  maxHp: number;
  energy: number;
  hunger: number;
  socialEnergy: number;
  maxSocialEnergy: number;
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
  sleep: (hours: number, quality?: number) => void;
  wait: (hours: number) => void;
  addCurrency: (type: 'copper' | 'silver' | 'gold', amount: number) => void;
  removeCurrency: (copper: number, silver?: number, gold?: number) => boolean;
  equipItem: (item: Item) => void;
  unequipItem: (item: Item) => void;
  tickHunger: (minutes: number) => void;
  recalculateStats: () => void;
  getMaxEnergy: () => number;
}

import { useWorldStateStore } from './useWorldStateStore';

export const useCharacterStore = create<CharacterState>((set, get) => ({
  // Initial state - will be set by GameManagerService on new game
  attributes: {
    strength: 1,
    dexterity: 1,
    intelligence: 1,
    wisdom: 1,
    charisma: 1,
  },
  hp: 100,
  maxHp: 100,
  energy: 100,
  hunger: 60,
  socialEnergy: 1,
  maxSocialEnergy: 1,
  currency: {
    copper: 0,
    silver: 0,
    gold: 0,
  },
  maxWeight: 50,
  equippedItems: {},
  eat: (itemId) => {
    const itemData = itemsData[itemId as keyof typeof itemsData] as { effects?: { hunger?: number; energy?: number } } | undefined;
    
    if (itemData && itemData.effects) {
      const hungerChange = itemData.effects.hunger || 0;
      const energyChange = itemData.effects.energy || 0;

      set((state) => ({
        hunger: Math.min(100, state.hunger + hungerChange),
        energy: Math.min(100, state.energy + energyChange)
      }));
      
      // Play eat sound
      const { sfxEnabled, sfxVolume } = useAudioStore.getState();
      if (sfxEnabled) {
          const audio = new Audio('/assets/sfx/eat.mp3');
          audio.volume = sfxVolume;
          audio.play().catch(() => {});
      }

      // Pass 5 minutes eating
      useWorldTimeStore.getState().passTime(5);
    }
  },
  sleep: (hours: number, quality: number = 1.0) => {
    // Drain hunger while sleeping (1 per hour)
    const hungerDrain = hours;

    set((state) => {
      // Calculate new hunger
      let newHunger = Math.max(0, state.hunger - hungerDrain);
      
      // Calculate regen
      const canHeal = state.hunger > 0;
      
      // 40 HP per 8 hours at quality 1.0 = 5 HP/hour
      const hpPerEightHours = 40;
      const hpRegen = canHeal ? (hpPerEightHours * quality * (hours / 8)) : 0;
      
      // Energy regen: 10 per hour * quality
      const energyRegen = 10 * hours * quality;
      
      return {
        hp: Math.min(100, state.hp + hpRegen),
        energy: Math.min(100, state.energy + energyRegen),
        hunger: newHunger
      };
    });
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
  tickHunger: (minutes) => {
    // Prevent drain during intro mode
    if (useWorldStateStore.getState().introMode) return;

    set((state) => {
      // Passive drain: -1 per hour
      const drain = minutes / 60;
      let newHunger = state.hunger - drain;
      let newHp = state.hp;
      
      // Starvation damage
      if (newHunger <= 0) {
        newHunger = 0;
        // -1 HP per hour
        newHp = Math.max(0, state.hp - drain);
      }
      
      return { 
        hunger: newHunger,
        hp: newHp
      };
    });
  },
  recalculateStats: () => {
    set((state) => {
      const { strength, charisma } = state.attributes;
      
      // Calculate Max HP: Base 50 + (Strength * 10) + Item Bonuses
      let bonusHp = 0;
      Object.values(state.equippedItems).forEach((item: any) => {
        if (item && item.stats) {
           // Handle case-insensitive keys
           const stats = Object.keys(item.stats).reduce((acc: any, key) => {
             acc[key.toLowerCase()] = item.stats[key];
             return acc;
           }, {});
           
           if (typeof stats.hp === 'number') bonusHp += stats.hp;
           if (typeof stats.health === 'number') bonusHp += stats.health;
        }
      });

      const newMaxHp = 50 + (strength * 10) + bonusHp;

      return {
        maxWeight: 30 + (strength * 5),
        maxSocialEnergy: charisma,
        // Ensure social energy doesn't exceed new max
        socialEnergy: Math.min(state.socialEnergy, charisma),
        maxHp: newMaxHp,
        // Cap current HP to new Max HP
        hp: Math.min(state.hp, newMaxHp)
      };
    });
  },
  getMaxEnergy: () => {
    const { hunger } = get();
    // Full (80-100): +10%
    if (hunger >= 80) return 110;
    // Hungry (< 20): -20%
    if (hunger < 20 && hunger > 0) return 80;
    // Starving (0): -50%
    if (hunger <= 0) return 50;
    
    return 100;
  }
}));

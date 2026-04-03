import { create } from 'zustand';
import { useWorldTimeStore } from './useWorldTimeStore';
import { useInventoryStore } from './useInventoryStore';
import { useAudioStore } from './useAudioStore';
import { useCompanionStore } from './useCompanionStore';
import itemsData from '../data/items.json';
import type {
  CombatEquipmentLoadoutSlotMap,
  CombatEquipmentSlot,
  EquipmentSlot,
  Item,
  SocialEquipmentLoadoutSlotMap,
  SocialEquipmentSlot,
} from '../types';
import { getMaxSocialEnergy } from '../utils/socialEnergy';

interface CharacterState {
  // Core Attributes
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
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
  explorationEscapes: number;
  maxExplorationEscapes: number;
  // Currency
  currency: {
    copper: number;
    silver: number;
    gold: number;
  };
  // Carry Weight
  maxWeight: number;
  constitutionBonusHp: number;
  effects: {
    bleeding: number;
    bleedMinutesAccumulated: number;
  };
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
  languages: Record<string, 'None' | 'Basic' | 'Fluent' | 'Native'>;
  // Equipment
  equippedItems: Partial<Record<CombatEquipmentSlot, Item>>;
  equipmentLoadouts: {
    1: CombatEquipmentLoadoutSlotMap;
    2: SocialEquipmentLoadoutSlotMap;
  };
  activeEquipmentLoadout: 1 | 2;
  // Actions
  eat: (itemId: string) => void;
  sleep: (hours: number, quality?: number) => void;
  wait: (hours: number) => void;
  addCurrency: (type: 'copper' | 'silver' | 'gold', amount: number) => void;
  removeCurrency: (copper: number, silver?: number, gold?: number) => boolean;
  addBleeding: (amount: number) => void;
  reduceBleeding: (amount: number) => void;
  tickBleeding: (minutes: number) => void;
  equipItem: (item: Item) => void;
  unequipItem: (item: Item) => void;
  tickHunger: (minutes: number) => void;
  recalculateStats: () => void;
  updateStats: (changes: Partial<{ hp: number; energy: number; hunger: number; socialEnergy: number }>) => void;
  getMaxEnergy: () => number;
  saveEquipmentLoadout: (slot: 1 | 2) => void;
  applyEquipmentLoadout: (slot: 1 | 2) => void;
  setActiveEquipmentLoadout: (slot: 1 | 2) => void;
  refreshSocialEnergyCap: () => void;
}

import { useWorldStateStore } from './useWorldStateStore';

const SOCIAL_FORWARD_SLOTS: SocialEquipmentSlot[] = ['cape', 'amulet', 'chest', 'gloves', 'legs', 'boots', 'ring'];

const isSocialEquipment = (item: Item): boolean => {
  if (!item.equipmentSlot) return false;
  if (item.equipmentSlot === 'weapon' || item.equipmentSlot === 'shield') return false;
  if ((item.threatTier ?? 0) > 0) return false;
  return SOCIAL_FORWARD_SLOTS.includes(item.equipmentSlot) && (item.presentationTier ?? 0) > 0;
};

const snapshotCombatEquipment = (equippedItems: Partial<Record<CombatEquipmentSlot, Item>>) =>
  Object.entries(equippedItems).reduce<CombatEquipmentLoadoutSlotMap>((acc, [key, equipped]) => {
    if (!equipped) return acc;
    acc[key as CombatEquipmentSlot] = equipped.id;
    return acc;
  }, {});

export const useCharacterStore = create<CharacterState>((set, get) => ({
  // Initial state - will be set by GameManagerService on new game
  attributes: {
    strength: 5,
    dexterity: 5,
    intelligence: 5,
    charisma: 5,
  },
  hp: 100,
  maxHp: 100,
  energy: 100,
  hunger: 60,
  socialEnergy: 1,
  maxSocialEnergy: 1,
  explorationEscapes: 0,
  maxExplorationEscapes: 0,
  currency: {
    copper: 0,
    silver: 0,
    gold: 0,
  },
  maxWeight: 50,
  constitutionBonusHp: 0,
  effects: {
    bleeding: 0,
    bleedMinutesAccumulated: 0,
  },
  languages: {
    veyric: 'Native',
    shenhaic: 'None',
  },
  equippedItems: {},
  equipmentLoadouts: {
    1: {},
    2: {},
  },
  activeEquipmentLoadout: 1,
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
  updateStats: (changes) => {
    set((state) => {
      const newState = { ...state };
      if (changes.hp !== undefined) newState.hp = Math.min(state.maxHp, Math.max(0, state.hp + changes.hp));
      if (changes.energy !== undefined) newState.energy = Math.min(100, Math.max(0, state.energy + changes.energy));
      if (changes.hunger !== undefined) newState.hunger = Math.min(100, Math.max(0, state.hunger + changes.hunger));
      if (changes.socialEnergy !== undefined) newState.socialEnergy = Math.min(state.maxSocialEnergy, Math.max(0, state.socialEnergy + changes.socialEnergy));
      return newState;
    });
  },
  sleep: (hours: number, quality: number = 1.0) => {
    set((state) => {
      // Calculate regen
      const canHeal = state.hunger > 0 && state.effects.bleeding <= 0;
      
      // 40 HP per 8 hours at quality 1.0 = 5 HP/hour
      const hpPerEightHours = 40;
      const hpRegen = canHeal ? (hpPerEightHours * quality * (hours / 8)) : 0;
      
      // Energy regen: 10 per hour * quality
      const energyRegen = 10 * hours * quality;
      
      return {
        hp: Math.min(state.maxHp, state.hp + hpRegen),
        energy: Math.min(100, state.energy + energyRegen)
      };
    });
    try {
      useCompanionStore.getState().healCompanions(hours, quality);
    } catch {}
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
  addBleeding: (amount) => {
    if (amount <= 0) return;
    set((state) => ({
      effects: {
        ...state.effects,
        bleeding: Math.max(0, Math.min(12, state.effects.bleeding + amount)),
      },
    }));
  },
  reduceBleeding: (amount) => {
    if (amount <= 0) return;
    set((state) => {
      const nextBleeding = Math.max(0, state.effects.bleeding - amount);
      return {
        effects: {
          ...state.effects,
          bleeding: nextBleeding,
          bleedMinutesAccumulated: nextBleeding > 0 ? state.effects.bleedMinutesAccumulated : 0,
        },
      };
    });
  },
  tickBleeding: (minutes) => {
    if (minutes <= 0) return;
    if (useWorldStateStore.getState().introMode) return;
    if (useWorldStateStore.getState().getFlag('suppress_time_vitals')) return;

    set((state) => {
      if (state.effects.bleeding <= 0) {
        if (state.effects.bleedMinutesAccumulated === 0) return state;
        return {
          effects: {
            bleeding: 0,
            bleedMinutesAccumulated: 0,
          },
        };
      }

      let bleeding = state.effects.bleeding;
      let hp = state.hp;
      let accumulated = state.effects.bleedMinutesAccumulated + minutes;

      while (accumulated >= 60 && bleeding > 0) {
        const bleedDamage = Math.ceil(bleeding / 4);
        hp = Math.max(0, hp - bleedDamage);
        bleeding = Math.max(0, bleeding - 1);
        accumulated -= 60;
      }

      if (bleeding <= 0) accumulated = 0;

      return {
        hp,
        effects: {
          bleeding,
          bleedMinutesAccumulated: accumulated,
        },
      };
    });
  },
  equipItem: (item) => {
    const { equipmentSlot } = item;
    if (!equipmentSlot) return;
    const targetLoadout = isSocialEquipment(item) ? 2 : 1;
    if (equipmentSlot === 'weapon' && useWorldStateStore.getState().getFlag('whitefang_bound')) {
      const lockedWeapon = get().equippedItems.weapon;
      if (lockedWeapon?.id === 'white_fang_of_heaven') return;
    }

    if (targetLoadout === 2) {
      const removed = useInventoryStore.getState().removeItem(item.id, 1);
      if (!removed) return;

      set((state) => {
        const nextSocialLoadout = { ...state.equipmentLoadouts[2] };
        const currentlyEquippedSocialId = nextSocialLoadout[equipmentSlot];
        if (currentlyEquippedSocialId && currentlyEquippedSocialId !== item.id) {
          useInventoryStore.getState().addItem(currentlyEquippedSocialId, 1);
        }
        nextSocialLoadout[equipmentSlot] = item.id;

        return {
          equipmentLoadouts: {
            ...state.equipmentLoadouts,
            2: nextSocialLoadout,
          },
          activeEquipmentLoadout: 2,
        };
      });
      return;
    }

    const { equippedItems } = get();
    const currentlyEquipped = equippedItems[equipmentSlot];
    const isTwoHandedWeapon = equipmentSlot === 'weapon' && Boolean(item.combatTags?.includes('two_handed'));
    const equippedShield = equippedItems.shield;

    // Remove from inventory first
    const removed = useInventoryStore.getState().removeItem(item.id, 1);
    if (!removed) return; // Item not in inventory or failed to remove

    // If there was an item equipped, add it back to inventory
    if (currentlyEquipped) {
      useInventoryStore.getState().addItem(currentlyEquipped.id, 1);
    }
    if (isTwoHandedWeapon && equippedShield && equippedShield.id !== item.id) {
      useInventoryStore.getState().addItem(equippedShield.id, 1);
    }

    // Equip the new item
    set((state) => {
      const nextEquippedItems = {
        ...state.equippedItems,
        [equipmentSlot]: item,
        ...(isTwoHandedWeapon ? { shield: item } : {}),
      };
      const snapshot = snapshotCombatEquipment(nextEquippedItems);
      return {
        equippedItems: nextEquippedItems,
        equipmentLoadouts: {
          ...state.equipmentLoadouts,
          1: snapshot,
        },
        activeEquipmentLoadout: 1,
      };
    });
    get().recalculateStats();
  },
  unequipItem: (item) => {
    const { equipmentSlot } = item;
    if (!equipmentSlot) return;
    const socialLoadout = get().equipmentLoadouts[2];
    const isSocialItemEquipped = SOCIAL_FORWARD_SLOTS.includes(equipmentSlot as SocialEquipmentSlot)
      && socialLoadout[equipmentSlot as SocialEquipmentSlot] === item.id;

    if (isSocialItemEquipped) {
      const added = useInventoryStore.getState().addItem(item.id, 1);
      if (!added) return;
      set((state) => {
        const nextSocialLoadout = { ...state.equipmentLoadouts[2] };
        delete nextSocialLoadout[equipmentSlot];
        return {
          equipmentLoadouts: {
            ...state.equipmentLoadouts,
            2: nextSocialLoadout,
          },
          activeEquipmentLoadout: 2,
        };
      });
      return;
    }

    if (
      equipmentSlot === 'weapon' &&
      useWorldStateStore.getState().getFlag('whitefang_bound') &&
      item.id === 'white_fang_of_heaven'
    ) {
      return;
    }

    // Add to inventory first
    const added = useInventoryStore.getState().addItem(item.id, 1);
    if (!added) return; // Inventory full or failed to add

    // Unequip the item
    set((state) => {
      const newEquippedItems = { ...state.equippedItems };
      delete newEquippedItems[equipmentSlot];
      if (equipmentSlot === 'weapon' && item.combatTags?.includes('two_handed')) {
        delete newEquippedItems.shield;
      }
      const snapshot = snapshotCombatEquipment(newEquippedItems);
      return {
        equippedItems: newEquippedItems,
        equipmentLoadouts: {
          ...state.equipmentLoadouts,
          1: snapshot,
        },
        activeEquipmentLoadout: 1,
      };
    });
    get().recalculateStats();
  },
  tickHunger: (minutes) => {
    // Prevent drain during intro mode
    if (useWorldStateStore.getState().introMode) return;
    if (useWorldStateStore.getState().getFlag('suppress_time_vitals')) return;

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

    const world = useWorldStateStore.getState();
    const autoEatThreshold = parseInt(world.getData('auto_eat_threshold') || '0', 10) || 0;
    const rawFoodBlocked = ['raw_meat', 'fish_sardine', 'fish_trout', 'fish_pike'];
    if (autoEatThreshold <= 0) return;

    const currentHunger = get().hunger;
    if (currentHunger >= autoEatThreshold) return;

    const needed = autoEatThreshold - currentHunger;
    const edibleCandidates = useInventoryStore.getState().items
      .map((invItem) => {
        const itemData = itemsData[invItem.id as keyof typeof itemsData] as { type?: string; effects?: { hunger?: number } } | undefined;
        const hungerGain = Number(itemData?.effects?.hunger || 0);
        return {
          id: invItem.id,
          quantity: invItem.quantity,
          type: itemData?.type,
          hungerGain,
        };
      })
      .filter((item) => item.type === 'consumable' && item.hungerGain > 0 && !rawFoodBlocked.includes(item.id))
      .sort((a, b) => a.hungerGain - b.hungerGain);

    if (edibleCandidates.length === 0) return;

    const bestCandidate =
      edibleCandidates.find((item) => item.hungerGain >= needed) ||
      edibleCandidates[edibleCandidates.length - 1];

    const eatCount = Math.min(bestCandidate.quantity, Math.ceil(needed / bestCandidate.hungerGain));
    if (eatCount <= 0) return;

    const removed = useInventoryStore.getState().removeItem(bestCandidate.id, eatCount);
    if (!removed) return;

    set((state) => ({
      hunger: Math.min(100, state.hunger + bestCandidate.hungerGain * eatCount),
    }));
  },
  recalculateStats: () => {
    set((state) => {
      const { strength } = state.attributes;
      const constitutionHpBonus = state.constitutionBonusHp || 0;
      
      // Calculate Max HP: Base 50 + (Strength * 10) + Item Bonuses
      let bonusHp = 0;
      Object.entries(state.equippedItems).forEach(([slot, item]: any) => {
        if (item && item.stats) {
           if (slot === 'shield' && item.combatTags?.includes('two_handed')) return;
           // Handle case-insensitive keys
           const stats = Object.keys(item.stats).reduce((acc: any, key) => {
             acc[key.toLowerCase()] = item.stats[key];
             return acc;
           }, {});
           
           if (typeof stats.hp === 'number') bonusHp += stats.hp;
           if (typeof stats.health === 'number') bonusHp += stats.health;
        }
      });

      const newMaxHp = 50 + (strength * 10) + constitutionHpBonus + bonusHp;

      return {
        maxWeight: 30 + (strength * 5),
        maxHp: newMaxHp,
        // Cap current HP to new Max HP
        hp: Math.min(state.hp, newMaxHp)
      };
    });
  },
  refreshSocialEnergyCap: () => {
    const state = get();
    let persuasionLevel = 1;
    let coercionLevel = 1;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useSkillStore } = require('./useSkillStore');
      persuasionLevel = useSkillStore.getState().getSkillLevel('persuasion');
      coercionLevel = useSkillStore.getState().getSkillLevel('coercion');
    } catch {
      persuasionLevel = 1;
      coercionLevel = 1;
    }

    const maxSocialEnergy = getMaxSocialEnergy(
      state.attributes.charisma,
      persuasionLevel,
      coercionLevel
    );

    set((current) => ({
      maxSocialEnergy,
      socialEnergy: Math.min(current.socialEnergy, maxSocialEnergy),
    }));
  },
  saveEquipmentLoadout: (slot) => {
    if (slot === 1) {
      const snapshot = snapshotCombatEquipment(get().equippedItems);
      set((state) => ({
        equipmentLoadouts: {
          ...state.equipmentLoadouts,
          1: snapshot,
        },
        activeEquipmentLoadout: 1,
      }));
      return;
    }

    set((state) => ({
      equipmentLoadouts: {
        ...state.equipmentLoadouts,
        2: { ...state.equipmentLoadouts[2] },
      },
      activeEquipmentLoadout: 2,
    }));
  },
  applyEquipmentLoadout: (slot) => {
    set({ activeEquipmentLoadout: slot });
  },
  setActiveEquipmentLoadout: (slot) => set({ activeEquipmentLoadout: slot }),
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

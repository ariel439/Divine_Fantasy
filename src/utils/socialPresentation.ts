import itemsData from '../data/items.json';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import type { CombatEquipmentSlot, EquipmentSlot, Item, SocialEquipmentSlot } from '../types';
import { averageToTier, type SocialTier } from './socialTiers';

export interface EquippedPresentation {
  isUnderdressed: boolean;
  hasVisibleArmor: boolean;
  heavyArmorPieces: number;
  roughArmorPieces: number;
  visibleWeapon: string | null;
  clothingScore: number;
  clothingLabel: string;
  presentationScore: number;
  threatScore: number;
  presentationTier: SocialTier;
  threatTier: SocialTier;
  isCursedPresence: boolean;
}

export interface SocialPresenceSummary {
  presentationScore: number;
  presentationTier: SocialTier;
  presentationLabel:
    | 'Miserable'
    | 'Plebe'
    | 'Common'
    | 'Decent'
    | 'Well Dressed'
    | 'Respectable'
    | 'Refined'
    | 'Noble'
    | 'Royal'
    | 'Divine';
  threatScore: number;
  threatTier: SocialTier;
  threatLabel:
    | 'Inoffensive'
    | 'Unsettling'
    | 'Harsh'
    | 'Threatening'
    | 'Scarry'
    | 'Dangerous'
    | 'Menacing'
    | 'Terrifying'
    | 'Ruler'
    | 'Demonic Presence';
  isUnderdressed: boolean;
  hasVisibleArmor: boolean;
  hasVisibleWeapon: boolean;
  isCursedPresence: boolean;
}

type SocialItemData = {
  name?: string;
  description?: string;
  type?: string;
  stackable?: boolean;
  weight: number;
  base_value: number;
  image?: string;
  bookId?: string;
  equipmentSlot?: EquipmentSlot;
  stats?: Record<string, number>;
  presentationTier?: number;
  presentationRole?: 'major' | 'minor';
  threatTier?: number;
  threatRole?: 'major' | 'minor';
  combatTags?: string[];
};

const PRESENTATION_SLOT_WEIGHTS: Record<EquipmentSlot, number> = {
  chest: 2,
  legs: 2,
  boots: 0.5,
  cape: 0.5,
  amulet: 0.5,
  ring: 0.5,
  gloves: 0.5,
  head: 0,
  weapon: 0,
  shield: 0,
};

const THREAT_SLOT_WEIGHTS: Record<EquipmentSlot, number> = {
  weapon: 4,
  chest: 3,
  shield: 2,
  head: 1,
  legs: 1,
  cape: 0,
  amulet: 0,
  ring: 0,
  gloves: 0,
  boots: 0,
};

const PRESENTATION_MAJOR_SLOTS: SocialEquipmentSlot[] = ['chest', 'legs', 'boots'];
const THREAT_RELEVANT_SLOTS: CombatEquipmentSlot[] = ['weapon', 'head', 'chest', 'shield', 'legs'];

function getEquippedItems() {
  return useCharacterStore.getState().equippedItems;
}

function getSocialLoadoutItems() {
  const { equipmentLoadouts } = useCharacterStore.getState();
  const socialLoadout = equipmentLoadouts[2] || {};

  return Object.entries(socialLoadout).reduce<Partial<Record<SocialEquipmentSlot, Item>>>((acc, [slot, itemId]) => {
    if (!itemId) return acc;
    const itemData = itemsData[itemId as keyof typeof itemsData] as SocialItemData | undefined;
    if (!itemData) return acc;
    acc[slot as SocialEquipmentSlot] = {
      ...itemData,
      id: itemId,
      name: itemData.name || itemId,
      description: itemData.description || '',
      weight: itemData.weight,
      base_value: itemData.base_value,
      stackable: itemData.stackable,
      type: itemData.type,
      bookId: itemData.bookId,
      combatTags: itemData.combatTags,
      equipmentSlot: itemData.equipmentSlot,
      stats: itemData.stats || {},
    } as Item;
    return acc;
  }, {});
}

function getItemMeta(itemId: string): SocialItemData | null {
  return (itemsData[itemId as keyof typeof itemsData] as SocialItemData | undefined) || null;
}

function getPresentationLabel(tier: SocialTier): SocialPresenceSummary['presentationLabel'] {
  switch (tier) {
    case 1: return 'Miserable';
    case 2: return 'Plebe';
    case 3: return 'Common';
    case 4: return 'Decent';
    case 5: return 'Well Dressed';
    case 6: return 'Respectable';
    case 7: return 'Refined';
    case 8: return 'Noble';
    case 9: return 'Royal';
    case 10: return 'Divine';
  }
}

function getThreatLabel(tier: SocialTier): SocialPresenceSummary['threatLabel'] {
  switch (tier) {
    case 1: return 'Inoffensive';
    case 2: return 'Unsettling';
    case 3: return 'Harsh';
    case 4: return 'Threatening';
    case 5: return 'Scarry';
    case 6: return 'Dangerous';
    case 7: return 'Menacing';
    case 8: return 'Terrifying';
    case 9: return 'Ruler';
    case 10: return 'Demonic Presence';
  }
}

function getClothingFlags(equippedItems: Partial<Record<SocialEquipmentSlot, Item>>) {
  const chestId = equippedItems.chest?.id;
  const legsId = equippedItems.legs?.id;
  const bootsId = equippedItems.boots?.id;
  const hasChest = Boolean(chestId);
  const hasLegs = Boolean(legsId);
  const hasBoots = Boolean(bootsId);
  const fullRags = chestId === 'ragged_shirt' && legsId === 'ragged_legs';
  const mismatchedRags = !fullRags && (chestId === 'ragged_shirt' || legsId === 'ragged_legs');

  let clothingLabel = 'Plain';
  let clothingScore = 0;
  let isUnderdressed = false;

  if (!hasChest && !hasLegs) {
    clothingLabel = 'Naked';
    clothingScore = 1;
    isUnderdressed = true;
  } else if (!hasChest || !hasLegs) {
    clothingLabel = 'Underdressed';
    clothingScore = 1;
    isUnderdressed = true;
  } else if (fullRags) {
    clothingLabel = 'Ragged';
    clothingScore = 1;
    isUnderdressed = true;
  } else if (mismatchedRags) {
    clothingLabel = 'Mismatched';
    clothingScore = 2;
    isUnderdressed = true;
  } else {
    const majorTiers = PRESENTATION_MAJOR_SLOTS.map((slot) => {
      const id = equippedItems[slot]?.id;
      if (!id) return 0;
      return getItemMeta(id)?.presentationTier || 0;
    });
    const baseAverage = majorTiers.reduce((sum, tier) => sum + tier, 0) / PRESENTATION_MAJOR_SLOTS.length;
    clothingScore = averageToTier(baseAverage, 1);
    if (!hasBoots) isUnderdressed = true;
    clothingLabel = getPresentationLabel(clothingScore as SocialTier);
  }

  return { clothingLabel, clothingScore, isUnderdressed };
}

function getPresentationTier(
  equippedItems: Partial<Record<SocialEquipmentSlot, Item>>
): SocialTier {
  let weightedScore = 0;
  let totalWeight = 0;

  PRESENTATION_MAJOR_SLOTS.forEach((slot) => {
    const item = equippedItems[slot];
    const tier = item ? getItemMeta(item.id)?.presentationTier || 0 : 0;
    const weight = PRESENTATION_SLOT_WEIGHTS[slot];
    weightedScore += tier * weight;
    totalWeight += weight;
  });

  (['cape', 'amulet', 'ring', 'gloves'] as EquipmentSlot[]).forEach((slot) => {
    const item = equippedItems[slot];
    const tier = item ? getItemMeta(item.id)?.presentationTier || 0 : 0;
    const weight = PRESENTATION_SLOT_WEIGHTS[slot];
    weightedScore += tier * weight;
    totalWeight += weight;
  });

  return averageToTier(weightedScore, totalWeight);
}

function getThreatTier(
  equippedItems: ReturnType<typeof useCharacterStore.getState>['equippedItems']
): SocialTier {
  let weightedScore = 0;
  let totalWeight = 0;
  THREAT_RELEVANT_SLOTS.forEach((slot) => {
    const weight = THREAT_SLOT_WEIGHTS[slot];
    totalWeight += weight;
    const item = equippedItems[slot];
    if (slot === 'shield' && item?.combatTags?.includes('two_handed')) return;
    if (!item) return;
    const tier = getItemMeta(item.id)?.threatTier || 0;
    weightedScore += tier * weight;
  });
  return averageToTier(weightedScore, totalWeight);
}

export function getEquippedPresentation(): EquippedPresentation {
  const combatItems = getEquippedItems();
  const socialItems = getSocialLoadoutItems();
  const { clothingLabel, clothingScore, isUnderdressed } = getClothingFlags(socialItems);

  const presentationTier = getPresentationTier(socialItems);
  const threatTier = getThreatTier(combatItems);

  const itemList = Object.entries(combatItems).reduce<Item[]>((acc, [slot, item]) => {
    if (!item) return acc;
    if (slot === 'shield' && item.combatTags?.includes('two_handed')) return acc;
    acc.push(item);
    return acc;
  }, []);

  return {
    isUnderdressed,
    hasVisibleArmor: Boolean(combatItems.chest || combatItems.legs || combatItems.head || combatItems.shield),
    heavyArmorPieces: itemList.filter((item) => item.id.startsWith('iron_')).length,
    roughArmorPieces: itemList.filter((item) => item.id.startsWith('wolf_')).length,
    visibleWeapon: combatItems.weapon?.id ?? null,
    clothingScore,
    clothingLabel,
    presentationScore: presentationTier,
    threatScore: threatTier,
    presentationTier,
    threatTier,
    isCursedPresence: useWorldStateStore.getState().getFlag('whitefang_bound'),
  };
}

export function getSocialPresenceSummary(): SocialPresenceSummary {
  const presence = getEquippedPresentation();
  return {
    presentationScore: presence.presentationTier,
    presentationTier: presence.presentationTier,
    presentationLabel: getPresentationLabel(presence.presentationTier),
    threatScore: presence.threatTier,
    threatTier: presence.threatTier,
    threatLabel: getThreatLabel(presence.threatTier),
    isUnderdressed: presence.isUnderdressed,
    hasVisibleArmor: presence.hasVisibleArmor,
    hasVisibleWeapon: Boolean(presence.visibleWeapon),
    isCursedPresence: presence.isCursedPresence,
  };
}

export function getPresentationSummary(): { label: string; score: number } {
  const summary = getSocialPresenceSummary();
  return { label: summary.presentationLabel, score: summary.presentationTier };
}

export function getThreatSummary(): { label: string; score: number } {
  const summary = getSocialPresenceSummary();
  return { label: summary.threatLabel, score: summary.threatTier };
}

export function getIntimidationSummary(): { label: string; score: number } {
  return getThreatSummary();
}

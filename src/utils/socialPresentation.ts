import itemsData from '../data/items.json';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import type { EquipmentSlot, Item } from '../types';
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
    | 'Pitiful'
    | 'Ragged'
    | 'Plain'
    | 'Decent'
    | 'Respectable'
    | 'Refined'
    | 'Noble'
    | 'Regal'
    | 'Divine';
  threatScore: number;
  threatTier: SocialTier;
  threatLabel:
    | 'Feeble'
    | 'Unsettling'
    | 'Threatening'
    | 'Harsh'
    | 'Dangerous'
    | 'Severe'
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
  presentationTier?: number;
  presentationRole?: 'major' | 'minor';
  threatTier?: number;
  threatRole?: 'major' | 'minor';
  combatTags?: string[];
};

const PRESENTATION_SLOT_WEIGHTS: Record<EquipmentSlot, number> = {
  chest: 3,
  legs: 3,
  boots: 1,
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

const PRESENTATION_MAJOR_SLOTS: EquipmentSlot[] = ['chest', 'legs', 'boots'];
const THREAT_RELEVANT_SLOTS: EquipmentSlot[] = ['weapon', 'head', 'chest', 'shield', 'legs'];

function getEquippedItems() {
  return useCharacterStore.getState().equippedItems;
}

function getItemMeta(itemId: string): SocialItemData | null {
  return (itemsData[itemId as keyof typeof itemsData] as SocialItemData | undefined) || null;
}

function getPresentationLabel(tier: SocialTier): SocialPresenceSummary['presentationLabel'] {
  switch (tier) {
    case 1: return 'Miserable';
    case 2: return 'Pitiful';
    case 3: return 'Ragged';
    case 4: return 'Plain';
    case 5: return 'Decent';
    case 6: return 'Respectable';
    case 7: return 'Refined';
    case 8: return 'Noble';
    case 9: return 'Regal';
    case 10: return 'Divine';
  }
}

function getThreatLabel(tier: SocialTier): SocialPresenceSummary['threatLabel'] {
  switch (tier) {
    case 1: return 'Feeble';
    case 2: return 'Unsettling';
    case 3: return 'Threatening';
    case 4: return 'Harsh';
    case 5: return 'Dangerous';
    case 6: return 'Severe';
    case 7: return 'Menacing';
    case 8: return 'Terrifying';
    case 9: return 'Ruler';
    case 10: return 'Demonic Presence';
  }
}

function getClothingFlags(equippedItems: ReturnType<typeof useCharacterStore.getState>['equippedItems']) {
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
  equippedItems: ReturnType<typeof useCharacterStore.getState>['equippedItems']
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
    const item = equippedItems[slot];
    const weight = THREAT_SLOT_WEIGHTS[slot];
    if (slot === 'shield' && item?.combatTags?.includes('two_handed')) return;
    if (!item) return;
    totalWeight += weight;
    const tier = getItemMeta(item.id)?.threatTier || 0;
    weightedScore += tier * weight;
  });
  return averageToTier(weightedScore, totalWeight);
}

export function getEquippedPresentation(): EquippedPresentation {
  const equippedItems = getEquippedItems();
  const { clothingLabel, clothingScore, isUnderdressed } = getClothingFlags(equippedItems);

  const presentationTier = getPresentationTier(equippedItems);
  const threatTier = getThreatTier(equippedItems);

  const itemList = Object.entries(equippedItems).reduce<Item[]>((acc, [slot, item]) => {
    if (!item) return acc;
    if (slot === 'shield' && item.combatTags?.includes('two_handed')) return acc;
    acc.push(item);
    return acc;
  }, []);

  return {
    isUnderdressed,
    hasVisibleArmor: Boolean(equippedItems.chest || equippedItems.legs || equippedItems.head || equippedItems.shield),
    heavyArmorPieces: itemList.filter((item) => item.id.startsWith('iron_')).length,
    roughArmorPieces: itemList.filter((item) => item.id.startsWith('wolf_')).length,
    visibleWeapon: equippedItems.weapon?.id ?? null,
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

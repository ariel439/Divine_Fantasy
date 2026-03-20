import { useCharacterStore } from '../stores/useCharacterStore';
import type { Item } from '../types';

export interface EquippedPresentation {
  isUnderdressed: boolean;
  hasVisibleArmor: boolean;
  heavyArmorPieces: number;
  roughArmorPieces: number;
  visibleWeapon: string | null;
  clothingScore: number;
  clothingLabel: string;
  intimidationScore: number;
}

const ITEM_SOCIAL_MODIFIERS: Record<string, { presentation: number; intimidation: number; label?: string }> = {
  ragged_shirt: { presentation: 0, intimidation: 0, label: 'Ragged' },
  ragged_legs: { presentation: 0, intimidation: 0, label: 'Ragged' },
  common_shirt: { presentation: 1, intimidation: 0, label: 'Common' },
  common_legs: { presentation: 0, intimidation: 0, label: 'Common' },
  common_shoes: { presentation: 0, intimidation: 0, label: 'Common' },
  fine_shirt: { presentation: 2, intimidation: 0, label: 'Fine' },
  fine_legs: { presentation: 0, intimidation: 0, label: 'Fine' },
  fine_shoes: { presentation: 0, intimidation: 0, label: 'Fine' },
  wolf_leather_helmet: { presentation: 0, intimidation: 1, label: 'Rough' },
  wolf_leather_armor: { presentation: 0, intimidation: 2, label: 'Rough' },
  wolf_leather_legs: { presentation: 0, intimidation: 1, label: 'Rough' },
  iron_helmet: { presentation: 1, intimidation: 1, label: 'Ironclad' },
  iron_chainmail: { presentation: 1, intimidation: 2, label: 'Ironclad' },
  iron_leggings: { presentation: 1, intimidation: 1, label: 'Ironclad' },
  crude_knife: { presentation: 0, intimidation: 1 },
  iron_sword: { presentation: 0, intimidation: 2 },
};

function getClothingPresentation(equippedItems: ReturnType<typeof useCharacterStore.getState>['equippedItems']): { score: number; label: string; isUnderdressed: boolean } {
  const chestId = equippedItems.chest?.id;
  const legsId = equippedItems.legs?.id;
  const bootsId = equippedItems.boots?.id;

  const hasChest = Boolean(chestId);
  const hasLegs = Boolean(legsId);
  const hasBoots = Boolean(bootsId);

  const wearingRags = chestId === 'ragged_shirt' || legsId === 'ragged_legs';
  const fullRags = chestId === 'ragged_shirt' && legsId === 'ragged_legs';
  const commonSetPieces = [chestId === 'common_shirt', legsId === 'common_legs', bootsId === 'common_shoes'].filter(Boolean).length;
  const fineSetPieces = [chestId === 'fine_shirt', legsId === 'fine_legs', bootsId === 'fine_shoes'].filter(Boolean).length;

  if (!hasChest && !hasLegs) {
    return { score: -3, label: 'Naked', isUnderdressed: true };
  }

  if (!hasChest || !hasLegs) {
    return { score: -2, label: 'Underdressed', isUnderdressed: true };
  }

  if (fullRags) {
    return { score: -1, label: 'Ragged', isUnderdressed: true };
  }

  if (wearingRags) {
    return { score: -2, label: 'Mismatched', isUnderdressed: true };
  }

  if (fineSetPieces >= 2) {
    return { score: fineSetPieces === 3 ? 3 : 2, label: 'Fine', isUnderdressed: !hasBoots };
  }

  if (commonSetPieces >= 2) {
    return { score: commonSetPieces === 3 ? 1 : 0, label: 'Common', isUnderdressed: !hasBoots };
  }

  return { score: 0, label: hasBoots ? 'Plain' : 'Underdressed', isUnderdressed: !hasBoots };
}

function getIntimidationScore(itemList: Item[]): number {
  return itemList.reduce((sum, item) => sum + (ITEM_SOCIAL_MODIFIERS[item.id]?.intimidation ?? 0), 0);
}

export function getEquippedPresentation(): EquippedPresentation {
  const equippedItems = useCharacterStore.getState().equippedItems;
  const itemList = Object.values(equippedItems).filter((item): item is Item => Boolean(item));
  const chest = equippedItems.chest;
  const legs = equippedItems.legs;
  const head = equippedItems.head;
  const weapon = equippedItems.weapon;
  const clothingPresentation = getClothingPresentation(equippedItems);
  const intimidationScore = getIntimidationScore(itemList);

  return {
    isUnderdressed: clothingPresentation.isUnderdressed,
    hasVisibleArmor: Boolean(chest || legs || head),
    heavyArmorPieces: itemList.filter((item) => item.id.startsWith('iron_')).length,
    roughArmorPieces: itemList.filter((item) => item.id.startsWith('wolf_')).length,
    visibleWeapon: weapon?.id ?? null,
    clothingScore: clothingPresentation.score,
    clothingLabel: clothingPresentation.label,
    intimidationScore,
  };
}

export function getPresentationSummary(): { label: string; score: number } {
  const presentation = getEquippedPresentation();
  let score = presentation.clothingScore;
  score += presentation.roughArmorPieces;
  score += presentation.heavyArmorPieces * 2;
  if (presentation.visibleWeapon === 'crude_knife') score += 1;
  else if (presentation.visibleWeapon) score += 2;

  if (presentation.clothingLabel === 'Naked' && score <= -3) return { label: 'Naked', score };
  if (score <= -2) return { label: presentation.clothingLabel === 'Mismatched' ? 'Mismatched' : 'Ragged', score };
  if (score <= 0) return { label: presentation.clothingLabel === 'Common' ? 'Plain' : presentation.clothingLabel, score };
  if (score <= 3) return { label: presentation.heavyArmorPieces > 0 ? 'Imposing' : (presentation.clothingLabel === 'Fine' ? 'Presentable' : 'Rough'), score };
  return { label: 'Imposing', score };
}

export function getIntimidationSummary(): { label: string; score: number } {
  const intimidation = getEquippedPresentation().intimidationScore;

  if (intimidation <= 0) return { label: 'Unthreatening', score: intimidation };
  if (intimidation <= 2) return { label: 'Edged', score: intimidation };
  if (intimidation <= 4) return { label: 'Threatening', score: intimidation };
  return { label: 'Menacing', score: intimidation };
}

export type SocialTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export function clampTier(value: number): SocialTier {
  return Math.max(1, Math.min(10, Math.round(value))) as SocialTier;
}

export function tierFromLevel(level: number): SocialTier {
  const safeLevel = Math.max(1, Math.min(99, Math.floor(level || 1)));
  if (safeLevel <= 9) return 1;
  return Math.min(10, Math.floor(safeLevel / 10) + 1) as SocialTier;
}

export function averageToTier(totalWeightedScore: number, totalWeight: number): SocialTier {
  if (totalWeight <= 0) return 1;
  return clampTier(totalWeightedScore / totalWeight);
}

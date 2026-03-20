export function getMaxSocialEnergy(charisma: number, persuasionLevel: number, coercionLevel: number): number {
  const bonusFromSkills = Math.floor(Math.max(persuasionLevel, coercionLevel) / 10);
  return charisma + bonusFromSkills;
}

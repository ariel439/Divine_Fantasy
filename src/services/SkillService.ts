// SkillService.ts
// Handles skill-based actions and calculations

import { useSkillStore } from '../stores/useSkillStore';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';

export class SkillService {
  static performSkillAction(skill: string, baseXp: number, successCallback?: () => void): boolean {
    const skillStore = useSkillStore.getState();
    const characterStore = useCharacterStore.getState();

    // Check if player has required level (simplified - no level requirements for basic actions)
    const currentLevel = skillStore.getSkillLevel(skill);

    // Calculate success chance based on skill level (simplified)
    const successChance = Math.min(0.95, 0.5 + (currentLevel * 0.05)); // 50% + 5% per level, max 95%
    const success = Math.random() < successChance;

    if (success && successCallback) {
      successCallback();
    }

    // Award XP regardless of success (but maybe less on failure)
    const xpAward = success ? baseXp : Math.floor(baseXp * 0.1);
    skillStore.addXp(skill, xpAward);

    // Pass time (simplified - 1 minute per action)
    useWorldTimeStore.getState().passTime(1);

    return success;
  }

  static getSkillBonus(skill: string): number {
    const skillStore = useSkillStore.getState();
    const level = skillStore.getSkillLevel(skill);
    return level * 0.1; // 10% bonus per level
  }

  static canPerformAction(skill: string, requiredLevel: number): boolean {
    const skillStore = useSkillStore.getState();
    return skillStore.getSkillLevel(skill) >= requiredLevel;
  }

  static getXpToNextLevel(skill: string): number {
    const skillStore = useSkillStore.getState();
    return skillStore.getXpToNextLevel(skill);
  }
}

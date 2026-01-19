import { create } from 'zustand';
import { useCharacterStore } from './useCharacterStore';
import xpTable from '../data/xp_table.json';

interface Skill {
  level: number;
  xp: number;
}

interface SkillState {
  skills: Record<string, Skill>;
  addXp: (skill: string, amount: number) => void;
  getSkillLevel: (skill: string) => number;
  getXpToNextLevel: (skill: string) => number;
  setSkillLevel: (skill: string, level: number) => void;
}

// Attribute to skill links removed in favor of global Intelligence scaling

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: {},
  addXp: (skill, amount) => {
    set((state) => {
      const currentSkill = state.skills[skill] || { level: 1, xp: 0 };

      // Attributes provide passive bonuses to skills
      const attributes = useCharacterStore.getState().attributes;
      
      // Example: Intelligence gives bonus XP
      // Example: Dexterity gives bonus to thievery/stealth success chance (handled in usage)
      // Example: Strength gives bonus to carry weight (handled in inventory)
      const intelligence = attributes.intelligence;
      const bonusMultiplier = 1.0 + (intelligence * 0.10);

      const adjustedAmount = Math.floor(amount * bonusMultiplier);
      const newXp = currentSkill.xp + adjustedAmount;

      // Check for level up
      let newLevel = currentSkill.level;
      const currentLevelData = xpTable.levels.find(l => l.level === currentSkill.level);
      const nextLevelData = xpTable.levels.find(l => l.level === currentSkill.level + 1);

      if (nextLevelData && newXp >= nextLevelData.total_xp) {
        newLevel = currentSkill.level + 1;
      }

      return {
        skills: {
          ...state.skills,
          [skill]: {
            level: newLevel,
            xp: newXp
          }
        }
      };
    });
  },
  getSkillLevel: (skill) => {
    return get().skills[skill]?.level || 1;
  },
  getXpToNextLevel: (skill) => {
    const currentSkill = get().skills[skill] || { level: 1, xp: 0 };
    const nextLevelData = xpTable.levels.find(l => l.level === currentSkill.level + 1);
    if (!nextLevelData) return 0; // Max level

    return nextLevelData.total_xp - currentSkill.xp;
  },
  setSkillLevel: (skill, level) => {
    const levelData = xpTable.levels.find(l => l.level === level) || { total_xp: 0 };
    set((state) => ({
      skills: {
        ...state.skills,
        [skill]: { level, xp: levelData.total_xp }
      }
    }));
  },
}));

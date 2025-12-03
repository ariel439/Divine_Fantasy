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

// Attribute to skill links for XP bonuses
const ATTRIBUTE_LINKS: Record<string, string[]> = {
  strength: ['strength', 'mining', 'blacksmithing'],
  agility: ['archery', 'thievery'],
  intelligence: ['carpentry', 'management', 'crafting', 'cooking'],
  wisdom: ['magic', 'fishing'],
  charisma: ['persuasion', 'coercion', 'leadership']
};

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: {},
  addXp: (skill, amount) => {
    set((state) => {
      const currentSkill = state.skills[skill] || { level: 1, xp: 0 };

      // Calculate XP bonus from attributes
      let bonusMultiplier = 1.0;
      const attributes = useCharacterStore.getState().attributes;

      for (const [attr, skills] of Object.entries(ATTRIBUTE_LINKS)) {
        if (skills.includes(skill)) {
          const attrValue = attributes[attr as keyof typeof attributes];
          bonusMultiplier += (attrValue - 1) * 0.05; // 5% per point above 1
        }
      }

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

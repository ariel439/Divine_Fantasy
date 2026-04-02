import { create } from 'zustand';
import { useCharacterStore } from './useCharacterStore';
import xpTable from '../data/xp_table.json';
import { getMaxSocialEnergy } from '../utils/socialEnergy';

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

const normalizeSkillKey = (skill: string) => {
  if (skill === 'attack') return 'melee';
  if (skill === 'defence') return 'constitution';
  return skill;
};

function refreshSocialEnergyCap() {
  const character = useCharacterStore.getState();
  const skillState = useSkillStore.getState();
  const maxSocialEnergy = getMaxSocialEnergy(
    character.attributes.charisma,
    skillState.getSkillLevel('persuasion'),
    skillState.getSkillLevel('coercion')
  );

  useCharacterStore.setState((state) => ({
    maxSocialEnergy,
    socialEnergy: Math.min(state.socialEnergy, maxSocialEnergy),
  }));
}

function syncDerivedCombatBonuses(getState: () => SkillState) {
  const constitutionLevel = getState().getSkillLevel('constitution');
  const constitutionBonusHp = Math.floor(constitutionLevel / 10) * 10;
  useCharacterStore.setState({ constitutionBonusHp });
}

// Attribute to skill links removed in favor of global Intelligence scaling

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: {},
  addXp: (skill, amount) => {
    const normalizedSkill = normalizeSkillKey(skill);
    set((state) => {
      const currentSkill = state.skills[normalizedSkill] || state.skills[skill] || { level: 1, xp: 0 };

      // Attributes provide passive bonuses to skills
      const attributes = useCharacterStore.getState().attributes;
      
      // Example: Intelligence gives bonus XP
      // Example: Dexterity gives bonus to thievery/stealth success chance (handled in usage)
      // Example: Strength gives bonus to carry weight (handled in inventory)
      const intelligence = attributes.intelligence;
      const bonusMultiplier = 1.0 + (intelligence * 0.10);

      const adjustedAmount = Math.floor(amount * bonusMultiplier);
      const newXp = currentSkill.xp + adjustedAmount;

      let newLevel = currentSkill.level;
      let nextLevelData = xpTable.levels.find(l => l.level === newLevel + 1);

      while (nextLevelData && newXp >= nextLevelData.total_xp) {
        newLevel += 1;
        nextLevelData = xpTable.levels.find(l => l.level === newLevel + 1);
      }

      return {
        skills: {
          ...state.skills,
          [normalizedSkill]: {
            level: newLevel,
            xp: newXp
          }
        }
      };
    });
    syncDerivedCombatBonuses(get);
    refreshSocialEnergyCap();
    try { useCharacterStore.getState().recalculateStats(); } catch {}
  },
  getSkillLevel: (skill) => {
    const normalizedSkill = normalizeSkillKey(skill);
    return get().skills[normalizedSkill]?.level || get().skills[skill]?.level || 1;
  },
  getXpToNextLevel: (skill) => {
    const normalizedSkill = normalizeSkillKey(skill);
    const currentSkill = get().skills[normalizedSkill] || get().skills[skill] || { level: 1, xp: 0 };
    const nextLevelData = xpTable.levels.find(l => l.level === currentSkill.level + 1);
    if (!nextLevelData) return 0; // Max level

    return nextLevelData.total_xp - currentSkill.xp;
  },
  setSkillLevel: (skill, level) => {
    const normalizedSkill = normalizeSkillKey(skill);
    const levelData = xpTable.levels.find(l => l.level === level) || { total_xp: 0 };
    set((state) => ({
      skills: {
        ...state.skills,
        [normalizedSkill]: { level, xp: levelData.total_xp }
      }
    }));
    syncDerivedCombatBonuses(get);
    refreshSocialEnergyCap();
    try { useCharacterStore.getState().recalculateStats(); } catch {}
  },
}));

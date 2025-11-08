import { create } from 'zustand';

interface Skill {
  level: number;
  xp: number;
}

interface SkillState {
  skills: Record<string, Skill>;
  // Actions
  addXp: (skill: string, amount: number) => void;
  getSkillLevel: (skill: string) => number;
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: {},
  addXp: (skill, amount) => {
    // TODO: Implement XP addition with level-up logic using xp_table.json
    console.log('Adding XP to skill:', skill, amount);
  },
  getSkillLevel: (skill) => {
    return get().skills[skill]?.level || 1;
  },
}));

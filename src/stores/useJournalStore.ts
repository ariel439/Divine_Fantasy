import { create } from 'zustand';
import { useWorldStateStore } from './useWorldStateStore';
import { useInventoryStore } from './useInventoryStore';
import { useCharacterStore } from './useCharacterStore';
import { useDiaryStore } from './useDiaryStore';
import questsData from '../data/quests.json';
import dialogueData from '../data/dialogues/index';
import type { Quest as UiQuest } from '../types';
import npcsData from '../data/npcs.json';

interface Quest {
  id: string;
  title: string;
  description: string;
  stages: any[]; // TODO: Define proper stage interface
  rewards: any; // TODO: Define proper rewards interface
  completed: boolean;
  active: boolean;
  currentStage?: number;
}

interface JournalState {
  quests: Record<string, Quest>;
  questsList: UiQuest[];
  // Actions
  addQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  completeQuest: (questId: string) => void;
  setQuestStage: (questId: string, stageIndex: number) => void;
  advanceQuestStage: (questId: string) => void;
  setQuestsList: (quests: UiQuest[]) => void;
  // Utility
  syncQuestProgress: (questId?: string) => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  quests: {},
  questsList: [],
  addQuest: (quest) => {
    set((state) => ({
      quests: {
        ...state.quests,
        [quest.id]: { ...quest, currentStage: 0, completed: false, active: true },
      },
    }));
  },
  updateQuest: (questId, updates) => {
    set((state) => ({
      quests: {
        ...state.quests,
        [questId]: {
          ...state.quests[questId],
          ...updates,
        },
      },
    }));
  },
  completeQuest: (questId) => {
    set((state) => {
      const quest = state.quests[questId];
      const buildGenericRewards = (rewards: any): string[] => {
        const out: string[] = [];
        if (rewards) {
          if (Array.isArray(rewards.xp) && rewards.xp.length > 0) {
            // Show knowledge based on skill(s)
            rewards.xp.forEach((xp: any) => {
              const skillName = String(xp.skill || '').trim();
              if (skillName) out.push(`${skillName.charAt(0).toUpperCase() + skillName.slice(1)} knowledge`);
            });
          }
          if (typeof rewards.currency === 'number' && rewards.currency > 0) {
            out.push('Some copper');
          }
          if (Array.isArray(rewards.relationship)) {
            rewards.relationship.forEach((rel: any) => {
              const npcName = npcsData[rel.npc_id as keyof typeof npcsData]?.name || 'someone';
              out.push(`Relationship with ${npcName}`);
            });
          }
          if (Array.isArray(rewards.items) && rewards.items.length > 0) {
            out.push('Useful supplies');
          }
        }
        return out;
      };

      const updatedRewards = buildGenericRewards(quest?.rewards);

      // Apply rewards to game state
      if (quest?.rewards) {
        if (typeof quest.rewards?.currency === 'number') {
          const currencyAmount = quest.rewards.currency;
          if (currencyAmount > 0) {
            useCharacterStore.getState().addCurrency('copper', currencyAmount);
          }
        }

        if (Array.isArray(quest.rewards.relationship)) {
          quest.rewards.relationship.forEach((rel: any) => {
            useDiaryStore.getState().updateRelationship(rel.npc_id, { friendship: rel.change });
          });
        }

        // TODO: Add XP and items rewards
      }

      return ({
        quests: {
          ...state.quests,
          [questId]: {
            ...state.quests[questId],
            completed: true,
            active: false,
          },
        },
        questsList: state.questsList.map(q => q.id === questId 
          ? { 
              ...q, 
              status: 'completed', 
              objectives: q.objectives.map(o => ({ ...o, completed: true })),
              rewards: updatedRewards,
            }
          : q
        ),
      });
    });
  },
  setQuestStage: (questId, stageIndex) => {
    set((state) => {
      const quest = state.quests[questId];
      if (!quest) return {} as any;
      const stageCount = Array.isArray(quest.stages) ? quest.stages.length : 0;
      const nextStage = Math.max(0, Math.min(stageIndex, stageCount));
      const updatedQuest = { ...quest, currentStage: nextStage };

      const updatedQuestsList = state.questsList.map(q => {
        if (q.id !== questId) return q;
        const updatedObjectives = q.objectives.map((obj, idx) => ({
          ...obj,
          completed: idx < nextStage || (idx === nextStage && nextStage >= stageCount),
        }));
        const status = nextStage >= stageCount ? 'completed' : 'active';
        // Only show rewards on completion
        const buildGenericRewards = (rewards: any): string[] => {
          const out: string[] = [];
          if (rewards) {
            if (Array.isArray(rewards.xp) && rewards.xp.length > 0) {
              rewards.xp.forEach((xp: any) => {
                const skillName = String(xp.skill || '').trim();
                if (skillName) out.push(`${skillName.charAt(0).toUpperCase() + skillName.slice(1)} knowledge`);
              });
            }
            if (typeof rewards.currency === 'number' && rewards.currency > 0) {
              out.push('Some copper');
            }
            if (Array.isArray(rewards.relationship)) {
              rewards.relationship.forEach((rel: any) => {
                const npcName = npcsData[rel.npc_id as keyof typeof npcsData]?.name || 'someone';
                out.push(`Relationship with ${npcName}`);
              });
            }
            if (Array.isArray(rewards.items) && rewards.items.length > 0) {
              out.push('Useful supplies');
            }
          }
          return out;
        };
        const rewardsUi = status === 'completed' ? buildGenericRewards(quest.rewards) : [];
        return { ...q, objectives: updatedObjectives, status, rewards: rewardsUi };
      });

      return {
        quests: { ...state.quests, [questId]: updatedQuest },
        questsList: updatedQuestsList,
      };
    });
  },
  advanceQuestStage: (questId) => {
    set((state) => {
      const quest = state.quests[questId];
      if (!quest) return {} as any;
      const stageCount = Array.isArray(quest.stages) ? quest.stages.length : 0;
      const current = quest.currentStage || 0;
      const nextStage = Math.min(current + 1, stageCount);
      const updatedQuest = { ...quest, currentStage: nextStage };

      const updatedQuestsList = state.questsList.map(q => {
        if (q.id !== questId) return q;
        const updatedObjectives = q.objectives.map((obj, idx) => ({
          ...obj,
          completed: idx < nextStage,
        }));
        const status = nextStage >= stageCount ? 'completed' : 'active';
        const buildGenericRewards = (rewards: any): string[] => {
          const out: string[] = [];
          if (rewards) {
            if (Array.isArray(rewards.xp) && rewards.xp.length > 0) {
              rewards.xp.forEach((xp: any) => {
                const skillName = String(xp.skill || '').trim();
                if (skillName) out.push(`${skillName.charAt(0).toUpperCase() + skillName.slice(1)} knowledge`);
              });
            }
            if (typeof rewards.currency === 'number' && rewards.currency > 0) {
              out.push('Some copper');
            }
            if (Array.isArray(rewards.relationship)) {
              rewards.relationship.forEach((rel: any) => {
                const npcName = npcsData[rel.npc_id as keyof typeof npcsData]?.name || 'someone';
                out.push(`Relationship with ${npcName}`);
              });
            }
            if (Array.isArray(rewards.items) && rewards.items.length > 0) {
              out.push('Useful supplies');
            }
          }
          return out;
        };
        const rewardsUi = status === 'completed' ? buildGenericRewards(quest.rewards) : [];
        return { ...q, objectives: updatedObjectives, status, rewards: rewardsUi };
      });

      return {
        quests: { ...state.quests, [questId]: updatedQuest },
        questsList: updatedQuestsList,
      };
    });
  },
  setQuestsList: (quests) => {
    set(() => ({ questsList: quests }));
  },
  syncQuestProgress: (questId) => {
    // Currently supports: Roberta's planks quest gather objective
    const state = get();
    const targetQuestId = questId || 'roberta_planks_for_the_past';
    const q = state.quests[targetQuestId];
    if (!q || !q.active) return;
    const currentStage = q.currentStage ?? 0;
    // Stage 1 is gather 10 wooden planks
    if (currentStage === 1) {
      const inv = useInventoryStore.getState();
      const planks = inv.getItemQuantity('wooden_plank');
      if (planks >= 10) {
        // Move to stage 2: return to Roberta
        get().setQuestStage(targetQuestId, 2);
      }
    }
  },
}));

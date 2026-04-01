import { create } from 'zustand';
import { useWorldStateStore } from './useWorldStateStore';
import { useInventoryStore } from './useInventoryStore';
import { useCharacterStore } from './useCharacterStore';
import { useDiaryStore } from './useDiaryStore';
import { useSkillStore } from './useSkillStore';
import questsData from '../data/quests.json';
import dialogueData from '../data/dialogues/index';
import type { Quest as UiQuest } from '../types';
import npcsData from '../data/npcs.json';

interface QuestStage {
  id: number;
  text: string;
  type: string;
  target: string;
  quantity?: number;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  stages: QuestStage[]; 
  rewards: any; // TODO: Define proper rewards interface
  completed: boolean;
  active: boolean;
  currentStage?: number;
}

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

const buildQuestObjectives = (questDef: any, stageIndex: number) => {
  const world = useWorldStateStore.getState();
  const inv = useInventoryStore.getState();
  const hideFutureObjectives = typeof questDef?.hideFutureObjectives === 'boolean'
    ? questDef.hideFutureObjectives
    : !Boolean(questDef?.nonLinear);

  return (questDef?.stages || []).map((stageDef: any, idx: number) => {
    let isDone = idx < stageIndex;
    if (stageDef.type === 'collect' || stageDef.type === 'flag') {
      if (world.getFlag(stageDef.target)) isDone = true;
    } else if (stageDef.type === 'gather') {
      if (inv.getItemQuantity(stageDef.target) >= (stageDef.quantity || 0)) isDone = true;
    }

    return {
      text: stageDef.text,
      completed: isDone,
      hidden: hideFutureObjectives ? idx > stageIndex : false,
    };
  });
};

interface JournalState {
  quests: Record<string, Quest>;
  questsList: UiQuest[];
  // Actions
  addQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  completeQuest: (questId: string) => void;
  failQuest: (questId: string) => void;
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
    set((state) => {
      const questDef = (questsData as any)[quest.id];
      const objectives = buildQuestObjectives(questDef, 0);

      const uiQuest: UiQuest = {
        id: quest.id,
        title: quest.title,
        giver: npcsData[questDef?.giver_id as keyof typeof npcsData]?.name || 'Unknown',
        description: quest.description,
        objectives,
        rewards: [],
        status: 'active' as const,
      };

      return {
        quests: {
          ...state.quests,
          [quest.id]: { ...quest, currentStage: 0, completed: false, active: true },
        },
        questsList: [...state.questsList.filter(q => q.id !== quest.id), uiQuest],
      };
    });
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
      const updatedRewards = buildGenericRewards(quest?.rewards);

      // Apply rewards to game state
      if (quest?.rewards) {
        if (Array.isArray(quest.rewards?.xp)) {
          quest.rewards.xp.forEach((xpReward: any) => {
            const skillId = String(xpReward.skill || '').trim();
            const amount = Number(xpReward.amount || 0);
            if (skillId && amount > 0) {
              useSkillStore.getState().addXp(skillId, amount);
            }
          });
        }

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

        if (Array.isArray(quest.rewards.items)) {
          quest.rewards.items.forEach((itemReward: any) => {
            if (typeof itemReward === 'string') {
              useInventoryStore.getState().addItem(itemReward, 1);
              return;
            }

            if (itemReward && typeof itemReward.item_id === 'string') {
              useInventoryStore.getState().addItem(itemReward.item_id, Number(itemReward.quantity || 1));
            }
          });
        }
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
  failQuest: (questId) => {
    set((state) => ({
      quests: {
        ...state.quests,
        [questId]: {
          ...state.quests[questId],
          completed: false,
          active: false,
        },
      },
      questsList: state.questsList.map(q => q.id === questId
        ? {
            ...q,
            status: 'failed',
            rewards: [],
          }
        : q
      ),
    }));
  },
  setQuestStage: (questId, stageIndex) => {
    set((state) => {
      const quest = state.quests[questId];
      if (!quest) return {} as any;
      const questDef = (questsData as any)[questId];
      const stageCount = Array.isArray(quest.stages) ? quest.stages.length : 0;
      const nextStage = Math.max(0, Math.min(stageIndex, stageCount));
      const updatedQuest = { ...quest, currentStage: nextStage };

      const updatedQuestsList = state.questsList.map(q => {
        if (q.id !== questId) return q;
        const updatedObjectives = buildQuestObjectives(questDef, nextStage);

        const status = nextStage >= stageCount ? 'completed' : 'active';
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
        const updatedObjectives = buildQuestObjectives((questsData as any)[questId], nextStage);
        const status = nextStage >= stageCount ? 'completed' : 'active';
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
    set((state) => {
      const targetIds = questId ? [questId] : Object.keys(state.quests);
      const updatedQuestsList = state.questsList.map((uiQuest) => {
        if (!targetIds.includes(uiQuest.id)) {
          return uiQuest;
        }

        const quest = state.quests[uiQuest.id];
        if (!quest) {
          return uiQuest;
        }

        const questDef = (questsData as any)[uiQuest.id];
        const currentStage = quest.currentStage || 0;
        const objectives = buildQuestObjectives(questDef, currentStage);
        const rewards = quest.completed ? buildGenericRewards(quest.rewards) : [];
        const status = quest.completed ? 'completed' : quest.active ? 'active' : 'failed';

        return {
          ...uiQuest,
          objectives,
          rewards,
          status,
        };
      });

      return { questsList: updatedQuestsList };
    });
  },
}));

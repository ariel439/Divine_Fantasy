import { create } from 'zustand';
import { useWorldStateStore } from './useWorldStateStore';

interface Relationship {
  friendship: { value: number; max: number; };
  love?: { value: number; max: number; };
  fear?: { value: number; max: number; };
  obedience?: { value: number; max: number; };
}

interface RelationshipChanges {
  friendship?: number;
  love?: number;
  fear?: number;
  obedience?: number;
}

interface DiaryState {
  relationships: Record<string, Relationship>;
  interactionHistory: string[];
  // Actions
  updateRelationship: (npcId: string, changes: RelationshipChanges) => void;
  addInteraction: (interaction: string) => void;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  relationships: {},
  interactionHistory: [],
  updateRelationship: (npcId, changes) => {
    set((state) => {
      const whiteFangBound = useWorldStateStore.getState().getFlag('whitefang_bound');
      const positiveBondingLocked = whiteFangBound && npcId !== 'npc_shihan';
      const filteredChanges: RelationshipChanges = {
        ...changes,
        friendship: positiveBondingLocked && (changes.friendship || 0) > 0 ? 0 : changes.friendship,
        love: positiveBondingLocked && (changes.love || 0) > 0 ? 0 : changes.love,
      };
      const currentRelationships = state.relationships[npcId] || { friendship: { value: 0, max: 100 } };
      
      const clamp = (val: number) => Math.max(-100, Math.min(100, val));
      const updatedFriendship = filteredChanges.friendship !== undefined
        ? { ...currentRelationships.friendship, value: clamp(currentRelationships.friendship.value + filteredChanges.friendship) }
        : currentRelationships.friendship;

      const updatedLove = filteredChanges.love !== undefined
        ? { ...(currentRelationships.love || { value: 0, max: 100 }), value: clamp((currentRelationships.love?.value || 0) + filteredChanges.love) }
        : currentRelationships.love;

      const updatedFear = filteredChanges.fear !== undefined
        ? { ...(currentRelationships.fear || { value: 0, max: 100 }), value: clamp((currentRelationships.fear?.value || 0) + filteredChanges.fear) }
        : currentRelationships.fear;

      const updatedObedience = filteredChanges.obedience !== undefined
        ? { ...(currentRelationships.obedience || { value: 0, max: 100 }), value: clamp((currentRelationships.obedience?.value || 0) + filteredChanges.obedience) }
        : currentRelationships.obedience;

      return {
        relationships: {
          ...state.relationships,
          [npcId]: {
            ...currentRelationships,
            friendship: updatedFriendship,
            ...(updatedLove && { love: updatedLove }),
            ...(updatedFear && { fear: updatedFear }),
            ...(updatedObedience && { obedience: updatedObedience }),
          },
        },
      };
    });
  },
  addInteraction: (interaction) => {
    set((state) => ({
      interactionHistory: [...state.interactionHistory, interaction],
    }));
  },
}));

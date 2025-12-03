import { create } from 'zustand';

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
      const currentRelationships = state.relationships[npcId] || { friendship: { value: 0, max: 100 } };
      
      const clamp = (val: number) => Math.max(-100, Math.min(100, val));
      const updatedFriendship = changes.friendship !== undefined
        ? { ...currentRelationships.friendship, value: clamp(currentRelationships.friendship.value + changes.friendship) }
        : currentRelationships.friendship;

      const updatedLove = changes.love !== undefined
        ? { ...(currentRelationships.love || { value: 0, max: 100 }), value: clamp((currentRelationships.love?.value || 0) + changes.love) }
        : currentRelationships.love;

      const updatedFear = changes.fear !== undefined
        ? { ...(currentRelationships.fear || { value: 0, max: 100 }), value: clamp((currentRelationships.fear?.value || 0) + changes.fear) }
        : currentRelationships.fear;

      const updatedObedience = changes.obedience !== undefined
        ? { ...(currentRelationships.obedience || { value: 0, max: 100 }), value: clamp((currentRelationships.obedience?.value || 0) + changes.obedience) }
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

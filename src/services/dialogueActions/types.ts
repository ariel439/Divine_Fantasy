export interface DialogueActionContext {
  diaryStore: any;
  worldState: any;
  journalStore: any;
  showDialogueNode?: (nodeId: string) => boolean;
  endDialogue?: () => void;
  hasNpcReachedDailySocialLimit?: (npcId: string) => boolean;
  incrementNpcDailySocialUses?: (npcId: string) => void;
  setLastSocialOutcome?: (outcome: 'fail' | 'weak' | 'strong' | 'neutral') => void;
}

export type DialogueActionHandler = (params: string[], context: DialogueActionContext) => void;

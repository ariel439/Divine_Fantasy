// DialogueService.ts
// Handles NPC dialogue interactions and conversation flow

import dialogueData from '../data/dialogue.json';
import npcsData from '../data/npcs.json';
import questsData from '../data/quests.json';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useJournalStore } from '../stores/useJournalStore';

interface DialogueNode {
  npc_text: string;
  player_choices: {
    text: string;
    next_node: string;
    closes_dialogue?: boolean;
    action?: string;
  }[];
}

interface DialogueState {
  currentDialogueId: string | null;
  currentNodeId: string;
  dialogueHistory: string[];
}

export class DialogueService {
  private static currentDialogueId: string | null = null;
  private static currentNodeId: string = '0';
  private static dialogueHistory: string[] = [];

  static startDialogue(npcId: string): DialogueNode | null {
    // Find the default dialogue for this NPC
    const npcData = npcsData[npcId as keyof typeof npcsData];
    if (!npcData) {
      console.error('NPC not found in NPC data:', npcId);
      return null;
    }

    const dialogueId = npcData.default_dialogue_id;
    const dialogue = dialogueData[dialogueId as keyof typeof dialogueData];

    if (!dialogue) {
      console.error('Dialogue not found:', dialogueId);
      return null;
    }

    this.currentDialogueId = dialogueId;
    this.currentNodeId = '0';
    this.dialogueHistory = [dialogue.nodes['0'].npc_text];

    return dialogue.nodes['0'];
  }

  static selectResponse(responseIndex: number): DialogueNode | null {
    if (!this.currentDialogueId) return null;

    const currentDialogue = dialogueData[this.currentDialogueId as keyof typeof dialogueData];
    if (!currentDialogue) return null;

    const currentNode = currentDialogue.nodes[this.currentNodeId as keyof typeof currentDialogue.nodes];
    if (!currentNode || !currentNode.player_choices[responseIndex]) {
      return null;
    }

    const response = currentNode.player_choices[responseIndex];

    // Execute action if present
    if (response.action) {
      this.executeAction(response.action);
    }

    // Add to history
    this.dialogueHistory.push(response.text);

    // Handle next dialogue
    if (response.next_node) {
      const nextNode = currentDialogue.nodes[response.next_node as keyof typeof currentDialogue.nodes];
      if (nextNode) {
        this.currentNodeId = response.next_node;
        this.dialogueHistory.push(nextNode.npc_text);
        return nextNode;
      }
    }

    // End dialogue if closes_dialogue is true or no next_node
    if (response.closes_dialogue || !response.next_node) {
      this.endDialogue();
      return null;
    }

    return null;
  }

  static getCurrentDialogue(): DialogueNode | null {
    if (!this.currentDialogueId) return null;

    const currentDialogue = dialogueData[this.currentDialogueId as keyof typeof dialogueData];
    if (!currentDialogue) return null;

    return currentDialogue.nodes[this.currentNodeId as keyof typeof currentDialogue.nodes] || null;
  }

  static getDialogueHistory(): string[] {
    return [...this.dialogueHistory];
  }

  static endDialogue(): void {
    this.currentDialogueId = null;
    this.currentNodeId = '0';
    this.dialogueHistory = [];
  }

  static executeAction(action: string): void {
    // Simple action executor - can be expanded
    const diaryStore = useDiaryStore.getState();
    const worldState = useWorldStateStore.getState();
    const journalStore = useJournalStore.getState();

    // Example actions:
    // "start_quest:rodrick_wolf_pack"
    // "hire_job:job_dockhand"
    // "recruit_companion:companion_ronald"

    const [actionType, ...params] = action.split(':');

    switch (actionType) {
      case 'start_quest':
        {
          const questId = params[0];
          const q = (questsData as any)[questId];
          if (!q) {
            console.warn('Quest not found:', questId);
            break;
          }

          // Prevent duplicate acceptance
          const existing = useJournalStore.getState().quests[questId];
          if (existing && (existing.active || existing.completed)) {
            console.log('Quest already accepted or completed:', questId);
            break;
          }

          // Canonical quest (store record)
          const canonicalQuest = {
            id: questId,
            title: q.title,
            description: q.description,
            stages: q.stages || [],
            rewards: q.rewards || {},
            completed: false,
            active: true,
            currentStage: 0,
          };
          journalStore.addQuest(canonicalQuest);

          // UI quest (journal list)
          const giverId = q.giver_id as keyof typeof npcsData;
          const giverName = npcsData[giverId]?.name || 'Unknown';
          const objectives = (q.stages || []).map((s: any) => ({ text: s.text, completed: false }));

          const uiQuest = {
            id: questId,
            title: q.title,
            giver: giverName,
            description: q.description,
            objectives,
            rewards: [],
            status: 'active' as const,
          };
          const currentList = useJournalStore.getState().questsList || [];
          if (!currentList.some(q => q.id === questId)) {
            useJournalStore.getState().setQuestsList([...currentList, uiQuest]);
          }
          // Move to stage 1 after acceptance (talk stage completed)
          useJournalStore.getState().setQuestStage(questId, 1);
          // If player already has required items (e.g., 10 planks), auto-sync to stage 2
          try {
            useJournalStore.getState().syncQuestProgress(questId);
          } catch (e) {
            // Journal store may not expose sync yet; ignore
          }
          console.log('Quest started via dialogue:', questId);
        }
        break;

      case 'hire_job':
        // TODO: Implement job hiring
        console.log('Hiring for job:', params[0]);
        break;

      case 'recruit_companion':
        // TODO: Implement companion recruitment
        console.log('Recruiting companion:', params[0]);
        break;

      case 'advance_quest_stage':
        {
          const questId = params[0];
          useJournalStore.getState().advanceQuestStage(questId);
          console.log('Advanced quest stage:', questId);
        }
        break;

      default:
        console.warn('Unknown action type:', actionType);
    }
  }
}

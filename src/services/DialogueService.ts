// DialogueService.ts
// Handles NPC dialogue interactions and conversation flow

import dialogueData from '../data/dialogue.json';
import npcsData from '../data/npcs.json';
import questsData from '../data/quests.json';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useJournalStore } from '../stores/useJournalStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
interface DialogueNode {
  npc_text: string;
  player_choices?: {
    text: string;
    next_node?: string;
    closes_dialogue?: boolean;
    action?: string;
    condition?: string;
  }[];
}

interface DialogueEntry {
  nodes: Record<string, DialogueNode>;
}

interface DialogueFile {
  [key: string]: DialogueEntry;
}

const typedDialogueData: DialogueFile = dialogueData;

interface Npc {
  name: string;
  home_location: string;
  default_dialogue_id: string;
  portrait: string;
}

interface QuestReward {
  xp?: { skill: string; amount: number }[];
  items?: string[];
  currency?: number;
  relationship?: { npc_id: string; change: number }[];
}

interface Quest {
  title: string;
  giver_id: string;
  description: string;
  stages: any[]; // We can refine this later if needed
  rewards: QuestReward;
}

interface WorldState {
  quests: Record<string, Quest>;
  npcs: Record<string, Npc>;
}

const typedNpcsData: Record<string, Npc> = npcsData;
const typedQuestsData: Record<string, Quest> = questsData;

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
    // Add NPC to known list and create diary entry if not already known
    const worldStateStore = useWorldStateStore.getState();
    if (!worldStateStore.knownNpcs.includes(npcId)) {
      worldStateStore.addKnownNpc(npcId);
      const npcName = typedNpcsData[npcId]?.name || 'Unknown NPC';
      useDiaryStore.getState().addInteraction(`Met ${npcName} for the first time.`);
    }

    // Find the default dialogue for this NPC
    const npcData = typedNpcsData[npcId];
    if (!npcData) {
      console.error('NPC not found in NPC data:', npcId);
      return null;
    }

    let dialogueId = npcData.default_dialogue_id;
    const introMode = useWorldStateStore.getState().introMode;
    if (introMode) {
      if (npcId === 'npc_old_leo') dialogueId = 'old_leo_intro';
      if (npcId === 'npc_sarah') dialogueId = 'sarah_intro';
      if (npcId === 'npc_robert') dialogueId = 'robert_intro';
    }

    // Check if Roberta's quest is completed
    if (npcId === 'npc_roberta') {
      const journalStore = useJournalStore.getState();
      const robertaQuest = journalStore.quests['roberta_planks_for_the_past'];
      if (robertaQuest && robertaQuest.completed) {
        dialogueId = 'roberta_planks_completed';
      }
    }

    const dialogueEntry = typedDialogueData[dialogueId];

    if (!dialogueEntry) {
      console.error('Dialogue not found:', dialogueId);
      return null;
    }

    this.currentDialogueId = dialogueId;
    this.currentNodeId = '0';
    this.dialogueHistory = [dialogueEntry.nodes['0'].npc_text];

    return dialogueEntry.nodes['0'];
  }

  static selectResponse(responseIndex: number): DialogueNode | null {
    if (!this.currentDialogueId) return null;

    const currentDialogue = typedDialogueData[this.currentDialogueId as keyof typeof typedDialogueData];
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
    } else if (response.closes_dialogue) {
      this.endDialogue();
      return null;
    }

    return null;
  }

  static getCurrentDialogue(): DialogueNode | null {
    if (!this.currentDialogueId) return null;

    const dialogueEntry = typedDialogueData[this.currentDialogueId as keyof typeof typedDialogueData];
    if (!dialogueEntry) return null;

    return dialogueEntry.nodes[this.currentNodeId as keyof typeof dialogueEntry.nodes] || null;
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
    const multi = action.split('|').map(a => a.trim()).filter(a => a.length > 0);
    if (multi.length > 1) {
      multi.forEach(a => this.executeAction(a));
      return;
    }
    const diaryStore = useDiaryStore.getState();
    const worldState = useWorldStateStore.getState();
    const journalStore = useJournalStore.getState();

    // Example actions:
    // "start_quest:rodrick_wolf_pack"
    // "hire_job:job_dockhand"
    // "recruit_companion:companion_ronald"

    const [actionType, ...params] = action.split(':');

    switch (actionType) {
      case 'set_flag':
        {
          const flag = params[0];
          const valRaw = params[1];
          const val = valRaw === 'true' ? true : valRaw === 'false' ? false : Boolean(valRaw);
          useWorldStateStore.getState().setFlag(flag, val);
        }
        break;
      case 'start_quest':
        {
          const questId = params[0];
          const q = typedQuestsData[questId];
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
          const giverId = q.giver_id;
          const giverName = typedNpcsData[giverId]?.name || 'Unknown';
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

      case 'complete_quest':
        {
          const questId = params[0];
          journalStore.completeQuest(questId);
          console.log('Quest completed via dialogue:', questId);
        }
        break;

      case 'pass_time':
        {
          const minutes = Number(params[0] || '0');
          useWorldTimeStore.getState().passTime(minutes);
        }
        break;

      case 'grant_item':
        {
          const itemId = params[0];
          const qty = params[1] ? Number(params[1]) : 1;
          useInventoryStore.getState().addItem(itemId, qty);
          diaryStore.addInteraction('Received item: ' + itemId);
        }
        break;

      case 'grant_skill_level':
        {
          const skillId = params[0];
          const level = Number(params[1] || '1');
          useSkillStore.getState().setSkillLevel(skillId, level);
          diaryStore.addInteraction('Gained skill level in ' + skillId);
        }
        break;

      case 'update_relationship':
        {
          const npcId = params[0];
          const delta = Number(params[1] || '0');
          useDiaryStore.getState().updateRelationship(npcId, { friendship: delta });
          diaryStore.addInteraction('Relationship changed with ' + (typedNpcsData[npcId]?.name || npcId));
        }
        break;

      default:
        console.warn('Unknown action type:', actionType);
    }
  }
}

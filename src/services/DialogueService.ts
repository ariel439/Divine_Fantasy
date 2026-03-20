// DialogueService.ts
// Handles NPC dialogue interactions and conversation flow

import dialogueData from '../data/dialogues/index';
import npcsData from '../data/npcs.json';
import questsData from '../data/quests.json';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useJournalStore } from '../stores/useJournalStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useUIStore } from '../stores/useUIStore';
import { useShopStore } from '../stores/useShopStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useJobStore } from '../stores/useJobStore';
import { useLocationStore } from '../stores/useLocationStore';
import { benCheatEventSlides, rebelRaidIntroSlides, evilEndingSlides, hybridEndingSlides } from '../data/events';
import type { ConversationEntry } from '../types';
import { GameManagerService } from './GameManagerService';
import { ConditionEvaluator } from './ConditionEvaluator';
import { getMaxSocialEnergy } from '../utils/socialEnergy';
import { resolveSocialAction, type SocialActionType, type SocialStyle } from '../utils/socialResolver';
import { getSocialNpcConfig } from '../utils/socialNpcConfig';

interface DialogueNode {
  npc_text: string;
  player_choices?: {
    text: string;
    next_node?: string;
    closes_dialogue?: boolean;
    action?: string;
    condition?: string;
    req_skill_level?: {
      skill: string;
      level?: number;
    };
    fail_node?: string;
    social_cost?: number;
    disabled?: boolean;
    social_result_nodes?: Partial<Record<'fail' | 'weak' | 'strong', string>>;
  }[];
}

interface DialogueEntry {
  first_meet_node?: string;
  repeat_meet_node?: string;
  interaction_roots?: Partial<Record<'trade' | 'ask' | 'friendly' | 'flirt' | 'coerce' | 'quest', string>>;
  trade_shop_id?: string;
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
  private static currentNpcId: string | null = null;
  private static dialogueHistory: ConversationEntry[] = [];
  private static readonly SOCIAL_ROOT_NODE_ID = '__social_root__';
  private static readonly SOCIAL_RETURN_NODE_ID = '__social_return__';
  private static socialReturnNodeId: string | null = null;
  private static lastSocialOutcome: 'fail' | 'weak' | 'strong' | null = null;

  private static getSocialCategoryLabel(category: keyof NonNullable<DialogueEntry['interaction_roots']>): string {
    switch (category) {
      case 'ask': return 'Ask';
      case 'friendly': return 'Friendly';
      case 'flirt': return 'Flirt';
      case 'coerce': return 'Coerce';
      case 'quest': return 'Quest';
      case 'trade': return 'Trade';
      default: return category;
    }
  }

  private static buildSocialRootNode(dialogueEntry: DialogueEntry): DialogueNode {
    const interactionRoots = dialogueEntry.interaction_roots || {};
    const orderedCategories: (keyof NonNullable<DialogueEntry['interaction_roots']>)[] = [
      'quest',
      'ask',
      'friendly',
      'flirt',
      'coerce',
    ];

    const player_choices = orderedCategories
      .filter((category) => {
        const nodeId = interactionRoots[category];
        if (!nodeId || !dialogueEntry.nodes[nodeId]) {
          return false;
        }

        const categoryNode = this.applyConditionsToNode(dialogueEntry.nodes[nodeId]);
        const categoryChoices = categoryNode.player_choices || [];
        return categoryChoices.some((choice) => !this.isNavigationChoice(choice) && !choice.disabled);
      })
      .map((category) => {
        return {
          text: this.getSocialCategoryLabel(category),
          next_node: interactionRoots[category],
        };
      });

    player_choices.push({
      text: 'Back',
      next_node: this.SOCIAL_RETURN_NODE_ID,
    });

    return {
      npc_text: 'How do you want to approach this conversation?',
      player_choices,
    };
  }

  private static reorderOpeningNodeChoices(node: DialogueNode): DialogueNode {
    const choices = node.player_choices || [];
    if (choices.length <= 1) {
      return node;
    }

    const sorted = [...choices].sort((a, b) => {
      const aIsTrade = (a.action || '').startsWith('open_shop:') ? 1 : 0;
      const bIsTrade = (b.action || '').startsWith('open_shop:') ? 1 : 0;
      return bIsTrade - aIsTrade;
    });

    return { ...node, player_choices: sorted };
  }

  private static getNode(dialogueEntry: DialogueEntry, nodeId: string): DialogueNode | null {
    if (nodeId === this.SOCIAL_ROOT_NODE_ID) {
      return this.buildSocialRootNode(dialogueEntry);
    }

    const node = dialogueEntry.nodes[nodeId] || null;
    if (!node) {
      return null;
    }

    if (nodeId === dialogueEntry.first_meet_node || nodeId === dialogueEntry.repeat_meet_node) {
      const reorderedNode = this.reorderOpeningNodeChoices(node);
      return reorderedNode;
    }

    return node;
  }

  private static isMenuNodeId(dialogueEntry: DialogueEntry, nodeId: string): boolean {
    if (nodeId === this.SOCIAL_ROOT_NODE_ID) {
      return true;
    }

    const interactionRoots = Object.values(dialogueEntry.interaction_roots || {});
    return interactionRoots.includes(nodeId as any);
  }

  private static isNavigationChoice(choice: {
    text: string;
    next_node?: string;
    closes_dialogue?: boolean;
  }): boolean {
    const normalizedText = choice.text.toLowerCase();
    return (
      choice.next_node === this.SOCIAL_ROOT_NODE_ID ||
      choice.next_node === this.SOCIAL_RETURN_NODE_ID ||
      normalizedText === 'back.' ||
      normalizedText === 'back' ||
      normalizedText === 'leave' ||
      normalizedText === 'leave.'
    );
  }

  private static shouldLogChoice(choice: {
    text: string;
    next_node?: string;
    closes_dialogue?: boolean;
  }): boolean {
    const currentDialogue = this.currentDialogueId ? typedDialogueData[this.currentDialogueId as keyof typeof typedDialogueData] : null;
    if (currentDialogue && this.isMenuNodeId(currentDialogue, this.currentNodeId)) {
      return false;
    }

    return !this.isNavigationChoice(choice);
  }

  private static getSocialActionMeta(action?: string): { npcId: string; type: SocialActionType } | null {
    if (!action || !action.startsWith('social_action:')) {
      return null;
    }

    const [, npcId, type] = action.split(':');
    if (!npcId || !type) {
      return null;
    }

    return { npcId, type: type as SocialActionType };
  }

  private static shouldSkipOpeningNode(dialogueEntry: DialogueEntry, nodeId: string, node: DialogueNode): boolean {
    if (!dialogueEntry.interaction_roots) {
      return false;
    }

    if (nodeId !== dialogueEntry.first_meet_node && nodeId !== dialogueEntry.repeat_meet_node) {
      return false;
    }

    const choices = (node.player_choices || []).filter((choice) => !choice.condition || ConditionEvaluator.evaluate(choice.condition));
    if (choices.length !== 2) {
      return false;
    }

    const talkChoice = choices.find((choice) => choice.next_node === this.SOCIAL_ROOT_NODE_ID);
    const exitChoice = choices.find((choice) =>
      choice.closes_dialogue ||
      choice.next_node === this.SOCIAL_RETURN_NODE_ID ||
      this.isNavigationChoice(choice)
    );

    return Boolean(talkChoice && exitChoice);
  }

  private static getCurrentSocialDayKey(): string {
    const { year, month, dayOfMonth } = useWorldTimeStore.getState();
    return `${year}-${month}-${dayOfMonth}`;
  }

  private static getNpcDailySocialUsesKey(npcId: string): string {
    return `social_uses:${npcId}:${this.getCurrentSocialDayKey()}`;
  }

  private static getNpcDailySocialUses(npcId: string): number {
    const raw = useWorldStateStore.getState().getData(this.getNpcDailySocialUsesKey(npcId));
    return raw ? Number(raw) || 0 : 0;
  }

  private static incrementNpcDailySocialUses(npcId: string): void {
    useWorldStateStore.getState().setData(
      this.getNpcDailySocialUsesKey(npcId),
      String(this.getNpcDailySocialUses(npcId) + 1)
    );
  }

  private static hasNpcReachedDailySocialLimit(npcId: string): boolean {
    return this.getNpcDailySocialUses(npcId) >= (getSocialNpcConfig(npcId).dailyMeaningfulActions ?? 2);
  }

  public static applyConditionsToNode(node: DialogueNode): DialogueNode {
    const choices = node.player_choices || [];
    const socialEnergy = useCharacterStore.getState().socialEnergy;
    const currentNpcId = this.currentNpcId;

    const filtered = choices
      .filter((choice) => {
        if (!choice.condition) {
          return true;
        }

        return ConditionEvaluator.evaluate(choice.condition);
      })
      .map((choice) => {
        const socialCost = choice.social_cost || 0;
        const socialActionMeta = this.getSocialActionMeta(choice.action);
        const isMeaningfulSocialAction = Boolean(socialActionMeta);
        const socialNpcId = socialActionMeta?.npcId || currentNpcId || '';
        const dailyLimitReached = Boolean(socialNpcId && isMeaningfulSocialAction && this.hasNpcReachedDailySocialLimit(socialNpcId));
        const flirtRequirement = socialActionMeta?.type === 'flirt' ? getSocialNpcConfig(socialNpcId) : null;
        const friendshipValue = socialNpcId ? (useDiaryStore.getState().relationships[socialNpcId]?.friendship?.value ?? 0) : 0;
        const flirtLocked = Boolean(
          flirtRequirement &&
          (!flirtRequirement.flirtable || friendshipValue < (flirtRequirement.flirtFriendshipRequired ?? 999))
        );
        const disabled = Boolean(choice.disabled) || socialCost > socialEnergy || dailyLimitReached || flirtLocked;
        let text = socialCost > 0 ? `${choice.text} (${socialCost} Social)` : choice.text;

        if (dailyLimitReached) {
          text = `${text} (No more today)`;
        }
        if (flirtLocked) {
          text = `${text} (Need ${flirtRequirement?.flirtFriendshipRequired ?? 0} Friendship)`;
        }

        return {
          ...choice,
          disabled,
          text,
        };
      });

    return { ...node, player_choices: filtered };
  }

  static startDialogue(npcId: string, overrideDialogueId?: string): DialogueNode | null {
    // Determine known state before updating, to support first-time greeting behavior
    const worldStateStore = useWorldStateStore.getState();
    const wasKnown = worldStateStore.knownNpcs.includes(npcId);
    
    if (!wasKnown) {
      worldStateStore.addKnownNpc(npcId);
      const npcName = typedNpcsData[npcId]?.name || 'Unknown NPC';
      useDiaryStore.getState().addInteraction(`Met ${npcName} for the first time.`);
    }

    // Find the default dialogue for this NPC
    const npcData = typedNpcsData[npcId];
    if (!npcData) {
      console.error(`NPC not found in NPC data: ${npcId}`);
      return null;
    }

    let dialogueId = overrideDialogueId || npcData.default_dialogue_id;
    const introMode = useWorldStateStore.getState().introMode;
    if (!overrideDialogueId && introMode) {
      if (npcId === 'npc_old_leo') dialogueId = 'old_leo_intro';
      if (npcId === 'npc_sarah') dialogueId = 'sarah_intro';
      if (npcId === 'npc_kyle') dialogueId = 'kyle_intro';
    }

    if (!overrideDialogueId) {
      const currentEventId = useUIStore.getState().currentEventId;
      if (npcId === 'npc_kyle' && currentEventId === 'kyle_smuggler_alert') {
        dialogueId = 'kyle_smuggler_alert';
      }

      if (npcId === 'npc_finn' && useWorldStateStore.getState().getFlag('finn_debt_intro_pending')) {
        dialogueId = 'finn_debt_intro';
      }

      if (npcId === 'npc_beryl') {
        const world = useWorldStateStore.getState();
        if (world.getFlag('finn_debt_collection_active')) {
          dialogueId = 'beryl_debt_approach';
        }
      }

      if (npcId === 'npc_boric') {
        const greetedFlagBoric = 'greeted_npc_boric';
        if (!useWorldStateStore.getState().getFlag(greetedFlagBoric)) {
          dialogueId = 'boric_intro';
        }
      }
    }

    const dialogueEntry = typedDialogueData[dialogueId];

    if (!dialogueEntry) {
      console.error('Dialogue not found:', dialogueId);
      return null;
    }

    this.currentDialogueId = dialogueId;
    this.currentNpcId = npcId;
    this.socialReturnNodeId = null;

    const startingNodeId = (() => {
      if (!overrideDialogueId && !wasKnown && dialogueEntry.first_meet_node && dialogueEntry.nodes[dialogueEntry.first_meet_node]) {
        return dialogueEntry.first_meet_node;
      }

      if (!overrideDialogueId && wasKnown && dialogueEntry.repeat_meet_node && dialogueEntry.nodes[dialogueEntry.repeat_meet_node]) {
        return dialogueEntry.repeat_meet_node;
      }

      if (dialogueEntry.interaction_roots) {
        return this.SOCIAL_ROOT_NODE_ID;
      }

      return '0';
    })();

    this.currentNodeId = startingNodeId;
    const firstNode = this.getNode(dialogueEntry, startingNodeId);

    if (!firstNode) {
      console.error('Starting dialogue node not found:', dialogueId, startingNodeId);
      return null;
    }

    if (this.shouldSkipOpeningNode(dialogueEntry, startingNodeId, firstNode)) {
      this.currentNodeId = this.SOCIAL_ROOT_NODE_ID;
      const rootNode = this.getNode(dialogueEntry, this.SOCIAL_ROOT_NODE_ID);
      if (!rootNode) {
        return null;
      }
      this.dialogueHistory = [];
      return DialogueService.applyConditionsToNode(rootNode);
    }

    this.dialogueHistory = this.isMenuNodeId(dialogueEntry, startingNodeId)
      ? []
      : [{ speaker: 'npc', text: firstNode.npc_text }];
    return DialogueService.applyConditionsToNode(firstNode);
  }

  static selectResponse(responseIndex: number): DialogueNode | null {
    if (!this.currentDialogueId) return null;

    const currentDialogue = typedDialogueData[this.currentDialogueId as keyof typeof typedDialogueData];
    if (!currentDialogue) return null;

    const rawNode = this.getNode(currentDialogue, this.currentNodeId);
    if (!rawNode) return null;

    // Apply conditions to ensure we match the index to the filtered list the user saw
    const filteredNode = DialogueService.applyConditionsToNode(rawNode);

    if (!filteredNode.player_choices || !filteredNode.player_choices[responseIndex]) {
      return null;
    }

    const response = filteredNode.player_choices[responseIndex];
    if (response.disabled) {
      return this.getCurrentDialogue();
    }

    const shouldLogChoice = this.shouldLogChoice(response);
    if (shouldLogChoice) {
      this.dialogueHistory.push({ speaker: 'player', text: response.text.replace(/\s+\(\d+\s+Social\)$/, '') });
    }

    if (response.social_cost) {
      useCharacterStore.getState().updateStats({ socialEnergy: -response.social_cost });
    }

    // Handle Skill Check Logic
    const anyChoice = response as any;
    if (anyChoice.req_skill_level) {
        const skill = anyChoice.req_skill_level.skill;
        const reqLevel = anyChoice.req_skill_level.level || 0;
        const playerLevel = useSkillStore.getState().getSkillLevel(skill);
        
        console.log(`Skill Check: ${skill} (Player: ${playerLevel} vs Req: ${reqLevel})`);
        
        if (playerLevel < reqLevel) {
            // Skill Check Failed
            const failNodeId = anyChoice.fail_node || anyChoice.next_node + '_fail';
            
            if (currentDialogue.nodes[failNodeId]) {
                this.currentNodeId = failNodeId;
                const nextNode = currentDialogue.nodes[failNodeId];
                if (!this.isMenuNodeId(currentDialogue, failNodeId)) {
                  this.dialogueHistory.push({ speaker: 'npc', text: nextNode.npc_text });
                }
                return DialogueService.applyConditionsToNode(nextNode);
            } else {
                 this.dialogueHistory.push({ speaker: 'npc', text: "[Skill Check Failed] (You are not skilled enough to do that.)" });
                 return this.getCurrentDialogue();
            }
        }
    }

    if (response.next_node === this.SOCIAL_ROOT_NODE_ID && !this.isMenuNodeId(currentDialogue, this.currentNodeId)) {
      this.socialReturnNodeId = this.currentNodeId;
    }

    // Execute actions
    if (response.action) {
      const actionStr = response.action as string;
      this.executeAction(actionStr);
    }

    // Handle next dialogue
    let nextNodeId = response.next_node;
    if (response.social_result_nodes && this.lastSocialOutcome) {
      nextNodeId = response.social_result_nodes[this.lastSocialOutcome] || nextNodeId;
    }

    if (nextNodeId === this.SOCIAL_RETURN_NODE_ID) {
      nextNodeId = this.socialReturnNodeId || undefined;
    }

    if (nextNodeId) {
      const nextNode = this.getNode(currentDialogue, nextNodeId);
      if (nextNode) {
        this.currentNodeId = nextNodeId;
        if (shouldLogChoice && !this.isMenuNodeId(currentDialogue, nextNodeId)) {
          this.dialogueHistory.push({ speaker: 'npc', text: nextNode.npc_text });
        }
        return DialogueService.applyConditionsToNode(nextNode);
      }
    } else if (response.closes_dialogue) {
      this.endDialogue();
      return null;
    }

    // If action mutated the dialogue (e.g., switched current node), return the current node
    return this.getCurrentDialogue();
  }

  static getCurrentDialogue(): DialogueNode | null {
    if (!this.currentDialogueId) return null;

    const dialogueEntry = typedDialogueData[this.currentDialogueId as keyof typeof typedDialogueData];
    if (!dialogueEntry) return null;

    const node = this.getNode(dialogueEntry, this.currentNodeId);
    return node ? DialogueService.applyConditionsToNode(node) : null;
  }

  static getDialogueHistory(): ConversationEntry[] {
    return [...this.dialogueHistory];
  }

  static endDialogue(): void {
    if (this.currentNpcId) {
      const npcName = typedNpcsData[this.currentNpcId]?.name || this.currentNpcId;
      useDiaryStore.getState().addInteraction(`${this.currentNpcId}: Spoke with ${npcName}.`);
    }
    this.currentDialogueId = null;
    this.currentNodeId = '0';
    this.currentNpcId = null;
    this.dialogueHistory = [];
    this.socialReturnNodeId = null;
    this.lastSocialOutcome = null;
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
      case 'trigger_confirmation': {
        const type = params[0];
        useUIStore.getState().setConfirmationType(type);
        useUIStore.getState().openModal('confirmation');
        break;
      }
      case 'trigger_event': {
        const eventId = params[0];
        useUIStore.getState().setCurrentEventId(eventId);

        if (eventId === 'raid_salty_mug_intro') {
          useUIStore.getState().setEventSlides(rebelRaidIntroSlides);
          useUIStore.getState().setScreen('event');
          this.endDialogue();
          useUIStore.getState().setDialogueNpcId(null);
        } else if (eventId === 'ben_cheat_event') {
          useUIStore.getState().setEventSlides(benCheatEventSlides);
          useUIStore.getState().setScreen('event');
          this.endDialogue();
        } else if (eventId === 'evil_path_end') {
          useUIStore.getState().setEventSlides(evilEndingSlides);
          useUIStore.getState().setScreen('event');
          this.endDialogue();
        } else if (eventId === 'finn_hybrid_end') {
          useUIStore.getState().setEventSlides(hybridEndingSlides);
          useUIStore.getState().setScreen('event');
          this.endDialogue();
        } else {
          console.warn(`[DialogueService] trigger_event: No slides mapped for ${eventId}`);
        }
        break;
      }
      case 'set_flag':
        {
          const flag = params[0];
          const valRaw = params[1];
          const val = valRaw === 'true' ? true : valRaw === 'false' ? false : Boolean(valRaw);
          useWorldStateStore.getState().setFlag(flag, val);
        }
        break;
      case 'add_money':
        {
          const amount = Number(params[0] || '0');
          const type = (params[1] || 'silver') as 'copper' | 'silver' | 'gold';
          useCharacterStore.getState().addCurrency(type, amount);
          diaryStore.addInteraction(`Received ${amount} ${type}.`);
        }
        break;

      case 'remove_money':
        {
          const amount = Number(params[0] || '0');
          const type = params[1] || 'silver';
          let paid = false;
          if (type === 'copper') paid = useCharacterStore.getState().removeCurrency(amount, 0, 0);
          else if (type === 'gold') paid = useCharacterStore.getState().removeCurrency(0, 0, amount);
          else paid = useCharacterStore.getState().removeCurrency(0, amount, 0); // Default silver
          
          if (paid) {
            diaryStore.addInteraction(`Paid ${amount} ${type}.`);
          } else {
            diaryStore.addInteraction(`Not enough money (${amount} ${type} required).`);
          }
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
          useJournalStore.getState().addQuest({
            id: questId,
            title: q.title,
            description: q.description,
            stages: q.stages,
            currentStage: 0,
            completed: false,
            active: true,
            rewards: q.rewards
          });

          // For intro quest, keep all objectives visible without auto-completing the first stage
          if (questId !== 'luke_tutorial' && questId !== 'rebel_path') {
            // Move to stage 1 after acceptance (talk stage completed)
            useJournalStore.getState().setQuestStage(questId, 1);
          }
          console.log('Quest started via dialogue:', questId);
        }
        break;

      case 'hire_job':
        {
          const jobId = params[0];
          useJobStore.getState().loadJobs();
          const can = useJobStore.getState().canHire(jobId);
          if (!can.ok) {
            useDiaryStore.getState().addInteraction(`Supervisor: We can't rehire you yet. Come back after ${can.rehiredFrom}.`);
            break;
          }
          useJobStore.getState().takeJob(jobId);
          useDiaryStore.getState().addInteraction(`Hired for job: ${jobId}`);
          useDiaryStore.getState().addInteraction(`Supervisor: You start tomorrow at ${String(useJobStore.getState().jobs[jobId]?.schedule.startHour ?? 8).padStart(2, '0')}:00.`);
        }
        break;

      case 'try_hire_or_deny':
        {
          const jobId = params[0];
          const denyNodeId = params[1];
          useJobStore.getState().loadJobs();
          const can = useJobStore.getState().canHire(jobId);
          if (!can.ok) {
            const currentDialogue = this.currentDialogueId ? typedDialogueData[this.currentDialogueId as keyof typeof typedDialogueData] : null;
            if (currentDialogue && denyNodeId && currentDialogue.nodes[denyNodeId]) {
              const denyNode = currentDialogue.nodes[denyNodeId];
              this.currentNodeId = denyNodeId;
              this.dialogueHistory.push({ speaker: 'npc', text: denyNode.npc_text });
            }
            break;
          }
          useJobStore.getState().takeJob(jobId);
          useDiaryStore.getState().addInteraction(`Hired for job: ${jobId}`);
          useDiaryStore.getState().addInteraction(`Supervisor: You start tomorrow at ${String(useJobStore.getState().jobs[jobId]?.schedule.startHour ?? 8).padStart(2, '0')}:00.`);
          this.endDialogue();
        }
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

      case 'set_quest_stage':
        {
          const questId = params[0];
          const stage = Number(params[1] || '0');
          useJournalStore.getState().setQuestStage(questId, stage);
          console.log('Set quest stage:', questId, stage);
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
          
          // Check for Finn's Deadline
          const world = useWorldStateStore.getState();
          if (world.getFlag('finn_debt_collection_active')) {
            const deadlineRaw = world.getData('finn_debt_deadline_day');
            const deadline = deadlineRaw ? Number(deadlineRaw) : 0;
            const currentDay = useWorldTimeStore.getState().day;
            if (deadline > 0 && currentDay > deadline) {
               // Trigger Game Over Dialogue
               // We force start the dialogue next time they interact or immediately?
               // Since we are in a "pass_time" (usually sleep or wait), we can't easily pop dialogue immediately unless we are in a scene.
               // Better approach: Set a flag "finn_deadline_missed" and check it on every move? 
               // Or force it here if we can.
               // Let's force it by overriding the current screen if possible, or just setting a flag that triggers an event.
               // For simplicity in this codebase, let's set a flag and handle it in the "Wake Up" or "Wait" logic, OR just launch it now.
               // Launching dialogue requires being in a view that supports it.
               DialogueService.startDialogue('npc_finn', 'finn_timeout_event');
               useUIStore.getState().setScreen('dialogue');
            }
          }
        }
        break;

      case 'trigger_game_over':
        {
            // Simple reload for now as a "Hard Reset"
            window.location.reload();
        }
        break;

      case 'start_finn_betrayal_combat':
        {
          GameManagerService.startFinnBetrayalCombat();
        }
        break;

      case 'grant_item':
      case 'add_item':
        {
          const itemId = params[0];
          const qty = params[1] ? Number(params[1]) : 1;
          useInventoryStore.getState().addItem(itemId, qty);
          diaryStore.addInteraction('Received item: ' + itemId);
        }
        break;

      case 'remove_item':
        {
          const itemId = params[0];
          const qty = params[1] ? Number(params[1]) : 1;
          useInventoryStore.getState().removeItem(itemId, qty);
          diaryStore.addInteraction('Removed item: ' + itemId);
        }
        break;

      case 'open_shop':
        {
          const shopId = params[0];
          useUIStore.getState().setShopId(shopId);
          useUIStore.getState().setScreen('trade');
        }
        break;

      case 'convert_logs_to_planks':
        {
          const qtyRaw = params[0] || '0';
          const inv = useInventoryStore.getState();
          const char = useCharacterStore.getState();
          const logsAvailable = inv.getItemQuantity('log');
          const requested = qtyRaw === 'all' ? logsAvailable : Math.max(0, Number(qtyRaw));
          const maxByCopper = Math.floor(char.currency.copper / 2);
          const produce = Math.min(requested, logsAvailable, maxByCopper);
          if (produce <= 0) {
            diaryStore.addInteraction('Sawmill: Not enough logs or copper.');
            break;
          }
          const removed = inv.removeItem('log', produce);
          if (!removed) {
            diaryStore.addInteraction('Sawmill: Failed to remove logs.');
            break;
          }
          const cost = produce * 2;
          const paid = useCharacterStore.getState().removeCurrency(cost);
          if (!paid) {
            // Rollback log removal if payment fails
            inv.addItem('log', produce);
            diaryStore.addInteraction('Sawmill: Payment failed.');
            break;
          }
          inv.addItem('wooden_plank', produce);
          diaryStore.addInteraction(`Converted ${produce} logs to planks at the sawmill.`);
        }
        break;

      case 'offer_debt_payment':
        {
          // No-op placeholder: UI could present choices in dialogue JSON
          diaryStore.addInteraction('Discussed debt with Finn.');
        }
        break;

      case 'start_debt_collection':
        {
          useWorldStateStore.getState().setFlag('finn_debt_collection_active', true);
          useWorldStateStore.getState().setFlag('debt_paid_by_ben', false);
          useWorldStateStore.getState().setFlag('debt_paid_by_beryl', false);
          useWorldStateStore.getState().setFlag('debt_paid_by_elara', false);
          try { useJournalStore.getState().setQuestStage('finn_debt_collection', 1); } catch {}
          const day = useWorldTimeStore.getState().day;
          try {
            // Set deadline to 7 days from now
            useWorldStateStore.getState().setData('finn_debt_deadline_day', String(day + 7));
          } catch {}
        }
        break;

      case 'collect_debt_from':
        {
          const targetNpcId = params[0];
          const amount = Number(params[1] || '10');
          const flagMap: Record<string, string> = {
            'npc_ben': 'debt_paid_by_ben',
            'npc_beryl': 'debt_paid_by_beryl',
            'npc_elara': 'debt_paid_by_elara',
          };
          const flag = flagMap[targetNpcId];
          if (!flag) break;
          const world = useWorldStateStore.getState();
          if (world.getFlag(flag)) {
            diaryStore.addInteraction('Already collected from ' + (typedNpcsData[targetNpcId]?.name || targetNpcId) + '.');
            break;
          }
          if (!world.getFlag('finn_debt_collection_active')) {
            diaryStore.addInteraction('Debt collection is not active.');
            break;
          }
          useCharacterStore.getState().addCurrency('silver', amount);
          world.setFlag(flag, true);
          diaryStore.addInteraction('Collected ' + amount + ' silvers from ' + (typedNpcsData[targetNpcId]?.name || targetNpcId) + '.');
        }
        break;

      case 'turn_in_debt':
        {
          const requiredSilvers = Number(params[0] || '30');
          const world = useWorldStateStore.getState();
          const allCollected = world.getFlag('debt_paid_by_ben') && (world.getFlag('debt_paid_by_beryl') || world.getFlag('beryl_debt_forgiven')) && world.getFlag('debt_paid_by_elara');
          if (!allCollected) {
            diaryStore.addInteraction('npc_finn: You have not collected from all three yet.');
            break;
          }
          const totalCopperNeeded = requiredSilvers * 100;
          const paid = useCharacterStore.getState().removeCurrency(totalCopperNeeded);
          if (!paid) {
            diaryStore.addInteraction('npc_finn: Come back when you actually did the job.');
            break;
          }
          world.setFlag('finn_debt_collection_active', false);
          diaryStore.addInteraction('npc_finn: Debt job complete.');
          try {
            useJournalStore.getState().completeQuest('finn_debt_collection');
          } catch {}
        }
        break;

      case 'turn_in_debt_or_rebuke':
        {
          const requiredSilvers = Number(params[0] || '30');
          const rebukeNodeId = params[1];
          const world = useWorldStateStore.getState();
          const allCollected = world.getFlag('debt_paid_by_ben') && (world.getFlag('debt_paid_by_beryl') || world.getFlag('beryl_debt_forgiven')) && world.getFlag('debt_paid_by_elara');
          const currentDialogue = this.currentDialogueId ? typedDialogueData[this.currentDialogueId as keyof typeof typedDialogueData] : null;
          const showRebuke = () => {
            if (currentDialogue && rebukeNodeId && currentDialogue.nodes[rebukeNodeId]) {
              const node = currentDialogue.nodes[rebukeNodeId];
              this.currentNodeId = rebukeNodeId;
              this.dialogueHistory.push({ speaker: 'npc', text: node.npc_text });
            } else {
              diaryStore.addInteraction('npc_finn: Come back when you actually did the job.');
            }
          };
          if (!allCollected) {
            showRebuke();
            break;
          }
          const totalCopperNeeded = requiredSilvers * 100;
          const paid = useCharacterStore.getState().removeCurrency(totalCopperNeeded);
          if (!paid) {
            showRebuke();
            break;
          }
          world.setFlag('finn_debt_collection_active', false);
          diaryStore.addInteraction('npc_finn: Debt job complete.');
          try {
            useJournalStore.getState().completeQuest('finn_debt_collection');
          } catch {}
          this.endDialogue();
        }
        break;

      case 'start_brawl':
        {
          const target = params[0];
          if (target === 'ben') {
            GameManagerService.startBenBrawl();
          }
        }
        break;

      case 'enter_temporal_instance':
        {
          const locationId = params[0];
          const year = Number(params[1] || '780');
          const month = Number(params[2] || '1');
          const dayOfMonth = Number(params[3] || '1');
          const hour = Number(params[4] || '8');
          const minute = Number(params[5] || '0');
          const locStore = useLocationStore.getState();
          const currentLoc = locStore.currentLocationId;
          useWorldStateStore.getState().setData('temporal_return_location', currentLoc || 'driftwatch');
          useWorldTimeStore.getState().enterTemporalInstance({ year, month, dayOfMonth, hour, minute });
          if (locationId) locStore.setLocation(locationId);
          useUIStore.getState().setScreen('inGame');
          diaryStore.addInteraction(`Entered temporal instance at ${locationId || currentLoc}: ${dayOfMonth}/${month}/${year} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
        }
        break;

      case 'exit_temporal_instance':
        {
          useWorldTimeStore.getState().exitTemporalInstance();
          const ret = useWorldStateStore.getState().getData('temporal_return_location');
          if (ret) {
            useLocationStore.getState().setLocation(ret);
          }
          diaryStore.addInteraction('Exited temporal instance.');
          useUIStore.getState().setScreen('inGame');
        }
        break;

      case 'pay_debt':
        {
          const amount = Number(params[0] || '0');
          if (amount <= 0) break;
          const paid = useCharacterStore.getState().removeCurrency(amount);
          if (paid) {
            useWorldStateStore.getState().setFlag('finn_debt_paid', true);
            diaryStore.addInteraction(`Paid ${amount}c to Finn. Debt cleared.`);
          } else {
            diaryStore.addInteraction('Payment failed: not enough copper.');
          }
        }
        break;

      case 'rent_room':
        {
          const debtPaid = useWorldStateStore.getState().getFlag('finn_debt_paid');
          if (!debtPaid) {
            diaryStore.addInteraction('Cannot rent: debt not cleared.');
            break;
          }
          useUIStore.getState().setSleepWaitMode('sleep');
          useUIStore.getState().openModal('sleepWait');
          diaryStore.addInteraction('Rented a room at the Salty Mug.');
        }
        break;

      case 'set_attribute':
        {
          const attr = params[0];
          const val = Number(params[1] || '1');
          const char = useCharacterStore.getState();
          // Type-safe update if possible, or cast
          const attributes = { ...char.attributes, [attr]: val };
          useCharacterStore.setState({ attributes });
          // Recalculate derived stats (maxWeight, socialEnergy)
          useCharacterStore.getState().recalculateStats();
          const maxSocial = getMaxSocialEnergy(
            attributes.charisma,
            useSkillStore.getState().getSkillLevel('persuasion'),
            useSkillStore.getState().getSkillLevel('coercion')
          );
          useCharacterStore.setState((state) => ({
            maxSocialEnergy: maxSocial,
            socialEnergy: Math.min(state.socialEnergy, maxSocial),
          }));
          
          diaryStore.addInteraction(`Set attribute ${attr} to ${val}`);
          console.log(`[DialogueService] Set attribute ${attr} to ${val}. New attributes:`, attributes);
        }
        break;

      case 'grant_skill_level':
        {
          const skillId = params[0];
          const level = Number(params[1] || '1');
          console.log(`[DialogueService] Granting skill level: ${skillId} -> ${level}`);
          useSkillStore.getState().setSkillLevel(skillId, level);
          diaryStore.addInteraction('Gained skill level in ' + skillId);
        }
        break;

      case 'add_xp':
        {
          const skillId = params[0];
          const amount = Number(params[1] || '10');
          useSkillStore.getState().addXp(skillId, amount);
          diaryStore.addInteraction(`Gained ${amount} XP in ${skillId}`);
        }
        break;

      case 'social_action':
        {
          const npcId = params[0];
          const socialType = (params[1] || 'friendly') as SocialActionType;
          const socialStyle = (params[2] || 'honest') as SocialStyle;
          if (this.hasNpcReachedDailySocialLimit(npcId)) {
            this.lastSocialOutcome = 'fail';
            diaryStore.addInteraction(`${npcId}: They have had enough of you for today.`);
            break;
          }

          const result = resolveSocialAction({
            npcId,
            type: socialType,
            style: socialStyle,
            persuasionLevel: useSkillStore.getState().getSkillLevel('persuasion'),
            coercionLevel: useSkillStore.getState().getSkillLevel('coercion'),
          });

          this.incrementNpcDailySocialUses(npcId);
          this.lastSocialOutcome = result.outcome;
          useDiaryStore.getState().updateRelationship(npcId, result.relationshipChanges);
          useSkillStore.getState().addXp(result.xpSkill, result.xpAmount);
          diaryStore.addInteraction(`${npcId}: ${result.diaryText}`);
        }
        break;

      case 'update_relationship':
        {
          const npcId = params[0];
          const delta = Number(params[1] || '0');
          const stat = (params[2] || 'friendship') as 'friendship' | 'love' | 'fear';
          useDiaryStore.getState().updateRelationship(npcId, { [stat]: delta });
          diaryStore.addInteraction('Relationship changed with ' + (typedNpcsData[npcId]?.name || npcId));
        }
        break;
      case 'set_relationship':
        {
          const npcId = params[0];
          const target = Number(params[1] || '0');
          const current = useDiaryStore.getState().relationships[npcId]?.friendship?.value || 0;
          const delta = target - current;
          useDiaryStore.getState().updateRelationship(npcId, { friendship: delta });
          diaryStore.addInteraction('Relationship set for ' + (typedNpcsData[npcId]?.name || npcId));
        }
        break;
      case 'add_known_npc':
        {
          const id = params[0];
          useWorldStateStore.getState().addKnownNpc(id);
          diaryStore.addInteraction('Now know NPC: ' + (typedNpcsData[id]?.name || id));
        }
        break;

      default:
        console.warn('Unknown action type:', actionType);
    }
  }
}

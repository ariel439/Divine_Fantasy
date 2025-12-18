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
import { useUIStore } from '../stores/useUIStore';
import { useShopStore } from '../stores/useShopStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useJobStore } from '../stores/useJobStore';
import { useLocationStore } from '../stores/useLocationStore';
import type { ConversationEntry } from '../types';

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
  private static dialogueHistory: ConversationEntry[] = [];

  public static applyConditionsToNode(node: DialogueNode): DialogueNode {
    const choices = node.player_choices || [];
    // Debug logging - FULL DUMP
    const jobStore = useJobStore.getState();
    const world = useWorldStateStore.getState();
    const journal = useJournalStore.getState();
    const diary = useDiaryStore.getState();
    const timeStore = useWorldTimeStore.getState();
    const inventory = useInventoryStore.getState();

    console.log('[DialogueService] applyConditionsToNode - START');
    console.log('[DialogueService] Current Job State:', {
      activeJob: jobStore.activeJob,
      firedJobs: jobStore.firedJobs,
      activeJobId: jobStore.activeJob?.jobId
    });
    console.log('[DialogueService] Relationships:', diary.relationships);
    
    const filtered = choices.filter((choice) => {
      const condition = choice.condition;
      console.log(`[DialogueService] Evaluating choice: "${choice.text}"`);
      if (!condition) {
        console.log(`  -> No condition, keeping.`);
        return true;
      }
      
      console.log(`  -> Condition: "${condition}"`);

      const parts = String(condition).split('&&').map(s => s.trim());

      for (const expr of parts) {
        let op = '==';
        let lhs = expr;
        let rhsRaw = '';
        let opFound = false;

        // Find operator
        for (const candidate of ['>=','<=','==','>','<']) {
          const idx = expr.indexOf(candidate);
          if (idx >= 0) {
            op = candidate;
            lhs = expr.slice(0, idx).trim();
            rhsRaw = expr.slice(idx + candidate.length).trim();
            opFound = true;
            break;
          }
        }

        const rhsBool = rhsRaw === 'true' ? true : rhsRaw === 'false' ? false : undefined;
        const rhsNum = rhsBool === undefined && rhsRaw !== '' && !isNaN(Number(rhsRaw)) ? Number(rhsRaw) : undefined;

        console.log(`    -> Part: "${expr}" parsed as LHS="${lhs}" OP="${op}" RHS="${rhsRaw}"`);

        let result = true; // Default for this part

        if (lhs.startsWith('quest.')) {
          const [, questId, field] = lhs.split('.');
          const q = journal.quests[questId];
          if (field === 'active') {
            const val = (q?.active || false);
            if (op === '==') { if (val !== (rhsBool as boolean)) result = false; }
          } else if (field === 'completed') {
            const val = (q?.completed || false);
            if (op === '==') { if (val !== (rhsBool as boolean)) result = false; }
          } else if (field === 'stage') {
            const stage = q?.currentStage ?? 0;
            if (op === '==') { if (stage !== (rhsNum as number)) result = false; }
            if (op === '>') { if (!(stage > (rhsNum as number))) result = false; }
            if (op === '<') { if (!(stage < (rhsNum as number))) result = false; }
            if (op === '>=') { if (!(stage >= (rhsNum as number))) result = false; }
            if (op === '<=') { if (!(stage <= (rhsNum as number))) result = false; }
          }
        } else if (lhs.startsWith('world_flags.')) {
          const flag = lhs.replace('world_flags.', '');
          const val = world.getFlag(flag);
          const target = rhsBool !== undefined ? rhsBool : rhsNum;
          console.log(`      -> Checking flag "${flag}": val=${val}, target=${target}`);
          if (op === '==') { if (val !== target) result = false; }
          if (op === '>') { if (!(Number(val) > (rhsNum as number))) result = false; }
          if (op === '<') { if (!(Number(val) < (rhsNum as number))) result = false; }
          if (op === '>=') { if (!(Number(val) >= (rhsNum as number))) result = false; }
          if (op === '<=') { if (!(Number(val) <= (rhsNum as number))) result = false; }
        } else if (lhs === 'time.is_day') {
          const hour = timeStore.hour;
          const isDay = hour >= 6 && hour < 18;
          if (op === '==') { if (isDay !== (rhsBool as boolean)) result = false; }
        } else if (lhs === 'time.is_night') {
          const hour = timeStore.hour;
          const isNight = hour < 6 || hour >= 18;
          if (op === '==') { if (isNight !== (rhsBool as boolean)) result = false; }
        } else if (lhs === 'time.hour_lt') {
          const hour = timeStore.hour;
          if (!(hour < (rhsNum as number))) result = false;
        } else if (lhs === 'time.hour_gte') {
          const hour = timeStore.hour;
          if (!(hour >= (rhsNum as number))) result = false;
        } else if (lhs === 'time.weekday') {
          const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const firstDow = ((timeStore.month - 1) * 30) % 7;
          const weekday = (firstDow + timeStore.dayOfMonth - 1) % 7;
          const current = names[weekday];
          if (current !== rhsRaw) result = false;
        } else if (lhs.startsWith('relationship.')) {
          const npcId = lhs.replace('relationship.', '');
          const val = diary.relationships[npcId]?.friendship?.value ?? 0;
          console.log(`      -> Checking relationship "${npcId}": val=${val}, target=${rhsNum}`);
          if (op === '==') { if (val !== (rhsNum as number)) result = false; }
          if (op === '>') { if (!(val > (rhsNum as number))) result = false; }
          if (op === '<') { if (!(val < (rhsNum as number))) result = false; }
          if (op === '>=') { if (!(val >= (rhsNum as number))) result = false; }
          if (op === '<=') { if (!(val <= (rhsNum as number))) result = false; }
        } else if (lhs.startsWith('job.')) {
           const parts = lhs.split('.'); // e.g. ['job', 'job_dockhand', 'active']
           const jobId = parts[1];
           const property = parts[2];
           let val: boolean = false;
           
           if (property === 'fired') {
             val = !!jobStore.firedJobs[jobId];
           } else {
             // Default to active check if not specified or 'active'
             val = jobStore.activeJob?.jobId === jobId;
           }
           
           console.log(`      -> Checking job "${jobId}" property "${property}": val=${val}, target=${rhsBool}`);
           if (op === '==') { if (val !== (rhsBool as boolean)) result = false; }
        } else if (lhs.startsWith('inventory.')) {
          const itemId = lhs.replace('inventory.', '');
          const qty = inventory.getItemQuantity(itemId);
          if (op === '==') { if (qty !== (rhsNum as number)) result = false; }
          if (op === '>') { if (!(qty > (rhsNum as number))) result = false; }
          if (op === '<') { if (!(qty < (rhsNum as number))) result = false; }
          if (op === '>=') { if (!(qty >= (rhsNum as number))) result = false; }
          if (op === '<=') { if (!(qty <= (rhsNum as number))) result = false; }
        } else {
           console.warn(`[DialogueService] Unrecognized condition part: "${lhs}"`);
           // Fail closed for unknown conditions to prevent "ghost buttons"
           return false; 
        }

        if (!result) {
          console.log(`    -> Part FAILED. Excluding choice.`);
          return false;
        } else {
          console.log(`    -> Part PASSED.`);
        }
      }
      console.log(`  -> All parts passed. Keeping choice.`);
      return true;
    });
    return { ...node, player_choices: filtered };
  }

  static startDialogue(npcId: string): DialogueNode | null {
    // Determine known state before updating, to support first-time greeting behavior
    const worldStateStore = useWorldStateStore.getState();
    const wasKnown = worldStateStore.knownNpcs.includes(npcId);
    console.log('[DialogueService][start] npcId=', npcId, 'wasKnown=', wasKnown);
    if (!wasKnown) {
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
      if (npcId === 'npc_kyle') dialogueId = 'kyle_intro';
    }

    const currentEventId = useUIStore.getState().currentEventId;
    if (npcId === 'npc_kyle' && currentEventId === 'kyle_smuggler_alert') {
      dialogueId = 'kyle_smuggler_alert';
    }

    if (npcId === 'npc_finn' && useWorldStateStore.getState().getFlag('finn_debt_intro_pending')) {
      dialogueId = 'finn_debt_intro';
    }

    // Check if Roberta's quest is active or completed
    if (npcId === 'npc_roberta') {
      const journalStore = useJournalStore.getState();
      const robertaQuest = journalStore.quests['roberta_planks_for_the_past'];
      if (robertaQuest && robertaQuest.active && !robertaQuest.completed) {
        dialogueId = 'roberta_planks_active';
      } else if (robertaQuest && robertaQuest.completed) {
        dialogueId = 'roberta_planks_completed';
      }
    }

    if (npcId === 'npc_boric') {
      const greetedFlagBoric = 'greeted_npc_boric';
      if (!useWorldStateStore.getState().getFlag(greetedFlagBoric)) {
        dialogueId = 'boric_intro';
      }
    }

    const dialogueEntry = typedDialogueData[dialogueId];

    if (!dialogueEntry) {
      console.error('Dialogue not found:', dialogueId);
      return null;
    }

    this.currentDialogueId = dialogueId;
    this.currentNodeId = '0';
    const firstNode = dialogueEntry.nodes['0'];
    const greetedFlag = `greeted_${npcId}`;
    const shouldGreet = !useWorldStateStore.getState().getFlag(greetedFlag);
    console.log('[DialogueService][start] selected dialogueId=', dialogueId, 'shouldGreet=', shouldGreet);
    if (shouldGreet) {
      useWorldStateStore.getState().setFlag(greetedFlag, true);
    }
    const npcName = typedNpcsData[npcId]?.name || 'Unknown';
    const effectiveFirstNode = (() => {
      if (npcId === 'npc_boric') return firstNode; // Use custom intro/default nodes without auto-greeting
      return shouldGreet ? { ...firstNode, npc_text: `Hello. I'm ${npcName}. ${firstNode.npc_text}` } : firstNode;
    })();
    // Initial NPC line prepared
    this.dialogueHistory = [{ speaker: 'npc', text: effectiveFirstNode.npc_text }];
    return DialogueService.applyConditionsToNode(effectiveFirstNode);
  }

  static selectResponse(responseIndex: number): DialogueNode | null {
    if (!this.currentDialogueId) return null;

    const currentDialogue = typedDialogueData[this.currentDialogueId as keyof typeof typedDialogueData];
    if (!currentDialogue) return null;

    const rawNode = currentDialogue.nodes[this.currentNodeId as keyof typeof currentDialogue.nodes];
    if (!rawNode) return null;

    // Apply conditions to ensure we match the index to the filtered list the user saw
    const filteredNode = DialogueService.applyConditionsToNode(rawNode);

    if (!filteredNode.player_choices || !filteredNode.player_choices[responseIndex]) {
      return null;
    }

    const response = filteredNode.player_choices[responseIndex];

    if (response.action) {
      const actionStr = response.action as string;
      this.executeAction(actionStr);
    }

    // Add to history
    this.dialogueHistory.push({ speaker: 'player', text: response.text });

    // Handle next dialogue
    if (response.next_node) {
      const nextNode = currentDialogue.nodes[response.next_node as keyof typeof currentDialogue.nodes];
      if (nextNode) {
        this.currentNodeId = response.next_node;
        this.dialogueHistory.push({ speaker: 'npc', text: nextNode.npc_text });
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

    const node = dialogueEntry.nodes[this.currentNodeId as keyof typeof dialogueEntry.nodes] || null;
    return node ? DialogueService.applyConditionsToNode(node) : null;
  }

  static getDialogueHistory(): ConversationEntry[] {
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
          // For intro quest, keep all objectives visible without auto-completing the first stage
          if (questId !== 'luke_tutorial') {
            // Move to stage 1 after acceptance (talk stage completed)
            useJournalStore.getState().setQuestStage(questId, 1);
          }
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
              this.dialogueHistory.push(denyNode.npc_text);
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
            useWorldStateStore.getState().setCooldown('finn_debt_deadline_start', day);
          } catch {}
        }
        break;

      case 'collect_debt_from':
        {
          const targetNpcId = params[0];
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
          useCharacterStore.getState().addCurrency('silver', 10);
          world.setFlag(flag, true);
          try { useJournalStore.getState().advanceQuestStage('finn_debt_collection'); } catch {}
          diaryStore.addInteraction('Collected 10 silvers from ' + (typedNpcsData[targetNpcId]?.name || targetNpcId) + '.');
        }
        break;

      case 'turn_in_debt':
        {
          const requiredSilvers = Number(params[0] || '30');
          const world = useWorldStateStore.getState();
          const allCollected = world.getFlag('debt_paid_by_ben') && world.getFlag('debt_paid_by_beryl') && world.getFlag('debt_paid_by_elara');
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
          const allCollected = world.getFlag('debt_paid_by_ben') && world.getFlag('debt_paid_by_beryl') && world.getFlag('debt_paid_by_elara');
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

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
import { benCheatEventSlides, rebelRaidIntroSlides, evilEndingSlides, hybridEndingSlides, whitefangFinnKillSlides } from '../data/events';
import type { ConversationEntry } from '../types';
import { GameManagerService } from './GameManagerService';
import { ConditionEvaluator } from './ConditionEvaluator';
import { getMaxSocialEnergy } from '../utils/socialEnergy';
import { resolveSocialAction, type SocialActionType, type SocialStyle } from '../utils/socialResolver';
import { getSocialNpcConfig } from '../utils/socialNpcConfig';
import {
  socialInteractionTemplates,
  socialNpcInteractionConfigs,
  type SocialInteractionCategory,
  type SocialInteractionTemplate,
} from '../data/dialogue/socialInteractions';

interface DialogueNode {
  npc_text: string;
  player_choices?: {
    text: string;
    player_text?: string;
    player_intent?: string;
    generated_interaction_key?: string;
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
  interaction_roots?: Partial<Record<'ask' | 'friendly' | 'flirt' | 'coerce' | 'quest', string>>;
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

type DialogueMenuKind = 'entry' | 'social_root' | 'category_root' | null;
type DialogueNodeRole = 'entry' | 'social_root' | 'category_root' | 'content' | 'result';

interface DialogueRuntimeState {
  dialogueId: string | null;
  npcId: string | null;
  currentNodeId: string;
  entryNodeId: string | null;
  currentCategoryRootId: string | null;
  currentMenuKind: DialogueMenuKind;
  shouldLeaveFromSocialRoot: boolean;
  lastSocialOutcome: 'fail' | 'weak' | 'strong' | null;
  dialogueHistory: ConversationEntry[];
  generatedNodes: Record<string, DialogueNode>;
}

export class DialogueService {
  private static state: DialogueRuntimeState = {
    dialogueId: null,
    npcId: null,
    currentNodeId: '0',
    entryNodeId: null,
    currentCategoryRootId: null,
    currentMenuKind: null,
    shouldLeaveFromSocialRoot: false,
    lastSocialOutcome: null,
    dialogueHistory: [],
    generatedNodes: {},
  };
  private static readonly SOCIAL_ROOT_NODE_ID = '__social_root__';
  private static readonly SOCIAL_RETURN_NODE_ID = '__social_return__';
  private static socialIntentLineIndices: Record<string, number> = {};

  private static resetRuntimeState(): void {
    this.state = {
      dialogueId: null,
      npcId: null,
      currentNodeId: '0',
      entryNodeId: null,
      currentCategoryRootId: null,
      currentMenuKind: null,
      shouldLeaveFromSocialRoot: false,
      lastSocialOutcome: null,
      dialogueHistory: [],
      generatedNodes: {},
    };
  }

  private static stripChoiceDecorations(text: string): string {
    return text
      .replace(/\s+\(\d+\s+Social\)$/, '')
      .replace(/\s+\(No more today\)$/, '')
      .replace(/\s+\(Need\s+\d+\s+Friendship\)$/, '');
  }

  private static getNextPooledLine(poolKey: string, pool?: string[]): string | null {
    if (!pool || pool.length === 0) {
      return null;
    }

    const currentIndex = this.socialIntentLineIndices[poolKey] ?? 0;
    const line = pool[currentIndex % pool.length];
    this.socialIntentLineIndices[poolKey] = (currentIndex + 1) % pool.length;
    return line;
  }

  private static getCategoryForRoot(dialogueEntry: DialogueEntry, nodeId: string): SocialInteractionCategory | null {
    const interactionRoots = dialogueEntry.interaction_roots || {};
    const category = Object.entries(interactionRoots).find(([, rootNodeId]) => rootNodeId === nodeId)?.[0];
    if (category === 'friendly' || category === 'flirt' || category === 'coerce') {
      return category;
    }
    return null;
  }

  private static getMergedInteractionTemplate(npcId: string, interactionKey: string): SocialInteractionTemplate | null {
    const baseTemplate = socialInteractionTemplates[interactionKey];
    if (!baseTemplate) {
      return null;
    }

    const override = socialNpcInteractionConfigs[npcId]?.interactionOverrides?.[interactionKey];
    if (!override) {
      return baseTemplate;
    }

    return {
      ...baseTemplate,
      label: override.label ?? baseTemplate.label,
      playerLines: override.playerLines ?? baseTemplate.playerLines,
      socialCost: override.socialCost ?? baseTemplate.socialCost,
      defaultNpcResponses: {
        strong: override.npcResponses?.strong ?? baseTemplate.defaultNpcResponses.strong,
        weak: override.npcResponses?.weak ?? baseTemplate.defaultNpcResponses.weak,
        fail: override.npcResponses?.fail ?? baseTemplate.defaultNpcResponses.fail,
      },
    };
  }

  private static buildGenericInteractionCategoryNode(dialogueEntry: DialogueEntry, nodeId: string): DialogueNode | null {
    const npcId = this.state.npcId;
    if (!npcId) return null;

    const category = this.getCategoryForRoot(dialogueEntry, nodeId);
    if (!category) return null;

    const interactionKeys = socialNpcInteractionConfigs[npcId]?.availableInteractions?.[category];
    if (!interactionKeys || interactionKeys.length === 0) {
      return null;
    }

    const baseNode = dialogueEntry.nodes[nodeId];
    const player_choices = interactionKeys
      .map((interactionKey) => this.getMergedInteractionTemplate(npcId, interactionKey))
      .filter((template): template is SocialInteractionTemplate => Boolean(template))
      .map((template) => ({
        text: template.label,
        generated_interaction_key: template.key,
        social_cost: template.socialCost,
        action: `social_action:${npcId}:${template.socialType}:${template.socialStyle}`,
      }));

    player_choices.push({
      text: 'Back.',
      next_node: this.SOCIAL_RETURN_NODE_ID,
    });

    return {
      npc_text: baseNode?.npc_text || 'What do you want to do?',
      player_choices,
    };
  }

  private static buildGeneratedResultNode(nodeId: string): DialogueNode | null {
    return this.state.generatedNodes[nodeId] || null;
  }

  private static createGeneratedResultNode(npcText: string, returnNodeId: string): string {
    const nodeId = `__generated_social_result__:${Date.now()}:${Object.keys(this.state.generatedNodes).length}`;
    this.state.generatedNodes[nodeId] = {
      npc_text: npcText,
      player_choices: [
        {
          text: 'Back.',
          next_node: returnNodeId,
        },
      ],
    };
    return nodeId;
  }

  private static resolveGenericInteractionPlayerLine(template: SocialInteractionTemplate): string {
    return this.getNextPooledLine(`player:${template.key}`, template.playerLines) || template.label;
  }

  private static resolveGenericInteractionNpcResponse(
    npcId: string,
    template: SocialInteractionTemplate,
    outcome: 'strong' | 'weak' | 'fail'
  ): string {
    const merged = this.getMergedInteractionTemplate(npcId, template.key) || template;
    const npcConfig = getSocialNpcConfig(npcId);

    for (const personality of npcConfig.personality) {
      const personalityPool = merged.personalityResponses?.[personality]?.[outcome];
      const personalityLine = this.getNextPooledLine(`npc:${npcId}:${template.key}:personality:${personality}:${outcome}`, personalityPool);
      if (personalityLine) {
        return personalityLine;
      }
    }

    const classPool = merged.classResponses?.[npcConfig.socialClass]?.[outcome];
    const classLine = this.getNextPooledLine(`npc:${npcId}:${template.key}:class:${npcConfig.socialClass}:${outcome}`, classPool);
    if (classLine) {
      return classLine;
    }

    return this.getNextPooledLine(`npc:${npcId}:${template.key}:default:${outcome}`, merged.defaultNpcResponses[outcome])
      || merged.defaultNpcResponses[outcome][0]
      || 'They give you a hard-to-read look.';
  }

  private static resolveGenericSocialInteraction(interactionKey: string): string | null {
    const npcId = this.state.npcId;
    if (!npcId) return null;

    const template = this.getMergedInteractionTemplate(npcId, interactionKey);
    if (!template) return null;

    const playerLine = this.resolveGenericInteractionPlayerLine(template);
    this.state.dialogueHistory.push({ speaker: 'player', text: playerLine });

    if (template.socialCost) {
      useCharacterStore.getState().updateStats({ socialEnergy: -template.socialCost });
    }

    if (this.hasNpcReachedDailySocialLimit(npcId)) {
      this.state.lastSocialOutcome = 'fail';
      useDiaryStore.getState().addInteraction(`${npcId}: They have had enough of you for today.`);
    } else {
      const result = resolveSocialAction({
        npcId,
        type: template.socialType,
        style: template.socialStyle,
        persuasionLevel: useSkillStore.getState().getSkillLevel('persuasion'),
        coercionLevel: useSkillStore.getState().getSkillLevel('coercion'),
      });

      this.incrementNpcDailySocialUses(npcId);
      this.state.lastSocialOutcome = result.outcome;
      useDiaryStore.getState().updateRelationship(npcId, result.relationshipChanges);
      useSkillStore.getState().addXp(result.xpSkill, result.xpAmount);
      useDiaryStore.getState().addInteraction(`${npcId}: ${result.diaryText}`);
    }

    const outcome = this.state.lastSocialOutcome || 'fail';
    const npcResponse = this.resolveGenericInteractionNpcResponse(npcId, template, outcome);
    const returnNodeId = this.state.currentCategoryRootId || this.SOCIAL_ROOT_NODE_ID;
    return this.createGeneratedResultNode(npcResponse, returnNodeId);
  }

  private static resolvePlayerHistoryText(choice: {
    text: string;
    player_text?: string;
    player_intent?: string;
    action?: string;
  }): string {
    if (choice.player_text?.trim()) {
      return choice.player_text.trim();
    }

    const intent = choice.player_intent;
    if (intent) {
      const template = socialInteractionTemplates[intent];
      const pooledLine = this.getNextPooledLine(`player:${intent}`, template?.playerLines);
      if (pooledLine) {
        return pooledLine;
      }
    }

    return this.stripChoiceDecorations(choice.text);
  }

  private static setCurrentNode(nodeId: string, dialogueEntry: DialogueEntry): void {
    this.state.currentNodeId = nodeId;
    const role = this.getNodeRole(dialogueEntry, nodeId);

    if (role === 'entry') {
      this.state.currentMenuKind = 'entry';
      this.state.currentCategoryRootId = null;
      return;
    }

    if (role === 'social_root') {
      this.state.currentMenuKind = 'social_root';
      return;
    }

    if (role === 'category_root') {
      this.state.currentMenuKind = 'category_root';
      this.state.currentCategoryRootId = nodeId;
      return;
    }

    this.state.currentMenuKind = null;
  }

  private static getSocialCategoryLabel(category: keyof NonNullable<DialogueEntry['interaction_roots']>): string {
    switch (category) {
      case 'ask': return 'Ask';
      case 'friendly': return 'Friendly';
      case 'flirt': return 'Flirt';
      case 'coerce': return 'Coerce';
      case 'quest': return 'Quest';
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

    if (this.state.shouldLeaveFromSocialRoot) {
      player_choices.push({
        text: 'Leave',
        closes_dialogue: true,
      });
    } else {
      player_choices.push({
        text: 'Back',
        next_node: this.SOCIAL_RETURN_NODE_ID,
      });
    }

    return {
      npc_text: 'How do you want to approach this conversation?',
      player_choices,
    };
  }

  private static hasVisibleSocialRootOptions(dialogueEntry: DialogueEntry): boolean {
    const socialRoot = this.buildSocialRootNode(dialogueEntry);
    return (socialRoot.player_choices || []).some((choice) => !this.isNavigationChoice(choice) && !choice.disabled);
  }

  private static reorderOpeningNodeChoices(dialogueEntry: DialogueEntry, node: DialogueNode): DialogueNode {
    const choices = (node.player_choices || []).filter((choice) => {
      if (choice.next_node !== this.SOCIAL_ROOT_NODE_ID) return true;
      return this.hasVisibleSocialRootOptions(dialogueEntry);
    });
    if (choices.length <= 1) {
      return { ...node, player_choices: choices };
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

    const generatedNode = this.buildGeneratedResultNode(nodeId);
    if (generatedNode) {
      return generatedNode;
    }

    const generatedCategoryNode = this.buildGenericInteractionCategoryNode(dialogueEntry, nodeId);
    if (generatedCategoryNode) {
      return generatedCategoryNode;
    }

    const node = dialogueEntry.nodes[nodeId] || null;
    if (!node) {
      return null;
    }

    if (nodeId === dialogueEntry.first_meet_node || nodeId === dialogueEntry.repeat_meet_node) {
      const reorderedNode = this.reorderOpeningNodeChoices(dialogueEntry, node);
      return reorderedNode;
    }

    if (nodeId === '0') {
      return this.reorderOpeningNodeChoices(dialogueEntry, node);
    }

    return node;
  }

  private static getNodeRole(dialogueEntry: DialogueEntry, nodeId: string): DialogueNodeRole {
    if (nodeId === this.SOCIAL_ROOT_NODE_ID) {
      return 'social_root';
    }

    if (this.state.generatedNodes[nodeId]) {
      return 'result';
    }

    if (nodeId === dialogueEntry.first_meet_node || nodeId === dialogueEntry.repeat_meet_node || nodeId === '0') {
      return 'entry';
    }

    const interactionRoots = Object.values(dialogueEntry.interaction_roots || {});
    if (interactionRoots.includes(nodeId as any)) {
      return 'category_root';
    }

    const node = dialogueEntry.nodes[nodeId];
    if (node?.player_choices?.length === 1 && node.player_choices[0]?.closes_dialogue) {
      return 'result';
    }

    return 'content';
  }

  private static isMenuNodeId(dialogueEntry: DialogueEntry, nodeId: string): boolean {
    const role = this.getNodeRole(dialogueEntry, nodeId);
    return role === 'social_root' || role === 'category_root';
  }

  private static getExplicitFirstMeetFlagName(npcId: string, dialogueEntry: DialogueEntry): string | null {
    if (!dialogueEntry.first_meet_node) {
      return null;
    }

    const expectedFlag = `${npcId.replace(/^npc_/, '')}_first_meet_done`;
    const flagNeedle = `set_flag:${expectedFlag}:true`;

    const usesFlag = Object.values(dialogueEntry.nodes).some((node) =>
      (node.player_choices || []).some((choice) => (choice.action || '').includes(flagNeedle))
    );

    return usesFlag ? expectedFlag : null;
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
    player_text?: string;
    player_intent?: string;
    next_node?: string;
    closes_dialogue?: boolean;
    action?: string;
  }): boolean {
    const currentDialogue = this.state.dialogueId ? typedDialogueData[this.state.dialogueId as keyof typeof typedDialogueData] : null;
    if (currentDialogue && this.isMenuNodeId(currentDialogue, this.state.currentNodeId)) {
      const isSocialRootSelection = this.state.currentNodeId === this.SOCIAL_ROOT_NODE_ID;
      if (isSocialRootSelection) {
        return false;
      }
    }

    if (currentDialogue && choice.next_node) {
      const nextNode = this.getNode(currentDialogue, choice.next_node);
      if (nextNode && !nextNode.npc_text.trim()) {
        return false;
      }
    }

    return !this.isNavigationChoice(choice);
  }

  private static appendNpcHistory(text?: string): void {
    if (!text) return;
    const lastEntry = this.state.dialogueHistory[this.state.dialogueHistory.length - 1];
    if (lastEntry?.speaker === 'npc' && lastEntry.text === text) {
      return;
    }
    this.state.dialogueHistory.push({ speaker: 'npc', text });
  }

  private static shouldAppendNpcLineForNode(dialogueEntry: DialogueEntry, nodeId: string): boolean {
    const role = this.getNodeRole(dialogueEntry, nodeId);

    if (role === 'social_root' || role === 'category_root') {
      return false;
    }

    if (role === 'entry') {
      return this.state.dialogueHistory.length === 0;
    }

    return true;
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

    const isSkippableOpener =
      nodeId === dialogueEntry.repeat_meet_node ||
      (nodeId === '0' && nodeId !== dialogueEntry.first_meet_node);

    if (!isSkippableOpener) {
      return false;
    }

    const choices = (node.player_choices || []).filter((choice) => !choice.condition || ConditionEvaluator.evaluate(choice.condition));
    const talkChoices = choices.filter((choice) => choice.next_node === this.SOCIAL_ROOT_NODE_ID);
    const pureExitChoices = choices.filter((choice) =>
      (choice.closes_dialogue && !(choice.action || '').startsWith('open_shop:')) ||
      choice.next_node === this.SOCIAL_RETURN_NODE_ID ||
      this.isNavigationChoice(choice)
    );
    const otherChoices = choices.filter((choice) => !talkChoices.includes(choice) && !pureExitChoices.includes(choice));

    return talkChoices.length > 0 && otherChoices.length === 0;
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
    const currentNpcId = this.state.npcId;

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
      useDiaryStore.getState().addInteraction(`${npcId}: Met ${npcName} for the first time.`);
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
      const shenhaicLockedRetainers = new Set(['npc_lin_shao', 'npc_wei_taren', 'npc_qiao_ren']);
      if (
        shenhaicLockedRetainers.has(npcId) &&
        !useWorldStateStore.getState().getFlag('knows_shenhaic_basic') &&
        useCharacterStore.getState().languages?.shenhaic !== 'Basic' &&
        useCharacterStore.getState().languages?.shenhaic !== 'Fluent' &&
        useCharacterStore.getState().languages?.shenhaic !== 'Native'
      ) {
        dialogueId = 'shenhaic_barrier';
      }

      const currentEventId = useUIStore.getState().currentEventId;
      if (npcId === 'npc_kyle' && currentEventId === 'kyle_smuggler_alert') {
        dialogueId = 'kyle_smuggler_alert';
      }

      if (npcId === 'npc_finn' && useWorldStateStore.getState().getFlag('finn_debt_intro_pending')) {
        dialogueId = 'finn_debt_intro';
      }

      if (npcId === 'npc_beryl') {
        const world = useWorldStateStore.getState();
        const currentLocationId = useLocationStore.getState().currentLocationId;
        if (currentLocationId === 'salty_mug') {
          dialogueId = 'beryl_tavern';
        } else if (world.getFlag('finn_debt_collection_active')) {
          dialogueId = 'beryl_debt_approach';
        }
      }

      if (npcId === 'npc_ben' && useWorldStateStore.getState().getFlag('ben_cheat_collect_pending')) {
        dialogueId = 'ben_cheat_collect';
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

    this.resetRuntimeState();
    this.state.dialogueId = dialogueId;
    this.state.npcId = npcId;

    const explicitFirstMeetFlag = this.getExplicitFirstMeetFlagName(npcId, dialogueEntry);
    const firstMeetPending = explicitFirstMeetFlag
      ? !useWorldStateStore.getState().getFlag(explicitFirstMeetFlag)
      : !wasKnown;

    const startingNodeId = (() => {
      if (!overrideDialogueId && firstMeetPending && dialogueEntry.first_meet_node && dialogueEntry.nodes[dialogueEntry.first_meet_node]) {
        return dialogueEntry.first_meet_node;
      }

      if (!overrideDialogueId && wasKnown && dialogueEntry.repeat_meet_node && dialogueEntry.nodes[dialogueEntry.repeat_meet_node]) {
        return dialogueEntry.repeat_meet_node;
      }

      if (dialogueEntry.nodes['0']) {
        return '0';
      }

      if (dialogueEntry.interaction_roots) {
        return this.SOCIAL_ROOT_NODE_ID;
      }

      return '0';
    })();

    this.state.entryNodeId = startingNodeId === this.SOCIAL_ROOT_NODE_ID
      ? (dialogueEntry.repeat_meet_node || dialogueEntry.first_meet_node || (dialogueEntry.nodes['0'] ? '0' : null))
      : startingNodeId;
    this.setCurrentNode(startingNodeId, dialogueEntry);
    const firstNode = this.getNode(dialogueEntry, startingNodeId);

    if (!firstNode) {
      console.error('Starting dialogue node not found:', dialogueId, startingNodeId);
      return null;
    }

    if (this.shouldSkipOpeningNode(dialogueEntry, startingNodeId, firstNode)) {
      const visibleChoices = (firstNode.player_choices || []).filter((choice) => !choice.disabled);
      const hasExplicitExit = visibleChoices.some((choice) => choice.closes_dialogue || this.isNavigationChoice(choice));
      this.state.shouldLeaveFromSocialRoot = hasExplicitExit || visibleChoices.every((choice) => choice.next_node === this.SOCIAL_ROOT_NODE_ID);
      this.state.dialogueHistory = [];
      if (firstNode.npc_text?.trim()) {
        this.appendNpcHistory(firstNode.npc_text);
      }
      this.setCurrentNode(this.SOCIAL_ROOT_NODE_ID, dialogueEntry);
      const rootNode = this.getNode(dialogueEntry, this.SOCIAL_ROOT_NODE_ID);
      if (!rootNode) {
        return null;
      }
      return DialogueService.applyConditionsToNode(rootNode);
    }

    this.state.dialogueHistory = [];
    if (this.shouldAppendNpcLineForNode(dialogueEntry, startingNodeId)) {
      this.appendNpcHistory(firstNode.npc_text);
    }
    return DialogueService.applyConditionsToNode(firstNode);
  }

  static selectResponse(responseIndex: number): DialogueNode | null {
    if (!this.state.dialogueId) return null;

    const currentDialogue = typedDialogueData[this.state.dialogueId as keyof typeof typedDialogueData];
    if (!currentDialogue) return null;

    const rawNode = this.getNode(currentDialogue, this.state.currentNodeId);
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

    if (response.generated_interaction_key) {
      const generatedNodeId = this.resolveGenericSocialInteraction(response.generated_interaction_key);
      if (generatedNodeId) {
        const nextNode = this.getNode(currentDialogue, generatedNodeId);
        if (!nextNode) {
          return this.getCurrentDialogue();
        }
        this.setCurrentNode(generatedNodeId, currentDialogue);
        this.appendNpcHistory(nextNode.npc_text);
        return DialogueService.applyConditionsToNode(nextNode);
      }
    }

    const shouldLogChoice = this.shouldLogChoice(response);
    if (shouldLogChoice) {
      this.state.dialogueHistory.push({ speaker: 'player', text: this.resolvePlayerHistoryText(response) });
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
                this.setCurrentNode(failNodeId, currentDialogue);
                const nextNode = currentDialogue.nodes[failNodeId];
                if (this.shouldAppendNpcLineForNode(currentDialogue, failNodeId)) {
                  this.appendNpcHistory(nextNode.npc_text);
                }
                return DialogueService.applyConditionsToNode(nextNode);
            } else {
                 this.appendNpcHistory("[Skill Check Failed] (You are not skilled enough to do that.)");
                 return this.getCurrentDialogue();
            }
        }
    }

    // Execute actions
    if (response.action) {
      const actionStr = response.action as string;
      this.executeAction(actionStr);
    }

    // Handle next dialogue
    let nextNodeId = response.next_node;
    if (response.social_result_nodes && this.state.lastSocialOutcome) {
      nextNodeId = response.social_result_nodes[this.state.lastSocialOutcome] || nextNodeId;
    }

    let resolvedToClose = false;
    if (nextNodeId === this.SOCIAL_RETURN_NODE_ID) {
      if (this.state.currentMenuKind === 'category_root') {
        nextNodeId = this.hasVisibleSocialRootOptions(currentDialogue)
          ? this.SOCIAL_ROOT_NODE_ID
          : (this.state.entryNodeId || undefined);
      } else if (this.state.currentMenuKind === 'social_root') {
        if (this.state.shouldLeaveFromSocialRoot) {
          nextNodeId = undefined;
          resolvedToClose = true;
        } else {
          nextNodeId = this.state.entryNodeId || undefined;
        }
      } else {
        nextNodeId = this.state.currentCategoryRootId || this.state.entryNodeId || undefined;
      }
    }

    if (nextNodeId) {
      const nextNode = this.getNode(currentDialogue, nextNodeId);
      if (nextNode) {
        this.setCurrentNode(nextNodeId, currentDialogue);
        if (this.shouldAppendNpcLineForNode(currentDialogue, nextNodeId)) {
          this.appendNpcHistory(nextNode.npc_text);
        }
        return DialogueService.applyConditionsToNode(nextNode);
      }
    } else if (response.closes_dialogue || resolvedToClose) {
      this.endDialogue();
      return null;
    }

    // If action mutated the dialogue (e.g., switched current node), return the current node
    return this.getCurrentDialogue();
  }

  static getCurrentDialogue(): DialogueNode | null {
    if (!this.state.dialogueId) return null;

    const dialogueEntry = typedDialogueData[this.state.dialogueId as keyof typeof typedDialogueData];
    if (!dialogueEntry) return null;

    const node = this.getNode(dialogueEntry, this.state.currentNodeId);
    return node ? DialogueService.applyConditionsToNode(node) : null;
  }

  static isCurrentNodeMenu(): boolean {
    if (!this.state.dialogueId) return false;

    const dialogueEntry = typedDialogueData[this.state.dialogueId as keyof typeof typedDialogueData];
    if (!dialogueEntry) return false;

    return this.isMenuNodeId(dialogueEntry, this.state.currentNodeId);
  }

  static getCurrentMenuPrompt(): string | null {
    if (!this.state.dialogueId) return null;

    const dialogueEntry = typedDialogueData[this.state.dialogueId as keyof typeof typedDialogueData];
    if (!dialogueEntry || !this.isMenuNodeId(dialogueEntry, this.state.currentNodeId)) {
      return null;
    }

    if (this.state.currentNodeId === this.SOCIAL_ROOT_NODE_ID) {
      return 'How do you want to approach this conversation?';
    }

    const interactionRoots = dialogueEntry.interaction_roots || {};
    const category = Object.entries(interactionRoots).find(([, nodeId]) => nodeId === this.state.currentNodeId)?.[0];

    switch (category) {
      case 'ask':
        return 'What do you want to ask?';
      case 'friendly':
        return 'How do you want to approach this?';
      case 'flirt':
        return 'How do you want to flirt?';
      case 'coerce':
        return 'How do you want to pressure them?';
      case 'quest':
        return 'What do you want to discuss?';
      default:
        return 'What do you want to do?';
    }
  }

  static getDialogueHistory(): ConversationEntry[] {
    return [...this.state.dialogueHistory];
  }

  static endDialogue(): void {
    if (useWorldStateStore.getState().getFlag('ben_cheat_collect_pending')) {
      useWorldStateStore.getState().setFlag('ben_cheat_collect_pending', false);
    }
    this.resetRuntimeState();
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
          useWorldStateStore.getState().setFlag('finn_loyalist_branch_complete', true);
          useWorldStateStore.getState().setFlag('finn_debt_collection_active', false);
          useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
          useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
          useUIStore.getState().setEventSlides(evilEndingSlides);
          useUIStore.getState().setScreen('event');
          this.endDialogue();
        } else if (eventId === 'finn_hybrid_end') {
          useWorldStateStore.getState().setFlag('finn_hybrid_branch_complete', true);
          useWorldStateStore.getState().setFlag('finn_debt_collection_active', false);
          useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
          useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
          useUIStore.getState().setEventSlides(hybridEndingSlides);
          useUIStore.getState().setScreen('event');
          this.endDialogue();
        } else if (eventId === 'whitefang_finn_end') {
          useWorldStateStore.getState().setFlag('finn_whitefang_branch_complete', true);
          useWorldStateStore.getState().setFlag('finn_dead', true);
          if (!useWorldStateStore.getState().getData('npc_finn_death_date')) {
            useWorldStateStore.getState().setData('npc_finn_death_date', useWorldTimeStore.getState().getFormattedDate());
          }
          useWorldStateStore.getState().setFlag('finn_resolved', true);
          useWorldStateStore.getState().setFlag('finn_debt_collection_active', false);
          useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
          useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
          useWorldStateStore.getState().setFlag('raid_ready', false);
          try { useJournalStore.getState().failQuest('finn_debt_collection'); } catch {}
          useUIStore.getState().setEventSlides(whitefangFinnKillSlides);
          useUIStore.getState().setCurrentEventId('whitefang_finn_end');
          useUIStore.getState().setScreen('event');
          this.endDialogue();
        } else {
          useUIStore.getState().setScreen('choiceEvent');
          this.endDialogue();
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
            const currentDialogue = this.state.dialogueId ? typedDialogueData[this.state.dialogueId as keyof typeof typedDialogueData] : null;
            if (currentDialogue && denyNodeId && currentDialogue.nodes[denyNodeId]) {
              const denyNode = currentDialogue.nodes[denyNodeId];
              this.setCurrentNode(denyNodeId, currentDialogue);
              this.state.dialogueHistory.push({ speaker: 'npc', text: denyNode.npc_text });
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
          diaryStore.addInteraction('npc_finn: Finn laid out the debt collection job.');
        }
        break;

      case 'start_debt_collection':
        {
          useWorldStateStore.getState().setFlag('finn_debt_collection_active', true);
          useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
          useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
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
          diaryStore.addInteraction(targetNpcId + ': Collected ' + amount + ' silvers.');

          try {
            const journal = useJournalStore.getState();
            const debtQuest = journal.quests['finn_debt_collection'];
            if (debtQuest?.active) {
              const allCollected =
                world.getFlag('debt_paid_by_ben') &&
                (world.getFlag('debt_paid_by_beryl') || world.getFlag('beryl_debt_forgiven')) &&
                world.getFlag('debt_paid_by_elara');

              journal.setQuestStage('finn_debt_collection', allCollected ? 4 : (debtQuest.currentStage || 1));
            }
          } catch {}
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
          world.setFlag('finn_timeout_ready', false);
          world.setFlag('finn_timeout_triggered', false);
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
          const currentDialogue = this.state.dialogueId ? typedDialogueData[this.state.dialogueId as keyof typeof typedDialogueData] : null;
          const showRebuke = () => {
            if (currentDialogue && rebukeNodeId && currentDialogue.nodes[rebukeNodeId]) {
              const node = currentDialogue.nodes[rebukeNodeId];
              this.setCurrentNode(rebukeNodeId, currentDialogue);
              this.state.dialogueHistory.push({ speaker: 'npc', text: node.npc_text });
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
          world.setFlag('finn_timeout_ready', false);
          world.setFlag('finn_timeout_triggered', false);
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
          } else if (target === 'arena_desperate_brawler') {
            GameManagerService.startArenaBrawl('desperate_brawler', {
              purseCopper: 12,
              victoryToast: 'You stay on your feet and leave the pit 12 copper richer.',
              defeatToast: 'The crowd laughs as you drag yourself up from the sawdust.',
            });
          } else if (target === 'arena_brawler') {
            GameManagerService.startArenaBrawl('brawler_pit', {
              purseCopper: 20,
              victoryToast: 'You grind out the win and pocket 20 copper from the ring.',
              defeatToast: 'The brawler folds you up and leaves you seeing stars.',
            });
          } else if (target === 'arena_pit_brawler') {
            GameManagerService.startArenaBrawl('pit_brawler', {
              purseCopper: 32,
              victoryToast: 'The pit goes quiet when you put the big man down. The purse is yours.',
              defeatToast: 'The pit brawler batters you senseless and takes the night with him.',
            });
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
            this.state.lastSocialOutcome = 'fail';
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
          this.state.lastSocialOutcome = result.outcome;
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

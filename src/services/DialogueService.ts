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
import { useLocationStore } from '../stores/useLocationStore';
import type { ConversationEntry } from '../types';
import { ConditionEvaluator } from './ConditionEvaluator';
import { resolveSocialAction, type SocialActionType, type SocialStyle } from '../utils/socialResolver';
import { getSocialNpcConfig } from '../utils/socialNpcConfig';
import { executeRegisteredAction } from './dialogueActions/registry';
import { handleTriggerEventAction } from './dialogueActions/triggerEvent';
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
    social_result_nodes?: Partial<Record<'fail' | 'weak' | 'strong' | 'neutral', string>>;
  }[];
}

interface DialogueEntry {
  first_meet_node?: string;
  repeat_meet_node?: string;
  interaction_roots?: Partial<Record<'ask' | 'friendly' | 'flirt' | 'coerce' | 'quest' | 'trade' | 'gift', string>>;
  trade_shop_id?: string;
  nodes: Record<string, DialogueNode>;
}

interface DialogueFile {
  [key: string]: DialogueEntry;
}

const typedDialogueData: DialogueFile = dialogueData;

interface Npc {
  name: string;
  home_location?: string;
  default_dialogue_id?: string;
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
  lastSocialOutcome: 'fail' | 'weak' | 'strong' | 'neutral' | null;
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
    const player_choices: NonNullable<DialogueNode['player_choices']> = interactionKeys
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
    outcome: 'strong' | 'weak' | 'fail' | 'neutral'
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

    const defaultPool = merged.defaultNpcResponses[outcome] || merged.defaultNpcResponses.fail;
    return this.getNextPooledLine(`npc:${npcId}:${template.key}:default:${outcome}`, defaultPool)
      || defaultPool?.[0]
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
      case 'flirt': return 'Romance';
      case 'coerce': return 'Coerce';
      case 'quest': return 'Quest';
      case 'gift': return 'Gift';
      default: return category;
    }
  }

  private static buildSocialRootNode(dialogueEntry: DialogueEntry): DialogueNode {
    const interactionRoots = dialogueEntry.interaction_roots || {};
    const orderedCategories: (keyof NonNullable<DialogueEntry['interaction_roots']>)[] = [
      'quest',
      'ask',
      'gift',
      'friendly',
      'flirt',
    ];

    const player_choices: NonNullable<DialogueNode['player_choices']> = orderedCategories
      .filter((category) => {
        if (category === 'flirt' && !this.canAccessFlirtCategory()) {
          return false;
        }

        const nodeId = interactionRoots[category];
        if (!nodeId) {
          return false;
        }

        const resolvedNode = this.getNode(dialogueEntry, nodeId);
        if (!resolvedNode) {
          return false;
        }

        const categoryNode = this.applyConditionsToNode(resolvedNode);
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

  private static canAccessFlirtCategory(): boolean {
    const npcId = this.state.npcId;
    if (!npcId) {
      return false;
    }

    const world = useWorldStateStore.getState();
    const npcFlagPrefix = npcId.replace(/^npc_/, '');
    return world.getFlag(`${npcFlagPrefix}_romance_unlocked`) || world.getFlag(`${npcFlagPrefix}_flirt_unlocked`);
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

    const explicitNode = dialogueEntry.nodes[nodeId] || null;
    if (explicitNode) {
      const explicitChoices = explicitNode.player_choices || [];
      const hasAuthoredChoices = explicitChoices.some((choice) => !this.isNavigationChoice(choice));
      if (hasAuthoredChoices) {
        if (nodeId === dialogueEntry.first_meet_node || nodeId === dialogueEntry.repeat_meet_node || nodeId === '0') {
          return this.reorderOpeningNodeChoices(dialogueEntry, explicitNode);
        }
        return explicitNode;
      }
    }

    const generatedCategoryNode = this.buildGenericInteractionCategoryNode(dialogueEntry, nodeId);
    if (generatedCategoryNode) {
      return generatedCategoryNode;
    }

    const node = explicitNode;
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
        const disabled = Boolean(choice.disabled) || socialCost > socialEnergy || dailyLimitReached;
        let text = socialCost > 0 ? `${choice.text} (${socialCost} Social)` : choice.text;

        if (dailyLimitReached) {
          text = `${text} (No more today)`;
        }

        return {
          ...choice,
          disabled,
          text,
        };
      });

    return { ...node, player_choices: filtered };
  }

  static startDialogue(npcId: string, overrideDialogueId?: string, overrideNodeId?: string): DialogueNode | null {
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
      const lacksShenhaic =
        !useWorldStateStore.getState().getFlag('knows_shenhaic_basic') &&
        useCharacterStore.getState().languages?.shenhaic !== 'Basic' &&
        useCharacterStore.getState().languages?.shenhaic !== 'Fluent' &&
        useCharacterStore.getState().languages?.shenhaic !== 'Native';

      const shenhaicLockedRetainers = new Set(['npc_lin_shao', 'npc_wei_taren', 'npc_qiao_ren']);
      if (shenhaicLockedRetainers.has(npcId) && lacksShenhaic) {
        dialogueId = 'shenhaic_barrier';
      }

      if (npcId === 'npc_shihan' && lacksShenhaic) {
        dialogueId = 'shihan_barrier';
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
      if (overrideNodeId && this.getNode(dialogueEntry, overrideNodeId)) {
        return overrideNodeId;
      }

      if (
        !overrideDialogueId &&
        npcId === 'npc_ronald' &&
        useJournalStore.getState().quests['ronald_wolf_pack']?.currentStage === 3
      ) {
        if (
          useWorldStateStore.getState().getFlag('wolf_puppy_adopted') &&
          dialogueEntry.nodes['ronald_quest_after_fight_puppy']
        ) {
          return 'ronald_quest_after_fight_puppy';
        }

        if (dialogueEntry.nodes['ronald_quest_after_fight_no_puppy']) {
          return 'ronald_quest_after_fight_no_puppy';
        }
      }

      if (
        !overrideDialogueId &&
        npcId === 'npc_roberta' &&
        useWorldStateStore.getState().getFlag('intro_spoke_roberta') &&
        !useWorldStateStore.getState().getFlag('roberta_first_meet_done') &&
        dialogueEntry.nodes['rb_intro_reunion']
      ) {
        return 'rb_intro_reunion';
      }

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
        return 'How do you want to approach the romance?';
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

    if (executeRegisteredAction(actionType, params, {
      diaryStore,
      worldState,
      journalStore,
      showDialogueNode: (nodeId: string) => {
        const currentDialogue = this.state.dialogueId ? typedDialogueData[this.state.dialogueId as keyof typeof typedDialogueData] : null;
        if (!currentDialogue || !nodeId || !currentDialogue.nodes[nodeId]) return false;
        const node = currentDialogue.nodes[nodeId];
        this.setCurrentNode(nodeId, currentDialogue);
        this.state.dialogueHistory.push({ speaker: 'npc', text: node.npc_text });
        return true;
      },
      endDialogue: () => this.endDialogue(),
      hasNpcReachedDailySocialLimit: (npcId: string) => this.hasNpcReachedDailySocialLimit(npcId),
      incrementNpcDailySocialUses: (npcId: string) => this.incrementNpcDailySocialUses(npcId),
      setLastSocialOutcome: (outcome) => { this.state.lastSocialOutcome = outcome; },
    })) {
      return;
    }

    if (actionType === 'trigger_event') {
      const eventId = params[0];
      handleTriggerEventAction(eventId, () => this.endDialogue());
      return;
    }

    console.warn('Unknown action type:', actionType);
  }
}

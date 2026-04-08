import { useCharacterStore } from '../../stores/useCharacterStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useUIStore } from '../../stores/useUIStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';
import { useSkillStore } from '../../stores/useSkillStore';
import { useDiaryStore } from '../../stores/useDiaryStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useJobStore } from '../../stores/useJobStore';
import { useLocationStore } from '../../stores/useLocationStore';
import npcsData from '../../data/npcs.json';
import questsData from '../../data/quests.json';
import type { DialogueActionContext, DialogueActionHandler } from './types';
import { resolveSocialAction, type SocialActionType, type SocialStyle } from '../../utils/socialResolver';
import { GameManagerService } from '../GameManagerService';

const setFlagHandler: DialogueActionHandler = (params) => {
  const flag = params[0];
  const valRaw = params[1];
  const val = valRaw === 'true' ? true : valRaw === 'false' ? false : Boolean(valRaw);
  useWorldStateStore.getState().setFlag(flag, val);
};

const addMoneyHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const amount = Number(params[0] || '0');
  const type = (params[1] || 'silver') as 'copper' | 'silver' | 'gold';
  useCharacterStore.getState().addCurrency(type, amount);
  diaryStore.addInteraction(`Received ${amount} ${type}.`);
};

const removeMoneyHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const amount = Number(params[0] || '0');
  const type = params[1] || 'silver';
  let paid = false;
  if (type === 'copper') paid = useCharacterStore.getState().removeCurrency(amount, 0, 0);
  else if (type === 'gold') paid = useCharacterStore.getState().removeCurrency(0, 0, amount);
  else paid = useCharacterStore.getState().removeCurrency(0, amount, 0);

  if (paid) diaryStore.addInteraction(`Paid ${amount} ${type}.`);
  else diaryStore.addInteraction(`Not enough money (${amount} ${type} required).`);
};

const passTimeHandler: DialogueActionHandler = (params) => {
  const minutes = Number(params[0] || '0');
  useWorldTimeStore.getState().passTime(minutes);
};

const addItemHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const itemId = params[0];
  const qty = params[1] ? Number(params[1]) : 1;
  useInventoryStore.getState().addItem(itemId, qty);
  diaryStore.addInteraction(`Received item: ${itemId}`);
};

const removeItemHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const itemId = params[0];
  const qty = params[1] ? Number(params[1]) : 1;
  useInventoryStore.getState().removeItem(itemId, qty);
  diaryStore.addInteraction(`Removed item: ${itemId}`);
};

const openShopHandler: DialogueActionHandler = (params) => {
  const shopId = params[0];
  useUIStore.getState().setShopId(shopId);
  useUIStore.getState().setScreen('trade');
};

const triggerConfirmationHandler: DialogueActionHandler = (params) => {
  const type = params[0];
  useUIStore.getState().setConfirmationType(type);
  useUIStore.getState().openModal('confirmation');
};

const addXpHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const skillId = params[0];
  const amount = Number(params[1] || '10');
  useSkillStore.getState().addXp(skillId, amount);
  diaryStore.addInteraction(`Gained ${amount} XP in ${skillId}`);
};

const updateRelationshipHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const npcId = params[0];
  const delta = Number(params[1] || '0');
  const stat = (params[2] || 'friendship') as 'friendship' | 'love' | 'fear' | 'obedience';
  useDiaryStore.getState().updateRelationship(npcId, { [stat]: delta });
  diaryStore.addInteraction(`Relationship changed with ${npcsData[npcId as keyof typeof npcsData]?.name || npcId}`);
};

const setRelationshipHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const npcId = params[0];
  const target = Number(params[1] || '0');
  const current = useDiaryStore.getState().relationships[npcId]?.friendship?.value || 0;
  const delta = target - current;
  useDiaryStore.getState().updateRelationship(npcId, { friendship: delta });
  diaryStore.addInteraction(`Relationship set for ${npcsData[npcId as keyof typeof npcsData]?.name || npcId}`);
};

const addKnownNpcHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const id = params[0];
  useWorldStateStore.getState().addKnownNpc(id);
  diaryStore.addInteraction(`Now know NPC: ${npcsData[id as keyof typeof npcsData]?.name || id}`);
};

const openRobertaUpgradesHandler: DialogueActionHandler = () => {
  const ui = useUIStore.getState();
  ui.setCraftingMode('robertaUpgrades');
  ui.setCraftingSkill('Carpentry');
  ui.setScreen('crafting');
};

const setAttributeHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const attr = params[0];
  const val = Number(params[1] || '1');
  const char = useCharacterStore.getState();
  const attributes = { ...char.attributes, [attr]: val };
  useCharacterStore.setState({ attributes });
  useCharacterStore.getState().recalculateStats();
  useCharacterStore.getState().refreshSocialEnergyCap();
  diaryStore.addInteraction(`Set attribute ${attr} to ${val}`);
};

const grantSkillLevelHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const skillId = params[0];
  const level = Number(params[1] || '1');
  useSkillStore.getState().setSkillLevel(skillId, level);
  diaryStore.addInteraction(`Gained skill level in ${skillId}`);
};

const payDebtHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const amount = Number(params[0] || '0');
  if (amount <= 0) return;
  const paid = useCharacterStore.getState().removeCurrency(amount);
  if (paid) {
    useWorldStateStore.getState().setFlag('finn_debt_paid', true);
    diaryStore.addInteraction(`Paid ${amount}c to Finn. Debt cleared.`);
  } else {
    diaryStore.addInteraction('Payment failed: not enough copper.');
  }
};

const rentRoomHandler: DialogueActionHandler = (_params, { diaryStore }) => {
  const debtPaid = useWorldStateStore.getState().getFlag('finn_debt_paid');
  if (!debtPaid) {
    diaryStore.addInteraction('Cannot rent: debt not cleared.');
    return;
  }
  useUIStore.getState().setSleepWaitMode('sleep');
  useUIStore.getState().openModal('sleepWait');
  diaryStore.addInteraction('Rented a room at the Salty Mug.');
};

const startQuestHandler: DialogueActionHandler = (params) => {
  const questId = params[0];
  const q = (questsData as any)[questId];
  if (!q) {
    console.warn('Quest not found:', questId);
    return;
  }

  const existing = useJournalStore.getState().quests[questId];
  if (existing && (existing.active || existing.completed)) {
    console.log('Quest already accepted or completed:', questId);
    return;
  }

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
  useJournalStore.getState().addQuest(canonicalQuest);

  useJournalStore.getState().addQuest({
    id: questId,
    title: q.title,
    description: q.description,
    stages: q.stages,
    currentStage: 0,
    completed: false,
    active: true,
    rewards: q.rewards,
  } as any);

  if (questId !== 'luke_tutorial' && questId !== 'tidehunter_path') {
    useJournalStore.getState().setQuestStage(questId, 1);
  }
  console.log('Quest started via dialogue:', questId);
};

const advanceQuestStageHandler: DialogueActionHandler = (params) => {
  const questId = params[0];
  useJournalStore.getState().advanceQuestStage(questId);
  console.log('Advanced quest stage:', questId);
};

const setQuestStageHandler: DialogueActionHandler = (params) => {
  const questId = params[0];
  const stage = Number(params[1] || '0');
  useJournalStore.getState().setQuestStage(questId, stage);
  console.log('Set quest stage:', questId, stage);
};

const completeQuestHandler: DialogueActionHandler = (params) => {
  const questId = params[0];
  useJournalStore.getState().completeQuest(questId);
  console.log('Quest completed via dialogue:', questId);
};

const hireJobHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const jobId = params[0];
  useJobStore.getState().loadJobs();
  const can = useJobStore.getState().canHire(jobId);
  if (!can.ok) {
    diaryStore.addInteraction(`Supervisor: We can't rehire you yet. Come back after ${can.rehiredFrom}.`);
    return;
  }
  useJobStore.getState().takeJob(jobId);
  diaryStore.addInteraction(`Hired for job: ${jobId}`);
  diaryStore.addInteraction(`Supervisor: You start tomorrow at ${String(useJobStore.getState().jobs[jobId]?.schedule.startHour ?? 8).padStart(2, '0')}:00.`);
};

const convertLogsToPlanksHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const qtyRaw = params[0] || '0';
  const inv = useInventoryStore.getState();
  const char = useCharacterStore.getState();
  const logsAvailable = inv.getItemQuantity('log');
  const requested = qtyRaw === 'all' ? logsAvailable : Math.max(0, Number(qtyRaw));
  const maxByCopper = Math.floor(char.currency.copper / 2);
  const produce = Math.min(requested, logsAvailable, maxByCopper);
  if (produce <= 0) {
    diaryStore.addInteraction('Sawmill: Not enough logs or copper.');
    return;
  }
  const removed = inv.removeItem('log', produce);
  if (!removed) {
    diaryStore.addInteraction('Sawmill: Failed to remove logs.');
    return;
  }
  const cost = produce * 2;
  const paid = useCharacterStore.getState().removeCurrency(cost);
  if (!paid) {
    inv.addItem('log', produce);
    diaryStore.addInteraction('Sawmill: Payment failed.');
    return;
  }
  inv.addItem('wooden_plank', produce);
  useSkillStore.getState().addXp('carpentry', produce * 10);
  diaryStore.addInteraction(`Converted ${produce} logs to planks at the sawmill.`);
};

const offerDebtPaymentHandler: DialogueActionHandler = (_params, { diaryStore }) => {
  diaryStore.addInteraction('npc_finn: Finn laid out the debt collection job.');
};

const startDebtCollectionHandler: DialogueActionHandler = () => {
  useWorldStateStore.getState().setFlag('finn_debt_collection_active', true);
  useWorldStateStore.getState().setFlag('finn_timeout_ready', false);
  useWorldStateStore.getState().setFlag('finn_timeout_triggered', false);
  useWorldStateStore.getState().setFlag('debt_paid_by_ben', false);
  useWorldStateStore.getState().setFlag('debt_paid_by_beryl', false);
  useWorldStateStore.getState().setFlag('debt_paid_by_elara', false);
  try { useJournalStore.getState().setQuestStage('finn_debt_collection', 1); } catch {}
  const day = useWorldTimeStore.getState().day;
  try {
    useWorldStateStore.getState().setData('finn_debt_deadline_day', String(day + 7));
  } catch {}
};

const collectDebtFromHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const targetNpcId = params[0];
  const amount = Number(params[1] || '10');
  const flagMap: Record<string, string> = {
    npc_ben: 'debt_paid_by_ben',
    npc_beryl: 'debt_paid_by_beryl',
    npc_elara: 'debt_paid_by_elara',
  };
  const flag = flagMap[targetNpcId];
  if (!flag) return;

  const world = useWorldStateStore.getState();
  if (world.getFlag(flag)) {
    diaryStore.addInteraction(`Already collected from ${npcsData[targetNpcId as keyof typeof npcsData]?.name || targetNpcId}.`);
    return;
  }
  if (!world.getFlag('finn_debt_collection_active')) {
    diaryStore.addInteraction('Debt collection is not active.');
    return;
  }

  useCharacterStore.getState().addCurrency('silver', amount);
  world.setFlag(flag, true);
  diaryStore.addInteraction(`${targetNpcId}: Collected ${amount} silvers.`);

  try {
    const journal = useJournalStore.getState();
    const debtQuest = journal.quests['finn_debt_collection'];
    if (debtQuest?.active) {
      const allCollected =
        world.getFlag('debt_paid_by_ben') &&
        world.getFlag('debt_paid_by_beryl') &&
        world.getFlag('debt_paid_by_elara');
      journal.setQuestStage('finn_debt_collection', allCollected ? 4 : (debtQuest.currentStage || 1));
    }
  } catch {}
};

const turnInDebtHandler: DialogueActionHandler = (params, { diaryStore }) => {
  const requiredSilvers = Number(params[0] || '30');
  const world = useWorldStateStore.getState();
  const allCollected = world.getFlag('debt_paid_by_ben') && world.getFlag('debt_paid_by_beryl') && world.getFlag('debt_paid_by_elara');
  if (!allCollected) {
    diaryStore.addInteraction('npc_finn: You have not collected from all three yet.');
    return;
  }
  const totalCopperNeeded = requiredSilvers * 100;
  const paid = useCharacterStore.getState().removeCurrency(totalCopperNeeded);
  if (!paid) {
    diaryStore.addInteraction('npc_finn: Come back when you actually did the job.');
    return;
  }
  world.setFlag('finn_debt_collection_active', false);
  world.setFlag('finn_timeout_ready', false);
  world.setFlag('finn_timeout_triggered', false);
  diaryStore.addInteraction('npc_finn: Debt job complete.');
  try { useJournalStore.getState().completeQuest('finn_debt_collection'); } catch {}
};

const enterTemporalInstanceHandler: DialogueActionHandler = (params, { diaryStore }) => {
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
  diaryStore.addInteraction(`Entered temporal instance at ${locationId || currentLoc}: ${dayOfMonth}/${month}/${year} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
};

const exitTemporalInstanceHandler: DialogueActionHandler = (_params, { diaryStore }) => {
  useWorldTimeStore.getState().exitTemporalInstance();
  const ret = useWorldStateStore.getState().getData('temporal_return_location');
  if (ret) {
    useLocationStore.getState().setLocation(ret);
  }
  diaryStore.addInteraction('Exited temporal instance.');
  useUIStore.getState().setScreen('inGame');
};

const triggerGameOverHandler: DialogueActionHandler = () => {
  window.location.reload();
};

const tryHireOrDenyHandler: DialogueActionHandler = (params, { diaryStore, showDialogueNode, endDialogue }) => {
  const jobId = params[0];
  const denyNodeId = params[1];
  useJobStore.getState().loadJobs();
  const can = useJobStore.getState().canHire(jobId);
  if (!can.ok) {
    if (denyNodeId) {
      const shown = showDialogueNode?.(denyNodeId);
      if (shown) return;
    }
    diaryStore.addInteraction(`Supervisor: We can't rehire you yet. Come back after ${can.rehiredFrom}.`);
    return;
  }
  useJobStore.getState().takeJob(jobId);
  diaryStore.addInteraction(`Hired for job: ${jobId}`);
  diaryStore.addInteraction(`Supervisor: You start tomorrow at ${String(useJobStore.getState().jobs[jobId]?.schedule.startHour ?? 8).padStart(2, '0')}:00.`);
  endDialogue?.();
};

const recruitCompanionHandler: DialogueActionHandler = (params) => {
  console.log('Recruiting companion:', params[0]);
};

const startFinnBetrayalCombatHandler: DialogueActionHandler = () => {
  GameManagerService.startFinnBetrayalCombat();
};

const turnInDebtOrRebukeHandler: DialogueActionHandler = (params, { diaryStore, showDialogueNode, endDialogue }) => {
  const requiredSilvers = Number(params[0] || '30');
  const rebukeNodeId = params[1];
  const world = useWorldStateStore.getState();
  const allCollected = world.getFlag('debt_paid_by_ben') && world.getFlag('debt_paid_by_beryl') && world.getFlag('debt_paid_by_elara');
  const showRebuke = () => {
    if (rebukeNodeId) {
      const shown = showDialogueNode?.(rebukeNodeId);
      if (shown) return;
    }
    diaryStore.addInteraction('npc_finn: Come back when you actually did the job.');
  };
  if (!allCollected) {
    showRebuke();
    return;
  }
  const totalCopperNeeded = requiredSilvers * 100;
  const paid = useCharacterStore.getState().removeCurrency(totalCopperNeeded);
  if (!paid) {
    showRebuke();
    return;
  }
  world.setFlag('finn_debt_collection_active', false);
  world.setFlag('finn_timeout_ready', false);
  world.setFlag('finn_timeout_triggered', false);
  diaryStore.addInteraction('npc_finn: Debt job complete.');
  try { useJournalStore.getState().completeQuest('finn_debt_collection'); } catch {}
  endDialogue?.();
};

const startBrawlHandler: DialogueActionHandler = (params) => {
  const target = params[0];
  if (target === 'ben') {
    GameManagerService.startBenBrawl();
  }
};

const socialActionHandler: DialogueActionHandler = (params, context) => {
  const npcId = params[0];
  const socialType = (params[1] || 'friendly') as SocialActionType;

  if (context.hasNpcReachedDailySocialLimit?.(npcId)) {
    context.setLastSocialOutcome?.('fail');
    context.diaryStore.addInteraction(`${npcId}: They have had enough of you for today.`);
    return;
  }

  // For gift actions: params[2] = 'currency' | itemId, params[3] = currency type | qty.
  // currency format: social_action:npcId:gift:currency:copper:1
  // item format:     social_action:npcId:gift:beer:1
  if (socialType === 'gift') {
    if (params[2] === 'currency') {
      const currencyType = (params[3] || 'copper') as 'copper' | 'silver' | 'gold';
      const amount = Number(params[4] ?? 1);
      useCharacterStore.getState().removeCurrency(
        currencyType === 'copper' ? amount : 0,
        currencyType === 'silver' ? amount : 0,
        currencyType === 'gold' ? amount : 0,
      );
    } else {
      const itemId = params[2];
      const qty = Number(params[3] ?? 1);
      if (itemId) useInventoryStore.getState().removeItem(itemId, qty);
    }
  }

  const socialStyle = (socialType !== 'gift' ? (params[2] || 'honest') : 'honest') as SocialStyle;

  const result = resolveSocialAction({
    npcId,
    type: socialType,
    style: socialStyle,
    persuasionLevel: useSkillStore.getState().getSkillLevel('persuasion'),
    coercionLevel: useSkillStore.getState().getSkillLevel('coercion'),
  });

  context.incrementNpcDailySocialUses?.(npcId);
  context.setLastSocialOutcome?.(result.outcome);
  useDiaryStore.getState().updateRelationship(npcId, result.relationshipChanges);
  useSkillStore.getState().addXp(result.xpSkill, result.xpAmount);
  context.diaryStore.addInteraction(`${npcId}: ${result.diaryText}`);
};

const handlers: Record<string, DialogueActionHandler> = {
  trigger_confirmation: triggerConfirmationHandler,
  set_flag: setFlagHandler,
  add_money: addMoneyHandler,
  remove_money: removeMoneyHandler,
  pass_time: passTimeHandler,
  grant_item: addItemHandler,
  add_item: addItemHandler,
  remove_item: removeItemHandler,
  open_shop: openShopHandler,
  open_roberta_upgrades: openRobertaUpgradesHandler,
  add_xp: addXpHandler,
  update_relationship: updateRelationshipHandler,
  set_relationship: setRelationshipHandler,
  add_known_npc: addKnownNpcHandler,
  set_attribute: setAttributeHandler,
  grant_skill_level: grantSkillLevelHandler,
  pay_debt: payDebtHandler,
  rent_room: rentRoomHandler,
  start_quest: startQuestHandler,
  hire_job: hireJobHandler,
  advance_quest_stage: advanceQuestStageHandler,
  set_quest_stage: setQuestStageHandler,
  complete_quest: completeQuestHandler,
  convert_logs_to_planks: convertLogsToPlanksHandler,
  offer_debt_payment: offerDebtPaymentHandler,
  start_debt_collection: startDebtCollectionHandler,
  collect_debt_from: collectDebtFromHandler,
  turn_in_debt: turnInDebtHandler,
  enter_temporal_instance: enterTemporalInstanceHandler,
  exit_temporal_instance: exitTemporalInstanceHandler,
  trigger_game_over: triggerGameOverHandler,
  try_hire_or_deny: tryHireOrDenyHandler,
  recruit_companion: recruitCompanionHandler,
  start_finn_betrayal_combat: startFinnBetrayalCombatHandler,
  turn_in_debt_or_rebuke: turnInDebtOrRebukeHandler,
  start_brawl: startBrawlHandler,
  social_action: socialActionHandler,
};

export function executeRegisteredAction(actionType: string, params: string[], context: DialogueActionContext): boolean {
  const handler = handlers[actionType];
  if (!handler) return false;
  handler(params, context);
  return true;
}

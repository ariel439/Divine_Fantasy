// src/services/QuestObserverService.ts
import { useJournalStore } from '../stores/useJournalStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import questsData from '../data/quests.json';

export class QuestObserverService {
  private static isInitialized = false;

  /**
   * Initializes the quest observer by subscribing to relevant stores.
   */
  static init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Monitor Inventory Changes (for 'gather' objectives)
    useInventoryStore.subscribe(() => {
      this.checkAllQuests('gather');
    });

    // 2. Monitor Location Changes (for 'navigate' objectives)
    useLocationStore.subscribe((state) => {
      this.checkAllQuests('navigate', state.currentLocationId);
    });

    // 3. Monitor World State Changes (for 'flag', 'collect', 'event' objectives)
    useWorldStateStore.subscribe(() => {
      this.checkAllQuests('flag');
      this.checkAllQuests('collect');
      this.checkAllQuests('event');
    });

    console.log('[QuestObserverService] Initialized and monitoring quests.');
  }

  /**
   * Checks all active quests for objectives of a specific type.
   */
  static checkAllQuests(type: string, data?: any) {
    const journalStore = useJournalStore.getState();
    const activeQuests = Object.values(journalStore.quests).filter(q => q.active && !q.completed);

    activeQuests.forEach(quest => {
      const questDef = (questsData as any)[quest.id];
      if (!questDef) return;

      const isNonLinear = (questDef as any).nonLinear === true;
      
      if (isNonLinear) {
        let anyChange = false;
        questDef.stages.forEach((stageDef: any, index: number) => {
          if (stageDef.type !== type) return;

          const objectiveMet = this.checkObjective(type, stageDef, data);
          if (objectiveMet) {
            if (index === quest.currentStage) {
              journalStore.setQuestStage(quest.id, index + 1);
              anyChange = true;
            } else {
              // Force UI update for out-of-order completion
              journalStore.setQuestStage(quest.id, quest.currentStage || 0);
            }
          }
        });

        if (anyChange) {
          this.checkAllQuests(type, data);
        }
      } else {
        const currentStageIndex = quest.currentStage || 0;
        const stageDef = questDef.stages[currentStageIndex];
        if (!stageDef || stageDef.type !== type) return;

        const objectiveMet = this.checkObjective(type, stageDef, data);

        if (objectiveMet) {
          journalStore.setQuestStage(quest.id, currentStageIndex + 1);
          this.checkAllQuests(type, data); 
        }
      }
    });
  }

  private static checkObjective(type: string, stageDef: any, data?: any): boolean {
    switch (type) {
      case 'gather':
        return this.checkGatherObjective(stageDef);
      case 'navigate':
        return this.checkNavigateObjective(stageDef, data);
      case 'flag':
      case 'event':
      case 'collect':
        return this.checkFlagObjective(stageDef);
      case 'wait':
        return this.checkWaitObjective(stageDef);
      default:
        return false;
    }
  }

  private static checkGatherObjective(stage: any): boolean {
    if (!stage.target || !stage.quantity) return false;
    const inventory = useInventoryStore.getState();
    return inventory.getItemQuantity(stage.target) >= stage.quantity;
  }

  private static checkNavigateObjective(stage: any, currentLocationId: string): boolean {
    if (!stage.target) return false;
    return currentLocationId === stage.target;
  }

  private static checkFlagObjective(stage: any): boolean {
    if (!stage.target) return false;
    const worldState = useWorldStateStore.getState();
    return !!worldState.getFlag(stage.target);
  }

  private static checkWaitObjective(stage: any): boolean {
    if (!stage.target) return false;
    const worldState = useWorldStateStore.getState();
    // Check if a flag related to wait completion is set
    return !!worldState.getFlag(stage.target + '_done') || !!worldState.getFlag(stage.target);
  }
}

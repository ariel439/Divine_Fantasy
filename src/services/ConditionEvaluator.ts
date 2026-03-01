// ConditionEvaluator.ts
// Handles parsing and evaluating dynamic conditions for dialogue, quests, and events.

import { useCharacterStore } from '../stores/useCharacterStore';
import { useDiaryStore } from '../stores/useDiaryStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useJournalStore } from '../stores/useJournalStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useJobStore } from '../stores/useJobStore';

type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=';

interface ParsedCondition {
  lhs: string;
  op: ConditionOperator;
  rhs: string;
}

export class ConditionEvaluator {
  
  /**
   * Evaluates a complex condition string (e.g., "quest.q1.completed==true && time.is_day==true")
   */
  static evaluate(conditionString: string): boolean {
    if (!conditionString) return true;

    const parts = conditionString.split('&&').map(s => s.trim());
    
    for (const part of parts) {
      if (!this.evaluateSingleCondition(part)) {
        return false;
      }
    }
    
    return true;
  }

  private static evaluateSingleCondition(condition: string): boolean {
    const parsed = this.parseCondition(condition);
    if (!parsed) {
      console.warn(`[ConditionEvaluator] Failed to parse condition: "${condition}"`);
      return false;
    }

    const { lhs, op, rhs } = parsed;
    
    // Convert RHS to appropriate types
    const rhsBool = rhs === 'true' ? true : rhs === 'false' ? false : undefined;
    const rhsNum = !isNaN(Number(rhs)) && rhs !== '' ? Number(rhs) : undefined;

    // 1. Quests
    if (lhs.startsWith('quest.')) {
      return this.evaluateQuestCondition(lhs, op, rhsBool, rhsNum);
    }
    
    // 2. World Flags
    if (lhs.startsWith('world_flags.')) {
      return this.evaluateWorldFlagCondition(lhs, op, rhsBool, rhsNum);
    }
    
    // 3. Time
    if (lhs.startsWith('time.')) {
      return this.evaluateTimeCondition(lhs, op, rhs, rhsBool, rhsNum);
    }
    
    // 4. Relationships
    if (lhs.startsWith('relationship.')) {
        return this.evaluateRelationshipCondition(lhs, op, rhsNum);
    }

    // 5. Jobs
    if (lhs.startsWith('job.')) {
        return this.evaluateJobCondition(lhs, op, rhsBool);
    }

    // 6. Inventory / Currency
    if (lhs.startsWith('inventory.') || lhs.startsWith('has_item:') || lhs.startsWith('currency.') || lhs === 'money') {
        return this.evaluateInventoryCondition(lhs, op, rhsNum);
    }
    
    // 7. Stats
    if (lhs.startsWith('stats.')) {
        return this.evaluateStatsCondition(lhs, op, rhsNum);
    }

    console.warn(`[ConditionEvaluator] Unknown condition type: "${lhs}"`);
    return false;
  }

  private static parseCondition(condition: string): ParsedCondition | null {
    // Sort operators by length desc to match '>=' before '>'
    const operators: ConditionOperator[] = ['>=', '<=', '==', '!=', '>', '<'];
    
    for (const op of operators) {
      const idx = condition.indexOf(op);
      if (idx !== -1) {
        return {
          lhs: condition.substring(0, idx).trim(),
          op,
          rhs: condition.substring(idx + op.length).trim()
        };
      }
    }
    
    // Handle implicit boolean checks or special syntax if needed
    // For now, strict syntax required
    return null;
  }

  private static compare<T>(actual: T, op: ConditionOperator, target: T): boolean {
    switch (op) {
      case '==': return actual === target;
      case '!=': return actual !== target;
      case '>': return actual > target;
      case '<': return actual < target;
      case '>=': return actual >= target;
      case '<=': return actual <= target;
      default: return false;
    }
  }

  // --- Domain Specific Evaluators ---

  private static evaluateQuestCondition(lhs: string, op: ConditionOperator, rhsBool?: boolean, rhsNum?: number): boolean {
    const parts = lhs.split('.'); // quest.questId.field
    if (parts.length < 3) return false;
    
    const questId = parts[1];
    const field = parts[2];
    const quest = useJournalStore.getState().quests[questId];

    if (field === 'active') {
      return this.compare(quest?.active || false, op, rhsBool ?? true);
    } else if (field === 'completed') {
      return this.compare(quest?.completed || false, op, rhsBool ?? true);
    } else if (field === 'stage') {
      return this.compare(quest?.currentStage ?? 0, op, rhsNum ?? 0);
    }
    
    return false;
  }

  private static evaluateWorldFlagCondition(lhs: string, op: ConditionOperator, rhsBool?: boolean, rhsNum?: number): boolean {
    const flag = lhs.replace('world_flags.', '');
    const val = useWorldStateStore.getState().getFlag(flag);
    
    // Flag can be boolean or number. Compare against whatever RHS we parsed.
    const target = rhsBool !== undefined ? rhsBool : rhsNum;
    
    if (target === undefined) return false;
    return this.compare(val, op, target);
  }

  private static evaluateTimeCondition(lhs: string, op: ConditionOperator, rhsRaw: string, rhsBool?: boolean, rhsNum?: number): boolean {
    const timeStore = useWorldTimeStore.getState();
    const hour = timeStore.hour;

    if (lhs === 'time.is_day') {
      const isDay = hour >= 6 && hour < 18;
      return this.compare(isDay, op, rhsBool ?? true);
    } else if (lhs === 'time.is_night') {
      const isNight = hour < 6 || hour >= 18;
      return this.compare(isNight, op, rhsBool ?? true);
    } else if (lhs === 'time.hour') { // standardized from hour_lt/gt
       return this.compare(hour, op, rhsNum ?? 0);
    } else if (lhs === 'time.hour_lt') {
       return hour < (rhsNum ?? 0);
    } else if (lhs === 'time.hour_gte') {
       return hour >= (rhsNum ?? 0);
    } else if (lhs === 'time.weekday') {
        const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        // Simple approximation if day 1 = Sunday
        const totalDays = (timeStore.year * 360) + (timeStore.month * 30) + timeStore.dayOfMonth; 
        // Logic from original file:
        const firstDow = ((timeStore.month - 1) * 30) % 7;
        const weekday = (firstDow + timeStore.dayOfMonth - 1) % 7;
        const current = names[weekday];
        return this.compare(current, op, rhsRaw);
    }
    
    return false;
  }

  private static evaluateRelationshipCondition(lhs: string, op: ConditionOperator, rhsNum?: number): boolean {
      const npcId = lhs.replace('relationship.', '');
      const val = useDiaryStore.getState().relationships[npcId]?.friendship?.value ?? 0;
      return this.compare(val, op, rhsNum ?? 0);
  }

  private static evaluateJobCondition(lhs: string, op: ConditionOperator, rhsBool?: boolean): boolean {
      // job.jobId.property
      const parts = lhs.split('.');
      const jobId = parts[1];
      const property = parts[2]; // 'fired' or 'active' (implicit)
      const jobStore = useJobStore.getState();

      let val = false;
      if (property === 'fired') {
          val = !!jobStore.firedJobs[jobId];
      } else {
          // Default to checking if it's the active job
          val = jobStore.activeJob?.jobId === jobId;
      }
      
      return this.compare(val, op, rhsBool ?? true);
  }

  private static evaluateInventoryCondition(lhs: string, op: ConditionOperator, rhsNum?: number): boolean {
      const inventory = useInventoryStore.getState();
      const character = useCharacterStore.getState();

      if (lhs.startsWith('inventory.')) {
          const itemId = lhs.replace('inventory.', '');
          const qty = inventory.getItemQuantity(itemId);
          return this.compare(qty, op, rhsNum ?? 0);
      } else if (lhs.startsWith('has_item:')) {
          const itemId = lhs.split(':')[1];
          const qty = inventory.getItemQuantity(itemId);
          return qty >= 1; // has_item is implicitly >= 1
      } else if (lhs.startsWith('currency.')) {
          const type = lhs.replace('currency.', '') as 'copper' | 'silver' | 'gold';
          const val = character.currency[type] || 0;
          return this.compare(val, op, rhsNum ?? 0);
      } else if (lhs === 'money') {
          // Legacy alias for silver
          const val = character.currency.silver;
          return this.compare(val, op, rhsNum ?? 0);
      }
      return false;
  }

  private static evaluateStatsCondition(lhs: string, op: ConditionOperator, rhsNum?: number): boolean {
      const attributes = useCharacterStore.getState().attributes;
      const statName = lhs.replace('stats.', '') as keyof typeof attributes;
      const val = attributes[statName] || 0;
      return this.compare(val, op, rhsNum ?? 0);
  }
}

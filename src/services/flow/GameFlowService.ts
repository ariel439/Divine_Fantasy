import type { GameState } from '../../types';

export interface FlowTransitionDecision {
  from: GameState;
  to: GameState;
  allowed: boolean;
  enforcement: 'strict' | 'compatibility';
  reason?: string;
}

type TransitionMap = Record<GameState, GameState[]>;

const TRANSITIONS: TransitionMap = {
  mainMenu: ['characterSelection', 'inGame', 'debugMenu'],
  characterSelection: ['mainMenu', 'prologue', 'inGame'],
  prologue: ['event', 'inGame', 'mainMenu'],
  event: ['inGame', 'dialogue', 'choiceEvent', 'combat', 'event', 'mainMenu'],
  inGame: ['dialogue', 'characterScreen', 'inventory', 'journal', 'diary', 'library', 'trade', 'crafting', 'choiceEvent', 'combat', 'mainMenu', 'event', 'debugMenu', 'jobScreen'],
  dialogue: ['inGame', 'event', 'combat', 'trade', 'choiceEvent', 'dialogue', 'mainMenu'],
  dialogueRoberta: ['dialogue', 'inGame', 'mainMenu'],
  characterScreen: ['inGame', 'inventory', 'journal', 'diary', 'mainMenu'],
  inventory: ['inGame', 'characterScreen', 'journal', 'diary', 'tradeConfirmation', 'crafting', 'library', 'choiceEvent', 'event', 'mainMenu'],
  jobScreen: ['inGame', 'mainMenu'],
  journal: ['inGame', 'characterScreen', 'inventory', 'diary', 'mainMenu'],
  diary: ['inGame', 'characterScreen', 'inventory', 'journal', 'companion', 'mainMenu'],
  library: ['inGame', 'inventory', 'characterScreen', 'journal', 'diary', 'mainMenu'],
  trade: ['inGame', 'dialogue', 'tradeConfirmation', 'mainMenu'],
  tradeConfirmation: ['trade', 'inGame', 'mainMenu'],
  crafting: ['inGame', 'mainMenu'],
  choiceEvent: ['inGame', 'dialogue', 'event', 'combat', 'mainMenu'],
  combat: ['combatVictory', 'event', 'inGame', 'mainMenu'],
  combatVictory: ['inGame', 'event', 'mainMenu'],
  companion: ['inGame', 'diary', 'mainMenu'],
  debugMenu: ['mainMenu', 'inGame', 'combatDebug', 'questDebug'],
  combatDebug: ['debugMenu', 'combat'],
  questDebug: ['debugMenu', 'inGame'],
};

const STRICT_CLUSTERS = new Set<GameState>([
  'mainMenu',
  'characterSelection',
  'prologue',
  'inGame',
  'event',
  'dialogue',
  'dialogueRoberta',
  'characterScreen',
  'inventory',
  'jobScreen',
  'journal',
  'diary',
  'library',
  'trade',
  'tradeConfirmation',
  'crafting',
  'choiceEvent',
  'combat',
  'combatVictory',
  'companion',
  'debugMenu',
  'combatDebug',
  'questDebug',
]);

export class GameFlowService {
  static canTransition(from: GameState, to: GameState): FlowTransitionDecision {
    const allowedTargets = TRANSITIONS[from];
    const enforcement: 'strict' | 'compatibility' = STRICT_CLUSTERS.has(from) ? 'strict' : 'compatibility';
    if (!allowedTargets) {
      return {
        from,
        to,
        enforcement,
        allowed: enforcement === 'compatibility',
        reason: `No transition map for source state "${from}", allowing transition for compatibility.`,
      };
    }

    if (from === to || allowedTargets.includes(to)) {
      return { from, to, allowed: true, enforcement };
    }

    if (enforcement === 'strict') {
      return {
        from,
        to,
        allowed: false,
        enforcement,
        reason: `Blocked transition "${from}" -> "${to}" by strict flow policy.`,
      };
    }

    return {
      from,
      to,
      allowed: true,
      enforcement,
      reason: `Transition "${from}" -> "${to}" is not in the flow map. Allowed as compatibility fallback.`,
    };
  }
}

import { create } from 'zustand';
import type { CombatParticipant, CombatEncounterType, CombatDefeatMode, CombatEncounterConfig } from '../types';
import { useCharacterStore } from './useCharacterStore';

export type CombatPhase = 'setup' | 'player-turn' | 'enemy-turn' | 'victory' | 'defeat' | 'fled';

export interface CombatReward {
  xp: number;
  loot: Array<{ itemId: string; quantity: number }>;
}

export interface CombatState {
  // Participants
  participants: CombatParticipant[];
  turnOrder: string[]; // ordered participant ids
  currentTurnIndex: number;
  
  // State
  phase: CombatPhase;
  round: number;
  
  // Rewards
  rewards: CombatReward;
  encounterType: CombatEncounterType;
  victoryActions: string[];
  victoryToast?: string;
  victoryEventId?: string;
  defeatMode: CombatDefeatMode;
  defeatToast?: string;
  allowFlee: boolean;
  
  // Log
  log: string[];
}

export interface CombatStore extends CombatState {
  // Actions
  startCombat: (player: CombatParticipant, companion: CombatParticipant | CombatParticipant[] | null | undefined, enemies: CombatParticipant[], config?: CombatEncounterConfig) => void;
  endCombat: () => void;
  nextTurn: () => void;
  setPhase: (phase: CombatPhase) => void;
  updateParticipant: (id: string, updates: Partial<CombatParticipant>) => void;
  setRewards: (rewards: CombatReward) => void;
  addLogEntry: (entry: string) => void;
  clearLog: () => void;
  
  // Derived getters
  getCurrentParticipant: () => CombatParticipant | undefined;
  getAliveParticipants: () => CombatParticipant[];
  getAliveEnemies: () => CombatParticipant[];
  getAliveParty: () => CombatParticipant[];
  isPlayerTurn: () => boolean;
}

const assignFormation = (combatants: CombatParticipant[]): CombatParticipant[] =>
  combatants.map((combatant, index) => ({
    ...combatant,
    combatRow: index < 2 ? 'front' : 'back',
    combatSlot: index % 2,
  }));

const initialState: CombatState = {
  participants: [],
  turnOrder: [],
  currentTurnIndex: 0,
  phase: 'setup',
  round: 1,
  rewards: { xp: 0, loot: [] },
  encounterType: 'standard',
  victoryActions: [],
  victoryToast: undefined,
  victoryEventId: undefined,
  defeatMode: 'standard',
  defeatToast: undefined,
  allowFlee: true,
  log: [],
};

export const useCombatStore = create<CombatStore>((set, get) => ({
  ...initialState,

  startCombat(player, companion, enemies, config) {
    const equippedWeapon = useCharacterStore.getState().equippedItems.weapon;
    const playerCombatTags = Array.from(new Set([
      ...(player.combatTags || []),
      ...(equippedWeapon?.combatTags || []),
    ]));

    const partyMembers: CombatParticipant[] = [player];
    if (companion) {
      if (Array.isArray(companion)) {
        partyMembers.push(...companion);
      } else {
        partyMembers.push(companion);
      }
    }

    const normalizedParty = partyMembers.map((member) =>
      member.isPlayer
        ? {
            ...member,
            combatTags: playerCombatTags,
            attack_sound: member.attack_sound || equippedWeapon?.attack_sound,
          }
        : member
    );

    const positionedParty = assignFormation(normalizedParty);
    const positionedEnemies = assignFormation(enemies);
    const participants: CombatParticipant[] = [...positionedParty, ...positionedEnemies];

    // Sort by dexterity descending for honest initiative.
    // Break ties by giving the player side a slight readability advantage only when stats are equal.
    const sorted = participants.sort((a, b) => {
      const aFirstStrike = a.combatTags?.includes('first_strike') ? 1 : 0;
      const bFirstStrike = b.combatTags?.includes('first_strike') ? 1 : 0;
      if (bFirstStrike !== aFirstStrike) return bFirstStrike - aFirstStrike;
      if (b.dexterity !== a.dexterity) return b.dexterity - a.dexterity;
      if ((a.isPlayer || a.isCompanion) && !(b.isPlayer || b.isCompanion)) return -1;
      if (!(a.isPlayer || a.isCompanion) && (b.isPlayer || b.isCompanion)) return 1;
      return 0;
    });
    let finalTurnOrder = sorted.map(p => p.id);

    if (config?.forcePlayerFirstTurn) {
      const playerIndex = finalTurnOrder.findIndex((id) => {
        const participant = participants.find((p) => p.id === id);
        return participant?.isPlayer;
      });

      if (playerIndex > 0) {
        const [playerId] = finalTurnOrder.splice(playerIndex, 1);
        finalTurnOrder = [playerId, ...finalTurnOrder];
      }
    }

    // Determine initial phase based on who goes first
    const firstParticipant = participants.find((p) => p.id === finalTurnOrder[0]) || sorted[0];
    const initialPhase = (firstParticipant.isPlayer || firstParticipant.isCompanion) ? 'player-turn' : 'enemy-turn';

    set({
      participants,
      turnOrder: finalTurnOrder,
      currentTurnIndex: 0,
      phase: initialPhase,
      round: 1,
      rewards: { xp: 0, loot: [] },
      encounterType: config?.encounterType || 'standard',
      victoryActions: config?.victoryActions || [],
      victoryToast: config?.victoryToast,
      victoryEventId: config?.victoryEventId,
      defeatMode: config?.defeatMode || 'standard',
      defeatToast: config?.defeatToast,
      allowFlee: config?.allowFlee ?? true,
      log: ['Combat begins!'],
    });
  },

  endCombat() {
    set({ ...initialState });
  },

  nextTurn() {
    const { turnOrder, currentTurnIndex, participants } = get();
    
    // Find next alive participant
    let tempIndex = currentTurnIndex;
    let roundIncrement = 0;
    let found = false;
    let safety = 0;

    // Loop through participants to find the next alive one
    // Max iterations: turnOrder.length + 1 to prevent infinite loops if everyone is dead
    while (!found && safety <= turnOrder.length) {
        tempIndex = (tempIndex + 1) % turnOrder.length;
        if (tempIndex === 0) roundIncrement++;
        
        const pId = turnOrder[tempIndex];
        const p = participants.find(x => x.id === pId);
        if (p && p.hp > 0) {
            found = true;
        }
        safety++;
    }
    
    // If everyone is dead (safety triggered), fallback to simple increment to avoid crash
    if (!found) {
        tempIndex = (currentTurnIndex + 1) % turnOrder.length;
        if (tempIndex === 0) roundIncrement++;
    }
    
    const nextIndex = tempIndex;
    const nextRound = get().round + roundIncrement;
    
    // Reset defending state for all participants at start of new round
    if (roundIncrement > 0) {
      set(state => ({
        participants: state.participants.map(p => ({ ...p, defending: false })),
        currentTurnIndex: nextIndex,
        round: nextRound
      }));
    } else {
      set({ currentTurnIndex: nextIndex, round: nextRound });
    }
    
    // Set appropriate phase based on whose turn it is
    const current = get().getCurrentParticipant();
    if (current) {
      set({ phase: (current.isPlayer || current.isCompanion) ? 'player-turn' : 'enemy-turn' });
    }
  },

  setPhase(phase) {
    set({ phase });
  },

  updateParticipant(id, updates) {
    set(state => ({
      participants: state.participants.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  setRewards(rewards) {
    set({ rewards });
  },

  addLogEntry(entry) {
    set(state => ({ log: [...state.log, entry] }));
  },

  clearLog() {
    set({ log: [] });
  },

  // Derived getters
  getCurrentParticipant() {
    const { turnOrder, currentTurnIndex, participants } = get();
    const currentId = turnOrder[currentTurnIndex];
    return participants.find(p => p.id === currentId);
  },

  getAliveParticipants() {
    return get().participants.filter(p => p.hp > 0);
  },

  getAliveEnemies() {
    return get().participants.filter(p => p.hp > 0 && !p.isPlayer && !p.isCompanion);
  },

  getAliveParty() {
    return get().participants.filter(p => p.hp > 0 && (p.isPlayer || p.isCompanion));
  },

  isPlayerTurn() {
    const current = get().getCurrentParticipant();
    return !!current && (current.isPlayer || current.isCompanion);
  },
}));

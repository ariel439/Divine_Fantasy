import React, { useEffect } from 'react';
import { useCombatStore } from '../stores/useCombatStore';
import type { CombatParticipant } from '../types';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useCompanionStore } from '../stores/useCompanionStore';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import CombatScreen from './screens/CombatScreen';
import { robertCaughtSlides } from '../data/events';

const CombatManager: React.FC = () => {
  const {
    participants,
    turnOrder,
    currentTurnIndex,
    phase,
    rewards,
    log,
    getCurrentParticipant,
    getAliveEnemies,
    getAliveParty,
    isPlayerTurn,
    nextTurn,
    setPhase,
    updateParticipant,
    addLogEntry,
    endCombat,
  } = useCombatStore();

  const { setScreen } = useUIStore();
  const { passTime } = useWorldTimeStore();
  const { addItem } = useInventoryStore();
  const { addXp: addSkillXp, getSkillLevel } = useSkillStore();

  const scriptedTurnCount = React.useRef(0);

  const [selectedTargetId, setSelectedTargetId] = React.useState<string>('');

  const aliveEnemies = React.useMemo(() => getAliveEnemies(), [participants, getAliveEnemies]);
  const aliveParty = React.useMemo(() => getAliveParty(), [participants, getAliveParty]);
  const sortedTurnOrder = React.useMemo(() => turnOrder.map(id => participants.find(p => p.id === id)).filter(Boolean) as CombatParticipant[], [turnOrder, participants]);

  // Auto-select first enemy if none selected
  useEffect(() => {
    if (!selectedTargetId && aliveEnemies.length > 0) {
      const firstEnemy = aliveEnemies[0];
      if (firstEnemy) setSelectedTargetId(firstEnemy.id);
    }
  }, [aliveEnemies, selectedTargetId]);

  // Handle victory/defeat checks
  useEffect(() => {
    if (phase === 'setup') return;

    if (aliveEnemies.length === 0) {
      setPhase('victory');
      // Grant rewards - XP goes to skills, handled elsewhere
      rewards.loot.forEach(loot => addItem(loot.itemId, loot.quantity));
      // Return to location after short delay
      setTimeout(() => {
        endCombat();
        setScreen('inGame');
        passTime(5); // Combat takes 5 minutes
      }, 2000);
    } else if (aliveParty.length === 0) {
      setPhase('defeat');
      setTimeout(() => {
        endCombat();
        const ui = useUIStore.getState();
        const isIntroMode = useWorldStateStore.getState().introMode;
        if (isIntroMode) {
          ui.setEventSlides(robertCaughtSlides);
          ui.setCurrentEventId('robert_caught');
          setScreen('event');
        } else {
          setScreen('mainMenu');
        }
        passTime(5);
      }, 1500);
    }
  }, [aliveEnemies.length, aliveParty.length, phase, rewards, setPhase, endCombat, setScreen, passTime, addItem]);

  const handleAttack = () => {
    if (!isPlayerTurn() || !selectedTargetId) return;
    
    const attacker = getCurrentParticipant();
    const target = participants.find(p => p.id === selectedTargetId);
    if (!attacker || !target || target.hp <= 0) return;

    const baseHitChance = attacker.isPlayer || attacker.isCompanion ? 0.8 : 0.7;
    if (Math.random() > baseHitChance) {
      addLogEntry(`${attacker.name} attacks ${target.name} but misses!`);
      nextTurn();
      return;
    }

    const attackPower = attacker.attack;
    const defencePower = Math.max(0, target.defence);
    let damage = Math.floor(attackPower * 1.4 - defencePower * 0.3);
    damage = Math.max(3, damage);

    const newHp = Math.max(0, target.hp - damage);

    updateParticipant(target.id, { hp: newHp });
    addLogEntry(`${attacker.name} attacks ${target.name} for ${damage} damage!`);

    if (attacker.isPlayer || attacker.isCompanion) {
      addSkillXp('attack', Math.floor(damage * 2));
    }

    if ((target.isPlayer || target.isCompanion) && newHp > 0) {
      addSkillXp('defence', Math.floor(damage * 2));
    }

    if (newHp <= 0) {
      addLogEntry(`${target.name} is defeated!`);
    }

    if (useWorldStateStore.getState().getFlag('combat_tutorial_active')) {
      useWorldStateStore.getState().setFlag('combat_tutorial_active', false);
      useWorldStateStore.getState().setFlag('combat_tutorial_seen', true);
    }

    nextTurn();
  };

  const handleFlee = () => {
    if (!isPlayerTurn()) return;
    
    // Simple flee logic - 70% base chance modified by dexterity difference
    const partyDexterity = getAliveParty().reduce((sum, p) => sum + p.dexterity, 0) / getAliveParty().length;
    const enemyDexterity = getAliveEnemies().reduce((sum, e) => sum + e.dexterity, 0) / getAliveEnemies().length;
    const fleeChance = Math.min(0.9, Math.max(0.1, 0.7 + (partyDexterity - enemyDexterity) * 0.05));
    
    if (Math.random() < fleeChance) {
      addLogEntry('Party successfully fled from combat!');
      // Award dexterity skill XP for successful flee
      getAliveParty().forEach(p => {
        if (p.isPlayer || p.isCompanion) {
          addSkillXp('dexterity', 10); // 10 XP for successful flee
        }
      });
      setPhase('fled');
      setTimeout(() => {
        endCombat();
        setScreen('inGame');
        passTime(5); // Combat takes 5 minutes even if fled
      }, 1500);
    } else {
      addLogEntry('Party failed to flee!');
      nextTurn();
    }
  };

  // Auto-advance enemy AND companion turns
  useEffect(() => {
    // Enemy Turn Logic
    if (!isPlayerTurn() && phase === 'enemy-turn') {
      const timer = setTimeout(() => {
        const currentEnemy = getCurrentParticipant();
        if (!currentEnemy || currentEnemy.hp <= 0) {
          nextTurn();
          return;
        }

        // Scripted Smuggler Encounter Logic
        const isScriptedLoss = useWorldStateStore.getState().getFlag('smuggler_scripted_loss');
        const aliveParty = getAliveParty();
        
        if (aliveParty.length === 0) {
           nextTurn();
           return;
        }

        let target: CombatParticipant | undefined;
        let damage = 0;

        if (isScriptedLoss) {
          // Prioritize Robert (Companion)
          const robert = aliveParty.find(p => p.isCompanion);
          target = robert || aliveParty[0];
          
          damage = 15; // Fixed high damage for cinematic feel
          scriptedTurnCount.current += 1;
        } else {
          target = aliveParty[Math.floor(Math.random() * aliveParty.length)];

          const baseHitChance = 0.75;
          if (Math.random() > baseHitChance) {
            addLogEntry(`${currentEnemy.name} attacks ${target.name} but misses!`);
            nextTurn();
            return;
          }

          const attackPower = currentEnemy.attack;
          const defencePower = Math.max(0, target.defence);
          damage = Math.floor(attackPower * 1.3 - defencePower * 0.3);
          damage = Math.max(3, damage);
        }
        
        if (target) {
            const newHp = Math.max(0, target.hp - damage);
            
            updateParticipant(target.id, { hp: newHp });
            addLogEntry(`${currentEnemy.name} attacks ${target.name} for ${damage} damage!`);
            
            // Award defence skill XP to target for taking damage
            if ((target.isPlayer || target.isCompanion) && damage > 0) {
              addSkillXp('defence', Math.floor(damage * 4)); // 4 XP per damage taken
            }
            
            if (newHp <= 0) {
              addLogEntry(`${target.name} is defeated!`);
            }
        }

        // Scripted loss: End combat after 1 full round (4 enemy actions)
        if (isScriptedLoss && scriptedTurnCount.current >= 4) {
          getAliveParty().forEach(p => {
            updateParticipant(p.id, { hp: 0 });
          });
          useWorldStateStore.getState().setFlag('smuggler_scripted_loss', false);
          return; // Stop here, let the victory/defeat effect handle the transition
        }

        nextTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    // Companion Turn Logic
    const current = getCurrentParticipant();
    if (phase === 'player-turn' && current?.isCompanion) {
         const timer = setTimeout(() => {
            const aliveEnemies = getAliveEnemies();
            if (aliveEnemies.length === 0) {
                nextTurn();
                return;
            }
            
            const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];

            const baseHitChance = 0.8;
            if (Math.random() > baseHitChance) {
              addLogEntry(`${current.name} attacks ${target.name} but misses!`);
              nextTurn();
              return;
            }

            const attackPower = current.attack;
            const defencePower = Math.max(0, target.defence);
            // FIX: Consistent defence multiplier
            let damage = Math.floor(attackPower * 1.4 - defencePower * 0.75);
            damage = Math.max(1, damage);
            
            const newHp = Math.max(0, target.hp - damage);
            updateParticipant(target.id, { hp: newHp });
            addLogEntry(`${current.name} attacks ${target.name} for ${damage} damage!`);
            
            if (newHp <= 0) {
                addLogEntry(`${target.name} is defeated!`);
            }
            
            nextTurn();
         }, 1000);
         return () => clearTimeout(timer);
    }
  }, [phase, currentTurnIndex, participants, isPlayerTurn, getCurrentParticipant, nextTurn, addLogEntry, getAliveEnemies, getAliveParty, addSkillXp, getSkillLevel, updateParticipant]);

  return (
    <CombatScreen
      party={participants.filter(p => p.isPlayer || p.isCompanion)}
      enemies={getAliveEnemies()}
      turnOrder={turnOrder.map(id => participants.find(p => p.id === id)).filter(Boolean) as CombatParticipant[]}
      activeCharacterId={getCurrentParticipant()?.id}
      selectedTargetId={selectedTargetId}
      isPlayerTurn={isPlayerTurn()}
      onSelectTarget={setSelectedTargetId}
      onAttack={handleAttack}
      onFlee={handleFlee}
      combatLog={log}
    />
  );
};

export default CombatManager;

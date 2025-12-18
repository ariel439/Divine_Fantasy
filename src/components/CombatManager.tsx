import React, { useEffect } from 'react';
import { useCombatStore, type CombatParticipant } from '../stores/useCombatStore';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useCompanionStore } from '../stores/useCompanionStore';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import CombatScreen from './screens/CombatScreen';
import { robertCaughtSlides } from '../data';

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
  const { addXp: addSkillXp } = useSkillStore();

  const scriptedTurnCount = React.useRef(0);

  const [selectedTargetId, setSelectedTargetId] = React.useState<string>('');

  // Auto-select first enemy if none selected
  useEffect(() => {
    if (!selectedTargetId) {
      const firstEnemy = getAliveEnemies()[0];
      if (firstEnemy) setSelectedTargetId(firstEnemy.id);
    }
  }, [participants, selectedTargetId, getAliveEnemies]);

  // Handle victory/defeat checks
  useEffect(() => {
    const aliveEnemies = getAliveEnemies();
    const aliveParty = getAliveParty();

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
        ui.setEventSlides(robertCaughtSlides);
        ui.setCurrentEventId('robert_caught');
        setScreen('event');
        passTime(5);
      }, 1500);
    }
  }, [participants, phase, rewards, setPhase, endCombat, setScreen, passTime, addItem, getAliveEnemies, getAliveParty]);

  const handleAttack = () => {
    if (!isPlayerTurn() || !selectedTargetId) return;
    
    const attacker = getCurrentParticipant();
    const target = participants.find(p => p.id === selectedTargetId);
    if (!attacker || !target || target.hp <= 0) return;

    // Simple damage calculation - reduced if target is defending
    const defenceMultiplier = target.defending ? 1.5 : 1;
    const damage = Math.max(1, attacker.attack - Math.floor(target.defence * defenceMultiplier) + Math.floor(Math.random() * 5) - 2);
    const newHp = Math.max(0, target.hp - damage);
    
    updateParticipant(target.id, { hp: newHp });
    addLogEntry(`${attacker.name} attacks ${target.name} for ${damage} damage!`);
    
    // Award attack skill XP to attacker
    if (attacker.isPlayer || attacker.isCompanion) {
      addSkillXp('attack', Math.floor(damage * 2)); // 2 XP per damage point
    }
    
    // Award defence skill XP to target for taking damage
    if ((target.isPlayer || target.isCompanion) && damage > 0) {
      addSkillXp('defence', Math.floor(damage)); // 1 XP per damage point taken
    }
    
    if (newHp <= 0) {
      addLogEntry(`${target.name} is defeated!`);
    }
    
    // End combat tutorial highlight after first attack
    if (useWorldStateStore.getState().getFlag('combat_tutorial_active')) {
      useWorldStateStore.getState().setFlag('combat_tutorial_active', false);
      useWorldStateStore.getState().setFlag('combat_tutorial_seen', true);
    }

    nextTurn();
  };

  const handleDefend = () => {
    if (!isPlayerTurn()) return;
    
    const defender = getCurrentParticipant();
    if (!defender) return;

    // Simple defend action - reduces damage taken next turn
    updateParticipant(defender.id, { defending: true });
    addLogEntry(`${defender.name} takes a defensive stance!`);
    
    nextTurn();
  };

  const handleFlee = () => {
    if (!isPlayerTurn()) return;
    
    // Simple flee logic - 70% base chance modified by agility difference
    const partyAgility = getAliveParty().reduce((sum, p) => sum + p.agility, 0) / getAliveParty().length;
    const enemyAgility = getAliveEnemies().reduce((sum, e) => sum + e.agility, 0) / getAliveEnemies().length;
    const fleeChance = Math.min(0.9, Math.max(0.1, 0.7 + (partyAgility - enemyAgility) * 0.05));
    
    if (Math.random() < fleeChance) {
      addLogEntry('Party successfully fled from combat!');
      // Award agility skill XP for successful flee
      getAliveParty().forEach(p => {
        if (p.isPlayer || p.isCompanion) {
          addSkillXp('agility', 10); // 10 XP for successful flee
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

  // Auto-advance enemy turns
  useEffect(() => {
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
          // Normal AI - attack random party member
          target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
          const defenceMultiplier = target.defending ? 1.5 : 1;
          damage = Math.max(1, currentEnemy.attack - Math.floor(target.defence * defenceMultiplier) + Math.floor(Math.random() * 3) - 1);
        }
        
        if (target) {
            const newHp = Math.max(0, target.hp - damage);
            
            updateParticipant(target.id, { hp: newHp });
            addLogEntry(`${currentEnemy.name} attacks ${target.name} for ${damage} damage!`);
            
            // Award defence skill XP to target for taking damage
            if ((target.isPlayer || target.isCompanion) && damage > 0) {
              addSkillXp('defence', Math.floor(damage)); // 1 XP per damage point taken
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
      }, 1500); // Enemy turn delay
      
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, phase, getCurrentParticipant, getAliveParty, nextTurn, updateParticipant, addLogEntry, currentTurnIndex]);

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
      onDefend={handleDefend}
      onFlee={handleFlee}
      combatLog={log}
    />
  );
};

export default CombatManager;

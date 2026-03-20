import React, { useEffect } from 'react';
import { useCombatStore } from '../stores/useCombatStore';
import type { CombatParticipant } from '../types';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useCompanionStore } from '../stores/useCompanionStore';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useAudioStore } from '../stores/useAudioStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useToastStore } from '../stores/useToastStore';
import { COMBAT_CONFIG } from '../config/combat';
import CombatScreen from './screens/CombatScreen';
import { robertCaughtSlides, gameOverSlides, raidVictorySlides } from '../data/events';
import { DialogueService } from '../services/DialogueService';

type DamageType = 'slash' | 'pierce' | 'blunt';
type ArmorClass = 'none' | 'light' | 'heavy';

const CombatManager: React.FC = () => {
  const {
    participants,
    turnOrder,
    currentTurnIndex,
    phase,
    rewards,
    encounterType,
    victoryActions,
    victoryToast,
    defeatMode,
    defeatToast,
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
  const { sfxEnabled, sfxVolume } = useAudioStore();
  const addToast = useToastStore.getState().addToast;

  const playSfx = (src: string) => {
    if (sfxEnabled && src) {
        try {
            const audio = new Audio(src);
            audio.volume = sfxVolume;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Combat SFX playback failed:", error);
                });
            }
        } catch (e) {
            console.error("Error creating/playing combat SFX:", e);
        }
    }
  };

  const getAttackSound = (attacker: CombatParticipant) => {
      // 1. Use specific sound if available on the participant
      if (attacker.attack_sound) {
          return attacker.attack_sound;
      }

      // 2. Player weapon logic
      if (attacker.isPlayer) {
          const weapon = useCharacterStore.getState().equippedItems.weapon;
          
          // Use weapon's specific sound if available
          if (weapon?.attack_sound) {
              return weapon.attack_sound;
          }
          
          // Fallback logic for weapons without configured sound
          if (weapon) {
              const id = weapon.id.toLowerCase();
              if (id.includes('sword') || id.includes('blade') || id.includes('knife') || id.includes('dagger') || id.includes('axe')) {
                  return COMBAT_CONFIG.DEFAULT_SFX.SWORD;
              }
          }
          return COMBAT_CONFIG.DEFAULT_SFX.ATTACK;
      }
      
      // 3. Legacy fallback for enemies/companions without configured sound
      const name = attacker.name.toLowerCase();

      if (name.includes('wolf')) {
          return COMBAT_CONFIG.DEFAULT_SFX.WOLF;
      }
      
      if (name.includes('bandit') || name.includes('smuggler') || name.includes('guard') || attacker.isCompanion) {
           return COMBAT_CONFIG.DEFAULT_SFX.SWORD;
      }

      return COMBAT_CONFIG.DEFAULT_SFX.ATTACK;
  };

  const scriptedTurnCount = React.useRef(0);

  const [selectedTargetId, setSelectedTargetId] = React.useState<string>('');

  const aliveEnemies = React.useMemo(() => getAliveEnemies(), [participants, getAliveEnemies]);
  const aliveParty = React.useMemo(() => getAliveParty(), [participants, getAliveParty]);
  const sortedTurnOrder = React.useMemo(() => turnOrder.map(id => participants.find(p => p.id === id)).filter(Boolean) as CombatParticipant[], [turnOrder, participants]);
  const syncPlayerVitalsFromCombat = React.useCallback((fallbackHp?: number) => {
    const playerCombatant = participants.find((p) => p.isPlayer);
    useCharacterStore.setState((state) => ({
      ...state,
      hp: fallbackHp !== undefined
        ? Math.max(1, Math.min(state.maxHp || 100, fallbackHp))
        : Math.max(1, Math.min(state.maxHp || 100, playerCombatant?.hp ?? state.hp)),
    }));
  }, [participants]);
  const getBaseHitChance = React.useCallback((attacker: CombatParticipant) => {
    let chance = attacker.isPlayer
      ? COMBAT_CONFIG.BASE_HIT_CHANCE.PLAYER
      : attacker.isCompanion
        ? COMBAT_CONFIG.BASE_HIT_CHANCE.COMPANION
        : COMBAT_CONFIG.BASE_HIT_CHANCE.ENEMY;

    const attackerName = attacker.name.toLowerCase();
    if (attackerName.includes('wolf')) chance += 0.12;
    if (attackerName.includes('drunk')) chance -= 0.05;

    return Math.max(0.1, Math.min(0.95, chance));
  }, []);
  const getAttackType = React.useCallback((attacker: CombatParticipant, isBrawl: boolean): DamageType => {
    if (isBrawl) return 'blunt';

    if (attacker.isPlayer) {
      const weaponId = useCharacterStore.getState().equippedItems.weapon?.id?.toLowerCase() || '';
      if (weaponId.includes('knife') || weaponId.includes('dagger')) return 'pierce';
      if (weaponId.includes('sword') || weaponId.includes('blade') || weaponId.includes('axe')) return 'slash';
      if (weaponId.includes('mace') || weaponId.includes('club') || weaponId.includes('hammer')) return 'blunt';
    }

    const attackerName = attacker.name.toLowerCase();
    if (attackerName.includes('wolf')) return 'slash';
    if (attackerName.includes('drunk') || attackerName.includes('brawler')) return 'blunt';
    if (attackerName.includes('knife')) return 'pierce';
    if (attackerName.includes('smuggler') || attackerName.includes('thug') || attackerName.includes('finn')) return 'slash';

    return 'blunt';
  }, []);
  const getArmorClass = React.useCallback((target: CombatParticipant): ArmorClass => {
    if (!target.isPlayer && !target.isCompanion) return 'none';

    const equipped = useCharacterStore.getState().equippedItems;
    const equippedIds = Object.values(equipped).map((item) => item?.id || '');
    const hasHeavy = equippedIds.some((id) => id.startsWith('iron_'));
    const hasLight = equippedIds.some((id) => id.startsWith('wolf_'));

    if (hasHeavy) return 'heavy';
    if (hasLight) return 'light';
    return 'none';
  }, []);
  const getTypeMultiplier = React.useCallback((damageType: DamageType, armorClass: ArmorClass) => {
    if (armorClass === 'none') {
      if (damageType === 'pierce') return 1.15;
      if (damageType === 'slash') return 1.05;
      return 1;
    }
    if (armorClass === 'light') {
      if (damageType === 'slash') return 0.82;
      if (damageType === 'pierce') return 0.95;
      return 0.72;
    }
    if (damageType === 'slash') return 0.68;
    if (damageType === 'pierce') return 0.78;
    return 0.45;
  }, []);
  const getBrawlProfile = React.useCallback((target: CombatParticipant) => {
    if (target.defence >= 10) return { multiplier: 0.95, defenceFactor: 1.1, minDamage: 1 };
    if (target.defence >= 5) return { multiplier: 1.15, defenceFactor: 0.85, minDamage: 3 };
    return { multiplier: 1.55, defenceFactor: 0.25, minDamage: 8 };
  }, []);

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

    if (aliveEnemies.length === 0 && phase !== 'victory' && phase !== 'defeat' && phase !== 'fled') {
      setPhase('victory');
      addLogEntry('Victory!');

      if (encounterType === 'brawl') {
        victoryActions.forEach((action) => DialogueService.executeAction(action));
        getAliveParty().forEach((p) => {
          if (p.isPlayer || p.isCompanion) {
            addSkillXp('attack', 10);
            addSkillXp('agility', 2);
          }
        });
        setTimeout(() => {
          if (victoryToast) {
            addToast(victoryToast, 'success', 3500, 'Brawl Won');
          }
          syncPlayerVitalsFromCombat();
          useCharacterStore.setState((state) => ({
            ...state,
            energy: Math.max(0, state.energy - 10),
          }));
          endCombat();
          setScreen('inGame');
          passTime(10);
        }, 1000);
        return;
      }
      
      // Check if this was the Finn Raid
      const finnWasPresent = participants.some(p => p.name === 'Finn' || p.id.startsWith('finn_'));

      if (finnWasPresent) {
          setTimeout(() => {
            const ui = useUIStore.getState();
            ui.setEventSlides(raidVictorySlides);
            ui.setCurrentEventId('raid_victory');
            setScreen('event');
            endCombat();
          }, 1500);
      } else {
        // Grant rewards - XP goes to skills, handled elsewhere
        // Loot is now handled by the LootScreen, not auto-added
        
        // Show victory screen after short delay
        setTimeout(() => {
          syncPlayerVitalsFromCombat();
          setScreen('combatVictory');
        }, 1000);
      }
    } else if (aliveParty.length === 0) {
      setPhase('defeat');
      setTimeout(() => {
        if (defeatMode === 'knockout') {
          syncPlayerVitalsFromCombat(12);
          useCharacterStore.setState((state) => ({
            ...state,
            energy: Math.max(0, state.energy - 15),
          }));
          if (defeatToast) {
            addToast(defeatToast, 'warning', 3500, 'Brawl Lost');
          }
          endCombat();
          setScreen('inGame');
          passTime(15);
          return;
        }

        const ui = useUIStore.getState();
        const isIntroMode = useWorldStateStore.getState().introMode;
        
        if (isIntroMode) {
          ui.setEventSlides(robertCaughtSlides);
          ui.setCurrentEventId('robert_caught');
          setScreen('event');
        } else {
          ui.setEventSlides(gameOverSlides);
          ui.setCurrentEventId('game_over');
          setScreen('event');
        }
        
        // End combat after setting screen to avoid empty combat screen flash
        syncPlayerVitalsFromCombat(1);
        endCombat();
        passTime(5);
      }, 1500);
    }
  }, [aliveEnemies.length, aliveParty.length, phase, rewards, setPhase, endCombat, setScreen, passTime, addItem, encounterType, victoryActions, victoryToast, defeatMode, defeatToast, syncPlayerVitalsFromCombat]);

  const handleAttack = () => {
    if (!isPlayerTurn() || !selectedTargetId) return;
    
    const attacker = getCurrentParticipant();
    const target = participants.find(p => p.id === selectedTargetId);
    if (!attacker || !target || target.hp <= 0) return;

    const isBrawl = encounterType === 'brawl';

    const baseHitChance = getBaseHitChance(attacker);

    if (Math.random() > baseHitChance) {
      addLogEntry(`${attacker.name} attacks ${target.name} but misses!`);
      playSfx(COMBAT_CONFIG.DEFAULT_SFX.MISS);
      // Brief delay so the miss is visible/audible before next turn
      setTimeout(() => {
        nextTurn();
      }, 450);
      return;
    }

    const attackPower = attacker.attack;
    const defencePower = Math.max(0, target.defence);
    const damageType = getAttackType(attacker, isBrawl);
    const armorClass = getArmorClass(target);
    const typeMultiplier = getTypeMultiplier(damageType, armorClass);
    
    let damage = 0;
    if (attacker.isPlayer) {
        const brawlProfile = isBrawl ? getBrawlProfile(target) : null;
        const multiplier = isBrawl ? brawlProfile!.multiplier : COMBAT_CONFIG.DAMAGE_FORMULA.PLAYER_MULTIPLIER;
        const defenceFactor = isBrawl ? brawlProfile!.defenceFactor : COMBAT_CONFIG.DAMAGE_FORMULA.PLAYER_DEFENCE_FACTOR;
        const minDamage = isBrawl ? brawlProfile!.minDamage : COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.PLAYER;
        damage = Math.floor((attackPower * multiplier - defencePower * defenceFactor) * typeMultiplier);
        damage = Math.max(minDamage, damage);
    } else if (attacker.isCompanion) {
        const brawlProfile = isBrawl ? getBrawlProfile(target) : null;
        const multiplier = isBrawl ? Math.max(0.9, brawlProfile!.multiplier - 0.2) : COMBAT_CONFIG.DAMAGE_FORMULA.COMPANION_MULTIPLIER;
        const defenceFactor = isBrawl ? brawlProfile!.defenceFactor : COMBAT_CONFIG.DAMAGE_FORMULA.COMPANION_DEFENCE_FACTOR;
        const minDamage = isBrawl ? Math.max(1, brawlProfile!.minDamage - 2) : COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.COMPANION;
        damage = Math.floor((attackPower * multiplier - defencePower * defenceFactor) * typeMultiplier);
        damage = Math.max(minDamage, damage);
    } else {
        const brawlProfile = isBrawl ? getBrawlProfile(target) : null;
        const multiplier = isBrawl ? Math.max(0.9, brawlProfile!.multiplier - 0.1) : COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_MULTIPLIER;
        const defenceFactor = isBrawl ? brawlProfile!.defenceFactor : COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_DEFENCE_FACTOR;
        const minDamage = isBrawl ? brawlProfile!.minDamage : COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.ENEMY;
        damage = Math.floor((attackPower * multiplier - defencePower * defenceFactor) * typeMultiplier);
        damage = Math.max(minDamage, damage);
    }

    const newHp = Math.max(0, target.hp - damage);

    updateParticipant(target.id, { hp: newHp });
    addLogEntry(`${attacker.name} attacks ${target.name} for ${damage} damage!`);

    if (attacker.isPlayer || attacker.isCompanion) {
      addSkillXp('attack', Math.floor(damage * 2));
    }

    playSfx(isBrawl ? COMBAT_CONFIG.DEFAULT_SFX.ATTACK : getAttackSound(attacker));

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
    
    // Simple flee logic - base chance modified by dexterity difference
    const partyDexterity = getAliveParty().reduce((sum, p) => sum + p.dexterity, 0) / getAliveParty().length;
    const enemyDexterity = getAliveEnemies().reduce((sum, e) => sum + e.dexterity, 0) / getAliveEnemies().length;
    
    const fleeChance = Math.min(
      COMBAT_CONFIG.FLEE.MAX_CHANCE, 
      Math.max(
        COMBAT_CONFIG.FLEE.MIN_CHANCE, 
        COMBAT_CONFIG.FLEE.BASE_CHANCE + (partyDexterity - enemyDexterity) * COMBAT_CONFIG.FLEE.DEX_FACTOR
      )
    );
    
    if (Math.random() < fleeChance) {
      addLogEntry('Party successfully fled from combat!');
      // Award dexterity skill XP for successful flee
      getAliveParty().forEach(p => {
        if (p.isPlayer || p.isCompanion) {
          addSkillXp('agility', 10); // 10 XP for successful flee
        }
      });
      setPhase('fled');
      setTimeout(() => {
        syncPlayerVitalsFromCombat();
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
          playSfx(getAttackSound(currentEnemy));
        } else {
          target = aliveParty[Math.floor(Math.random() * aliveParty.length)];

          const baseHitChance = getBaseHitChance(currentEnemy);
          if (Math.random() > baseHitChance) {
            addLogEntry(`${currentEnemy.name} attacks ${target.name} but misses!`);
            playSfx(COMBAT_CONFIG.DEFAULT_SFX.MISS);
            setTimeout(() => {
              nextTurn();
            }, 450);
            return;
          }

          const attackPower = currentEnemy.attack;
          const defencePower = Math.max(0, target.defence);
          const damageType = getAttackType(currentEnemy, encounterType === 'brawl');
          const armorClass = getArmorClass(target);
          const typeMultiplier = getTypeMultiplier(damageType, armorClass);
          // Enemies deal slightly less multiplier damage, armor is more effective
          if (encounterType === 'brawl') {
            const brawlProfile = getBrawlProfile(target);
            damage = Math.floor((attackPower * Math.max(0.9, brawlProfile.multiplier - 0.1) - defencePower * brawlProfile.defenceFactor) * typeMultiplier);
            damage = Math.max(brawlProfile.minDamage, damage);
          } else {
            damage = Math.floor((attackPower * COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_MULTIPLIER - defencePower * COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_DEFENCE_FACTOR) * typeMultiplier);
            damage = Math.max(COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.ENEMY, damage);
          }
          
          playSfx(encounterType === 'brawl' ? COMBAT_CONFIG.DEFAULT_SFX.ATTACK : getAttackSound(currentEnemy));
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
      }, 650);
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

            const baseHitChance = getBaseHitChance(current);
            if (Math.random() > baseHitChance) {
              addLogEntry(`${current.name} attacks ${target.name} but misses!`);
              playSfx(COMBAT_CONFIG.DEFAULT_SFX.MISS);
              setTimeout(() => {
                nextTurn();
              }, 450);
              return;
            }

            const attackPower = current.attack;
            const defencePower = Math.max(0, target.defence);
            const damageType = getAttackType(current, encounterType === 'brawl');
            const armorClass = getArmorClass(target);
            const typeMultiplier = getTypeMultiplier(damageType, armorClass);
            // Balanced companion damage
            let damage = 0;
            if (encounterType === 'brawl') {
              const brawlProfile = getBrawlProfile(target);
              damage = Math.floor((attackPower * Math.max(0.9, brawlProfile.multiplier - 0.2) - defencePower * brawlProfile.defenceFactor) * typeMultiplier);
              damage = Math.max(Math.max(1, brawlProfile.minDamage - 2), damage);
            } else {
              damage = Math.floor((attackPower * COMBAT_CONFIG.DAMAGE_FORMULA.COMPANION_MULTIPLIER - defencePower * COMBAT_CONFIG.DAMAGE_FORMULA.COMPANION_DEFENCE_FACTOR) * typeMultiplier);
              damage = Math.max(COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.COMPANION, damage);
            }
            
            playSfx(encounterType === 'brawl' ? COMBAT_CONFIG.DEFAULT_SFX.ATTACK : getAttackSound(current));
            
            const newHp = Math.max(0, target.hp - damage);
            updateParticipant(target.id, { hp: newHp });
            addLogEntry(`${current.name} attacks ${target.name} for ${damage} damage!`);
            
            if (newHp <= 0) {
                addLogEntry(`${target.name} is defeated!`);
            }
            
            nextTurn();
         }, 650);
         return () => clearTimeout(timer);
    }
  }, [phase, currentTurnIndex, participants, isPlayerTurn, getCurrentParticipant, nextTurn, addLogEntry, getAliveEnemies, getAliveParty, addSkillXp, getSkillLevel, updateParticipant, encounterType, getBrawlProfile, getBaseHitChance, getAttackType, getArmorClass, getTypeMultiplier]);

  return (
    <CombatScreen
      party={participants.filter(p => p.isPlayer || p.isCompanion)}
      enemies={participants.filter(p => !p.isPlayer && !p.isCompanion)}
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

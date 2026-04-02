import React, { useEffect } from 'react';
import { useCombatStore } from '../stores/useCombatStore';
import type { CombatParticipant } from '../types';
import { useCharacterStore } from '../stores/useCharacterStore';
import { useCompanionStore } from '../stores/useCompanionStore';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useAudioStore } from '../stores/useAudioStore';
import { useSkillStore } from '../stores/useSkillStore';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useToastStore } from '../stores/useToastStore';
import { COMBAT_CONFIG } from '../config/combat';
import CombatScreen from './screens/CombatScreen';
import { robertCaughtSlides, gameOverSlides, raidVictorySlides, finnPersonalKillSlides } from '../data/events';
import { DialogueService } from '../services/DialogueService';

const CombatManager: React.FC = () => {
  const {
    participants,
    turnOrder,
    currentTurnIndex,
    phase,
    encounterType,
    victoryActions,
    victoryToast,
    victoryEventId,
    defeatMode,
    defeatToast,
    allowFlee,
    log,
    getCurrentParticipant,
    getAliveEnemies,
    getAliveParty,
    isPlayerTurn,
    nextTurn,
    setPhase,
    setRewards,
    updateParticipant,
    addLogEntry,
    endCombat,
  } = useCombatStore();

  const { setScreen } = useUIStore();
  const { passTime } = useWorldTimeStore();
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
  const resolutionHandledRef = React.useRef(false);

  const [selectedTargetId, setSelectedTargetId] = React.useState<string>('');
  const [actionLocked, setActionLocked] = React.useState(false);
  const [thunderStrikeIds, setThunderStrikeIds] = React.useState<string[]>([]);

  useEffect(() => {
    if (phase === 'setup' || participants.length === 0) {
      resolutionHandledRef.current = false;
    }
  }, [phase, participants.length]);

  const getEffectiveFrontTargets = React.useCallback((combatants: CombatParticipant[]) => {
    const aliveFront = combatants.filter((p) => p.hp > 0 && p.combatRow === 'front');
    if (aliveFront.length > 0) return aliveFront;
    return combatants.filter((p) => p.hp > 0 && p.combatRow === 'back');
  }, []);

  const getCurrentWeapon = React.useCallback(() => useCharacterStore.getState().equippedItems.weapon, []);
  const hasRowCleaveWeapon = React.useCallback((attacker: CombatParticipant) => {
    if (!attacker.isPlayer) return false;
    const weapon = getCurrentWeapon();
    return Boolean(weapon?.combatTags?.includes('row_cleave'));
  }, [getCurrentWeapon]);
  const hasStormBoardWeapon = React.useCallback((attacker: CombatParticipant) => {
    if (!attacker.isPlayer) return false;
    const weapon = getCurrentWeapon();
    return Boolean(weapon?.combatTags?.includes('storm_board'));
  }, [getCurrentWeapon]);

  const aliveEnemies = React.useMemo(() => getAliveEnemies(), [participants, getAliveEnemies]);
  const aliveParty = React.useMemo(() => getAliveParty(), [participants, getAliveParty]);
  const targetableEnemies = React.useMemo(() => getEffectiveFrontTargets(aliveEnemies), [aliveEnemies, getEffectiveFrontTargets]);
  const targetableParty = React.useMemo(() => getEffectiveFrontTargets(aliveParty), [aliveParty, getEffectiveFrontTargets]);
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

      chance += attacker.accuracyModifier ?? 0;
  
      return Math.max(0.1, Math.min(0.95, chance));
    }, []);
  const getBrawlProfile = React.useCallback((target: CombatParticipant) => {
    if (target.defence >= 10) return { multiplier: 0.95, defenceFactor: 1.1, minDamage: 1 };
    if (target.defence >= 5) return { multiplier: 1.15, defenceFactor: 0.85, minDamage: 3 };
    return { multiplier: 1.55, defenceFactor: 0.25, minDamage: 8 };
  }, []);
  const rollCombatLoot = React.useCallback(() => {
    const lootMap = new Map<string, number>();

    participants
      .filter((p) => !p.isPlayer && !p.isCompanion && p.hp <= 0)
      .forEach((enemy) => {
        enemy.lootTable?.forEach((drop) => {
          if (Math.random() <= drop.chance) {
            lootMap.set(drop.item_id, (lootMap.get(drop.item_id) || 0) + drop.quantity);
          }
        });
      });

    return Array.from(lootMap.entries()).map(([itemId, quantity]) => ({ itemId, quantity }));
  }, [participants]);

  // Keep target selection sane as enemy counts change
  useEffect(() => {
    if (targetableEnemies.length === 1) {
      const loneEnemy = targetableEnemies[0];
      if (loneEnemy && selectedTargetId !== loneEnemy.id) {
        setSelectedTargetId(loneEnemy.id);
      }
      return;
    }

    const currentTargetStillAlive = targetableEnemies.some((enemy) => enemy.id === selectedTargetId);
    if ((!selectedTargetId || !currentTargetStillAlive) && targetableEnemies.length > 0) {
      const firstEnemy = targetableEnemies[0];
      if (firstEnemy) setSelectedTargetId(firstEnemy.id);
    }
  }, [targetableEnemies, selectedTargetId]);

  useEffect(() => {
    if (thunderStrikeIds.length === 0) return;
    const timer = setTimeout(() => setThunderStrikeIds([]), 700);
    return () => clearTimeout(timer);
  }, [thunderStrikeIds]);

  // Handle victory/defeat checks
  useEffect(() => {
    if (phase === 'setup') return;

    if (resolutionHandledRef.current) return;

    if (aliveEnemies.length === 0 && phase !== 'victory' && phase !== 'defeat' && phase !== 'fled') {
      resolutionHandledRef.current = true;
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
      
      const renZhenWasPresent = participants.some((p) => p.id === 'ren_zhen_shadow' || p.name === "Ren Zhen's Shadow");
      if (renZhenWasPresent) {
        setTimeout(() => {
          useWorldStateStore.getState().setFlag('whitefang_renzhen_shadow_defeated', true);
          const ui = useUIStore.getState();
          ui.setEventSlides(null);
          ui.setCurrentEventId('whitefang_binding_choice');
          setScreen('choiceEvent');
          endCombat();
        }, 1400);
        return;
      }

      if (victoryEventId === 'ronald_wolf_pup_choice') {
          setTimeout(() => {
            useWorldStateStore.getState().setFlag('ronald_wolf_pack_cleared', true);
            try { DialogueService.executeAction('set_quest_stage:ronald_wolf_pack:3'); } catch {}
            syncPlayerVitalsFromCombat();
            const ui = useUIStore.getState();
            ui.setEventSlides(null);
            ui.setCurrentEventId('ronald_wolf_pup_choice');
            setScreen('choiceEvent');
            endCombat();
          }, 1200);
      } else if (victoryEventId === 'raid_victory') {
          setTimeout(() => {
            const ui = useUIStore.getState();
            ui.setEventSlides(raidVictorySlides);
            ui.setCurrentEventId('raid_victory');
            setScreen('event');
            endCombat();
          }, 1500);
      } else if (victoryEventId === 'finn_personal_kill_end') {
          setTimeout(() => {
            const ui = useUIStore.getState();
            ui.setEventSlides(finnPersonalKillSlides);
            ui.setCurrentEventId('finn_personal_kill_end');
            setScreen('event');
            endCombat();
          }, 1500);
      } else {
        setRewards({ xp: 0, loot: rollCombatLoot() });
        
        // Show victory screen after short delay
        setTimeout(() => {
          syncPlayerVitalsFromCombat();
          setScreen('combatVictory');
        }, 1000);
      }
    } else if (aliveParty.length === 0) {
      resolutionHandledRef.current = true;
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
        syncPlayerVitalsFromCombat(10);
        endCombat();
        passTime(5);
      }, 1500);
    }
  }, [aliveEnemies.length, aliveParty.length, phase, setPhase, setRewards, endCombat, setScreen, passTime, encounterType, victoryActions, victoryToast, victoryEventId, defeatMode, defeatToast, syncPlayerVitalsFromCombat, participants, rollCombatLoot]);

  const handleAttack = () => {
    if (!isPlayerTurn() || !selectedTargetId || actionLocked) return;
    
    const attacker = getCurrentParticipant();
    const target = participants.find(p => p.id === selectedTargetId);
    if (!attacker || !target || target.hp <= 0) return;
    if (!targetableEnemies.some((enemy) => enemy.id === target.id)) return;

    const isBrawl = encounterType === 'brawl';

    const baseHitChance = getBaseHitChance(attacker);

    if (Math.random() > baseHitChance) {
      setActionLocked(true);
      addLogEntry(`${attacker.name} attacks ${target.name} but misses!`);
      playSfx(COMBAT_CONFIG.DEFAULT_SFX.MISS);
      // Brief delay so the miss is visible/audible before next turn
      setTimeout(() => {
        setActionLocked(false);
        nextTurn();
      }, 450);
      return;
    }

    setActionLocked(true);

    const attackPower = attacker.attack;
    const defencePower = Math.max(0, target.defence);
    const typeMultiplier = 1;
    
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

    const rowTargets = hasRowCleaveWeapon(attacker)
      ? targetableEnemies.filter((enemy) => enemy.combatRow === target.combatRow)
      : [target];

    playSfx(isBrawl ? COMBAT_CONFIG.DEFAULT_SFX.ATTACK : getAttackSound(attacker));
    const hasStormFollowup = hasStormBoardWeapon(attacker);

    const applyRowDamage = () => {
      rowTargets.forEach((rowTarget) => {
        const rowTargetDefence = Math.max(0, rowTarget.defence);
        const rowTypeMultiplier = 1;
        let rowDamage = damage;

        if (rowTarget.id !== target.id) {
          if (attacker.isPlayer) {
            const brawlProfile = isBrawl ? getBrawlProfile(rowTarget) : null;
            const multiplier = isBrawl ? brawlProfile!.multiplier : COMBAT_CONFIG.DAMAGE_FORMULA.PLAYER_MULTIPLIER;
            const defenceFactor = isBrawl ? brawlProfile!.defenceFactor : COMBAT_CONFIG.DAMAGE_FORMULA.PLAYER_DEFENCE_FACTOR;
            const minDamage = isBrawl ? brawlProfile!.minDamage : COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.PLAYER;
            rowDamage = Math.floor((attackPower * multiplier - rowTargetDefence * defenceFactor) * rowTypeMultiplier);
            rowDamage = Math.max(minDamage, rowDamage);
          }
        }

        const newHp = Math.max(0, rowTarget.hp - rowDamage);
        updateParticipant(rowTarget.id, { hp: newHp });
        addLogEntry(`${attacker.name} attacks ${rowTarget.name} for ${rowDamage} damage!`);

        if (attacker.isPlayer || attacker.isCompanion) {
          addSkillXp('attack', Math.floor(rowDamage * 2));
        }

        if (rowTarget.isPlayer && newHp > 0) {
          addSkillXp('defence', Math.floor(rowDamage * 2));
        }

        if (newHp <= 0) {
          addLogEntry(`${rowTarget.name} is defeated!`);
        }
      });
    };

    const applyThunderDamage = () => {
      const currentEnemyState = useCombatStore.getState().participants.filter((p) => !p.isPlayer && !p.isCompanion && p.hp > 0);
      const thunderDamage = Math.max(2, Math.floor(attackPower * 0.45));
      const struckIds: string[] = [];

      playSfx('/assets/sfx/combat_thunder_strike.mp3');

      currentEnemyState.forEach((enemy) => {
        const newHp = Math.max(0, enemy.hp - thunderDamage);
        updateParticipant(enemy.id, { hp: newHp });
        addLogEntry(`Lightning from ${attacker.name} lashes ${enemy.name} for ${thunderDamage} damage!`);
        struckIds.push(enemy.id);

        if (attacker.isPlayer || attacker.isCompanion) {
          addSkillXp('attack', Math.floor(thunderDamage * 2));
        }

        if (newHp <= 0) {
          addLogEntry(`${enemy.name} is defeated!`);
        }
      });

      setThunderStrikeIds(struckIds);
    };

    setTimeout(() => {
      applyRowDamage();

      if (hasStormFollowup) {
        setTimeout(() => {
          applyThunderDamage();
          if (useWorldStateStore.getState().getFlag('combat_tutorial_active')) {
            useWorldStateStore.getState().setFlag('combat_tutorial_active', false);
            useWorldStateStore.getState().setFlag('combat_tutorial_seen', true);
          }
          setTimeout(() => {
            setActionLocked(false);
            nextTurn();
          }, 700);
        }, 550);
      } else {
        if (useWorldStateStore.getState().getFlag('combat_tutorial_active')) {
          useWorldStateStore.getState().setFlag('combat_tutorial_active', false);
          useWorldStateStore.getState().setFlag('combat_tutorial_seen', true);
        }
        setTimeout(() => {
          setActionLocked(false);
          nextTurn();
        }, 500);
      }
    }, 180);
  };

  const handleFlee = () => {
    if (!allowFlee || !isPlayerTurn() || actionLocked) return;
    
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
          const robert = targetableParty.find(p => p.isCompanion);
          target = robert || targetableParty[0];
          
          damage = 15; // Fixed high damage for cinematic feel
          scriptedTurnCount.current += 1;
          playSfx(getAttackSound(currentEnemy));
        } else {
          target = targetableParty[Math.floor(Math.random() * targetableParty.length)];

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
          const typeMultiplier = 1;
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

        const isRenZhenShadow = currentEnemy.id === 'ren_zhen_shadow' || currentEnemy.name === "Ren Zhen's Shadow";

        if (target) {
          if (isRenZhenShadow) {
            const preferredRowTargets = targetableParty.filter((ally) => ally.combatRow === target!.combatRow);
            const rowTargets = preferredRowTargets.length > 0 ? preferredRowTargets : targetableParty;

            rowTargets.forEach((rowTarget) => {
              const defencePower = Math.max(0, rowTarget.defence);
              const typeMultiplier = 1;
              let rowDamage = Math.floor((currentEnemy.attack * COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_MULTIPLIER - defencePower * COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_DEFENCE_FACTOR) * typeMultiplier);
              rowDamage = Math.max(COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.ENEMY + 4, rowDamage);

              const newHp = Math.max(0, rowTarget.hp - rowDamage);
              updateParticipant(rowTarget.id, { hp: newHp });
              addLogEntry(`${currentEnemy.name} cuts through ${rowTarget.name} for ${rowDamage} damage!`);

              if (rowTarget.isPlayer && rowDamage > 0) {
                addSkillXp('defence', Math.floor(rowDamage * 2));
              }

              if (newHp <= 0) {
                addLogEntry(`${rowTarget.name} is defeated!`);
              }
            });

            setTimeout(() => {
              const survivors = useCombatStore.getState().participants.filter((p) => (p.isPlayer || p.isCompanion) && p.hp > 0);
              const thunderDamage = Math.max(8, Math.floor(currentEnemy.attack * 0.4));
              const struckIds: string[] = [];

              playSfx('/assets/sfx/combat_thunder_strike.mp3');

              survivors.forEach((survivor) => {
                const newHp = Math.max(0, survivor.hp - thunderDamage);
                updateParticipant(survivor.id, { hp: newHp });
                addLogEntry(`Lightning from ${currentEnemy.name} lashes ${survivor.name} for ${thunderDamage} damage!`);
                struckIds.push(survivor.id);

                if (survivor.isPlayer && thunderDamage > 0) {
                  addSkillXp('defence', Math.floor(thunderDamage * 2));
                }

                if (newHp <= 0) {
                  addLogEntry(`${survivor.name} is defeated!`);
                }
              });

              setThunderStrikeIds(struckIds);
              nextTurn();
            }, 650);

            return;
          }

          const newHp = Math.max(0, target.hp - damage);

          updateParticipant(target.id, { hp: newHp });
          addLogEntry(`${currentEnemy.name} attacks ${target.name} for ${damage} damage!`);

          // Award defence skill XP to target for taking damage
          if (target.isPlayer && damage > 0) {
            addSkillXp('defence', Math.floor(damage * 2)); // 2 XP per damage taken
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
            if (aliveEnemies.length === 0 || targetableEnemies.length === 0) {
                nextTurn();
                return;
            }
            
            const target = targetableEnemies[Math.floor(Math.random() * targetableEnemies.length)];

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
            const typeMultiplier = 1;
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
  }, [phase, currentTurnIndex, participants, isPlayerTurn, getCurrentParticipant, nextTurn, addLogEntry, getAliveEnemies, getAliveParty, targetableEnemies, targetableParty, addSkillXp, getSkillLevel, updateParticipant, encounterType, getBrawlProfile, getBaseHitChance]);

    return (
      <CombatScreen
        party={participants.filter(p => (p.isPlayer || p.isCompanion) && p.hp > 0)}
        enemies={participants.filter(p => !p.isPlayer && !p.isCompanion && p.hp > 0)}
        turnOrder={turnOrder.map(id => participants.find(p => p.id === id)).filter(Boolean) as CombatParticipant[]}
        activeCharacterId={getCurrentParticipant()?.id}
        selectedTargetId={selectedTargetId}
        targetableEnemyIds={targetableEnemies.map((enemy) => enemy.id)}
        thunderStrikeIds={thunderStrikeIds}
        isPlayerTurn={isPlayerTurn() && !actionLocked}
        onSelectTarget={(enemyId) => {
          if (!actionLocked) setSelectedTargetId(enemyId);
        }}
        onAttack={handleAttack}
        onFlee={handleFlee}
        canFlee={allowFlee}
        combatLog={log}
      />
  );
};

export default CombatManager;

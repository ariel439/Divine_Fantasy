import type { CombatEncounterType, CombatParticipant } from '../../types';
import { COMBAT_CONFIG } from '../../config/combat';

export interface BrawlProfile {
  multiplier: number;
  defenceFactor: number;
  minDamage: number;
}

export function isPartyMember(participant: CombatParticipant): boolean {
  return Boolean(participant.isPlayer || participant.isCompanion);
}

export function getBaseHitChance(attacker: CombatParticipant): number {
  let chance = attacker.isPlayer
    ? COMBAT_CONFIG.BASE_HIT_CHANCE.PLAYER
    : attacker.isCompanion
      ? COMBAT_CONFIG.BASE_HIT_CHANCE.COMPANION
      : COMBAT_CONFIG.BASE_HIT_CHANCE.ENEMY;

  chance += attacker.accuracyModifier ?? 0;
  return Math.max(0.1, Math.min(0.95, chance));
}

export function getBrawlProfile(target: CombatParticipant): BrawlProfile {
  if (target.defence >= 10) return { multiplier: 0.95, defenceFactor: 1.1, minDamage: 1 };
  if (target.defence >= 5) return { multiplier: 1.15, defenceFactor: 0.85, minDamage: 3 };
  return { multiplier: 1.55, defenceFactor: 0.25, minDamage: 8 };
}

export function getMeleeMilestoneMultiplier(attacker: CombatParticipant, meleeLevel: number): number {
  if (!attacker.isPlayer) return 1;
  return 1 + Math.floor(meleeLevel / 10) * 0.1;
}

export function applyOutgoingDamageModifiers(
  attacker: CombatParticipant,
  damage: number,
  minDamage: number,
  meleeLevel: number
): number {
  const participantMultiplier = attacker.damageMultiplier ?? 1;
  const meleeMultiplier = getMeleeMilestoneMultiplier(attacker, meleeLevel);
  return Math.max(minDamage, Math.floor(damage * participantMultiplier * meleeMultiplier));
}

export function calculateDamage(
  attacker: CombatParticipant,
  target: CombatParticipant,
  encounterType: CombatEncounterType,
  meleeLevel: number,
  override?: { attackPower?: number; targetDefence?: number }
): number {
  const isBrawl = encounterType === 'brawl';
  const attackPower = override?.attackPower ?? attacker.attack;
  const defencePower = Math.max(0, override?.targetDefence ?? target.defence);
  const typeMultiplier = 1;

  if (attacker.isPlayer) {
    const brawl = isBrawl ? getBrawlProfile(target) : null;
    const multiplier = isBrawl ? brawl!.multiplier : COMBAT_CONFIG.DAMAGE_FORMULA.PLAYER_MULTIPLIER;
    const defenceFactor = isBrawl ? brawl!.defenceFactor : COMBAT_CONFIG.DAMAGE_FORMULA.PLAYER_DEFENCE_FACTOR;
    const minDamage = isBrawl ? brawl!.minDamage : COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.PLAYER;
    let damage = Math.floor((attackPower * multiplier - defencePower * defenceFactor) * typeMultiplier);
    damage = Math.max(minDamage, damage);
    return applyOutgoingDamageModifiers(attacker, damage, minDamage, meleeLevel);
  }

  if (attacker.isCompanion) {
    const brawl = isBrawl ? getBrawlProfile(target) : null;
    const multiplier = isBrawl ? Math.max(0.9, brawl!.multiplier - 0.2) : COMBAT_CONFIG.DAMAGE_FORMULA.COMPANION_MULTIPLIER;
    const defenceFactor = isBrawl ? brawl!.defenceFactor : COMBAT_CONFIG.DAMAGE_FORMULA.COMPANION_DEFENCE_FACTOR;
    const minDamage = isBrawl ? Math.max(1, brawl!.minDamage - 2) : COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.COMPANION;
    let damage = Math.floor((attackPower * multiplier - defencePower * defenceFactor) * typeMultiplier);
    damage = Math.max(minDamage, damage);
    return applyOutgoingDamageModifiers(attacker, damage, minDamage, meleeLevel);
  }

  if (isBrawl) {
    const brawl = getBrawlProfile(target);
    const minDamage = brawl.minDamage;
    let damage = Math.floor((attackPower * Math.max(0.9, brawl.multiplier - 0.1) - defencePower * brawl.defenceFactor) * typeMultiplier);
    damage = Math.max(minDamage, damage);
    return applyOutgoingDamageModifiers(attacker, damage, minDamage, meleeLevel);
  }

  const isWolf = attacker.combatTags?.includes('wolf');
  const raw = Math.floor((attackPower * COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_MULTIPLIER - defencePower * COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_DEFENCE_FACTOR) * typeMultiplier);
  if (isWolf) {
    let damage = Math.max(3, Math.floor(raw * 0.88));
    damage = applyOutgoingDamageModifiers(attacker, damage, 3, meleeLevel);
    return damage;
  }
  let damage = Math.max(COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.ENEMY, raw);
  damage = applyOutgoingDamageModifiers(attacker, damage, COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.ENEMY, meleeLevel);
  return damage;
}

export function getWolfBleedChance(defence: number): number {
  if (defence >= 19) return 0;
  if (defence >= 12) return 0.4;
  return 1;
}

export function getWolfBleedStack(defence: number): number {
  if (defence >= 19) return 0;
  if (defence >= 12) return 1;
  return 2;
}

export function calculateFleeChance(partyDexterity: number, enemyDexterity: number): number {
  return Math.min(
    COMBAT_CONFIG.FLEE.MAX_CHANCE,
    Math.max(
      COMBAT_CONFIG.FLEE.MIN_CHANCE,
      COMBAT_CONFIG.FLEE.BASE_CHANCE + (partyDexterity - enemyDexterity) * COMBAT_CONFIG.FLEE.DEX_FACTOR
    )
  );
}

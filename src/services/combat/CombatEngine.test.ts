import { describe, expect, it } from 'vitest';
import {
  calculateDamage,
  calculateFleeChance,
  getBaseHitChance,
  getWolfBleedChance,
  getWolfBleedStack,
} from './CombatEngine';
import type { CombatParticipant } from '../../types';

const mkParticipant = (overrides: Partial<CombatParticipant>): CombatParticipant => ({
  id: 'p1',
  name: 'Tester',
  hp: 100,
  maxHp: 100,
  attack: 10,
  defence: 5,
  dexterity: 5,
  ...overrides,
});

describe('CombatEngine', () => {
  it('clamps hit chance between 0.1 and 0.95', () => {
    const low = mkParticipant({ isPlayer: true, accuracyModifier: -999 });
    const high = mkParticipant({ isPlayer: true, accuracyModifier: 999 });

    expect(getBaseHitChance(low)).toBe(0.1);
    expect(getBaseHitChance(high)).toBe(0.95);
  });

  it('keeps standard player damage at or above minimum', () => {
    const attacker = mkParticipant({ isPlayer: true, attack: 2 });
    const target = mkParticipant({ defence: 999, isPlayer: false, isCompanion: false });

    const damage = calculateDamage(attacker, target, 'standard', 0);
    expect(damage).toBeGreaterThanOrEqual(1);
  });

  it('applies higher melee milestones for player damage', () => {
    const attacker = mkParticipant({ isPlayer: true, attack: 16 });
    const target = mkParticipant({ defence: 2, isPlayer: false, isCompanion: false });

    const baseDamage = calculateDamage(attacker, target, 'standard', 0);
    const boostedDamage = calculateDamage(attacker, target, 'standard', 20);
    expect(boostedDamage).toBeGreaterThan(baseDamage);
  });

  it('clamps flee chance to configured bounds', () => {
    expect(calculateFleeChance(-999, 999)).toBeGreaterThanOrEqual(0.1);
    expect(calculateFleeChance(999, -999)).toBeLessThanOrEqual(0.9);
  });

  it('resolves wolf bleed thresholds correctly', () => {
    expect(getWolfBleedChance(19)).toBe(0);
    expect(getWolfBleedStack(19)).toBe(0);
    expect(getWolfBleedChance(12)).toBe(0.4);
    expect(getWolfBleedStack(12)).toBe(1);
    expect(getWolfBleedChance(5)).toBe(1);
    expect(getWolfBleedStack(5)).toBe(2);
  });
});

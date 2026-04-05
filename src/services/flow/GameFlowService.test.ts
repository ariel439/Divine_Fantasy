import { describe, expect, it } from 'vitest';
import { GameFlowService } from './GameFlowService';

describe('GameFlowService', () => {
  it('allows known transitions', () => {
    const decision = GameFlowService.canTransition('mainMenu', 'characterSelection');
    expect(decision.allowed).toBe(true);
    expect(decision.enforcement).toBe('strict');
    expect(decision.reason).toBeUndefined();
  });

  it('allows mainMenu to inGame for direct start/load flows', () => {
    const decision = GameFlowService.canTransition('mainMenu', 'inGame');
    expect(decision.allowed).toBe(true);
    expect(decision.enforcement).toBe('strict');
  });

  it('blocks invalid transitions for strict clusters', () => {
    const decision = GameFlowService.canTransition('mainMenu', 'combat');
    expect(decision.allowed).toBe(false);
    expect(decision.enforcement).toBe('strict');
    expect(decision.reason).toContain('Blocked transition');
  });

  it('blocks invalid transitions for inGame strict cluster', () => {
    const decision = GameFlowService.canTransition('inGame', 'prologue');
    expect(decision.allowed).toBe(false);
    expect(decision.enforcement).toBe('strict');
    expect(decision.reason).toContain('Blocked transition');
  });

  it('enforces strict policy for dialogue cluster', () => {
    const blocked = GameFlowService.canTransition('dialogue', 'library');
    expect(blocked.allowed).toBe(false);
    expect(blocked.enforcement).toBe('strict');

    const allowed = GameFlowService.canTransition('dialogue', 'mainMenu');
    expect(allowed.allowed).toBe(true);
    expect(allowed.enforcement).toBe('strict');
  });

  it('enforces strict policy for event cluster', () => {
    const blocked = GameFlowService.canTransition('event', 'library');
    expect(blocked.allowed).toBe(false);
    expect(blocked.enforcement).toBe('strict');

    const allowed = GameFlowService.canTransition('event', 'mainMenu');
    expect(allowed.allowed).toBe(true);
    expect(allowed.enforcement).toBe('strict');
  });

  it('enforces strict policy for combat clusters', () => {
    const blocked = GameFlowService.canTransition('combat', 'dialogue');
    expect(blocked.allowed).toBe(false);
    expect(blocked.enforcement).toBe('strict');

    const allowed = GameFlowService.canTransition('combatVictory', 'mainMenu');
    expect(allowed.allowed).toBe(true);
    expect(allowed.enforcement).toBe('strict');
  });

  it('allows trade to dialogue return path', () => {
    const decision = GameFlowService.canTransition('trade', 'dialogue');
    expect(decision.allowed).toBe(true);
    expect(decision.enforcement).toBe('strict');
  });

  it('allows self transitions', () => {
    const decision = GameFlowService.canTransition('dialogue', 'dialogue');
    expect(decision.allowed).toBe(true);
  });
});

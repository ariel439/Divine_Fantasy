import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './useUIStore';

describe('useUIStore flow enforcement', () => {
  beforeEach(() => {
    useUIStore.setState({ currentScreen: 'mainMenu' });
  });

  it('blocks strict-invalid transitions', () => {
    useUIStore.getState().setScreen('combat');
    expect(useUIStore.getState().currentScreen).toBe('mainMenu');
  });

  it('allows strict-valid transitions', () => {
    useUIStore.getState().setScreen('characterSelection');
    expect(useUIStore.getState().currentScreen).toBe('characterSelection');
  });

  it('blocks invalid strict transition from dialogue cluster', () => {
    useUIStore.setState({ currentScreen: 'dialogue' });
    useUIStore.getState().setScreen('library');
    expect(useUIStore.getState().currentScreen).toBe('dialogue');
  });

  it('blocks invalid strict transition from event cluster', () => {
    useUIStore.setState({ currentScreen: 'event' });
    useUIStore.getState().setScreen('library');
    expect(useUIStore.getState().currentScreen).toBe('event');
  });

  it('blocks invalid strict transition from inGame cluster', () => {
    useUIStore.setState({ currentScreen: 'inGame' });
    useUIStore.getState().setScreen('prologue');
    expect(useUIStore.getState().currentScreen).toBe('inGame');
  });
});

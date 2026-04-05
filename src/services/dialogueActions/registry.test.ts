import { beforeEach, describe, expect, it } from 'vitest';
import { executeRegisteredAction } from './registry';
import type { DialogueActionContext } from './types';
import { useUIStore } from '../../stores/useUIStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';

const context: DialogueActionContext = {
  diaryStore: {
    addInteraction: () => {},
  },
  worldState: {},
  journalStore: {},
};

describe('dialogueActions registry', () => {
  beforeEach(() => {
    useWorldStateStore.setState({ worldFlags: {} });
    useUIStore.setState({ currentScreen: 'inGame', shopId: null });
  });

  it('returns false for unknown action types', () => {
    const executed = executeRegisteredAction('unknown_action_type', [], context);
    expect(executed).toBe(false);
  });

  it('executes set_flag action', () => {
    const executed = executeRegisteredAction('set_flag', ['test_flag', 'true'], context);
    expect(executed).toBe(true);
    expect(useWorldStateStore.getState().getFlag('test_flag')).toBe(true);
  });

  it('executes open_shop action and routes to trade screen', () => {
    const executed = executeRegisteredAction('open_shop', ['beryls_general_goods'], context);
    expect(executed).toBe(true);
    expect(useUIStore.getState().shopId).toBe('beryls_general_goods');
    expect(useUIStore.getState().currentScreen).toBe('trade');
  });
});


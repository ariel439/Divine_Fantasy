import { afterEach, describe, expect, it } from 'vitest';
import { publishDomainEvent } from '../events/DomainEventBus';
import { FlowTelemetryService } from './FlowTelemetryService';

describe('FlowTelemetryService', () => {
  afterEach(() => {
    FlowTelemetryService.shutdown();
  });

  it('tracks blocked transitions from domain events', () => {
    FlowTelemetryService.init();
    publishDomainEvent('GAME_FLOW_TRANSITION', {
      from: 'dialogue',
      to: 'library',
      allowed: false,
      source: 'ui_store',
      reason: 'strict: blocked',
    });
    publishDomainEvent('GAME_FLOW_TRANSITION', {
      from: 'dialogue',
      to: 'library',
      allowed: false,
      source: 'ui_store',
      reason: 'strict: blocked',
    });

    const snapshot = FlowTelemetryService.getBlockedSnapshot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]?.key).toBe('dialogue->library');
    expect(snapshot[0]?.count).toBe(2);
  });
});


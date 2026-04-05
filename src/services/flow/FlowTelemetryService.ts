import { subscribeDomainEvent, type GameFlowTransitionEvent } from '../events/DomainEventBus';

interface BlockedTransitionStat {
  key: string;
  from: string;
  to: string;
  count: number;
  lastReason?: string;
}

export class FlowTelemetryService {
  private static initialized = false;
  private static unsubscribe: (() => void) | null = null;
  private static blocked = new Map<string, BlockedTransitionStat>();

  static init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.unsubscribe = subscribeDomainEvent('GAME_FLOW_TRANSITION', (event) => {
      this.onTransition(event);
    });
  }

  static shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.initialized = false;
    this.blocked.clear();
  }

  static getBlockedSnapshot(): BlockedTransitionStat[] {
    return Array.from(this.blocked.values()).sort((a, b) => b.count - a.count);
  }

  private static onTransition(event: GameFlowTransitionEvent): void {
    if (event.allowed) return;
    const key = `${event.from}->${event.to}`;
    const current = this.blocked.get(key);
    const next: BlockedTransitionStat = current
      ? { ...current, count: current.count + 1, lastReason: event.reason }
      : { key, from: event.from, to: event.to, count: 1, lastReason: event.reason };
    this.blocked.set(key, next);
    console.warn(`[FlowTelemetry] blocked ${key} (count=${next.count})`);
  }
}


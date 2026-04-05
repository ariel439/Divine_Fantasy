import type { CombatDefeatMode, CombatEncounterType, GameState } from '../../types';

export interface GameFlowTransitionEvent {
  from: GameState;
  to: GameState;
  allowed: boolean;
  source: 'ui_store' | 'service';
  reason?: string;
}

export interface DayChangedEvent {
  previousDay: number;
  currentDay: number;
  month: number;
  dayOfMonth: number;
}

export interface CombatResolvedEvent {
  outcome: 'victory' | 'defeat' | 'fled';
  encounterType: CombatEncounterType;
  defeatMode?: CombatDefeatMode;
  eventId?: string;
}

export interface SaveLifecycleEvent {
  slotId: string;
  saveName?: string;
  timestamp: string;
}

export interface DomainEventMap {
  GAME_FLOW_TRANSITION: GameFlowTransitionEvent;
  DAY_CHANGED: DayChangedEvent;
  COMBAT_RESOLVED: CombatResolvedEvent;
  SAVE_CREATED: SaveLifecycleEvent;
  SAVE_LOADED: SaveLifecycleEvent;
}

type DomainEventType = keyof DomainEventMap;
type Listener<T extends DomainEventType> = (payload: DomainEventMap[T]) => void;

class DomainEventBus {
  private listeners = new Map<DomainEventType, Set<Listener<any>>>();

  publish<T extends DomainEventType>(type: T, payload: DomainEventMap[T]): void {
    const typeListeners = this.listeners.get(type);
    if (!typeListeners || typeListeners.size === 0) return;
    typeListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.warn(`[DomainEventBus] Listener failed for ${type}:`, error);
      }
    });
  }

  subscribe<T extends DomainEventType>(type: T, listener: Listener<T>): () => void {
    const typeListeners = this.listeners.get(type) ?? new Set<Listener<T>>();
    typeListeners.add(listener);
    this.listeners.set(type, typeListeners as Set<Listener<any>>);
    return () => {
      const current = this.listeners.get(type);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(type);
      }
    };
  }
}

const domainEventBus = new DomainEventBus();

export const publishDomainEvent = <T extends DomainEventType>(type: T, payload: DomainEventMap[T]): void => {
  domainEventBus.publish(type, payload);
};

export const subscribeDomainEvent = <T extends DomainEventType>(type: T, listener: Listener<T>): (() => void) => {
  return domainEventBus.subscribe(type, listener);
};


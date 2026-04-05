# Domain Events

`DomainEventBus` is a lightweight publish/subscribe utility for cross-system signals.

## Purpose
- Decouple systems that should react to the same lifecycle events.
- Reduce direct store-to-store coupling for orchestration concerns.

## Current Events
- `GAME_FLOW_TRANSITION`
- `DAY_CHANGED`
- `COMBAT_RESOLVED`
- `SAVE_CREATED`
- `SAVE_LOADED`

## Usage
- Publish via `publishDomainEvent(type, payload)`.
- Subscribe via `subscribeDomainEvent(type, listener)`.


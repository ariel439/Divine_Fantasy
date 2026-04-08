# Stores Guide

Stores contain state and local actions for each domain slice.

## Rules
- Keep store actions focused on that slice.
- Minimize direct mutation of unrelated stores.
- Prefer services/use-cases for multi-store workflows.

## Contracts
- Store state shape is part of save/load contract if persisted.
- Changes to persisted shape should include migration notes.
- UI transitions must route through `useUIStore.setScreen` (flow policy + domain event emission).
- Inventory item use handlers may trigger `choiceEvent` screens for gated pickups; reward grants should be finalized in the corresponding choice handler.

## Documentation Requirement
For each store file, keep top-level comments for:
- owned state
- external dependencies
- non-obvious invariants

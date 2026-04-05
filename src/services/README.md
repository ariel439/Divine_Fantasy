# Services Guide

Services coordinate gameplay operations that span multiple stores or systems.

## Responsibilities
- Execute use-case flows (dialogue actions, game progression, save/load orchestration).
- Keep reusable business logic out of React components.

## Boundaries
- Prefer typed input/output contracts.
- Avoid unbounded growth of single services.
- Split by domain when service size or responsibility becomes broad.

## Dialogue Action Handlers
- `DialogueService.executeAction` now supports a handler registry in `src/services/dialogueActions/`.
- Simple actions should be added to the registry first.
- Keep complex story/combat branches in fallback flow until they are safely migrated.
- New action types should include:
  - typed handler
  - validator support (`DataValidator`)
  - documentation update

## Combat Domain
- Core combat formulas live in `src/services/combat/CombatEngine.ts`.
- `CombatManager` should call combat domain helpers instead of inlining formulas.

## Event Bus and Flow
- Domain events are published/subscribed through `src/services/events/DomainEventBus.ts`.
- Screen transitions are policy-checked through `src/services/flow/GameFlowService.ts`.
- Prefer publishing events for cross-system reactions instead of direct store-to-store mutation chains.
- Flow transition blocks are tracked by `src/services/flow/FlowTelemetryService.ts`.

## Save Contract
- Save/load contracts are defined in `SaveLoadService` with typed slice snapshots.
- Migrations must sanitize unknown payloads before applying state to stores.
- Save version changes require:
  - migration update
  - ADR update (`docs/adr/`)
  - changelog update

## Service Tests
- Core service seams should have targeted unit tests.
- Current baseline:
  - `combat/CombatEngine.test.ts`
  - `flow/GameFlowService.test.ts`
  - `SaveLoadService.test.ts`
  - `dialogueActions/registry.test.ts`
- Save migration fixtures are kept in `src/services/fixtures/legacySaves.ts`.

## Documentation Requirement
When adding a service, document:
- purpose
- owned use cases
- dependent stores/services
- side effects

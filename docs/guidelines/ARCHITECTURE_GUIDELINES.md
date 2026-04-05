# Architecture Guidelines

## Core Principles
- Prefer clear boundaries between UI, orchestration, and domain rules.
- Keep business logic out of large React screen components when possible.
- Avoid cross-store mutation chains; use explicit service/use-case boundaries.

## Target Layers
1. Presentation (React components)
2. Application (orchestration/use cases)
3. Domain (pure rules and policies)
4. Infrastructure (store adapters, persistence, IO)

## System Rules
- One module should have one primary reason to change.
- Keep flow logic explicit (state machines, command handlers, event handlers).
- Avoid central god-objects for all systems.

## Pattern Guidance
- Use Command pattern for dialogue/runtime actions.
- Use Strategy pattern for formula variants.
- Use Factory pattern for combatants and data normalization.
- Use event publishing for cross-system reactions.

## Flow and Events
- Screen transitions should go through a central transition policy service.
- Emit flow transition events for observability and decoupled listeners.
- Cross-system lifecycle hooks (day change, combat resolution, save lifecycle) should use domain events.
- Keep flow policy strict by default for all game screens.
- When introducing new screens, define explicit transitions before release.

## Persistence Contracts
- Save payloads must use typed DTO/snapshot contracts, not broad `any`.
- Migration must accept unknown input and sanitize each slice before restore.
- Save format version bumps must be documented in:
  - `docs/adr/`
  - `docs/CHANGELOG.md`

## ADR Trigger Conditions
Create an ADR for:
- major new subsystem
- change in save format strategy
- change in core gameplay flow model
- framework/state-management migration

# ADR 0001: Flow Events and Save Contract Hardening

- Status: accepted
- Date: 2026-04-05
- Decision Makers: Engineering (Game Architecture)

## Context
Core gameplay flow and persistence reliability were at risk due to:
- implicit screen transitions spread across UI/service code
- direct cross-system coupling for lifecycle reactions
- weakly typed save payload slices (`any`) with limited sanitization

This made regression risk higher during refactors and reduced confidence in backward-compatible save migration.

## Decision
Adopt three architectural guardrails:
1. Introduce a lightweight domain event bus (`DomainEventBus`) for lifecycle events.
2. Route screen transitions through a central transition policy service (`GameFlowService`) while keeping compatibility fallback.
3. Harden save/load contracts with typed store snapshots and unknown-input migration sanitization in `SaveLoadService`.

## Alternatives Considered
- Keep direct store-to-store calls and document conventions only.
- Introduce a full external state machine library immediately.
- Keep current save format and only patch individual migration bugs.

## Consequences
- Positive:
  - transition and lifecycle behavior is observable and centrally modeled
  - cross-system integration points are easier to extend with lower coupling
  - save migration and restore paths are safer and more explicit
- Negative:
  - introduces additional service modules and architectural surface area
  - transition policy currently remains permissive for compatibility, so strict enforcement is deferred
- Follow-up work:
  - tighten transition validation from permissive fallback to strict gate by feature slice
  - add unit tests for event publication and save migration fixtures
  - incrementally migrate remaining implicit transition logic into flow/application services

## Impacted Areas
- `src/stores/useUIStore.ts`
- `src/components/CombatManager.tsx`
- `src/services/GameManagerService.ts`
- `src/services/SaveLoadService.ts`
- `src/services/events/DomainEventBus.ts`
- `src/services/flow/GameFlowService.ts`
- `docs/guidelines/ARCHITECTURE_GUIDELINES.md`


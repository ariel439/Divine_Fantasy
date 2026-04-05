# Testing and Release Guidelines

## Minimum Local Checks
1. `npx tsc --noEmit`
2. `npm run build`
3. `npm run test`
4. Relevant simulation or validation scripts for touched systems

## System-Specific Checks
- Dialogue/content changes: run content/data validation.
- Combat changes: run combat domain tests and balancing/simulation checks where applicable.
- Save/load changes: run migration tests and verify load of at least one legacy save sample.
- Keep representative legacy save fixtures updated in `src/services/fixtures/legacySaves.ts`.

## Architecture Baseline Suites
- `src/services/combat/CombatEngine.test.ts`
- `src/services/flow/GameFlowService.test.ts`
- `src/services/flow/FlowTelemetryService.test.ts`
- `src/services/SaveLoadService.test.ts`
- `src/services/dialogueActions/registry.test.ts`
- `src/stores/useUIStore.test.ts`

## Release Safety
- No new TypeScript errors.
- No broken critical loop transitions (menu -> game -> dialogue/event -> combat -> return).
- No save format change without migration strategy.

## Regression Notes
For each release-level change, record:
- touched systems
- known risks
- manual test path

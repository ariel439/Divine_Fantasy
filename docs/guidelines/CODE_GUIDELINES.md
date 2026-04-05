# Code Guidelines

## TypeScript
- `npx tsc --noEmit` should pass for every merge.
- Avoid `any` in domain and orchestration code.
- Prefer explicit interfaces for data crossing module boundaries.

## Functions and Modules
- Keep functions focused and side effects explicit.
- Prefer composition over very large switch blocks.
- Extract repeated object construction to factory helpers.

## Stores and State
- Minimize direct store-to-store mutation coupling.
- Put complex flow in services/use-cases, not inside UI event handlers.
- Keep store state serializable unless intentionally runtime-only.

## Error Handling
- Fail clearly for invalid state transitions.
- Avoid empty catch blocks for important flows.
- Log with enough context to debug.

## Refactor Rules
- Preserve behavior before optimizing structure.
- Add characterization tests around risky refactors.
- Document contract changes in folder README files.

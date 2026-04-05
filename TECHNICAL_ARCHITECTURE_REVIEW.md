# Divine Fantasy - Technical Architecture Health Review
Date: 2026-04-04
Author: Codex (Architecture Review)
Scope: Full gameplay architecture review across stores, services, screen orchestration, data contracts, and runtime systems.

## 1. Executive Summary
The project is feature-rich and already supports a substantial gameplay loop, but architecture health is currently constrained by high coupling, large orchestration files, stringly-typed runtime commands, and drifting type contracts.

Current state in one sentence: production build passes, but architectural entropy is increasing and TypeScript safety is currently broken in multiple core paths.

High-priority takeaway:
- Stabilize type contracts first.
- Decompose orchestration services and screen managers.
- Replace string action dispatch with typed command handlers.
- Introduce explicit domain events and clearer system boundaries.

## 2. Methodology
Review approach used:
1. Mapped repository structure and identified primary runtime systems.
2. Audited core stores (`src/stores`) and services (`src/services`) for coupling, responsibility boundaries, and side effects.
3. Audited runtime composition layer (`Game`, `GameLayout`, `ScreenManager`, `CombatManager`, `ModalManager`) for domain leakage into UI.
4. Ran build and type-check validation:
   - `npm run build` succeeded.
   - `npx tsc --noEmit` failed with multiple cross-system contract errors.
5. Correlated findings to DRY, SOLID, and pattern suitability.

## 3. Architecture Inventory
Primary systems identified:
- Core Orchestration: `GameManagerService`, `DialogueService`, `ScreenManager`, `CombatManager`
- Domain Stores: character, inventory, combat, world time/state, quest/journal, companions, jobs, UI, shops, audio
- Domain Services: dialogue, exploration, world events, save/load, condition evaluation, quest observer, data validator
- Content/Data: large JSON-driven dialogue, quest, item, location, NPC, event, and shop datasets

Largest code concentration points:
- `src/components/ScreenManager.tsx`
- `src/services/DialogueService.ts`
- `src/services/GameManagerService.ts`
- `src/components/CombatManager.tsx`

## 4. Health Scorecard
Scores are from 1 (poor) to 5 (strong).

| Category | Score | Notes |
|---|---:|---|
| Runtime Stability | 3 | Build succeeds, but heavy side effects increase regression risk |
| Type Safety | 1 | `tsc --noEmit` currently fails across core gameplay paths |
| Modularity | 2 | God-object concentration in orchestration files |
| DRY | 2 | Repeated combat setup, repeated event branch logic, repeated reset logic |
| SOLID Alignment | 2 | SRP/OCP/DI are weak in core flow systems |
| Testability | 2 | Domain logic embedded in React components and store callbacks |
| Data Contract Robustness | 2 | Partial validation exists, but runtime command schema is weakly typed |
| Evolution Readiness | 2 | Feature growth likely to amplify coupling without architectural restructuring |

## 5. Critical Findings

### 5.1 Type Contract Drift Is Blocking Reliable Refactors
Evidence:
- `npx tsc --noEmit` reports errors in combat, screen routing, companion models, journal typing, equipment typing, and service data assumptions.
- Example files implicated:
  - `src/components/CombatManager.tsx`
  - `src/components/ScreenManager.tsx`
  - `src/components/screens/LocationScreen.tsx`
  - `src/utils/socialPresentation.ts`
  - `src/services/DialogueService.ts`
  - `src/services/GameManagerService.ts`
  - `src/stores/useCompanionStore.ts`
  - `src/stores/useJournalStore.ts`

Impact:
- Safe refactoring speed is reduced.
- Runtime bugs can bypass compile-time protections.
- Team confidence in contracts decreases.

### 5.2 God-Object Concentration in Core Flow
Evidence:
- `DialogueService` handles dialogue runtime state, node generation, social resolution, and broad gameplay action execution.
- `GameManagerService` mixes initialization, world progression, quest/event consequences, and combat bootstrapping.
- `ScreenManager` contains substantial story progression, event resolution, and state mutation logic beyond rendering/routing.

Impact:
- Violates SRP.
- Increases blast radius for edits.
- Makes onboarding and debugging significantly harder.

### 5.3 Stringly-Typed Dialogue Action Execution
Evidence:
- `DialogueService.executeAction` parses `action:param:param` strings with a large `switch` branch.
- Action behavior is tightly coupled to global store access and implicit side effects.

Impact:
- Violates OCP (adding behavior requires editing a central switch).
- Weak static verification of action parameters.
- Hard to test actions in isolation.

### 5.4 Domain Logic Embedded in UI Components
Evidence:
- `CombatManager.tsx` contains combat rule engine logic, turn sequencing, encounter resolution, rewards, and narrative transition outcomes.
- `ScreenManager.tsx` executes significant game progression and event mutation directly.

Impact:
- UI lifecycle and domain lifecycle are entangled.
- Deterministic simulation and unit testing are harder.
- Rendering concerns and business rules evolve together unintentionally.

### 5.5 Store Coupling and Circular Dependencies
Evidence:
- Character store calls world time and inventory logic.
- World time store mutates character and job outcomes.
- Multiple stores directly read and mutate other stores.

Impact:
- Hidden dependency chains.
- Order-of-execution sensitivity.
- Harder reproducibility for bugs.

### 5.6 Save/Load Contract Is Too Broad and Weakly Typed
Evidence:
- Save payload and migration paths use broad `any` slices.
- Whole store state restoration is done without strict DTO boundaries.

Impact:
- Migration fragility increases with each new feature.
- Persisted state may carry unintended fields and stale structures.

## 6. DRY Assessment
Areas with notable duplication:
- Combat participant construction logic repeated across several `GameManagerService` start-combat methods.
- Event/ending screen transition branches repeated in orchestration flows.
- New game initialization/reset uses repeated and partially overlapping state assignments.
- Condition and action evaluation patterns duplicated between runtime and validator concepts.

Recommended DRY improvements:
1. Introduce `CombatantFactory` and encounter presets.
2. Introduce event transition helper layer for common UI/event flow steps.
3. Centralize new-game seed/reset in dedicated bootstrap module with typed defaults.
4. Normalize command parsing and validation into shared schema definitions.

## 7. SOLID Assessment

### 7.1 Single Responsibility Principle (SRP)
Status: Weak in orchestration layer.
- Services/components own too many concerns simultaneously.

### 7.2 Open/Closed Principle (OCP)
Status: Weak in action handling.
- New dialogue actions require central switch modifications.

### 7.3 Liskov Substitution Principle (LSP)
Status: Moderately impacted by type drift.
- Inconsistent interfaces (equipment/companion/data variants) reduce substitutability confidence.

### 7.4 Interface Segregation Principle (ISP)
Status: Weak.
- Consumers often depend on wide store/service surfaces instead of narrow, purpose-specific interfaces.

### 7.5 Dependency Inversion Principle (DIP)
Status: Weak.
- High-level flow logic depends directly on concrete Zustand stores and hardcoded service calls.

## 8. Design Pattern Recommendations

### 8.1 Command Pattern for Dialogue Actions (Highest Priority)
Current: `switch(actionType)` with string parsing.
Target:
- `ActionRegistry` mapping action IDs to handlers.
- Each action handler receives typed payload and context.
- Handlers are independently testable.

Benefits:
- OCP compliance.
- Better unit testing.
- Clearer ownership per action domain.

### 8.2 State Machine for Game Flow
Current: Implicit transitions spread across UI/service files.
Target:
- Explicit game flow machine (states and transitions) for menu, exploration, dialogue, event, combat, post-combat.

Benefits:
- Fewer illegal transitions.
- Simpler debugging and analytics.
- Better separation of policy vs rendering.

### 8.3 Domain Event Bus (Observer, Explicit)
Current: Direct cross-store calls.
Target:
- Publish domain events (`DAY_CHANGED`, `QUEST_STAGE_SET`, `COMBAT_VICTORY`) with subscribers.

Benefits:
- Reduced direct coupling.
- Better extensibility for new systems.

### 8.4 Strategy Pattern for Combat Formulas
Current: Conditional formula logic spread through combat manager.
Target:
- Per encounter strategy (`standard`, `brawl`, scripted boss variants) implementing hit/damage/reward policies.

Benefits:
- Cleaner combat code.
- Easier balancing and simulation.

### 8.5 Factory Pattern for Combatant Construction
Current: Repeated object literals and manual setup.
Target:
- `CombatantFactory.createPlayer`, `createEnemyFromTemplate`, `createCompanion`.

Benefits:
- Reduced duplication.
- Consistent defaults and data normalization.

### 8.6 Repository + DTO for Persistence
Current: Whole-slice snapshot with weak contracts.
Target:
- Explicit save DTOs with schema versioning and migration pipeline.

Benefits:
- Safer migrations.
- Cleaner backward compatibility.

## 9. Proposed Target Architecture

### 9.1 Layering
- Presentation Layer:
  - React components strictly for rendering and UI events.
- Application Layer:
  - Use-case services orchestrating workflows (`StartCombatUseCase`, `StartDialogueUseCase`, `ResolveEventUseCase`).
- Domain Layer:
  - Pure rules and policies (combat formulas, social resolution, quest progression policy).
- Infrastructure Layer:
  - Store adapters, persistence adapters, content loaders.

### 9.2 Dependency Rule
- Presentation depends on Application abstractions.
- Application depends on Domain and narrow ports.
- Infrastructure implements ports and can depend on concrete store details.
- Domain stays framework-independent.

## 10. Refactor Roadmap

### Phase 1: Type Safety Recovery (Immediate)
Goals:
- Make `npx tsc --noEmit` pass.
Deliverables:
- Fix equipment model mismatches.
- Fix route/screen type mismatches.
- Fix companion and journal inferred type drift.
- Normalize service data interfaces where JSON variants differ.
Exit Criteria:
- Zero TS errors in CI.

### Phase 2: Dialogue Command Refactor
Goals:
- Replace monolithic switch with command handlers.
Deliverables:
- `ActionRegistry` and typed action payload schemas.
- Command handler modules by domain.
- Unit tests per handler.
Exit Criteria:
- Existing dialogue content runs through registry.

### Phase 3: Combat Domain Extraction
Goals:
- Remove combat rule engine from UI component.
Deliverables:
- `CombatEngine` + strategy interfaces.
- `CombatManager` reduced to adapter/presenter role.
Exit Criteria:
- Deterministic simulation tests for core combat flows.

### Phase 4: Event Bus and Flow Machine
Goals:
- Decouple cross-store side effects and implicit transitions.
Deliverables:
- Domain event dispatcher.
- Game flow state machine.
Exit Criteria:
- Event and transition rules centralized and testable.

### Phase 5: Save Contract Hardening
Goals:
- Improve migration reliability.
Deliverables:
- Typed save DTOs and schema validation.
- Versioned migration modules with tests.
Exit Criteria:
- Backward-compatible import/load for legacy saves under test.

## 10.1 Implementation Status (2026-04-05)
Progress update against roadmap phases:

- Phase 1: Completed
  - `npx tsc --noEmit` is passing.
  - Prior cross-system type drift issues were resolved in touched gameplay paths.

- Phase 2: Completed (core migration)
  - Dialogue actions now run through `src/services/dialogueActions/registry.ts` first.
  - Monolithic fallback switch was reduced to `trigger_event` + unknown-action warning only.

- Phase 3: Completed
  - Combat formulas extracted to `src/services/combat/CombatEngine.ts`.
  - `CombatManager` now consumes combat domain helpers for hit, damage, bleed, and flee calculations.

- Phase 4: Completed
  - Added `src/services/events/DomainEventBus.ts`.
  - Added `src/services/flow/GameFlowService.ts`.
  - UI transitions now pass through flow policy checks and publish `GAME_FLOW_TRANSITION`.
  - Flow policy is strict for all current screen states.
  - Added `FlowTelemetryService` for blocked transition diagnostics.
  - Day-change and combat-resolution events are published as domain events.

- Phase 5: Completed
  - `SaveLoadService` now uses typed snapshots instead of broad `any` slices.
  - Save migration now sanitizes unknown payload input before state restore.
  - Save/load lifecycle events are now published for downstream subscribers.
  - Save migration tests now use dedicated legacy fixtures (`src/services/fixtures/legacySaves.ts`).

## 11. Testing and Tooling Recommendations
1. Add mandatory CI gates:
- `npx tsc --noEmit`
- `npm run build`
- data/schema validation checks

2. Add focused domain tests:
- combat formulas and turn sequencing
- dialogue command handlers
- quest stage transitions
- save migration compatibility

3. Add content schema validation:
- zod or equivalent for dialogue/actions/quests/items/NPCs at load/validation time.

4. Add architecture guardrails:
- import boundary rules to prevent UI from directly depending on deep domain internals.

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
| Regressions during decomposition | Medium | High | Phase-based rollout, characterization tests first |
| Save incompatibility during refactor | Medium | High | DTO versioning and migration tests before changes |
| Team slowdown from large refactor | Medium | Medium | Vertical slices, preserve runtime behavior while isolating modules |
| Content-action breakage | Medium | High | Action schema validator plus registry fallback diagnostics |

## 13. Immediate Action Items
1. Establish CI type-check gate and fix current TS errors.
2. Introduce `ActionRegistry` scaffold while keeping old switch as fallback.
3. Extract combat participant factories from `GameManagerService`.
4. Move high-risk event transition blocks out of `ScreenManager` into dedicated application services.
5. Define save DTO interfaces and first migration test fixture set.

## 14. Final Technical Conclusion
The project has strong gameplay foundations and strong content throughput, but current architecture is approaching a scaling wall. The most important move is to restore type correctness and then progressively separate orchestration from domain rules. With a staged refactor centered on Command, State Machine, Strategy, Factory, and typed persistence boundaries, the codebase can become significantly safer, easier to extend, and faster to iterate on without sacrificing current behavior.

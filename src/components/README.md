# Components Guide

Components render UI and wire user interactions.

## Rules
- Keep domain rules in services/domain helpers where possible.
- Large screen components should orchestrate UI, not own core gameplay policy.
- Move repeated flow logic into shared helpers.

## Screen Components
- Document screen transitions and expected entry/exit behavior.
- Prefer explicit transition helpers over scattered inline branching.
- Quest debug scenarios should set start time through shared helpers (`go(location, hour)`) to avoid accidental time overrides.
- Choice-event pickups (for example treasure discoveries) should resolve rewards in `ScreenManager` choice handlers, not in passive slide events.
- When migrating an event from slides to choice events, preserve original reward economy values unless a balance change is explicitly requested.
- Journal quest presentation should focus on title/status/objectives and avoid redundant contact-giver badges unless required by a quest-specific mechanic.

## CombatManager Contract
- `CombatManager` is an adapter/presenter for turn sequencing and UI timing.
- Damage, hit, bleed, and flee formulas should come from `src/services/combat/CombatEngine.ts`.
- Combat resolution outcomes should emit domain events (`COMBAT_RESOLVED`) for cross-system listeners.

## Documentation Requirement
For complex screens/managers, include:
- input state dependencies
- side effects triggered
- transition outcomes

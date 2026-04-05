# Components Guide

Components render UI and wire user interactions.

## Rules
- Keep domain rules in services/domain helpers where possible.
- Large screen components should orchestrate UI, not own core gameplay policy.
- Move repeated flow logic into shared helpers.

## Screen Components
- Document screen transitions and expected entry/exit behavior.
- Prefer explicit transition helpers over scattered inline branching.

## CombatManager Contract
- `CombatManager` is an adapter/presenter for turn sequencing and UI timing.
- Damage, hit, bleed, and flee formulas should come from `src/services/combat/CombatEngine.ts`.
- Combat resolution outcomes should emit domain events (`COMBAT_RESOLVED`) for cross-system listeners.

## Documentation Requirement
For complex screens/managers, include:
- input state dependencies
- side effects triggered
- transition outcomes

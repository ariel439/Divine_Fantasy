# Dialogue Action Handlers

This folder contains registry-based handlers for dialogue actions.

## Purpose
- Reduce `DialogueService.executeAction` switch growth.
- Move simple, deterministic actions into isolated handlers.
- Keep behavior stable while refactoring incrementally.

## Files
- `types.ts`: action handler context and signature.
- `registry.ts`: handler map and execution function.
- `triggerEvent.ts`: extracted event-slide/story event dispatcher used by fallback branch.

## Migration Strategy
1. Add/verify action in `DataValidator`.
2. Implement typed handler in `registry.ts`.
3. Route action through registry in `DialogueService`.
4. Keep complex narrative/combat actions in fallback switch until safely migrated.

## Current Status
Registry-driven (migrated) actions include:
- currency/item/time utilities
- relationship and known-NPC updates
- quest stage and completion utilities
- debt collection standard flow (`start_debt_collection`, `collect_debt_from`, `turn_in_debt`)
- temporal instance enter/exit

Fallback (still in `DialogueService`) currently includes:
- `trigger_event` branch wiring (logic extracted to `triggerEvent.ts`)
- dialogue-state-coupled flows (`try_hire_or_deny`, `turn_in_debt_or_rebuke`)
- combat trigger flows

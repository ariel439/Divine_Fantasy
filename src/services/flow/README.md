# Flow Services

Game flow services define transition policy for screen/state navigation.

## Current Modules
- `GameFlowService.ts`: central strict transition map for all current game screens.
- `FlowTelemetryService.ts`: records blocked transition attempts from `GAME_FLOW_TRANSITION` domain events.

## Notes
- Strict cluster (invalid transitions are blocked):
  - `mainMenu`, `characterSelection`, `prologue`, `inGame`
  - `event`, `dialogue`, `dialogueRoberta`, `choiceEvent`, `combat`, `combatVictory`
  - `characterScreen`, `inventory`, `jobScreen`, `journal`, `diary`, `library`
  - `trade`, `tradeConfirmation`, `crafting`, `companion`
  - `debugMenu`, `combatDebug`
- Compatibility cluster:
  - none (all current screen states are strict)
- All screen changes should go through `useUIStore.setScreen`, which now emits `GAME_FLOW_TRANSITION` events.
- Blocked transitions are counted by `FlowTelemetryService` for debugging and migration safety.
- `mainMenu -> inGame` is intentionally allowed for direct start/load flows.

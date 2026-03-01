# Divine Fantasy - 7-Day Demo Release Plan

## 🚨 Phase 1: Critical Fixes & Stability (Must Do First)
- [x] **Game.tsx "God Component" Decomposition**:
    - **Issue**: `Game.tsx` handles Routing, Audio (200+ lines), Intro Logic, and Hotfixes.
    - **Task**: 
        - Extract Audio logic to a `<AudioManager />` component or `useAudioService`.
        - Move initialization/hotfix logic to `GameManagerService`.
- [x] **Game Loop / Ending**: 
    - **Issue**: The 7-day timeout is currently only checked in dialogue `pass_time` actions. Sleep/Wait UI bypasses this.
    - **Fix**: Add a global listener in `Game.tsx` (or `useWorldTimeStore`) that checks `day >= 7` after every time update. Trigger `finn_timeout_event` immediately.
    - **Starvation**: `useCharacterStore.tickHunger` reduces HP to 0 but doesn't trigger "Game Over".
    - **Fix**: Add a subscriber to `useCharacterStore` in `Game.tsx`. If `hp <= 0` and `cause === 'starvation'`, trigger a specific "Starved to Death" event/slide.
- [x] **Save/Load System**:
    - **Current State**: `SaveLoadModal.tsx` is UI-only. `SaveLoadService.ts` is implemented but needs UI integration.
    - **Task**: 
        - **Autosave**: Implement autosave triggered by specific events (Sleep, Day Pass, Quest Completion) to `localStorage`.

## 🛠️ Phase 2: Core Architecture & Mechanics
- [ ] **Dialogue Condition Parser**:
    - **Issue**: `DialogueService.applyConditionsToNode` is a massive, brittle switch statement.
    - **Task**: Refactor into a `ConditionEvaluator` class that allows registering new condition types (e.g., `quest`, `time`, `stat`) dynamically.
- [x] **Store Coupling (Time & Character)**:
    - **Issue**: `useWorldTimeStore` directly calls `useCharacterStore.tickHunger()`.
    - **Task**: Implement a "Time Listener" pattern in `Game.tsx` or `GameLoopService` to handle side effects of time passing (Hunger, Rotting, Quest Timers).
- [ ] **Quest Trigger Consolidation**:
    - **Issue**: Quest logic is scattered between `DialogueService` and `Game.tsx`.
    - **Task**: Centralize all quest stage transitions and event triggers into a `QuestManagerService` or `useJournalStore` actions.
- [ ] **Inventory/Quest Coupling**:
    - **Issue**: `useInventoryStore` contains hardcoded checks for specific quests (e.g., `roberta_planks`).
    - **Task**: Remove side effects from the store. Use a subscription pattern where `QuestManager` listens to inventory changes.

## 🎮 Phase 3: Enhancements & Content
- [ ] **Hardcoded Exploration Logic**:
    - **Issue**: `ExplorationService.ts` contains hardcoded event probabilities and data.
    - **Task**: Move exploration events to `data/exploration_events.json` with weights and conditions.
- [ ] **Hardcoded Combat Logic**:
    - **Issue**: `CombatManager.tsx` has hardcoded weapon sounds and hit chances.
    - **Task**: Move SFX mapping to `items.json` and `npcs.json`. Make hit/flee formulas configurable constants or data-driven.
- [ ] **Sandbox Mode**:
    - **Task**: Add "Start Game" selection:
        - **Story Mode**: Standard game with tutorial and main quest.
        - **Sandbox Mode**: Starts immediately (skips tutorial), disables main quest timer/events, free play.

- [ ] **Navbar Overhaul (`LocationNav.tsx`)**:
    - **Menu Icon**: Replace `MoreHorizontal` (...) with `Settings` (Gear) icon.
    - **Functionality**: Clicking Gear opens a new "System Menu" modal containing [Save, Load, Options, Main Menu].
    - **Timer**: Move the Clock/Date display from the top-right floating element directly into the bottom Navbar.
- [ ] **Keyboard Shortcuts**:
    - **Task**: Add global key listeners for quick navigation.
    - **Keys**: `I` (Inventory), `C` (Character/Companion), `J` (Journal), `Esc` (System Menu/Back).
- [ ] **Crafting Feedback**:
    - **Issue**: Crafting is instant and silent.
    - **Fix**: Add a "Toast" notification system showing the item created (e.g., "Crafted: Wooden Plank x1").
- [ ] **Job Progression**:
    - **Task**: Add a "Promotion" system.
    - **Logic**: After X days worked with high performance, unlock a "Senior" title with +20% pay.
    - **New Job**: Add one additional job type for sandbox gameplay variety (e.g., Guard Duty or Courier).
- [ ] **Price Rebalance & Shop Logic**:
    - **Task**: Review `items.json` base values. Adjust prices for food (too cheap?) and tools (too expensive?).
    - **Modifiability**: Ensure ALL shop data (inventory, prices, multipliers) is strictly loaded from `shops.json` and `items.json` to allow easy user modification/modding. Remove any hardcoded shop logic.
    - **Fix Broken Multipliers**: `TradeScreen.tsx` currently uses a hardcoded `0.5` sell multiplier. Update it to use `shop.buy_multiplier` and `shop.sell_multiplier` from `shops.json`.

## 🔊 Phase 4: Audio & Atmosphere (Polish)
- [ ] **Combat SFX**:
    - **Missing Sounds**: Add a specific "Miss" sound (whoosh/swish).
    - **Bug Fix**: Ensure audio promises are handled correctly.
- [ ] **Ambience**:
    - **Fade System**: Implement a volume fader in `AudioManager.tsx` when `currentLocation` changes.
    - **Forest Volume**: Reduce gain for `driftwatch_woods`.
- [ ] **Settings Persistence**:
    - **Issue**: Audio settings (volume/mute) reset on reload.
    - **Fix**: Add `persist` middleware to `useAudioStore`.

## 📖 Phase 5: Content & Writing (Bonus)
- [ ] **Dialogues**:
    - **Lore**: Add "Tell me about..." options to Ben, Elara, and Father Thomas.
- [ ] **Library**:
    - **Content**: Add 3-5 new books to `data.ts`.
- [ ] **Side Quests**:
    - **Idea**: "The Lost Locket" or "Roberta's Shipment" (delivery quest).

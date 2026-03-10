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
- [x] **Dialogue Condition Parser**:
    - **Issue**: `DialogueService.applyConditionsToNode` is a massive, brittle switch statement.
    - **Task**: Refactor into a `ConditionEvaluator` class that allows registering new condition types (e.g., `quest`, `time`, `stat`) dynamically.
- [x] **Store Coupling (Time & Character)**:
    - **Issue**: `useWorldTimeStore` directly calls `useCharacterStore.tickHunger()`.
    - **Task**: Implement a "Time Listener" pattern in `Game.tsx` or `GameLoopService` to handle side effects of time passing (Hunger, Rotting, Quest Timers).
- [x] **Quest Trigger Consolidation**:
    - **Issue**: Quest logic is scattered between `DialogueService` and `Game.tsx`.
    - **Task**: Centralize all quest stage transitions and event triggers into a `QuestManagerService` or `useJournalStore` actions. (Gather objectives implemented).
- [x] **Inventory/Quest Coupling**:
    - **Issue**: `useInventoryStore` contains hardcoded checks for specific quests (e.g., `roberta_planks`).
    - **Task**: Remove side effects from the store. Use a subscription pattern where `QuestManager` listens to inventory changes.

## 🎮 Phase 3: Enhancements & Content
- [x] **Hardcoded Exploration Logic**:
    - **Issue**: `ExplorationService.ts` contains hardcoded event probabilities and data.
    - **Task**: Move exploration events to `data/exploration_events.json` with weights and conditions.
- [x] **Hardcoded Combat Logic**:
    - **Issue**: `CombatManager.tsx` has hardcoded weapon sounds and hit chances.
    - **Task**: Move SFX mapping to `items.json` and `npcs.json`. Make hit/flee formulas configurable constants or data-driven.
- [x] **Sandbox Mode**:
    - **Task**: Add "Start Game" selection:
        - **Story Mode**: Standard game with tutorial and main quest.
        - **Sandbox Mode**: Starts immediately (skips tutorial), disables main quest timer/events, free play.

- [x] **Navbar Overhaul (`LocationNav.tsx`)**:
    - **Menu Icon**: Replace `MoreHorizontal` (...) with `Settings` (Gear) icon.
    - **Functionality**: Clicking Gear opens a new "System Menu" modal containing [Save, Load, Options, Main Menu].
- [x] **Keyboard Shortcuts**:
    - **Task**: Add global key listeners for quick navigation.
    - **Keys**: `I` (Inventory), `C` (Character/Companion), `J` (Journal), `Esc` (System Menu/Back).
- [x] **Crafting Feedback**:
    - **Issue**: Crafting is instant and silent.
    - **Fix**: Add a "Toast" notification system showing the item created (e.g., "Crafted: Wooden Plank x1").
- [x] **Price Rebalance & Shop Logic**:
    - **Task**: Review `items.json` base values. Adjust prices for food (too cheap?) and tools (too expensive?).
    - **Modifiability**: Ensure ALL shop data (inventory, prices, multipliers) is strictly loaded from `shops.json` and `items.json` to allow easy user modification/modding. Remove any hardcoded shop logic.
    - **Fix Broken Multipliers**: `TradeScreen.tsx` currently uses a hardcoded `0.5` sell multiplier. Update it to use `shop.buy_multiplier` and `shop.sell_multiplier` from `shops.json`.

## 🔊 Phase 4: Audio & Atmosphere (Polish)
- [x] **Combat SFX**:
    - [x] **Missing Sounds**: Add a specific "Miss" sound (whoosh/swish).
    - [x] **Bug Fix**: Ensure audio promises are handled correctly.
- [x] **Ambience**:
    - [x] **Fade System**: Implement a volume fader in `AudioManager.tsx` when `currentLocation` or music track changes.
    - [x] **Forest Volume**: Reduce gain for `driftwatch_woods`.
- [x] **Settings Persistence**:
    - **Issue**: Audio settings (volume/mute) reset on reload.
    - **Fix**: Add `persist` middleware to `useAudioStore`.

## 📖 Phase 5: Content & Writing (Library)
- [x] **Library**:
    - [x] **Content**: Added "The Pale Kin Invasion" (299 AW) and "The Lunar Luminaries" (733 AW).
    - [x] **Feature**: Add release years (AW) to all books.
    - [x] **Maesters**: Standardized all historical books to be written by Maesters.

## 🧩 Phase 6: UI Consolidation & Immersion
- [ ] **UI Integration**:
    - **Task**: Integrate the Job UI into the Journal UI.
    - **Task**: Transform the Pet UI into a Party UI.
    - **Task**: Integrate the new Party UI into the Diary UI.
- [ ] **Roberta's Wall Quest Improvement**:
    - **Current**: Uses a simple modal for fixing the wall.
    - **Task**: Convert into a full event-based interaction to improve immersion.
- [ ] **Side Quests**:
    - **Idea**: "The Lost Locket" or "Roberta's Shipment" (delivery quest).

## 🌍 Phase 7: The "Alive" World (Event Architecture)
- [ ] **Event Bottleneck Fix (Global Event Listener)**:
    - **Issue**: Events are manually triggered in code or dialogue.
    - **Task**: Implement a centralized `WorldEventManager` that subscribes to state changes.
    - **Logic**: Automatically trigger events based on:
        - `Time` (e.g., midnight encounter).
        - `Location` (e.g., entering the Slums for the first time).
        - `Flags` (e.g., having enough money to trigger a debt collector).
- [ ] **Night Transition & Store Logic**:
    - **Issue**: Time passes but the world doesn't react to closing hours while the player is inside.
    - **Task**: Implement "Closing Time" logic.
    - **Mechanic**: 
        - If the player is in a shop at 18:00 (closing), trigger a "Kicked Out" event/modal.
        - Force move the player to the street.
        - Add a "Day/Night" screen transition effect to make time jumps more obvious.

## 🗣️ Phase 8: Social & Dialogue Revamp
- [ ] **Dialogue UI Refactor**:
    - **Issue**: UI can get cluttered with too many options.
    - **Task**: Clean up the interface layout to handle multiple choices better.
- [ ] **Interaction System**:
    - **Social Menu**: Add a nested menu within dialogue for social actions.
    - **Ask Menu**: 
        - Allow unique questions (e.g., Lore, Store history).
        - Unlock questions based on relationship level.
    - **Interact Menu**:
        - Actions: "Friendly", "Aggressive", "Romantic".
        - **Lore**: Add "Tell me about...".
        - **Mechanic**: Actions consume "Social Energy" (new resource in `useCharacterStore`).
        - **Goal**: Build relationship status dynamically through these interactions.

## 🛠️ Phase 9: Skill System Overhaul
- [ ] **Fix Core Action Loop**:
    - **Issue**: Closing the `TimedActionModal` does not cancel the underlying action.
    - **Task**: Refactor the skill action logic to be cancellable.
- [ ] **Fix Starvation Bug**:
    - **Issue**: Player does not die when hunger reaches 0 during a skill action.
    - **Task**: Ensure the death check in `GameManagerService` is reliably triggered by all forms of time-passing.
- [ ] **Implement Partial Failure for Skills**:
    - **Issue**: Failing a skill check is a hard block with no feedback.
    - **Task**: Implement a "partial failure" state.
    - **Logic**: If a skill check fails, waste time, consume resources (energy/hunger), but grant a small amount of "pity" XP.
- [ ] **Redesign Reward UI**:
    - **Issue**: The `ActionSummaryModal` is clunky and unimmersive for skill gains.
    - **Task**: Replace the modal with a more fluid UI, such as a "Toast" notification for XP and item gains.
- [ ] **Define Skill Unlocks**:
    - **Issue**: Skills are just numbers and don't unlock new gameplay.
    - **Task**: Define clear unlocks for each skill level (e.g., new recipes, new locations, new dialogue options).

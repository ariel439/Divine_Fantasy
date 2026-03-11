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

## ✨ Phase 6: Core Gameplay Loop Fixes (CRITICAL)
*This combines your highest priority with the most critical stability fix.*
- [x] **Gathering Skill Overhaul**:
    - **Task**: Fix the non-cancellable `TimedActionModal` and ensure starvation can occur during skill actions.
    - **Task**: Implement "partial failure" states (pity XP, resource cost) for a better user experience.
- [x] **Save System Robustness**:
    - **Task**: Implement a `migrate(savedData)` function in `SaveLoadService.ts` to handle version changes and prevent old saves from crashing the game.
    - **Task**: Sanitize save data to exclude transient UI state.

## 🚀 Phase 7: Production & Performance Polish
*This phase focuses on the technical aspects that make the game feel professional and perform well on the web.*
- [x] **Build Stripping & Security**:
    - **Task**: Use environment variables to remove debug menus and `console.log`s from the production build.
- [ ] **Asset Preloading**:
    - **Task**: Create an `AssetManager` to preload images and audio for adjacent locations, reducing stutter and pop-in.
- [ ] **UI Responsiveness Audit**:
    - **Task**: Review all major UI components to ensure they adapt correctly to different screen sizes and aspect ratios.
- [ ] **Advanced Audio Ducking**:
    - **Task**: Implement audio ducking in `AudioManager.tsx` to lower ambient/music volume during dialogue and modal pop-ups.

## 🌍 Phase 8: The "Alive" World
*This phase is about adding content and dynamism to make the world feel less static.*
- [ ] **Dynamic NPC Schedules**:
    - **Task**: Implement daily schedules for at least 3-4 key NPCs who are currently static.
- [ ] **Add New Side Quests**:
    - **Task**: Add 2-3 new side quests to encourage exploration and interaction with the new NPC schedules.
- [ ] **Global Event Listener**:
    - **Task**: Implement a centralized `WorldEventManager` to trigger events based on time, location, or flags, independent of player actions.

## 🧩 Phase 9: UI & Quest System Integration
*This phase is about improving the user experience by consolidating information and automating tedious checks.*
- [ ] **UI Consolidation**:
    - **Task**: Integrate the Job UI into the Journal UI.
    - **Task**: Transform the Pet UI into a more comprehensive Party UI.
- [ ] **Quest System Automation (The "Observer")**:
    - **Task**: Refactor `useJournalStore` to automatically listen for inventory and location changes and update quest objectives reactively.

## 🗣️ Phase 10: Advanced Social Dynamics
*This phase adds the deeper role-playing mechanics you planned.*
- [ ] **Interaction System**:
    - **Task**: Implement "Social Energy" as a resource.
    - **Task**: Add the nested "Ask" and "Interact" menus to the dialogue system to allow for more dynamic relationship building.

## 🔮 Phase 11: Future-Proofing & Final Polish
*These are the final touches that set the stage for future updates.*
- [ ] **Roberta's Wall Quest Improvement**:
    - **Task**: Convert the simple modal interaction into a more immersive, event-based sequence.
- [ ] **Night Transition & Store Logic**:
    - **Task**: Implement the "Closing Time" logic to kick players out of shops at 18:00.
# Divine Fantasy - 7-Day Demo Release Plan

##  Critical Systems (Must Fix)
- [ ] **Game Loop / Ending**: 
    - **Issue**: The 7-day timeout is currently only checked in dialogue `pass_time` actions. Sleep/Wait UI bypasses this.
    - **Fix**: Add a global listener in `Game.tsx` (or `useWorldTimeStore`) that checks `day >= 7` after every time update. Trigger `finn_timeout_event` immediately.
    - **Starvation**: `useCharacterStore.tickHunger` reduces HP to 0 but doesn't trigger "Game Over".
    - **Fix**: Add a subscriber to `useCharacterStore` in `Game.tsx`. If `hp <= 0` and `cause === 'starvation'`, trigger a specific "Starved to Death" event/slide.
- [ ] **Save/Load System**:
    - **Current State**: `SaveLoadModal.tsx` is UI-only. `SaveLoadService.ts` is empty.
    - **Task**: Implement `SaveLoadService.ts` using `localStorage`.
        - Serialize all stores: `WorldState`, `Character`, `Inventory`, `Quest`, `Time`, `Relations`, `Audio`, `Shop`.
        - Add "Continue" button to Main Menu (checks for `latest_save`).
    - **Integration**: Connect `SaveLoadModal` to the Service.
- [ ] **Endless Mode**:
    - **Task**: Add a "Continue in Endless Mode" button to the Victory Screen.
    - **Logic**: Set a flag `endless_mode: true` that disables the Day 7 time limit check.

## 🖥️ UI/UX & Navigation
- [ ] **Navbar Overhaul (`LocationNav.tsx`)**:
    - **Menu Icon**: Replace `MoreHorizontal` (...) with `Settings` (Gear) icon.
    - **Functionality**: Clicking Gear opens a new "System Menu" modal containing [Save, Load, Options, Main Menu].
    - **Timer**: Move the Clock/Date display from the top-right floating element directly into the bottom Navbar (center or left aligned).
- [ ] **Shop Consistency**:
    - **Kaelen's Forge**: 
        - **Issue**: "Browse Shop" is a direct button in `locations.json`.
        - **Fix**: Change action type to `dialogue`. Update `kaelen.json` to include a "Show me your wares" node that triggers `open_shop:kaelens_forge`.

## 🔊 Audio & Atmosphere
- [ ] **Combat SFX**:
    - **Missing Sounds**: Add a specific "Miss" sound (whoosh/swish).
    - **Bug Fix**: Ensure audio promises are handled correctly to prevent logic breaks when sound fails to load.
- [ ] **Ambience**:
    - **Fade System**: Implement a volume fader in `Game.tsx` when `currentLocation` changes. instead of hard cutting.
    - **Forest Volume**: Reduce gain for `driftwatch_woods` in `locations.json` or the audio mixer.
- [ ] **Settings Persistence**:
    - **Issue**: Audio settings (volume/mute) reset on reload.
    - **Fix**: Add `persist` middleware to `useAudioStore`.

## ⚖️ Balance & Economy
- [ ] **Shop Logic Fix**:
    - **Critical Bug**: `TradeScreen.tsx` currently ignores `buy_multiplier` and `sell_multiplier` from `shops.json` (hardcoded to 0.5/1.0).
    - **Fix**: Update `TradeScreen` to use the actual shop values.
- [ ] **Shop Prices**: 
    - Review `shops.json`.
    - Adjust `buy_multiplier` and `sell_multiplier` for Beryl (General), Kaelen (Weapons), and Tavern (Food).
- [ ] **Skills**: 
    - **Carpentry**: Add more repairable spots (e.g., Bridge, Old Shack).
    - **Coercion**: Add more dialogue options for low-level coercion (not just 100% success/fail).

## 📖 Content & Writing
- [ ] **Dialogues**:
    - **Lore**: Add "Tell me about..." options to Ben, Elara, and Father Thomas.
- [ ] **Library**:
    - **Content**: Add 3-5 new books to `data.ts` (or `books.json`).
        - *History of Driftwatch*
        - *The Rebel's Manifesto*
        - *Flora of the Weeping Woods*
- [ ] **Side Quests**:
    - **Idea**: "The Lost Locket" (distinct from the main quest locket?) or "Roberta's Shipment" (delivery quest).

## 🔍 Codebase Observations
- **Audio System**: Currently creates new `Audio` objects frequently. Should utilize `useAudioStore` or a persistent manager more effectively to handle crossfading.
- **Quest Triggers**: Some quest logic is scattered between `DialogueService` and `Game.tsx`. Consolidating event triggers would be safer.

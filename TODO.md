# 0-PLAN.MD: Detailed Development Roadmap

This document outlines a comprehensive plan to transform the existing UI components and GDD into a fully functional, data-driven game. The approach is divided into phases, starting with a solid architectural foundation and then iteratively implementing gameplay mechanics.

---

## Phase 1: Architecture & Project Foundation

This phase is critical for creating a scalable and maintainable codebase. We will implement the architecture defined in `5-ARCHITECTURE.MD`.

- [x] **1.1: Restructure Project Folders**
    - [x] Create the `src` directory inside `divine_fantasy`.
    - [x] Move `App.tsx`, `index.html`, `index.tsx`, and other root files into `src`.
    - [x] Create the new directory structure within `src`:
        - `src/components`
        - `src/data`
        - `src/services`
        - `src/stores`
        - `src/assets` (for images, audio)

- [x] **1.2: Migrate Existing Assets**
    - [x] Move all existing components from `divine_fantasy/components` into `src/components`.
    - [x] Move the `map.jpeg` and any other visual assets into `src/assets/images`.

- [x] **1.3: Establish Data-Driven Foundation**
    - [x] Create all the static JSON files as defined in `7-DATA.MD` within the `src/data/` directory.
        - [x] `character_templates.json`
        - [x] `items.json`
        - [x] `locations.json`
        - [x] `npcs.json`
        - [x] `dialogue.json`
        - [x] `quests.json`
        - [x] `enemies.json`
        - [x] `companions.json`
        - [x] `recipes.json`
        - [x] `jobs.json`
        - [x] `xp_table.json`
        - [x] `books.json`
        - [x] `shops.json`
    - [x] Populate these files with the initial v1.0 content from `6-CONTENT.MD`.

- [x] **1.4: Initialize State Management & Services**
    - [x] Create placeholder files for all Zustand stores in `src/stores/` as per `5-ARCHITECTURE.MD`.
        - [x] `useCharacterStore.ts`
        - [x] `useDiaryStore.ts`
        - [x] `useInventoryStore.ts`
        - [x] `useJournalStore.ts`
        - [x] `useSkillStore.ts`
        - [x] `useAudioStore.ts`
        - [x] `useShopStore.ts`
        - [x] `useRoomStore.ts`
        - [x] `useUIStore.ts`
        - [x] `useJobStore.ts`
        - [x] `useWorldTimeStore.ts`
        - [x] `useEnvironmentStore.ts`
        - [x] `useWorldStateStore.ts`
        - [x] `useCompanionStore.ts`
    - [x] Create placeholder files for all core services in `src/services/`.
        - [x] `SaveLoadService.ts`
        - [x] `GameManagerService.ts`
        - [x] `DialogueService.ts`
        - [x] `FormattingService.ts`

---

## Phase 2: Core Systems Implementation

With the architecture in place, we'll breathe life into the core systems.

- [x] **2.1: Implement Zustand Stores**
    - [x] Flesh out each Zustand store with the state and actions defined in `5-ARCHITECTURE.MD`.
    - [x] Start with `useWorldTimeStore` and `useCharacterStore` as they are fundamental.

- [x] **2.2: Implement Core Services**
    - [x] Implement the `GameManagerService` to handle starting a new game (reading from `character_templates.json` and setting initial store states).
    - [x] Implement the `SaveLoadService` for web (manual JSON download/upload).
    - [x] Implement the `DialogueService` for NPC conversations.
    - [x] Implement the `SkillService` for skill-based actions.

- [x] **2.3: Main Game Loop & Screen Management**
    - [x] Create a `Game.tsx` component that will be the main container for all in-game screens.
    - [x] Refactor `App.tsx` to be the top-level component that initializes stores and renders the correct screen based on game state (e.g., `MainMenu`, `CharacterSelection`, `Game`).
    - [x] Use `useUIStore` to manage which screen or modal is currently active.

---

## Phase 3: Mechanic & Content Implementation (Iterative)

This phase is a loop: for each mechanic, we will first ensure the data is ready, then connect the UI components to the state and services.

- [x] **3.1 & 3.2: Character, World, Travel & Exploration**
- [x] Load character templates on new game (update Game.tsx or GameManagerService)
- [x] Update CharacterScreen.tsx to use real bio/image from character template
    - [x] Connect InventoryScreen.tsx to useInventoryStore (replace local state with store data)
    - [x] Map InventoryItem[] to Item[] via items.json in InventoryScreen.tsx
    - [x] Implement use/drop handlers in InventoryScreen.tsx calling store methods
    - [x] Integrate equip/unequip with store in InventoryScreen.tsx
    - [x] Enhance LocationScreen with full weather/season mechanics (already partially done)
    - [x] Add travel confirmation modals (if needed)
    - [x] Ensure skill progression with attribute bonuses (already in stores)
    - [x] Implement travel action on LocationScreen.tsx
    - [x] Use ConfirmationModal.tsx and TimedActionModal.tsx for travel time
    - [x] Update player's current location in state management
    - [x] Test the integrations
    - [x] **Time & Location:**
        - Connect the `InGameUI.tsx` to `useWorldTimeStore` to display the current time.
        - Connect `LocationScreen.tsx` to a new store that manages the current location, pulling data from `locations.json`.
        - Implement the `passTime` action and the `SleepWaitModal.tsx`.

- [x] **3.3: Skilling Loop (Woodcutting & Fishing)**
    - [x] **Data:** Verify `items.json` (log, fish types) and `locations.json` (actions) are correct.
    - [x] **UI:** Use `TimedActionModal.tsx` for the skilling actions.
    - [x] **Logic:**
        - Implement the skilling actions (e.g., "Chop Wood") that consume energy and time.
        - On completion, grant XP (using `useSkillStore.addXp`) and items (using `useInventoryStore.addItem`).
        - Display results in `ActionSummaryModal.tsx`.

- [x] **3.4: NPC Interaction & Dialogue**
    - [x] **Data:** Ensure `npcs.json` and `dialogue.json` are populated.
    - [x] **UI:** Connect `DialogueScreen.tsx` to the `DialogueService`.
    - [x] **Logic:** Implement the `DialogueService` to parse dialogue trees from `dialogue.json` and manage conversation flow.
    - [x] **Diary:** Connect `DiaryScreen.tsx` to `useDiaryStore` to reflect relationship changes.

- [x] **3.5: Quest System**
    - [x] **Data:** Ensure `quests.json` is populated with "Planks for the Past".
    - [x] **UI:** Connect `JournalScreen.tsx` to `useJournalStore`.
    - [x] **Logic:**
        - [x] Implement quest activation through dialogue.
        - [x] Implement objective tracking in `useJournalStore`.
        - [x] Implement the branching logic for "Planks for the Past" (DIY vs. Delegate), updating the `useWorldStateStore`.

- [ ] **3.6: Economy & Trading**
    - [ ] **Phase 1: Dynamic Store Currency and Pricing**
        - [ ] **3.6.1: Update `shops.json` to include `currency` field:** Add a `currency` field to each shop object in `shops.json` with an initial copper value.
        - [ ] **3.6.2: Modify `useShopStore.ts` to handle shop currency:**
            - [ ] Read and store shop currency in the `loadShops` function.
            - [ ] Add an `updateShopCurrency` action to allow for currency changes during trade.
        - [ ] **3.6.3: Update `TradeScreen.tsx` to display actual shop currency:** Replace hardcoded `merchantTotalCopper` with a calculation based on `shop.currency`.
        - [ ] **3.6.4: Implement dynamic pricing in `TradeScreen.tsx`:**
            - [ ] Adjust `handleBuy` and `handleSell` functions to calculate prices based on item base value and a `sell_multiplier` (e.g., 50% of `buy_multiplier`).
            - [ ] Update shop currency during transactions.
    - [ ] **Phase 2: "Barter" Button Functionality and Trade Persistence**
        - [ ] **3.6.5: Debug "Barter" button functionality:**
            - [ ] Verify that the "Barter" button is not disabled due to empty offers or affordability issues.
            - [ ] Ensure `TradeConfirmationScreen` renders correctly upon clicking "Barter".
        - [ ] **3.6.6: Ensure items appear in Trade UI:**
            - [ ] Investigate why player inventory items are not appearing in the Trade UI.
            - [ ] Investigate why shop inventory items are not appearing in the Trade UI.
        - [ ] **3.6.7: Implement trade persistence:**
            - [ ] After a successful trade, update both player and shop inventories in their respective stores.
            - [ ] Ensure these changes are saved when the game is saved.
    - [ ] **Phase 3: Weekly Store Resets**
        - [ ] **3.6.8: Implement weekly store reset logic:**
            - [ ] In `useShopStore.ts`, add logic to reset shop inventories and currency to their initial `shops.json` values on a weekly cycle (e.g., using `useWorldTimeStore`).
            - [ ] Consider how to handle items bought by the player that were originally in the shop (they should not reappear).
        - [ ] **3.6.9: Integrate with `GameManagerService.ts`:** Ensure the weekly reset is triggered correctly as part of the game loop.
    - [ ] **3.6.10: Testing and Refinement:**
        - [ ] Thoroughly test buying, selling, and store resets.
        - [ ] Balance item prices and shop currency.
        - [ ] Ensure a smooth user experience.


- [ ] **3.7: Combat System**
    - [ ] **Data:** Ensure `enemies.json` and `companions.json` are ready.
    - [ ] **UI:** Connect `CombatScreen.tsx` to a new `useCombatStore`.
    - [ ] **Logic:**
        - Implement the simple turn-based logic (Attack, Defend, Flee).
        - Implement companion logic, allowing a companion from `useCompanionStore` to participate.
        - On victory, connect to `VictoryScreen.tsx` and grant loot/XP.

---

## Phase 4: Polishing & v1.0 Release Prep

- [ ] **4.1: Full Gameplay Loop Test**
    - [ ] Play through the entire v1.0 content, from New Game to completing all available quests.
    - [ ] Identify and fix bugs.
    - [ ] Balance economy, XP rates, and combat difficulty.

- [ ] **4.2: Save/Load Testing**
    - [ ] Rigorously test the `SaveLoadService` to ensure all game state is correctly saved and restored.

- [ ] **4.3: Final UI/UX Polish**
    - [ ] Add sound effects and music using `useAudioStore`.
    - [ ] Implement weather effects with `WeatherParticles.tsx` based on `useEnvironmentStore`.
    - [ ] Ensure all UI elements are responsive and visually consistent.
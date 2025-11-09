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

- [x] **3.1: Character & World**
    - [ ] **Character Sheet:** Connect `CharacterScreen.tsx` to `useCharacterStore` and `useSkillStore` to display real data.
    - [ ] **Inventory:** Connect `InventoryScreen.tsx` to `useInventoryStore`. Implement item interaction logic (use, drop).
    - [x] **Time & Location:**
        - Connect the `InGameUI.tsx` to `useWorldTimeStore` to display the current time.
        - Connect `LocationScreen.tsx` to a new store that manages the current location, pulling data from `locations.json`.
        - Implement the `passTime` action and the `SleepWaitModal.tsx`.

- [ ] **3.2: Travel & Exploration**
    - [ ] Implement the travel action on the `LocationScreen.tsx`.
    - [ ] Use the existing `ConfirmationModal.tsx` and `TimedActionModal.tsx` to handle travel time as per `3-GAMEPLAY.MD`.
    - [ ] Update the player's current location in the state management.

- [ ] **3.3: Skilling Loop (Woodcutting & Fishing)**
    - [ ] **Data:** Verify `items.json` (log, fish types) and `locations.json` (actions) are correct.
    - [ ] **UI:** Use `TimedActionModal.tsx` for the skilling actions.
    - [ ] **Logic:**
        - Implement the skilling actions (e.g., "Chop Wood") that consume energy and time.
        - On completion, grant XP (using `useSkillStore.addXp`) and items (using `useInventoryStore.addItem`).
        - Display results in `ActionSummaryModal.tsx`.

- [ ] **3.4: NPC Interaction & Dialogue**
    - [ ] **Data:** Ensure `npcs.json` and `dialogue.json` are populated.
    - [ ] **UI:** Connect `DialogueScreen.tsx` to the `DialogueService`.
    - [ ] **Logic:** Implement the `DialogueService` to parse dialogue trees from `dialogue.json` and manage conversation flow.
    - [ ] **Diary:** Connect `DiaryScreen.tsx` to `useDiaryStore` to reflect relationship changes.

- [ ] **3.5: Quest System**
    - [ ] **Data:** Ensure `quests.json` is populated with "Planks for the Past".
    - [ ] **UI:** Connect `JournalScreen.tsx` to `useJournalStore`.
    - [ ] **Logic:**
        - Implement quest activation through dialogue.
        - Implement objective tracking in `useJournalStore`.
        - Implement the branching logic for "Planks for the Past" (DIY vs. Delegate), updating the `useWorldStateStore`.

- [ ] **3.6: Economy & Trading**
    - [ ] **Data:** Ensure `items.json` has base values and merchant inventories are defined in a new `shops.json` or similar.
    - [ ] **UI:** Connect `TradeScreen.tsx` to `useShopStore` and `useInventoryStore`.
    - [ ] **Logic:** Implement the logic for buying and selling items, updating player currency in `useCharacterStore`.

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
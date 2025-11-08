# 4. UI and Player Systems

This document describes the user interface (UI) flow, screens, and modals for "Divine Fantasy: Whispers," based on the implemented React components.

## 1. Core UI Flow

The game's UI is built around a central `App.tsx` component that manages the overall `gameState`. This state determines which full-screen component is rendered at any given time, acting as a simple router.

### 1.1. Initial Flow
1.  **Main Menu (`MainMenu.tsx`):** The player starts here with options for a new game, loading a saved game, or accessing settings.
2.  **Character Selection (`CharacterSelection.tsx`):** The player chooses their character. For v1.0, this is a single pre-made character, "Luke".
3.  **Prologue (`EventScreen.tsx`):** An introductory cutscene explains the character's backstory.
4.  **In-Game (`LocationScreen.tsx`):** The main gameplay screen is displayed.

### 1.2. Main Game Interface
-   **Location Screen (`LocationScreen.tsx`):** This is the primary game view, displaying the current location, character vitals, time of day, and available actions.
-   **In-Game Navigation (`InGameNav.tsx`):** A persistent navigation bar provides access to the main game screens. It has two variants: `floating` for the `LocationScreen` and `solid` for other menu screens.

## 2. UI Screens

These are the primary, full-screen interfaces the player interacts with.

-   **`MainMenu.tsx`:** The initial entry point of the game.
-   **`CharacterSelection.tsx`:** Allows the player to choose their character and view their starting attributes and backstory.
-   **`EventScreen.tsx`:** A reusable component for displaying narrative cutscenes with images and text.
-   **`LocationScreen.tsx`:** The main game screen, showing the world, player vitals, and available actions.
-   **`CharacterScreen.tsx`:** Displays detailed character information, including attributes, skills, and vitals.
-   **`InventoryScreen.tsx`:** A detailed inventory management screen with item filtering, a grid view, and a details panel.
-   **`DiaryScreen.tsx`:** Manages NPC relationships, showing friendship, love, fear, and obedience levels.
-   **`JournalScreen.tsx`:** A classic quest log to track active and completed quests.
-   **`DialogueScreen.tsx`:** A dedicated screen for conversations with NPCs, showing dialogue history and response options.
-   **`TradeScreen.tsx`:** A two-panel UI for trading items with merchants.
-   **`CraftingScreen.tsx`:** A dedicated screen for crafting items, with recipe filtering and ingredient lists.
-   **`CombatScreen.tsx`:** The main interface for turn-based combat.
-   **`VictoryScreen.tsx`:** A screen that displays the rewards after a successful combat encounter.
-   **`CompanionScreen.tsx`:** A screen to manage the player's companion, showing their stats and info.
-   **`ChoiceEventScreen.tsx`:** A screen that presents the player with a situation and a set of choices.
-   **`TradeConfirmationScreen.tsx`:** A screen to confirm the final details of a trade.
-   **`JobScreen.tsx`:** A screen that displays job-related information, including position details, supervisor information, standing, and an attendance log.
-   **`LibraryScreen.tsx`:** A screen for browsing and reading books available in a library.

## 3. UI Modals

These are modal dialogs that appear over the current screen to handle specific interactions.

-   **`ConfirmationModal.tsx`:** A reusable modal for confirming actions.
-   **`OptionsModal.tsx`:** Provides access to game settings (Audio, Graphics, Gameplay).
-   **`SaveLoadModal.tsx`:** Allows the player to save and load their game progress.
-   **`SleepWaitModal.tsx`:** A modal for passing a selected amount of time.
-   **`TimedActionModal.tsx`:** Manages skilling actions that take a user-defined amount of time.
-   **`ActionSummaryModal.tsx`:** Displays a summary of the results of a timed action.
-   **`QuantityModal.tsx`:** A modal for selecting the quantity of an item to trade or use.

## 4. Reusable UI Components (`/ui`)

A collection of smaller, reusable components used across various screens and modals.

-   **`ActionButton.tsx`:** A standardized button for actions in the `InGameUI`.
-   **`CombatantCard.tsx`:** A card component to display player and enemy information in combat.
-   **`CurrencyDisplay.tsx`:** A component to display the player's currency.
-   **`Dropdown.tsx`:** A standard dropdown component.
-   **`EquippedGearPanel.tsx`:** A panel to display the player's equipped gear.
-   **`ItemDetailsPanel.tsx`:** A panel to display the details of a selected item.
-   **`ItemSelectionPanel.tsx`:** A panel for displaying and filtering a list of items.
-   **`NavButton.tsx`:** A button for the main navigation bar.
-   **`ProgressBar.tsx`:** A flexible progress bar component.
-   **`SaveSlot.tsx`:** A component for displaying a save/load game slot.
-   **`Section.tsx`:** A component for creating titled sections in the UI.
-   **`Skill.tsx`:** A component for displaying a single skill with its level and XP.
-   **`Slider.tsx`:** A standard slider component.
-   **`Stat.tsx`:** A component for displaying a single stat.
-   **`ToggleSwitch.tsx`:** A standard toggle switch component.

# 5. Game Architecture (React/Zustand)

This document outlines the technical architecture for "Divine Fantasy: Whispers." It is a direct translation and expansion of the proven, modular system from the Godot prototype. The architecture uses **React** for the UI and **Zustand** for state management, with game data stored in JSON files.

---

## 1. UI Technology Stack

To achieve the desired "dark, modern, and clean" aesthetic with maximum design flexibility, the project will use **Tailwind CSS**. This utility-first framework is ideal for creating a custom user interface from the ground up and works exceptionally well with AI-powered component generation tools.

To accelerate development while maintaining design control, component scaffolding will be handled by **shadcn/ui**. This provides a library of accessible, unstyled base components that can be copied directly into the project and styled with Tailwind CSS.

---

## 2. State Management: Zustand Stores

The game's state is managed by a collection of modular Zustand stores (slices), each with a specific responsibility. This ensures a clean separation of concerns.

### 1.1. Character Stores
*(Based on `res://autoloads/character/`)*

These stores manage the player character's direct state.

*   **`useCharacterStore`**:
    *   Manages the player's **Core Attributes** (see section 1.A).
    *   Manages core vitals (resources): `hp`, `energy`, `hunger`.
    *   Manages the player's tiered currency: `{ copper: number, silver: number, gold: number }`.
    *   Manages the player's maximum carry weight: `maxWeight`.
    *   Manages equipped items and combat style (for future implementation).
    *   **Actions**: `eat(item)`, `sleep(bedType)`, `wait(hours)`.

*   **`useDiaryStore`**:
    *   Manages all NPC relationship data.
    *   **State Shape**: `relationships: { npc_id_1: { friendship: 50, love: 10, fear: 0, obedience: 20 }, ... }`
    *   Manages a history of key interactions to prevent repetition and add depth.

*   **`useInventoryStore`**:
    *   Manages all items the player possesses.
    *   Calculates the `currentWeight` of all held items.
    *   Provides logic for adding, removing, and using items, checking against `maxWeight`.

*   **`useJournalStore`**:
    *   Keeps track of all active and completed quests.
    *   Manages quest progression, objectives, and rewards.

*   **`useSkillStore`**:
    *   Oversees the player's skills and abilities.
    *   **State Shape**: `skills: { woodcutting: { level: 1, xp: 0 }, charisma: { level: 5, xp: 120 }, ... }`
    *   **Actions**: `addXp(skill, amount)` which will handle level-up checks based on the `xp_table.json`.

### 1.1.A. Core Attribute System (New)
This system defines the link between `useCharacterStore` and `useSkillStore`, creating a foundation for character specialization.

*   **Core Attributes**: Strength, Agility, Intelligence, Wisdom, Charisma.
*   **Range**: Each attribute has a value from 1 to 10, set during character selection.
*   **Mechanic**: Each attribute point provides a percentage-based XP bonus to a linked set of skills. This allows any character to level any skill, but "specialists" (e.g., a character with 10 Intelligence) will level up associated skills much faster. These attributes exclusively affect the rate of skill progression and do not directly influence combat statistics like damage, health, or turn order.
*   **Attribute -> Skill Links**:
    *   **Strength**: Strength (Combat), Mining, Blacksmithing.
    *   **Agility**: Archery (Combat), Thievery (all "sneak" activities).
    *   **Intelligence**: Carpentry (housing, furniture, ships), Management, Crafting, **Cooking**.
    *   **Wisdom**: Magic (a hidden skill, difficult to unlock but powerful), **Fishing**.
    *   **Charisma**: **Charisma** (social), **Coercion** (social), Leadership (late-game).

### 1.2. Manager & Session Stores
*(Based on `res://autoloads/data_managers/`)*

These stores manage session-wide data and UI state.

*   **`useAudioStore`**: Controls all in-game audio (music, SFX).
*   **`useShopStore`**: Manages all shop-related data, including merchant inventories and price modifiers.
*   **`useRoomStore`**: Manages the state of rentable rooms (e.g., `salty_mug_rented_room`).
*   **`useUIStore`**: Manages the overall state and visibility of major UI screens and modal windows (e.g., `activeOverlay: 'inventory'`).
*   **`useJobStore` (New)**: Manages the player's employment status, tracking active jobs, work schedules, and payroll information from `jobs.json`.

### 1.3. World State Stores
*(Based on `res://autoloads/world/`)*

These stores manage the state of the game world itself.

*   **`useWorldTimeStore`**:
    *   Manages the game's internal time system.
    *   Tracks current `day`, `hour`, and `minute`.
    *   **Config**: 1 in-game day = 60 real-time minutes (TBD).
    *   **Actions**: `passTime(minutes)`.

*   **`useEnvironmentStore` (New)**:
    *   Manages dynamic world conditions.
    *   **State**: `weather: 'clear'`, `season: 'spring'`.
    *   This store's state will influence location visuals (e.g., showing a rainy background) and potentially gameplay (e.g., fishing yields during rain).

*   **`useWorldStateStore`**:
    *   Manages global, non-social aspects of the world.
    *   **State Shape**: `world_flags: { "roberta_shop_repaired": false, ... }`
    *   Tracks one-shot event flags and world event cooldowns.

*   **`useCompanionStore` (New)**:
    *   Manages the player's active companion.
    *   **State**: `activeCompanion: { id: 'companion_ronald', ... } | null`
    *   Stores the companion's current stats and equipped items.

---

## 2. Core Services (Logic)
*(Based on `res://autoloads/util/` & `data_managers/`)*

These are plain TypeScript/JavaScript modules that contain the game's core logic. They are stateless and operate on the Zustand stores.

*   **`SaveLoadService`**: Contains functions to save and load the game state. The strategy depends on the platform:
    *   **Web (v1.0):** Implements a manual save/load system. Saving serializes the state stores into a JSON file and triggers a browser download. Loading uses a file input to have the user select their save file.
    *   **Desktop (Future):** In a Tauri-based desktop app, this service will interface with the native filesystem for seamless, automatic saving and loading to a dedicated folder (e.g., `Documents/My Games/DivineFantasy`).
*   **`GameManagerService`**: Handles the high-level game flow, including the `startNewGame(templateId)` function which resets all stores and applies a character template.
*   **`DialogueService`**: Manages the logic for initiating and parsing both scripted dialogue from `dialogue.json` and the "Sims-style" social actions from `socials.json`.
*   **`FormattingService`**: A set of utility functions for formatting data for display in the UI (e.g., dates, currency).

---

## 3. Static Game Data (JSON)

All static game content is defined in JSON files, loaded as needed. This decouples the game logic from its data, allowing for easier content creation and modification.

*   **`character_templates.json`**: Defines starting stats, skills, and attributes for each pre-made character.
*   **`items.json`**: The definitive source for all static item data (including `weight`).
*   **`locations.json`**: Defines all static data for locations (see `7-DATA.MD` for schema).
*   **`npcs.json`**: Defines all non-player characters.
*   **`dialogue.json`**: Defines all scripted, branching dialogue trees.
*   **`quests.json`**: Defines all quests, their objectives, and rewards.
*   **`enemies.json` (New)**: Defines all enemy types, their stats, and loot tables.
*   **`companions.json` (New)**: Defines all potential companions and their base stats.
*   **`socials.json`**: Defines the "Sims-style" social actions, their skill checks, and their effects on relationship stats.
*   **`recipes.json` (New)**: Contains all crafting recipes for skills like `Cooking` and `Carpentry`.
*   **`jobs.json` (New)**: Defines all available jobs, their workplaces, schedules, and pay rates.
*   **`xp_table.json`**: Defines the XP required for each level (1-99) for all skills, based on the RuneScape curve.

---

## 4. Character Template Example

This section defines the data structure for `character_templates.json` using Luke as an example.

```json
{
  "luke_orphan": {
    "template_id": "luke_orphan",
    "name": "Luke",
    "archetype": "The Driftwatch Orphan",
    "description": "Grew up in Leo's Lighthouse orphanage in Driftwatch. His mother Elara died in childbirth and his fisherman father Gareth was lost to a squall. Cared for by Old Leo, he found a new family in his fellow orphans. A difficult start, but his sharp mind and hidden potential may be key to his future.",
    "starting_attributes": {
      "Strength": 4,
      "Agility": 6,
      "Intelligence": 8,
      "Wisdom": 5,
      "Charisma": 3
    },
    "starting_bonuses": {
      "currency": { "copper": 20, "silver": 0, "gold": 0 },
      "skills": []
    },
    "starting_relationships": {
      "npc_old_leo": { "friendship": 80, "obedience": 60 },
      "npc_sarah": { "friendship": 90 },
      "npc_robert": { "friendship": 70 },
      "npc_kyle": { "friendship": 70 }
    },
    "gameplay_notes": "The 'standard' but most difficult start. High INT provides good long-term XP bonuses for building/crafting skills. Low CHA will make all early social encounters challenging."
  }
}
```
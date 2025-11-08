# Core Gameplay Mechanics (v1.0)

This document outlines the primary gameplay loops and mechanics for the 1.0 release of "Divine Fantasy."

## 1. Game Flow
The player's journey follows a clear progression from the start of the game into the main world.

1.  **Main Menu:** The player begins here with options to start a **New Game**, **Continue** a saved game, or **Load** a specific save.
2.  **Character Selection:** Upon starting a new game, the player selects their character. For v1.0, only **Luke** is available.
3.  **Prologue Event:** A slideshow-style event screen introduces the lore and the character's backstory.
4.  **Location Screen:** After the prologue, the player is placed in the world on the **Location Screen**, starting somewhere in the city of **Driftwatch**.

## 2. Core Player Mechanics (v1.0)

### 2.1. Character Vitals
The player's state is managed by three primary resources:
- **HP (Health Points):** Represents the character's life force. Lost in dangerous situations and can be restored by items or rest.
- **Energy:** The primary resource for performing actions, including skilling, working, and other strenuous activities. Regenerates primarily through sleep.
- **Hunger:** A persistent need that drains over time. If hunger gets too high, it may apply penalties to energy regeneration or other stats. Restored by eating food.

### 2.2. Time & World
The game features a persistent clock and calendar.
- **Day/Night Cycle:** Time passes continuously. The time of day affects NPC schedules, location visuals, and the availability of certain actions or events.
- **Seasons & Weather:** The world progresses through four seasons over 365 in-game days. The game will have dynamic weather and temperature, which will be visually reflected on the **LocationScreen**. While temperature has no mechanical effect in v1.0, it is planned for future updates (e.g., requiring warm clothing).

### 2.3. Sleep & Stamina
- **Mechanics:** Players can choose to sleep to restore Energy. The quality of the sleeping location matters.
- **Sleep Quality:** Sleeping on the floor or in a cheap inn room will restore less energy per hour than sleeping in a comfortable bed the player owns or rents long-term.

### 2.4. Inventory & Encumbrance
- **Weight-Based System:** The player's inventory is limited by a maximum carry weight, not by item slots. Every item in the game has a specific weight.
- **Encumbrance:** If the player exceeds their maximum carry weight, they may suffer penalties (e.g., faster energy drain, slower movement in future updates).
- **Starting Capacity:** The initial maximum carry weight is 50.0 kg.
- **Increasing Capacity:** This limit can be increased in the future through stats (like Strength) or special equipment.

### 2.5. Reading & Lore
- **Mechanics:** Players can visit libraries in the world to read books and learn more about the lore. Interacting with a library will open a dedicated **Library Screen**, where players can browse and read the available collection.
- **Future Updates:** In a future version, books will become collectible items that can be found in the world, purchased from merchants, or received as quest rewards. Players will be able to read them directly from their inventory or display them in their player-owned home.

### 2.6. Travel & Exploration
- **Travel Time:** Moving between major world areas (e.g., from the city to the wilderness) is not instantaneous. It is a meaningful action that causes the in-game clock to advance, making the world feel larger and requiring players to plan their days.
- **Travel Cost (v1.0):** For the v1.0 release, travel **only costs time**. It does not consume resources like Energy or Hunger. This is to prevent players from getting stranded in a location with no way to rest or recover. Resource costs for travel may be introduced in a future update.
- **Example Travel Times:**
    -   Crossroads to Shingleback Shore: 15 minutes
    -   Crossroads to Driftwatch Woods: 30 minutes
    -   Crossroads to Southern Mountains: 1 hour 30 minutes

#### 2.6.1. User Interface
- **Confirmation:** When the player initiates travel, a **Confirmation Modal** will appear, displaying the destination and the travel time (e.g., "Travel to the Driftwatch Woods? This will take 30 minutes."). This reuses the existing `ConfirmationModal.tsx` component.
- **Time Passage:** Upon confirmation, the **TimedActionModal** will be displayed in its "progress" state, showing the passage of time as the in-game clock advances. This reuses the existing `TimedActionModal.tsx` component.
- **No New UI:** This approach leverages existing UI components, ensuring consistency and avoiding the need to create new modals for this mechanic in v1.0.


## 3. The Skilling Loop (v1.0)

### 3.1. v1.0 Skills
The initial release will feature a focused set of skills that can be leveled up by the player:
- **Woodcutting:** Gathering wood from trees.
- **Fishing:** Catching fish from various bodies of water.
- **Cooking:** Using raw ingredients to create food that restores Hunger.
- **Attack:** Influences damage dealt in combat.
- **Defence:** Influences damage taken in combat.

The following are also present in v1.0 but are **not levelable skills**:
- **Carpentry:** A lore skill introduced via quest mechanics. It cannot be leveled up by the player in v1.0.
- **Agility:** A static combat stat used to determine turn order and evasion. It does not gain XP and does not level up in v1.0.

### 3.2. Mechanics
Skills are progressed by performing actions.
- **Resource Skills (Woodcutting, Fishing, Cooking):** Progressed by performing a relevant action at a specific location (e.g., using "Chop Wood" in a forest). This consumes Time and Energy, and grants XP and resources upon completion.
- **Combat Skills (Attack, Defence):** Progressed organically through combat.
    - **Attack XP** is gained by dealing damage.
    - **Defence XP** is gained by taking damage.

## 4. The Relationship Loop (v1.0)

### 4.1. Interaction System
Socializing is a core part of the game.
- **Hybrid Dialogue:** Conversations combine a categorized action system (like *The Sims*) with branching dialogue choices (like *Fallout/Skyrim*). For v1.0, the categorized menu will focus on a **"Friendly"** menu with options like "Talk" and "Compliment."
- **Interaction Limit:** To make social choices meaningful, players may only perform one significant social "interaction" with a given NPC per day.

### 4.2. Relationship Stats
NPCs track multiple stats to create complex relationships:
- **Friendship:** General positive sentiment.
- **Love:** Romantic affection.
- **Fear:** How much the NPC is intimidated by you.
- **Obedience:** How much the NPC is willing to follow your commands, even if they dislike you.

## 5. Combat System (v1.0)
The first version of the combat system is a **simple, clear, and fast-paced turn-based system** designed to be intuitive and functional.

-   **Core Mechanics:**
    -   **Actions:** Players can **Attack**, **Defend**, or **Flee**.
    -   **Turn Order:** Determined by the **Agility** skill.
    -   **Simplicity:** For v1.0, there will be **no Action Points, no party positioning, and no status effects**. Each character performs one action per turn.
-   **Party:**
    -   The player can have one active **companion** in combat.
    -   Enemy squads can have a maximum of **four** combatants.
-   **Combat UI:**
    -   The UI will feature player/companion "cards" on the left and enemy "cards" on the right, each showing health.
    -   A clear action menu and a combat log will be present.
-   **Progression & Companions:**
    -   A new **Companion Screen** will be added to the UI to manage the companion's stats and gear.

## 6. Quests & World State (v1.0)

### 6.1. Quest Types
- **NPC Quests:** Given by individuals, often related to their personal stories.
- **World Quests:** Tasks related to improving or changing the game world.

### 6.2. Branching Narratives & World State
Player choices have consequences that are tracked by a "World State" system.
- **Example:** The first quest involves helping Roberta, the fishmonger. The player can either:
    1.  **DIY Route:** Use their own Woodcutting and Carpentry skills to gather wood and repair her shop.
    2.  **Delegate Route:** Pay an NPC to do the repairs.
- The choice and outcome are stored, and other NPCs may acknowledge how the situation was resolved.

## 7. Job System (v1.0)

Jobs are a core activity for earning a reliable income. The system is designed to encourage punctuality and has clear consequences for being late or absent.

-   **Standard Shifts:** Most jobs have a fixed start time (e.g., 8:00).
-   **Punctuality Windows:**
    -   **On-Time:** Players can arrive within a designated window before the official start time (e.g., 7:00 - 8:00) to be considered on time.
    -   **Late:** Arriving after the official start time, but within a grace period (e.g., 8:01 - 10:00), is considered late.
    -   **Absent:** Arriving after the grace period means the player has missed the shift for the day.
-   **Consequences:**
    -   **Late Arrivals:** Result in reduced pay for the shift and a potential decrease in job performance/supervisor relationship.
    -   **Absences:** No pay is earned, and performance/relationship metrics are negatively impacted more severely.

## 9. Progression and Economy

This section outlines the core mathematical systems that govern player progression and the game's economy.

### 8.1. XP Formula

All skills in the game, from Woodcutting to Attack, follow a unified, exponential XP curve inspired by classic MMOs like RuneScape. This ensures a consistent and rewarding progression arc across all disciplines.

-   **Levels:** All skills range from level 1 to 99.
-   **XP Curve:** The experience required to level up follows a formula that makes early levels fast and later levels increasingly challenging, rewarding dedication.

While the exact numbers are stored in the `xp_table.json` file, the formula for the total XP required for a given level `n` is based on the following principles:

Total XP for Level n = (1/4) * (n-1 + 300 * 2^((n-1)/7)) 

This formula is a well-tested standard that provides a smooth and engaging long-term progression.

### 8.2. Currency & Economy

The economy of Divine Fantasy is designed to be stable and intuitive, providing clear incentives for players to engage with the world.

-   **Tiered Currency:** As established, the currency is divided into Copper, Silver, and Gold.
    -   100 Copper = 1 Silver
    -   100 Silver = 1 Gold

-   **Money Flow (v1.0):**
    -   **Sources (How players earn money):**
        -   **Quest Rewards:** Completing quests for NPCs is a primary source of income (e.g., "Planks for the Past").
        -   **Jobs:** Taking on a steady job provides a reliable, albeit time-consuming, daily wage (e.g., "The Dockworker").
        -   **Selling Goods:** Players can sell resources (like `wolf_pelts` or `fish_raw`) and crafted items to merchants. Merchant prices will have a slight markup, meaning they buy for less than the item's base value.

    -   **Sinks (How players spend money):**
        -   **Purchasing Goods:** Buying tools, food, materials, and other items from shops.
        -   **Services:** Paying for services, such as renting a room at the Salty Mug or paying Crawler to complete a quest objective.
        -   **Future Sinks:** In later updates, money will be required for housing, business ownership, army upkeep, and more.

## 8. Companion Mechanics (v1.0)

Companions are NPCs who join the player on their journey, assisting in combat and participating in the story. The system is designed to be straightforward for the initial release.

-   **Active Companion Limit:** The player can only have **one active companion** at a time.
-   **Recruitment Check:** Before a new companion can be recruited (e.g., through a quest dialogue), the game will check if the player already has an active companion. If they do, they will not be able to recruit the new one until the current one is dismissed.
-   **Companion Types:**
    -   **Temporary Companions:** These companions join the player for a specific quest or a limited duration. Once the quest is complete or the duration expires, they will automatically leave the player's party. (e.g., Ronald for "The Wolf Pack" quest).
    -   **Permanent Companions:** These companions join the player indefinitely until they are dismissed. (No permanent companions are available in v1.0, but the system will support them).
-   **Combat Participation:**
    -   If the player has an active companion when combat begins, that companion will automatically join the fight alongside the player.
    -   Companions act on their own turn, controlled by the game's AI. Their actions are determined by their role and abilities (e.g., a hunter might prioritize ranged attacks).
-   **Companion Management:** A dedicated **Companion Screen** will be accessible from the main UI, allowing the player to view their active companion's stats, and equipment.
# Game Content (v1.0: Driftwatch)

This master document details all playable content for the v1.0 release, focused on the city of Driftwatch. It is designed to be a direct reference for implementing the mechanics outlined in `3-GAMEPLAY.MD`.

---

## 1. World Hub: Driftwatch

Driftwatch is the primary and only hub for v1.0. It is a bustling port town with a mix of weathered sailors, aspiring nobles, and hardworking common folk.

### 1.1. Hub Connections (Overview)

For v1.0, travel inside Driftwatch is free and instant. Only the Crossroads ↔ Driftwatch Woods route consumes time (1 hour). The city hub connections are:

- Hub connects to: Main Street, Noble Quarter, Docks, The Slums, Crossroads
- Main Street connects to: Leo's Lighthouse, Beryl's General Goods, Kaelen's Forge, Hub
- Leo's Lighthouse connects to: Main Street
- Beryl's General Goods connects to: Main Street
- Kaelen's Forge connects to: Main Street
- Noble Quarter connects to: Hub, Mosswatch Keep, The Grand Library
- Mosswatch Keep connects to: Noble Quarter, Tidehunter Quarter
- The Grand Library connects to: Noble Quarter
- Tidehunter Quarter connects to: Mosswatch Keep
- Docks connect to: Hub, Tide & Trade
- Tide & Trade connects to: Docks
- Slums connect to: Hub, Salty Mug, Herbalist's Hovel
- Salty Mug connects to: Slums
- Salty Mug Rented Room connects to: Salty Mug
- Herbalist's Hovel connects to: Slums
- Crossroads connect to: Hub, Driftwatch Woods (timed, 1 hour), Homestead Farm
- Driftwatch Woods connect to: Crossroads (timed, 1 hour), Hunter's Cabin, Sawmill
- Sawmill connects to: Driftwatch Woods
- Homestead Farm connects to: Crossroads

### 1.1. Main Street

*   **Location ID:** `driftwatch_main_street`
*   **Description:** The central thoroughfare of Driftwatch, lined with essential shops and the path to the orphanage.
*   **NPCs Present:** None.
*   **Actions:**
    *   None.
*   **Travel Connections:**
    *   Leo's Lighthouse
    *   Beryl's General Goods
    *   Kaelen's Forge
    *   Driftwatch Hub

#### 1.1.1. Leo's Lighthouse (Orphanage)
*   **Location ID:** `leo_lighthouse`
*   **Description:** A repurposed lighthouse that now serves as a home for the city's orphans, run by the kindly Old Leo.
*   **NPCs Present:** Old Leo, Sarah, Robert, Kyle.
*   **Actions:**
    *   Talk to Old Leo
    *   Talk to Sarah
    *   Talk to Robert
    *   Talk to Kyle
*   **Travel Connections:**
    *   Driftwatch Main Street

#### 1.1.2. Beryl's General Goods
*   **Location ID:** `beryls_general_goods`
*   **Description:** A cluttered but well-stocked shop for all basic necessities.
*   **NPCs Present:** Beryl.
*   **Actions:**
    *   Talk to Beryl
    *   Trade
*   **Travel Connections:**
    *   Driftwatch Main Street

#### 1.1.3. Kaelen's Forge
*   **Location ID:** `kaelens_forge`
*   **Description:** A hot, loud, and impressive forge where the town's metalwork is done. For v1.0, it is not interactive.
*   **NPCs Present:** Kaelen, Cyrus.
*   **Actions:**
    *   Talk to Kaelen
    *   Talk to Cyrus
*   **Travel Connections:**
    *   Driftwatch Main Street

### 1.2. Noble Quarter

*   **Location ID:** `driftwatch_noble_quarter`
*   **Description:** A clean and orderly district, characterized by its elegant stone architecture. This is where the city's elite and the city guard reside.
*   **NPCs Present:** None.
*   **Actions:**
    *   None.
*   **Travel Connections:**
    *   Driftwatch Main Street
    *   Mosswatch Keep
    *   The Grand Library

#### 1.2.1. Mosswatch Keep
*   **Location ID:** `mosswatch_keep`
*   **Description:** An imposing stone fortress that houses the Driftwatch city guard. The air is disciplined and orderly.
*   **NPCs Present:** Corporal Matthias.
*   **Actions:**
    *   Talk to Corporal Matthias
*   **Travel Connections:**
    *   Driftwatch Noble Quarter
    *   Tidehunter Quarter

#### 1.2.2. The Grand Library
*   **Location ID:** `grand_library`
*   **Description:** A quiet repository of knowledge, moved to the Noble Quarter. The air smells of old paper and dust.
*   **NPCs Present:** Adalia.
*   **Actions:**
    *   Talk to Adalia
    *   Read Books
*   **Travel Connections:**
    *   Driftwatch Noble Quarter

#### 1.2.3. Tidehunter Quarter
*   **Location ID:** `tidehunter_quarter`
*   **Description:** The barracks for the elite Tidehunter guards, located within Mosswatch Keep.
*   **NPCs Present:** Sergeant Rodrick.
*   **Actions:**
    *   Talk to Sergeant Rodrick
*   **Travel Connections:**
    *   Mosswatch Keep

### 1.3. Docks

*   **Location ID:** `driftwatch_docks`
*   **Description:** The bustling heart of Driftwatch's economy, filled with the scent of salt, fish, and tar.
*   **NPCs Present:** Captain Elias, Boric.
*   **Actions:**
    *   Talk to Captain Elias
    *   Talk to Boric
    *   Fish
    *   Work (Job managed by Boric)
*   **Travel Connections:**
    *   Driftwatch Main Street
    *   Tide & Trade

#### 1.3.1. Tide & Trade
*   **Location ID:** `tide_trade`
*   **Description:** Roberta's fishmonger shop.
*   **NPCs Present:** Roberta.
*   **Actions:**
    *   Talk to Roberta
    *   Trade
*   **Travel Connections:**
    *   Driftwatch Docks

### 1.4. The Slums

*   **Location ID:** `driftwatch_slums`
*   **Description:** A poorer, more dangerous part of town, but full of character and opportunity for those not afraid to get their hands dirty.
*   **NPCs Present:** Finn, Old Crank, Elara.
*   **Actions:**
    *   Sleep on the floor (Restores 5 Energy/hour)
    *   Cook on Firepit
*   **Travel Connections:**
    *   Driftwatch Main Street
    *   Salty Mug (Tavern)
    *   Herbalist's Hovel

#### 1.4.1. Salty Mug (Tavern)
*   **Location ID:** `salty_mug`
*   **Description:** A dimly lit, rowdy tavern frequented by sailors and the city's underbelly.
*   **NPCs Present:** Finn, Old Crank.
*   **Actions:**
    *   Talk to Finn
    *   Talk to Old Crank
    *   Trade (Food & Drinks)
    *   Rent Room
*   **Travel Connections:**
    *   The Slums

#### 1.4.2. Salty Mug Rented Room
*   **Location ID:** `salty_mug_rented_room`
*   **Description:** A small, cheap room for rent.
*   **NPCs Present:** None.
*   **Actions:**
    *   Sleep in Bed (Restores 10 Energy/hour)
*   **Travel Connections:**
    *   Salty Mug (Tavern)

#### 1.4.3. Herbalist's Hovel
*   **Location ID:** `herbalists_hovel`
*   **Description:** A small, strange hut filled with drying herbs and mysterious potions.
*   **NPCs Present:** Elara.
*   **Actions:**
    *   Talk to Elara
*   **Travel Connections:**
    *   The Slums

### 1.5. The Crossroads

*   **Location ID:** `the_crossroads`
*   **Description:** A crucial intersection where the path from Driftwatch splits, leading to the wider, untamed wilderness of the region. It serves as the primary hub for travelers and adventurers heading into the forests, mountains, and beyond.
*   **NPCs Present:** None.
*   **Actions:**
    *   None.
*   **Travel Connections:**
    *   Driftwatch Hub
    *   Driftwatch Woods (timed, 1 hour)
    *   Homestead Farm
    *   Shingleback Shore (Placeholder)
    *   Southern Mountains (Placeholder)
    *   Abandoned Watchtower (Placeholder)

#### 1.5.1. Driftwatch Woods (Forest)
*   **Location ID:** `driftwatch_woods`
*   **Description:** A dense, wild forest near Driftwatch. A place for gathering resources and facing danger.
*   **NPCs Present:** None.
*   **Actions:**
    *   Chop Wood
    *   Fish
    *   Explore (Triggers random encounters)
*   **Travel Connections:**
    *   The Crossroads
    *   Hunter's Cabin (within the woods)
    *   Sawmill (within the woods)

##### 1.5.1.1. Sawmill
*   **Location ID:** `sawmill`
*   **Description:** A loud, industrious sawmill where logs are processed into planks.
*   **NPCs Present:** Crawler.
*   **Actions:**
    *   Convert Logs to Planks
*   **Travel Connections:**
    *   Driftwatch Woods

#### 1.5.2. Homestead Farm
*   **Location ID:** `homestead_farm`
*   **Description:** A simple, hardworking farm that supplies much of the town's food.
*   **NPCs Present:** Ben, Elisa, Rowan.
*   **Actions:**
    *   Talk to Ben
    *   Talk to Elisa
    *   Talk to Rowan
*   **Travel Connections:**
    *   The Crossroads

---

## 2. Key NPCs of Driftwatch

This section details the characters the player will meet in v1.0.

### Main Street NPCs

*   **Beryl** (`npc_id: "npc_beryl"`)
    *   **Location:** Beryl's General Goods
    *   **Role:** General Goods Merchant.
    *   **Initial Quest:** "First Delivery" (see Quests section).

*   **Kaelen** (`npc_id: "npc_kaelen"`)
    *   **Location:** Kaelen's Forge
    *   **Role:** Blacksmith.
    *   **Initial Quest:** "Assistant's Anxiety" (can be started via Cyrus).

*   **Cyrus** (`npc_id: "npc_cyrus"`)
    *   **Location:** Kaelen's Forge
    *   **Role:** Blacksmith's Apprentice.
    *   **Initial Quest:** "Assistant's Anxiety" (Giver).

### Noble Quarter NPCs

*   **Adalia** (`npc_id: "npc_adalia"`)
    *   **Location:** The Grand Library
    *   **Role:** Librarian. A kind, elderly woman dedicated to preserving knowledge.

*   **Corporal Matthias** (`npc_id: "npc_matthias"`)
    *   **Location:** Mosswatch Keep
    *   **Role:** A friendly guard at the keep entrance. He directs people to the right person.

*   **Sergeant Rodrick** (`npc_id: "npc_rodrick"`)
    *   **Location:** Tidehunter Quarter
    *   **Role:** Sergeant of the Tidehunters. A grim, serious man concerned with the safety of the region. Quest giver.

### Docks NPCs

*   **Boric** (`npc_id: "npc_boric"`)
    *   **Location:** Driftwatch Docks
    *   **Role:** Dockmaster, Dockhand Job Supervisor. A burly, no-nonsense man who manages the day-to-day chaos of the docks.

*   **Captain Elias** (`npc_id: "npc_elias_captain"`)
    *   **Location:** Driftwatch Docks
    *   **Role:** Sea Captain. A seasoned and well-traveled captain whose ship is currently docked at Driftwatch. He is often seen overseeing his vessel and crew, preparing for his next voyage.

*   **Roberta** (`npc_id: "npc_roberta"`)
    *   **Location:** Tide & Trade
    *   **Role:** Fishmonger, Quest Giver.
    *   **Initial Quest:** "Planks for the Past" (see Quests section).

### Slums NPCs

*   **Finn** (`npc_id: "npc_finn"`)
    *   **Location:** Salty Mug (Tavern)
    *   **Role:** Tavern Keeper.

*   **Old Crank** (`npc_id: "npc_old_crank"`)
    *   **Location:** Salty Mug (Tavern)
    *   **Role:** Drunkard with a sharp tongue.

*   **Elara** (`npc_id: "npc_elara"`)
    *   **Location:** Herbalist's Hovel
    *   **Role:** Herbalist.

### Outskirts NPCs

*   **Crawler** (`npc_id: "npc_crawler"`)
    *   **Location:** Sawmill
    *   **Role:** Sawmill operator.



*   **Ben** (`npc_id: "npc_ben"`)
    *   **Location:** Homestead Farm
    *   **Role:** Farmer.

*   **Elisa** (`npc_id: "npc_elisa"`)
    *   **Location:** Homestead Farm
    *   **Role:** Farmer's Wife.

*   **Rowan** (`npc_id: "npc_rowan"`)
    *   **Location:** Homestead Farm
    *   **Role:** Farmer's Son.

### Lighthouse NPCs

*   **Old Leo** (`npc_id: "npc_old_leo"`)
    *   **Location:** Leo's Lighthouse
    *   **Role:** Orphanage Caretaker.

*   **Sarah** (`npc_id: "npc_sarah"`)
    *   **Location:** Leo's Lighthouse
    *   **Role:** Orphan.

*   **Robert** (`npc_id: "npc_robert"`)
    *   **Location:** Leo's Lighthouse
    *   **Role:** Orphan.

*   **Kyle** (`npc_id: "npc_kyle"`)
    *   **Location:** Leo's Lighthouse
    *   **Role:** Orphan.

---

## 3. Jobs (v1.0)

This section details the repeatable jobs available to the player in v1.0. Jobs are a primary source of income and are managed through the **Job Screen**.

### 1. Dockhand

*   **Job ID:** `job_dockhand`
*   **Location:** `driftwatch_docks`
*   **Supervisor:** Boric (`npc_boric`)
*   **Description:** Perform manual labor at the bustling Driftwatch Docks. Tasks include loading and unloading cargo, cleaning, and other physically demanding duties.
*   **Shift Details:**
    *   **Official Start Time:** 8:00
    *   **On-Time Arrival:** 7:00 - 8:00
    *   **Late Arrival Window:** 8:01 - 10:00
    *   **Shift End:** 16:00
*   **Mechanics:**
    *   The player must first speak to Boric to get the job.
    *   Once hired, the "Work" action becomes available at the `driftwatch_docks` during the designated hours.
    *   **Punctuality:**
        *   Arriving **on-time** yields full pay and a positive impact on performance.
        *   Arriving **late** results in reduced pay and a negative impact on performance.
        *   Arriving after 10:00 counts as a **missed day**, yielding no pay and a significant negative impact on performance.
    *   Working a shift consumes a significant amount of energy.
    *   Performance and relationship with the supervisor are tracked via the **Job Screen**.
*   **Rewards:**
    *   **Base Pay:** 20 Copper per full shift. (Reduced if late).
    *   **Energy Cost:** -60 Energy.

---

## 4. Quests (v1.0)

This section defines the initial quests for the v1.0 release.

### 1. "Planks for the Past"

*   **Quest ID:** `roberta_planks_for_the_past`
*   **Giver:** Roberta (`npc_roberta`) at `tide_trade`.
*   **Description:** Roberta's shop was damaged in a storm and has a large hole in the wall. She can't afford the materials or labor to fix it. The player is presented with a choice: repair the wall themselves or pay someone else to do it.
*   **Objectives & Player Choices:**

    *   **Path 1: The DIY Carpenter**
        1.  **Gather Materials:** The player must first acquire 10 `wooden_planks`. This involves:
            *   Chopping down trees in the `driftwatch_woods` to get `logs`.
            *   Taking the `logs` to the `sawmill` and using the "Convert Logs to Planks" action.
        2.  **Speak to Roberta:** After gathering the 10 planks, the player returns to Roberta. Impressed with their effort, she gives them a `hammer` and some `nails` to finish the job.
        3.  **Repair the Wall:** The player can now use the "Repair Wall" action at the `tide_trade` location.
        4.  **Claim Reward:** Speak to Roberta one last time.
        *   **Completion:**
            *   Sets `world_flags.tide_trade_wall_repaired` to `true`.
            *   **Reward:** 2 Silver, 500 Carpentry XP, +20 Friendship with Roberta.

    *   **Path 2: The Delegator**
        1.  **Talk to Crawler:** The player can go to the `sawmill` and speak with `Crawler`.
        2.  **Pay for Services:** The player can pay Crawler a fee of 10 Silver to source the materials and perform the repairs himself.
        3.  **Report to Roberta:** After the job is done (a short time will pass), the player can return to Roberta.
        *   **Completion:**
            *   Sets `world_flags.tide_trade_wall_repaired` to `true`.
            *   **Reward:** +25 Friendship with Roberta.



---

## 5. Combat Encounters (v1.0)

This section details specific combat scenarios for v1.0.

### 1. Forest Disturbance (Encounter 1)

*   **Encounter ID:** `forest_wolves_1`
*   **Location:** `forest`
*   **Trigger:** Using the "Investigate Disturbance" action.
*   **Enemies:**
    *   1x Forest Wolf (`enemy_id: "wolf_forest"`)
*   **Rewards:**
    *   **Loot:** 1x Wolf Pelt.

### 1. Forest Disturbance (Encounter 2)

*   **Encounter ID:** `forest_wolves_2`
*   **Location:** `forest`
*   **Trigger:** Using the "Investigate Disturbance" action.
*   **Enemies:**
    *   2x Forest Wolf (`enemy_id: "wolf_forest"`)
*   **Rewards:**
    *   **Loot:** 2x Wolf Pelt.

### 1. Forest Disturbance (Encounter 3)

*   **Encounter ID:** `forest_wolves_3`
*   **Location:** `forest`
*   **Trigger:** Using the "Investigate Disturbance" action.
*   **Enemies:**
    *   4x Forest Wolf (`enemy_id: "wolf_forest"`)
*   **Rewards:**
    *   **Loot:** 4x Wolf Pelt.



---

## 6. Companions (v1.0)

This section details companions available to the player in v1.0. The player may only have one active companion at a time.



---

## 7. Books (v1.0)

This section details the initial books available for reading in the Driftwatch Library.

### 1. "The Fall of House Odran"
*   **Book ID:** `book_odran_fall`
*   **Author:** Maester Aristeles
*   **Content:** A historical account of Odran's Rebellion, detailing the political climate, major battles, and the eventual downfall of House Odran.

### 2. "The Year of the Frozen Moon"
*   **Book ID:** `book_frozen_moon`
*   **Author:** Maester Aristeles
*   **Content:** A historical account of the unnatural winter that led to the rise of the Moon's Creed in The Whispers.

### 3. "The Pearl War"
*   **Book ID:** `book_pearl_war`
*   **Author:** Maester Aristeles
*   **Content:** A historical account of the civil war within House Lirs that resulted in the establishment of a matriarchy in the Pearl Islands.

---

## 8. Items & Crafting (v1.0)

This section details all items and crafting recipes for v1.0.

### 8.1. Items

| Item ID            | Name             | Type      | Weight | Base Value | Description                                         |
|--------------------|------------------|-----------|--------|------------|-----------------------------------------------------|
| `log`              | Log              | Resource  | 5.0    | 2          | A rough log, needs to be processed.                 |
| `wooden_plank`     | Wooden Plank     | Resource  | 2.5    | 5          | A sturdy plank, ready for construction.             |
| `fish_sardine`     | Raw Sardine      | Food      | 0.3    | 4          | A small, oily saltwater fish. Best when cooked.     |
| `fish_trout`       | Raw Trout        | Food      | 0.6    | 7          | A common freshwater fish. Best when cooked.         |
| `fish_pike`        | Raw Pike         | Food      | 1.2    | 15         | A large, predatory freshwater fish. Best when cooked. |
| `food_sardine_grilled` | Grilled Sardine  | Food      | 0.3    | 10         | Restores 15 Hunger.                                 |
| `food_trout_grilled`   | Grilled Trout    | Food      | 0.6    | 18         | Restores 30 Hunger.                                 |
| `food_pike_grilled`    | Grilled Pike     | Food      | 1.2    | 35         | Restores 60 Hunger.                                 |
| `wolf_pelt`        | Wolf Pelt        | Resource  | 1.0    | 15         | A pelt from a forest wolf.                          |
| `axe_basic`        | Basic Axe        | Tool      | 3.0    | 50         | A simple axe for chopping wood.                     |
| `fishing_rod`      | Fishing Rod      | Tool      | 1.5    | 40         | A basic rod for catching fish.                      |
| `hammer`           | Hammer           | Tool      | 2.0    | 30         | Used for construction and repairs.                  |
| `nails`            | Nails            | Resource  | 0.1    | 1          | Essential for carpentry.                            |

### 8.2. Crafting Recipes

#### Carpentry (Not a player skill in v1.0)
*   **Note:** Carpentry is introduced in the "Planks for the Past" quest but is not a levelable skill for the player. The following recipe is used by an NPC or as part of a quest action, not through a player-accessible crafting menu.
*   **Recipe:** Wooden Plank
    *   **Action:** "Convert Logs to Planks" at the Sawmill.
    *   **Output:** 1x `wooden_plank`
    *   **Ingredients:** 1x `log`, 5 cooper coins
    *   **Time:** 15 minutes

#### Cooking (Cooking Stove / Fire)

*   **Recipe:** Grilled Sardine
    *   **Output:** 1x `food_sardine_grilled`
    *   **Ingredients:** 1x `fish_sardine`
    *   **Time:** 5 minutes
    *   **XP:** 10 Cooking XP

*   **Recipe:** Grilled Trout
    *   **Output:** 1x `food_trout_grilled`
    *   **Ingredients:** 1x `fish_trout`
    *   **Time:** 8 minutes
    *   **XP:** 25 Cooking XP

*   **Recipe:** Grilled Pike
    *   **Output:** 1x `food_pike_grilled`
    *   **Ingredients:** 1x `fish_pike`
    *   **Time:** 12 minutes
    *   **XP:** 50 Cooking XP

---

## 9. Shops & Merchants (v1.0)

This section details all merchants and their inventories for v1.0.

### 9.1. Beryl's General Goods

*   **Merchant:** Beryl (`npc_beryl`)
*   **Location:** `beryls_general_goods`
*   **Description:** A cluttered but well-stocked shop for all basic necessities.
*   **Inventory:**
    | Item ID       | Name          | Base Price |
    |---------------|---------------|------------|
    | `axe_basic`   | Basic Axe     | 50         |
    | `fishing_rod` | Fishing Rod   | 40         |
    | `nails`       | Nails         | 1          |
    | `cloth`       | Cloth         | 10         |
    | `bread`       | Bread         | 5          |
    | `cheese`      | Cheese        | 8          |

### 9.2. Tide & Trade

*   **Merchant:** Roberta (`npc_roberta`)
*   **Location:** `tide_trade`
*   **Description:** Roberta's fishmonger shop.
*   **Inventory:**
    | Item ID    | Name     | Base Price |
    |------------|----------|------------|
    | `fish_sardine` | Raw Sardine | 4          |
    | `fish_trout`   | Raw Trout   | 7          |

### 9.3. Salty Mug (Tavern)

*   **Merchant:** Finn (`npc_finn`)
*   **Location:** `salty_mug`
*   **Description:** A dimly lit, rowdy tavern. Finn sells food and drinks.
*   **Inventory:**
    | Item ID       | Name        | Base Price |
    |---------------|-------------|------------|
    | `food_sardine_grilled` | Grilled Sardine | 10         |
    | `food_trout_grilled`   | Grilled Trout   | 18         |
    | `ale`         | Ale         | 4          |

---

## 10. Skilling Content Details (v1.0)

This section provides specific implementation details for the skilling loops.

### 10.1. Woodcutting

*   **Action:** "Chop Wood"
*   **Location:** `driftwatch_woods`
*   **Requires:** `axe_basic` in inventory.
*   **Mechanics:**
    *   Consumes 10 Energy per action.
    *   Takes 30 in-game minutes per action.
*   **Rewards:**
    *   **XP:** 30 Woodcutting XP.
    *   **Items:** 1x `log`.

### 10.2. Fishing

#### Location 1: Driftwatch Docks (Canals)
*   **Action:** "Fish"
*   **Location:** `driftwatch_docks`
*   **Requires:** `fishing_rod` in inventory.
*   **Mechanics:**
    *   Consumes 5 Energy per action.
    *   Takes 20 in-game minutes per action.
*   **Rewards (Loot Table):**
    *   **Common (90% chance):**
        *   **XP:** 15 Fishing XP
        *   **Item:** 1x `fish_sardine` (Requires Fishing Level 1)
    *   **Uncommon (10% chance):**
        *   No item, message indicates "The fish got away."

#### Location 2: Driftwatch Woods (River)
*   **Action:** "Fish"
*   **Location:** `driftwatch_woods`
*   **Requires:** `fishing_rod` in inventory.
*   **Mechanics:**
    *   Consumes 5 Energy per action.
    *   Takes 20 in-game minutes per action.
*   **Rewards (Loot Table):**
    *   **Common (70% chance):**
        *   **XP:** 15 Fishing XP
        *   **Item:** 1x `fish_trout` (Requires Fishing Level 1)
    *   **Uncommon (20% chance):**
        *   **XP:** 40 Fishing XP
        *   **Item:** 1x `fish_pike` (Requires Fishing Level 5)
    *   **Rare (10% chance):**
        *   No item, message indicates "The fish got away."

### 10.3. Cooking

*   **Action:** "Cook on Firepit"
*   **Location:** `driftwatch_slums`
*   **Requires:** A raw fish item in inventory.
*   **Mechanics:**
    *   Opens a simple crafting interface showing available cooking recipes.
    *   Executing a recipe consumes the ingredient and time.
*   **Recipes:**
    *   See Section 8.2 for `Grilled Sardine`, `Grilled Trout`, and `Grilled Pike`.

# 8. Future Updates

This document is for planning future updates, such as v1.1, v2.0, and beyond. It captures the long-term vision for the game.

## Future Content (Post v1.0)

This section contains content ideas and placeholders that are planned for releases after v1.0.

### Locations

The following locations are planned as expansions from The Crossroads.

#### Shingleback Shore
*   **Location ID:** `shingleback_shore`
*   **Description:** A placeholder for a future coastal area. Not implemented in v1.0.
*   **NPCs Present:** None.
*   **Actions:**
    *   None.
*   **Travel Connections:**
    *   The Crossroads

#### Southern Mountains
*   **Location ID:** `southern_mountains`
*   **Description:** A placeholder for a future mountain range. Not implemented in v1.0.
*   **NPCs Present:** None.
*   **Actions:**
    *   None.
*   **Travel Connections:**
    *   The Crossroads

#### Abandoned Watchtower
*   **Location ID:** `abandoned_watchtower`
*   **Description:** A placeholder for a future ruined watchtower. Not implemented in v1.0.
*   **NPCs Present:** None.
*   **Actions:**
    *   None.
*   **Travel Connections:**
    *   The Crossroads

## v1.1 (Foundations for Expansion)

The focus of this update will be on introducing core systems that create a more dynamic and dangerous world, and on improving the player experience with a dedicated desktop version.

*   **Full Combat System:** Design and implement the core combat loop, including player stats, abilities, and enemy AI.
*   **Desktop App:** Release a standalone desktop version using **Tauri**. This will provide a more stable platform and a seamless save/load experience using the native file system.
*   **Advanced World Systems:**
    *   **Faction Reputation:** Introduce a system to track the player's standing with major factions like the noble houses.
    *   **Regional Prosperity:** Implement a mechanic where player actions (e.g., completing quests, investing in shops) can affect the economic prosperity of a town or area.

---

## v2.0 (The Conquest Update)

This major update will introduce the grand strategy layer of the game, allowing the player to transition from an individual adventurer to a powerful lord.

*   **The Conquest Loop:** Implement the full strategic layer:
    *   **Army Management:** Recruit, train, and command troops.
    *   **Sieges:** Lead armies to besiege and capture enemy holdings.
    *   **Naval Warfare:** Build and command ships for transport and combat.

*   **Business Ownership:** Allow players to purchase and manage businesses, such as taverns, forges, and farms, creating a passive income stream.

*   **Faction Quests:** Introduce deep, story-driven questlines for the major noble houses, allowing the player to forge alliances or make enemies.

---

## v2.1 (Synergy & Systems)

### Linking Combat and Conquest

The turn-based combat system and the grand strategy Conquest loop will be designed to work in synergy, creating a gameplay experience that shifts between two layers:

*   **The Macro-Layer (Conquest):** This is the high-level strategic map where the player manages armies, resources, and territory. Battles between large armies can be auto-resolved based on troop strength, equipment, and leadership stats.

*   **The Micro-Layer (Turn-Based Combat):** This is where the player's party becomes directly involved in key moments of a larger conflict. This system connects to the macro-layer in several ways:
    *   **Hero-Led Battles:** When armies clash on the macro map, the player can choose to lead the charge. This triggers a critical turn-based battle where the player's party (acting as an elite "hero" unit) faces the enemy's champions. Winning this micro-battle can grant significant advantages to the larger, auto-resolved army battle, such as a massive morale boost or even an instant victory if an enemy leader is defeated.
    *   **Strategic Objectives & Sieges:** When besieging a location, the player's party can undertake special turn-based missions. Instead of fighting hundreds of soldiers, they might be tasked with a surgical strike: infiltrating the walls to open the gates, assassinating a commander, or destroying a key defensive structure. Success in these missions has a direct and decisive impact on the outcome of the siege.
    *   **Progression Loop:** The player character's progression forms the bridge between the two layers. Gear, skills, and experience gained in the micro-layer combat directly improve the party's effectiveness. In turn, a powerful character can unlock and improve macro-layer abilities, such as the `Leadership` skill, which enhances their entire army.
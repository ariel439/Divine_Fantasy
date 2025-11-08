# 7. Static Data Definitions (JSON Schemas)

This document defines the technical structure for all static JSON data files that power the game. Each section provides the schema and a concrete example.

---

## 7.A. `locations.json`

Defines all playable areas in the game, including their descriptive text, imagery, and available actions. New entries for `driftwatch_noble_quarter`, `mosswatch_keep`, `grand_library`, and `tidehunter_barracks` will be added.

### Schema

```json
{
  "location_id": {
    "name": "string",
    "day_description": "string",
    "night_description": "string",
    "day_background": "string (path)",
    "night_background": "string (path)",
    "music_track": "string (path)",
    "actions": [
      {
        "text": "string",
        "type": "string (navigate|dialogue|shop|fish|woodcut|...)",
        "target": "string (location_id|npc_id|shop_id|...)",
        //... other action-specific data
      }
    ],
    //... skilling data, etc.
  }
}
```

### Example: `tide_trade` (Roberta's Shop)

```json
{
  "tide_trade": {
    "name": "Tide & Trade",
    "day_description": "The smell of salt and fish hangs in the air. A large, poorly-patched hole in the wall lets in a draft.",
    "night_description": "The shop is quiet, save for the sound of the wind whistling through a hole in the wall.",
    "day_background": "GDD/assets/images/locations/tide_trade_day_damaged.png",
    "night_background": "GDD/assets/images/locations/tide_trade_night_damaged.png",
    "music_track": "GDD/assets/audio/music/shops.mp3",
    "actions": [
      {
        "text": "Talk to Roberta",
        "type": "dialogue",
        "target": "npc_roberta"
      },
      {
        "text": "Trade",
        "type": "shop",
        "target": "shop_tide_trade"
      },
      {
        "text": "Navigate to Docks",
        "type": "navigate",
        "target": "driftwatch_docks"
      }
    ]
  }
}
```

---

## 7.B. `npcs.json`

Defines all non-player characters, their home locations, and default dialogue greetings. New entries for `npc_matthias` and `npc_rodrick` will be added.

### Schema

```json
{
  "npc_id": {
    "name": "string",
    "home_location": "string (location_id)",
    "default_greeting": "string"
  }
}
```

### Example: `npc_roberta`

```json
{
  "npc_roberta": {
    "name": "Roberta",
    "home_location": "tide_trade",
    "default_greeting": "(Sighs) Another splinter. Just what I needed."
  }
}
```

---

## 7.C. `items.json`

Defines all items in the game, including their properties and what they can be used for.

### Schema

```json
{
  "item_id": {
    "name": "string",
    "description": "string",
    "type": "string (resource|consumable|tool|quest)",
    "stackable": "boolean",
    "weight": "number (in kg)",
    //... other item-specific data (e.g., hunger_restored)
  }
}
```

### Example: `wooden_plank`

```json
{
  "wooden_plank": {
    "name": "Wooden Plank",
    "description": "A sturdy plank of wood, useful for construction.",
    "type": "resource",
    "stackable": true,
    "weight": 0.5
  }
}
```

---

## 7.D. `quests.json`

Defines all quests, their objectives, and the dialogue trees associated with them. A new entry for `quest_wolf_pack` will be added.

### Schema

```json
{
  "quest_id": {
    "title": "string",
    "giver_id": "string (npc_id)",
    "description": "string",
    "objectives": [
      {
        "id": "string",
        "text": "string",
        "type": "string (talk|gather|use|...)",
        //... other objective-specific data
      }
    ],
    "dialogue_tree": {
      // ... see dialogue example in 6-CONTENT.MD
    }
  }
}
```

### Example: `roberta_planks_for_the_past`

```json
{
  "roberta_planks_for_the_past": {
    "title": "Planks for the Past",
    "giver_id": "npc_roberta",
    "description": "Roberta's fishmonger shop is falling apart. She needs wooden planks and other materials to repair a large hole in the wall.",
    "objectives": [
      {
        "id": "start",
        "text": "Speak to Roberta about her troubles.",
        "type": "talk"
      },
      {
        "id": "gather_wood",
        "text": "Gather 10 Wooden Planks.",
        "type": "gather",
        "item_id": "wooden_plank",
        "quantity": 10
      },
      {
        "id": "repair_wall",
        "text": "Repair the wall at Tide & Trade.",
        "type": "use",
        "required_items": ["hammer", "nails"]
      },
  ]}
}
---

## 7.E. `books.json`

Defines all readable books in the game.

### Schema

```json
{
  "book_id": {
    "title": "string",
    "author": "string",
    "content": "string"
  }
}
```

### Example: `book_odran_fall`

```json
{
  "book_odran_fall": {
    "title": "The Fall of House Odran",
    "author": "Anonymous",
    "content": "..."
  }
}
```

---

## 7.F. `enemies.json` (New)

Defines all enemy types, their stats, and loot tables.

### Schema

```json
{
  "enemy_id": {
    "name": "string",
    "stats": {
      "hp": "number",
      "attack": "number",
      "defence": "number"
    },
    "loot_table": [
      {
        "item_id": "string",
        "quantity": "number",
        "chance": "number (0-1)"
      }
    ]
  }
}
```

### Example: `wolf_alpha`

```json
{
  "wolf_alpha": {
    "name": "Alpha Wolf",
    "stats": {
      "hp": 80,
      "attack": 15,
      "defence": 8
    },
    "loot_table": [
      {
        "item_id": "wolf_pelt_alpha",
        "quantity": 1,
        "chance": 1
      },
      {
        "item_id": "wolf_fang",
        "quantity": 2,
        "chance": 0.5
      }
    ]
  }
}
```

---

## 7.G. `companions.json` (New)

Defines the base data for all potential companions in the game.

### Schema

```json
{
  "companion_id": {
    "name": "string",
    "role": "string (e.g., Hunter, Warrior)",
    "stats": {
      "hp": "number",
      "attack": "number",
      "defence": "number"
    },
    "abilities": [
      "string (ability_id)"
    ]
  }
}
```

### Example: `ronald`

```json
{
  "ronald": {
    "name": "Ronald",
    "role": "Hunter",
    "stats": {
      "hp": 100,
      "attack": 12,
      "defence": 5
    },
    "abilities": [
      "ability_aimed_shot"
    ]
  }
}
```
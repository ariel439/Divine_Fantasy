# 7. Static Data Definitions (JSON Schemas)

This document defines the technical structure for all static JSON data files that power the game. Each section provides the schema and a concrete example.

---

## 7.A. `locations.json`

Defines all playable areas in the game, including their descriptive text, imagery, and available actions.

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
        "type": "string (navigate|dialogue|shop|fish|woodcut|job|...)",
        "target": "string (location_id|npc_id|shop_id|job_id|...)",
        "condition": "string (optional - e.g., 'world_flags.roberta_shop_repaired==false')"
      }
    ]
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
      { "text": "Talk to Roberta", "type": "dialogue", "target": "npc_roberta" },
      { "text": "Trade", "type": "shop", "target": "shop_tide_trade" },
      { "text": "Navigate to Docks", "type": "navigate", "target": "driftwatch_docks" }
    ]
  }
}
```

---

## 7.B. `npcs.json`

Defines all non-player characters, their home locations, and default dialogue greetings.

### Schema
```json
{
  "npc_id": {
    "name": "string",
    "home_location": "string (location_id)",
    "default_dialogue_id": "string (ID from dialogue.json)"
  }
}
```

### Example: `npc_roberta`
```json
{
  "npc_roberta": {
    "name": "Roberta",
    "home_location": "tide_trade",
    "default_dialogue_id": "roberta_default"
  }
}
```

---

## 7.C. `items.json`

Defines all items in the game. This schema is now corrected to include `base_value` and a structured `effects` object.

### Schema
```json
{
  "item_id": {
    "name": "string",
    "description": "string",
    "type": "string (resource|consumable|tool|quest|weapon|armor)",
    "stackable": "boolean",
    "weight": "number (in kg)",
    "base_value": "number (in copper)",
    "effects": {
      "hunger": "number (optional)",
      "hp": "number (optional)",
      "energy": "number (optional)"
    },
    "equip_slot": "string (optional - e.g., 'main_hand', 'chest')"
  }
}
```

### Example: `food_sardine_grilled`
```json
{
  "food_sardine_grilled": {
    "name": "Grilled Sardine",
    "description": "A sardine, grilled over an open flame. Restores a small amount of hunger.",
    "type": "consumable",
    "stackable": true,
    "weight": 0.3,
    "base_value": 10,
    "effects": {
      "hunger": -15
    }
  }
}
```

---

## 7.D. `quests.json`

Defines all quests, their objectives, and rewards.

### Schema
```json
{
  "quest_id": {
    "title": "string",
    "giver_id": "string (npc_id)",
    "description": "string",
    "stages": [
      {
        "id": "number",
        "text": "string (journal entry for this stage)",
        "type": "string (talk|gather|use|choice|...)",
        "target": "string (e.g., npc_id, item_id)",
        "quantity": "number (optional)"
      }
    ],
    "rewards": {
      "xp": [ { "skill": "string", "amount": "number" } ],
      "items": [ { "item_id": "string", "quantity": "number" } ],
      "currency": "number (in copper)",
      "relationship": [ { "npc_id": "string", "change": "number" } ]
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
    "description": "Roberta's fishmonger shop is falling apart. She needs help repairing a large hole in the wall.",
    "stages": [
      { "id": 0, "text": "I should speak to Roberta at Tide & Trade to see what's troubling her.", "type": "talk", "target": "npc_roberta" },
      { "id": 1, "text": "I need to find a way to get 10 Wooden Planks to help Roberta.", "type": "gather", "target": "wooden_plank", "quantity": 10 },
      { "id": 2, "text": "I have the planks. I should use them to repair the wall at Tide & Trade.", "type": "use", "target": "tide_trade" }
    ],
    "rewards": {
      "xp": [{ "skill": "carpentry", "amount": 500 }],
      "currency": 200,
      "relationship": [{ "npc_id": "npc_roberta", "change": 20 }]
    }
  }
}
```
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
    "author": "Maester Aristeles",
    "content": "Odran's Rebellion was a pivotal moment in the history of The Whispers..."
  }
}
```

---

## 7.F. `enemies.json`

Defines all enemy types, their stats, and loot tables.

### Schema
```json
{
  "enemy_id": {
    "name": "string",
    "stats": { "hp": "number", "attack": "number", "defence": "number", "agility": "number" },
    "loot_table": [
      { "item_id": "string", "quantity": "number", "chance": "number (0-1)" }
    ]
  }
}
```

### Example: `wolf_alpha`
```json
{
  "wolf_alpha": {
    "name": "Alpha Wolf",
    "stats": { "hp": 80, "attack": 15, "defence": 8, "agility": 12 },
    "loot_table": [
      { "item_id": "wolf_pelt_alpha", "quantity": 1, "chance": 1 },
      { "item_id": "wolf_fang", "quantity": 2, "chance": 0.5 }
    ]
  }
}
```

---

## 7.G. `companions.json`

Defines the base data for all potential companions.

### Schema
```json
{
  "companion_id": {
    "name": "string",
    "role": "string (e.g., Hunter, Warrior)",
    "stats": { "hp": "number", "attack": "number", "defence": "number", "agility": "number" },
    "abilities": [ "string (ability_id)" ]
  }
}
```

### Example: `companion_ronald`
```json
{
  "companion_ronald": {
    "name": "Ronald",
    "role": "Hunter",
    "stats": { "hp": 100, "attack": 12, "defence": 5, "agility": 15 },
    "abilities": [ "ability_aimed_shot" ]
  }
}
```

---

## 7.H. `character_templates.json` (New)

Defines starting templates for new characters.

### Schema
```json
{
  "template_id": {
    "name": "string",
    "archetype": "string",
    "description": "string",
    "starting_attributes": { "Strength": "number", "Agility": "number", "Intelligence": "number", "Wisdom": "number", "Charisma": "number" },
    "starting_bonuses": {
      "currency": { "copper": "number", "silver": "number", "gold": "number" },
      "skills": [ { "skill_id": "string", "xp": "number" } ],
      "items": [ { "item_id": "string", "quantity": "number" } ]
    },
    "starting_relationships": { "npc_id": { "friendship": "number" } }
  }
}
```

---

## 7.I. `dialogue.json` (New)

Defines all branching dialogue trees.

### Schema
```json
{
  "dialogue_id": {
    "nodes": {
      "node_id": {
        "npc_text": "string",
        "player_choices": [
          {
            "text": "string",
            "next_node": "string (node_id)",
            "condition": "string (optional - e.g., 'quest.roberta_planks.stage==1')",
            "action": "string (optional - e.g., 'start_quest:roberta_planks')",
            "closes_dialogue": "boolean (optional)"
          }
        ]
      }
    }
  }
}
```

---

## 7.J. `recipes.json` (New)

Defines all crafting recipes.

### Schema
```json
{
  "recipe_id": {
    "name": "string",
    "skill": "string (e.g., cooking, carpentry)",
    "level_required": "number",
    "xp_granted": "number",
    "output": { "item_id": "string", "quantity": "number" },
    "ingredients": [ { "item_id": "string", "quantity": "number" } ],
    "time_cost_minutes": "number"
  }
}
```

### Example: `recipe_sardine_grilled`
```json
{
  "recipe_sardine_grilled": {
    "name": "Grilled Sardine",
    "skill": "cooking",
    "level_required": 1,
    "xp_granted": 10,
    "output": { "item_id": "food_sardine_grilled", "quantity": 1 },
    "ingredients": [ { "item_id": "fish_sardine", "quantity": 1 } ],
    "time_cost_minutes": 5
  }
}
```

---

## 7.K. `jobs.json` (New)

Defines all available jobs.

### Schema
```json
{
  "job_id": {
    "title": "string",
    "description": "string",
    "location_id": "string",
    "supervisor_id": "string (npc_id)",
    "pay_per_shift": "number (in copper)",
    "energy_cost": "number",
    "schedule": {
      "start_hour": "number",
      "end_hour": "number",
      "late_grace_period_hours": "number"
    }
  }
}
```

---

## 7.L. `xp_table.json` (New)

Defines the total XP required for each skill level.

### Schema
```json
{
  "levels": [
    { "level": 1, "total_xp": 0 },
    { "level": 2, "total_xp": 83 },
    // ... up to level 99
  ]
}
```

---

## 7.M. `shops.json` (New)

Defines the inventories and price modifiers for all shops.

### Schema
```json
{
  "shop_id": {
    "name": "string",
    "merchant_id": "string (npc_id)",
    "buy_price_modifier": "number (e.g., 1.1 for 10% markup)",
    "sell_price_modifier": "number (e.g., 0.9 for 10% markdown)",
    "inventory": [
      { "item_id": "string", "stock": "number (-1 for infinite)" }
    ]
  }
}
```

### Example: `shop_beryls_general`
```json
{
  "shop_beryls_general": {
    "name": "Beryl's General Goods",
    "merchant_id": "npc_beryl",
    "buy_price_modifier": 1.15,
    "sell_price_modifier": 0.85,
    "inventory": [
      { "item_id": "axe_basic", "stock": 5 },
      { "item_id": "fishing_rod", "stock": 5 },
      { "item_id": "bread", "stock": -1 }
    ]
  }
}
```
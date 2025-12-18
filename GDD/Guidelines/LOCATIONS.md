# Locations Authoring Guideline

Purpose: provide a consistent, AI-friendly template to add locations that work end-to-end with minimal iteration. Follows live code behavior and is validated at startup.

## Prompt Template

Provide these fields in one message:

```json
{
  "location_id": "string",
  "name": "string",
  "day_description": "string",
  "night_description": "string",
  "day_background": "string (path)",
  "night_background": "string (path)",
  "music_track": "string (path)",
  "actions": [
    { "text": "Travel to X", "type": "navigate", "target": "location_id", "time_cost": 60, "condition": "optional" },
    { "text": "Talk to Y", "type": "dialogue", "target": "npc_id", "condition": "optional" },
    { "text": "Trade", "type": "shop", "shopId": "shop_id" },
    { "text": "Explore", "type": "explore", "target": "explore_area_id" }
  ],
  "connect_from": [
    { "from_location_id": "location_id", "text": "Travel to New Place", "time_cost": 60, "condition": "optional" }
  ]
}
```

Notes:
- `navigate.target` must be an existing `location_id` in `src/data/locations.json`. Add two-way links where appropriate.
- `dialogue.target` must be an `npc_id` in `src/data/npcs.json`.
- `shop.shopId` must exist in `src/data/shops.json`.
- `explore.target` can be a placeholder (no logic) unless specified.

## Condition Grammar

Attach conditions to `actions` with:
- `world_flags.<flag>==true|false`
- `quest.<quest_id>.active==true|false`
- `quest.<quest_id>.completed==true|false`
- `quest.<quest_id>.stage==<number>`
- `time.is_day==true|false`
- `time.is_night==true|false`
- `time.hour_lt==<number>` or `time.hour_gte==<number>`
- `time.weekday==Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday`

## Acceptance Checklist

- IDs are unique and consistent across files:
  - `location_id` in `src/data/locations.json`
  - `npc_id` in `src/data/npcs.json`
  - `shop_id` in `src/data/shops.json`
- Two-way navigation added where needed (`from` and `to` links).
- Buttons use supported `type` values: `navigate|dialogue|shop|explore|fish|woodcut|job|sleep|craft|library|use`.
- Conditions use the grammar above.
- Startup shows no validator issues.

## Validation

Validation runs on game init and reports broken links, unknown IDs, or invalid conditions. Fix any listed issues to avoid iterative debugging.

## Example (Placeholder)

```json
{
  "location_id": "sandy_shore",
  "name": "Sandy Shore",
  "day_description": "An open stretch of beach where the desert meets the sea.",
  "night_description": "Under the moonlight, the shore is quiet.",
  "day_background": "/assets/locations/sandy_shore_day.png",
  "night_background": "/assets/locations/sandy_shore_night.png",
  "music_track": "GDD/assets/audio/music/coast.mp3",
  "actions": [
    { "text": "Explore", "type": "explore", "target": "explore_beach" },
    { "text": "Travel to Crossroads", "type": "navigate", "target": "the_crossroads", "time_cost": 60 }
  ],
  "connect_from": [
    { "from_location_id": "the_crossroads", "text": "Travel to Sandy Shore", "time_cost": 60 }
  ]
}
```

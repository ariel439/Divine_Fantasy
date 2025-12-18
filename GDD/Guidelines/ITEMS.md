# Items Authoring Guideline
## Schema
- Source: `src/data/items.json`
- Item: `{ "<item_id>": { "name": "...", "description": "...", "type": "resource|consumable|tool|quest_item", "stackable": true|false, "weight": <number>, "base_value": <number>, "image": "<path>", "effects": { "hunger": <number>, "energy": <number> }, "equip_slot": "main_hand"|... } }`

## Best Practices
- Use clear names and grounded descriptions
- Keep weights and values consistent with economy targets
- Consumables place effects under `effects` (e.g., `hunger`, `energy`)
- Tools specify `equip_slot`

## Examples
- `wooden_plank`: resource, stackable, weight 2.5, base_value 5
- `fishing_rod`: tool, non-stackable, `equip_slot` "main_hand"
- `food_trout_grilled`: consumable with `effects.hunger=-30`

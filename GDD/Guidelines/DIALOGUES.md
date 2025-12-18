# Dialogue Authoring Guideline

## 1. Dialogue Structure (Hub & Spoke Pattern)
All standard NPC interactions must follow the **Hub & Spoke** pattern to ensure a consistent and fluid user experience.

### Core Rules:
1.  **Root Node ("0") is the Hub**:
    *   This is the main menu.
    *   It must list all available high-level topics (Shop, Quest, Lore, Gossip).
    *   **Crucial**: Options should appear/disappear based on state (Skyrim/Fallout style). Use `condition` fields to hide completed quests or acquired jobs.
    *   **Exit**: Must always have exactly one clear exit option (e.g., "Goodbye", "Leave") with `"closes_dialogue": true`.
    *   **No Forced Exits**: Other options must **never** close the dialogue unless they represent a dramatic end to the conversation (e.g., getting kicked out). They should return to the Hub.

2.  **Sub-Nodes are Spokes**:
    *   When a player selects a topic, they enter a sub-node (Spoke).
    *   Sub-nodes provide information or choices.
    *   **Return to Hub**: After the interaction (unless it's a long chain), provide an option to return to the main menu (e.g., `(Back)`, `next_node: "0"`).
    *   **Actions**: Actions like `open_shop`, `hire_job`, or `start_quest` should ideally return to the Hub (`next_node: "0"`) so the player can continue talking if they wish.

### Example (Hub & Spoke):
```json
"blacksmith_default": {
  "nodes": {
    "0": {
      "npc_text": "Need steel or stories?",
      "player_choices": [
        { "text": "Show me your wares.", "action": "open_shop:forge", "next_node": "0" },
        { "text": "I need a job.", "next_node": "job_offer", "condition": "job.blacksmith_apprentice.active==false" },
        { "text": "About the job...", "next_node": "job_details", "condition": "job.blacksmith_apprentice.active==true" },
        { "text": "Goodbye.", "closes_dialogue": true }
      ]
    },
    "job_offer": {
      "npc_text": "Hard work. 10 silver a day.",
      "player_choices": [
        { "text": "I'm in.", "action": "hire_job:blacksmith_apprentice", "next_node": "0" },
        { "text": "Not for me. (Back)", "next_node": "0" }
      ]
    }
  }
}
```

## 2. Conditions & Logic
Use the `condition` field to make dialogue dynamic. Options with failing conditions are **hidden** from the player.

### Supported Conditions:
*   **Quests**:
    *   `quest.<id>.active==true` (Quest is in progress)
    *   `quest.<id>.completed==true` (Quest is finished)
    *   `quest.<id>.stage>=2` (Check specific stage)
*   **World Flags**:
    *   `world_flags.<flag_name>==true`
    *   `world_flags.<flag_name>==false`
*   **Jobs**:
    *   `job.<job_id>.active==true` (Player has this job)
    *   `job.<job_id>.active==false` (Player does not have this job)
*   **Relationships**:
    *   `relationship.npc_<id>>=20` (Friendship check)
*   **Inventory**:
    *   `inventory.<item_id>>=5` (Item count check)
*   **Time**:
    *   `time.is_day==true`
    *   `time.is_night==true`

### Logic Operators:
*   `&&` (AND) - All conditions must be true.
*   `==`, `!=` (implied by false), `>`, `<`, `>=`, `<=`

## 3. Actions
Actions trigger game events.
*   `open_shop:<shop_id>`
*   `start_quest:<quest_id>`
*   `complete_quest:<quest_id>`
*   `hire_job:<job_id>`
*   `collect_debt_from:<npc_id>`

## 4. Best Practices
*   **One-Time Lore**: Use `world_flags` to hide lore questions after they've been asked, or move them to a generic "Tell me about..." node if you want them repeatable.
*   **Context Aware**: If a player has a quest active, show relevant options immediately in the Hub (Node 0).
*   **Clear Exits**: Always label the exit clearly ("Goodbye", "Leave").

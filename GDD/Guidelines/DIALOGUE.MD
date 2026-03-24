# Dialogue Guidelines

This file defines how NPC dialogue should be structured in Divine Fantasy.

The goal is consistency:
- the player should always understand whether they are entering a conversation, a social menu, a shop, or a quest branch
- menu navigation should never feel like spoken dialogue
- social NPCs should follow the same shape unless there is a deliberate reason not to

## Core Structure

There are three layers of dialogue:

1. Entry Menu
- This is the first menu the player sees when talking to an NPC.
- It is the "front door" of the conversation.
- Typical options:
  - `I'd like to talk.`
  - `Show me your stock.`
  - `Leave.`

2. Interaction Menu
- This is the social menu shown only after the player chooses to talk.
- It contains social categories only.
- Allowed categories:
  - `Ask`
  - `Friendly`
  - `Flirt`
  - `Coerce`
  - `Quest`
- `Trade` does not belong here.

3. Content Nodes
- These are the real dialogue nodes:
  - lore answers
  - quest explanations
  - reactions
  - social outcomes
  - refusals

## Important Rule

`Trade` should live in the entry menu, not in `interaction_roots`.

Correct:
- entry menu:
  - `Show me your stock.`
  - `I'd like to talk.`
  - `Leave.`

Wrong:
- social interaction menu:
  - `Trade`
  - `Ask`
  - `Friendly`

## Dialogue Types

### 1. Simple NPC

Use a plain node tree if the NPC does not need a social menu.

Good for:
- minor townsfolk
- one-scene quest NPCs
- highly linear interactions

Typical structure:
- node `0`
- branch nodes
- close dialogue

### 2. Social NPC

Use the modern social structure if the NPC has repeated interactions and relationship gameplay.

Recommended fields:
- `first_meet_node`
- `repeat_meet_node`
- `interaction_roots`

Typical entry flow:
- `first_meet_node` or `repeat_meet_node`
- player chooses `I'd like to talk.`
- goes to `__social_root__`
- player chooses category
- category root opens
- content node opens

### 3. Structured Special NPC

Some NPCs may use `first_meet_node` / `repeat_meet_node` without full `interaction_roots`.

Good for:
- temporary lore NPCs
- event NPCs
- highly authored scenes like Shihan

## Entry Menu Rules

Use node `0` as the default entry node when:
- the NPC does not need separate first-time vs repeat behavior
- the NPC has a hybrid structure and still needs a stable non-social opener

Use `first_meet_node` / `repeat_meet_node` when:
- the NPC should greet Luke differently the first time
- the opener needs different text or options on repeat visits
- the NPC is a true social NPC and will be revisited often

If an NPC has both trade and social interaction:
- entry menu should include trade and talk separately

If an NPC has only social interaction and no trade:
- entry menu should usually contain:
  - `I'd like to talk.`
  - `Leave.`

If the opener is effectively only `I'd like to talk.` plus `Leave.`:
- the engine may skip the opener automatically
- the player should land directly in the interaction menu
- in this case the interaction menu should show `Leave`, not `Back`

If an NPC has only one meaningful social path:
- it is acceptable to skip the opener and go straight into the relevant social content
- but only if this feels intentional and not abrupt

## Category Root Rules

Category roots are menu hubs, not full scenes.

Examples:
- `rb_ask_root`
- `rb_friendly_root`
- `finn_quest_root`

They should:
- be short
- clearly frame the category
- return cleanly to the social menu with `Back.`

They count as:
- any node referenced by `interaction_roots.ask`
- any node referenced by `interaction_roots.friendly`
- any node referenced by `interaction_roots.flirt`
- any node referenced by `interaction_roots.coerce`
- any node referenced by `interaction_roots.quest`

They should not:
- contain huge exposition dumps
- behave like final content nodes

## Back Navigation Rules

Use these consistently:

- category root `Back.` -> `__social_root__`
- content node `Back.` -> category root
- entry menu `Leave.` -> `closes_dialogue: true`
- social root `Back` -> return to entry menu
- social root `Leave` -> only when the entry menu was skipped

Do not send normal content nodes directly back to `__social_root__` unless that is truly intended.
Most content nodes should return to their category root, not the top-level menu.

## Writing Rules

### Menu prompts

Menu prompts should be generic system prompts, not spoken dialogue.

Examples:
- `How do you want to approach this conversation?`
- `What do you want to ask?`
- `How do you want to approach this?`

These should not appear as NPC speech bubbles.

### Spoken dialogue

NPC speech should:
- sound like the character
- be concise
- avoid explaining the game system

Player choices should:
- sound like something Luke would say
- be short and readable
- reflect tone clearly

### Good menu separation

Good:
- Entry menu handles access
- Interaction menu handles category choice
- Content nodes handle actual writing

Bad:
- entry menu mixed with category spam
- `Trade` inside the social menu
- `Back` loops that return to the same line repeatedly

## Modern NPC Template

Recommended structure:

```json
"npc_default": {
  "first_meet_node": "npc_first_meet",
  "repeat_meet_node": "npc_repeat_meet",
  "interaction_roots": {
    "ask": "npc_ask_root",
    "friendly": "npc_friendly_root",
    "quest": "npc_quest_root"
  },
  "nodes": {
    "npc_first_meet": {
      "npc_text": "First meeting line.",
      "player_choices": [
        {
          "text": "I'd like to talk.",
          "next_node": "__social_root__"
        },
        {
          "text": "Leave.",
          "closes_dialogue": true
        }
      ]
    },
    "npc_repeat_meet": {
      "npc_text": "Repeat line.",
      "player_choices": [
        {
          "text": "I'd like to talk.",
          "next_node": "__social_root__"
        },
        {
          "text": "Leave.",
          "closes_dialogue": true
        }
      ]
    },
    "npc_ask_root": {
      "npc_text": "Ask what you want.",
      "player_choices": [
        {
          "text": "Tell me about this place.",
          "next_node": "npc_lore_1"
        },
        {
          "text": "Back.",
          "next_node": "__social_root__"
        }
      ]
    },
    "npc_lore_1": {
      "npc_text": "Actual lore answer.",
      "player_choices": [
        {
          "text": "Back.",
          "next_node": "npc_ask_root"
        }
      ]
    }
  }
}
```

## Practical Rules For This Project

When modernizing old NPCs:

1. Give them a real opener
- `first_meet_node` if needed
- `repeat_meet_node` if needed
- otherwise a clean `0`

2. Keep shop access in the opener
- not in `interaction_roots`

3. Keep category roots short

4. Return content nodes to their category roots

5. Only use the social system for NPCs who truly need repeatable relationship gameplay

## Migration Template

Use this when converting an old node tree into the modern structure:

1. Pick the entry strategy
- plain `0` if no first/repeat split is needed
- `first_meet_node` + `repeat_meet_node` if the opener should change over time

2. Move non-social actions into the entry node
- trade
- one-off job offers
- special scene exits

3. Create category roots
- `npc_ask_root`
- `npc_friendly_root`
- `npc_flirt_root`
- `npc_coerce_root`
- `npc_quest_root`
- only create the categories the NPC actually needs

4. Move authored writing into content nodes
- lore answers
- emotional beats
- quest clarifications
- social outcomes

5. Return correctly
- category root back to `__social_root__`
- content back to category root
- do not bounce content directly to the top menu unless the scene truly ends there

6. Validate mentally against Roberta
- opener first
- social menu second
- content third
- no `Trade` inside `interaction_roots`
- no repeated `Understood -> Back -> Understood` loops

## Current Project Direction

Right now:
- Roberta is the main reference implementation
- Finn is being moved into a cleaner hybrid form
- Shihan is a special structured NPC, not a full social-menu NPC

When in doubt, follow Roberta's structure, but keep `Trade` in the entry menu only.

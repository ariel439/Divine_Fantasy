# Dialogue Guidelines

This file defines how NPC dialogue should be structured in Divine Fantasy.

The goal is consistency:
- the player should always understand whether they are entering a conversation, a social menu, a shop, or a quest branch
- menu navigation should never feel like spoken dialogue
- social NPCs should follow the same shape unless there is a deliberate reason not to
- authored greetings should feel like real dialogue, not hidden UI

## Core Structure

There are three layers of dialogue:

1. Entry Menu
- This is the first menu the player sees when talking to an NPC.
- It is the "front door" of the conversation.
- In most cases it should be attached to a real spoken greeting from the NPC.
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

4. Generic Social Interactions
- Repeatable social actions can be generated from shared templates instead of fully authored node trees.
- These are meant for reusable interaction beats like:
  - `smalltalk`
  - `helpful`
  - `honest`
  - `compliment`
  - `threaten`
- The menu label is not spoken dialogue.
- The spoken history should begin with Luke's generated line, not the selector text.
- NPC response flavor should come primarily from personality and secondarily from social class.

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

Important:
- a social NPC does not need every category
- `Ask + Quest` only is valid
- `Ask` and `Quest` can be the only interaction categories for a practical or hostile NPC
- `Flirt`, `Friendly`, or `Coerce` can be absent until deliberately unlocked

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

Important:
- `first_meet_node` should not be auto-skipped into the social menu
- first meetings are authored scenes, not utility shells
- only repeat/opening utility menus may be auto-skipped when they are effectively just `talk + leave`

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

Interaction layers can unlock over time:
- an NPC may start with no interaction menu at all
- later, a quest or flag can unlock `I'd like to talk.`
- individual categories like `Flirt` or `Coerce` may appear only after relationship, quest, or story conditions are met
- generic interaction options and fully custom interaction options can coexist in the same category

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

Category roots may be:
- fully authored JSON menus
- generated menus backed by the generic social interaction system

Both are valid.

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

Only generated system menus should be silent prompts:
- `__social_root__`
- category roots like `Ask`, `Friendly`, `Flirt`, `Coerce`, `Quest`

Authored opener nodes should normally show as real speech bubbles:
- `first_meet_node`
- `repeat_meet_node`
- node `0`

### Spoken dialogue

NPC speech should:
- sound like the character
- be concise
- avoid explaining the game system

Player choices should:
- sound like something Luke would say
- be short and readable
- reflect tone clearly

For generated social interactions:
- selector labels are UI intent labels, not literal spoken lines
- Luke's actual spoken line should come from the shared interaction template
- NPC replies should be flavored by personality and class unless there is a custom override

### Ask and lore writing rules

`Ask` content should feel like a natural exchange, not a questionnaire.

Use these rules:
- do not make Luke ask about people, facts, or history he has no believable reason to know yet
- if the player asks a lore question, the NPC answer should usually be the main beat of the exchange
- avoid content nodes that end with Luke speaking and nobody answering
- if the player has no meaningful follow-up, use `Back.` instead of filler lines like `Understood.` or `I see.`
- do not create two consecutive player-history beats unless the second one leads to a real NPC reply

Good:
- Luke asks
- NPC answers
- `Back.`

Acceptable:
- Luke asks
- NPC answers
- Luke follow-up
- NPC answers again

Bad:
- Luke asks
- NPC answers
- Luke says `Understood.`
- menu returns

Default rule:
- most `Ask` lore questions should be one-time only
- once the player has heard the answer, the option should usually disappear
- repeatable `Ask` options should mostly be:
  - quest unlocks
  - practical reminders
  - changing world-state questions
  - information the player may realistically need again

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

6. Use generic social interactions for repeatable relationship beats
- especially `Friendly`, `Flirt`, and `Coerce`
- keep lore and quest progression in authored content nodes

7. Use overrides sparingly
- start with the generic system
- only add NPC-specific overrides when the baseline voice is not enough

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

When converting `Ask` content:
- keep the player question as the entry
- make the NPC answer the payoff
- prefer `Back.` over filler response lines unless a second NPC line is coming

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

7. Decide whether each category is:
- authored content
- generic interaction template
- or a mix of both

## Current Project Direction

Right now:
- Roberta is the main reference implementation
- Finn is being moved into a cleaner `trade + ask + quest` form
- Shihan is a special structured NPC, not a full social-menu NPC

When in doubt, follow Roberta's structure, but keep `Trade` in the entry menu only.

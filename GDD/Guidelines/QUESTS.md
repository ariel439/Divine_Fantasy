# Quest Design Guidelines

This document defines how quests, objectives, and progression work in the game so new quests feel consistent and clean in the Journal and UI.

## Objectives

- Write objectives like diary entries from Luke’s perspective.
- Avoid tutorial-UI phrasing; do not include steps like “Learn the location UI” or “Choose a starting perk” in visible objectives.
- Use clear verbs and location/NPC anchors (“Talk to Old Leo at the lighthouse.”).

## Types of Flow

- Sequential: objectives unlock one-by-one as the quest stage advances.
- Simultaneous collect tasks: when a quest has multiple `collect` objectives, show all open collects at once so the player chooses order. Completion is tracked per objective.

## Data

- Source: `src/data/quests.json` — each quest has `stages` with fields: `id`, `text`, `type`, `target`, and optional `quantity`.
- Stage `type` drives UI behavior. Common types: `talk`, `navigate`, `wait`, `choice`, `collect`, `combat`, `event`, `tutorial`.

## Journal Rendering Rules

- Luke’s intro quest hides tutorial-only steps and the perk selection from the Journal view.
- For active quests:
  - If the quest contains multiple `collect` stages, all collect steps are displayed concurrently.
  - Otherwise, show completed stages up to the current stage plus the current open stage.
- For completed quests: show all objectives and the rewards section.

## Simultaneous Collect Pattern

- Dialogue must set per-target flags on collection and grant currency/items.
- Example flags used by Finn’s debt collection:
  - `world_flags.debt_paid_by_ben`
  - `world_flags.debt_paid_by_beryl`
  - `world_flags.debt_paid_by_elara`
- Start the job by setting `world_flags.finn_debt_collection_active=true` and advancing the quest stage.
- Turn-in validates all required flags and payment, then completes the quest.

## Dialogue Actions

- Use `start_quest:<quest_id>` to activate a quest.
- Use `advance_quest_stage:<quest_id>` or purpose-built actions to move stages.
- For collections, use a specific action to set the per-target flag and grant currency, e.g. `collect_debt_from:npc_beryl`.
- Use `set_flag:<flag_id>:<true|false>` for world state toggles.

## Intro Flow Specifics

- Sleep at `orphanage_room` during intro fast-forwards to 06:00 and triggers Kyle’s alert (`kyle_smuggler_alert`), moving the player to `driftwatch_docks` at night with “Help Robert” action.
- Smuggler combat is a scripted loss; defeat shows the event sequence to return to the lighthouse, then sleep starts Finn’s debt intro the next morning.

## Best Practices

- Stage text should reflect the current world and be readable as journal entries.
- Prefer flags for anything that can be completed out-of-order.
- Keep stage `type` aligned with action mechanics; avoid overloading `choice`/`event` for state changes that should be expressed via explicit actions.

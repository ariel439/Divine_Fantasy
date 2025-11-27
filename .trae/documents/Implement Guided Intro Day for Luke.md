## Overview

* Replace the two-slide prologue with a short, guided "Day in the Life" playable intro for Luke.

* Keep it tight (10–15 minutes), focused on core systems: limited HUD, navigation, dialogue, time advancement, and meaningful starter choice rewards.

* After the intro, transition to the regular game in Driftwatch with full HUD enabled.

## Player Flow

1. Wake up in the orphanage room with limited HUD (only `inventory` and `journal`).
2. Guided tutorial prompts: leave room and navigate to Leo’s Lighthouse.
3. Talk to Leo; player chooses one of three starter perks:

   * Start at Fishing level 5

   * Start at Charisma level 5

   * Start with a basic weapon
4. Lunchtime event at the orphanage; advance time from morning to day.
5. Talk to Robert and Sarah; choices grant relationship boosts with them.
6. Night prompt to go to bed.
7. Event cutscene: Luke wakes up at Driftwatch slums inn and gets evicted for back rent.
8. Mark intro complete and switch to normal gameplay (`inGame`) with full HUD.

## UI & Routing

* Use existing scene routing controlled by `useUIStore.currentScreen` and `Game.tsx` switcher.

* Intro entry: after `GameManagerService.startNewGame('luke_orphan')`, route to a new intro mode state instead of the current `prologue` slides.

* Limit HUD in intro:

  * Add an `intro_mode` flag in `useWorldStateStore`.

  * Update `LocationNav` to render a reduced set of buttons when `intro_mode` is true (only `inventory` and `journal`).

* Tutorial messaging:

  * Reuse `EventScreen` for step prompts, or add a lightweight `TutorialTooltip` modal opened via `useUIStore.openModal('tutorial', payload)`.

## Locations & Navigation

* Start location: orphanage dorm/room.

  * If not present, add `orphanage_room` to `locations.json` with actions:

    * `navigate` → `driftwatch_main_street` or directly `leo_lighthouse` (keep short).

* Lighthouse:

  * `leo_lighthouse` already exists; ensure actions include `dialogue` with `npc_old_leo`.

* Gate other world actions via `condition` fields until `intro_completed` is true (use `world_flags.intro_completed`).

## Dialogue & Choices

* Add an intro branch in `dialogue.json` for `npc_old_leo` (e.g., `npc_old_leo_intro`).

* Present three choice buttons mapped to actions:

  * `grant_skill_level:fishing:5`

  * `grant_skill_level:charisma:5`

  * `grant_item:weapon_starter`

* Implement any missing `DialogueService` action handlers to apply these rewards, then close dialogue and show a short summary modal.

* Add short dialogues with `npc_robert` and `npc_sarah` that award relationship boosts via actions like `update_relationship:npc_robert:+10` and `update_relationship:npc_sarah:+10`.

## Rewards & State Changes

* Skills: use `useSkillStore.setSkillLevel('fishing', 5)` and `useSkillStore.setSkillLevel('charisma', 5)` (or an equivalent setter; if only XP APIs exist, grant enough XP to reach level 5).

* Items: `useInventoryStore.addItem('weapon_starter', 1)`.

* Relationships: `useDiaryStore.updateRelationship(npcId, { friendship: +10 })`.

* Time: advance via `useWorldTimeStore.passTime(minutes)` for lunch and bedtime sequences.

## Time & Events

* Lunch event:

  * Show `EventScreen` with a brief scene.

  * On complete, call `passTime(60)` and optionally `useCharacterStore.eat(...)` for a small vitals bump.

* Bedtime:

  * Use a simple `EventScreen` or `SleepWaitModal` to advance hours to night.

  * Trigger eviction cutscene (`EventScreen`) that ends by changing location to a Driftwatch slums location and marking the intro as complete.

## Transition Out

* Set `world_flags.intro_completed = true` in `useWorldStateStore`.

* Clear `intro_mode` so `LocationNav` shows the full HUD.

* Route to `inGame` in `Game.tsx`.

## Skip Option

* Keep a "Skip Intro" option before the playable intro.

* If skipped, apply a default reward (e.g., Fishing level 3) and set `intro_completed = true`.

## Data Additions & Edits

* `src/data/locations.json`: add `orphanage_room`, and ensure `leo_lighthouse` actions include needed `dialogue` entries; add `condition` gates tied to `world_flags.intro_completed`.

* `src/data/dialogue.json`: add intro nodes for Leo, Robert, and Sarah with branching choices and actions described above.

* `src/data/npcs.json`: confirm `npc_old_leo`, `npc_sarah`, `npc_robert` entries; add `default_dialogue_id` pointing to intro branches during `intro_mode`.

* Optional: `src/data/quests.json` if you want journal entries for the intro tasks.

## Code Touchpoints

* `src/components/Game.tsx`: change prologue routing to start intro mode and then transition to `inGame` at the end.

* `src/stores/useWorldStateStore.ts`: add `intro_mode` and `intro_completed` flags.

* `src/components/LocationNav.tsx`: conditionally render a reduced HUD when `intro_mode` is true.

* `src/services/DialogueService.ts`: implement new action handlers (`grant_skill_level`, `grant_item`, `update_relationship`).

* `src/components/screens/LocationScreen.tsx`: ensure `condition` gates (lines 512–539) restrict actions until `intro_completed` is set.

## Balancing & Scope

* Keep the intro compact; aim for < 15 minutes.

* Starter perks should be meaningful but not overpowering; consider minor tradeoffs (e.g., Fishing 5 but slightly less starting currency).

* Relationship boosts grant early access to small favours or discounted shop multipliers rather than large mechanical advantages.

## QA Checklist

* New game → intro flow works end-to-end, with skip option applying defaults.

* HUD correctly limited during intro; full HUD after completion.

* Rewards apply exactly once and persist through save/load.

* Time-of-day advances at lunch and bedtime; day/night visuals update.

* Dialogue choices branch correctly; no dead ends.

* Location actions gated/unlocked as intended by `intro_completed`.

## Next Steps

* Confirm you’re happy with this flow and reward options.

* I’ll implement the flags, routing changes, dialogue/action handlers, and data entries, then wire tutorial prompts and verify with a complete test run.


# Design Docs

Quest and character documentation for how narrative paths, NPC arcs, and quest systems are intended to work.

These are not authoring rules (see `docs/standards/`) and not coding guidelines (see `docs/guidelines/`). They describe the design intent and logic of specific quests and characters so that anyone working on them — including AI agents — can understand what a system is supposed to do before touching it.

## Structure

- `main/` — Main quest paths: Luke's story branches, week systems, major plot progressions.
- `npcs/` — NPC character and quest docs: relationship ladders, side quests, character arcs.

## When to add a doc here

Add a design doc when a quest or character has:
- Multiple interacting flags and conditions
- Branching paths or mutually exclusive outcomes
- A relationship or unlock ladder with non-obvious gates
- Design intent that could easily be violated by an uninformed change

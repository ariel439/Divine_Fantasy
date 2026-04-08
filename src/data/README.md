# Data Guide

This folder contains gameplay content and static datasets.

## Rules
- IDs are stable contracts once referenced by saves or other content.
- Cross-references must remain valid (quests, NPCs, items, locations, shops, dialogue).
- Keep data changes backward-compatible when possible.

## Validation
- Run validators/simulations after edits.
- Update validators when introducing new action or condition syntax.

## Authoring Standards
- Narrative/dialogue style: `docs/gdd/Guidelines/DIALOGUE.MD`
- Art/image generation style: `docs/gdd/Guidelines/ART.MD`
- Choice-event copy and IDs are authored in `src/data/events.ts` (`choiceEvents`).
- Location action lists should avoid redundant navigation choices when a single clear exit path already exists.

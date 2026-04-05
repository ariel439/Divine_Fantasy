# Data and Content Guidelines

## Data Contracts
- Treat JSON content as contracts, not loose blobs.
- Validate cross-references (items, quests, NPCs, locations, dialogue nodes).
- Keep stable IDs immutable once released.

## Content Authoring
- Dialogue and narrative writing standards remain in `docs/gdd/Guidelines/DIALOGUE.MD`.
- Art generation standards remain in `docs/gdd/Guidelines/ART.MD`.
- Technical action syntax and execution behavior must be documented in services and this docs hub.

## Validation
- Run data validation scripts when content changes.
- Add validator support for new action types and condition prefixes.
- Prefer schema-first validation for new systems.

## Backward Compatibility
- For persisted content fields, use additive changes when possible.
- When changing required fields, include migration notes.

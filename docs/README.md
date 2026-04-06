# Documentation Hub

This folder is the single source of truth for technical documentation outside day-to-day code comments.

## Structure
- `guidelines/`: Rules and standards for architecture, coding, data, and AI authoring.
- `standards/`: Game design and content-authoring standards (art, dialogue).
- `design/`: System design docs — how specific game mechanics and paths are intended to work.
- `CHANGELOG.md`: Documentation update log tied to code/content changes.

## Documentation Rules
1. Keep guidelines stable and opinionated.
2. Keep feature-specific details close to code (folder `README.md` files).
3. Update docs in the same PR as behavior changes.
4. If a decision changes architecture or workflow, add an ADR.

## Automation
- `npm run docs:check -- --base <base_sha> --head <head_sha>`
  - Fails when gameplay/code changed and no docs changed.
- `npm run docs:changelog`
  - Appends a structured entry to `docs/CHANGELOG.md`.

## How To Use With AI
1. Start from `docs/guidelines/AI_AUTHORING_GUIDELINES.md`.
2. Read the local folder `README.md` before editing files.
3. If no local `README.md` exists, create one before large changes.

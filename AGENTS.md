# Agent Workflow Rules

These rules are mandatory for any AI agent working in this repository.

## Documentation Is Required
If code or content changes, documentation must be updated in the same change.

Minimum required:
1. Update the nearest folder `README.md` for touched systems.
2. Update `docs/` guidelines if standards/flow changed.
3. Update `docs/CHANGELOG.md` (or run the changelog script).

## Architecture Changes
If the change affects architecture, persistence strategy, core flow, or cross-cutting patterns:
1. Add or update an ADR in `docs/adr/`.
2. Reference impacted modules in the ADR.

## Definition of Done
A task is not done unless:
1. Code/content changes are complete.
2. Required docs are updated.
3. Validation/build checks requested by task are run.

## Recommended Commands
- `npm run docs:check -- --base <base_sha> --head <head_sha>`
- `npm run docs:changelog`

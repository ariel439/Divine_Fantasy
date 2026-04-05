# AI Authoring Guidelines

This file defines how AI assistants should execute work in Divine Fantasy.

## Mandatory Workflow
1. Read `docs/guidelines/*.md` relevant to the task.
2. Read the local folder `README.md` where edits will be made.
3. Preserve existing behavior unless the task explicitly changes behavior.
4. For architecture-affecting changes, document rationale in an ADR.
5. Run required checks before finalizing work.

## Change Policy
- Prefer small, incremental, reversible changes.
- Do not introduce new patterns without matching existing project direction.
- Do not move large systems and add new features in the same change unless required.

## Documentation Policy
- If a new system is added, create/update:
  - folder `README.md`
  - one guideline file if conventions changed
  - ADR if architecture changed

## Output Standard For AI PRs
- What changed
- Why it changed
- Behavioral impact
- Migration impact (if any)
- Verification steps executed

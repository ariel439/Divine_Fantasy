# Source Folder Guide

`src/` contains runtime game code.

## Subfolders
- `components/`: UI and screen composition.
- `stores/`: Zustand state slices.
- `services/`: Orchestration and domain-support services.
- `data/`: Structured game content and static datasets.
- `utils/`: Pure utility helpers.

## Rule
If a subfolder has complex behavior, it should maintain its own `README.md` with boundaries and invariants.

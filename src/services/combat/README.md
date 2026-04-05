# Combat Engine

This folder contains combat domain logic extracted from UI components.

## Purpose
- Keep formulas and combat rule calculations outside React rendering code.
- Make balancing and testing easier.

## Current Scope
- Hit chance calculation
- Damage calculations (`standard` and `brawl`)
- Flee chance calculation
- Wolf bleed probability and stack rules

## Integration
`CombatManager` should orchestrate turn flow and UI timing, while using these pure functions for rule outcomes.

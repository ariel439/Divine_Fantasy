# Divine Fantasy - First Public Alpha Prep Draft

This draft replaces the old broad internal roadmap with a tighter plan for the **first public alpha/demo release** on Itch.io or a similar community platform.

The goal is not to prepare a full release.

The goal is to prepare:

- a strong first public impression
- a fair but harsh Story Mode
- a clearly defined Sandbox Mode
- a focused Driftwatch/Finn debt demo
- enough polish and content density to make players want more

## Release Goal

Ship a public **Alpha Demo** centered on:

- Luke in Driftwatch
- the Finn debt quest and 7-day pressure
- survival, jobs, skilling, dialogue, and moral choices
- a Sandbox mode for freeform testing and exploration

## Phase 1: Must Finish Before First Public Alpha

### 1. Release Positioning
- [ ] Define the build as `Alpha Demo` / `First Playable` / `Story Demo`.
- [ ] Write a short release pitch centered on Driftwatch, Luke, and the Finn debt arc.
- [ ] Decide the exact promise of the public build.
- [ ] Prepare a short "what is in this alpha" description.
- [ ] Prepare a short "what is not in yet" description.

### 2. Story Mode Identity
- [ ] Make Story Mode the intended survival-driven experience.
- [ ] Review whether Story Mode currently feels harsh, fair, and readable.
- [ ] Ensure Story Mode supports the fantasy of poverty, pressure, and danger.
- [ ] Make sure the first 1-2 in-game days create tension without creating a dead start.

### 3. Luke Rebalance
- [x] Reduce Luke's starting comfort level.
- [x] Rebalance Luke's starting hunger.
- [x] Rebalance Luke's starting energy.
- [x] Rebalance Luke's starting currency.
- [x] Reduce Luke's starting combat safety.
- [x] Rebalance Luke's attributes to better fit the intended fantasy.
- [ ] Test whether Luke feels desperate but still viable.

### 4. Sandbox Mode Identity
- [ ] Clarify the difference between Story Mode and Sandbox Mode in the UI.
- [ ] Ensure Sandbox mode removes or avoids story pressure systems where appropriate.
- [x] Make Sandbox clearly useful for freeplay and systems testing.
- [ ] Check that Sandbox does not confuse the player about the main intended experience.

### 5. Economy and Survival Pass
- [ ] Rebalance food availability and food prices.
- [ ] Rebalance work income against daily survival cost.
- [ ] Rebalance shop values and item values for the 7-day demo structure.
- [ ] Check whether the debt timer feels tense but fair.
- [ ] Check whether there are obvious exploit paths.
- [ ] Check whether there are overly punishing no-win paths.
- [ ] Tune the economy so multiple survival approaches are possible.

### 6. First-Hour Experience
- [ ] Review the first 30-60 minutes as a standalone player experience.
- [ ] Ensure the player quickly understands hunger, money, time pressure, and core goals.
- [ ] Ensure the player gets at least one early success.
- [ ] Ensure the player faces at least one meaningful early choice.
- [ ] Ensure the first hour ends with curiosity and momentum.

### 7. Alpha Integrity Cleanup
- [x] Remove development convenience balance artifacts.
- [ ] Remove debug-facing or placeholder-facing release issues.
- [ ] Review release-facing text and descriptions for consistency.
- [ ] Check for duplicated or conflicting content data.
- [ ] Make sure the public build feels intentional and not like an internal branch.

## Phase 2: Strongly Recommended Before Release

### 8. Content Density
- [ ] Add 2-4 more side quests.
- [ ] Add more authored interactions in key areas of Driftwatch.
- [ ] Deepen a few important NPCs with more layered dialogue.
- [ ] Add more reactive moments tied to flags, time, or player behavior.
- [ ] Ensure each major district has more than one reason to visit.

### 9. Social Layer Review
- [ ] Decide whether `socialEnergy` is a real mechanic in this alpha.
- [ ] If yes, add meaningful costs and decisions around it.
- [ ] If no, reduce how prominently it is presented.
- [ ] Add clearer relationship consequences to player dialogue choices.
- [ ] Make at least part of the social system feel mechanically real, not only aesthetic.

### 10. Progression and Reward Review
- [ ] Make skill progression more visible and satisfying.
- [ ] Ensure quest rewards feel meaningful and noticeable.
- [ ] Ensure growth is reflected in outcomes, not just numbers.
- [ ] Check that jobs, crafting, exploration, and combat all contribute to player advancement.
- [ ] Make the player feel stronger, smarter, or better connected over time.

### 11. Combat and Risk
- [ ] Define the intended danger level for Story Mode combat.
- [ ] Rebalance early combat encounters to fit the survival tone.
- [ ] Recheck combat loot value against risk.
- [ ] Ensure early combat teaches caution and planning.
- [ ] Ensure combat is a viable route, but not the only clearly optimal route.

### 12. Exploration and World Activity
- [ ] Add more exploration event variety.
- [ ] Add more non-combat discoveries and outcomes.
- [ ] Improve the feeling that time, schedules, and flags make the world move.
- [ ] Make exploration support the main survival and story loop.

### 13. UI/UX Clarity Pass
- [ ] Check whether the player always knows the current main objective.
- [ ] Check whether the player understands Story Mode vs Sandbox Mode.
- [ ] Check whether hunger, time, and money pressure are clearly communicated.
- [ ] Check whether important systems are understandable without explanation from the developer.
- [ ] Prioritize clarity over adding more screens or features.

## Phase 3: Nice to Have Before Release, Safe to Finish After

### 14. Additional Variety
- [ ] Add more enemy variety.
- [ ] Add more recipes.
- [ ] Add more jobs.
- [ ] Add more shop variation.
- [ ] Add more reasons to revisit old locations.

### 15. Deeper Branching
- [ ] Add more variation inside the Finn debt quest.
- [ ] Add more consequences to success and failure paths.
- [ ] Add more roleplay expression through social, economic, and moral choices.
- [ ] Improve route identity so different playstyles feel different.

### 16. Alpha Page Packaging
- [ ] Prepare store-page screenshots.
- [ ] Prepare short gameplay clips or GIFs.
- [ ] Highlight the strongest parts of the game in page media:
- [ ] dialogue presentation
- [ ] Driftwatch atmosphere
- [ ] survival pressure
- [ ] journal/diary UI
- [ ] combat and exploration
- [ ] Write a short feedback request for players.
- [ ] Decide what kind of feedback is most important for the first wave.

## First Public Alpha Priorities

If time is limited, the highest priority items are:

1. Rebalance Story Mode and Luke's starting state.
2. Tune the debt/economy/hunger loop into a fair but harsh survival experience.
3. Clarify Story Mode versus Sandbox Mode.
4. Add a little more side content and NPC depth.
5. Clean up release-facing rough edges and market the build honestly.

## Release Standard

The first public alpha should make players think:

"This is still early, but it already has identity, tension, and real potential."

That is the target standard for this release.

## Progress Notes

Completed so far:

- Luke base stats changed to `STR 3 / DEX 4 / INT 6 / CHA 2`
- Luke now starts with `0` copper
- Luke now starts with no default items
- Story Mode start changed to `80 energy / 20 hunger`
- Sandbox start now overrides to `100 energy / 100 hunger`
- Hidden dev seed of starting `wolf_pelt` items removed
- Intro fishing choice already grants `Fishing level 3 + fishing rod`
- Character Selection updated to reflect the new Luke stats
- Attribute descriptor scale changed to a 5-step progression
- Charisma low-end label changed from `Repulsive` to `Awkward`
- Unused `attack` / `defence` entries removed from the shared attribute label map

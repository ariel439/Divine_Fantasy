# Divine Fantasy: First Release Content Plan

## Goal

This first release should focus on making the current Driftwatch chapter feel richer, more human, and more authored.

The priority is not adding many new systems. The priority is using the systems already in the game to create:

- stronger NPC depth
- more social payoff
- more side content around the Finn week
- clearer progression outside the main route

For now, the first release should stay centered on:

- Luke
- Driftwatch
- the Finn week
- White Fang as the mythic branch

## Core Focus

The current release should focus on 4 things:

1. Deepen a small number of important NPCs
2. Make the social system feel real through milestones and unlocks
3. Add a little more exploration and job variety
4. Keep the scope grounded in the current chapter

## Priority NPCs

The main NPC focus for first release should be:

- Roberta
- Ronald
- Old Crank
- Shihan as a smaller special case

These characters should carry most of the new social and side-content depth.

## Relationship Milestones

The social system should matter through clear relationship unlocks.

For first release, relationship growth should unlock things like:

- new ask questions
- quests
- romance access
- wilderness secrets
- personal lore

The goal is simple:

- relationship should stop feeling abstract
- and start unlocking visible content

## Roberta

Roberta should be the main grounded social route of the first release.

She should remain a friendship-first route at first.

Before the romantic threshold, she should only use:

- `Ask`
- `Friendly`
- `Quest`
- `Trade`
- `Coerce`

Her rebuilt `Flirty` menu should stay locked until later in her route.

### Roberta Relationship Structure

- `20 relationship`
  - unlocks the wall / planks quest
- wall quest reward tuning
  - `500 carpentry XP`
  - `150 copper`
  - `+10 friendship`
  - processing logs into planks at the sawmill should grant `10 carpentry XP per plank`
- `30 relationship`
  - unlock `Ask`:
    - `How have you been managing all of this alone?`
- `40 relationship`
  - unlock `Ask`:
    - `What do you want Tide & Trade to become?`
- `50 relationship`
  - if the planks quest is completed, Roberta can offer her second quest

### Roberta Second Quest

This second quest should be a business-growth / shop-improvement quest.

Requirements:

- wall / planks quest completed
- Luke has asked:
  - `What do you want Tide & Trade to become?`
- Luke has at least `Construction level 10`

Quest structure:

- Roberta wants to improve Tide & Trade itself
- the quest opens a special upgrade screen similar to [CraftingScreen.tsx](c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/components/screens/CraftingScreen.tsx)
- Luke gathers or buys the required materials
- each completed improvement gives Construction XP

Quest endpoint:

- all upgrades completed
- Tide & Trade gets a new upgraded store image
- Roberta's route advances
- the rebuilt `Flirty` menu unlocks

### Roberta Route Cap For First Release

The rebuilt `Flirty` menu should be a full romantic interaction root, more like `Friendly`, not the current single thin option.

For first release, Roberta's route can end with:

- romantic access opening
- full flirt menu unlocked
- an intimate route beat such as a kiss

The longer romance path can wait for later development.

## Ronald

Ronald should be a wilderness social NPC and quest anchor, not a full companion yet.

For first release, he should have:

- `Friendly` menu only
- relationship building through friendly interactions
- 2 relationship-gated `Ask` questions
- 1 authored wolf-pack quest
- cabin unlock tied to relationship

### Ronald Relationship Structure

- `10 relationship`
  - unlock `Ask`:
    - `Why do you live out here in the forest by yourself?`
- `20 relationship`
  - unlock `Ask`:
    - `Do you know any secrets of the forest?`
  - this question reveals:
    - an old witch once lived deeper in the woods
    - there is an old cabin farther in
    - Luke can unlock that path later

### Ronald Quest

Quest flow:

- Luke asks one of the two guards around Mosswatch Keep for work
- the guard sends Luke to Ronald
- the guard explains Ronald has been struggling to clear out a wolf pack
- Luke goes to Ronald and speaks with him
- this starts an event sequence
- the sequence leads into a `2 vs 4` combat:
  - Luke
  - Ronald
  - against 4 wolves
- after the fight, Luke returns and reports back to the guard
- quest completed

### Ronald Route Cap For First Release

Ronald's first-release content should end at:

- his wolf-pack quest
- his `Friendly` menu
- the two gated `Ask` questions
- cabin unlock through the `20 relationship` question

## Old Crank

Old Crank should become a tavern-centered friendship NPC with a small lore-and-treasure route.

### Old Crank Interaction Structure

- he should have a `Friendly` menu
- giving him beer should work outside the Finn route
- each beer gift should give:
  - `+1 relationship`

### Old Crank Relationship Structure

- `10 relationship`
  - unlock `Ask` about his rat companion
- `20 relationship`
  - unlock `Ask` about his past
- `30 relationship`
  - unlock a more personal question about his past
  - this unlocks a treasure-hunting quest

### Old Crank Treasure Quest

The quest should stay simple:

- Old Crank gives Luke a treasure map
- Luke uses a spade to dig up the treasure

That is enough to make him feel like more than just a Finn-route informant.

## Shihan

Shihan should stay more limited and more special for now.

For first release:

- keep only the `Friendly` menu after the White Fang quest
- unlock a few specific personal or lore questions through relationship
- do not expand her into a full normal social route yet

She should stay more reserved, lore-heavy, and distinct from the grounded town NPCs.

## Woods Rework

The woods should be simplified as an exploration system for now.

Direction:

- keep woods exploration simpler
- move standout forest content into Ronald-authored questing
- let the cabin path become relationship-based content instead of random exploration content

## More Exploration

Add exploration support for:

- mountain
- abandoned beach

Keep both simple for first release.

They only need:

- a few exploration interactions
- some unique encounters
- enough content to make the locations feel useful

## New Job

Add a sea-week job tied to Captain Elias.

Structure:

- Luke reports in on Monday morning
- he spends the week at sea until Friday night
- he gets paid at the end
- he gains Fishing XP at the end

This should be event-based rather than a simple click-to-work loop.

Some weeks can be:

- normal
- eventful
- more profitable
- more dangerous

This should become the second real job path in the chapter.

## What Is Not Priority Yet

These should not be major priorities for first release:

- full city-wide consequence simulation after routes
- deep coercion/fear route expansion
- broad expansion of every NPC
- many romance routes
- large systemic world reactivity

The release should stay focused on making the current chapter feel denser and stronger, not fully solving the whole future game.

## Expected Player Experience Impact

If this plan lands well, the first release should feel:

- more personal
- more socially reactive
- more grounded in recurring NPCs
- less dependent on the main route alone
- more alive between major story beats

It should improve:

- social payoff
- side-content density
- NPC identity
- wilderness identity
- job variety

## Final Read

This first-release plan is strongest when it stays narrow and committed.

The game does not need more vague breadth right now.

It needs:

- a few stronger NPC routes
- a few stronger side activities
- and more visible payoff from the systems already in the game

That is the right next milestone.

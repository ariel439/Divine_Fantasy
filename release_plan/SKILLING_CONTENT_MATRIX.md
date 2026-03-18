# Divine Fantasy - Skilling Content Matrix

## Purpose

This document turns the skilling system concept into an implementation-facing matrix.

It defines:

- the alpha skilling loops
- current recipes and their route role
- tool gates
- job role and expansion direction
- resource conversion ladders
- survival item priorities
- Story Mode versus Sandbox emphasis

These values and structures are for the **first route-complete alpha pass**, not final release balance.

## Core Alpha Defaults

### Core Skilling Categories

The alpha skilling layer should use five practical categories:

- `Fishing`
- `Cooking`
- `Work`
- `Woodcutting`
- `Processing / Crafting`

### Core Route Rule

Skilling in the alpha is:

- the strongest survival route in Story Mode
- the route that keeps Luke fed and functional
- the route that later broadens most naturally in Sandbox and the full game

### Core Tone Rule

Skilling should feel:

- poor
- useful
- repetitive in a satisfying way
- increasingly stable over time

It should not feel:

- rich
- glamorous
- instantly dominant

## Current Core Loop Matrix

| Loop | Current Status | Route Role | Current Strength |
|---|---|---|---|
| Fishing | active | best food-security route | strong |
| Cooking | active | converts gathered food into real sustain | strong |
| Dockhand Work | active | safe emergency cash | solid |
| Woodcutting | active | raw materials and practical labor | thin |
| Carpentry / Planks | active | material conversion | thin but useful |
| Crafting | active | currently mostly combat-adjacent gear | narrow |

## Fishing Matrix

Fishing is currently the strongest skilling loop and should stay that way.

### Current Fishing Structure

| Location | Access | Catch Role | Current Progression |
|---|---|---|---|
| Docks | early | beginner food route | sardines scale by Fishing level |
| River | gated by progression | mid-tier fishing | trout at 5+, pike at 7+ |

### Current Fishing Costs

From the current implementation:

| Metric | Value |
|---|---:|
| Time per cast cycle | 20 minutes |
| Energy per cycle | 5 |
| Docks beginner catch chance | 60% at low level |
| Docks high catch chance | 75% at Fishing 7+ |
| River trout roll | 35% |
| River pike roll | 10% |

### Current Fishing XP Direction

| Outcome | XP |
|---|---:|
| Sardine catch | 15 |
| Docks failure / no fish | 2 |
| Trout catch | 15 |
| River near-success without unlock | 5 |
| Pike catch | 40 |
| Pike roll without unlock | 10 |
| Other river failure | 5 |

### Fishing Content Role

Fishing should remain:

- the clearest survival route
- the best route for staying fed
- a moderate sale-value route

Fishing should not become:

- the best route at everything
- effortless wealth

## Cooking Matrix

Cooking is the route's main efficiency engine.

### Current Recipes

| Recipe | Level | XP | Time | Energy | Role |
|---|---:|---:|---:|---:|---|
| Grilled Sardine | 1 | 10 | 5 min | 3 | basic survival food |
| Cooked Meat | 1 | 20 | 10 min | 5 | strong general food |
| Grilled Trout | 3 | 25 | 8 min | 5 | stronger fishing reward |
| Grilled Pike | 5 | 50 | 12 min | 7 | best current fish-food tier |

### Current Cooking Rule

Cooking already supports:

- success chance
- burned outcomes
- partial XP on failure

This is good and should stay.

### Current Burn Outcomes

| Burn Result | Hunger | Base Value |
|---|---:|---:|
| Burned Food | 2 | 1 |
| Burned Meat | 2 | 1 |

### Food Value Ladder

| Item | Hunger | Base Value | Role |
|---|---:|---:|---|
| Raw Sardine | 2 | 2 | ingredient only / blocked from use |
| Grilled Sardine | 10 | 4 | best low-tier self-made food |
| Raw Trout | 3 | 5 | ingredient only / blocked from use |
| Grilled Trout | 15 | 10 | premium crafted food |
| Raw Pike | 5 | 6 | ingredient only / blocked from use |
| Grilled Pike | 18 | 10 | best current fish meal |
| Raw Meat | 3 | 3 | ingredient only / blocked from use |
| Cooked Meat | 14 | 6 | efficient cooked food |

### Design Rule

Cooking should continue to mean:

- gathered food becomes worthwhile
- practical players eat better than buyers
- the skilling route feels smarter than pure shopping

## Work Matrix

Dockhand is the current labor branch of skilling.

### Current Dockhand Values

| Metric | Value |
|---|---:|
| Pay per shift | 18 |
| Energy cost | 60 |
| Min energy to start | 30 |
| Shift time | 08:00-16:00 |
| Late pay factor | 0.75 |

### Current Dockhand Role

| Strength | Weakness |
|---|---|
| safe | time-consuming |
| reliable | tiring |
| keeps Luke afloat | does not solve debt cleanly |

### Design Rule

Dockhand should remain:

- safe labor
- emergency cash
- a fallback, not a winning exploit

### Next Job Need

The route likely needs one more stable work branch later.

Best candidate directions:

| Job Idea | Why It Fits |
|---|---|
| Courier | supports Agility and practical survival |
| Fish-cleaning / market labor | expands docks economy naturally |
| Tavern help | survival flavor and schedule contrast |
| Sawmill labor | ties into wood/plank route |

My strongest recommendation later is:

- `Courier` if you want to support Agility too
- `Sawmill labor` if you want to strengthen wood/carpentry first

Recommended first pick right now:

- `Sawmill labor`

Why:

- it strengthens the weakest current skilling branches
- it uses an existing location naturally
- it helps woodcutting, planks, and labor feel like one family

## Woodcutting Matrix

Woodcutting exists, but still feels thinner than fishing.

### Current Woodcutting Values

From the current implementation:

| Metric | Value |
|---|---:|
| Time per cycle | 30 minutes |
| Energy per cycle | 10 |
| Main output | 1 log |
| Main XP on success | 30 |
| XP on failed add / edge case | 5 |

### Current Output

| Item | Base Value | Weight | Role |
|---|---:|---:|---|
| Log | 2 | 5.0 | raw practical material |

### Current Role

Woodcutting should mean:

- practical resource generation
- preparation
- low-glamour work
- setup for carpentry or future utility chains

### Current Problem

Right now the loop is too close to:

- chop log
- sell or plank it

It needs one more practical branch later to feel more alive.

Recommended first expansion:

- `Firewood`

## Carpentry Matrix

Carpentry is currently centered on planks.

### Current Recipe

| Recipe | Level | XP | Time | Energy | Output |
|---|---:|---:|---:|---:|---|
| Wooden Plank | 1 | 25 | 15 min | 2 | 1 plank |

### Current Conversion Value

| Input | Base Value | Output | Base Value |
|---|---:|---|---:|
| Log | 2 | Wooden Plank | 5 |

This is a good basic conversion.

### Current Role

Carpentry should mean:

- better value from wood
- repair materials
- practical help for quests and world problems

### Current Problem

It is still too narrow for a full route pillar.

Best next expansion later:

- add one more practical branch such as simple repairs, firewood, crate materials, or utility wood goods

Recommended first pick:

- firewood / fuel branch first
- repairs second

## Crafting Matrix

Crafting currently exists, but mostly as wolf-gear crafting.

### Current Crafting Recipes

| Recipe | Level | XP | Time | Energy | Output |
|---|---:|---:|---:|---:|---|
| Wolf Leather Helmet | 1 | 50 | 30 min | 5 | armor |
| Wolf Leather Leggings | 3 | 60 | 45 min | 8 | armor |
| Wolf Leather Armor | 5 | 100 | 60 min | 10 | armor |
| Wolf Tooth Amulet | 3 | 80 | 30 min | 6 | accessory |

### Current Recipe Inputs

| Recipe | Main Inputs |
|---|---|
| Wolf Helmet | 2 wolf pelts |
| Wolf Legs | 3 wolf pelts |
| Wolf Armor | 5 wolf pelts |
| Wolf Amulet | 5 wolf teeth + 1 rope |

### Current Problem

Crafting is not yet a broad skilling identity.

It currently leans too much into:

- combat rewards
- wolf drops

### Desired Direction

Crafting should later expand into:

- survival utility
- basic household goods
- repair / support items
- route-support gear

Not only:

- animal armor

## Tool Gate Matrix

Tools should continue to define skilling routes.

### Current Important Tools

| Tool | Base Value | Route Meaning |
|---|---:|---|
| Fishing Rod | 30 | unlocks food-security route |
| Old Axe | 20 | unlocks material route |
| Hammer | 15 | unlocks productive conversion logic |
| Spade | 12 | future expansion potential |

### Tool Priority Read

| Tool | Story Mode Priority | Sandbox Priority |
|---|---|---|
| Fishing Rod | highest | high |
| Old Axe | medium | high |
| Hammer | medium | medium |
| Spade | low now | future |

### Design Rule

Tools should feel like:

- life-changing investments

Not:

- minor stat items

## Survival Item / Resource Expansion Priorities

The skilling route will need more connective tissue later.

### Highest-Priority Additions

| Item Type | Why |
|---|---|
| low-tier gathered resources | makes wood/gathering richer |
| utility consumables | creates practical skilling outputs |
| one more low-value conversion good | helps carpentry/crafting identity |
| more support materials | ties systems together |

### Best Candidate Additions

| Item | Role |
|---|---|
| Firewood | wood branch for fuel/sale/use |
| Kindling | cheap utility output |
| Scrap Wood | low-value side output |
| Bait | fishing support item |
| Cloth Strips | simple utility crafting input |
| Herbs | connects future survival/cooking/remedy loops |

These are still content directions, not locked implementation.

## Story Mode vs Sandbox Emphasis

### Story Mode

Skilling should mostly emphasize:

- fishing
- cooking
- dockhand
- enough wood/plank support to feel real
- staying alive while dealing with Finn

### Sandbox / Full Game

Skilling should later emphasize:

- broader production chains
- more jobs
- more tools
- deeper crafting and processing
- long-form economy play

### Summary Split

| Mode | Skilling Role |
|---|---|
| Story | survival backbone |
| Sandbox / later | economy and self-sufficiency growth path |

## Recommended First Content Additions

These are the highest-value skilling additions after the current foundation.

### Tier 1

- one second stable work route
- one more practical wood/carpentry branch
- one or two low-tier utility resources
- at least one extra use for planks/logs

Recommended concrete first picks:

- `Sawmill labor`
- `Firewood`
- one simple repair or shelter-facing use for planks

### Tier 2

- more utility crafting outputs
- fishing support item like bait
- stronger non-combat crafting identity

### Tier 3

- deeper long-term production chains
- more jobs and profession branches
- expanded economic self-sufficiency for post-demo play

## Sandbox / Future Skilling Payoff

The game already has a hidden cabin foundation in the woods:

- `overgrown_path` exploration event
- `loc_cabin_unlocked` flag
- `player_cabin` location

That means the cabin should be treated as:

- a future Sandbox / post-demo skilling payoff
- not an immediate Story Mode priority

Best role for the cabin later:

- shelter upgrade
- practical skilling payoff
- wood/carpentry progression sink
- future place for cooking, storage, rest, and utility improvements

## Technical Notes For Implementation

### Fishing

Fishing is already the most complete loop and should mostly be tuned, not reinvented.

### Cooking

Cooking already has:

- recipe levels
- XP values
- time cost
- energy cost
- failure states

This is strong and should be used as the model for other practical conversion systems.

### Woodcutting

Woodcutting currently uses timed action flow with:

- energy cost
- hunger/time cost
- repeated gain per cycle

That means it is easy to expand with one more output or branch later.

### Carpentry / Crafting

Both already integrate through recipe data and crafting UI.

That means they are easier to expand than inventing a new subsystem.

## Success Standard

The skilling content matrix is successful for the alpha if:

- fishing remains the clearest route to food security
- cooking clearly rewards gathered ingredients
- dockhand remains useful without trivializing the week
- woodcutting and carpentry stop feeling like vestigial loops
- tools continue to feel like true route unlocks
- Story Mode and Sandbox use skilling differently but coherently

## Open Questions

Still to finalize later:

1. what the exact second job should be
2. whether carpentry's next branch should be firewood, repairs, or simple utility goods
3. how much non-combat crafting should exist before release
4. which additional low-tier items are truly necessary before the route feels complete
5. whether bait should be added before or after broader fishing economy work

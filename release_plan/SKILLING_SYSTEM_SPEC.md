# Divine Fantasy - Skilling System Spec v1

## Purpose

This document defines what the skilling route should be for the Driftwatch alpha/demo and how it should grow later.

It exists separately from the route roadmap because skilling is not just:

- XP numbers
- resource gathering
- recipes

It is a full route involving:

- food security
- work
- gathering
- cooking
- practical crafting
- time and energy management
- route-specific Finn-week survival
- long-term self-sufficiency

The goal is to make skilling the clearest and most grounded survival route in the alpha without making it solve everything for free.

## Core Skilling Direction

The skilling route should be the route of:

- labor
- planning
- practical competence
- self-sufficiency
- ugly, honest survival

Luke is still poor and pressured.

The skilling route should not feel rich or safe.

It should feel like:

- "I stay alive because I know how to work, gather, cook, and turn scraps into stability."

This should be the most reliable route in the alpha, but not the fastest route to every solution.

## Skilling Route Role In The Alpha

Skilling should be the strongest **day-to-day survival** route in Story Mode.

It should be strongest at:

- feeding Luke
- keeping him moving
- creating modest income
- giving the player something dependable to do every day

It should be weaker at:

- forcing quick social or violent outcomes
- dramatic shortcutting
- explosive story resolutions

This means skilling is the route that keeps the player in the game when everything else is unstable.

## Core Skilling Loop

The alpha skilling loop should be:

1. check hunger, energy, time, and goals
2. choose a practical activity
3. gather, work, cook, or craft
4. convert time and energy into food, materials, and small income
5. stabilize enough to keep moving through Finn week

This means skilling is built from four pillars:

### 1. Food Security

The player needs a believable way to stay fed.

Current strongest pillar:

- fishing

### 2. Labor

The player needs a safe but not amazing fallback for money.

Current strongest pillar:

- dockhand work

### 3. Resource Conversion

The player needs practical chains where raw materials become useful goods.

Current strongest pillars:

- logs into planks
- raw fish/meat into cooked food

### 4. Gradual Stability

The route should reward patience and repetition by making each day a little less desperate.

## What Skilling Should Feel Like

The skilling route should feel:

- grounded
- practical
- slow but steady
- hungry at first
- satisfying when it starts working

The player fantasy should be:

- "I am poor, but I can survive if I stay disciplined."

## Existing In-Game Foundation

The current game already has a strong skilling foundation.

Important existing supports:

- fishing loop
- woodcutting loop
- cooking recipes with success/failure logic
- carpentry/plank conversion
- a basic crafting layer
- dockhand job
- hunger and energy pressure
- tools that gate productive routes

This means skilling does **not** need a full conceptual rebuild.

It needs a cleaner route identity and continued content layering.

## Current Core Skills

The current skilling route already uses these core skills:

- `Fishing`
- `Woodcutting`
- `Cooking`
- `Carpentry`
- `Crafting`

### Fishing

Role:

- food security
- small sale value
- strongest early self-sufficiency route

Current support:

- docks fishing
- river fishing
- fishing rod requirement
- progression by fish type and catch rates

### Woodcutting

Role:

- resource gathering
- raw material generation
- future route support

Current support:

- chop wood activity
- axe requirement
- log generation

### Cooking

Role:

- turn raw food into real survival value
- reward gathered ingredients
- improve efficiency over buying food

Current support:

- sardine, trout, pike, and meat recipes
- failure/burn system

### Carpentry

Role:

- practical processing
- converting logs into better-value construction material

Current support:

- plank recipe
- sawmill-related route support

### Crafting

Role:

- practical gear and material progression
- currently more combat-adjacent in wolf gear crafting

Current support:

- wolf armor recipes
- wolf amulet

## Existing Practical Loops

The skilling route should be grounded in the loops that already exist.

### Fishing Loop

Current loop:

1. obtain rod
2. go to docks or river
3. spend time and energy on casts
4. catch raw fish
5. cook them
6. eat or sell

This is the strongest existing route loop in the game.

### Woodcutting Loop

Current loop:

1. obtain axe
2. chop logs
3. spend time and energy
4. use logs directly or process further

This loop exists, but is thinner than fishing.

### Carpentry Loop

Current loop:

1. get logs
2. use plank recipe
3. spend time, energy, and workshop access
4. gain planks for quests or value

This loop is useful but narrow.

### Cooking Loop

Current loop:

1. collect raw fish or meat
2. use recipe
3. succeed or burn
4. gain food with much better hunger value than raw ingredients

This is an important support loop and already works well conceptually.

### Work Loop

Current loop:

1. get hired as dockhand
2. show up on time
3. spend a large chunk of the day and energy
4. get paid
5. use wages to survive, not thrive

This is the game's current "safe labor" route.

## Current Balance Role Of Each Loop

### Fishing

Current role:

- best early food security route
- practical and honest
- should stay useful without dominating all progression

### Dockhand

Current role:

- safe emergency cash
- useful in Story Mode
- better as stability than as debt-winning grind

### Cooking

Current role:

- make skilling feel smarter than pure buying
- improve raw gather outputs

### Woodcutting / Carpentry

Current role:

- secondary practical route
- more material-focused than survival-focused
- still needs more route identity than it currently has

## Skilling Progression Philosophy

Skilling progression should not feel like:

- magical power growth

It should feel like:

- learning a trade
- getting more efficient
- wasting less
- using better tools
- opening more useful routines

The progression fantasy should be:

- Luke slowly becomes harder to starve, harder to trap, and better at turning effort into stability

## Time Arc For The 7-Day Demo

### Day 1-2

- skilling is how the player stops immediate collapse
- fishing is the clearest food route
- work is the clearest cash fallback
- cooking starts to matter

### Day 3-4

- the player begins to feel route rhythm
- they know where to go for food, money, and materials
- practical investments start paying off

### Day 5-6

- the route becomes more stable and efficient
- the player starts making smarter choices, not just desperate ones

### Day 7

- the player should feel that they endured the week through labor, food, and practical competence

## Primary Resources Of The Route

The skilling route mainly spends:

- time
- energy
- hunger
- tool access

The skilling route mainly gains:

- food
- practical materials
- small stable income
- better survival efficiency

This is the route most tied to the game's survival economy.

## Intelligence And Skilling

Right now all skills gain bonus XP from Intelligence in [useSkillStore.ts](/c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/stores/useSkillStore.ts).

That means Luke's current `INT 6` already supports the skilling route strongly.

This fits Luke's design well.

The skilling route should continue to feel like:

- the smartest and most practical route for him

without becoming automatically easy.

## Tools As Route Gates

The skilling route should continue to use tools as the main route gate.

Current important tools:

- `Fishing Rod`
- `Old Axe`
- `Hammer`

These tools are good because they do not just increase numbers.

They unlock a way of living.

### Fishing Rod

Meaning:

- food route unlocked

### Axe

Meaning:

- wood/material route unlocked

### Hammer / Workbench Access

Meaning:

- productive conversion route unlocked

This is exactly how skilling tools should work.

## Food Ladder And Skilling

The recent food rebalance already improved the skilling route.

Current important rule:

- bought food keeps Luke alive
- cooked/self-produced food makes Luke stable

This is a very good skilling identity.

The skilling route should continue to own:

- reliable food generation
- better hunger efficiency
- practical conversion of raw goods into survival value

## Work As A Skilling Route Component

Dockhand belongs inside the skilling route, but only as one branch of it.

It should be:

- the safe labor branch
- the "I need guaranteed coin" option

It should not become:

- the whole skilling route
- the main route to solve Finn's debt

This keeps work useful without flattening the route.

## Crafting And Carpentry Need More Identity

Fishing and cooking already feel like real loops.

Woodcutting, carpentry, and crafting are weaker in identity.

What they need is not a total redesign.

They need stronger route meaning.

### Woodcutting Should Mean

- practical material gathering
- preparation
- low-glamour work

### Carpentry Should Mean

- better value from raw materials
- helping with repairs, structures, and practical tasks

### Crafting Should Mean

- survival and utility crafting first
- not only combat-adjacent wolf gear

This is one of the main unfinished parts of the skilling route.

## Finn Week Role

Skilling should be the route that solves Finn-week pressure through:

- endurance
- labor
- supply
- practical favors
- food stability
- material delivery

It should be strongest when:

- the player needs to stay alive
- a task needs practical competence
- the week is being survived one day at a time

It should be weaker when:

- immediate leverage is needed
- a scene is about persuasion
- force would be faster

## Good Finn-Week Skilling Uses

Examples that fit this route:

- gathering food to stay in the game while handling debt
- working for survival cash
- collecting or processing materials for practical favors
- helping with repair-oriented or supply-oriented side quests
- solving problems by doing useful work instead of threatening or charming someone

## Story Mode vs Sandbox Role

### Story Mode

Skilling should be:

- the strongest stability route
- the route that lets the player survive the week honestly
- supportive of the story, not separate from it

### Sandbox / Full Game

Skilling should later become even more central through:

- longer progression chains
- more resource loops
- more job types
- deeper crafting
- more sustainable economy play

So the alpha should make skilling feel strong and foundational, even if the full version becomes much broader later.

## Existing Content Gaps

The skilling route already works, but it still has gaps.

Main current gaps:

- woodcutting and carpentry are less alive than fishing
- there is only one real job
- tool variety is still small
- low-tier utility/survival items are still limited
- crafting is still too narrow and too combat-adjacent

These are not reasons to rethink the route.

They are the main areas where it still needs expansion.

## Alpha Build Priorities

The skilling route should be built and polished in this order:

1. keep fishing as the clearest food-security route
2. keep dockhand as emergency cash, not debt-winning grind
3. strengthen cooking as the reward for gathered food
4. strengthen woodcutting/carpentry as real practical loops
5. add more low-tier utility/resource chains later
6. support Finn-week tasks that reward practical labor and supply

## Recommended First Content Directions

The most valuable skilling-facing additions later would be:

- one more stable work route beyond dockhand
- more low-tier gathered materials
- more practical conversion recipes
- more survival/utility items
- more uses for planks, logs, and basic crafted goods

This would make skilling feel broader without changing its identity.

## Recommended Route Expansion Direction

If the route needs one stronger expansion after the current foundation, the best direction is:

- strengthen the woodcutting/carpentry side first

The best next practical steps are:

- add one second purpose to wood besides planks
- add one second stable job that supports wood/carpentry or movement
- use those additions to build toward a stronger long-form skilling payoff

### Best First Practical Branch

Recommended first addition:

- `Firewood`

Why:

- simple
- believable
- survival-facing
- makes logs more than "sell or plank"
- naturally supports cooking, shelter, and future cabin systems

### Best Second Job Candidates

Strongest candidates:

- `Sawmill labor`
- `Courier`

Recommended first choice if the goal is skilling identity:

- `Sawmill labor`

Why:

- strengthens weak parts of the route immediately
- supports woodcutting and carpentry
- fits existing Driftwatch geography and the sawmill location

### Cabin As Future Payoff

The game already has the beginnings of a hidden cabin path in the woods.

That should be treated as:

- a strong Sandbox / post-demo skilling payoff
- not an immediate Story Mode alpha priority

Why:

- it gives woodcutting and carpentry emotional purpose
- it turns practical labor into shelter and long-term improvement
- it fits the larger skilling fantasy very well

The best order is:

1. strengthen wood and carpentry loops
2. add a second work branch
3. broaden practical utility crafting
4. later let those systems support the cabin meaningfully

## What Should Not Be Built Yet

To protect scope, the alpha should not try to build:

- huge crafting trees
- deep factory-like economy systems
- too many jobs at once
- an enormous survival item list before the basics are strong

The alpha only needs enough skilling structure to prove that:

- Luke can survive through labor and competence
- the route has believable daily rhythm
- practical play feels different from social and combat

## Success Standard

The skilling route is successful for the alpha if:

- it is the clearest and most reliable survival route
- fishing and cooking feel like a real way of living
- work stabilizes the player without solving the week alone
- tools feel like life-changing investments
- woodcutting, carpentry, and crafting feel like practical support systems
- the route keeps Luke in the story instead of replacing it

## Open Design Questions

These still need final decisions before implementation:

1. what the second real job after dockhand should be
2. whether carpentry should stay plank-focused for the alpha or gain one more practical branch
3. how much broader crafting should become before release
4. which Finn-week steps should explicitly support skilling-first resolutions
5. how much additional low-tier item variety is needed before the route feels complete

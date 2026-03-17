# Divine Fantasy - Social System Spec v1

## Purpose

This document defines the social system for the Driftwatch alpha/demo.

It exists separately from the route roadmap because the social route is not just a content branch.

It is a full game system involving:

- dialogue structure
- social energy
- charisma, persuasion, and coercion
- relationship stats
- NPC personality and class
- clothing and presentation
- authored first-meet scenes
- route-specific progression through the Finn week

The goal is to make the social route mechanically real, readable, and useful inside the 7-day demo.

## Social Route Fantasy

The social route is not about Luke being naturally charming.

Luke starts socially weak.

He is:

- low-charisma
- awkward
- poor
- badly dressed
- limited in social stamina

What makes the social route work is not natural smoothness.

It is:

- observation
- asking the right questions
- learning how people work
- using persuasion, fear, friendship, romance, and leverage intelligently

The player fantasy should be:

- "I survive by understanding people better than they understand me."

## System Goals

The social system in the alpha should do these things:

1. make talking to people mechanically useful
2. support route progression through information and leverage
3. let relationships change what the player can access
4. make persuasion and coercion meaningfully different
5. make low-charisma Luke feel limited without making conversation pointless
6. support alternate solutions inside the Finn week

## Core Social Loop

The social route loop should be:

1. meet or revisit NPCs
2. ask questions to learn lore, rumors, needs, weaknesses, and opportunities
3. use social actions to build friendship, romance, or fear
4. unlock better dialogue, better offers, quests, favors, and route-specific resolutions
5. use what was learned to survive and progress the Finn week

This means the social route is built from three pillars:

### 1. Information

The player learns:

- who matters
- what they want
- what they fear
- what they need
- what they can offer
- what hidden route or quest they can unlock

### 2. Relationship Shaping

The player spends social energy to change how the NPC sees Luke.

This happens through:

- friendly actions
- flirt actions
- coercive actions

### 3. Social Leverage

The player uses information and relationships to:

- unlock quests
- unlock alternate quest resolutions
- lower friction
- gain aid, discounts, shelter, food, or information
- find route-specific answers inside the Finn week

## Dialogue Structure

The social system should use a two-layer dialogue model.

### Layer A: Interaction Menu

Every NPC dialogue starts at a root interaction menu.

Possible menu categories are:

- `Ask`
- `Friendly`
- `Flirt`
- `Coerce`
- `Quest`
- `Leave`

These categories are not universal.

Each NPC can expose only the categories that fit them.

### Layer B: Dialogue Nodes

Inside each category, the game still uses the existing node/choice system.

This means:

- the current JSON dialogue structure stays useful
- the new system wraps the old one instead of replacing it
- category roots become entry points into the deeper node trees

### First-Meet Dialogue Rule

The current generic auto-greeting behavior should be removed.

Instead, NPCs should support an optional authored first-meet node.

Rules:

- if an NPC has a first-meet node, the game uses it once
- that node can include unique choices, lore, quest hooks, or route clues
- if an NPC does not have a first-meet node, the game uses the normal repeat/root node
- simple NPCs do not need custom first-meet content

This allows:

- important NPCs to feel authored and memorable
- tutorial/introduction scenes to stay natural
- lightweight NPCs to remain cheap to write

## Interaction Categories

### Ask

Purpose:

- lore
- rumors
- world knowledge
- personal questions
- social discovery
- unlocking secrets, quests, or route clues

Rules:

- usually free
- usually does not spend social energy
- often gives one-time XP
- often unlocks other interaction categories or quest options

Ask is discovery, not relationship grinding.

### Friendly

Purpose:

- build friendship
- build comfort
- warm up guarded NPCs
- get people more comfortable with Luke

Rules:

- spends social energy
- uses persuasion-related modifiers
- can improve friendship
- may unlock quest/favor options

### Flirt

Purpose:

- build romance
- create romantic tension where appropriate
- unlock special social outcomes with romance-capable NPCs

Rules:

- spends social energy
- not available for every NPC
- strongly affected by context, personality, and presentation
- can backfire harder than Friendly

### Coerce

Purpose:

- build fear
- force compliance
- pressure an NPC into giving something up
- open harsher route solutions

Rules:

- spends social energy
- uses coercion modifiers
- can improve fear and short-term compliance
- often damages friendship and romance potential

### Quest

Purpose:

- actual quest progression
- turn-ins
- follow-ups
- route-specific problem solving

Rules:

- usually free unless it includes a persuasion/coercion attempt
- should be where ongoing quest branches live after they are discovered

### Leave

Purpose:

- clean exit

## Important Category Rule

The system should follow this rule:

- `Ask` is for discovery
- `Quest` is for progression

Example:

- asking Roberta about storm damage belongs in `Ask`
- once discovered and unlocked, helping with the wall belongs in `Quest`

That keeps the dialogue readable and prevents quest progression from getting buried inside lore menus.

## Social Energy

### Role

Social energy represents Luke's social stamina and confidence in active social shaping.

It should not limit all conversation.

It should limit attempts to actively influence people.

### Default Rule

`Ask` is usually free.

`Friendly`, `Flirt`, and `Coerce` usually cost social energy.

`Quest` is usually free unless it includes a major social attempt.

### Why

This makes low-charisma Luke feel socially limited without making him unable to gather information.

Luke should be bad at building momentum with people, not bad at asking basic questions.

### Recovery

For the alpha:

- social energy restores daily
- charisma sets the base cap
- persuasion or coercion specialization can expand the cap over time

Later, if needed, special actions, clothing, food, or social success can affect recovery.

## Attributes and Skills

### Charisma

Charisma should represent:

- social stamina
- social presence
- baseline confidence
- base social capacity

For the alpha, charisma should:

- set `maxSocialEnergy`

Charisma should **not** be the main scaler for relationship gains.

Luke starts weak here on purpose.

### Persuasion

Persuasion represents:

- diplomacy
- honesty
- charm in practice
- friendship-building
- gentle influence

Persuasion should affect:

- friendly checks
- friendship gains
- romance gains
- soft quest resolutions
- information extraction from willing NPCs

### Coercion

Coercion represents:

- intimidation
- threat
- dominance
- hostile leverage

Coercion should affect:

- coercive checks
- fear gain
- forced compliance
- hard social shortcuts in the Finn week

### Social Energy Growth

For the alpha, social energy should grow through specialization.

Recommended rule:

- `baseSocialEnergy = Charisma`
- `bonusSocialEnergy = floor(max(Persuasion, Coercion) / 10)`

This means:

- Luke starts socially weak because his charisma is low
- social specialists grow their capacity by investing in the route
- the system rewards actual social play rather than only base attributes

### XP Sources

Social XP should come from:

- one-time important questions
- successful persuasion/coercion checks
- meaningful Friendly/Flirt/Coerce actions
- social quest resolutions
- important information discoveries

Social XP should not come primarily from:

- repeating the same low-value action endlessly

## Relationship Model

The social system should use three relationship dimensions:

- `Friendship`
- `Love`
- `Fear`

### Meaning of Each Value

`Friendship`
- personal warmth
- comfort
- liking Luke as a person

`Love`
- romantic or sexual interest where appropriate

`Fear`
- intimidation
- avoidance
- obedience through discomfort or threat

### Important Note

Different NPCs should care about different values.

Examples:

- Roberta may care heavily about friendship
- Finn may care more about fear and practical respect
- some NPCs may barely use romance at all

## NPC Class, Personality, and Presentation

The social system should be affected by who the NPC is and how Luke presents himself.

### NPC Social Class

NPCs should have a class tag such as:

- poor
- working
- merchant
- criminal
- noble

This affects:

- what they respect
- what they distrust
- how they react to Luke's clothing and equipment

### NPC Personality

NPCs should have one or more personality tags such as:

- warm
- guarded
- proud
- lonely
- practical
- fearful
- greedy
- dutiful

This affects:

- which social actions work best
- which actions backfire
- what kind of questions or tone they respond to

### Social Action Families

Social actions should not be generic flavor spam.

They should use authored subtypes that match NPC personality.

#### Friendly action families

- `Small Talk`
- `Offer Help`
- `Listen`
- `Compliment`
- `Share Rumor`
- `Be Honest`
- `Be Respectful`

#### Flirt action families

- `Playful`
- `Gentle Compliment`
- `Bold Advance`
- `Personal Interest`
- `Tease`

#### Coerce action families

- `Threaten`
- `Press Hard`
- `Exploit Weakness`
- `Cold Demand`
- `Intimidating Presence`

These action families should be matched against personality tags.

Examples:

- warm NPCs respond well to `Listen` and `Be Honest`
- guarded NPCs respond better to `Be Respectful` than to `Bold Advance`
- proud NPCs dislike pity and may respect directness
- fearful NPCs are more vulnerable to coercion
- lonely NPCs respond well to `Personal Interest` and `Listen`

### Presentation

Luke's clothing and visible loadout should influence social outcomes.

This should be the alpha-facing presentation layer.

## Clothing / Social Presentation

### Goal

Clothing should matter socially.

Luke should not begin the game looking neutral.

He should begin with poor presentation.

### Baseline

Luke starts in:

- rags or visibly low-status clothing

This should give:

- bad first-impression value
- weaker social standing with many NPCs
- especially poor presentation with merchants, nobles, and status-conscious characters

### Future Social Clothing Layer

The alpha should support the concept of clothing affecting social outcomes.

Examples:

- rags hurt friendship and romance with many NPCs
- work clothes help with laborers and practical people
- cleaner clothes help friendship and romance with merchants or respectable NPCs
- visible weaponry may help coercion but hurt friendliness

Clothing should affect:

- first impressions
- NPC willingness to engage
- social outcome quality
- access to some locations
- access to some quests or branches

Examples:

- some nobles may refuse to talk to Luke in rags
- some upper-class spaces may reject visibly low-presentation clothing
- some worker or criminal spaces may react badly to overly fine clothing
- some quests may require looking appropriate enough to be taken seriously

### Economy Tie-In

This naturally supports:

- clothing purchases
- a dedicated clothier NPC/store
- social route investment through presentation rather than only food/tools

## NPC Menu Availability

Not every NPC should have the full social menu.

Each NPC should explicitly define which social categories they support.

### Available Categories Per NPC

- `ask`
- `friendly`
- `flirt`
- `coerce`
- `quest`

### Example NPC Profiles

#### Roberta

Should likely support:

- `Ask`
- `Friendly`
- `Flirt`
- `Quest`
- limited `Coerce`

She is a strong route-support NPC because she can offer:

- lore
- friendship gating
- practical quests
- social progression

#### Finn

Should likely support:

- `Ask`
- `Coerce`
- `Quest`
- maybe limited `Friendly`

Should not support:

- `Flirt`

Finn is not a romance-route NPC and should feel socially dangerous, not socially open.

#### Generic Ambient NPC

A shallow NPC such as a minor dockside contact should maybe support only:

- `Ask`
- maybe `Quest`

This keeps scope under control.

## NPC Depth Tiers

To prevent scope explosion, NPCs should be grouped by depth:

### Major NPC

Examples:

- Finn
- Roberta
- Beryl
- Elara
- Boric

These can support multiple social categories and route progression.

### Supporting NPC

Examples:

- Ronald
- Cyrus
- Sarah

These should support a smaller but still meaningful subset of categories.

### Ambient NPC

Examples:

- generic drunks
- minor workers
- one-off town contacts

These should be limited and mostly informational or route-supportive.

## Social Actions and Repetition

The social system must avoid turning into:

- spam Friendly until friendship rises

For the alpha:

- important social gains should be authored
- repeated actions should have limited or diminishing value
- one-time questions should often give one-time XP
- meaningful route progress should come from good choices, not button grinding

The system should prioritize:

- authored interaction quality

over:

- infinite repeatable farming

## How This Fits the Finn Week

The social route should make the Finn week feel different by:

- revealing alternate solutions through questions
- unlocking softer debt collection outcomes
- uncovering secrets that open the rebel path
- gaining help, information, or forgiveness instead of always grinding or threatening

The route should be strongest at:

- information
- leverage
- alternate resolutions
- reducing friction

The social route should not simply be:

- "the nice route"

It should be:

- the route of information, leverage, and human understanding

## Alpha Implementation Priorities

The social system should be built in this order:

1. define root interaction menu structure
2. define relationship stat model
3. define social energy usage rules
4. define NPC menu availability and depth tiers
5. define authored first-meet nodes for major NPCs
6. convert major NPCs to the new social structure
7. add social route support to the Finn week
8. add clothing/presentation as a social modifier layer

## Major NPC Conversion Targets

The first NPCs that should support the new system are:

- Roberta
- Finn
- Beryl
- Boric
- Elara

These NPCs matter most for the Finn week and early survival route identity.

## Open Design Questions

These still need final decisions before implementation:

1. how strong clothing modifiers should be in the alpha
2. whether Love should be visible immediately or introduced gradually
3. whether some Ask topics should require minimum friendship/fear or only discovery flags
4. how strong first-meet authored scenes should be for supporting NPCs
5. how many repeatable social actions per NPC/day should be allowed

## Success Standard

The social system is successful for the alpha if:

- the player can survive and progress through talking, not only through labor or violence
- Luke feels socially weak at the start but not socially useless
- asking questions becomes mechanically valuable
- NPCs feel different from each other
- social progression changes quest options and route outcomes
- the Finn week supports social resolutions that feel meaningfully different from skilling and combat

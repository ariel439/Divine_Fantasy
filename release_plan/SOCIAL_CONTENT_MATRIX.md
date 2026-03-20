# Divine Fantasy - Social Content Matrix

## Purpose

This document turns the social system concept into an implementation-facing matrix.

It defines:

- the first clothing/presentation set for the alpha
- the initial social energy costs
- the first XP values
- the first relationship gain/loss rules
- which NPCs expose which social menu categories
- the intended social thresholds for the major early NPCs

These values are for the **first route-complete alpha pass**, not final release balance.

## Core Alpha Defaults

### Social Menu Categories

The alpha social menu uses:

- `Quest`
- `Ask`
- `Friendly`
- `Flirt`
- `Coerce`
- `Back`

Standard interaction-menu order:

1. `Quest`
2. `Ask`
3. `Friendly`
4. `Flirt`
5. `Coerce`
6. `Back`

`Trade` should be handled outside the interaction menu from the NPC's opening node.

### Opening Node Standard

Major social NPCs should use:

- optional `first_meet_node`
- optional `repeat_meet_node`
- `Show me your stock.` first if the NPC has a shop
- `I'd like to talk.` to open the interaction menu
- `Back.` or equivalent to exit cleanly

If an opening node would only be:

- `I'd like to talk.`
- `Back.`

the game should skip it and open directly on the interaction menu.

### Relationship Stats

The alpha uses:

- `Friendship`
- `Love`
- `Fear`

### Core Rules

- `Ask` is usually free
- `Friendly`, `Flirt`, and `Coerce` spend social energy
- `Quest` is usually free unless it includes a strong social attempt
- one-time `Ask` topics often grant one-time XP
- repeatable social actions should have limited gains per day

## Social Energy Cost Table

Initial alpha values:

| Action | Social Energy Cost | Notes |
|---|---:|---|
| Ask | 0 | Discovery action, usually free |
| Friendly | 1 | Basic relationship-building action |
| Flirt | 2 | Higher-risk, stronger potential swing |
| Coerce | 2 | Higher-risk, fear-focused action |
| Quest | 0 | Normal progression action |
| Quest persuasion attempt | 1 | When quest progression includes a social push |
| Quest coercion attempt | 2 | When quest progression includes a threat or hard push |

### Daily Interaction Rule

For the alpha:

- each NPC should support at most **2 meaningful relationship-shaping actions per day**
- after that, the category can:
- grey out
- give reduced gains
- or return a low-value fallback line

Recommended first implementation:

- allow 2 meaningful Friendly/Flirt/Coerce gains per NPC per day
- after that, no further relationship gain until next day
- if possible, disable those choices visibly with a `No more today` style message

## Social XP Matrix

### Ask XP

| Ask Type | XP | Repeatable? |
|---|---:|---|
| Basic lore question | 5 | No |
| Personal background question | 5 | No |
| Route clue / rumor | 8 | No |
| Finn-week clue / important lead | 10 | No |
| Major route-unlocking question | 15 | No |

### Friendly / Flirt / Coerce XP

| Action | Success XP | Minor Fail XP | Hard Fail XP |
|---|---:|---:|---:|
| Friendly | 8 Persuasion | 3 Persuasion | 0 |
| Flirt | 10 Persuasion | 4 Persuasion | 0 |
| Coerce | 10 Coercion | 4 Coercion | 0 |

### Quest XP

| Outcome Type | XP |
|---|---:|
| Socially solved side step | 15 |
| Socially solved quest branch | 20 |
| Major social Finn-week resolution | 30 |
| Major coercive Finn-week resolution | 30 |

## Relationship Gain / Loss Matrix

These are base values before NPC modifiers.

### Friendly

| Result | Friendship | Love | Fear |
|---|---:|---:|---:|
| Good success | +8 | +1 | 0 |
| Mild success | +5 | 0 | 0 |
| Mild fail | -2 | 0 | 0 |
| Hard fail | -5 | -1 | 0 |

### Flirt

| Result | Friendship | Love | Fear |
|---|---:|---:|---:|
| Good success | +2 | +8 | 0 |
| Mild success | +1 | +5 | 0 |
| Mild fail | -1 | -2 | 0 |
| Hard fail | -4 | -5 | 0 |

### Coerce

| Result | Friendship | Love | Fear |
|---|---:|---:|---:|
| Good success | -4 | 0 | +8 |
| Mild success | -2 | 0 | +5 |
| Mild fail | -1 | 0 | +1 |
| Hard fail | -3 | 0 | -2 |

## Stat Influence Rules

### Charisma

For the alpha, Charisma should affect:

- base `maxSocialEnergy`
- first-impression modifier

### Social Energy Growth

Recommended first pass:

- `baseSocialEnergy = Charisma`
- `bonusSocialEnergy = floor(max(Persuasion, Coercion) / 10)`

Examples:

- `CHA 2`, Persuasion `3`, Coercion `1` = `2` social energy
- `CHA 2`, Persuasion `12`, Coercion `4` = `3` social energy
- `CHA 2`, Persuasion `21`, Coercion `6` = `4` social energy

### Persuasion

Persuasion affects:

- Friendly success chance
- Flirt success chance
- Friendly gains
- Flirt gains
- soft quest checks
- information checks where rapport matters

### Coercion

Coercion affects:

- Coerce success chance
- Coerce fear gain
- intimidation quest checks
- forceful social shortcuts

## Clothing and Presentation Matrix

The alpha should begin with a small but meaningful clothing layer.

### Presentation Rating

Presentation and intimidation should be built from actual equipped pieces.

Recommended first pass:

| Item | Slot | Buy Value | Presentation | Intimidation |
|---|---|---:|---:|---:|
| Ragged Shirt | Chest | 0 | -1 | 0 |
| Ragged Trousers | Legs | 0 | -1 | 0 |
| Common Shirt | Chest | 16 | +1 | 0 |
| Common Trousers | Legs | 14 | +1 | 0 |
| Common Shoes | Boots | 10 | +1 | 0 |
| Fine Shirt | Chest | 28 | +2 | 0 |
| Fine Trousers | Legs | 24 | +1 | 0 |
| Fine Shoes | Boots | 18 | +1 | 0 |
| Wolf Leather pieces | Armor | existing | 0 | +1 to +2 each |
| Iron pieces | Armor | existing | +1 each | +1 to +2 each |
| Crude Knife | Weapon | existing | 0 | +1 |
| Iron Sword | Weapon | existing | 0 | +2 |

### Equipment Presentation Modifier

Visible equipment should also affect social outcomes.

| Visible Loadout | Modifier |
|---|---|
| No visible weapon | neutral |
| Crude knife visible | +1 coercive feel, -1 friendly/flirt with cautious NPCs |
| Iron weapon visible | stronger coercive feel, more social friction with cautious NPCs |
| Work tool visible | +1 with practical/working NPCs |

### Alpha Implementation Rule

For the first pass:

- clothing should affect **first impression**
- clothing should affect **Friendly / Flirt / Coerce result quality**
- clothing should affect **whether some NPCs will engage at all**
- clothing should affect **entry or acceptance for a small number of high-status spaces and quests**

### Dedicated Clothier

The alpha should use a dedicated clothier/store rather than hiding all presentation upgrades inside general goods.

That store should be:

- the main place to improve Luke's appearance
- a visible social-route investment point
- an economy bridge between survival and social progression

## NPC Interaction Availability Matrix

### Major NPCs

| NPC | Ask | Friendly | Flirt | Coerce | Quest | Notes |
|---|---|---|---|---|---|---|
| Roberta | Yes | Yes | Yes | Limited | Yes | Main social-route support NPC |
| Finn | Limited | Limited | No | Yes | Yes | Dangerous power NPC, not romanceable |
| Beryl | Yes | Yes | No | Yes | Yes | Socially useful, pressure-sensitive |
| Boric | Yes | Limited | No | Limited | Yes | Job/support NPC, practical not intimate |
| Elara | Yes | Yes | No | Limited | Yes | Sympathy-driven NPC |

### Supporting NPCs

| NPC | Ask | Friendly | Flirt | Coerce | Quest | Notes |
|---|---|---|---|---|---|---|
| Sarah | Yes | Yes | No | No | Limited | Warm supportive relationship |
| Kyle | Yes | Limited | No | No | Limited | Mostly route flavor/support |
| Old Leo | Yes | Yes | No | No | Limited | Lore, memory, and comfort figure |
| Ronald | Yes | Limited | No | Limited | Yes | Practical mentor/support NPC |
| Cyrus | Yes | Limited | No | Limited | Yes | Information/support NPC |

### Ambient / Limited NPCs

| NPC Type | Ask | Friendly | Flirt | Coerce | Quest |
|---|---|---|---|---|---|
| Shop extra | Yes | No | No | No | No |
| Generic dock worker | Yes | No | No | Limited | No |
| Tavern extra | Yes | Limited | Limited | Limited | No |

## NPC Depth Tier Rules

### Major NPC

Should have:

- optional authored first-meet node
- full root interaction menu where appropriate
- at least 3 meaningful Ask topics
- at least 2 relationship-building interactions
- at least 1 route-relevant quest or branch

### Supporting NPC

Should have:

- optional first-meet node only if useful
- 1-3 Ask topics
- 1 relationship category if relevant
- light route support

### Ambient NPC

Should have:

- minimal Ask support
- flavor or clue delivery only

## Major NPC Threshold Matrix

These are recommended first-pass unlock thresholds.

### Roberta

| Unlock | Requirement |
|---|---|
| Ask about family/shop history | none |
| Ask about storm damage | none |
| Offer to help with wall repair | `Friendship 20` |
| Better personal dialogue | `Friendship 25` |
| Early flirt availability | `Friendship 15` and no recent hard fail |

### Beryl

| Unlock | Requirement |
|---|---|
| Ask about money problems | none |
| Softer debt options | `Friendship 10` or clue flag |
| Delicate package route | `Friendship 15` or clue flag |
| Hard leverage route | clue found or `Coercion check` |

### Boric

| Unlock | Requirement |
|---|---|
| Ask about dock work | none |
| Job acceptance route | neutral relationship minimum |
| Better practical advice | `Friendship 10` |

### Elara

| Unlock | Requirement |
|---|---|
| Ask about household trouble | none |
| Softer debt discussion | `Friendship 15` |
| Sympathy-based alternate handling | `Friendship 20` |

### Finn

| Unlock | Requirement |
|---|---|
| Basic debt dialogue | quest state |
| Extra questions about the Guild | clue/flag-based |
| Social leverage options | route progress + friendship/fear conditions |
| Strong coercive pushback | `Coercion` check |

## Ask-Topic Design Rules

Ask topics should be split into:

- lore
- personal
- rumor
- route clue
- quest clue

### Ask Topic Rule

Each ask topic should define:

- whether it is one-time only
- whether it grants XP
- whether it unlocks another topic
- whether it unlocks a Quest option
- whether it changes friendship slightly

### Social Action Family Matrix

The alpha should use authored action families, not generic repeated text.

#### Friendly families

- `Small Talk`
- `Offer Help`
- `Listen`
- `Compliment`
- `Share Rumor`
- `Be Honest`
- `Be Respectful`

#### Flirt families

- `Playful`
- `Gentle Compliment`
- `Bold Advance`
- `Personal Interest`
- `Tease`

#### Coerce families

- `Threaten`
- `Press Hard`
- `Exploit Weakness`
- `Cold Demand`
- `Intimidating Presence`

### Personality Response Guidelines

| Personality | Likes | Dislikes |
|---|---|---|
| Warm | Listen, Be Honest, Gentle Compliment | Cold Demand, Exploit Weakness |
| Guarded | Be Respectful, Small Talk | Bold Advance, Press Hard |
| Proud | Directness, Respectful tone | Pity, Tease |
| Lonely | Listen, Personal Interest | Cold Demand, dismissive Small Talk |
| Practical | Offer Help, Be Honest | Tease, vague flattery |
| Fearful | Gentle approaches, but vulnerable to Coerce | Bold flirt, aggressive pressure |
| Greedy | Share Rumor, leverage, practical offers | moralizing |
| Dutiful | Be Respectful, Be Honest | Threaten, manipulative flirt |

Recommended first pass:

- most Ask topics are one-time only
- important Ask topics grant XP once
- key route clues unlock quest or branch options

## First 7-Day Social Arc

### Day 1-2

The player should:

- use Ask to learn who matters
- get first useful social clues
- unlock at least one practical social advantage

### Day 3-4

The player should:

- convert information into route progress
- build enough friendship/fear for alternate options
- start resolving Finn-week problems socially

### Day 5-6

The player should:

- use established relationships and leverage
- gain cleaner or more complex resolutions than the skilling route

### Day 7

The player should:

- feel that they reached the end of the week through social reading, leverage, and route-specific choices

## Technical Configuration Rules

For implementation, each social-capable NPC should eventually define:

- available menu categories
- social class tag
- personality tags
- optional `first_meet_node`
- optional `repeat_meet_node`
- romance enabled or disabled
- daily interaction limits
- topic unlock thresholds
- relationship stat relevance

### Important Rule

An NPC does **not** need every social category.

The system should support:

- full social NPCs
- partial social NPCs
- minimal clue-delivery NPCs

## Alpha Build Priority

Build in this order:

1. root category system in dialogue
2. Ask / Friendly / Coerce / Quest as working categories
3. relationship stat support for Friendship / Love / Fear
4. per-NPC menu availability
5. authored first-meet node support
6. authored repeat-meet node support
7. Roberta conversion
8. Beryl and Finn conversion
9. clothing/presentation first pass

## Open Questions

Still to finalize later:

1. whether Love is shown in UI immediately or unlocked later
2. exact engagement-blocking thresholds for nobles/high-status NPCs
3. which quests should require clothing/presentation gates
4. whether fear decays over time faster than friendship
5. whether some coercive outcomes should temporarily create obedience-style quest states

# Divine Fantasy - Combat Content Matrix

## Purpose

This document turns the combat system concept into an implementation-facing matrix.

It defines:

- the alpha combat categories
- the intended enemy ladder
- brawl rules
- early combat XP sources
- equipment progression priorities
- intimidation inputs
- agility training sources
- Story Mode versus Sandbox combat emphasis

These values and structures are for the **first route-complete alpha pass**, not final release balance.

## Core Alpha Defaults

### Combat Categories

The alpha combat layer should use three core categories:

- `Brawl`
- `Street Violence`
- `Beast Danger`

### Core Route Rule

Combat in the alpha is:

- a support route in Story Mode
- a larger long-term progression route in Sandbox and the full game

### Core Tone Rule

Luke should feel:

- weak at the start
- capable of winning brawls against weak humans
- threatened by armed humans
- badly outmatched by beasts unless prepared

## Fight Type Matrix

| Fight Type | Tone | Default Lethality | Typical Enemies | Main Reward |
|---|---|---|---|---|
| Brawl | rough, public, humiliating, low-stakes | low | drunks, brawlers, pit fighters | XP, betting money, local toughness |
| Street Violence | dangerous, ugly, desperate | medium-high | thugs, muggers, smugglers | shortcuts, rough money, fear |
| Beast Danger | survival horror, wilderness threat | high | wolves | survival test, hunting value, progression gate |

## Alpha Enemy Ladder

The alpha does not need a huge bestiary.

It needs a clearer threat ladder.

### Existing Enemy Types

| Enemy | Current Status | Intended Role |
|---|---|---|
| Wolf | already exists | beast danger benchmark |
| Smuggler | already exists | dangerous organized human threat |
| Thug | already exists | generic dangerous human enemy |
| Finn | already exists | story climax confrontation |
| Elite Guard | already exists | overpowering late threat / "do not fight casually" benchmark |

### Recommended First Additions

| Enemy | Category | Purpose |
|---|---|---|
| Drunk | Brawl | weakest human combat target, tavern training enemy |
| Brawler | Brawl | stronger fists-only repeatable opponent |
| Knife Thug | Street Violence | more dangerous 1v1 human threat |
| Pit Fighter | Brawl | arena progression enemy |
| Slum Ambusher | Street Violence | event-driven human threat with intimidation interaction |

### Live Enemy Data State

The following now exist in live enemy data:

- `Drunk`
- `Brawler`
- `Knife Thug`

Current implementation state:

- `Drunk` is already used as the Ben tavern-brawl combat template
- `Brawler` exists in data but is not yet placed into authored world content
- `Knife Thug` exists in data but is not yet placed into authored world content

## Enemy Strength Intent

These are not exact formulas yet.

They are intended player reads.

| Enemy Type | Early Luke In Rags | Early Luke With Knife | Early Luke With Early Armor |
|---|---|---|---|
| Drunk | favored | easy | trivial |
| Brawler | manageable | manageable | favorable |
| Thug | dangerous | dangerous but possible | manageable |
| Knife Thug | likely loss | risky | possible |
| 1 Wolf | dangerous | possible with luck | manageable but still scary |
| 2 Wolves | likely death | near-certain death | still extremely dangerous |
| Smuggler Group | impossible alone | impossible alone | story/group fight only |

## Brawl Rules

Brawls are the most important new combat content for the alpha.

### Brawl Defaults

| Rule | First-Pass Direction |
|---|---|
| Weapons | disabled by default |
| Armor | allowed, but should feel less dominant than in knife fights |
| Damage | lower than lethal combat |
| Death | avoided by default; defeat means knockdown, humiliation, loss, or payout loss |
| Rewards | XP, betting money, rough reputation later if desired |
| Recovery | still costs time/energy, but less severe than knife fights |

### Brawl Use Cases

| Scene | Type | Notes |
|---|---|---|
| Ben tavern brawl | one-off or light repeat | strong story-facing first brawl |
| Tavern fighter NPC | repeatable | main early combat trainer |
| Hidden pit / arena | repeatable progression | discovered through social info |
| Special challenger night | scheduled event | stronger brawlers, higher bets |

### Live State

Current live status:

- Ben tavern brawl is implemented
- brawls use the same combat screen with a special `brawl` encounter type
- brawls use fists / blunt logic
- brawl defeat is knockout, not game over
- brawl victory returns directly to gameplay instead of the loot screen

## Brawl Reward Matrix

### First-Pass Reward Direction

| Brawl Tier | Attack XP | Agility XP | Money | Notes |
|---|---:|---:|---:|---|
| Easy drunk | 10 | 2 | 3-6 | intro-level training fight |
| Standard brawler | 18 | 4 | 6-12 | reliable early combat growth |
| Pit fighter | 25 | 6 | 10-20 | stronger repeatable progression |
| Featured pit challenger | 35 | 8 | 20-40 | should not be always available |

### Design Rule

Brawls should:

- be the main repeatable early combat XP path
- give money, but not better than dedicated economy routes
- feel worthwhile without becoming the whole game

## Street Violence Matrix

Street violence should be lower-frequency and higher-consequence than brawls.

### Intended Use Cases

| Scene Type | Example |
|---|---|
| Debt escalation | weak debtor or rough contact resists |
| Slum ambush | future night event |
| Mugging | future street encounter |
| Smuggler violence | existing story encounter |
| Shady errand gone bad | future sandbox/post-demo content |

### Reward Direction

| Street Fight Tier | Attack XP | Defence XP | Agility XP | Money / Loot | Notes |
|---|---:|---:|---:|---|---|
| Weak thug | 18 | 10 | 4 | 5-15 value | high danger, modest payout |
| Knife thug | 24 | 14 | 5 | 8-20 value | real early threat |
| Ambusher pair | 30 | 18 | 6 | 10-25 value | should push intimidation/flee choices |
| Smuggler scene | story-scaled | story-scaled | story-scaled | story-scaled | more about route identity than grind |

### Design Rule

Street violence should:

- feel sharper and riskier than brawls
- not be the main repeatable training loop
- be where gear and coercion start to matter more

## Beast Danger Matrix

Beasts should be a fear check, not a farming loop.

### Wolf Intent

| Encounter | Intended Read |
|---|---|
| 1 wolf | dangerous challenge |
| 2 wolves | likely death for weak Luke |
| 3 wolves | obvious mistake unless prepared |
| 4 wolves | late-prepared or companion-assisted challenge only |

### Live Wolf State

Current live wolf direction:

- wolves use `slash` damage
- wolves are tuned to be dangerous and fairly accurate
- armor matters more than it used to
- current drops are:
  - `100%` wolf pelt
  - `20%` wolf tooth

### Beast Reward Direction

| Beast Fight | Attack XP | Defence XP | Agility XP | Loot | Notes |
|---|---:|---:|---:|---|---|
| 1 wolf | 20 | 16 | 4 | pelt, tooth, meat | should feel scary but meaningful |
| 2 wolves | 36 | 28 | 6 | more loot, much more risk | not early training content |
| 3-4 wolves | high | high | moderate | big loot | only for prepared players |

### Design Rule

Wolves should:

- give meaningful rewards
- never become the safest way to train combat
- make armor, companions, and preparation feel important

## Combat XP Sources

### Existing Useful XP Sources

Already supported in the code:

- attack XP from dealing damage
- defence XP from taking damage
- agility XP from fleeing
- coercion XP from intimidation dialogue

### Recommended First-Pass XP Philosophy

| Source | Attack XP | Defence XP | Agility XP | Coercion XP |
|---|---:|---:|---:|---:|
| Dealing damage | yes | no | no | no |
| Taking damage | no | yes | no | no |
| Winning brawl | bonus | small | small | no |
| Winning street fight | bonus | bonus | small | no |
| Fleeing successfully | no | no | yes | no |
| Intimidation success in dialogue/event | no | no | no | yes |
| Skipping weak fight through fear | no | no | no | yes |

### Rule

Combat XP should reward:

- actual risk
- survival
- escalation

Not:

- infinite safe grinding

## Combat Action Matrix

### Alpha Required Actions

| Action | Keep/Add | Priority | Notes |
|---|---|---|---|
| Attack | Keep | critical | default action |
| Flee | Keep | critical | important for weak Luke fantasy |
| Reckless Attack | Consider Add | medium | rough, desperate extra option |

### Future But Not Required Yet

| Action | Priority | Notes |
|---|---|---|
| Dirty Trick | later | better than generic defend if combat gets deeper |
| Guard Break | later | if weapon combat expands |
| Quick Jab / Low Kick / etc. | later | if move system appears |

### Important Rule

Do **not** overload the alpha combat UI with too many buttons.

The route should feel rough and readable.

### Live Alpha Action State

Current live combat now includes:

- `Attack`
- `Flee`
- `Brawl` encounter handling
- first intimidation skip branch in Ben's debt scene

## Intimidation Matrix

Intimidation should mostly live outside the direct combat UI.

It should be used in:

- dialogue
- event choices
- pre-combat checks
- ambush resolution

### Intimidation Inputs

| Input | Effect Direction |
|---|---|
| Coercion skill | main success driver |
| Armor / rough gear | increases intimidation |
| Visible knife / weapon | increases intimidation against weak humans |
| High-status clean clothes | may help or hurt depending on target |
| Low presentation / rags | usually weakens intimidation unless target is weaker and already fearful |

### Intimidation Targets

| Target Type | Intimidation Effectiveness |
|---|---|
| Drunk | high |
| Weak debtor | high |
| Cowardly thug | medium-high |
| Hardened thug | medium-low |
| Smuggler group | low |
| Wolf | none |
| Guard | very low unless later power systems exist |

### Intimidation Outcomes

| Outcome | Example |
|---|---|
| Skip fight | ambusher backs down |
| Soft win | weak debtor gives in |
| Better odds | enemy hesitates or becomes weaker in scene design later |
| No effect | hardened enemy does not care |
| Backfire | aggressive escalation if check fails badly |

## Equipment Progression Matrix

Luke needs a clearer early combat gear ladder.

### Existing Combat-Relevant Weapons

| Item | Current Value | Role |
|---|---:|---|
| Crude Knife | 25 | first real human-threat weapon |
| Old Axe | 20 | tool first, rough combat fallback second |
| Iron Sword | 100 | later real combat upgrade |

### Recommended First-Pass Weapon Ladder

| Weapon | Priority | Role |
|---|---|---|
| Fists | baseline | brawls only |
| Crude Knife | critical | early human threat |
| Club / improvised weapon | add later | brawl/street crossover |
| Rusty Blade / better knife | optional | mid alpha or post-demo |

### Existing Armor Ladder

| Item | Defence | Current Role |
|---|---:|---|
| Wolf Leather Helmet | 4 | crafted/earned beast gear |
| Wolf Leather Armor | 9 | meaningful upgrade |
| Wolf Leather Legs | 5 | meaningful upgrade |
| Iron Helmet | 5 | heavy upgrade |
| Iron Chainmail | 10 | late/high protection |
| Iron Leggings | 5 | late/high protection |

### Missing Early Armor Gap

Current gap:

- there is almost nothing between rags and strong crafted/iron armor

Recommended additions:

| Armor Piece | Priority | Intended Defence | Role |
|---|---|---:|---|
| Padded Shirt | high | 1-2 | first survivability bump |
| Leather Vest | high | 2-3 | early human-fight upgrade |
| Patched Leather | medium | 3-4 | rough but real protection |

### Design Rule

Armor should be one of the biggest early combat progression levers in the game.

## Damage Type / Armor Class Matrix

### Live Damage Types

| Type | Current Role |
|---|---|
| Blunt | fists, brawls, much weaker into armor |
| Pierce | knives/daggers, better into armor |
| Slash | wolves and blade-default damage |

### Live Armor Classes

| Armor Class | Current Meaning |
|---|---|
| None | Luke takes full punishment |
| Light | current practical wolf-gear tier |
| Heavy | current practical iron-gear tier |

### Current Rule Of Thumb

| Matchup | Current Direction |
|---|---|
| Blunt vs None | strong |
| Blunt vs Light/Heavy | strongly reduced |
| Pierce vs Armor | reduced less than blunt |
| Slash vs Armor | reduced, but still threatening |

## Agility Progression Matrix

Agility needs more life outside fighting.

### Existing XP Source

| Source | Status |
|---|---|
| Fleeing from combat | already exists |

### Recommended New Agility Sources

| Source | Type | XP Direction | Money? |
|---|---|---:|---|
| Courier job | repeatable work | medium | yes |
| Rooftop traversal / rooftop route | movement activity | medium | no / maybe |
| Messenger errands | repeatable side work | low-medium | yes |
| Chase event success | event reward | medium-high | maybe |

### Design Rule

Agility should feel like:

- a movement stat
- a world stat
- a survival stat

Not just:

- the flee stat

## Story Mode vs Sandbox Combat Emphasis

### Story Mode

Combat should mainly provide:

- brawls
- self-defense
- rough escalation
- select intimidation opportunities
- some dangerous scene support

It should not become:

- the clean best route to pay Finn

### Sandbox / Full Game Direction

Combat should later support:

- repeatable brawls
- arena progression
- dangerous jobs
- hunting
- companion strength growth
- leadership-adjacent power later

### Split Summary

| Mode | Combat Role |
|---|---|
| Story | support pillar, escalation, survival hardening |
| Sandbox / later | true progression lane |

## Recommended First Content Additions

These are the most valuable first combat additions.

### Tier 1

- tavern fighter NPC
- Ben tavern brawl
- Drunk enemy
- Brawler enemy
- early padded/leather armor
- more honest initiative based on agility/dexterity

### Tier 2

- hidden pit / clandestine arena
- betting system for brawls
- Knife Thug enemy
- first agility job such as courier

### Tier 3

- slum ambush intimidation event
- stronger pit ladder
- additional rough street encounters
- small move/technique layer if scope allows

## Technical Notes For Implementation

### Brawl Support

The system now already has:

- a combat encounter flag or type for `brawl`
- special brawl damage behavior
- alternate knockout defeat handling

Still needed later:

- more authored brawl content
- clearer repeatable brawl progression

### Initiative

The current player-priority initiative should be reviewed so that:

- faster enemies can meaningfully act first outside tutorial protection

### Dialogue / Event Escalation

Combat escalation should become more generic and reliable so scenes can cleanly do:

- intimidate
- fail intimidation
- start brawl
- start lethal fight

### Intimidation Inputs

The future system should be able to read:

- coercion level
- presentation/clothing
- visible gear
- maybe enemy type tag

Current live state:

- one intimidation branch exists in Ben's debt scene
- intimidation can already read presentation/intimidation from the social presentation layer

## Success Standard

The combat content matrix is successful for the alpha if:

- brawls become the believable early combat lane
- wolves stay dangerous and respected
- weak human enemies give Luke a manageable progression path
- armor and gear create clear survivability jumps
- agility has at least one non-combat progression path
- intimidation becomes a readable authored mechanic instead of a vague idea
- Story Mode keeps combat grounded while Sandbox/full game can expand it later

## Open Questions

Still to finalize later:

1. whether brawls should use the exact same combat screen or a variant with fists-only rules
2. whether Ben is a one-time brawl or the player's first repeatable tavern opponent
3. whether betting should be fixed stakes, scaled stakes, or event-based
4. whether courier/agility work should be a job, an activity, or both
5. whether the first added armor pieces should be sold, quest-earned, crafted, or mixed

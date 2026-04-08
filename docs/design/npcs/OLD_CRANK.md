# Old Crank — Character & Quest Design

Old Crank is a permanent fixture of the Salty Mug. He drinks, he watches, and he says very little unless given a reason. He is not hostile and not helpful by default — he is simply present, like the smell of the tavern. His value to the player is earned slowly through gifts and honest conversation. He holds two things worth knowing: the gossip that starts the Tidehunter path, and a map he found years ago and never acted on.

---

## Character Overview

Old Crank is old, poor, and content to remain both. He has a rat named Nip that he carries in his coat. He is not sentimental about this — animals are honest company. He has been in Driftwatch long enough to know most of its rot by name.

He does not ask for help and does not offer it. His past is something he only talks about once trust is established, and even then he frames it as a thing that happened to someone younger. The map he gives the player is not charity — it is him deciding he is done carrying it.

---

## Interaction Categories

| Category | Content |
|---|---|
| **Gift** | Buy him a beer → +2 friendship, costs 1 beer, 2× per day limit |
| **Ask** | Gossip chain, rat ask, past ask (all rel-gated) |
| **Friendly** | Smalltalk and honest conversation, dice roll, 2× per day limit |

---

## Gift Interaction

Action: `social_action:npc_old_crank:gift:beer:1`

- Costs 1 beer from inventory
- Always succeeds: flat +2 friendship
- Enforces the standard daily meaningful action limit (2× per day)
- If at limit: item is not consumed, outcome is `fail`

This is the primary early-game friendship builder. The friendly category is available once the player is ready to invest social energy rather than items.

---

## Ask Chain

### Tavern Lore (`crank_ask_mug`)
- Always available
- One-time: sets `crank_lore_mug_seen:true`

### Gossip 1 — Harbor Master (`crank_gossip_1`)
- Gate: `relationship.npc_old_crank.friendship >= 2`
- Harbor master Greaves keeps two sets of books
- Sets `crank_gossip_1_seen:true`

### Gossip 2 — Captain Elias (`crank_gossip_2`)
- Gate: gossip 1 seen + `friendship >= 4`
- Captain Elias drinks on duty every night
- Sets `crank_gossip_2_seen:true`

### Gossip 3 — Finn's Weapons (`crank_gossip_3`)
- Gate: gossip 2 seen + `friendship >= 6` + `whitefang_bound==false`
- Finn is moving weapons crates to the Forge after dark — talk to Cyrus
- Sets `crank_gossip_3_seen:true`, starts `tidehunter_path`, advances stage 1
- **Whitefang variant** (`crank_gossip_3_whitefang`): if bound, Crank deflects — Driftwatch rot won't matter to a man carrying mountain weather

### Rat Ask (`crank_ask_rat`)
- Gate: `friendship >= 10`, `crank_rat_seen==false`
- Reveals Nip's name and how he found her
- Two branches: "She seems fond of you" / "Why keep a rat?" — converge at the same character beat

### Past Ask (`crank_ask_past_1` → `crank_ask_past_4`)
- Gate: `friendship >= 20`, `crank_past_seen==false`
- Four-node chain: dock work denial → the map story → cave details → item handoff
- Accept: `crank_past_seen:true` + grants `crank_treasure_map:1` + starts `crank_treasure_hunt`
- Decline: `crank_past_seen:true`, map stays with Crank, quest not started

---

## Friendly Interactions

Two options, both use the standard social dice system:

**Smalltalk** (`social_action:npc_old_crank:friendly:smalltalk`)
- "How are you holding up out here?"
- Strong: almost smiles — "Still breathing. Still drinking. Practically flourishing."
- Weak: shrug and back to drink
- Fail: "What kind of question is that? Bother someone else."

**Honest** (`social_action:npc_old_crank:friendly:honest`)
- "This place must mean something to you."
- Strong: "Meaning is a strong word. Familiar is close enough when you are old." — nods once
- Weak: "Maybe it does. Do not make something of it."
- Fail: "You do not know what you are talking about. Buy a drink and sit quiet."

Personality: `lonely + greedy`. Responds well to `listen` and `honest` styles. Responds poorly to `compliment` and `smalltalk` unless repeated investment is made.

---

## Quest — Old Crank's Map

**Quest ID:** `crank_treasure_hunt`

### Intent
A self-contained optional quest with no combat, no NPCs, and no narrative consequence. It is a spatial puzzle and a reward for patience with an NPC who does not look worth patience. The player gets a unique weapon and some coin. Old Crank gets to stop carrying something he never used.

### Prerequisites
- `relationship.npc_old_crank.friendship >= 20`
- Complete the past ask chain (4 nodes) and choose to accept the map

### Flow

```
1. Receive crank_treasure_map from Old Crank (past ask, accept branch)
   → quest starts: crank_treasure_hunt
   → crank_past_seen:true

2. View the map (inventory → Read / View Map)
   → Opens full-screen library viewer showing cave diagram
   → Map shows the solution path: forward, forward, left, right, forward

3. Find the cave (Isolated Beach)
   → Three "Search the cliffs" actions appear while quest is active and cave not found
   → Each search costs 20 energy
   → Search 1: nothing obvious, cliff face too long (crank_search_1_done:true)
   → Search 2: scratch marks on the rock, deliberate (crank_search_2_done:true)
   → Search 3: cave found, narrow gap in the cliff base (crank_cave_found:true)
   → Quest advances to stage 1 — "Enter the cave" button unlocks

4. Navigate the cave (Inside the Cave location)
   → Three direction buttons: Go forward / Go left / Go right
   → Correct sequence: forward → forward → left → right → forward
   → Wrong direction: "Wrong way. The path resets." toast, all progress clears
   → Correct step: "You press on..." toast
   → Final correct step: navigate to The X location (crank_cave_chamber)
   → crank_seq_done:true, crank_cave_chamber_reached:true
   → Quest advances to stage 2 — "Dig at the X"

5. Dig the treasure (The X location)
   → Open inventory → select Spade → press "Dig"
   → Spade checks: location is crank_cave_chamber + seq_done + not already dug
   → Triggers 2-slide event: oilcloth bundle → blade and coins
   → Quest completes: grants pirate_scimitar + 120 copper
   → crank_treasure_dug:true
```

### Rewards
- **Pirate's Scimitar** — unique curved blade, attack 16 (equivalent to iron sword), Shenhai script on the fuller
- **120 copper**
- No relationship gain with Old Crank — he already gave you what he had

### The Map Item
- Type: `key_item`, actions: `["Use"]`
- "Use" label renders as "Read" in inventory (bookId system)
- Opens library viewer with a single full-screen image of the map diagram
- Player can refer to it at any time to recall the sequence

---

## Flag Reference

| Flag | Set By | Meaning |
|---|---|---|
| `crank_lore_mug_seen` | `crank_ask_mug` response | Hides tavern lore ask |
| `crank_gossip_1_seen` | `crank_gossip_1` response | Unlocks gossip 2 |
| `crank_gossip_2_seen` | `crank_gossip_2` response | Unlocks gossip 3 |
| `crank_gossip_3_seen` | `crank_gossip_3` response | Hides gossip chain |
| `crank_rat_seen` | `crank_ask_rat` response | Hides rat ask |
| `crank_past_seen` | `crank_ask_past_4` either branch | Hides past ask |
| `crank_search_1_done` | `crank_cave_search_1` event | Unlocks search 2 |
| `crank_search_2_done` | `crank_cave_search_2` event | Unlocks search 3 |
| `crank_cave_found` | `crank_cave_search_3` event | Unlocks cave entrance |
| `crank_seq_s1–s5` | Sequence handler per correct step | Tracks navigation progress |
| `crank_seq_done` | Final correct step | Navigates to chamber, shows dig location |
| `crank_cave_chamber_reached` | Final correct step | Quest stage 2 gate |
| `crank_treasure_dug` | Spade use in cave chamber | Prevents re-dig |

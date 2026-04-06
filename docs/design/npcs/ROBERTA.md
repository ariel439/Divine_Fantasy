# Roberta — Character & Quest Design

Roberta runs Tide & Trade, a general goods shop in Driftwatch. She is one of the few characters Luke knew before the game begins (`intro_spoke_roberta`). Her arc is built around earned trust: she is guarded by default, opens slowly through relationship progression, and rewards genuine investment with two quests and an optional romance path.

---

## Character Overview

Roberta inherited Tide & Trade eight months before the game starts. Her father ran it before her; he left debts and deferred maintenance alongside it. She keeps her situation tightly controlled — she will not let the street see weakness. Most of her dialogue is dry and short until trust is established.

She is not hostile. She is efficient. The distinction matters for how she should be written.

---

## First Meeting

Two possible entry nodes depending on game state:

| Condition | Node | Tone |
|---|---|---|
| `intro_spoke_roberta==true` AND `roberta_first_meet_done==false` | `rb_intro_reunion` | Reunion — she recognises Luke, slightly warmer |
| Default | `rb_first_meet` | Stranger meeting, professional |

Both converge to `rb_repeat_meet` after the first exchange. `roberta_first_meet_done` is set true on any first-meet branch.

---

## Relationship Ladder

All relationship-gated content requires prior steps in sequence. Nothing unlocks out of order.

| Threshold | Gate Flag | Unlocks |
|---|---|---|
| rel < 20 | — | Quest offer blocked (`rb_trust_refusal`) |
| rel ≥ 20 | — | Quest 1 offer available (`rb_wall`) |
| rel ≥ 30 + Quest 1 complete | `roberta_asked_manage_alone==false` | Ask node: `rb_ask_managing_alone` |
| rel ≥ 40 + manage_alone asked | `roberta_asked_shop_future==false` | Ask node: `rb_ask_shop_future` |
| rel ≥ 50 + shop_future asked + Quest 1 complete + carpentry ≥ 10 | `roberta_asked_shop_future==true` | Quest 2 offer (`rb_second_quest_offer`) |
| Quest 2 complete (romance choice) | — | `roberta_romance_unlocked`, `roberta_romance_open`, `roberta_kiss_event` |

Building to Quest 2 requires meaningful investment across multiple visits. There is no shortcut through.

---

## Quest 1 — Planks for the Past

**Quest ID:** `roberta_planks_for_the_past`

### Intent
A low-stakes entry quest that establishes Roberta as someone who gives Luke real work rather than errands. The wall repair is physical and specific — it is not a fetch quest dressed up as character content.

### Flow

```
Ask about wall (rb_ask_root / rb_wall)
  → rel < 20: rb_trust_refusal — blocked
  → rel ≥ 20: rb_help_gate — quest offer

rb_help_gate
  → "I'll find them" → start_quest, stage 1
  → "I already have them" (inventory.wooden_plank ≥ 10) → skip to stage 2

Stage 1: Gather 10 wooden_plank
Stage 2: Return → rb_give_materials → receive iron_nails (20) + hammer (1), advance to stage 3
Stage 3: Use planks + nails + hammer at Tide & Trade east wall → advance to stage 4
Stage 4: Return → "I repaired the wall." → complete_quest:roberta_planks_for_the_past → rb_quest_complete
```

### Rewards
- 150 currency (via quest system on `complete_quest`)
- 300 XP (carpentry)
- +10 relationship with Roberta

### Notes
- `rb_ask_root` shows `"How is the wall repair going?"` during stage 1 only if planks < 10. Once you have the planks the ask root question disappears and `rb_quest_root` shows `"I have the planks."` instead.
- If the player already has 10 planks when first asking about the wall, they skip stage 1 entirely.

---

## Quest 2 — Set the Shop Right

**Quest ID:** `roberta_set_the_shop_right`

### Intent
A crafting investment quest that pays off emotionally rather than financially. The player is helping Roberta make the shop feel like hers — the reward is the romance unlock (or a clean friendship close), not coin. The zero-gold reward is intentional.

### Gate Requirements (all must be true)
- `quest.roberta_planks_for_the_past.completed==true`
- `relationship.npc_roberta >= 50`
- `world_flags.roberta_asked_manage_alone==true`
- `world_flags.roberta_asked_shop_future==true`
- `quest.roberta_set_the_shop_right.active==false`
- Carpentry skill ≥ 10 (fail node: `rb_second_quest_skill_gate`)

### Flow

```
rb_second_quest_offer (ask root, all gates met)
  → Accept → start_quest:roberta_set_the_shop_right, stage 1
  → Decline → back to ask root

Three non-linear crafting tasks (nonLinear: true):
  Stage 1: Refit the front counter    → flag: roberta_upgrade_counter_done
  Stage 2: Build better displays      → flag: roberta_upgrade_displays_done
  Stage 3: Set the storefront right   → flag: roberta_upgrade_storefront_done

All three complete → flag: roberta_shop_upgrades_complete

#### Crafting Material Requirements

| Upgrade | Planks | Nails | Rope | Cloth | Carpentry | Time | Energy |
|---|---|---|---|---|---|---|---|
| Refit Counter | 6 | 12 | — | 2 | ≥ 10 | 45 min | 10 |
| Build Displays | 4 | 8 | 2 | 1 | ≥ 10 | 35 min | 8 |
| Set Storefront | 6 | 16 | 2 | 2 | ≥ 10 | 55 min | 12 |
| **Total** | **16** | **36** | **4** | **5** | — | **135 min** | **30** |

Note: The game gives `iron_nails (20)` in Quest 1. You will need to buy or find an additional 16 nails before starting Quest 2 crafts.

Return → "Tide & Trade is set right." → rb_second_quest_complete
```

### Quest Complete — Two Endings

| Choice | Action |
|---|---|
| `"I wanted to see you look at this place and feel happy again."` | `complete_quest` + `roberta_romance_unlocked:true` + `roberta_romance_open:true` + `trigger_event:roberta_kiss_event` |
| `"You deserved a place worth keeping."` | `complete_quest` + `update_relationship:+10:friendship` + back to social root |

The romance ending fires `roberta_kiss_event` which handles the scene and dialogue transition. The friendship ending closes cleanly.

### Rewards
- 200 XP (carpentry) — applied in dialogue action
- Relationship increase (via dialogue action, not quest system)
- Quest system rewards are empty by design — the emotional payoff is the reward

---

## Lore Ask Chain

Two gated ask nodes unlock as the relationship deepens. These are not quest steps — they are character reveals that build toward Quest 2.

**`rb_ask_managing_alone`** (rel ≥ 30, Quest 1 complete)
> "Badly, some weeks. Properly, if anyone asks."
Three response branches (empathy / admire / intimate) with varying relationship effects.

**`rb_ask_shop_future`** (rel ≥ 40, `roberta_asked_manage_alone==true`)
> "I do not need it grand. I just want it solid."
Three response branches. The intimate response (`"You do not just want it standing. You want to be proud of it."`) gives both friendship and love relationship points.

---

## Flag Reference

| Flag | Set By | Meaning |
|---|---|---|
| `roberta_first_meet_done` | First meet node (any branch) | Prevents re-triggering first meet |
| `roberta_lore_seen` | `rb_lore_tide_trade2` response | Hides lore ask after first read |
| `roberta_asked_manage_alone` | `rb_ask_managing_alone` response | Gate for shop future ask |
| `roberta_asked_shop_future` | `rb_ask_shop_future` response | Gate for Quest 2 offer |
| `roberta_upgrade_counter_done` | Crafting action | Quest 2 stage 1 |
| `roberta_upgrade_displays_done` | Crafting action | Quest 2 stage 2 |
| `roberta_upgrade_storefront_done` | Crafting action | Quest 2 stage 3 |
| `roberta_shop_upgrades_complete` | All three upgrades done | Triggers Quest 2 completion option |
| `roberta_romance_unlocked` | Quest 2 romance ending | Unlocks flirt interaction root |
| `roberta_romance_open` | Quest 2 romance ending | Used to gate ongoing romance content |

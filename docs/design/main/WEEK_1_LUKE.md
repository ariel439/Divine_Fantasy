# Luke's First Week — System Design

This document describes the pressure system that drives the first chapter of Divine Fantasy. Finn's debt deadline is the engine. The three main paths are the destinations. White Fang is the hidden fourth option that overrides everything.

---

## The Premise

Luke owes Finn 30 silvers. Finn gives him 7 days to collect it from three debtors: Ben, Beryl, and Elara. What Luke does during those 7 days determines which ending branch resolves the week.

The week is not really about Finn. It is about what kind of person Luke is willing to become under pressure.

---

## The Four Outcomes

### 1. Thieves Guild Path
**How:** Collect from all three debtors without using any of the moral shortcuts. Deliver 30 silvers to Finn cleanly.

Finn is impressed. He gives Luke Vanessa's Charm and introduces him to the guild.

- Flag set: `finn_thieves_guild_complete`
- Finn: alive, becomes a contact
- Week closed: yes (`applyPostEndingWeekRecovery`)
- White Fang: locked out after this

**What the moral shortcuts are:**
- Ben: help him cheat at cards → sets `ben_cheat_done`
- Elara: run a drug delivery for her → sets `elara_helped_drug`
- Beryl: help her procure clients → sets `beryl_helped_pimp`

Using any one of these shifts Finn's dialogue to the weakness reveal path. He won't offer the guild contact. Using all three triggers a confrontation combat instead.

---

### 2. Tidehunter Path
**How:** Get Old Crank drunk (three beers). He points to Cyrus. Get the prototype blade from Cyrus. Find the marked crate note at the docks at night. Bring both to Matthias or Stan. Go to Rodrick at the Tidehunter Barracks. Trigger the raid.

Finn and his operation are destroyed. Luke walks out with the Tidehunters.

- Quest: `tidehunter_path` (stages 0–5)
- Flag set: `finn_tidehunter_branch_complete`
- Finn: dead (`finn_dead`, `finn_resolved`)
- Debt quest: failed
- Week closed: yes
- White Fang: locked out if `whitefang_bound` was set before this (Old Crank won't cooperate)

**Gate:** Every step of this path checks `whitefang_bound==false`. Binding White Fang closes this path completely.

---

### 3. Neutral Buyout
**How:** Have 30 silvers and go to Finn before the deadline. The dialogue option only appears if not all three debts have been collected through his job.

Finn accepts the money. He's indifferent. No faction, no ceremony.

- Flag set: `finn_hybrid_branch_complete`
- Finn: alive, neutral
- Debt quest: completed
- Week closed: **no** — time continues, White Fang window stays open
- This is the sandbox path. No ending slide. The player just continues.

---

### 4. White Fang Path
**How:** Find Shihan (requires basic Shenhaic). Read the book. Follow the three vision locations (woods → beach → mountain). Tell Shihan about the cave. Breach it with her retainers. Defeat Ren Zhen's shadow. Choose to bind the blade.

Luke leaves Driftwatch with Shihan. Finn's debt becomes irrelevant.

- Flag set: `whitefang_bound` (or `whitefang_resisted` if refused)
- Finn: alive but the week is over (debt quest failed on week close)
- Week closed: yes
- This path **blocks** the Tidehunter path — binding closes Old Crank's gossip node and all investigation dialogue

This is the canonical path. It is intentionally hard to find. It requires knowing Shenhaic, reading carefully, and actively exploring three locations in sequence.

---

## The 7-Day Timeout

**Start:** When Luke accepts Finn's job (`start_debt_collection` action), the deadline is stored as `finn_debt_deadline_day = current_day + 7`.

**Readiness check:** `GameManagerService.updateFinnTimeoutReadiness()` runs on each day change. If the current day exceeds the deadline and no path has resolved, it sets `finn_timeout_ready = true`.

**Trigger:** `GameManagerService.tryTriggerFinnTimeout()` runs on location change. If `finn_timeout_ready` is true and the player is inside Driftwatch proper, Finn's crew appears and combat starts.

**Blocked by any of:**
- `finn_debt_collection_active == false` (already resolved)
- `finn_dead == true`
- `finn_tidehunter_branch_complete == true`
- `finn_whitefang_branch_complete == true`
- `finn_timeout_triggered == true`
- Player currently in combat or event

**Outside Driftwatch:** The timeout never fires outside the location whitelist. Staying in the woods, the beach, or the mountain paths keeps Luke safe from the timer.

**Timeout combat outcome:**
- If `whitefang_bound == true`: victory triggers `whitefang_finn_end` — White Fang kills Finn
- Otherwise: victory triggers `finn_personal_kill_end` — Luke wins alone, sets `finn_hybrid_branch_complete`
- Defeat: game over

---

## Path Exclusivity

| If you do this | This becomes unavailable |
|---|---|
| Bind White Fang | Tidehunter path (Old Crank won't cooperate, all investigation nodes gated) |
| Complete Tidehunter raid | Thieves Guild path (Finn is dead) |
| Complete Thieves Guild path | Tidehunter path (week is closed, Finn resolved) |
| Any path that closes the week | White Fang (if not already started before week close) |

You cannot complete all three. You can complete none by paying the debt and ignoring factions, but that ends the week without a major resolution.

---

## Debt Collection — Moral Structure

Each debtor has a clean path and a dirty path:

| Debtor | Clean | Dirty | Dirty flag |
|---|---|---|---|
| Ben | Confront him directly | Help him cheat at cards | `ben_cheat_done` |
| Elara | Negotiate | Run a drug delivery | `elara_helped_drug` |
| Beryl | Negotiate | Help procure clients | `beryl_helped_pimp` |

Finn tracks these. He respects professional cruelty. He does not respect sloppy compromise:

- **0 dirty flags:** Loyalist — Vanessa's Charm offered
- **1–2 dirty flags:** Dismissed — Finn considers Luke weak, no guild offer
- **3 dirty flags:** Confrontation — Finn decides Luke is a liability, attacks

---

## Week Passage

Paths that end the version call `applyPostEndingWeekRecovery()`:
- Advances time by 7 days
- Restores HP, energy, hunger, social energy to full
- Sets `whitefang_week_closed = true` (locks White Fang if not completed)
- Fails `white_fang_route` quest if active and incomplete

Paths that do **not** call this (neutral buyout):
- Time continues normally
- White Fang window remains open
- Player continues in sandbox

---

## Key Flags Reference

| Flag | Meaning |
|---|---|
| `finn_debt_collection_active` | Deadline is running |
| `finn_timeout_ready` | Day limit exceeded |
| `finn_timeout_triggered` | Timeout combat launched |
| `finn_dead` | Finn is dead by any cause |
| `finn_resolved` | Finn questline is over |
| `finn_thieves_guild_complete` | Thieves Guild ending reached |
| `finn_tidehunter_branch_complete` | Tidehunter raid ending reached |
| `finn_hybrid_branch_complete` | Neutral/timeout ending reached |
| `finn_whitefang_branch_complete` | White Fang killed Finn |
| `whitefang_week_closed` | Week ended, White Fang path locked |
| `ben_cheat_done` | Luke helped Ben cheat |
| `elara_helped_drug` | Luke ran Elara's delivery |
| `beryl_helped_pimp` | Luke helped Beryl's scheme |
| `debt_paid_by_ben/beryl/elara` | Individual debt collected |

# Divine Fantasy – Finn Debt & Guard Route (Classic Demo Review) ⚖️

This doc is a high-level design review of the **Finn debt collection quest** and the so-called **“rebel_path”** (Guard raid). It’s focused on the **Classic Demo**, where this quest line is effectively the *end of the game*.

---

## 1. Endings Overview 🎬

These are the demo-relevant outcomes once Finn’s quest/raid line resolves:

- 😈 **Evil / Loyalist**  
  - No favors: you collect all three debts the “professional” way.  
  - Finn approves, grants **Vanessa’s Charm**.  
  - Charm opens the sewer door → **evil_path_end** slides → main menu.

- 🕊️ **Pure Helper**  
  - You help Ben cheat, run Elara’s “medicine”, and do Beryl’s discreet delivery.  
  - Finn calls you weak and tries to have you killed (betrayal combat).  
  - Intended defeat → Game Over screen → main menu.

- ⚖️ **Hybrid**  
  - Mixed behavior: some favors, some hard-line collection.  
  - Finn points out your contradictions but lets you walk.  
  - **finn_hybrid_end** epilogue slides → main menu.

- 🛡️ **Guard / Raid Route** (misnamed `rebel_path`)  
  - Old Crank → Cyrus → Matthias → Rodrick → authorize a raid on the Salty Mug.  
  - Raid combat (Finn + thugs) → **raidVictorySlides** → main menu.

- ⏰ **Timeout** (currently under-enforced)  
  - Concept: miss the 7-day deadline → Finn’s timeout event → Game Over.  
  - Reality in demo: timer is only partially hooked (see critical issues).

For the **Classic Demo**, all meaningful endings come from these branches. Long-term continuation happens *after* this version.

---

## 2. Core Flows �

### 2.1 Finn Debt Collection (Main Quest)

- **Setup**
  - Start in Finn’s rented room at the Salty Mug.  
  - Finn: “Pay up or work it off.”  
  - Quest: collect **10 silvers each** from **Ben, Beryl, Elara** in **7 days**.

- **Ben (Farmer)**
  - Hard stance: demand 10 silvers → he can’t pay.  
  - Help path: Ben proposes cheating at the Salty Mug.  
  - Night event: you help him cheat → `ben_cheat_done = true` → he pays the debt via `collect_debt_from:npc_ben`.

- **Elara (Herbalist)**
  - Soft/help path: deliver a “medicine” parcel to the sewers.  
    - You run drugs; `elara_helped_drug = true` → then collect the debt.  
  - Hard/blackmail path: buy a secret from **Shaky Jace** (`elara_secret_known = true`).  
    - You confront her: “I know about your business.” → blackmail → `elara_blackmailed = true` → collect with relationship hit.

- **Beryl (Shopkeeper)**
  - Soft/help path: discreet package delivery to a noble client.  
    - `beryl_helped_pimp = true` → then you collect the debt.  
  - Hard/blackmail path:  
    - Catch an urchin leaving Beryl’s shop at night.  
    - Intimidate/bribe/beat the kid to get the adultery letter.  
    - Blackmail Beryl using the letter → pay (and optionally extra 50c) with relationship penalties.

- **Return to Finn**
  - Finn checks: who paid, who you helped, what methods you used.  
  - Single “Here is the 30 silvers.” button appears under multiple **AND-only** conditions to cover all valid combinations.  
  - Based on flags, you fall into **evil**, **pure helper**, or **hybrid** endings.

### 2.2 Guard Route (“rebel_path”) 🛡️

- **Old Crank (Salty Mug)**
  - Buy him **three beers** one by one.  
  - On the third, he drops gossip about Finn’s smuggling and starts/advances `rebel_path`.

- **Cyrus (Shadow Blade contact)**
  - At the right quest stage, he gives you a **Shadow Blade prototype** (`prototype_blade`).  
  - This proves Finn is moving contraband steel.

- **Matthias (Guard Captain)**
  - You show him the blade.  
  - He recognizes contraband, advances `rebel_path`, and tells you to see Rodrick.  
  - Consumes `prototype_blade`.

- **Sergeant Rodrick**
  - If `rebel_path` is at the correct stage, he agrees to storm the Salty Mug.  
  - Triggers **raid_salty_mug_intro** slides → starts raid combat (Finn + 3 thugs).

- **Raid Combat & Aftermath**
  - Winning the raid with Finn present triggers **raidVictorySlides**.  
  - Game returns to main menu; `rebel_path` is conceptually “done” for the demo (but not marked complete in data yet).

---

## 3. Critical Issues 🧨

### 3.1 Active Flag Not Cleared 🔁

- `finn_debt_collection_active` is set when the quest starts.  
- Several completion branches use `remove_money|complete_quest` without clearing this flag.  
- Risk: deadline logic could still consider the quest active after it’s “finished”.

### 3.2 Weak Deadline Enforcement ⏳

- The 7-day timeout is only checked in the **dialogue `pass_time` action**.  
- Direct time changes (sleep/wait UI) bypass this check.  
- Players can stall past the deadline without ever seeing the timeout Game Over.

### 3.3 Rewards Not Branch-Aware 🎁

- `finn_debt_collection` rewards are fixed:
  - +Finn relationship
  - Currency + XP
- These are granted even when:
  - You help all three debtors and Finn **betrays** you.  
  - You play a hybrid route that Finn explicitly **disapproves** of.  
- Narrative and mechanical outcomes are misaligned.

### 3.4 Dead Flag: `beryl_debt_forgiven` 🧪

- Mentioned in:
  - Finn’s old “I forgave Beryl” branch.  
  - Journal screen (Beryl’s stage can be marked as failed).  
  - Generic turn-in helper logic (treats forgiveness as “collected”).
- Nowhere in Beryl’s current dialogue is this flag actually set.  
- Result: unreachable branch + misleading journal logic.

### 3.5 `rebel_path` Never Completed / Rewarded 🏁

- Raid victory returns to main menu without:
  - `complete_quest:rebel_path`  
  - Granting quest-defined rewards (Matthias relationship, XP, currency).
- For the demo it “works”, but data-wise the quest remains unresolved.

### 3.6 Dead “rebel_victory” Branch 🧵

- There is an alternate `rebelVictorySlides` path wired to a generic `combatVictory` case.  
- Current raid logic bypasses it, routing directly to `raidVictorySlides`.  
- If `rebel_victory` ever fires, it’s not handled in the event onComplete switch.  
- This is essentially leftover scaffolding.

### 3.7 Hybrid Still Grants Finn’s Generic Rewards ⚖️

- Hybrid narrative: Finn doesn’t see you as a reliable soldier.  
- Mechanics: same positive Finn quest completion as if you were loyal.  
- Again, narrative and systems don’t agree.

---

## 4. Naming & Theme 🎭

- `rebel_path` is a misnomer:
  - You’re cooperating with the **Guard/Tidehunters** (Matthias, Rodrick), not rebelling against them.  
  - From Finn’s POV you’re a traitor; from the player’s POV, it feels like a Guard route.
- Future clean-up:
  - Internally rename to something like `guard_path`, `tidehunter_path`, or `salty_mug_raid`.  
  - Keep quest title “The Rot in the Mug” (it fits the content).

---

## 5. Missing / Incomplete Consequences 🧩

- 🪦 **No “Finn is dead” persistence**
  - After the raid, there’s no `finn_dead` or similar world flag.  
  - For the demo it’s fine (you hit main menu), but full-game continuity will need a permanent state.

- 🚪 **Hybrid has no long-term mark**
  - Finn lets you walk, but nothing marks that he considers you unreliable/problematic.  
  - Future arcs could use a `finn_mistrusts_player` flag.

- 🔀 **Paths don’t lock each other**
  - It’s possible (in principle) to push Finn’s debt quest and the Guard raid in parallel.  
  - In a full game, major commits (e.g. getting Vanessa’s Charm vs participating in the raid) should close off the opposite route.

---

## 6. Demo Scope & 7-Day Timer ⏰

For the **Classic Demo**, Finn’s debt quest is **the end of the game**:

- Reaching any major branch (evil, pure helper, hybrid, raid) plays an ending slide sequence and returns to the main menu.  
- Long-term “life after this choice” is planned for **post-demo** versions only.

### 6.1 Design Options for the Timer

1) **Hard Timer (Lore + Actual Fail State)**  
   - Enforce the 7-day limit strictly.  
   - Players who stall hit Finn’s timeout Game Over.  
   - Tension is high but can brick demo runs before players see endings.

2) **Soft/Disabled Timer for Demo (Recommended)**  
   - Treat “7 days” as **flavor text** in the Classic Demo.  
   - Avoid actually triggering the timeout (or set the internal deadline far away).  
   - Players can explore Driftwatch and test different branches without being punished by a clock.

3) **Hybrid (Full Game vs Demo)**  
   - Full game:
     - Centralized day-advance system checks for expired quests.  
     - Finn’s timeout becomes a proper Game Over route with its own slides.  
   - Classic Demo:
     - Timer exists in data but is effectively non-firing.

**Demo Choice:** use **Option 2** so the loop is:
- Explore → decide how to handle debts → hit one of the endings → credits.

---

## 7. Dialogue Suggestions 🗣️

Narrative-only rewrites to sharpen tone and fix awkward lines. Mechanics/flags stay identical.

### 7.1 Finn (Turn-In & Mockery)

- Current examples:  
  - "Oh, you helped Ben stealing."  
  - "Oh, you was a drug mule for the woman."  
  - "You were a pimp for Beryl."

- Suggested flavor:  
  - **Ben**  
    - "Ben didn’t pay you—he paid the table. Clever, in a coward’s way."  
  - **Elara**  
    - "Medicine to the sewers, was it? Call it ‘charity’ if it helps you sleep."  
  - **Beryl**  
    - "Running packages for Beryl’s clients. Coin on the counter, filth under the table."

- Current rule:  
  - "no violence. We're professionals, not thugs."
- Suggested nuance:  
  - "No bodies, no public scenes. We collect debts, we don’t leave corpses on the cobbles."

### 7.2 Ben (Farm & Cheat Plan)

- Current key line:  
  - "Finn? Look, I barely have copper for seeds, let alone silver for rent. I can't pay... wait. I have a plan. The tables at the Salty Mug are busy tonight. I know a way to win, but I need a partner. Help me cheat, and I'll have the silver."

- Suggested punch-up:  
  - "Finn? I’m barely keeping the fields alive, never mind paying him. But… there’s a way. The tables at the Mug are hot tonight. I’ve got a trick, but I need eyes. Help me cheat, and I’ll have his silver by dawn."

### 7.3 Elara (Debt Confrontation & Anger)

- Current:  
  - "Ten silvers? I'm just a simple herbalist. Perhaps we can work something out?"  
  - "Get out of my hovel you piece of garbage!"

- Suggested:  
  - "Ten silvers? I brew salves, not gold. There might be… another way to settle this."  
  - "You’ve made your point. Get out of my hovel before I give you a real reason to send the Guard."

### 7.4 Beryl (Debt Options & Blackmail)

- Current confrontation options (simplified):  
  - "Finn sent me. Pay 10 silvers."  
  - "Just pay up or else."

- Suggested:  
  - "Finn wants his ten silvers. Today."  
  - "You pay now, or the next talk we have won’t be this polite."

- Current blackmail:  
  - "A letter about you and a certain noble woman..."

- Suggested:  
  - "A love letter. Your handwriting. A married noble. You see the problem."

### 7.5 Urchin (Letter Pickup)

- Current:  
  - "I... I was just... checking the locks! Yeah! Checking the locks for Mr. Beryl!"  
  - "Okay, okay! I took some food! Don't tell the guards! Please!"

- Suggested:  
  - "I was just… making sure the door worked! For Mr. Beryl!"  
  - "Fine! I nicked some bread. Don’t shout, alright? I’ll go. Just… don’t call the Guard."

---

## 8. Future-Facing Hooks 🚀

For after the Classic Demo, the current structure already supports:

- Distinct long-term paths:
  - 😈 Shadow Hand / Finn loyalist (Vanessa’s Charm route).  
  - 🛡️ Guard/Tidehunter-aligned path (raid route).  
  - 🕊️ Good neighbor / helper (if you survive or avoid the betrayal).  
  - ⚖️ Hybrid “survivor” who refuses to pick a side.

- State flags that could matter later:
  - `finn_dead`, `joined_shadow_hand`, `finn_mistrusts_player`, `ben_cheat_done`, `elara_helped_drug`, `beryl_helped_pimp`, etc.

The main work later is to:
- Clean up dead flags (`beryl_debt_forgiven`, `rebel_victory`).  
- Make quest completion/rewards branch-aware.  
- Tie world state changes to these endings for a full campaign.

---

## 9. Reference Map 🔗

- **Quests**  
  - [quests.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/quests.json)  
  - [DialogueService.ts](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/services/DialogueService.ts)

- **Events / Slides**  
  - [events.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/events.json)  
  - [events.ts](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/events.ts)  
  - [Game.tsx](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/components/Game.tsx)

- **Finn Debt Cast**  
  - Finn: [finn.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/dialogues/driftwatch/finn.json)  
  - Ben: [ben.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/dialogues/driftwatch/ben.json)  
  - Elara: [elara.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/dialogues/driftwatch/elara.json)  
  - Shaky Jace: [shaky_jace.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/dialogues/driftwatch/shaky_jace.json)  
  - Beryl: [beryl.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/dialogues/driftwatch/beryl.json)  
  - Urchin: [urchin.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/dialogues/driftwatch/urchin.json)

- **Guard Route Cast**  
  - Old Crank: [old_crank.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/dialogues/driftwatch/old_crank.json)  
  - Cyrus: [cyrus.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/dialogues/driftwatch/cyrus.json)  
  - Matthias: [matthias.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/dialogues/driftwatch/matthias.json)  
  - Rodrick: [rodrick.json](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/data/dialogues/driftwatch/rodrick.json)  
  - Combat: [CombatManager.tsx](file:///c:/Users/dolza/OneDrive/Documentos/Divine_Fantasy/src/components/CombatManager.tsx)

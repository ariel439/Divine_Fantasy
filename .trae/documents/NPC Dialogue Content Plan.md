NPC Dialogue Content Plan

## Goals
- Establish first-pass content and structure for NPC dialogues.
- Gate Roberta’s repair quest on relationship ≥ 20 (or via Leo intro).
- Add unique, one-time lore/setting dialogues for key NPCs.
- Move shop “trade” and inn “rent” interactions into the dialogue flow (not separate location buttons).
- Prepare hooks for debt, jobs, and unlockable services (e.g., sawmill).

## Global Policies
- First-time greeting: “Hello. I’m {Name}. {initial line}” on first conversation per NPC.
- One-time dialogues: use `set_flag` to mark viewed and hide on subsequent talks.
- Gating: use `condition` on choices to enforce prerequisites (quest state, flags, relationship).

## Roberta (Tide & Trade)
- States
  - Wall broken (quest not started or completed):
    - Player can ask “What happened?” → Roberta explains hole in wall.
    - Offer help → only starts quest if `relationship(npc_roberta) ≥ 20`.
    - If relationship < 20 → show rejection line (“I appreciate it, but… maybe get to know me first.”).
  - Quest active: check-in dialogue, hints (“How to get planks”), completion and reward.
  - Quest completed: warm thank-you line; unlocks extra small talk.
- One-time lore dialogues
  - “What is Tide & Trade?” → History: one of the oldest venues in Driftwatch; her father died recently; she’s learning to handle things.
  - Mark with `set_flag:roberta_tide_trade_history_seen:true` and hide after seen.
- Relationship gating
  - Quest start requires ≥ 20 relationship. Leo intro option immediately sets this and adds Roberta to Diary.
  - Later we’ll add ways to build relationship (shopping, favor tasks, gifts).
- Flags and conditions
  - `world_flags.intro_spoke_roberta:true` (from intro path).
  - `quest.roberta_planks_for_the_past.*` for state.
  - `relationship.npc_roberta >= 20` for quest offer acceptance (needs relationship condition support).

## Crawler (Sawmill)
- Unlock flow
  - Unique dialogue: “Can I use your sawmill?” → “You can: 2 copper per plank.”
  - After this line, unlock conversion UI in sawmill: `set_flag:sawmill_unlocked:true`.
- Service
  - Conversion: Logs → Planks at cost 2 copper each.
  - Action placeholder: `convert_logs_to_planks:<count>` (implementation to be added).
- Conditions
  - Conversion option visible only if `world_flags.sawmill_unlocked:true`.

## Finn (Salty Mug)
- Move trade and room rent inside dialogue
  - Dialogue entries for “Buy” and “Rent a room”.
- Debt system (Luke-only for now)
  - Luke starts with a debt to Finn.
  - Rent is locked until debt paid: gate on `world_flags.finn_debt_paid:true`.
  - Dialogue actions:
    - `offer_debt_payment` → shows payment choices.
    - `pay_debt:<amount>` → reduces debt; once 0, set `finn_debt_paid:true`.
    - `rent_room` → opens sleep/rent UI only if debt paid.
- Extortion job (later)
  - Finn offers a “job” to cover costs: collect tools from Roberta, Ben, Boric.
  - Future quest: stages to visit each NPC; reward reduces or clears debt.

## Beryl (General Goods) and Shopkeepers
- Move “Trade” into Beryl’s dialogue:
  - Option “Show me your goods.” → `open_shop:beryls_general_goods`.
- Future quest tie-ins
  - Beryl has a future quest; placeholder lines for now.
- Conditions
  - Trade option always visible; lore options one-time via flags.

## Adalia (Grand Library)
- Simple Q/A about library and books:
  - “What kinds of books do you have?” → brief info.
- Later content: more books and reading mechanics.

## Elias (Captain, Docks)
- Placeholder
  - Future content: sailing, passage, sea stories.

## Lighthouse (Old Leo, Sarah, Kyle)
- Robert removal from lighthouse
  - Robert is 1 year older; now in Hawk’s Nest city (later content).
- Sarah and Kyle
  - Keep as placeholders for now; simple greetings.
- Old Leo
  - Expanded lore: history of the lighthouse; “Sons and Daughters of the Moon”.
  - One-time info lines with flags (e.g., `leo_lighthouse_history_seen`).

## Moon Creed Lore
- Year of the Frozen Moon (30 AW)
  - An unnatural and relentless winter struck The Whispers, centering on Nightfall.
  - Crisis: extreme cold, crop failure, starvation; burials halted; stone cracked; faith waned.
  - Elias, a priest, emerged as a beacon—finding hidden food, healing the sick, walking barefoot in the freeze.
  - Outcome: Nightfall survived; Moon’s Creed became dominant; belief in the Moon’s "Children"—guides in darkest hours. Elias’s fate is legend (humble death vs. ascension).
- Leo, the Wildfire’s Shield (569 AW)
  - In Driftwatch, a devastating fire engulfed a third of the city.
  - Leo, orphanage caretaker, saved sixteen children through smoke and flame; his final act pushed the last child to safety as the roof collapsed.
  - Honored as a “Son of the Moon,” a guardian whose legacy lives on in the lives he saved.
  - The orphanage was rebuilt, named in Leo’s honor. Each year, Driftwatch lights lanterns along its walls—“Leo’s Light”—a memorial and symbolic protection.
  - The children he saved became respected members of the community, carrying forward courage and compassion.

## Interact System (v1)
- Scope
  - v1: only Roberta is interactable.
  - Later: selectively enable on NPCs via flags and thresholds.
- Access & Flagging
  - Interact button appears only if NPC is flagged interactable (e.g., `world_flags.interactable_npc_roberta:true`).
- Categories
  - Friendly (talk, compliment, apologize, small gift [later])
  - Flirty (flirt, tease) — available only for NPCs that allow it and after thresholds
  - Intimidating (stand firm, threaten) — risk of relationship loss
- Gating & Mechanics
  - Relationship deltas applied per action; once-per-interval (cooldown) or one-time via flags.
  - Skill checks: persuasion and coercion influence success magnitude and failure penalties.
  - NPC-specific thresholds (e.g., minimum relationship for flirty on Roberta).
  - Optional future modifier: appearance score from clothing boosts checks.
- Implementation Hooks
  - Conditions: extend parser to support `relationship.<npc_id> >= <value>`, `skill.persuasion >= X`, `skill.coercion >= X`, and `appearance >= X`.
  - Actions: `update_relationship:<npc_id>:<delta>`, `set_flag:<flag>:<true|false>`, `cooldown:<flag>:<hours>` (store-driven enforcement).
  - UI: Interact menu lists categories → actions; disabled options show reason (e.g., "needs higher relationship").
- v1 Roberta Details
  - Interact (Friendly): talk/compliment → small positive relationship (once per day; cooldown flag).
  - Interact (Flirty): locked behind threshold (relationship ≥ threshold and basic persuasion); if allowed, small positive; failure gives mild negative.
  - Interact (Intimidating): generally discouraged; causes negative relationship unless specific story beats.


## Implementation Hooks
- Dialogue JSON
  - Add `condition` entries using:
    - `quest.<id>.active/completed/stage`
    - `world_flags.<flag>`
    - `relationship.<npc_id> >= <value>` (new)
  - Use `set_flag:<flag>:<true|false>` to mark one-time dialogues as seen.
  - Use domain actions:
    - `open_shop:<shop_id>`
    - `rent_room`
    - `offer_debt_payment`, `pay_debt:<amount>`
    - `convert_logs_to_planks:<count>`
    - Existing actions like `start_quest`, `advance_quest_stage`, `complete_quest`.
- Condition engine
  - Extend `checkCondition` to parse `relationship.<npc_id> >= <value>` using `useDiaryStore.relationships`.
  - Add skill and derived-stat conditions: `skill.persuasion`, `skill.coercion`, optional `appearance`.
- UI and Services
  - Opening shop/rent from dialogue: route actions to UI store (`setScreen('trade')` or open sleep/rent modal).
  - Sawmill conversion: call inventory/service logic to consume logs, charge copper, add planks.
  - Debt: persist in a store (e.g., `useWorldStateStore.flags['finn_debt_amount']` or a dedicated debt store).
- Flags
  - `roberta_tide_trade_history_seen`, `sawmill_unlocked`, `finn_debt_paid`, `leo_lighthouse_history_seen`.
  - Interact gating/cooldowns: e.g., `interact_roberta_friendly_cooldown`, `interact_roberta_flirty_unlocked`.

## Acceptance Criteria
- Roberta:
  - If relationship < 20, “Offer help” does not start quest and shows a gating line.
  - If relationship ≥ 20 or Leo intro Roberta path chosen, quest starts.
  - One-time Tide & Trade lore shows once and is hidden thereafter.
  - Interact menu present (v1); friendly actions increase relationship; flirty locked behind threshold; intimidation reduces relationship.
- Crawler:
  - “Can I use your sawmill?” unlocks conversion; conversion option then appears and consumes logs with 2c per plank.
- Finn:
  - Trade and rent are accessible through dialogue.
  - Rent is blocked until debt is paid; payment options work and flip `finn_debt_paid:true`.
- Beryl:
  - “Show me your goods.” opens shop via dialogue.
- Old Leo:
  - One-time lighthouse lore shows once and sets flag.
  - Lore references the Moon Creed, Year of the Frozen Moon, and Leo’s legacy.

## Next Steps
1. Extend condition parser to support `relationship.<npc_id> >= <value>`.
2. Add dialogue nodes and flags for Roberta’s gating and lore; wire quest offer with relationship condition.
3. Implement `open_shop`, `rent_room`, `offer_debt_payment`, `pay_debt`, and `convert_logs_to_planks` actions.
4. Add flags and one-time dialogues for Leo, Crawler, Beryl.
5. Validate flows in-game and adjust copy.

# Ronald — Character & Quest Design

Ronald is a hermit hunter who lives in a cabin in Driftwatch Woods. He is not hostile, but he is not open. He values quiet, competence, and people who carry their weight without announcing it. He does not come into town, and he does not explain himself to strangers. Trust with him is built slowly through demonstrated presence and direct speech.

---

## Character Overview

Ronald chose the woods deliberately. He finds people noisier and less honest than the forest — animals show their intent plainly, weather does not lie, a trail means what it looks like. Driftwatch never learned that, in his view.

He is useful to the player precisely because he is outside town: he knows the forest, he knows the wolf pack, and he knows where the hidden cabin is. None of that is offered easily.

---

## Quest Entry — Referred by Mosswatch Guard

**Quest ID:** `ronald_wolf_pack`

Ronald's quest does not begin at his door. Stage 0 is directed at the Mosswatch guards — either Matthias or Stan will refer Luke to Ronald and set the appropriate flag:

| Flag | Source |
|---|---|
| `ronald_referred_by_matthias` | Matthias sends Luke to Ronald |
| `ronald_referred_by_stan` | Stan sends Luke to Ronald |

Both flags lead to the same `ronald_quest_referral` node. Ronald will not discuss the wolf pack without one of them set — the referral is the gate.

---

## Quest — Teeth in the Trees

### Intent
A combat-and-character quest set entirely in the forest. Ronald does not give orders or set terms beyond "stay steady." The fight itself is the test. The outcome branches on what the player does inside the wolf encounter — kill everything, or bring a pup out alive.

### Flow

```
Stage 0: Talk to Matthias or Stan → referral flag set, quest starts

Stage 1: Find Ronald at Hunter's Cabin
  → ronald_quest_root → ronald_quest_referral
  → "I will help you clear them out."
    → set_quest_stage:2, trigger_event:ronald_wolf_hunt_intro, closes_dialogue
  → "Let me think on it." → back to quest root

Stage 2: Hunt the pack
  → Quest root shows: "I am ready to track the pack."
    → trigger_event:ronald_wolf_hunt_intro directly (re-entry)
  → Wolf fight resolves → ronald_wolf_pack_cleared flag set → stage advances to 3

Stage 3: Return to Ronald
  → "I dealt with the pack." → ronald_quest_after_fight_auto
    → Ronald: "Good. I could feel the woods settling before I saw you come back.
               They were ranging too close for too long. You held when it mattered."
    → Branch on wolf_puppy_adopted:
        true  → "I brought one of the pups out alive." → ronald_quest_after_fight_puppy
        false → "The pack won't trouble your ground again." → ronald_quest_after_fight_grounded

Stage 4: Collect pay from Matthias or Stan
```

### Fight Outcome Branches

**Puppy adopted** (`wolf_puppy_adopted==true`):
> "If that wolf needs somewhere to stay, send him here. Cabin's far enough from town and I know how to keep an animal fed without spoiling it."

Ronald offers to take the pup. This is the warmest Ronald gets unprompted. +12 persuasion XP.

**No puppy** (default):
> "Maybe. But you stayed when most men would have found a reason not to. That counts."

Ronald acknowledges the work without enthusiasm. +8 persuasion XP. The "maybe" is not a doubt about whether the wolves are dead — it is Ronald's way of saying the result was expected but the character behind it was not.

### Rewards
- 200 currency (via quest system at stage 4, paid by Matthias or Stan)
- 150 XP (combat, via quest system)
- +10 relationship with Ronald (via quest system)

---

## Lore Ask Chain

Two gated ask nodes that reveal Ronald's worldview and unlock a hidden location. Neither is tied to the quest — they are available to any player who builds enough relationship.

**`ronald_ask_why_alone`** (rel ≥ 10)
> "Because people make more noise than weather and leave worse signs behind."

Two response branches — "you trust the forest more than town" vs "that sounds lonely." Both lead to the follow-up: *"Quiet and lonely are not the same thing."* Difference is +3 vs +2 relationship.

**`ronald_ask_forest_secret`** (rel ≥ 20)
> "There is an old path deeper in, nearly swallowed by brush now. Used to lead to a cabin."

Reveals the hidden cabin location and sets `ronald_hidden_cabin_known:true`. Ronald gives directions but frames them as a test: *"The woods do not give shelter to men who only half-mean it."* Two response branches with minor relationship difference.

---

## Flag Reference

| Flag | Set By | Meaning |
|---|---|---|
| `ronald_referred_by_matthias` | Matthias dialogue | Unlocks quest referral node with Ronald |
| `ronald_referred_by_stan` | Stan dialogue | Unlocks quest referral node with Ronald |
| `ronald_wolf_pack_started` | `ronald_quest_referral` accept | Quest is actively in progress |
| `ronald_wolf_pack_cleared` | Wolf fight resolution | Pack is down, quest advances to stage 3 |
| `wolf_puppy_adopted` | Player choice in wolf fight | Triggers alternate post-fight branch |
| `ronald_asked_why_alone` | `ronald_ask_why_alone` response | Hides ask after first read |
| `ronald_asked_forest_secret` | `ronald_ask_forest_secret` response | Hides ask after first read |
| `ronald_hidden_cabin_known` | `ronald_ask_forest_secret` response | Unlocks hidden cabin path/location |

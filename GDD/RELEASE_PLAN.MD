# Divine Fantasy - 7-Day Demo Release Plan

## Overview
The "7-Day Demo" is the first major playable release of Divine Fantasy, it still in the planning phase after every datail is resoved the coding can start. The core loop revolves around **Finn's Debt Collection** quest, which imposes a strict 7-day time limit on the player.

**Goal:** Provide a complete, replayable experience with multiple endings, showcasing the game's core systems (Questing, Dialogue, Combat, Exploration, Time Management).

---

## 1. NPC Schedules & World Logic (Priority)
**Goal:** Establish a living world with believable NPC routines.
**Note on Mechanics:** We will use the existing "Time Slot" system (Morning, Day, Evening, Night) combined with "Locked Door" logic to simulate sleeping, rather than a complex real-time simulation.

### The Tavern Crew (Salty Mug)
*   **Finn (Owner/Shadow Hand Recruiter):**
    *   **09:00 - 18:00 (Day):** Tavern Floor (Manager).
    *   **18:00 - 02:00 (Evening/Night):** Cellar / Office (Shadow Business). *Stealth opportunity.*
    *   **02:00 - 09:00 (Late Night):** Sleeping (Upstairs).
*   **Barkip (New NPC - Clerk):**
    *   **06:00 - 14:00 (Morning):** Off-duty (Sleeps in Attic/Slums).
    *   **14:00 - 02:00 (Day/Evening):** Tavern Floor (Bartending). Covers for Finn.
    *   **02:00 - 06:00 (Late Night):** Cleaning/Closing.
*   **Old Crank (Regular):**
    *   **10:00 - 00:00 (All Day):** Tavern (Drinking).
    *   **00:00 - 10:00 (Night):** Slums (Sleeps in a shack/alley).

### The Farm Family (Homestead Farm)
*   **Ben (Farmer):**
    *   **06:00 - 19:00 (Day):** Homestead Farm (Field Work).
    *   **19:00 - 23:00 (Evening):** Salty Mug (Drinking/Gambling).
    *   **23:00 - 06:00 (Night):** Homestead Farm (Sleep).
*   **Elisa (Ben's Wife):**
    *   **06:00 - 23:00 (Day/Evening):** Homestead Farm (House/Chores). *Accessible for "Amulet" dialogue while Ben is at the Tavern.*
    *   **23:00 - 06:00 (Night):** Homestead Farm (Sleep).
*   **Rowan (Kid):**
    *   **08:00 - 20:00 (Day):** Farm (Playing).
    *   **20:00 - 08:00 (Night):** Farm (Sleep).

### The Shopkeepers
*   **Beryl (General Goods):**
    *   **08:00 - 20:00 (Day):** General Goods (Shop Open).
    *   **20:00 - 00:00 (Evening):** Salty Mug (Drinking). *No secret meeting event needed.*
    *   **00:00 - 08:00 (Night):** General Goods (Sleep - Upstairs).
*   **Captain Elias (Sailor - Weekends Only):**
    *   **Saturday/Sunday Day:** Docks (Business).
    *   **Saturday/Sunday Evening:** Salty Mug (Party).
    *   **Late Night:** Ship/Inn (Sleep).
    *   **Monday Morning:** Leaves town.

### The Law & Order
*   **Corporal Matthias (Gate Guard):**
    *   **06:00 - 18:00 (Day):** Mosswatch Keep Gate.
    *   **18:00 - 06:00 (Night):** Barracks (Sleep). *Replaced by Generic Guard.*
*   **Sergeant Rodrick:**
    *   **06:00 - 20:00 (Day):** Tidehunter Quarter (Drilling/Duty).
    *   **20:00 - 06:00 (Night):** Barracks (Sleep).
*   **Private Stan (Generic Guard):**
    *   **18:00 - 06:00 (Night):** Mosswatch Keep Gate (Night Shift).

### The Outcasts
*   **Shaky Jace (Ex-Guard/Hobo):**
    *   **Day:** Slums / Market (Begging).
    *   **Night:** Slums (Sleeping in alley).
*   **Elara (Herbalist):** Static in Hovel (Locked at night).
*   **Crazy Pete:** *Removed from Demo Plan.*

---

## Phase 2: Main Quest (Finn's Debt Collection)

### Context
Luke owes 18 silvers in back rent to Finn. Finn offers a deal: Collect debts from three targets (Ben, Beryl, Elara) totaling 30 silvers within 7 days.
**Lore:** Finn is a recruiter for **The Shadow Hand** (Thieves Guild), testing Luke's loyalty. The targets represent the "rot" of the city (Adultery, Addiction, Drug Dealing) that the Crown ignores.

### Phase 2.1: Quest Refinement & Targets

#### 1. Beryl (General Goods) - *Reference Quality*
*   **Day:** Refuses to pay ("Business is slow").
*   **Night (Tavern):** Drunk and dismissive.
*   **The "Urchin" (Investigation Path):**
    *   **Trigger:** Visit General Goods at Night (while Beryl is at Tavern).
    *   **Event:** Catch an **Urchin** sneaking around the store.
    *   **Interaction:** Intimidate or Bribe the kid.
    *   **Reward:** The kid retrieves/hands over the **Crumpled Letter** (Adultery evidence).
*   **Outcome:** Confront Beryl with letter -> He pays 10 Silvers.

#### 2. Ben (Homestead Farm) - *Pride & Tragedy*
*   **Day (Farm):** Hostile refusal. Claims poverty.
*   **Night (Tavern):** Aggressive refusal.
*   **The "Evening Raid" (Coercion Path):**
    *   **Trigger:** Visit Farm while Ben is at the Tavern (**19:00 - 23:00**).
    *   **Action:** Confront/Threaten **Elisa** (Ben's Wife).
    *   **Outcome:** She gives up her **Antique Locket** (Mother's Heirloom) to save her family.
    *   **Resolution:** Sell Locket to Beryl for 10 Silvers. (Major relationship loss with Ben/Elisa).
*   **Note:** The *Grain Sack* item reward is deprecated and will be removed.

#### 3. Elara (Herbalist's Hovel) - *The Secret Dealer*
*   **Context:** Struggling healer with a dark secret.
*   **Investigation:** Talk to **Shaky Jace** (Addict) in Slums. Bribe/Persuade him to reveal his supplier.
*   **Confrontation:** Confront Elara about her drug dealing.
*   **Outcome:** She pays 10 Silvers "hush money" to avoid the Guards.
*   **Note:** The *Healing Potion* item reward is deprecated and will be removed.

### Phase 2.2: Endings & Paths

#### 1. The Loyalist Path (Standard)
*   **Requirement:** Collect all 3 debts (30 Silvers).
*   **Flow:** Return money to Finn -> Receive **Vanessa's Charm** -> Unlock **Secret Passage** (Slums) to meet **Vanessa** (Guild Leader) -> Cutscene End.

#### 2. The Rebel Path (Secret)
*   **Requirement:** Turn against Finn.
*   **Restriction:** Tidehunter Quarter is LOCKED.
*   **Flow:**
    1.  **Discovery (Optional Hint):** Talk to **Corporal Matthias** (Gate). He dismisses you: "I don't deal in rumors. Bring proof."
    2.  **Rumors (CRITICAL):** Talk to **Old Crank** (Tavern). Buy him a drink to loosen his tongue about "Finn's blacksmith friend." *Required to unlock Cyrus option.*
    3.  **Evidence:** Confront **Cyrus** (Forge) about the "Shadow Blade." He cracks and hands over the **Prototype**.
    4.  **The Alliance:** Show Blade to Matthias -> Access **Sergeant Rodrick**.
    5.  **The Raid:** Attack Salty Mug with Rodrick + 2 Guards.
    6.  **Boss Fight:** Kill Finn + Thugs.
    7.  **Ending:** Finn dies ("I'd rather die than be a dog of the Crown"). Rodrick offers guard training. **Shadow Hand remains active.**

#### 3. The Failure Path (Time Out)
*   **Requirement:** 7 Days elapse without resolution.
*   **Ending:** Finn loses patience. **Unwinnable Combat** -> Game Over.

#### 4. The "Good Neighbor" Path (Failure)
*   **Requirement:** Help the debtors instead of intimidating them (Deliver drugs for Elara, Hide affair for Beryl, Help Ben in fields).
*   **Outcome:** You earn the money, but you fail the **Loyalty Test**.
*   **Finn's Verdict:**
    *   **Ideology:** Finn views the debtors as "leeches" on society (Ben = Neglectful Father/Gambler; Elara = Drug Dealer; Beryl = Extortionist/Adulterer).
    *   **Judgment:** By helping them, you prove you are "weak" and "part of the rot."
    *   **Liability:** Since you now know about the Shadow Hand but won't serve it, you are a liability.
*   **Ending:** Finn executes Luke. **Unwinnable Combat** -> Game Over.

#### 5. The Hybrid Path (Inconsistent)
*   **Requirement:** Mix of Intimidation and Enabling.
*   **Ending:** Finn rejects you as "unpredictable." **Unwinnable Combat** -> Game Over.

---

## Todo List

### Immediate Tasks (Phase 1)
- [ ] **Create NPC:** Barkip (Salty Mug Clerk).
- [ ] **Create NPC:** Private Stan (Night Guard).
- [ ] **Create NPC:** Shaky Jace (Slums Addict).
- [ ] **Update Schedules:** Modify `npcs.json` / `locations.json` for Finn, Ben, Beryl, Old Crank, Rodrick, Matthias.

### Quest Implementation (Phase 2)
- [ ] **Refine Evidence:** Implement "Prototype Shadow Blade" logic and Cyrus interaction.
- [ ] **Ben's Branch:** Implement Elisa dialogue (Evening) and Antique Locket item.
- [ ] **Elara's Branch:** Implement Shaky Jace dialogue and Hush Money logic.
- [ ] **Rebel Path:** Implement Matthias gate logic, Rodrick dialogue, and Raid Event.
- [ ] **Loyalist Path:** Implement Secret Passage unlock.
- [ ] **Failure States:** Implement 7-day timer and Unwinnable Combat scenarios.
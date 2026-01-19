# Skill & Attribute System Rework

This document outlines the planned changes to the Divine Fantasy skill and attribute system, shifting from attribute-specific skill bonuses to a universal Intelligence-based XP system and defining specific utility for other attributes.

## 1. Core Concept
- **Separation of Concerns**: Attributes (Stats) provide passive bonuses or caps (e.g., XP rate, social limits), while Skills determine success in specific actions.
- **Universal Learning**: Intelligence now governs the learning rate (XP gain) for **all** skills, rather than specific attributes boosting specific skills.

## 2. Attributes (Stats)
The 5 core attributes will be repurposed as follows:

### **Intelligence** (Implemented)
- **Effect**: Global XP Multiplier.
- **Formula**: `XP_Gain = Math.floor(Base_XP * (1 + (Intelligence * 0.10)))`
  - Int 1 = 1.1x
  - Int 5 = 1.5x
  - Int 10 = 2.0x

### **Charisma** (Partially Implemented)
- **Effect**: Daily Social Interaction Cap ("Social Energy").
- **Formula**: `Max_Interactions = Charisma_Level` (Implemented in `recalculateStats`)
- **Reset**: Refills to Max on Sleep (New Day). **[PENDING]**

### **Strength** (Implemented)
- **Effect**: Physical Power & Capacity.
- **Formula**: `Max_Weight_Kg = 30 + (Strength * 5)` (Implemented in `recalculateStats`)
  - Str 1 = 35kg
  - Str 5 = 55kg
  - Str 10 = 80kg

### **Dexterity** (Implemented)
- **Effect**: To Be Determined (likely Combat hit/dodge chance).
- **Status**: Renamed from Agility.

### **Wisdom** (Reserved)
- **Effect**: None currently.
- **Status**: Reserved for specific future mechanics (Secret).

## 3. Hunger System (Implemented)
- **State**: `hunger` (0-100). Starts at 100 (Full).
- **Drain Logic**:
  - **Passive**: `-1` per hour (handled in `passTime`).
  - **Active**: `-1` per hour during sleep.
- **Thresholds** (Implemented in `getMaxEnergy`):
  - **Full (80-100)**: +10% Max Energy (Buff).
  - **Hungry (< 20)**: -20% Max Energy (Debuff).
  - **Starving (0)**: -50% Max Energy, -1 HP/Hour (Damage).
- **Eating**: Restores hunger based on item nutrition.

## 4. Skills List
The following skills are designated for the game with specific intended interactions:

### **Combat Skills**
*Requires implementation of `CombatService`.*
- **Formulas**:
  - **Hit Chance**: `50% + (Attack_Level * 5%) - (Enemy_Agility * 2%)`. Max 95%.
  - **Damage**: `Weapon_Damage + Math.floor(Attack_Level / 2)`.
  - **Mitigation (Defend)**: `Damage_Taken = Incoming_Damage * (1 - (Defence_Level * 0.05))`.
  - **Flee Chance**: `30% + (Agility_Skill * 10%)`.
- **XP Gain**:
  - **Attack**: +10 XP per successful hit.
  - **Defence**: +10 XP per hit taken/blocked.
  - **Agility**: +20 XP per successful flee or dodge.

### **Gathering Skills**
- **Woodcutting**:
  - **Success**: Guaranteed (if Tool present).
  - **XP**: +20 XP per Log.
- **Fishing**:
  - **Success**: Random (Based on `fish_table`).
  - **XP**: +25 XP per Catch.

### **Social Skills**
- **XP Gain**: +15 XP per successful Interaction.

## 5. Exploration System Design (In Progress)

### **Technical Config**
- **Cost**: 25 Energy.
- **Time**: 60 Minutes.
- **XP Reward**: +10 to relevant skill per event interaction.

### **Probability Table (d100)**
*Implemented in `ExplorationService.ts`*
| Range | Category | Event ID | Notes |
| :--- | :--- | :--- | :--- |
| **01-20** | **Nothing** | `evt_nothing` | Implemented. |
| **21-30** | **Resources** | `evt_fallen_log` | Implemented (Requires Axe). |
| **31-40** | **Resources** | `evt_apple_tree` | Implemented. |
| **41-45** | **Resources** | `evt_campsite` | Implemented (Steal/Rest). |
| **46-50** | **Resources** | `evt_hollow_stump` | Implemented (Gamble). |
| **51-75** | **Combat** | `evt_wolf_pack` | Logic exists, Service missing. |
| **76-95** | **Combat** | `evt_wolf_pack` | Logic exists, Service missing. |
| **96-98** | **Unique** | `evt_overgrown_path` | Implemented (Unlocks Cabin). |
| **99-100** | **Unique** | `evt_wolf_puppy` | Placeholder in Service. |

## 6. Recent Polish & Fixes (Unplanned but Completed)
- **Sleep System**:
  - Healing scaled by bed quality (Floor: 20HP/8h, Bed: 40HP/8h).
  - Hunger drain (-1/hr) prevents infinite healing.
  - UI Preview for HP/Energy restoration.
- **Crafting System**:
  - Hunter's Cabin crafting bench unlockable via Ronald dialogue.
- **Intro/Tutorial**:
  - Implemented `finn_debt`, `luke_tutorial`, and smuggler event chains.
- **Wolf Companion**:
  - Basic adoption logic implemented in `LocationScreen` (needs connection to Exploration event).

## 7. Implementation Plan

1.  **Phase 1**: Implement Intelligence XP scaling. **[DONE]**
2.  **Phase 2**: Rename Agility Attribute to Dexterity in code. **[DONE]**
3.  **Phase 3**: Implement Hunger System (Drain & Eating logic). **[DONE]**
4.  **Phase 4**: Implement Charisma "Social Energy" system. **[IN PROGRESS]**
    - `maxSocialEnergy` linked to Charisma. **[DONE]**
    - Reset on Sleep. **[DONE]**
    - Create Social Menu (Friendly/Romantic/Evil). **[PENDING]**
5.  **Phase 5**: Implement Strength Carry Weight bonus. **[DONE]**
6.  **Phase 6**: Combat System basic loop (Attack/Defence/Dexterity). **[DONE]**
    - Implemented in `CombatManager.tsx`.
7.  **Phase 7**: Implement Exploration System. **[PARTIALLY DONE]**
    - Event logic implemented in `ExplorationService`.
    - Wolf encounters integrated with `GameManagerService` and `CombatManager`.
    - Needs final wiring for `wolf_puppy` event (currently a placeholder).

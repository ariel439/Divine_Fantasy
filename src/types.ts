import type { ReactElement } from 'react';

// Core navigation/game state types
export type GameState =
  | 'mainMenu'
  | 'characterSelection'
  | 'prologue'
  | 'event'
  | 'inGame'
  | 'dialogue'
  | 'dialogueRoberta'
  | 'characterScreen'
  | 'inventory'
  | 'jobScreen'
  | 'journal'
  | 'diary'
  | 'library'
  | 'trade'
  | 'tradeConfirmation'
  | 'crafting'
  | 'choiceEvent'
  | 'combat'
  | 'combatVictory'
  | 'companion';

export type NavVariant = 'default' | 'compact' | 'floating';

// Inventory and equipment types
export type EquipmentSlot =
  | 'head'
  | 'cape'
  | 'amulet'
  | 'weapon'
  | 'chest'
  | 'shield'
  | 'legs'
  | 'gloves'
  | 'boots'
  | 'ring';

export type FilterCategory =
  | 'All'
  | 'Equipment'
  | 'Resource'
  | 'Consumable'
  | 'Tool'
  | 'Quest';

export interface Item {
  id: string;
  name: string;
  description: string;
  icon?: ReactElement;
  category?: Exclude<FilterCategory, 'All'>; // concrete category for items
  weight: number;
  base_value: number;
  quantity?: number;
  stackable?: boolean;
  uuid?: string; // Add unique identifier for each item instance
  effects?: Record<string, number | string>;
  actions?: string[];
  equipmentSlot?: EquipmentSlot;
  stats?: Record<string, number>;
}

// Trading
export interface OfferItem {
  item: Item;
  quantity: number;
}

// Crafting
export type CraftingSkill = 'Carpentry' | 'Cooking';

export interface Recipe {
  id: string;
  skill: CraftingSkill;
  levelRequired: number;
  result: Item;
  ingredients: { itemId: string; quantity: number }[];
  timeCost: number; // minutes
  energyCost: number; // abstract points
}

// Combat
export interface Combatant {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  portraitUrl: string;
}

// Dialogue
export interface DialogueOption {
  text: string;
  onSelect?: () => void;
  responseText?: string;
  nextOptions?: DialogueOption[];
  nextPortraitUrl?: string;
  disabled?: boolean;
  skillCheck?: { skill: string; level?: number };
  closesDialogue?: boolean;
}

export interface ConversationEntry {
  speaker: 'npc' | 'player';
  text: string;
}

// Choice events
export interface Choice {
  text: string;
  onSelect: () => void;
  disabled?: boolean;
  skillCheck?: { skill: string; level?: number };
}

// Location types
export interface Action {
  text: string;
  type: 'navigate' | 'dialogue' | 'shop' | 'fish' | 'job' | 'use' | 'sleep' | 'cook' | 'woodcut' | 'explore' | 'craft' | 'rent';
  target: string;
  condition?: string;
  time_cost?: number;
  shopId?: string;
}

export interface Location {
  name: string;
  day_description: string;
  night_description: string;
  day_background: string;
  night_background?: string;
  music_track: string;
  is_indoor?: boolean;
  actions: Action[];
}

// Books & Library
export type BookContentType = 'h1' | 'h2' | 'p' | 'img';

export interface BookContent {
  type: BookContentType;
  content: string; // text or image URL depending on type
  caption?: string; // for images
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  content: BookContent[];
}

// NPCs & Quests
export interface NpcRelationship {
  value: number;
  max: number;
}

export interface Npc {
  id: string;
  name: string;
  title: string;
  portrait: string;
  relationships: {
    friendship: NpcRelationship;
    love: NpcRelationship;
    obedience: NpcRelationship;
    fear: NpcRelationship;
  };
  history: string[];
}

export type QuestStatus = 'active' | 'completed';

export interface QuestObjective {
  text: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  giver: string;
  description: string;
  objectives: QuestObjective[];
  rewards: string[];
  status: QuestStatus;
}

// Prologue slides / story content
export interface Slide {
  image: string;
  text: string;
}

// Action Summary (used in modals to summarize outcomes)
export interface ActionSummaryVitalChange {
  vital: string;
  change: number;
  icon?: ReactElement;
}

export interface ActionSummaryResourceChange {
  name: string;
  quantity: number;
  icon?: ReactElement;
}

export interface ActionSummaryReward {
  name: string;
  quantity: number;
  icon?: ReactElement;
}

export interface ActionSummary {
  title: string;
  durationInMinutes: number;
  vitalsChanges: ActionSummaryVitalChange[];
  expended?: ActionSummaryResourceChange[];
  rewards: ActionSummaryReward[];
}


import type { ReactNode } from 'react';

export type GameState = 'mainMenu' | 'characterSelection' | 'prologue' | 'inGame' | 'characterScreen' | 'inventory' | 'journal' | 'diary' | 'jobScreen' | 'dialogue' | 'trade' | 'crafting' | 'tradeConfirmation' | 'choiceEvent' | 'combat' | 'combatVictory' | 'companion' | 'dialogueRoberta' | 'library';

export type NavVariant = 'floating' | 'solid';

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type Weather = 'Sunny' | 'Clear' | 'Cloudy' | 'Rainy' | 'Snowy';

export type EquipmentSlot = 'head' | 'cape' | 'amulet' | 'weapon' | 'chest' | 'shield' | 'legs' | 'gloves' | 'boots' | 'ring';

export interface Vitals {
    hp: { current: number; max: number };
    energy: { current: number; max: number };
    hunger: { current: number; max: number };
}

export interface Slide {
  image: string;
  text: string;
}

export interface DialogueOption {
  text: string;
  skillCheck?: {
    skill: string;
    level: number;
  };
  onSelect?: () => void;
  nextPortraitUrl?: string;
  responseText?: string;
  nextOptions?: DialogueOption[];
}

export interface Choice {
  text: string;
  onSelect: () => void;
  disabled?: boolean;
  skillCheck?: {
    skill: string;
    level: number;
  };
}

export type ConversationEntry = {
    speaker: 'npc' | 'player';
    text: string;
};

export type ItemCategory = 'Resource' | 'Consumable' | 'Tool' | 'Quest' | 'Equipment';
export type FilterCategory = 'All' | ItemCategory;

export interface Item {
    id: string;
    name: string;
    description: string;
    icon: ReactNode;
    category: ItemCategory;
    weight: number;
    value: number;
    quantity?: number;
    stackable: boolean;
    effects?: { [key: string]: string };
    actions: ('Use' | 'Equip' | 'Drop')[];
    equipmentSlot?: EquipmentSlot;
    stats?: { [key: string]: number }; // e.g., { 'Attack': 5, 'Defence': 2 }
}

export interface OfferItem {
    item: Item;
    quantity: number;
}

export interface Npc {
  id: string;
  name: string;
  title: string;
  portrait: string;
  relationships: {
    friendship: { value: number; max: number };
    love: { value: number; max: number };
    obedience: { value: number; max: number };
    fear: { value: number; max: number };
  };
  history: string[];
}

export interface Objective {
    text: string;
    completed: boolean;
}

export interface Quest {
    id:string;
    title: string;
    giver: string;
    description: string;
    objectives: Objective[];
    rewards: string[];
    status: 'active' | 'completed';
}

export type CraftingSkill = 'Carpentry' | 'Cooking';

export interface Recipe {
    id: string;
    result: Item;
    skill: CraftingSkill;
    levelRequired: number;
    ingredients: {
        itemId: string; // Corresponds to an ID in mockInventory
        quantity: number;
    }[];
    timeCost: number; // minutes
    energyCost: number;
}

export interface Combatant {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  portraitUrl: string;
}

export interface ActionSummary {
  title: string;
  durationInMinutes: number; // in minutes
  vitalsChanges: {
    vital: 'Energy' | 'Health' | 'Hunger';
    change: number; // can be negative
    icon?: ReactNode;
  }[];
  rewards: {
    name: string;
    quantity: number;
    icon?: ReactNode;
  }[];
  expended?: {
    name: string;
    quantity: number;
    icon?: ReactNode;
  }[];
}

export type BookContent = {
  type: 'h1' | 'h2' | 'p' | 'img';
  content: string; // for text or image URL
  caption?: string; // for images
};

export interface Book {
  id: string;
  title: string;
  author: string;
  content: BookContent[];
}

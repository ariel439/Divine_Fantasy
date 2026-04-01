import React from 'react';
import { Hammer, Package, Store } from 'lucide-react';
import type { Recipe } from '../types';

export const ROBERTA_UPGRADE_FLAGS = {
  counter: 'roberta_upgrade_counter_done',
  displays: 'roberta_upgrade_displays_done',
  storefront: 'roberta_upgrade_storefront_done',
  complete: 'roberta_shop_upgrades_complete',
  romanceUnlocked: 'roberta_romance_unlocked',
} as const;

export const robertaUpgradeRecipes: Recipe[] = [
  {
    id: 'roberta_counter_refit',
    skill: 'Carpentry',
    levelRequired: 10,
    result: {
      id: 'roberta_counter_refit',
      name: 'Refit the Front Counter',
      description: 'Rebuild the counter so Tide & Trade feels sturdier and worth stepping into.',
      icon: React.createElement(Hammer, { size: 24, className: 'text-amber-300' }),
      category: 'Quest',
      weight: 0,
      base_value: 0,
      stackable: false,
      actions: [],
    },
    ingredients: [
      { itemId: 'wooden_plank', quantity: 6 },
      { itemId: 'iron_nails', quantity: 12 },
      { itemId: 'cloth', quantity: 2 },
    ],
    timeCost: 45,
    energyCost: 10,
    xpGranted: 100,
  },
  {
    id: 'roberta_display_crates',
    skill: 'Carpentry',
    levelRequired: 10,
    result: {
      id: 'roberta_display_crates',
      name: 'Build Better Displays',
      description: 'Put together stronger crates and cleaner displays so the shop looks more inviting.',
      icon: React.createElement(Package, { size: 24, className: 'text-zinc-300' }),
      category: 'Quest',
      weight: 0,
      base_value: 0,
      stackable: false,
      actions: [],
    },
    ingredients: [
      { itemId: 'wooden_plank', quantity: 4 },
      { itemId: 'iron_nails', quantity: 8 },
      { itemId: 'rope', quantity: 2 },
      { itemId: 'cloth', quantity: 1 },
    ],
    timeCost: 35,
    energyCost: 8,
    xpGranted: 100,
  },
  {
    id: 'roberta_storefront_finish',
    skill: 'Carpentry',
    levelRequired: 10,
    result: {
      id: 'roberta_storefront_finish',
      name: 'Set the Storefront Right',
      description: 'Finish the outer face of Tide & Trade so the whole place finally looks respectable.',
      icon: React.createElement(Store, { size: 24, className: 'text-emerald-300' }),
      category: 'Quest',
      weight: 0,
      base_value: 0,
      stackable: false,
      actions: [],
    },
    ingredients: [
      { itemId: 'wooden_plank', quantity: 6 },
      { itemId: 'iron_nails', quantity: 16 },
      { itemId: 'rope', quantity: 2 },
      { itemId: 'cloth', quantity: 2 },
    ],
    timeCost: 55,
    energyCost: 12,
    xpGranted: 100,
  },
];

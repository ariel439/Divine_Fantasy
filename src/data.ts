
import React from 'react';
import type { Item, Npc, Quest, Slide, Recipe, CombatParticipant, EquipmentSlot, DialogueOption, Book, BookContent } from './types';
// FIX: Replaced non-existent 'Ring' icon with 'Radio' as 'Ring' is not an exported member of 'lucide-react'.
import { Sprout, Fish, Hammer, Scroll, Apple, Backpack, UtensilsCrossed, Armchair, CookingPot, Sword, Shirt, Footprints, Gem, Radio, Ribbon, Shield, SplitSquareHorizontal } from 'lucide-react';

export const convertCopperToGSC = (totalCopper: number) => {
    const gold = Math.floor(totalCopper / 10000);
    const silver = Math.floor((totalCopper % 10000) / 100);
    const copper = totalCopper % 100;
    return { gold, silver, copper };
};

export const attributeLabels: { [key: string]: string[] } = {
    strength: ['Weak', 'Average', 'Strong', 'Mighty'],
    attack: ['Feeble', 'Average', 'Strong', 'Herculean'],
    dexterity: ['Clumsy', 'Nimble', 'Graceful', 'Ethereal'],
    intelligence: ['Dull', 'Clever', 'Brilliant', 'Genius'],
    wisdom: ['Foolish', 'Perceptive', 'Wise', 'Sage-like'],
    charisma: ['Repulsive', 'Personable', 'Charismatic', 'Magnetic'],
    defence: ['Fragile', 'Sturdy', 'Resilient', 'Indomitable'],
};

export const getDescriptiveAttributeLabel = (attribute: keyof typeof attributeLabels, value: number): string => {
    const labels = attributeLabels[attribute];
    if (value <= 2) return labels[0];
    if (value <= 5) return labels[1];
    if (value <= 8) return labels[2];
    return labels[3];
};

export const skillProficiencyLabels: { [key: number]: string } = {
    1: 'Novice',
    2: 'Apprentice',
    3: 'Journeyman',
    4: 'Adept',
    5: 'Artisan',
    6: 'Expert',
    7: 'Master',
    8: 'Grandmaster',
    9: 'Legend',
    10: 'Divine',
};

export const getDescriptiveSkillLabel = (level: number): string => {
    // Levels 1-10: Novice (Tier 1)
    if (level <= 10) return skillProficiencyLabels[1];
    // Levels 11-20: Apprentice (Tier 2)
    if (level <= 20) return skillProficiencyLabels[2];
    // Levels 21-30: Journeyman (Tier 3)
    if (level <= 30) return skillProficiencyLabels[3];
    // Levels 31-40: Adept (Tier 4)
    if (level <= 40) return skillProficiencyLabels[4];
    // Levels 41-50: Artisan (Tier 5)
    if (level <= 50) return skillProficiencyLabels[5];
    // Levels 51-60: Expert (Tier 6)
    if (level <= 60) return skillProficiencyLabels[6];
    // Levels 61-70: Master (Tier 7)
    if (level <= 70) return skillProficiencyLabels[7];
    // Levels 71-80: Grandmaster (Tier 8)
    if (level <= 80) return skillProficiencyLabels[8];
    // Levels 81-90: Legend (Tier 9)
    if (level <= 90) return skillProficiencyLabels[9];
    // Levels 91-99: Divine (Tier 10)
    return skillProficiencyLabels[10];
};


export const characters = [
    {
        name: 'Luke',
        age: 19,
        difficulty: 'Hard',
        title: 'The Driftwatch Orphan',
        image: 'https://i.imgur.com/gUNzyBA.jpeg',
        description: "Born to a tragic fate, Luke's mother died in childbirth and his fisherman father was lost to the unforgiving sea. He was raised in Leo's Lighthouse, an orphanage in the salt-sprayed city of Driftwatch, alongside his only friends, Sarah, Robert, and Kyle. His past is a tapestry of loss, but his sharp mind is a beacon of potential, promising a future far grander than his humble beginnings in the Whispers region.",
        attributes: { strength: 5, dexterity: 6, intelligence: 8, wisdom: 5, charisma: 3 }
    }
];



// FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
export const mockInventory: Item[] = [
    { id: '1', name: 'Driftwood', description: 'A sturdy piece of wood washed ashore.', icon: React.createElement(Sprout, { size: 24, className: "text-orange-300" }), category: 'Resource', weight: 1.5, base_value: 2, quantity: 12, stackable: true, actions: ['Drop'] },
    { id: '2', name: 'Salted Fish', description: 'Preserved fish. A reliable source of sustenance.', icon: React.createElement(Fish, { size: 24, className: "text-blue-300" }), category: 'Consumable', weight: 0.5, base_value: 10, quantity: 4, stackable: true, effects: { 'Restores': '15 Hunger' }, actions: ['Use', 'Drop'] },
    { id: '3', name: 'Old Fishing Rod', description: 'A simple but effective fishing rod.', icon: React.createElement(Hammer, { size: 24, className: "text-gray-400" }), category: 'Tool', weight: 2.0, base_value: 25, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'weapon', stats: { 'Fishing Power': 2 } },
    { id: '4', name: "Captain's Log Page", description: 'A water-logged page from a ship\'s log. The writing is barely legible.', icon: React.createElement(Scroll, { size: 24, className: "text-yellow-200" }), category: 'Quest', weight: 0.1, base_value: 0, stackable: false, actions: ['Drop'] },
    { id: '5', name: 'Red Apple', description: 'A crisp, juicy red apple.', icon: React.createElement(Apple, { size: 24, className: "text-red-400" }), category: 'Consumable', weight: 0.2, base_value: 5, quantity: 8, stackable: true, effects: { 'Restores': '5 Hunger' }, actions: ['Use', 'Drop'] },
    { id: '6', name: 'Iron Ore', description: 'A chunk of unrefined iron.', icon: React.createElement(Sprout, { size: 24, className: "text-gray-500" }), category: 'Resource', weight: 3.0, base_value: 15, quantity: 5, stackable: true, actions: ['Drop'] },
    { id: '7', name: 'Leather Tunic', description: 'A simple tunic made from cured leather. Offers basic protection.', icon: React.createElement(Shirt, { size: 24, className: "text-amber-700" }), category: 'Equipment', weight: 4.0, base_value: 40, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'chest', stats: { 'Defence': 3 } },
    { id: '8', name: 'Worn Boots', description: 'Sturdy leather boots, worn from many miles of travel.', icon: React.createElement(Footprints, { size: 24, className: "text-amber-800" }), category: 'Equipment', weight: 1.5, base_value: 15, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'boots', stats: { 'Defence': 1, 'Speed': 1 } },
    { id: '9', name: 'Iron Longsword', description: 'A standard-issue longsword. Reliable and sharp.', icon: React.createElement(Sword, { size: 24, className: "text-slate-400" }), category: 'Equipment', weight: 3.0, base_value: 60, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'weapon', stats: { 'Attack': 8, 'Speed': -2 } },
    { id: '10', name: 'Iron Platelegs', description: 'Heavy iron platelegs. Excellent protection.', icon: React.createElement(SplitSquareHorizontal, { size: 24, className: "text-slate-400" }), category: 'Equipment', weight: 6.0, base_value: 75, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'legs', stats: { 'Defence': 7 } },
    { id: '11', name: 'Wooden Shield', description: 'A simple round shield made of wood.', icon: React.createElement(Shield, { size: 24, className: "text-amber-700" }), category: 'Equipment', weight: 4.0, base_value: 30, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'shield', stats: { 'Defence': 4 } },
];

export const mockEquippedItems: Partial<Record<EquipmentSlot, Item>> = {
  weapon: { id: 'e1', name: 'Rusty Shortsword', description: 'A short, tarnished blade. Better than nothing.', icon: React.createElement(Sword, { size: 24, className: "text-orange-900" }), category: 'Equipment', weight: 2.5, base_value: 10, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'weapon', stats: { 'Attack': 5, 'Speed': -1 } },
  chest: { id: 'e2', name: 'Padded Gambeson', description: 'A thick, padded jacket that offers minimal protection.', icon: React.createElement(Shirt, { size: 24, className: "text-amber-600" }), category: 'Equipment', weight: 5.0, base_value: 25, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'chest', stats: { 'Defence': 5 } },
  amulet: { id: 'e3', name: 'Tarnished Locket', description: 'A small, dented locket that won\'t open.', icon: React.createElement(Gem, { size: 24, className: "text-zinc-400" }), category: 'Equipment', weight: 0.1, base_value: 5, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'amulet', stats: {} },
  cape: { id: 'e4', name: 'Woolen Cloak', description: 'A heavy cloak that offers some protection from the elements.', icon: React.createElement(Ribbon, { size: 24, className: "text-green-800" }), category: 'Equipment', weight: 2.0, base_value: 20, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'cape', stats: { 'Cold Resist': 5 } },
  // FIX: Replaced non-existent 'Ring' icon with 'Radio'.
  ring: { id: 'e5', name: 'Iron Ring', description: 'A simple, unadorned iron ring.', icon: React.createElement(Radio, { size: 24, className: "text-slate-500" }), category: 'Equipment', weight: 0.1, base_value: 10, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'ring', stats: {} },
};




export const mockNpcs: Npc[] = [
  {
    id: 'sarah',
    name: 'Sarah',
    title: "Orphanage 'Mother'",
    portrait: 'https://i.imgur.com/L3eXs3O.jpeg',
    relationships: {
      friendship: { value: 75, max: 100 },
      love: { value: 10, max: 100 },
      fear: { value: 60, max: 100 },
    },
    history: [
      'You shared your meal with her.',
      'Helped her clean the common room.',
      'Listened to her worries about Kyle.',
    ],
  },
  {
    id: 'robert',
    name: 'Robert',
    title: 'Ambitious Dockworker',
    portrait: 'https://i.imgur.com/vJQg0a1.jpeg',
    relationships: {
      friendship: { value: 55, max: 100 },
      love: { value: 0, max: 100 },
      fear: { value: 45, max: 100 },
    },
    history: [
        'He taught you how to tie a proper knot.',
        'You argued about the best way to stack crates.',
        'Worked a shift together at the docks.',
    ]
  },
  {
    id: 'kyle',
    name: 'Kyle',
    title: 'Mischievous Younger Brother',
    portrait: 'https://i.imgur.com/5lO5b1G.jpeg',
    relationships: {
      friendship: { value: 85, max: 100 },
      love: { value: 0, max: 100 },
      fear: { value: 20, max: 100 },
    },
    history: [
        'You covered for him when he broke a window.',
        'He played a prank on you with a bucket of water.',
        'Shared stories late into the night.',
    ]
  },
  {
    id: 'elias',
    name: 'Captain Elias',
    title: 'Weathered Sea Captain',
    portrait: 'https://i.imgur.com/vHqJdJA.jpeg',
    relationships: {
      friendship: { value: 20, max: 100 },
      love: { value: 0, max: 100 },
      fear: { value: 70, max: 100 },
    },
    history: [
        'He gave you your first job at the docks.',
        'He yelled at you for being late.',
        'You listened to one of his long tales about the sea.',
    ]
  },
  {
    id: 'roberta',
    name: 'Roberta',
    title: 'Grieving Widow',
    portrait: 'https://i.imgur.com/uhOoVzS.png',
    relationships: {
      friendship: { value: 15, max: 100 },
      love: { value: 0, max: 100 },
      fear: { value: 10, max: 100 },
    },
    history: [
        'You met her near the city square.',
    ]
  }
];

export const mockQuests: Quest[] = [
    {
        id: 'q1',
        title: 'A Helping Hand',
        giver: 'Sarah',
        description: 'Sarah is worried about the dwindling firewood supply for the orphanage, especially with the colder nights approaching. She has asked you to gather some sturdy driftwood from the nearby beach.',
        objectives: [
            { text: 'Gather 10 Driftwood', completed: true },
            { text: 'Bring the wood to Sarah', completed: false },
        ],
        rewards: ['50 Copper', '5 Woodcutting XP', '+15 Friendship with Sarah'],
        status: 'active',
    },
    {
        id: 'q2',
        title: 'The First Catch',
        giver: 'Captain Elias',
        description: "Captain Elias believes every soul in Driftwatch should know how to fend for themselves. He's offered to teach you the basics of fishing if you can prove you're serious by acquiring a simple fishing rod.",
        objectives: [
            { text: 'Obtain a Fishing Rod', completed: false },
            { text: 'Meet Elias at the main dock', completed: false },
        ],
        rewards: ['Basic Fishing Lessons', '+10 Respect with Captain Elias'],
        status: 'active',
    },
    {
        id: 'q3',
        title: 'Lost Supplies',
        giver: 'Robert',
        description: 'A crate of valuable ship parts fell into the water during unloading. Robert is stressed and needs help retrieving it before the tide washes it away. He was too proud to ask the foreman for help.',
        objectives: [
            { text: 'Find the sunken crate near the western pylons', completed: false },
            { text: 'Return the crate to Robert', completed: false },
        ],
        rewards: ['1 Silver', '5 Strength XP', '+10 Friendship with Robert'],
        status: 'active',
    },
    {
        id: 'q4',
        title: 'Initiation',
        giver: 'Captain Elias',
        description: 'To test your mettle, Captain Elias gave you a simple task to move some crates. It was grueling work, but you finished the job.',
        objectives: [
            { text: 'Move 5 crates to the warehouse', completed: true },
            { text: 'Report back to Captain Elias', completed: true },
        ],
        rewards: ['20 Copper', '+5 Respect with Captain Elias'],
        status: 'completed',
    },
];

export const mockMerchant: {
  name: string;
  totalCopper: number;
  inventory: Item[];
} = {
  name: 'Beryl',
  totalCopper: 70000, // 5g, 200s -> 7g
  inventory: [
// FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
    { id: 'm1', name: 'Fishing Bait', description: 'Wriggly worms, perfect for luring fish.', icon: React.createElement(Sprout, { size: 24, className: "text-lime-400" }), category: 'Consumable', weight: 0.1, base_value: 5, quantity: 50, stackable: true, actions: [] },
    { id: 'm2', name: 'Sturdy Fishing Net', description: 'A well-made net for catching multiple fish at once.', icon: React.createElement(Backpack, { size: 24, className: "text-amber-600" }), category: 'Tool', weight: 3.0, base_value: 150, stackable: false, actions: [] },
    { id: 'm3', name: 'Minor Health Potion', description: 'A vial of red liquid that restores a small amount of health.', icon: React.createElement(Apple, { size: 24, className: "text-red-500" }), category: 'Consumable', weight: 0.3, base_value: 30, quantity: 10, stackable: true, actions: [] },
    { id: 'm4', name: 'Map of the Coast', description: 'A hand-drawn map detailing the nearby coastline and fishing spots.', icon: React.createElement(Scroll, { size: 24, className: "text-yellow-200" }), category: 'Quest', weight: 0.1, base_value: 100, stackable: false, actions: [] },
  ],
};

export const mockRecipes: Recipe[] = [
    {
        id: 'recipe_planks',
        skill: 'Carpentry',
        levelRequired: 1,
        result: {
            id: 'wooden_plank', name: 'Wooden Plank', description: 'Process logs into planks at the sawmill.', icon: React.createElement(Hammer, { size: 24, className: "text-amber-300" }), category: 'Resource', weight: 2.5, base_value: 5, stackable: true, actions: []
        },
        ingredients: [
            { itemId: 'log', quantity: 1 }
        ],
        timeCost: 1,
        energyCost: 2,
        xpGranted: 25,
    },
    {
        id: 'recipe_grilled_sardine',
        skill: 'Cooking',
        levelRequired: 1,
        result: {
            id: 'food_sardine_grilled', name: 'Grilled Sardine', description: 'A sardine, grilled over an open flame.', icon: React.createElement(UtensilsCrossed, { size: 24, className: "text-amber-300" }), category: 'Consumable', weight: 0.3, base_value: 4, stackable: true, quantity: 1, effects: { 'Restores': '10 Hunger' }, actions: ['Use', 'Drop']
        },
        ingredients: [
            { itemId: 'fish_sardine', quantity: 1 },
        ],
        timeCost: 5,
        energyCost: 3,
        xpGranted: 10,
    },
    {
        id: 'recipe_grilled_trout',
        skill: 'Cooking',
        levelRequired: 3,
        result: {
            id: 'food_trout_grilled', name: 'Grilled Trout', description: 'A trout, grilled over an open flame.', icon: React.createElement(UtensilsCrossed, { size: 24, className: "text-amber-400" }), category: 'Consumable', weight: 0.6, base_value: 7, stackable: true, quantity: 1, effects: { 'Restores': '15 Hunger' }, actions: ['Use', 'Drop']
        },
        ingredients: [
            { itemId: 'fish_trout', quantity: 1 },
        ],
        timeCost: 8,
        energyCost: 5,
        xpGranted: 25,
    },
    {
        id: 'recipe_grilled_pike',
        skill: 'Cooking',
        levelRequired: 5,
        result: {
            id: 'food_pike_grilled', name: 'Grilled Pike', description: 'A pike, grilled over an open flame.', icon: React.createElement(UtensilsCrossed, { size: 24, className: "text-amber-500" }), category: 'Consumable', weight: 1.2, base_value: 10, stackable: true, quantity: 1, effects: { 'Restores': '18 Hunger' }, actions: ['Use', 'Drop']
        },
        ingredients: [
            { itemId: 'fish_pike', quantity: 1 },
        ],
        timeCost: 12,
        energyCost: 7,
        xpGranted: 50,
    },
    {
        id: 'recipe_cooked_meat',
        skill: 'Cooking',
        levelRequired: 1,
        result: {
            id: 'cooked_meat', name: 'Cooked Meat', description: 'A juicy piece of meat, perfectly seared.', icon: React.createElement(UtensilsCrossed, { size: 24, className: "text-red-400" }), category: 'Consumable', weight: 0.5, base_value: 6, stackable: true, quantity: 1, effects: { 'Restores': '14 Hunger' }, actions: ['Use', 'Drop']
        },
        ingredients: [
            { itemId: 'raw_meat', quantity: 1 },
        ],
        timeCost: 10,
        energyCost: 5,
        xpGranted: 20,
    },
    {
        id: 'recipe_wolf_helmet',
        skill: 'Crafting',
        levelRequired: 1,
        result: {
            id: 'wolf_leather_helmet', name: 'Wolf Leather Helmet', description: 'A sturdy leather helmet made from wolf hide.', icon: React.createElement(Shirt, { size: 24, className: "text-amber-700" }), category: 'Equipment', weight: 1.0, base_value: 56, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'head', stats: { 'defence': 3 }
        },
        ingredients: [
            { itemId: 'wolf_pelt', quantity: 2 },
        ],
        timeCost: 30,
        energyCost: 5,
        xpGranted: 50,
    },
    {
        id: 'recipe_wolf_armor',
        skill: 'Crafting',
        levelRequired: 5,
        result: {
            id: 'wolf_leather_armor', name: 'Wolf Leather Armor', description: 'Light armor crafted from cured wolf pelts.', icon: React.createElement(Shirt, { size: 24, className: "text-amber-700" }), category: 'Equipment', weight: 3.0, base_value: 140, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'chest', stats: { 'defence': 6 }
        },
        ingredients: [
            { itemId: 'wolf_pelt', quantity: 5 },
        ],
        timeCost: 60,
        energyCost: 10,
        xpGranted: 100,
    },
    {
        id: 'recipe_wolf_legs',
        skill: 'Crafting',
        levelRequired: 3,
        result: {
            id: 'wolf_leather_legs', name: 'Wolf Leather Leggings', description: 'Tough leather leggings for agility and protection.', icon: React.createElement(Shirt, { size: 24, className: "text-amber-700" }), category: 'Equipment', weight: 1.5, base_value: 84, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'legs', stats: { 'defence': 3 }
        },
        ingredients: [
            { itemId: 'wolf_pelt', quantity: 3 },
        ],
        timeCost: 45,
        energyCost: 8,
        xpGranted: 60,
    },
    {
        id: 'recipe_wolf_amulet',
        skill: 'Crafting',
        levelRequired: 3,
        result: {
            id: 'wolf_tooth_amulet', name: 'Wolf Tooth Amulet', description: 'A necklace made of wolf teeth.', icon: React.createElement(Gem, { size: 24, className: "text-zinc-400" }), category: 'Equipment', weight: 0.2, base_value: 15, stackable: false, actions: ['Equip', 'Drop'], equipmentSlot: 'amulet', stats: { 'strength': 2 }
        },
        ingredients: [
            { itemId: 'wolf_tooth', quantity: 3 },
        ],
        timeCost: 15,
        energyCost: 6,
        xpGranted: 80,
    }
];

export const mockParty: CombatParticipant[] = [
    {
        id: 'luke',
        name: 'Luke',
        hp: 85,
        maxHp: 100,
        attack: 10,
        defence: 5,
        dexterity: 6,
        portraitUrl: 'https://i.imgur.com/gUNzyBA.jpeg',
        isPlayer: true,
    },

];

export const mockEnemies: CombatParticipant[] = [
    {
        id: 'wolf1',
        name: 'Rabid Wolf',
        hp: 45,
        maxHp: 45,
        attack: 12,
        defence: 2,
        dexterity: 10,
        portraitUrl: 'https://i.imgur.com/NXT2T8Q.png',
    },

    {
        id: 'wolf3',
        name: 'Shadow Wolf',
        hp: 55,
        maxHp: 55,
        attack: 14,
        defence: 3,
        dexterity: 14,
        portraitUrl: 'https://i.imgur.com/NXT2T8Q.png',
    },
    {
        id: 'wolf4',
        name: 'Dire Wolf',
        hp: 60,
        maxHp: 60,
        attack: 18,
        defence: 4,
        dexterity: 8,
        portraitUrl: 'https://i.imgur.com/NXT2T8Q.png',
    }
];

export const mockSaveSlots = Array.from({ length: 10 }, (_, i) => {
    if (i === 0 || i === 3 || i === 4) {
        const date = new Date(Date.now() - i * 1000 * 60 * 60 * 24 * 3 - i * 1000 * 60 * 73);
        return {
            id: i + 1,
            isEmpty: false,
            screenshotUrl: `https://i.imgur.com/${['UVZuGiT', 'gUNzyBA', 'L3eXs3O', 'vJQg0a1', '5lO5b1G'][i % 5]}.jpeg`,
            saveName: i === 0 ? 'Dockside Beginnings' : i === 3 ? 'A Risky Trade' : 'After the Fight',
            saveDate: date.toISOString().replace('T', ' ').substring(0, 19),
        };
    }
    return {
        id: i + 1,
        isEmpty: true,
    };
});

export const eliasDialogue: { text: string; options: DialogueOption[] } = {
  text: "Another day, another tide. The sea gives, and the sea takes. What brings you to this old salt's perch? Don't waste my time if it's not important.",
  options: [
    {
      text: "I'm looking for work. I heard you're the one to talk to.",
      skillCheck: { skill: 'Persuasion', level: 3 },
      responseText: "Work, eh? Not many have the stomach for it. I might have something. Depends. Are you afraid of getting your hands dirty?",
      nextOptions: [
        {
          text: "I'm a hard worker. I'm not afraid of anything.",
          responseText: "Hah! We'll see about that. Arrogance sinks ships faster than a kraken. But I like your spirit. Be here at dawn tomorrow. Don't be late.",
        },
        {
          text: "What kind of work are we talking about?",
          responseText: "Swabbing decks, hauling cargo, mending nets... the usual. It's not glorious, but it pays. Interested or not?",
          nextOptions: [
            {
              text: "I'll take it.",
              responseText: "Good. Be here at dawn. Don't be late.",
            },
            {
              text: "I'll have to think about it.",
              responseText: "The tide doesn't wait for you to think. Don't come crying to me when your pockets are empty.",
            },
          ]
        },
      ]
    },
    { 
      text: "Just admiring the view, Captain.", 
      responseText: "The sea's a fine view, alright. Just don't turn your back on her. She's as fickle as she is beautiful." 
    },
    { 
      text: "Heard any interesting rumors?", 
      responseText: "Rumors are like barnacles, boy. Plentiful, and most of 'em are full of filth. Now, are you here for a reason or just to flap your gums?" 
    },
    { text: "(Leave) Nevermind. I'll be on my way." },
  ]
};

export const robertaDialogue: { text: string; options: DialogueOption[] } = {
  text: "Oh... hello. It's a... a day, isn't it? The sky is certainly... up there.",
  options: [
      {
          text: "You seem down. Is everything alright?",
          nextPortraitUrl: 'https://i.imgur.com/w5ugLzF.png', // happy
          responseText: "Oh! You noticed? That's... that's kind of you. Most people just walk by. It's just... things have been difficult lately.",
          nextOptions: [
            {
              text: "If you want to talk about it, I'm here to listen.",
              responseText: "You're very kind. It's my husband... he passed recently. The quiet in the house is the loudest thing I've ever heard. Thank you for... well, for seeing me."
            }
          ]
      },
      {
          text: "I found this. I believe it belonged to your husband.",
          nextPortraitUrl: 'https://i.imgur.com/j0fPTPv.png', // very happy
          responseText: "This... this is his locket! I thought it was lost forever! Oh, thank you, thank you! I don't know how to repay you!"
      },
      {
          text: "I heard about your husband. I'm sorry for your loss.",
          nextPortraitUrl: 'https://i.imgur.com/EFiYTHQ.png', // crying
          responseText: "*sniff* Thank you. It's... it's been hard. The days are so quiet now. It means a lot that you'd say that."
      },
      { text: "(Leave) I'll be on my way." },
  ]
};

export const mockBooks: Book[] = [
    {
        id: 'odrans-rebellion',
        title: "Odran's Rebellion",
        author: "Maester Alister",
        releaseYear: "731 AW",
        coverUrl: "/assets/books/odran_cover.png",
        content: [
            { type: 'h1', content: "Odran's Rebellion (730 AW)" },
            { type: 'p', content: "Odran's Rebellion (730 AW) was a significant armed conflict in The Whispers region, where several southern noble houses led by House Odran attempted to secede from the rule of House Seryn. The rebellion was ultimately crushed by King Arthur Seryn, known as the \"Sword of Tomorrow,\" resulting in the complete extinction of Houses Odran and Cramb." },
            { type: 'p', content: "The conflict marked a pivotal moment in the history of The Whispers, reshaping the political landscape and demonstrating the military might and strategic brilliance of House Seryn. The rebellion unfolded in three major phases: the downfall of House Cramb, the twin offensive (comprising the Strigora Campaign and the Siege of Nightfall), and the final confrontation at Embris." },
            { type: 'h2', content: "Background" },
            { type: 'p', content: "The rebellion stemmed from growing resentment among the southern houses of The Whispers against the centralized power of House Seryn. Economic disparities between the north and south, coupled with cultural differences that had developed over generations, created fertile ground for dissent. House Odran, wealthy from trade with regions beyond The Whispers, saw an opportunity to establish an independent southern domain." },
            { type: 'p', content: "Lord Christian Odran, ambitious and charismatic, began secretly building alliances with other discontented houses, particularly House Veynor, House Rellmont, and House Cramb. These houses controlled strategic locations in the southern territories and shared Odran's vision of independence from Nightfall's rule." },
            { type: 'h2', content: "Factions" },
            { type: 'p', content: "Loyalists: House Seryn, House Draymor, House Dunhart, House Strigora, House Valtara." },
            { type: 'p', content: "Rebels: House Odran, House Veynor, House Rellmont, House Cramb, and other southern allies." },
            { type: 'h2', content: "Course of the Rebellion" },
            { type: 'h1', content: "The Downfall of House Cramb" },
            { type: 'img', content: "/assets/books/odran_swamp.png", caption: "The burning of Murkwater" },
            { type: 'p', content: "The first significant clash of Odran's Rebellion began disastrously for the rebels. House Cramb, led by Lord Marcel Cramb, attempted to join forces with House Veynor in a bid to secure the Blackwood Forest. The plan was to take control of the forest swiftly, solidifying their power base and resources. However, unknown to them, the Knights of the Moon had been training at Hawk's Nest, and House Valtara's scouts had keenly monitored the rebels' movements." },
            { type: 'p', content: "As House Cramb's forces marched south, they were caught off guard by a sudden ambush. The combined cavalry of the Knights of the Moon and the Valtara Falconers descended upon them, shattering their lines. Marcel Cramb, a seasoned warrior yet unprepared for the ferocity of the assault, fell amidst the chaos, his body trampled under the charge of the Knights." },
            { type: 'p', content: "In disarray, the survivors of House Cramb scattered, fleeing to the swamps of Murkwater, their fortified seat. There, Marcel's young and inexperienced son, Robert Cramb, took command. Only sixteen and untested by war, he chose a desperate strategy—burning the swamps to prevent a siege. Yet the winds betrayed them, and the fire turned against their own. Flames engulfed the city and castle, while fleeing soldiers and citizens were consumed by the blaze or dragged beneath the murky waters by lurking crocodiles." },
            { type: 'p', content: "Seryn and Valtara forces, better disciplined and with clearer escape routes, withdrew swiftly. House Cramb, however, was left to perish. The massacre marked the end of their line—Murkwater was left an abandoned, haunted ruin, and House Cramb's name became a grim cautionary tale. Despite efforts to reclaim the land, every attempt failed, with settlers vanishing or fleeing from the accursed place. The doom of House Cramb was a severe blow to the rebels, foreshadowing the fate that awaited any who stood against the Seryns." },
            { type: 'h1', content: "The Twin Offensive" },
            { type: 'img', content: "/assets/books/odran_siege.png", caption: "Siege of Nightfall" },
            { type: 'p', content: "Following the initial success against House Cramb, King Arthur Seryn devised a bold strategy that would become known as the Twin Offensive - two simultaneous campaigns that would divide and conquer the remaining rebel forces. While the king himself led the Strigora Campaign in the Blackwood Forest, the rebels launched their own assault on Nightfall, creating a two-front war that would test both sides to their limits." },
            { type: 'h2', content: "The Strigora Campaign" },
            { type: 'p', content: "King Arthur Seryn, often known as the Sword of Tomorrow for his foresight in warfare, led a decisive campaign to dismantle House Veynor and their southern allies entrenched in the Blackwood Forest. The loyalty of House Strigora, with their expert troops known as the Shadow Owl, provided a critical advantage. These stealthy, cunning fighters were adept at ambushes and night warfare, exploiting the dense, foreboding woods that had once served as a shield for the rebels." },
            { type: 'p', content: "Pushed to desperation, House Veynor's forces attempted a last stand at their seat, Veilford. The besieged stronghold became a symbol of defiance for the rebels, but it could not withstand the relentless assault. Lord Henry Veynor, realizing the futility of resistance, surrendered — a choice that sealed his fate. He was executed for treason, a message to any who dared to defy House Seryn's rule." },
            { type: 'h2', content: "The Siege of Nightfall" },
            { type: 'p', content: "Simultaneously with the Strigora Campaign, the remaining rebel forces of House Odran and Rellmont converged at Riverwatch. They seized the opportunity created by King Arthur's campaign in the Blackwood Forest, gathering boats and small ships to sail through the Twin River toward Nightfall, the heart of House Seryn's power." },
            { type: 'p', content: "However, King Arthur's foresight once again prevailed. The rebels managed to breach the walls of Nightfall, igniting street battles and chaos. Yet, the cost of the siege had been catastrophic. In a bitter clash near the castle's heart, both Lord Arthur Draymor and Lord Norbert Durnhart fell, their sacrifices solidifying the defense. When King Arthur returned from the Blackwood Forest, his forces swiftly reclaimed Nightfall, scattering the exhausted remnants of the rebellion." },
            { type: 'h1', content: "The Fall of Riverwatch & The Duel of Fate" },
            { type: 'img', content: "/assets/books/odran_duel.png", caption: "The Duel of Fate" },
            { type: 'p', content: "After reclaiming Nightfall, King Arthur's campaign turned swiftly toward Riverwatch. Lord Igor Rellmont, desperate and defiant, refused to surrender. In a shocking turn, it was one of Rellmont's own men who struck him down. Riverwatch fell without further bloodshed." },
            { type: 'p', content: "Marching to Embris, King Arthur found House Odran steadfast in their defiance. The battle was brutal. As the last of their warriors fell, Lord Christian Odran raised a white flag, but rather than submit, Christian challenged King Arthur Seryn to a duel. If Christian won, he and his family would be exiled; if he lost, House Odran's name would be erased from history." },
            { type: 'p', content: "In the moonlit courtyard of Embris, the two men faced each other. King Arthur, wielding his signature rapier, struck with relentless precision. Christian, exhausted and burdened, faltered. The duel was a grim spectacle — a testament to King Arthur's mastery and the futility of House Odran's defiance." },
            { type: 'h2', content: "Aftermath & Legacy" },
            { type: 'p', content: "With Christian Odran's death, King Arthur carried out a final, ruthless decree. The members of House Odran were executed. Their ancestral seat, Embris, was razed, and their name stricken from the annals of The Whispers. This was known as Moon's Justice." },
            { type: 'p', content: "The weight of this victory altered the king. He withdrew from the public eye, spending his remaining days in solitude, writing, painting, and composing music — his artistry a stark contrast to the cold, calculated warrior the realm had come to know. His death marked the end of an era, a monarch who had shaped the fate of The Whispers with unparalleled foresight and unwavering resolve." },
            { type: 'p', content: "The legacy of Odran's Rebellion continues to influence The Whispers. The ruins of Murkwater remain abandoned, believed to be cursed, with local legends claiming that on foggy nights, the screams of the dying can still be heard echoing across the swamps." },
        ]
    },
    {
        id: 'pearl-war',
        title: "The Pearl War",
        author: "Maester Valerius",
        releaseYear: "368 AW",
        coverUrl: "/assets/books/pearl_war_cover.png",
        content: [
            { type: 'h1', content: "The Pearl War (367 AW)" },
            { type: 'p', content: "The Pearl War (367 AW) was a defining conflict in the history of the Pearl Islands—now known as the Mermaid Islands—that reshaped the very foundation of House Lirs and established a matriarchal rule that would influence the region's culture for centuries. Sparked by the untimely death of Lord Isandro Lirs, the patriarch of the house, the war saw a brutal struggle for power between his two children: Lady Barbara Lirs, a seasoned naval commander, and her younger brother, Lord Craster Lirs, a politically favored but inexperienced leader." },
            { type: 'p', content: "At its core, the Pearl War was a conflict of identity, tradition, and ambition. The islands, named for their abundant pearl trade, had long balanced commerce and seafaring warfare. However, the death of Isandro, a respected yet aging leader, exposed a growing fracture in the islands' society—between those who sought to maintain the patriarchal customs of old and those who believed in the rising influence of women in warfare and leadership." },
            { type: 'h2', content: "The Calm Before the Storm" },
            { type: 'img', content: "/assets/books/pearl_war_calm_before_storm.png", caption: "The Calm Before the Storm" },
            { type: 'p', content: "Lord Isandro Lirs was a figure of stability for House Lirs and the Pearl Islands. Known for his diplomatic approach and keen sense of commerce, he had fortified his family's position as the dominant force among the scattered islands. However, his later years were plagued by illness, and the once-feared mariner became a weakened ruler whose grasp on the islands' volatile politics began to slip." },
            { type: 'p', content: "When Isandro died without clearly naming an heir, the islands fell into a state of uncertainty. By tradition, the eldest son would inherit the title, yet the tides of change were rising. The Pearl Islands had seen a steady increase in the influence of women, particularly among its fleets. Many of the most formidable captains were women, and their control over the islands' ships granted them significant power. As a result, the notion that a woman might take the helm of House Lirs was no longer a distant fantasy." },
            { type: 'p', content: "Lady Barbara Lirs, at twenty-two, was already a veteran of the seas. She had led successful raids against pirates and commanded respect among the fleet. However, her brother Craster, at just seventeen, was seen as a proper heir in the eyes of the conservative merchants and minor nobles who feared change. While Craster lacked his sister's experience, his supporters believed that he could be molded into a ruler who would maintain the status quo." },
            { type: 'p', content: "The Pearl Islands quickly became divided. Merchants, eager to protect their trade agreements and wary of a more militarized regime, stood behind Craster. House Carronvale, a growing power from Driftwatch with close economic ties to House Lirs, pledged their support to the young lord, seeing an opportunity to exert influence over the islands. Meanwhile, the captains and warriors—many of whom had sailed under Barbara's command—pledged their loyalty to the seasoned leader. They saw in her not just a capable ruler, but a symbol of change." },
            { type: 'h2', content: "The War for the Throne of Pearls" },
            { type: 'p', content: "With the realm divided and loyalties split, the struggle for the Pearl Throne swiftly escalated from tense negotiations to outright conflict. Lady Barbara Lirs, armed with her unparalleled naval expertise and the support of the growing matriarchal military class, established a base on three smaller islands off the coast of the Pearl Islands. These islands, scattered yet strategically significant, provided her with secure harbors and staging grounds for her fleet." },
            { type: 'p', content: "Lord Craster Lirs, only seventeen but backed by the majority of the merchants, lesser nobles, and the neighboring House Carronvale of Driftwatch, struggled to consolidate power. Despite his attempts to rally the islands' aristocracy, his influence was limited on the seas — a crucial flaw in a region defined by its maritime prowess. House Carronvale, eager to expand its influence, committed their modest but evolving fleet to Craster's cause, yet it was evident they were outmatched by Barbara's seasoned sailors." },
            { type: 'p', content: "Barbara's campaign began with a series of swift and calculated strikes. Her forces cut off trade routes, seized supply ships, and raided the coastal estates of those who supported her brother. The sea itself became her ally, the waves and winds carrying her vessels to victory after victory. In contrast, Craster's forces were often disorganized, lacking the naval experience necessary to contest her dominance. The political power he held on land began to erode as merchants saw their wealth sink beneath the waves, and nobles questioned the wisdom of standing by a leader incapable of controlling the waters." },
            { type: 'h1', content: "Battle of the Shattered Tides" },
            { type: 'img', content: "/assets/books/pearl_war_shattered_tides.png", caption: "Battle of the Shattered Tides" },
            { type: 'p', content: "The defining moment of the war came in the Battle of the Shattered Tides, named for the wreckage that littered the waters for years to come. Craster, desperate to end the war and preserve his claim, launched a direct assault on Barbara's fleet. The Carronvale ships led the charge, attempting to outmaneuver the more experienced captains under Barbara's command. However, Barbara's knowledge of the tides and currents proved invaluable; she drew her brother's fleet into narrow straits where the winds faltered, and the waves broke chaotically. Her ships, prepared for the turbulence, surrounded and decimated the enemy fleet." },
            { type: 'p', content: "Craster's defeat marked the beginning of the end. With his forces scattered or destroyed, his supporters began to abandon him, fearful of Barbara's wrath and the growing dominance of her fleet. The remaining loyalists withdrew to the Pearl Throne, the ancient seat of House Lirs, a fortress believed to be impregnable from the sea. Yet, Barbara, relentless and unyielding, began a siege. Cannons battered the walls for days, and the once-proud castle began to crumble under the unrelenting bombardment." },
            { type: 'h2', content: "Fall of the Pearl Throne" },
            { type: 'p', content: "On the final day of the siege, Barbara herself led the charge into the breached halls of the fortress. It is said that Craster, defiant until the end, faced his sister in the throne room. There, under the gazes of shattered ancestors carved in coral and stone, Barbara struck him down. When the sun set that day, she stood atop the crumbling battlements, the head of her brother impaled upon the ancestral trident, Tide Devil, a grim and unforgettable symbol of her victory." },
            { type: 'p', content: "The war for the Throne of Pearls had ended, but the repercussions of the conflict would echo through the Pearl Islands for generations. Barbara's victory not only marked the rise of House Lirs as a matriarchal power but also reshaped the cultural and political landscape of the islands, inspiring other coastal powers to embrace women as warriors, captains, and leaders." },
            { type: 'h1', content: "Aftermath" },
            { type: 'img', content: "/assets/books/pearl_war_aftermath.png", caption: "The Aftermath" },
            { type: 'p', content: "With the death of Craster Lirs and the fall of the Pearl Throne, the war for the Throne of Pearls reached a brutal and decisive conclusion. Lady Barbara Lirs emerged not only as the victor but as a symbol of a new era — a ruler forged by the tides, unyielding and unafraid. Her triumph was a signal that the islands had irrevocably changed." },
            { type: 'p', content: "In the immediate wake of her victory, Barbara consolidated her power with calculated precision. The surviving nobles who had supported Craster were given a choice: swear fealty to her or face exile to the open sea, a punishment as harsh as death for those who relied on the islands for their livelihood. Some chose exile, their ships vanishing into the horizon, while others bent the knee, unwilling to lose their homes and trade. The merchants, once the cornerstone of Craster's support, recognized the futility of resistance and aligned themselves with the new order." },
            { type: 'p', content: "House Carronvale of Driftwatch, left weakened and disgraced by their failure to defend Craster, faced repercussions. Barbara initially contemplated exacting vengeance upon them, but recognizing the value of their fleet and their knowledge of trade, she chose a different approach. Rather than dismantling House Carronvale, she demanded oaths of loyalty and a tithe of their maritime earnings. House Carronvale, realizing they could not withstand further conflict, accepted the terms. Over time, they adapted to the shifting power dynamics, their women joining their ships and guardhouses, integrating into the emerging matriarchal order." },
            { type: 'h2', content: "Cultural Impact" },
            { type: 'p', content: "The Pearl War fundamentally transformed the islands' society. The once patriarchal structure gave way to a matriarchal order where women not only held power but were expected to wield it. Barbara's leadership inspired generations of daughters raised to command ships and wield weapons. The name \"Mermaid Islands\" replaced \"Pearl Islands,\" reflecting this new identity." },
            { type: 'p', content: "The Tide Devil trident became more than a symbol—it was the weapon that reshaped history. Each Lady of House Lirs swears an oath upon it, committing to protect the islands and maintain the matriarchal rule. The Pearl Throne was rebuilt as the Mermaid Throne, and the hall where Barbara killed her brother stands as both warning and testament to House Lirs' resolve." },
            { type: 'p', content: "House Lirs flourished in subsequent decades, becoming a formidable maritime power. Though small, the Mermaid Islands grew into a crucial trade center known for skilled sailors and fearsome captains. The matriarchal order became intrinsic to their identity, shaping how they fought, traded, and lived—Barbara's legacy enduring as the woman who changed the tides of history forever." }
        ]
    },
    {
        id: 'pale-kin-invasion',
        title: "The Pale Kin Invasion",
        author: "Maester Kaelen",
        releaseYear: "300 AW",
        coverUrl: "/assets/books/pale_kin_cover.png",
        content: [
            { type: 'h1', content: "The Pale Kin Invasion (299 AW)" },
            { type: 'p', content: "The Pale Kin Invasion (299 AW) was one of the most horrifying events in the history of The Whispers. A savage horde of pale-skinned raiders emerged from the frozen north, crossing the great lake in the northeast to descend upon the valley. These were no ordinary men—they were cannibals, hardened by generations of exile in the cold wastes, driven by hunger and a twisted sense of kinship." },
            { type: 'p', content: "Their attack on Ironpass was a massacre, leaving the settlement in ruin. Lord Brian Durnhart and his people were slaughtered, their bodies defiled in ways too gruesome to speak of. It was Lord Draymor Seryn, younger brother to the King and commander of the Knights of the Moon, who led the charge to reclaim Ironpass. What followed was not a battle, but a reckoning. The Pale Kin were butchered to the last, their leader, the infamous Bonechewer, slain by Draymor's blade." },
            { type: 'p', content: "In the aftermath, Draymor led settlers to the frozen lake's edge, establishing Wintermere, ensuring that never again would such horrors come from the north unchecked." },
            
            { type: 'h1', content: "I. Legends of the Pale Kin" },
            { type: 'img', content: "/assets/books/pale_kin_warriors.png", caption: "Artist's depiction of the Pale Kin warriors and their leader" },
            { type: 'p', content: "The origins of the Pale Kin are shrouded in myth and horror, whispered in hushed tones by the fires of The Whispers. It is said that long ago, a brother and sister of noble blood in Nightfall were discovered to be lovers. In their shame and disgrace, the ruling king exiled them beyond the frozen wastes of the north, condemning them to certain death. But death did not claim them. Against all odds, they survived, and in time, they bore children. Their bloodline grew into a hardened people, shaped by the merciless cold and endless hunger." },
            { type: 'p', content: "As their numbers swelled, they turned not only to hunting beasts, but to hunting men. Travelers who strayed too far north vanished without a trace, their bones later found gnawed clean in the snow. The Pale Kin, as they came to be known, embraced cannibalism as both necessity and ritual. Their flesh-eating ways were not simply for survival, but for power—they believed that by consuming their enemies, they took their strength. Some claimed they marked their bodies with blood sigils, that they drank marrow as if it were sacred wine. Others swore they worshiped a dark, nameless force from the ice, an ancient hunger that whispered to them in the howling winds." },
            { type: 'p', content: "The tales grew worse with time. Some said the Pale Kin could not feel the cold, that they painted their bodies in ash and bone dust to appear as specters in the snow. It was even rumored that they had become something other than human, their flesh cursed by centuries of inbreeding and dark rites. No one in The Whispers truly believed these horrors—until the winter of 299 AW, when the Pale Kin crossed the lake, and the nightmare became real." },

            { type: 'h1', content: "II. The Battle for Ironpass" },
            { type: 'h2', content: "The Massacre" },
            { type: 'img', content: "/assets/books/pale_kin_crossing.png", caption: "The Pale Kin crossing the frozen lake to invade The Whispers" },
            { type: 'p', content: "The Pale Kin's descent upon Ironpass was a massacre. Under the cover of summer's last breath, they crossed the frozen lake that separated the wild north from the lands of The Whispers. By the time the freeze began, they had already reached the valley, their crude boats abandoned on the shores of the freezing ice. What awaited Ironpass was not an army, but a horde—starved, feral, and insatiable." },
            { type: 'p', content: "The settlement was still young, its defenses weak. There was no southern gate, for no threat was ever expected from that direction. When the Pale Kin struck, they fell upon the town like wolves. They set fire to homes, dragged families into the streets, and butchered them beneath the rising sun. Lord Brian Durnhart, sworn protector of Ironpass, rallied what few warriors he had, but they were no match for the sheer savagery of the Kin. The lord was captured, bound, and forced to watch as his wife and people were slaughtered, defiled, and consumed before his eyes. When his son, Edric Durnhart, returned from a hunting trip to find his home in flames, he did not hesitate—he rode with all haste to Nightfall, carrying news of the atrocity." },
            { type: 'h2', content: "The Reckoning" },
            { type: 'img', content: "/assets/books/pale_kin_reckoning.png", caption: "Lord Draymor Seryn slays the Bonechewer at Ironpass" },
            { type: 'p', content: "The response was swift. Lord Draymor Seryn, younger brother to the King and commander of the Knights of the Moon, gathered his warriors and rode north with vengeance in his heart. What followed was no battle, but a reckoning. Clad in steel, mounted on their warhorses, the Knights of the Moon crashed into the Pale Kin like a storm, cutting them down with cold precision. The cannibals fought with mad fury, throwing themselves at the knights with jagged bone-blades and rusted iron, but they were no match for trained warriors in full plate." },
            { type: 'p', content: "The Bonechewer, leader of the Kin, stood his ground to the last, his teeth filed to points, his body scarred from a lifetime of ritual bloodletting. But his savagery meant nothing against the steel of the Seryn knights. He fell beneath Draymor's blade, his skull split open upon the red-stained snow. With their leader dead, the Kin broke and fled, hunted down by the knights and burned in great pyres outside Ironpass. The last of them were cut down in the frozen woods beyond the valley, their bodies left for the crows." },
            { type: 'p', content: "Ironpass had been saved, but the scars remained. Lord Brian Durnhart was found dead, his body mutilated beyond recognition. His son, Edric, took up his father's banner, vowing to never again allow such horror to touch their lands. In the aftermath, Lord Draymor was tasked with establishing a stronghold at the lake to ensure that nothing would ever cross its frozen surface again. Thus, Wintermere was founded, and the House of Draymor became the eternal watchmen of the frozen north." },
            
            { type: 'h1', content: "III. Legacy" },
            { type: 'h2', content: "House Durnhart & House Draymor" },
            { type: 'img', content: "/assets/books/pale_kin_legacy.png", caption: "The Frostguard of Wintermere keep eternal watch over the north" },
            { type: 'p', content: "To House Durnhart, the Pale Kin Invasion remains a bitter wound. The tragedy of Ironpass is carved into their history, a reminder of the price of weakness. Their warriors train relentlessly, their defenses never left wanting. What was once a simple settlement is now one of the most heavily fortified strongholds in the north, its walls reinforced with iron, its watchtowers manned day and night. No invader, human or otherwise, will ever take it unprepared again." },
            { type: 'p', content: "For House Draymor, their duty did not end with the Kin's defeat. Wintermere stands as a testament to their vigilance, a fortress of stone and ice perched upon the lake's edge. The Draymors are not like the rest of The Whispers—they have adapted to the cold, forsaking cavalry for the Frostguard, Wintermere's elite warriors." },
            { type: 'p', content: "Lord Draymor Seryn, who led the charge against the Pale Kin, became a legendary figure in The Whispers. His victory over the Bonechewer earned him the title \"The Pale Slayer,\" and his founding of Wintermere and House Draymor cemented his place in history. The Knights of the Moon, which he commanded, would later become an elite cavalry unit under House Seryn, while his own descendants would focus on the specialized infantry needed to guard the frozen north." },
            { type: 'h2', content: "Lingering Fears" },
            { type: 'p', content: "Though the Pale Kin were slaughtered and scattered, their legend did not die with them. Tales of their cannibalistic rituals, whispered prayers to the cold, and unnatural resilience still haunt the people of The Whispers. Some say that even now, remnants of their cursed bloodline still hide in the frozen wastes beyond Wintermere, waiting for the summer thaw. Hunters and traders who venture too far into the northern wilderness claim to have seen pale figures watching from the trees, their breath steaming in the frigid air. Whether these are merely ghosts of the past or something far worse, none can say." },
            { type: 'p', content: "But the greatest fear does not lie in the past. It lies in the future—in the idea that the Pale Kin were only the first. That beyond the lake, deeper into the ice-choked wilderness, something far older, far hungrier, still lingers. The Kin may have been driven south by desperation, but what if they were running from something worse?" },
            { type: 'p', content: "The people of The Whispers still tell stories in the dead of winter—of things that move through the snow without sound, of voices carried on the wind, of laughter echoing in the night. They call it nonsense, the ramblings of old men and frightened children. But when the summer comes, and the lake melts once more, no one dares look north." }
        ]
    },
    {
        id: 'lunar-luminaries',
        title: "The Lunar Luminaries: A Study of the Moon’s Chosen",
        author: "Maester Alister",
        releaseYear: "733 AW",
        coverUrl: "/assets/books/luminaries_cover.png",
        content: [
            { type: 'h1', content: "The Lunar Luminaries: A Study of the Moon’s Chosen" },
            { type: 'p', content: "The spiritual landscape of The Whispers is defined by the Moon’s Creed, but its endurance is rooted in the history of the 'Sons and Daughters of the Moon.' These individuals, appearing in our darkest hours, serve as both catalysts for survival and anchors for our collective faith. This study examines four such figures whose legacies continue to shape our world." },
            
            { type: 'h1', content: "I. The Elias Paradigm (30 AW) – The Shepherd of Nightfall" },
            { type: 'img', content: "/assets/books/elias_nightfall.png", caption: "Elias sharing food with a child during the Frozen Moon" },
            { type: 'h2', content: "The Frozen Nightfall" },
            { type: 'p', content: "The Year of the Frozen Moon (30 AW) was a period of unprecedented hardship. An unnatural winter descended upon the region, testing the resilience of its people and giving rise to the legend of the 'Sons and Daughters of the Moon.' While smaller villages suffered, Nightfall, our capital, was at the heart of the crisis. Crops failed, rivers froze solid, and hunger gripped the people." },
            { type: 'p', content: "Snow piled higher than the city walls, and the cold was so intense that it cracked stone and froze men in their tracks. Families huddled together, burning furniture and books when firewood ran out. Hope began to fade, and even the most faithful began to question whether the Moon had abandoned them." },
            { type: 'h2', content: "The Shepherd's Light" },
            { type: 'p', content: "Amidst this despair, a priest named Elias emerged as a beacon of light. He traveled tirelessly through the frozen streets, tending to the sick and distributing what little food remained. Miraculously, he uncovered hidden stores of food and brought warmth where it was most needed." },
            { type: 'p', content: "Witnesses claimed Elias could walk barefoot through snow without leaving footprints, that food multiplied in his presence, and that the sick were healed by his touch. Most remarkable was his ability to predict where help was needed, appearing with a lantern before cries for aid could be raised. Whether divine or simply a man of extraordinary devotion, his presence carried the city through the unyielding frost." },
            { type: 'p', content: "When the ice finally thawed, accounts of Elias's fate varied. Some say he disappeared with the last of the snow; others claim he ascended to the moon itself. Regardless, his legacy transformed the Moon's Creed from a regional faith into the dominant religion of The Whispers." },
            { type: 'note', content: "Many early records of Elias are purely hagiographical, but the sudden stabilization of Nightfall's food supply during the 30 AW famine is an indisputable historical fact that remains unexplained." },

            { type: 'h1', content: "II. Aric the Deep-Watcher (212 AW) – The Echo of Ironpass" },
            { type: 'img', content: "/assets/books/aric_ironpass.png", caption: "Artist's depiction of Aric guiding the miners through the darkness" },
            { type: 'p', content: "A fascinating case from the House Dunhart archives. During the Great Cave-In of 212 AW, forty miners were trapped in the deepest iron veins of Ironpass. Aric, a young blind laborer, claimed he could 'hear the moon's pulse' through the solid rock." },
            { type: 'p', content: "He led the survivors through three miles of uncharted, pitch-black tunnels for four days. While skeptics suggest he possessed an acute sense of echolocation or an intimate knowledge of the mountain's fault lines, the survivors maintain that a 'silver hum' guided their every step to the surface." },
            { type: 'note', content: "Aric's later years were spent in seclusion, where he reportedly drew maps of the Ironpass depths that were accurate to within inches, despite his blindness. This suggests a sensory perception far beyond normal human capability." },

            { type: 'h1', content: "III. Vespera’s Alchemical Grace (411 AW) – The Healer of Embris" },
            { type: 'img', content: "/assets/books/vespera_embris.png", caption: "Vespera working on a cure during the Embris plague" },
            { type: 'p', content: "In 411 AW, the port city of Embris was ravaged by a deadly plague. Vespera, an alchemist of the Alchemy Guild, recognized the symptoms and tirelessly worked to find a cure. She proved that the Moon’s guidance could manifest as the clarity of a sharp mind." },
            { type: 'p', content: "By synthesizing a potent antidote, she saved the House Olaris trade hub from total collapse. Her actions transformed her into a legend, solidifying her place as a 'Daughter of the Moon' and proving that knowledge and compassion could be as powerful as faith." },
            { type: 'note', content: "Vespera’s 'miracle' was a triumph of systematic research. Her journals, which I have personally reviewed, show a woman who saw the Moon's light as the ultimate source of scientific clarity." },

            { type: 'h1', content: "IV. Leo, the Beacon's Shield (569 AW) – The Guardian of Driftwatch" },
            { type: 'img', content: "/assets/books/leo_lighthouse.png", caption: "Leo rescuing children from the burning orphanage, 'Leo's Lighthouse'" },
            { type: 'p', content: "The most recent example of the Moon’s protection. Leo was the humble caretaker of the Driftwatch orphanage, a ramshackle wooden structure known locally as 'Leo's Lighthouse' for the single lantern he kept burning in the top window to guide lost sailors. During the Great Driftwatch Fire of 569 AW, the dry timber of the orphanage became a death trap." },
            { type: 'p', content: "Leo braved the inferno to save sixteen children. His final act—pushing the last child through a high window just as the wooden roof collapsed—is why the rebuilt stone sanctuary bears his name today. He proved that the Moon’s protection is often found in the simplest acts of sacrifice." },
            { type: 'note', content: "The present-day stone orphanage was built on the same site to honor his memory. To this day, the children of Driftwatch are told that the lantern light in the window is Leo's spirit still watching over the harbor." },

            { type: 'h1', content: "Conclusion: The Recurring Light" },
            { type: 'p', content: "In examining these four disparate figures—a priest, a miner, an alchemist, and a caretaker—we find a common thread. The Moon’s chosen are rarely the powerful or the noble; they are the dedicated, the observant, and the selfless. Whether their abilities are divine or simply the peak of human potential under pressure, their appearance marks the survival of our people through every era of shadow." },
            { type: 'p', content: "As the summer comes and the tides turn, we must remember: the Moon does not just watch from above; it acts through the hands of those below." }
        ]
    }
];

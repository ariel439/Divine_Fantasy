
import React from 'react';
import type { Item, Npc, Quest, Slide, Recipe, Combatant, EquipmentSlot, DialogueOption, Book, BookContent } from './types';
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
    agility: ['Slow', 'Quick', 'Swift', 'Blazing'],
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
    3: 'Apprentice',
    4: 'Adept',
    5: 'Adept',
    6: 'Expert',
    7: 'Expert',
    8: 'Master',
    9: 'Master',
    10: 'Grandmaster',
};

export const getDescriptiveSkillLabel = (level: number): string => {
    return skillProficiencyLabels[level] || 'Untrained';
};


export const characters = [
    {
        name: 'Luke',
        age: 19,
        difficulty: 'Hard',
        title: 'The Driftwatch Orphan',
        image: 'https://i.imgur.com/gUNzyBA.jpeg',
        description: "Born to a tragic fate, Luke's mother died in childbirth and his fisherman father was lost to the unforgiving sea. He was raised in Leo's Lighthouse, an orphanage in the salt-sprayed city of Driftwatch, alongside his only friends, Sarah, Robert, and Kyle. His past is a tapestry of loss, but his sharp mind is a beacon of potential, promising a future far grander than his humble beginnings in the Whispers region.",
        attributes: { strength: 4, dexterity: 6, intelligence: 8, wisdom: 5, charisma: 3 }
    }
];

export const lukePrologueSlides: Slide[] = [
  {
    image: "https://i.imgur.com/tYATeUX.jpeg",
    text: "The story of Luke begins, as many in the Whispers do, with the sea's cruel embrace. His mother, Elara, succumbed to childbirth's fevered grip, and his father, a fisherman named Gareth, was claimed by a sudden squall that showed no mercy. Orphaned before he could even speak his name, he was brought to Leo's Lighthouse, a beacon of hope standing defiant against the salt-sprayed cliffs of Driftwatch. Here, under the watchful eye of the kindly Old Leo, his life truly began."
  },
  {
    image: "https://i.imgur.com/Hy0z6aZ.jpeg",
    text: "In the orphanage's quiet halls, he forged a family not of blood, but of bond. There was Sarah, whose sweet nature made her the steadfast 'mother' of their small group; Robert, the strong, serious boy who dreamed of a life beyond the docks; and young Kyle, whose mischievous grin was a constant source of trouble and laughter. Surrounded by his only friends, Luke's tragic past became a foundation, not an anchor. His sharp mind, a gift from a life of observation, became his tool—a beacon of potential promising a future far grander than his humble beginnings."
  }
];

export const wakeupEventSlides: Slide[] = [
  {
    image: "/assets/locations/salty_mug_rented_room.png",
    text: "You wake in a cramped room at the Salty Mug. Old Man Finn bangs on the door: ‘Two months without rent, kid. Out.’ The lesson ends. The day begins."
  },
  {
    image: "/assets/locations/driftwatch_slums_day.png",
    text: "Kicked to the streets, you step into Driftwatch’s slums. The real world doesn’t wait—and neither should you."
  }
];

export const finnDebtIntroSlides: Slide[] = [
  {
    image: "/assets/locations/salty_mug_rented_room.png",
    text: "You wake to Old Man Finn staring down, a guard idling beside him—knife glinting."
  }
];

export const breakfastEventSlides: Slide[] = [
  {
    image: "/assets/events/luke_breakfast.png",
    text: "You share a simple breakfast at Leo’s Lighthouse—warm bread, salted fish, and a quiet moment before the day."
  }
];

export const playEventSlidesSarah: Slide[] = [
  {
    image: "/assets/events/luke_play_together.png",
    text: "You spend time with Sarah, helping tidy the common room and laughing at quiet memories. Her calm steadies you more than you'd admit."
  }
];

export const playEventSlidesRobert: Slide[] = [
  {
    image: "/assets/events/luke_play_together.png",
    text: "You trade jabs with Robert and talk dreams bigger than the docks. Work hard, aim higher, and don't let the wind decide your path."
  }
];

export const playEventSlidesAlone: Slide[] = [
  {
    image: "/assets/events/luke_play_alone.png",
    text: "You spend a quiet hour by yourself. The lighthouse hums with distant voices, but your thoughts are your own—clear, steady, and sharp."
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
      obedience: { value: 5, max: 100 },
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
      obedience: { value: 15, max: 100 },
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
      obedience: { value: 25, max: 100 },
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
      obedience: { value: 40, max: 100 },
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
      obedience: { value: 50, max: 100 },
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
        energyCost: 0,
    },
    {
        id: 'recipe1',
        skill: 'Carpentry',
        levelRequired: 1,
        result: {
            id: 'c1', name: 'Wooden Stool', description: 'A simple, sturdy stool. Better than sitting on the floor.', icon: React.createElement(Armchair, { size: 24, className: "text-orange-400" }), category: 'Tool', weight: 3.0, base_value: 15, stackable: false, actions: ['Drop']
        },
        ingredients: [
            { itemId: '1', quantity: 5 }, // 5 Driftwood
        ],
        timeCost: 8,
        energyCost: 10,
    },
    {
        id: 'recipe2',
        skill: 'Carpentry',
        levelRequired: 3,
        result: {
            id: 'c2', name: 'Sturdy Chest', description: 'A small chest to store your belongings.', icon: React.createElement(Backpack, { size: 24, className: "text-orange-500" }), category: 'Tool', weight: 10.0, base_value: 50, stackable: false, actions: ['Drop']
        },
        ingredients: [
            { itemId: '1', quantity: 10 }, // 10 Driftwood
            { itemId: '6', quantity: 2 }, // 2 Iron Ore
        ],
        timeCost: 30,
        energyCost: 25,
    },
    {
        id: 'recipe3',
        skill: 'Cooking',
        levelRequired: 1,
        result: {
            id: 'c3', name: 'Grilled Fish', description: 'A simple but satisfying meal.', icon: React.createElement(UtensilsCrossed, { size: 24, className: "text-amber-300" }), category: 'Consumable', weight: 0.4, base_value: 20, stackable: true, quantity: 1, effects: { 'Restores': '30 Hunger' }, actions: ['Use', 'Drop']
        },
        ingredients: [
            { itemId: '2', quantity: 1 }, // 1 Salted Fish
        ],
        timeCost: 2,
        energyCost: 5,
    },
    {
        id: 'recipe4',
        skill: 'Cooking',
        levelRequired: 2,
        result: {
            id: 'c4', name: 'Fish Stew', description: 'A hearty stew that warms the soul.', icon: React.createElement(CookingPot, { size: 24, className: "text-amber-400" }), category: 'Consumable', weight: 0.8, base_value: 45, stackable: true, quantity: 1, effects: { 'Restores': '60 Hunger', 'Warms': 'Slightly' }, actions: ['Use', 'Drop']
        },
        ingredients: [
            { itemId: '2', quantity: 2 }, // 2 Salted Fish
            { itemId: '5', quantity: 1 }, // 1 Red Apple
        ],
        timeCost: 5,
        energyCost: 15,
    },
];

export const mockParty: Combatant[] = [
    {
        id: 'luke',
        name: 'Luke',
        hp: 85,
        maxHp: 100,
        portraitUrl: 'https://i.imgur.com/gUNzyBA.jpeg',
    },
    {
        id: 'wolf_puppy',
        name: 'Wolf Puppy',
        hp: 80,
        maxHp: 80,
        portraitUrl: 'https://i.imgur.com/DS1LuU3.png',
    }
];

export const mockEnemies: Combatant[] = [
    {
        id: 'wolf1',
        name: 'Rabid Wolf',
        hp: 45,
        maxHp: 45,
        portraitUrl: 'https://i.imgur.com/NXT2T8Q.png',
    },
    {
        id: 'wolf2',
        name: 'Alpha Wolf',
        hp: 70,
        maxHp: 70,
        portraitUrl: 'https://i.imgur.com/NXT2T8Q.png',
    },
    {
        id: 'wolf3',
        name: 'Shadow Wolf',
        hp: 55,
        maxHp: 55,
        portraitUrl: 'https://i.imgur.com/NXT2T8Q.png',
    },
    {
        id: 'wolf4',
        name: 'Dire Wolf',
        hp: 60,
        maxHp: 60,
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
    }
];

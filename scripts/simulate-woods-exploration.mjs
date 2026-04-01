import enemies from '../src/data/enemies.json' with { type: 'json' };
import explorationEvents from '../src/data/exploration_events.json' with { type: 'json' };
import items from '../src/data/items.json' with { type: 'json' };

const TRIPS = Number.parseInt(process.argv[2] || '100', 10);
const RUNS = Number.parseInt(process.argv[3] || '1000', 10);
const SHOW_TRIP_LOG = process.argv.includes('--log');

const WOODS_EVENTS = explorationEvents.filter((event) => event.locations?.includes('driftwatch_woods'));
const TOTAL_WEIGHT = WOODS_EVENTS.reduce((sum, event) => sum + event.weight, 0);
const FOREST_WOLF = enemies.wolf_forest;
const ENERGY_RESTORE_PER_HOUR = 10;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWeightedEvent() {
  const roll = Math.random() * TOTAL_WEIGHT;
  let cursor = 0;
  for (const event of WOODS_EVENTS) {
    cursor += event.weight;
    if (roll < cursor) return event.id;
  }
  return WOODS_EVENTS[WOODS_EVENTS.length - 1].id;
}

function addItem(items, itemId, quantity) {
  items[itemId] = (items[itemId] || 0) + quantity;
}

function getItemBaseValue(itemId) {
  return items[itemId]?.base_value ?? 0;
}

function getItemHunger(itemId) {
  return items[itemId]?.effects?.hunger ?? 0;
}

function resolveWolfCount() {
  const roll = Math.random();
  if (roll > 0.9) return 4;
  if (roll > 0.6) return 2;
  return 1;
}

function rollWolfLoot(items, wolfCount, mirroredItems = null) {
  for (let i = 0; i < wolfCount; i += 1) {
    for (const loot of FOREST_WOLF.loot_table || []) {
      if (Math.random() <= (loot.chance ?? 1)) {
        addItem(items, loot.item_id, loot.quantity ?? 1);
        if (mirroredItems) {
          addItem(mirroredItems, loot.item_id, loot.quantity ?? 1);
        }
      }
    }
  }
}

function createBatchResult(trips) {
  const result = {
    trips,
    tripLog: [],
    spent: {
      timeMinutes: trips * 30,
      energy: trips * 20,
      hunger: trips,
      hpFromEvents: 0,
    },
    gained: {
      copper: 0,
      woodcuttingXp: 0,
      items: {},
      baseValueFromItems: 0,
      directHungerFromItems: 0,
      fruitSaladsCraftable: 0,
      potentialFruitSaladHunger: 0,
      cookableMeatServings: 0,
      potentialCookedMeatHunger: 0,
    },
    events: {
      apple_tree: 0,
      pear_tree: 0,
      blackberry_bramble: 0,
      fallen_log: 0,
      abandoned_campsite: 0,
      hollow_stump: 0,
      fresh_grave: 0,
      wolf_pack: 0,
    },
    wolves: {
      encounters: 0,
      totalWolves: 0,
      oneWolf: 0,
      twoWolves: 0,
      fourWolves: 0,
    },
    assumptions: {
      hasAxe: true,
      hasSpade: true,
      alwaysTakesRewardChoice: true,
      wolfLootAssumesVictory: true,
      combatHpLossNotSimulated: true,
    },
  };

  for (let i = 0; i < trips; i += 1) {
    const eventId = pickWeightedEvent();
    result.events[eventId] += 1;
    const tripEntry = {
      trip: i + 1,
      eventId,
      gained: { copper: 0, xp: 0, items: {} },
      spent: { hp: 0 },
      notes: [],
    };

    switch (eventId) {
      case 'apple_tree': {
        const qty = randomInt(1, 3);
        addItem(result.gained.items, 'apple', qty);
        addItem(tripEntry.gained.items, 'apple', qty);
        if (Math.random() < 0.3) {
          result.spent.hpFromEvents += 5;
          tripEntry.spent.hp += 5;
        }
        break;
      }
      case 'pear_tree': {
        const qty = randomInt(1, 3);
        addItem(result.gained.items, 'pear', qty);
        addItem(tripEntry.gained.items, 'pear', qty);
        if (Math.random() < 0.25) {
          result.spent.hpFromEvents += 5;
          tripEntry.spent.hp += 5;
        }
        break;
      }
      case 'blackberry_bramble': {
        const qty = randomInt(1, 3);
        addItem(result.gained.items, 'blackberries', qty);
        addItem(tripEntry.gained.items, 'blackberries', qty);
        if (Math.random() < 0.35) {
          result.spent.hpFromEvents += 3;
          tripEntry.spent.hp += 3;
        }
        break;
      }
      case 'fallen_log': {
        const qty = randomInt(1, 3);
        addItem(result.gained.items, 'log', qty);
        result.gained.woodcuttingXp += qty * 30;
        addItem(tripEntry.gained.items, 'log', qty);
        tripEntry.gained.xp += qty * 30;
        break;
      }
      case 'abandoned_campsite': {
        const roll = Math.random();
        if (roll < 0.45) {
          const copper = randomInt(5, 15);
          result.gained.copper += copper;
          tripEntry.gained.copper += copper;
        } else if (roll < 0.70) {
          addItem(result.gained.items, 'stale_bread', 1);
          addItem(tripEntry.gained.items, 'stale_bread', 1);
        } else if (roll < 0.85) {
          addItem(result.gained.items, 'bread', 1);
          addItem(tripEntry.gained.items, 'bread', 1);
        } else {
          addItem(result.gained.items, 'rope', 1);
          addItem(tripEntry.gained.items, 'rope', 1);
        }
        break;
      }
      case 'hollow_stump': {
        const rewardRoll = Math.random();
        if (rewardRoll < 0.50) {
          const copper = randomInt(5, 12);
          result.gained.copper += copper;
          tripEntry.gained.copper += copper;
        } else if (rewardRoll < 0.70) {
          addItem(result.gained.items, 'rope', 1);
          addItem(tripEntry.gained.items, 'rope', 1);
        } else if (rewardRoll < 0.90) {
          addItem(result.gained.items, 'apple', 1);
          addItem(tripEntry.gained.items, 'apple', 1);
        } else {
          addItem(result.gained.items, 'wolf_tooth', 1);
          addItem(tripEntry.gained.items, 'wolf_tooth', 1);
        }
        if (Math.random() < 0.25) {
          result.spent.hpFromEvents += 3;
          tripEntry.spent.hp += 3;
        }
        break;
      }
      case 'fresh_grave': {
        const roll = Math.random();
        if (roll < 0.70) {
          const copper = randomInt(10, 25);
          result.gained.copper += copper;
          tripEntry.gained.copper += copper;
        } else if (roll < 0.95) {
          addItem(result.gained.items, 'bronze_ring', 1);
          addItem(tripEntry.gained.items, 'bronze_ring', 1);
        } else {
          addItem(result.gained.items, 'simple_silver_ring', 1);
          addItem(tripEntry.gained.items, 'simple_silver_ring', 1);
        }
        break;
      }
      case 'wolf_pack': {
        const wolfCount = resolveWolfCount();
        result.wolves.encounters += 1;
        result.wolves.totalWolves += wolfCount;
        if (wolfCount === 1) result.wolves.oneWolf += 1;
        if (wolfCount === 2) result.wolves.twoWolves += 1;
        if (wolfCount === 4) result.wolves.fourWolves += 1;
        rollWolfLoot(result.gained.items, wolfCount, tripEntry.gained.items);
        tripEntry.notes.push(`wolves=${wolfCount}`);
        break;
      }
      default:
        break;
    }

    result.tripLog.push(tripEntry);
  }

  return result;
}

function mergeBatchIntoAggregate(aggregate, batch) {
  aggregate.spent.timeMinutes += batch.spent.timeMinutes;
  aggregate.spent.energy += batch.spent.energy;
  aggregate.spent.hunger += batch.spent.hunger;
  aggregate.spent.hpFromEvents += batch.spent.hpFromEvents;
  aggregate.gained.copper += batch.gained.copper;
  aggregate.gained.woodcuttingXp += batch.gained.woodcuttingXp;
  aggregate.gained.baseValueFromItems += batch.gained.baseValueFromItems;
  aggregate.gained.directHungerFromItems += batch.gained.directHungerFromItems;
  aggregate.gained.fruitSaladsCraftable += batch.gained.fruitSaladsCraftable;
  aggregate.gained.potentialFruitSaladHunger += batch.gained.potentialFruitSaladHunger;
  aggregate.gained.cookableMeatServings += batch.gained.cookableMeatServings;
  aggregate.gained.potentialCookedMeatHunger += batch.gained.potentialCookedMeatHunger;

  for (const [eventId, count] of Object.entries(batch.events)) {
    aggregate.events[eventId] = (aggregate.events[eventId] || 0) + count;
  }
  for (const [key, value] of Object.entries(batch.wolves)) {
    aggregate.wolves[key] = (aggregate.wolves[key] || 0) + value;
  }
  for (const [itemId, quantity] of Object.entries(batch.gained.items)) {
    aggregate.gained.items[itemId] = (aggregate.gained.items[itemId] || 0) + quantity;
  }
}

function averageAggregate(aggregate, runs) {
  const averaged = JSON.parse(JSON.stringify(aggregate));
  averaged.spent.timeMinutes /= runs;
  averaged.spent.energy /= runs;
  averaged.spent.hunger /= runs;
  averaged.spent.hpFromEvents /= runs;
  averaged.gained.copper /= runs;
  averaged.gained.woodcuttingXp /= runs;
  averaged.gained.baseValueFromItems /= runs;
  averaged.gained.directHungerFromItems /= runs;
  averaged.gained.fruitSaladsCraftable /= runs;
  averaged.gained.potentialFruitSaladHunger /= runs;
  averaged.gained.cookableMeatServings /= runs;
  averaged.gained.potentialCookedMeatHunger /= runs;

  for (const key of Object.keys(averaged.events)) averaged.events[key] /= runs;
  for (const key of Object.keys(averaged.wolves)) averaged.wolves[key] /= runs;
  for (const key of Object.keys(averaged.gained.items)) averaged.gained.items[key] /= runs;

  return averaged;
}

function printBatch(label, result) {
  const itemBaseValue = Object.entries(result.gained.items).reduce(
    (sum, [itemId, quantity]) => sum + getItemBaseValue(itemId) * Number(quantity),
    0
  );
  const directHungerFromItems = Object.entries(result.gained.items).reduce(
    (sum, [itemId, quantity]) => sum + getItemHunger(itemId) * Number(quantity),
    0
  );
  const fruitSaladsCraftable = Math.floor(
    Math.min(
      Number(result.gained.items.apple || 0),
      Number(result.gained.items.pear || 0),
      Number(result.gained.items.blackberries || 0)
    )
  );
  const cookableMeatServings = Math.floor(Number(result.gained.items.raw_meat || 0));
  const potentialFruitSaladHunger = fruitSaladsCraftable * getItemHunger('food_fruit_salad');
  const potentialCookedMeatHunger = cookableMeatServings * getItemHunger('cooked_meat');
  const totalCurrencyValue = itemBaseValue + Number(result.gained.copper);
  const bedSleepHoursNeeded = Number(result.spent.energy) / (ENERGY_RESTORE_PER_HOUR * 1.0);
  const groundSleepHoursNeeded = Number(result.spent.energy) / (ENERGY_RESTORE_PER_HOUR * 0.5);
  const totalLoopHoursWithBedSleep = Number(result.spent.timeMinutes) / 60 + bedSleepHoursNeeded;
  const totalLoopHoursWithGroundSleep = Number(result.spent.timeMinutes) / 60 + groundSleepHoursNeeded;

  result.gained.baseValueFromItems = itemBaseValue;
  result.gained.directHungerFromItems = directHungerFromItems;
  result.gained.fruitSaladsCraftable = fruitSaladsCraftable;
  result.gained.potentialFruitSaladHunger = potentialFruitSaladHunger;
  result.gained.cookableMeatServings = cookableMeatServings;
  result.gained.potentialCookedMeatHunger = potentialCookedMeatHunger;

  console.log(`\n=== ${label} ===`);
  console.log(`Trips: ${result.trips}`);
  console.log('Spent:');
  console.log(`  Time: ${result.spent.timeMinutes} minutes (${(result.spent.timeMinutes / 60).toFixed(1)} hours)`);
  console.log(`  Energy: ${result.spent.energy}`);
  console.log(`  Hunger: ${result.spent.hunger}`);
  console.log(`  HP lost from event damage only: ${result.spent.hpFromEvents}`);
  console.log('Recovery estimate:');
  console.log(`  Bed sleep needed to restore energy: ${bedSleepHoursNeeded.toFixed(2)} hours`);
  console.log(`  Ground sleep needed to restore energy: ${groundSleepHoursNeeded.toFixed(2)} hours`);
  console.log(`  Total loop time with bed sleep: ${totalLoopHoursWithBedSleep.toFixed(2)} hours`);
  console.log(`  Total loop time with ground sleep: ${totalLoopHoursWithGroundSleep.toFixed(2)} hours`);
  console.log('Gained:');
  console.log(`  Copper: ${result.gained.copper.toFixed ? result.gained.copper.toFixed(2) : result.gained.copper}`);
  console.log(`  Woodcutting XP: ${result.gained.woodcuttingXp.toFixed ? result.gained.woodcuttingXp.toFixed(2) : result.gained.woodcuttingXp}`);
  console.log(`  Base value of gathered items: ${itemBaseValue.toFixed(2)} copper`);
  console.log(`  Total raw haul value incl. copper: ${totalCurrencyValue.toFixed(2)} copper`);
  console.log(`  Direct hunger in gathered consumables: ${directHungerFromItems.toFixed(2)}`);
  console.log(`  Craftable Fruit Salads: ${fruitSaladsCraftable} (${potentialFruitSaladHunger} hunger if cooked)`);
  console.log(`  Cookable meat servings: ${cookableMeatServings} (${potentialCookedMeatHunger} hunger if cooked)`);
  console.log('  Items:');
  for (const [itemId, quantity] of Object.entries(result.gained.items).sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    console.log(`    ${itemId}: ${Number(quantity).toFixed(2)}`);
  }
  console.log('Events hit:');
  for (const [eventId, count] of Object.entries(result.events)) {
    console.log(`  ${eventId}: ${Number(count).toFixed(2)}`);
  }
  console.log('Wolf encounters:');
  console.log(`  Encounters: ${Number(result.wolves.encounters).toFixed(2)}`);
  console.log(`  Total wolves: ${Number(result.wolves.totalWolves).toFixed(2)}`);
  console.log(`  1 wolf: ${Number(result.wolves.oneWolf).toFixed(2)}`);
  console.log(`  2 wolves: ${Number(result.wolves.twoWolves).toFixed(2)}`);
  console.log(`  4 wolves: ${Number(result.wolves.fourWolves).toFixed(2)}`);

  if (SHOW_TRIP_LOG) {
    console.log('Trip log:');
    for (const entry of result.tripLog) {
      const itemText = Object.entries(entry.gained.items)
        .map(([itemId, quantity]) => `${itemId} x${quantity}`)
        .join(', ');
      const parts = [`#${entry.trip}`, entry.eventId];
      if (entry.gained.copper) parts.push(`copper +${entry.gained.copper}`);
      if (entry.gained.xp) parts.push(`xp +${entry.gained.xp}`);
      if (itemText) parts.push(itemText);
      if (entry.spent.hp) parts.push(`hp -${entry.spent.hp}`);
      if (entry.notes.length) parts.push(entry.notes.join(', '));
      console.log(`  ${parts.join(' | ')}`);
    }
  }
}

const sample = createBatchResult(TRIPS);

const aggregate = {
  spent: { timeMinutes: 0, energy: 0, hunger: 0, hpFromEvents: 0 },
  gained: {
    copper: 0,
    woodcuttingXp: 0,
    items: {},
    baseValueFromItems: 0,
    directHungerFromItems: 0,
    fruitSaladsCraftable: 0,
    potentialFruitSaladHunger: 0,
    cookableMeatServings: 0,
    potentialCookedMeatHunger: 0,
  },
  events: {},
  wolves: {},
};

for (let i = 0; i < RUNS; i += 1) {
  mergeBatchIntoAggregate(aggregate, createBatchResult(TRIPS));
}

const averages = averageAggregate(aggregate, RUNS);
averages.trips = TRIPS;

console.log('Woods exploration simulator');
console.log(`Assumptions: has axe, has spade, always takes the reward choice, wolf fights are treated as victories for loot, combat HP loss is not simulated.`);
console.log(`Configured for ${TRIPS} trips per batch.`);

printBatch('Single Sample Batch', sample);
if (RUNS > 1) {
  printBatch(`Average Across ${RUNS} Batches`, averages);
}

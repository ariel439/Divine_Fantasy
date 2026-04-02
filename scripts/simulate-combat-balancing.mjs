import items from '../src/data/items.json' with { type: 'json' };
import enemies from '../src/data/enemies.json' with { type: 'json' };
import templates from '../src/data/character_templates.json' with { type: 'json' };

const TRIALS = Number.parseInt(process.argv[2] || '10000', 10);

const COMBAT_CONFIG = {
  BASE_HIT_CHANCE: {
    PLAYER: 0.9,
    COMPANION: 0.8,
    ENEMY: 0.75,
  },
  DAMAGE_FORMULA: {
    PLAYER_MULTIPLIER: 1.85,
    PLAYER_DEFENCE_FACTOR: 0.26,
    COMPANION_MULTIPLIER: 1.5,
    COMPANION_DEFENCE_FACTOR: 0.35,
    ENEMY_MULTIPLIER: 1.5,
    ENEMY_DEFENCE_FACTOR: 0.62,
    MIN_DAMAGE: {
      PLAYER: 5,
      COMPANION: 2,
      ENEMY: 3,
    },
  },
};

const WOLF_DAMAGE_MULTIPLIER = Number.parseFloat(process.env.WOLF_DAMAGE_MULTIPLIER || '0.88');
const WOLF_MIN_DAMAGE = Number.parseInt(process.env.WOLF_MIN_DAMAGE || `${COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.ENEMY}`, 10);
const WOLF_BLEED_LOW = Number.parseFloat(process.env.WOLF_BLEED_LOW || '1');
const WOLF_BLEED_MID = Number.parseFloat(process.env.WOLF_BLEED_MID || '0.4');
const WOLF_BLEED_LOW_STACK = Number.parseInt(process.env.WOLF_BLEED_LOW_STACK || '2', 10);
const WOLF_BLEED_MID_STACK = Number.parseInt(process.env.WOLF_BLEED_MID_STACK || '1', 10);
const T4_EXTRA_DEFENCE = Number.parseInt(process.env.T4_EXTRA_DEFENCE || '0', 10);
const WOLF_HEAVY_ARMOR_THRESHOLD = Number.parseInt(process.env.WOLF_HEAVY_ARMOR_THRESHOLD || '999', 10);
const WOLF_HEAVY_ARMOR_DAMAGE_REDUCTION = Number.parseInt(process.env.WOLF_HEAVY_ARMOR_DAMAGE_REDUCTION || '0', 10);
const ENEMY_DAMAGE_MULTIPLIER = Number.parseFloat(process.env.ENEMY_DAMAGE_MULTIPLIER || `${COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_MULTIPLIER}`);
const ENEMY_DEFENCE_FACTOR = Number.parseFloat(process.env.ENEMY_DEFENCE_FACTOR || `${COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_DEFENCE_FACTOR}`);
const ENEMY_MIN_DAMAGE = Number.parseInt(process.env.ENEMY_MIN_DAMAGE || `${COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.ENEMY}`, 10);
const BLEED_DAMAGE_MODE = process.env.BLEED_DAMAGE_MODE || 'ceil_quarter';
const BLEED_DECAY_MODE = process.env.BLEED_DECAY_MODE || 'persistent';
const OUT_OF_COMBAT_BLEED_DECAY = Number.parseInt(process.env.OUT_OF_COMBAT_BLEED_DECAY || '1', 10);

const lukeTemplate = templates.luke_orphan;
const renZhen = enemies.ren_zhen_shadow;
const forestWolf = enemies.wolf_forest;

const loadouts = [
  {
    id: 't1_naked',
    label: 'T1 Naked',
    items: [],
  },
  {
    id: 't2_leather',
    label: 'T2 Crude Knife + Leather Set + Wooden Shield',
    items: ['crude_knife', 'leather_cap', 'leather_jerkin', 'leather_leggings', 'wooden_shield'],
  },
  {
    id: 't3_chain',
    label: 'T3 Full Chainmail + Bronze Sword + Bronze Shield',
    items: ['chain_coif', 'chainmail_shirt', 'chainmail_leggings', 'bronze_sword', 'bronze_shield'],
  },
  {
    id: 't4_iron',
    label: 'T4 Full Iron + Iron Sword + Iron Shield',
    items: ['iron_helmet', 'iron_chainmail', 'iron_leggings', 'iron_sword', 'iron_shield'],
  },
];

const skillProfiles = [
  {
    id: 't1_skills',
    label: 'T1 Skill Levels',
    melee: 1,
    constitution: 1,
  },
  {
    id: 't2_skills',
    label: 'T2 Skill Levels',
    melee: 10,
    constitution: 10,
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeStats(item) {
  const stats = item?.stats || {};
  return Object.keys(stats).reduce((acc, key) => {
    acc[key.toLowerCase()] = stats[key];
    return acc;
  }, {});
}

function getMeleeMilestoneMultiplier(level) {
  return 1 + Math.floor(level / 10) * 0.1;
}

function getConstitutionHpBonus(level) {
  return Math.floor(level / 10) * 10;
}

function buildPlayer(loadout, skillProfile) {
  const strength = lukeTemplate.starting_attributes.Strength;
  const dexterity = lukeTemplate.starting_attributes.Dexterity;

  let attack = strength;
  let defence = Math.floor((strength + dexterity) / 2);
  let totalDexterity = dexterity;
  let bonusHp = 0;

  for (const itemId of loadout.items) {
    const item = items[itemId];
    if (!item) continue;
    const stats = normalizeStats(item);
    if (typeof stats.attack === 'number') attack += stats.attack;
    if (typeof stats.strength === 'number') attack += stats.strength;
    if (typeof stats.defence === 'number') defence += stats.defence;
    if (typeof stats.dexterity === 'number') totalDexterity += stats.dexterity;
    if (typeof stats.hp === 'number') bonusHp += stats.hp;
    if (typeof stats.health === 'number') bonusHp += stats.health;
  }

  if (loadout.id === 't4_iron' && T4_EXTRA_DEFENCE > 0) {
    defence += T4_EXTRA_DEFENCE;
  }

  return {
    id: 'player',
    name: 'Luke',
    side: 'party',
    isPlayer: true,
    isCompanion: false,
    hp: 50 + strength * 10 + getConstitutionHpBonus(skillProfile.constitution) + bonusHp,
    maxHp: 50 + strength * 10 + getConstitutionHpBonus(skillProfile.constitution) + bonusHp,
    attack,
    defence,
    dexterity: totalDexterity,
    bleeding: 0,
    baseHitChance: COMBAT_CONFIG.BASE_HIT_CHANCE.PLAYER,
    damageMultiplier: getMeleeMilestoneMultiplier(skillProfile.melee),
  };
}

function buildRenZhenRetainers() {
  return [
    {
      id: 'lin_shao_retainer',
      name: 'Captain Lin Shao',
      side: 'party',
      isPlayer: false,
      isCompanion: true,
      hp: 150,
      maxHp: 150,
      attack: 12,
      defence: 7,
      dexterity: 9,
      bleeding: 0,
      baseHitChance: COMBAT_CONFIG.BASE_HIT_CHANCE.COMPANION,
    },
    {
      id: 'wei_taren_retainer',
      name: 'Wei Taren',
      side: 'party',
      isPlayer: false,
      isCompanion: true,
      hp: 120,
      maxHp: 120,
      attack: 10,
      defence: 6,
      dexterity: 8,
      bleeding: 0,
      baseHitChance: COMBAT_CONFIG.BASE_HIT_CHANCE.COMPANION,
    },
    {
      id: 'qiao_ren_retainer',
      name: 'Qiao Ren',
      side: 'party',
      isPlayer: false,
      isCompanion: true,
      hp: 110,
      maxHp: 110,
      attack: 10,
      defence: 6,
      dexterity: 10,
      bleeding: 0,
      baseHitChance: COMBAT_CONFIG.BASE_HIT_CHANCE.COMPANION,
    },
  ];
}

function buildRonald() {
  return {
    id: 'ronald_companion',
    name: 'Ronald',
    side: 'party',
    isPlayer: false,
    isCompanion: true,
    hp: 120,
    maxHp: 120,
    attack: 10,
    defence: 7,
    dexterity: 10,
    bleeding: 0,
    baseHitChance: COMBAT_CONFIG.BASE_HIT_CHANCE.COMPANION,
  };
}

function buildRenZhen() {
  return {
    id: 'ren_zhen_shadow',
    name: "Ren Zhen's Shadow",
    side: 'enemy',
    isPlayer: false,
    isCompanion: false,
    hp: renZhen.stats.hp,
    maxHp: renZhen.stats.hp,
    attack: renZhen.stats.attack,
    defence: renZhen.stats.defence,
    dexterity: renZhen.stats.dexterity,
    bleeding: 0,
    baseHitChance: clamp(
      COMBAT_CONFIG.BASE_HIT_CHANCE.ENEMY + (renZhen.accuracy_modifier || 0),
      0.1,
      0.95
    ),
    rowCleave: renZhen.combat_tags?.includes('row_cleave') ?? false,
    stormBoard: renZhen.combat_tags?.includes('storm_board') ?? false,
    firstStrike: renZhen.combat_tags?.includes('first_strike') ?? false,
  };
}

function buildWolf(index = 0) {
  return {
    id: `wolf_forest_${index}`,
    name: forestWolf.name,
    side: 'enemy',
    isPlayer: false,
    isCompanion: false,
    hp: forestWolf.stats.hp,
    maxHp: forestWolf.stats.hp,
    attack: forestWolf.stats.attack,
    defence: forestWolf.stats.defence,
    dexterity: forestWolf.stats.dexterity,
    bleeding: 0,
    baseHitChance: clamp(
      COMBAT_CONFIG.BASE_HIT_CHANCE.ENEMY + (forestWolf.accuracy_modifier || 0),
      0.1,
      0.95
    ),
    rowCleave: false,
    stormBoard: false,
    firstStrike: false,
  };
}

function calcPlayerDamage(attacker, defender) {
  const raw = Math.floor(
    attacker.attack * COMBAT_CONFIG.DAMAGE_FORMULA.PLAYER_MULTIPLIER -
      defender.defence * COMBAT_CONFIG.DAMAGE_FORMULA.PLAYER_DEFENCE_FACTOR
  );
  const baseDamage = Math.max(COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.PLAYER, raw);
  return Math.max(
    COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.PLAYER,
    Math.floor(baseDamage * (attacker.damageMultiplier || 1))
  );
}

function calcCompanionDamage(attacker, defender) {
  const raw = Math.floor(
    attacker.attack * COMBAT_CONFIG.DAMAGE_FORMULA.COMPANION_MULTIPLIER -
      defender.defence * COMBAT_CONFIG.DAMAGE_FORMULA.COMPANION_DEFENCE_FACTOR
  );
  return Math.max(COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.COMPANION, raw);
}

function calcEnemyDamage(attacker, defender) {
  const raw = Math.floor(
    attacker.attack * ENEMY_DAMAGE_MULTIPLIER -
      defender.defence * ENEMY_DEFENCE_FACTOR
  );
  if (attacker.name === forestWolf.name) {
    let wolfDamage = Math.max(WOLF_MIN_DAMAGE, Math.floor(raw * WOLF_DAMAGE_MULTIPLIER));
    if (defender.defence >= WOLF_HEAVY_ARMOR_THRESHOLD) {
      wolfDamage = Math.max(WOLF_MIN_DAMAGE, wolfDamage - WOLF_HEAVY_ARMOR_DAMAGE_REDUCTION);
    }
    return wolfDamage;
  }
  return Math.max(ENEMY_MIN_DAMAGE, raw);
}

function calcRenZhenRowDamage(attacker, defender) {
  const raw = Math.floor(
    attacker.attack * COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_MULTIPLIER -
      defender.defence * COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_DEFENCE_FACTOR
  );
  return Math.max(COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.ENEMY + 4, raw);
}

function assignFormation(combatants) {
  return combatants.map((combatant, index) => ({
    ...combatant,
    combatRow: index < 2 ? 'front' : 'back',
    combatSlot: index % 2,
  }));
}

function sortTurnOrder(units, priorityBossId = null, priorityFirstStrike = false) {
  return [...units].sort((a, b) => {
    const aFirstStrike = a.id === priorityBossId && priorityFirstStrike ? 1 : 0;
    const bFirstStrike = b.id === priorityBossId && priorityFirstStrike ? 1 : 0;
    if (bFirstStrike !== aFirstStrike) return bFirstStrike - aFirstStrike;
    if (b.dexterity !== a.dexterity) return b.dexterity - a.dexterity;
    if (a.side === 'party' && b.side === 'enemy') return -1;
    if (a.side === 'enemy' && b.side === 'party') return 1;
    return 0;
  });
}

function getAliveParty(units) {
  return units.filter((u) => u.side === 'party' && u.hp > 0);
}

function getAliveEnemies(units) {
  return units.filter((u) => u.side === 'enemy' && u.hp > 0);
}

function getTargetableParty(units) {
  const alive = getAliveParty(units);
  const front = alive.filter((u) => u.combatRow === 'front');
  return front.length > 0 ? front : alive;
}

function getTargetableEnemies(units) {
  const alive = getAliveEnemies(units);
  const front = alive.filter((u) => u.combatRow === 'front');
  return front.length > 0 ? front : alive;
}

function average(results, selector) {
  if (results.length === 0) return 0;
  return results.reduce((sum, result) => sum + selector(result), 0) / results.length;
}

function getWolfBleedChance(defence) {
  if (defence >= 19) return 0;
  if (defence >= 12) return WOLF_BLEED_MID;
  return WOLF_BLEED_LOW;
}

function getWolfBleedStack(defence) {
  if (defence >= 19) return 0;
  if (defence >= 12) return WOLF_BLEED_MID_STACK;
  return WOLF_BLEED_LOW_STACK;
}

function applyBleedTick(unit) {
  const bleeding = unit.bleeding ?? 0;
  if (bleeding <= 0 || unit.hp <= 0) return;
  const bleedDamage = getBleedDamage(bleeding);
  unit.hp = Math.max(0, unit.hp - bleedDamage);
  if (BLEED_DECAY_MODE === 'per_turn') {
    unit.bleeding = Math.max(0, bleeding - 1);
  }
}

function getBleedDamage(bleeding) {
  if (BLEED_DAMAGE_MODE === 'half_floor') return Math.max(1, Math.floor(bleeding / 2));
  if (BLEED_DAMAGE_MODE === 'half_ceil') return Math.max(1, Math.ceil(bleeding / 2));
  if (BLEED_DAMAGE_MODE === 'flat_one') return 1;
  return Math.ceil(bleeding / 4);
}

function projectOutOfCombatBleed(unit) {
  let hp = Math.max(0, unit.hp);
  let bleeding = unit.bleeding ?? 0;
  let hours = 0;

  while (bleeding > 0 && hp > 0) {
    hp = Math.max(0, hp - getBleedDamage(bleeding));
    bleeding = Math.max(0, bleeding - OUT_OF_COMBAT_BLEED_DECAY);
    hours += 1;
  }

  return { hp, hours };
}

function simulateRenZhenFight(loadout, skillProfile, hasStormwardNecklace = false) {
  const player = buildPlayer(loadout, skillProfile);
  const retainers = buildRenZhenRetainers();
  const boss = buildRenZhen();
  const units = sortTurnOrder(
    [...assignFormation([player, ...retainers]), ...assignFormation([boss])],
    'ren_zhen_shadow',
    boss.firstStrike
  );

  let rounds = 0;
  let currentIndex = 0;

  while (getAliveParty(units).length > 0 && boss.hp > 0 && rounds < 500) {
    rounds += 1;
    for (let steps = 0; steps < units.length && boss.hp > 0 && getAliveParty(units).length > 0; steps += 1) {
      const actor = units[currentIndex];
      currentIndex = (currentIndex + 1) % units.length;
      if (actor.hp <= 0) continue;
      applyBleedTick(actor);
      if (actor.hp <= 0) continue;

      if (actor.side === 'party') {
        if (Math.random() <= actor.baseHitChance) {
          const damage = actor.isPlayer ? calcPlayerDamage(actor, boss) : calcCompanionDamage(actor, boss);
          boss.hp -= damage;
        }
        if (boss.hp <= 0) break;
        continue;
      }

      const targets = getTargetableParty(units);
      if (targets.length === 0) break;

      if (Math.random() <= boss.baseHitChance) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        const rowTargets = targets.filter((ally) => ally.combatRow === target.combatRow);

        for (const rowTarget of rowTargets) {
          rowTarget.hp -= calcRenZhenRowDamage(boss, rowTarget);
        }

        if (boss.stormBoard) {
          const survivors = getAliveParty(units);
          const thunderDamage = 20;
          for (const survivor of survivors) {
            const appliedThunderDamage = survivor.isPlayer && hasStormwardNecklace ? 0 : thunderDamage;
            survivor.hp -= appliedThunderDamage;
          }
        }
      }
    }
  }

  const luke = units.find((u) => u.id === 'player');

  return {
    win: boss.hp <= 0 && getAliveParty(units).length > 0,
    lukeAlive: (luke?.hp || 0) > 0,
    survivors: getAliveParty(units).length,
    playerHpLeft: Math.max(0, luke?.hp || 0),
    enemyHpLeft: Math.max(0, boss.hp),
    rounds,
  };
}

function simulateWolfFight(loadout, skillProfile, wolfCount) {
  const player = buildPlayer(loadout, skillProfile);
  const wolves = Array.from({ length: wolfCount }, (_, index) => buildWolf(index));
  const units = sortTurnOrder([...assignFormation([player]), ...assignFormation(wolves)]);

  let rounds = 0;
  let currentIndex = 0;

  while (getAliveParty(units).length > 0 && getAliveEnemies(units).length > 0 && rounds < 500) {
    rounds += 1;
    for (let steps = 0; steps < units.length && getAliveParty(units).length > 0 && getAliveEnemies(units).length > 0; steps += 1) {
      const actor = units[currentIndex];
      currentIndex = (currentIndex + 1) % units.length;
      if (actor.hp <= 0) continue;
      applyBleedTick(actor);
      if (actor.hp <= 0) continue;

      if (actor.side === 'party') {
        const targets = getTargetableEnemies(units);
        if (targets.length === 0) break;
        if (Math.random() <= actor.baseHitChance) {
          const target = targets[Math.floor(Math.random() * targets.length)];
          target.hp -= calcPlayerDamage(actor, target);
        }
        continue;
      }

      const targets = getTargetableParty(units);
      if (targets.length === 0) break;

      if (Math.random() <= actor.baseHitChance) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        const damage = calcEnemyDamage(actor, target);
        target.hp -= damage;
        if (damage > 0 && target.hp > 0) {
          const bleedChance = getWolfBleedChance(target.defence);
          if (bleedChance > 0 && Math.random() < bleedChance) {
            target.bleeding = Math.min(12, (target.bleeding ?? 0) + getWolfBleedStack(target.defence));
          }
        }
      }
    }
  }

  const luke = units.find((u) => u.id === 'player');
  const projectedAftermath = luke ? projectOutOfCombatBleed(luke) : { hp: 0, hours: 0 };

  return {
    win: (luke?.hp || 0) > 0 && getAliveEnemies(units).length === 0,
    lukeAlive: (luke?.hp || 0) > 0,
    playerHpLeft: Math.max(0, luke?.hp || 0),
    playerBleedingLeft: Math.max(0, luke?.bleeding || 0),
    projectedPlayerHpAfterBleed: projectedAftermath.hp,
    projectedBleedHours: projectedAftermath.hours,
    enemiesLeft: getAliveEnemies(units).length,
    rounds,
  };
}

function simulateRonaldWolfFight(loadout, skillProfile) {
  const player = buildPlayer(loadout, skillProfile);
  const ronaldAlly = buildRonald();
  const wolves = Array.from({ length: 4 }, (_, index) => buildWolf(index));
  const units = sortTurnOrder([...assignFormation([player, ronaldAlly]), ...assignFormation(wolves)]);

  let rounds = 0;
  let currentIndex = 0;

  while (getAliveParty(units).length > 0 && getAliveEnemies(units).length > 0 && rounds < 500) {
    rounds += 1;
    for (let steps = 0; steps < units.length && getAliveParty(units).length > 0 && getAliveEnemies(units).length > 0; steps += 1) {
      const actor = units[currentIndex];
      currentIndex = (currentIndex + 1) % units.length;
      if (actor.hp <= 0) continue;
      applyBleedTick(actor);
      if (actor.hp <= 0) continue;

      if (actor.side === 'party') {
        const targets = getTargetableEnemies(units);
        if (targets.length === 0) break;
        if (Math.random() <= actor.baseHitChance) {
          const target = targets[Math.floor(Math.random() * targets.length)];
          const damage = actor.isPlayer ? calcPlayerDamage(actor, target) : calcCompanionDamage(actor, target);
          target.hp -= damage;
        }
        continue;
      }

      const targets = getTargetableParty(units);
      if (targets.length === 0) break;

      if (Math.random() <= actor.baseHitChance) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        const damage = calcEnemyDamage(actor, target);
        target.hp -= damage;
        if (damage > 0 && target.hp > 0) {
          const bleedChance = getWolfBleedChance(target.defence);
          if (bleedChance > 0 && Math.random() < bleedChance) {
            target.bleeding = Math.min(12, (target.bleeding ?? 0) + getWolfBleedStack(target.defence));
          }
        }
      }
    }
  }

  const luke = units.find((u) => u.id === 'player');
  const ronald = units.find((u) => u.id === 'ronald_companion');
  const projectedAftermath = luke ? projectOutOfCombatBleed(luke) : { hp: 0, hours: 0 };

  return {
    win: getAliveParty(units).length > 0 && getAliveEnemies(units).length === 0,
    lukeAlive: (luke?.hp || 0) > 0,
    ronaldAlive: (ronald?.hp || 0) > 0,
    playerHpLeft: Math.max(0, luke?.hp || 0),
    playerBleedingLeft: Math.max(0, luke?.bleeding || 0),
    projectedPlayerHpAfterBleed: projectedAftermath.hp,
    projectedBleedHours: projectedAftermath.hours,
    ronaldHpLeft: Math.max(0, ronald?.hp || 0),
    enemiesLeft: getAliveEnemies(units).length,
    rounds,
  };
}

function summarizeScenario(loadout, skillProfile, scenarioId) {
  let results = [];
  let scenario = null;

  if (scenarioId === 'ren_zhen' || scenarioId === 'ren_zhen_necklace') {
    const hasStormwardNecklace = scenarioId === 'ren_zhen_necklace';
    results = Array.from({ length: TRIALS }, () => simulateRenZhenFight(loadout, skillProfile, hasStormwardNecklace));
    const wins = results.filter((r) => r.win);
    const losses = results.filter((r) => !r.win);
    scenario = {
      id: scenarioId,
      label: hasStormwardNecklace
        ? 'Luke + 3 Guards vs Ren Zhen (Stormward Necklace Equipped)'
        : 'Luke + 3 Guards vs Ren Zhen',
      enemyStats: {
        hp: renZhen.stats.hp,
        attack: renZhen.stats.attack,
        defence: renZhen.stats.defence,
        dexterity: renZhen.stats.dexterity,
        thunderDamage: 20,
      },
      allies: [
        { name: 'Captain Lin Shao', hp: 150, attack: 12, defence: 7, dexterity: 9 },
        { name: 'Wei Taren', hp: 120, attack: 10, defence: 6, dexterity: 8 },
        { name: 'Qiao Ren', hp: 110, attack: 10, defence: 6, dexterity: 10 },
      ],
      stormwardNecklaceEquipped: hasStormwardNecklace,
      winRate: Number(((wins.length / TRIALS) * 100).toFixed(1)),
      lukeSurvivalRate: Number(((results.filter((r) => r.lukeAlive).length / TRIALS) * 100).toFixed(1)),
      averageRounds: Number(average(results, (r) => r.rounds).toFixed(2)),
      averageSurvivorsOnWins: Number(average(wins, (r) => r.survivors).toFixed(2)),
      averagePlayerHpLeftOnWins: Number(average(wins, (r) => r.playerHpLeft).toFixed(2)),
      averageEnemyHpLeftOnLosses: Number(average(losses, (r) => r.enemyHpLeft).toFixed(2)),
    };
  } else if (scenarioId.startsWith('wolves_')) {
    const wolfCount = Number.parseInt(scenarioId.split('_')[1], 10);
    results = Array.from({ length: TRIALS }, () => simulateWolfFight(loadout, skillProfile, wolfCount));
    const wins = results.filter((r) => r.win);
    const losses = results.filter((r) => !r.win);
    scenario = {
      id: scenarioId,
      label: `Luke vs ${wolfCount} Wolf${wolfCount > 1 ? 's' : ''}`,
      enemyStats: {
        hp: forestWolf.stats.hp,
        attack: forestWolf.stats.attack,
        defence: forestWolf.stats.defence,
        dexterity: forestWolf.stats.dexterity,
        damageMultiplier: WOLF_DAMAGE_MULTIPLIER,
        minDamage: WOLF_MIN_DAMAGE,
        lowArmorBleedChance: WOLF_BLEED_LOW,
        midArmorBleedChance: WOLF_BLEED_MID,
        lowArmorBleedStack: WOLF_BLEED_LOW_STACK,
        midArmorBleedStack: WOLF_BLEED_MID_STACK,
      },
      winRate: Number(((wins.length / TRIALS) * 100).toFixed(1)),
      lukeSurvivalRate: Number(((results.filter((r) => r.lukeAlive).length / TRIALS) * 100).toFixed(1)),
      averageRounds: Number(average(results, (r) => r.rounds).toFixed(2)),
      averagePlayerHpLeftOnWins: Number(average(wins, (r) => r.playerHpLeft).toFixed(2)),
      averagePlayerBleedOnWins: Number(average(wins, (r) => r.playerBleedingLeft).toFixed(2)),
      averagePlayerHpAfterUntreatedBleedOnWins: Number(average(wins, (r) => r.projectedPlayerHpAfterBleed).toFixed(2)),
      averageBleedHoursOnWins: Number(average(wins, (r) => r.projectedBleedHours).toFixed(2)),
      averageEnemiesLeftOnLosses: Number(average(losses, (r) => r.enemiesLeft).toFixed(2)),
    };
  } else if (scenarioId === 'ronald_wolves') {
    results = Array.from({ length: TRIALS }, () => simulateRonaldWolfFight(loadout, skillProfile));
    const wins = results.filter((r) => r.win);
    const losses = results.filter((r) => !r.win);
    scenario = {
      id: scenarioId,
      label: 'Luke + Ronald vs 4 Wolves',
      allyStats: {
        hp: 120,
        attack: 10,
        defence: 7,
        dexterity: 10,
      },
      enemyStats: {
        hp: forestWolf.stats.hp,
        attack: forestWolf.stats.attack,
        defence: forestWolf.stats.defence,
        dexterity: forestWolf.stats.dexterity,
        damageMultiplier: WOLF_DAMAGE_MULTIPLIER,
        minDamage: WOLF_MIN_DAMAGE,
        lowArmorBleedChance: WOLF_BLEED_LOW,
        midArmorBleedChance: WOLF_BLEED_MID,
        lowArmorBleedStack: WOLF_BLEED_LOW_STACK,
        midArmorBleedStack: WOLF_BLEED_MID_STACK,
      },
      winRate: Number(((wins.length / TRIALS) * 100).toFixed(1)),
      lukeSurvivalRate: Number(((results.filter((r) => r.lukeAlive).length / TRIALS) * 100).toFixed(1)),
      ronaldSurvivalRate: Number(((results.filter((r) => r.ronaldAlive).length / TRIALS) * 100).toFixed(1)),
      averageRounds: Number(average(results, (r) => r.rounds).toFixed(2)),
      averagePlayerHpLeftOnWins: Number(average(wins, (r) => r.playerHpLeft).toFixed(2)),
      averagePlayerBleedOnWins: Number(average(wins, (r) => r.playerBleedingLeft).toFixed(2)),
      averagePlayerHpAfterUntreatedBleedOnWins: Number(average(wins, (r) => r.projectedPlayerHpAfterBleed).toFixed(2)),
      averageBleedHoursOnWins: Number(average(wins, (r) => r.projectedBleedHours).toFixed(2)),
      averageRonaldHpLeftOnWins: Number(average(wins, (r) => r.ronaldHpLeft).toFixed(2)),
      averageEnemiesLeftOnLosses: Number(average(losses, (r) => r.enemiesLeft).toFixed(2)),
    };
  }

  const preview = buildPlayer(loadout, skillProfile);
  return {
    loadout: loadout.label,
    skillProfile: skillProfile.label,
    trials: TRIALS,
    playerStats: {
      hp: preview.maxHp,
      attack: preview.attack,
      defence: preview.defence,
      dexterity: preview.dexterity,
      damageMultiplier: preview.damageMultiplier,
    },
    ...scenario,
  };
}

const scenarioOrder = ['ren_zhen', 'wolves_1', 'wolves_2', 'wolves_4', 'ronald_wolves'];
scenarioOrder.splice(1, 0, 'ren_zhen_necklace');

console.log(`Combat balancing simulator - ${TRIALS} trials per loadout/scenario\n`);
for (const scenarioId of scenarioOrder) {
  console.log(`=== ${scenarioId} ===`);
  for (const skillProfile of skillProfiles) {
    console.log(`-- ${skillProfile.label} --`);
    for (const loadout of loadouts) {
      const summary = summarizeScenario(loadout, skillProfile, scenarioId);
      console.log(JSON.stringify(summary, null, 2));
      console.log('');
    }
  }
}

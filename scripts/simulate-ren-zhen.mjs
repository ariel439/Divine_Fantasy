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
    PLAYER_MULTIPLIER: 1.9,
    PLAYER_DEFENCE_FACTOR: 0.2,
    COMPANION_MULTIPLIER: 1.7,
    COMPANION_DEFENCE_FACTOR: 0.3,
    ENEMY_MULTIPLIER: 1.6,
    ENEMY_DEFENCE_FACTOR: 0.35,
    MIN_DAMAGE: {
      PLAYER: 6,
      COMPANION: 5,
      ENEMY: 6,
    },
  },
};

const lukeTemplate = templates.luke_orphan;
const renZhen = enemies.ren_zhen_shadow;

const loadouts = [
  {
    id: 'rags_knife',
    label: 'Rags + Knife',
    items: ['ragged_shirt', 'ragged_legs', 'crude_knife'],
  },
  {
    id: 'chain_bronze',
    label: 'Full Chainmail + Bronze Sword',
    items: ['chain_coif', 'chainmail_shirt', 'chainmail_leggings', 'bronze_sword'],
  },
  {
    id: 'iron_iron',
    label: 'Full Iron + Iron Sword',
    items: ['iron_helmet', 'iron_chainmail', 'iron_leggings', 'iron_sword'],
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

function buildPlayer(loadout) {
  const strength = lukeTemplate.starting_attributes.Strength;
  const dexterity = lukeTemplate.starting_attributes.Dexterity;

  let attack = strength;
  let defence = Math.floor((strength + dexterity) / 2);
  let bonusHp = 0;

  for (const itemId of loadout.items) {
    const item = items[itemId];
    if (!item) continue;
    const stats = normalizeStats(item);
    if (typeof stats.attack === 'number') attack += stats.attack;
    if (typeof stats.strength === 'number') attack += stats.strength;
    if (typeof stats.defence === 'number') defence += stats.defence;
    if (typeof stats.hp === 'number') bonusHp += stats.hp;
    if (typeof stats.health === 'number') bonusHp += stats.health;
  }

  return {
    id: 'player',
    name: 'Luke',
    side: 'party',
    isPlayer: true,
    isCompanion: false,
    hp: 50 + strength * 10 + bonusHp,
    maxHp: 50 + strength * 10 + bonusHp,
    attack,
    defence,
    dexterity,
    baseHitChance: COMBAT_CONFIG.BASE_HIT_CHANCE.PLAYER,
  };
}

function buildRetainers() {
  return [
    {
      id: 'lin_shao_retainer',
      name: 'Captain Lin Shao',
      side: 'party',
      isPlayer: false,
      isCompanion: true,
      hp: 145,
      maxHp: 145,
      attack: 11,
      defence: 7,
      dexterity: 9,
      baseHitChance: COMBAT_CONFIG.BASE_HIT_CHANCE.COMPANION,
    },
    {
      id: 'wei_taren_retainer',
      name: 'Wei Taren',
      side: 'party',
      isPlayer: false,
      isCompanion: true,
      hp: 130,
      maxHp: 130,
      attack: 10,
      defence: 6,
      dexterity: 8,
      baseHitChance: COMBAT_CONFIG.BASE_HIT_CHANCE.COMPANION,
    },
    {
      id: 'qiao_ren_retainer',
      name: 'Qiao Ren',
      side: 'party',
      isPlayer: false,
      isCompanion: true,
      hp: 120,
      maxHp: 120,
      attack: 9,
      defence: 6,
      dexterity: 10,
      baseHitChance: COMBAT_CONFIG.BASE_HIT_CHANCE.COMPANION,
    },
  ];
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

function calcPlayerDamage(attacker, defender) {
  const raw = Math.floor(
    attacker.attack * COMBAT_CONFIG.DAMAGE_FORMULA.PLAYER_MULTIPLIER -
      defender.defence * COMBAT_CONFIG.DAMAGE_FORMULA.PLAYER_DEFENCE_FACTOR
  );
  return Math.max(COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.PLAYER, raw);
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
    attacker.attack * COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_MULTIPLIER -
      defender.defence * COMBAT_CONFIG.DAMAGE_FORMULA.ENEMY_DEFENCE_FACTOR
  );
  return Math.max(COMBAT_CONFIG.DAMAGE_FORMULA.MIN_DAMAGE.ENEMY, raw);
}

function assignFormation(combatants) {
  return combatants.map((combatant, index) => ({
    ...combatant,
    combatRow: index < 2 ? 'front' : 'back',
    combatSlot: index % 2,
  }));
}

function buildTurnOrder(party, boss) {
  return [...assignFormation(party), boss].sort((a, b) => {
    const aFirstStrike = a.id === 'ren_zhen_shadow' && boss.firstStrike ? 1 : 0;
    const bFirstStrike = b.id === 'ren_zhen_shadow' && boss.firstStrike ? 1 : 0;
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

function getTargetableParty(units) {
  const alive = getAliveParty(units);
  const front = alive.filter((u) => u.combatRow === 'front');
  return front.length > 0 ? front : alive;
}

function simulateFight(loadout) {
  const player = buildPlayer(loadout);
  const retainers = buildRetainers();
  const boss = buildRenZhen();
  const units = buildTurnOrder([player, ...retainers], boss);

  let rounds = 0;
  let partyTurns = 0;
  let bossTurns = 0;
  let currentIndex = 0;

  while (getAliveParty(units).length > 0 && boss.hp > 0 && rounds < 500) {
    rounds += 1;
    for (let steps = 0; steps < units.length && boss.hp > 0 && getAliveParty(units).length > 0; steps += 1) {
      const actor = units[currentIndex];
      currentIndex = (currentIndex + 1) % units.length;
      if (actor.hp <= 0) continue;

      if (actor.side === 'party') {
        partyTurns += 1;
        if (Math.random() <= actor.baseHitChance) {
          const damage = actor.isPlayer ? calcPlayerDamage(actor, boss) : calcCompanionDamage(actor, boss);
          boss.hp -= damage;
        }
        if (boss.hp <= 0) break;
        continue;
      }

      bossTurns += 1;
      const targetableParty = getTargetableParty(units);
      if (targetableParty.length === 0) break;

      if (Math.random() <= boss.baseHitChance) {
        const target = targetableParty[Math.floor(Math.random() * targetableParty.length)];
        const rowTargets = targetableParty.filter((ally) => ally.combatRow === target.combatRow);

        for (const rowTarget of rowTargets) {
          rowTarget.hp -= calcEnemyDamage(boss, rowTarget);
        }

        if (boss.stormBoard) {
          const survivors = getAliveParty(units);
          const thunderDamage = Math.max(8, Math.floor(boss.attack * 0.4));
          for (const survivor of survivors) {
            survivor.hp -= thunderDamage;
          }
        }
      }
    }
  }

  const livingParty = getAliveParty(units);
  const luke = units.find((u) => u.id === 'player');

  return {
    win: boss.hp <= 0 && livingParty.length > 0,
    lukeAlive: (luke?.hp || 0) > 0,
    survivors: livingParty.length,
    playerHpLeft: Math.max(0, luke?.hp || 0),
    bossHpLeft: Math.max(0, boss.hp),
    rounds,
    partyTurns,
    bossTurns,
  };
}

function summarize(loadout) {
  const results = Array.from({ length: TRIALS }, () => simulateFight(loadout));
  const wins = results.filter((r) => r.win).length;
  const losses = TRIALS - wins;
  const lukeSurvival = results.filter((r) => r.lukeAlive).length;
  const avgRounds = results.reduce((sum, r) => sum + r.rounds, 0) / TRIALS;
  const avgSurvivorsOnWins =
    wins > 0 ? results.filter((r) => r.win).reduce((sum, r) => sum + r.survivors, 0) / wins : 0;
  const avgPlayerHpLeftOnWins =
    wins > 0 ? results.filter((r) => r.win).reduce((sum, r) => sum + r.playerHpLeft, 0) / wins : 0;
  const avgBossHpLeftOnLosses =
    losses > 0 ? results.filter((r) => !r.win).reduce((sum, r) => sum + r.bossHpLeft, 0) / losses : 0;

  const preview = buildPlayer(loadout);

  return {
    loadout: loadout.label,
    trials: TRIALS,
    playerStats: {
      hp: preview.maxHp,
      attack: preview.attack,
      defence: preview.defence,
      dexterity: preview.dexterity,
    },
    renZhenStats: {
      hp: renZhen.stats.hp,
      attack: renZhen.stats.attack,
      defence: renZhen.stats.defence,
      dexterity: renZhen.stats.dexterity,
    },
    companions: [
      { name: 'Captain Lin Shao', hp: 145, attack: 11, defence: 7, dexterity: 9 },
      { name: 'Wei Taren', hp: 130, attack: 10, defence: 6, dexterity: 8 },
      { name: 'Qiao Ren', hp: 120, attack: 9, defence: 6, dexterity: 10 },
    ],
    winRate: `${((wins / TRIALS) * 100).toFixed(1)}%`,
    lukeSurvivalRate: `${((lukeSurvival / TRIALS) * 100).toFixed(1)}%`,
    averageRounds: Number(avgRounds.toFixed(2)),
    averageSurvivorsOnWins: Number(avgSurvivorsOnWins.toFixed(2)),
    averagePlayerHpLeftOnWins: Number(avgPlayerHpLeftOnWins.toFixed(2)),
    averageBossHpLeftOnLosses: Number(avgBossHpLeftOnLosses.toFixed(2)),
  };
}

console.log(`Ren Zhen simulator - ${TRIALS} trials per setup\n`);
for (const loadout of loadouts) {
  const summary = summarize(loadout);
  console.log(JSON.stringify(summary, null, 2));
  console.log('');
}

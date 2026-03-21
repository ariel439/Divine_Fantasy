export const COMBAT_CONFIG = {
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
      ENEMY: 6
    }
  },
  FLEE: {
    BASE_CHANCE: 0.7,
    MIN_CHANCE: 0.1,
    MAX_CHANCE: 0.9,
    DEX_FACTOR: 0.05
  },
  DEFAULT_SFX: {
    ATTACK: '/assets/sfx/combat_punch.mp3',
    SWORD: '/assets/sfx/combat_sword_swing.mp3',
    WOLF: '/assets/sfx/wolf_bite.mp3',
    MISS: '/assets/sfx/combat_miss.mp3'
  }
};

export const COMBAT_CONFIG = {
  BASE_HIT_CHANCE: {
    PLAYER: 0.8,
    COMPANION: 0.8,
    ENEMY: 0.75,
  },
  DAMAGE_FORMULA: {
    PLAYER_MULTIPLIER: 1.4,
    PLAYER_DEFENCE_FACTOR: 0.3,
    COMPANION_MULTIPLIER: 1.3,
    COMPANION_DEFENCE_FACTOR: 0.4,
    ENEMY_MULTIPLIER: 1.2,
    ENEMY_DEFENCE_FACTOR: 0.5,
    MIN_DAMAGE: {
      PLAYER: 3,
      COMPANION: 2,
      ENEMY: 3
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

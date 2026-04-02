export const COMBAT_CONFIG = {
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

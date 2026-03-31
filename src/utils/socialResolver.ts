import { getSocialPresenceSummary } from './socialPresentation';
import { getSocialNpcConfig, type PersonalityTrait, type SocialClass } from './socialNpcConfig';
import { tierFromLevel } from './socialTiers';

export type SocialActionType = 'friendly' | 'flirt' | 'coerce';
export type SocialStyle =
  | 'smalltalk'
  | 'honest'
  | 'helpful'
  | 'respectful'
  | 'listen'
  | 'compliment'
  | 'playful'
  | 'threaten';

export type SocialOutcome = 'fail' | 'weak' | 'strong' | 'neutral';

interface SocialResolution {
  outcome: SocialOutcome;
  relationshipChanges: Partial<Record<'friendship' | 'love' | 'fear', number>>;
  xpSkill: 'persuasion' | 'coercion';
  xpAmount: number;
  diaryText: string;
}

function isWhiteFangSocialSuppressed(npcId: string, type: SocialActionType): boolean {
  if (type === 'coerce') return false;
  const profile = getSocialNpcConfig(npcId);
  const presence = getSocialPresenceSummary();
  return presence.isCursedPresence && !profile.whiteFangSocialExempt;
}

const PERSONALITY_STYLE_MODIFIERS: Partial<Record<PersonalityTrait, Partial<Record<SocialStyle, number>>>> = {
  warm: {
    smalltalk: 1,
    honest: 1,
    helpful: 1,
    listen: 2,
    compliment: 1,
  },
  guarded: {
    smalltalk: -1,
    honest: 2,
    respectful: 2,
    listen: 1,
    helpful: 0,
    compliment: -1,
    threaten: -1,
  },
  practical: {
    smalltalk: 0,
    helpful: 2,
    honest: 2,
    respectful: 1,
    playful: -1,
  },
  lonely: {
    smalltalk: 1,
    listen: 2,
    compliment: 1,
    playful: 1,
  },
  fearful: {
    threaten: 2,
    honest: -1,
    listen: 1,
  },
  proud: {
    smalltalk: -1,
    compliment: -1,
    threaten: -2,
    honest: 0,
    respectful: 2,
  },
  greedy: {
    helpful: -1,
    threaten: 1,
  },
  cold: {
    smalltalk: -1,
    playful: -2,
    compliment: -1,
  },
  dutiful: {
    honest: 1,
    helpful: 1,
    respectful: 1,
    threaten: -2,
  },
  observant: {
    honest: 1,
    smalltalk: 0,
    listen: 1,
  },
};

function getPersonalityModifier(npcId: string, style: SocialStyle): number {
  const profile = getSocialNpcConfig(npcId);

  const total = profile.personality.reduce((sum, trait) => {
    return sum + (PERSONALITY_STYLE_MODIFIERS[trait]?.[style] ?? 0);
  }, 0);

  return Math.max(-2, Math.min(2, total));
}

function getPresentationModifier(npcId: string, type: SocialActionType): number {
  const profile = getSocialNpcConfig(npcId);
  const presence = getSocialPresenceSummary();
  const presentationDelta = presence.presentationTier - profile.presentationStandard;
  const threatDelta = presence.threatTier - profile.threatTolerance;

  if (type === 'friendly') {
    let modifier = presentationDelta;
    if (threatDelta > 0) modifier -= threatDelta;
    return modifier;
  }

  if (type === 'flirt') {
    let modifier = presentationDelta * 2;
    if (threatDelta > 0) modifier -= threatDelta * 2;
    return modifier;
  }

  let modifier = threatDelta;

  if (profile.socialClass === 'criminal' && presence.presentationTier <= 3) modifier += 1;
  if (profile.socialClass === 'criminal' && presence.presentationTier >= 8) modifier -= 1;

  return modifier;
}

export function resolveSocialAction(params: {
  npcId: string;
  type: SocialActionType;
  style: SocialStyle;
  persuasionLevel: number;
  coercionLevel: number;
}): SocialResolution {
  const { npcId, type, style, persuasionLevel, coercionLevel } = params;
  const rawSkillLevel = type === 'coerce' ? coercionLevel : persuasionLevel;
  const skillLevel = tierFromLevel(rawSkillLevel);
  const personalityModifier = getPersonalityModifier(npcId, style);
  const presentationModifier = getPresentationModifier(npcId, type);
  const roll = Math.floor(Math.random() * 10) + 1;
  const score = skillLevel + personalityModifier + presentationModifier + roll;
  const profileName = npcId
    .replace('npc_', '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  if (isWhiteFangSocialSuppressed(npcId, type)) {
    if (type === 'friendly') {
      return {
        outcome: 'neutral',
        relationshipChanges: {},
        xpSkill: 'persuasion',
        xpAmount: 5,
        diaryText: `${profileName} kept an uneasy distance.`,
      };
    }
    return {
      outcome: 'neutral',
      relationshipChanges: {},
      xpSkill: 'persuasion',
      xpAmount: 5,
      diaryText: `${profileName} did not draw any closer.`,
    };
  }

  if (type === 'friendly') {
    if (score >= 16) {
      return {
        outcome: 'strong',
        relationshipChanges: { friendship: 4 },
        xpSkill: 'persuasion',
        xpAmount: 15,
        diaryText: `${profileName} warmed to you.`,
      };
    }
    if (score >= 8) {
      return {
        outcome: 'weak',
        relationshipChanges: { friendship: 2 },
        xpSkill: 'persuasion',
        xpAmount: 10,
        diaryText: `${profileName} seemed a little more open.`,
      };
    }
    return {
      outcome: 'fail',
      relationshipChanges: {},
      xpSkill: 'persuasion',
      xpAmount: 5,
      diaryText: `${profileName} did not seem convinced.`,
    };
  }

  if (type === 'flirt') {
    if (score >= 17) {
      return {
        outcome: 'strong',
        relationshipChanges: { friendship: 1, love: 2 },
        xpSkill: 'persuasion',
        xpAmount: 15,
        diaryText: `${profileName} reacted to the attention.`,
      };
    }
    if (score >= 10) {
      return {
        outcome: 'weak',
        relationshipChanges: { love: 1 },
        xpSkill: 'persuasion',
        xpAmount: 10,
        diaryText: `${profileName} did not shut you down.`,
      };
    }
    return {
      outcome: 'fail',
      relationshipChanges: { friendship: -1 },
      xpSkill: 'persuasion',
      xpAmount: 5,
      diaryText: `${profileName} looked unimpressed.`,
    };
  }

  if (score >= 15) {
    return {
      outcome: 'strong',
      relationshipChanges: { fear: 4, friendship: -2 },
      xpSkill: 'coercion',
      xpAmount: 15,
      diaryText: `${profileName} yielded under pressure.`,
    };
  }
  if (score >= 9) {
    return {
      outcome: 'weak',
      relationshipChanges: { fear: 2, friendship: -1 },
      xpSkill: 'coercion',
      xpAmount: 10,
      diaryText: `${profileName} flinched, but not by much.`,
    };
  }
  return {
    outcome: 'fail',
    relationshipChanges: { friendship: -1 },
    xpSkill: 'coercion',
    xpAmount: 5,
    diaryText: `${profileName} did not buy the threat.`,
  };
}

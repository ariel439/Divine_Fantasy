import { getEquippedPresentation } from './socialPresentation';
import { getSocialNpcConfig, type PersonalityTrait, type SocialClass } from './socialNpcConfig';

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

type SocialOutcome = 'fail' | 'weak' | 'strong';

interface SocialResolution {
  outcome: SocialOutcome;
  relationshipChanges: Partial<Record<'friendship' | 'love' | 'fear', number>>;
  xpSkill: 'persuasion' | 'coercion';
  xpAmount: number;
  diaryText: string;
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

  const presentation = getEquippedPresentation();
  let modifier = 0;

  const clothingLabel = presentation.clothingLabel;

  if (type === 'friendly' || type === 'flirt') {
    if (clothingLabel === 'Naked') modifier -= 3;
    else if (clothingLabel === 'Underdressed') modifier -= 2;
    else if (clothingLabel === 'Ragged' || clothingLabel === 'Mismatched') modifier -= 1;
    else if (clothingLabel === 'Fine') modifier += profile.socialClass === 'merchant' ? 1 : 0;
  }

  if (presentation.roughArmorPieces > 0) {
    if (type === 'coerce') modifier += 1;
    if (type === 'flirt') modifier -= 1;
    if (profile.socialClass === 'merchant' && type === 'friendly') modifier -= 1;
  }

  if (presentation.heavyArmorPieces > 0) {
    if (type === 'coerce') modifier += Math.min(2, presentation.heavyArmorPieces);
    if (type === 'friendly') modifier -= 1;
    if (type === 'flirt') modifier -= 2;
  }

  if (presentation.visibleWeapon) {
    if (type === 'coerce') modifier += presentation.visibleWeapon === 'crude_knife' ? 1 : 2;
    if (type === 'friendly') modifier -= 1;
    if (type === 'flirt') modifier -= 1;
  }

  if (type === 'coerce') {
    return Math.max(-1, Math.min(2, modifier));
  }

  return Math.max(-2, Math.min(1, modifier));
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
  const skillLevel = Math.min(6, Math.floor(rawSkillLevel / 2) + 1);
  const personalityModifier = getPersonalityModifier(npcId, style);
  const presentationModifier = getPresentationModifier(npcId, type);
  const roll = Math.floor(Math.random() * 10) + 1;
  const score = skillLevel + personalityModifier + presentationModifier + roll;
  const profileName = npcId
    .replace('npc_', '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  if (type === 'friendly') {
    if (score >= 16) {
      return {
        outcome: 'strong',
        relationshipChanges: { friendship: 4 },
        xpSkill: 'persuasion',
        xpAmount: 8,
        diaryText: `${profileName} warmed to you.`,
      };
    }
    if (score >= 8) {
      return {
        outcome: 'weak',
        relationshipChanges: { friendship: 2 },
        xpSkill: 'persuasion',
        xpAmount: 5,
        diaryText: `${profileName} seemed a little more open.`,
      };
    }
    return {
      outcome: 'fail',
      relationshipChanges: {},
      xpSkill: 'persuasion',
      xpAmount: 2,
      diaryText: `${profileName} did not seem convinced.`,
    };
  }

  if (type === 'flirt') {
    if (score >= 17) {
      return {
        outcome: 'strong',
        relationshipChanges: { friendship: 1, love: 2 },
        xpSkill: 'persuasion',
        xpAmount: 7,
        diaryText: `${profileName} reacted to the attention.`,
      };
    }
    if (score >= 10) {
      return {
        outcome: 'weak',
        relationshipChanges: { love: 1 },
        xpSkill: 'persuasion',
        xpAmount: 4,
        diaryText: `${profileName} did not shut you down.`,
      };
    }
    return {
      outcome: 'fail',
      relationshipChanges: { friendship: -1 },
      xpSkill: 'persuasion',
      xpAmount: 2,
      diaryText: `${profileName} looked unimpressed.`,
    };
  }

  if (score >= 15) {
    return {
      outcome: 'strong',
      relationshipChanges: { fear: 4, friendship: -2 },
      xpSkill: 'coercion',
      xpAmount: 7,
      diaryText: `${profileName} yielded under pressure.`,
    };
  }
  if (score >= 9) {
    return {
      outcome: 'weak',
      relationshipChanges: { fear: 2, friendship: -1 },
      xpSkill: 'coercion',
      xpAmount: 4,
      diaryText: `${profileName} flinched, but not by much.`,
    };
  }
  return {
    outcome: 'fail',
    relationshipChanges: { friendship: -1 },
    xpSkill: 'coercion',
    xpAmount: 2,
    diaryText: `${profileName} did not buy the threat.`,
  };
}

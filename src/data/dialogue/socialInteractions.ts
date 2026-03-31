import type { SocialActionType, SocialStyle } from '../../utils/socialResolver';
import type { PersonalityTrait, SocialClass } from '../../utils/socialNpcConfig';

export type SocialInteractionCategory = 'friendly' | 'flirt' | 'coerce';
type Outcome = 'strong' | 'weak' | 'fail' | 'neutral';
type ResponseSet = Record<'strong' | 'weak' | 'fail', string[]> & Partial<Record<'neutral', string[]>>;

export interface SocialInteractionTemplate {
  key: string;
  category: SocialInteractionCategory;
  label: string;
  socialType: SocialActionType;
  socialStyle: SocialStyle;
  socialCost?: number;
  playerLines: string[];
  defaultNpcResponses: ResponseSet;
  personalityResponses?: Partial<Record<PersonalityTrait, Partial<ResponseSet>>>;
  classResponses?: Partial<Record<SocialClass, Partial<ResponseSet>>>;
}

export interface SocialInteractionOverride {
  label?: string;
  playerLines?: string[];
  npcResponses?: Partial<ResponseSet>;
  socialCost?: number;
}

export interface SocialNpcInteractionConfig {
  availableInteractions: Partial<Record<SocialInteractionCategory, string[]>>;
  interactionOverrides?: Record<string, SocialInteractionOverride>;
}

export const socialInteractionTemplates: Record<string, SocialInteractionTemplate> = {
  smalltalk: {
    key: 'smalltalk',
    category: 'friendly',
    label: 'Make small talk.',
    socialType: 'friendly',
    socialStyle: 'smalltalk',
    socialCost: 1,
    playerLines: [
      'How are you holding up?',
      'Rough day?',
      'You look like you have had a long one.',
    ],
    defaultNpcResponses: {
      strong: ['That is kinder than most people bother being.'],
      weak: ['I have had worse.'],
      fail: ['That depends who is asking.'],
      neutral: ['There is a strange distance in the air around you.'],
    },
    personalityResponses: {
      warm: {
        strong: ['That is kind of you to ask.'],
        weak: ['I have managed.'],
        fail: ['I am doing well enough.'],
      },
      guarded: {
        strong: ['That was kinder than I expected.'],
        weak: ['I am still standing.'],
        fail: ['I am fine.'],
      },
      practical: {
        strong: ['Busy, but I can manage busy.'],
        weak: ['Enough to keep moving.'],
        fail: ['I have work to do.'],
      },
      lonely: {
        strong: ['Better now than an hour ago.'],
        weak: ['I have had quieter days.'],
        fail: ['I am used to worse company than this.'],
      },
      cold: {
        strong: ['You are unusually considerate.'],
        weak: ['I am fine.'],
        fail: ['Do not pretend concern you do not feel.'],
      },
      observant: {
        strong: ['You notice more than most.'],
        weak: ['I have been worse.'],
        fail: ['You ask a great deal for small talk.'],
      },
    },
  },
  helpful: {
    key: 'helpful',
    category: 'friendly',
    label: 'Offer practical help.',
    socialType: 'friendly',
    socialStyle: 'helpful',
    socialCost: 1,
    playerLines: [
      'If something needs doing, say it plainly.',
      'I can help, if this is more than talk.',
      'If you need another pair of hands, ask.',
    ],
    defaultNpcResponses: {
      strong: ['Maybe I judged you too quickly.'],
      weak: ['We will see.'],
      fail: ['I did not ask for help.'],
      neutral: ['Keep your distance. Something about you feels wrong tonight.'],
    },
    personalityResponses: {
      warm: {
        strong: ['That is generous of you.'],
        weak: ['I may hold you to that.'],
        fail: ['Kind words are not always useful.'],
      },
      guarded: {
        strong: ['Maybe I did misjudge you.'],
        weak: ['We will see.'],
        fail: ['People offer help when they want something.'],
      },
      practical: {
        strong: ['Good. I can work with that.'],
        weak: ['Useful if you mean it.'],
        fail: ['Then be useful, not dramatic.'],
      },
      proud: {
        strong: ['Careful. I may remember that offer.'],
        weak: ['I do not need rescuing.'],
        fail: ['Do not mistake me for helpless.'],
      },
      fearful: {
        strong: ['Then stay close and do not make this worse.'],
        weak: ['Maybe.'],
        fail: ['Help offered too easily is rarely safe.'],
      },
      greedy: {
        strong: ['Useful. Nothing wrong with useful.'],
        weak: ['Depends what it costs me.'],
        fail: ['Nothing comes free in this town.'],
      },
    },
  },
  honest: {
    key: 'honest',
    category: 'friendly',
    label: 'Be direct and honest.',
    socialType: 'friendly',
    socialStyle: 'honest',
    socialCost: 1,
    playerLines: [
      'I am trying to be straight with you.',
      'I would rather be honest than smooth.',
      'I mean what I am saying.',
    ],
    defaultNpcResponses: {
      strong: ['Plain words are rarer than they should be.'],
      weak: ['Maybe. I am still listening.'],
      fail: ['Honesty and bluntness are not the same thing.'],
      neutral: ['I hear you. I just do not feel easy standing this close to you.'],
    },
    personalityResponses: {
      warm: {
        strong: ['I can respect that.'],
        weak: ['That matters more than charm, at least.'],
        fail: ['If you mean it, prove it.'],
      },
      guarded: {
        strong: ['That is rarer than it should be.'],
        weak: ['Maybe. I am still listening.'],
        fail: ['Blunt is not the same as sincere.'],
      },
      practical: {
        strong: ['Good. Saves time.'],
        weak: ['Plain words are easier to trust.'],
        fail: ['Then be clear, not merely sharp.'],
      },
      proud: {
        strong: ['Honesty suits you better than flattery.'],
        weak: ['We will see if your actions match it.'],
        fail: ['Honesty alone does not impress me.'],
      },
      cold: {
        strong: ['At least that sounds real.'],
        weak: ['I have heard worse.'],
        fail: ['You are trying too hard to sound sincere.'],
      },
      dutiful: {
        strong: ['Good. I have little patience for games.'],
        weak: ['Then keep it that way.'],
        fail: ['Plainness means nothing without conduct.'],
      },
    },
  },
  compliment: {
    key: 'compliment',
    category: 'friendly',
    label: 'Compliment them.',
    socialType: 'friendly',
    socialStyle: 'compliment',
    socialCost: 1,
    playerLines: [
      'You handle yourself better than most people here.',
      'You seem more capable than you let on.',
      'People notice when someone keeps their footing.',
    ],
    defaultNpcResponses: {
      strong: ['That was more thoughtful than I expected.'],
      weak: ['I have heard worse.'],
      fail: ['Flattery travels cheap in this town.'],
      neutral: ['Do not dress it up. Something about you sets my teeth on edge.'],
    },
    personalityResponses: {
      warm: {
        strong: ['That is sweet of you to say.'],
        weak: ['You are laying it on a little thick.'],
        fail: ['You do not need to flatter me.'],
      },
      guarded: {
        strong: ['That sounded almost genuine.'],
        weak: ['Hm. I have heard worse.'],
        fail: ['If you are trying to soften me up, be subtler.'],
      },
      proud: {
        strong: ['At least you have eyes.'],
        weak: ['You are not entirely wrong.'],
        fail: ['Do not praise me as if I need it.'],
      },
      lonely: {
        strong: ['Not many people bother to say such things plainly.'],
        weak: ['That is kinder than necessary.'],
        fail: ['You say that too easily.'],
      },
      observant: {
        strong: ['A precise compliment. I appreciate that.'],
        weak: ['You notice more than most.'],
        fail: ['You are trying to read me too quickly.'],
      },
    },
  },
  flirt_compliment: {
    key: 'flirt_compliment',
    category: 'flirt',
    label: 'Compliment their composure.',
    socialType: 'flirt',
    socialStyle: 'compliment',
    socialCost: 2,
    playerLines: [
      'You carry yourself well.',
      'You do not rattle easily. That is rare.',
      'You make calm look effortless.',
    ],
    defaultNpcResponses: {
      strong: ['Careful. That almost sounded sincere.'],
      weak: ['You should practice that line before using it twice.'],
      fail: ['That sounded better in your head, did it not?'],
      neutral: ['No. Whatever is clinging to you kills the mood before you speak.'],
    },
    personalityResponses: {
      warm: {
        strong: ['You nearly made me blush there.'],
        weak: ['You are trying, I will give you that.'],
        fail: ['That was not as smooth as you hoped.'],
      },
      guarded: {
        strong: ['Careful. That almost sounded sincere.'],
        weak: ['You should work on that line.'],
        fail: ['That sounded better in your head, did it not?'],
      },
      proud: {
        strong: ['At least your taste is sound.'],
        weak: ['A bold line. Not your best, but bold.'],
        fail: ['You are reaching.'],
      },
      cold: {
        strong: ['That is more daring than wise.'],
        weak: ['You are testing your luck.'],
        fail: ['Do not embarrass yourself.'],
      },
    },
  },
  threaten: {
    key: 'threaten',
    category: 'coerce',
    label: 'Apply pressure.',
    socialType: 'coerce',
    socialStyle: 'threaten',
    socialCost: 2,
    playerLines: [
      'Do not waste my time.',
      'You understand what I am asking.',
      'Answer plainly before I lose patience.',
    ],
    defaultNpcResponses: {
      strong: ['Fine. Take what you came for and leave.'],
      weak: ['That tone might work on someone softer.'],
      fail: ['Try that again and see how far it gets you.'],
    },
    personalityResponses: {
      fearful: {
        strong: ['Fine. Fine. Just stop pushing.'],
        weak: ['All right. No need to crowd me.'],
        fail: ['I know what you are doing.'],
      },
      guarded: {
        strong: ['Fine. Take your satisfaction and go.'],
        weak: ['That tone might work on someone softer.'],
        fail: ['Try bullying me again and see what happens.'],
      },
      proud: {
        strong: ['You are insufferable. Fine.'],
        weak: ['Do not mistake restraint for weakness.'],
        fail: ['Threats do not improve your position.'],
      },
      cold: {
        strong: ['Very well. You have made your point.'],
        weak: ['Keep that tone and lose a finger for it.'],
        fail: ['You are less frightening than you think.'],
      },
      greedy: {
        strong: ['Fine. You have your leverage.'],
        weak: ['Pressure is only useful if it pays.'],
        fail: ['If you want something, buy it.'],
      },
    },
    classResponses: {
      noble: {
        fail: ['Mind yourself. That tone does not suit you.'],
      },
      merchant: {
        weak: ['I have dealt with harsher voices than yours.'],
      },
      criminal: {
        fail: ['You are not the first fool to try that voice on me.'],
      },
    },
  },
};

export const socialNpcInteractionConfigs: Record<string, SocialNpcInteractionConfig> = {
  npc_roberta: {
    availableInteractions: {
      friendly: ['smalltalk', 'helpful', 'honest', 'compliment'],
      flirt: ['flirt_compliment'],
      coerce: ['threaten'],
    },
  },
  npc_shihan_camp: {
    availableInteractions: {
      friendly: ['smalltalk', 'helpful', 'honest', 'compliment'],
      flirt: ['flirt_compliment'],
      coerce: ['threaten'],
    },
  },
};

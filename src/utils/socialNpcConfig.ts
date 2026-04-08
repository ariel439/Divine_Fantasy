export type SocialClass = 'poor' | 'working' | 'merchant' | 'criminal' | 'noble';

export type PersonalityTrait =
  | 'warm'
  | 'guarded'
  | 'practical'
  | 'lonely'
  | 'fearful'
  | 'proud'
  | 'greedy'
  | 'cold'
  | 'dutiful'
  | 'observant';

export interface SocialNpcConfig {
  socialClass: SocialClass;
  personality: PersonalityTrait[];
  presentationStandard: number;
  threatTolerance: number;
  whiteFangSocialExempt?: boolean;
  flirtable?: boolean;
  flirtFriendshipRequired?: number;
  dailyMeaningfulActions?: number;
  giftFriendshipGain?: number;
}

const DEFAULT_SOCIAL_NPC_CONFIG: SocialNpcConfig = {
  socialClass: 'working',
  personality: ['guarded'],
  presentationStandard: 2,
  threatTolerance: 2,
  whiteFangSocialExempt: false,
  flirtable: false,
  flirtFriendshipRequired: 999,
  dailyMeaningfulActions: 2,
};

const SOCIAL_NPC_CONFIGS: Record<string, SocialNpcConfig> = {
  npc_roberta: {
    socialClass: 'merchant',
    personality: ['guarded', 'practical', 'lonely'],
    presentationStandard: 2,
    threatTolerance: 3,
    flirtable: true,
    flirtFriendshipRequired: 20,
    dailyMeaningfulActions: 2,
  },
  npc_shihan_camp: {
    socialClass: 'noble',
    personality: ['guarded', 'observant', 'practical'],
    presentationStandard: 4,
    threatTolerance: 5,
    whiteFangSocialExempt: true,
    flirtable: true,
    flirtFriendshipRequired: 15,
    dailyMeaningfulActions: 2,
  },
  npc_ronald: {
    socialClass: 'working',
    personality: ['guarded', 'practical', 'observant'],
    presentationStandard: 1,
    threatTolerance: 4,
    flirtable: false,
    flirtFriendshipRequired: 999,
    dailyMeaningfulActions: 2,
  },
  npc_lin_shao: {
    socialClass: 'noble',
    personality: ['guarded', 'dutiful'],
    presentationStandard: 3,
    threatTolerance: 5,
    whiteFangSocialExempt: true,
    dailyMeaningfulActions: 2,
  },
  npc_wei_taren: {
    socialClass: 'noble',
    personality: ['guarded', 'observant'],
    presentationStandard: 3,
    threatTolerance: 5,
    whiteFangSocialExempt: true,
    dailyMeaningfulActions: 2,
  },
  npc_qiao_ren: {
    socialClass: 'noble',
    personality: ['guarded', 'dutiful'],
    presentationStandard: 3,
    threatTolerance: 5,
    whiteFangSocialExempt: true,
    dailyMeaningfulActions: 2,
  },
  npc_old_crank: {
    socialClass: 'poor',
    personality: ['lonely', 'greedy'],
    presentationStandard: 0,
    threatTolerance: 1,
    dailyMeaningfulActions: 2,
    giftFriendshipGain: 2,
  },
  npc_shaky_jace: {
    socialClass: 'poor',
    personality: ['fearful', 'lonely'],
    presentationStandard: 0,
    threatTolerance: 2,
    dailyMeaningfulActions: 2,
    giftFriendshipGain: 1,
  },
};

export function getSocialNpcConfig(npcId: string): SocialNpcConfig {
  return SOCIAL_NPC_CONFIGS[npcId] || DEFAULT_SOCIAL_NPC_CONFIG;
}

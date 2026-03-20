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
  flirtable?: boolean;
  flirtFriendshipRequired?: number;
  dailyMeaningfulActions?: number;
}

const DEFAULT_SOCIAL_NPC_CONFIG: SocialNpcConfig = {
  socialClass: 'working',
  personality: ['guarded'],
  flirtable: false,
  flirtFriendshipRequired: 999,
  dailyMeaningfulActions: 2,
};

const SOCIAL_NPC_CONFIGS: Record<string, SocialNpcConfig> = {
  npc_roberta: {
    socialClass: 'merchant',
    personality: ['guarded', 'practical', 'lonely'],
    flirtable: true,
    flirtFriendshipRequired: 20,
    dailyMeaningfulActions: 2,
  },
  npc_beryl: {
    socialClass: 'merchant',
    personality: ['guarded', 'fearful', 'greedy'],
    dailyMeaningfulActions: 2,
  },
  npc_elara: {
    socialClass: 'working',
    personality: ['guarded', 'warm', 'practical'],
    dailyMeaningfulActions: 2,
  },
  npc_finn: {
    socialClass: 'criminal',
    personality: ['cold', 'proud'],
    dailyMeaningfulActions: 2,
  },
  npc_old_leo: {
    socialClass: 'working',
    personality: ['warm', 'dutiful', 'observant'],
    dailyMeaningfulActions: 2,
  },
  npc_boric: {
    socialClass: 'working',
    personality: ['practical', 'guarded'],
    dailyMeaningfulActions: 2,
  },
};

export function getSocialNpcConfig(npcId: string): SocialNpcConfig {
  return SOCIAL_NPC_CONFIGS[npcId] || DEFAULT_SOCIAL_NPC_CONFIG;
}

import { create } from 'zustand';

export interface Companion {
  id: string;
  name: string;
  type: string;
  portraitUrl?: string;
  locationId?: string | null;
  status?: 'party' | 'world';
  stats: {
    hp: number;
    attack: number;
    defence: number;
    maxHp: number;
    dexterity: number;
  };
  equippedItems: string[];
}

interface CompanionState {
  activeCompanion: Companion | null;
  companions: Companion[];
  formation: Array<string | null>;
  setCompanion: (companion: Companion | null) => void;
  upsertCompanion: (companion: Companion) => void;
  removeCompanion: (companionId: string) => void;
  setCompanionLocation: (companionId: string, locationId: string | null) => void;
  setCompanionStatus: (companionId: string, status: 'party' | 'world') => void;
  setFormation: (formation: Array<string | null>) => void;
  updateCompanionStats: (updates: Partial<Companion['stats']>) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (itemId: string) => void;
  getPartyCompanions: () => Companion[];
}

const DEFAULT_FORMATION: Array<string | null> = ['player', null, null, null];

const normalizeCompanion = (companion: Companion): Companion => ({
  ...companion,
  portraitUrl: companion.portraitUrl || (companion.type === 'wolf' ? '/assets/portraits/WolfPuppy.png' : '/assets/portraits/Robert.png'),
  status: companion.status || 'party',
  locationId: companion.locationId ?? null,
  equippedItems: companion.equippedItems || [],
});

const syncActiveCompanion = (companions: Companion[], formation: Array<string | null>): Companion | null => {
  const firstPartyCompanionId = formation.find((entry) => entry && entry !== 'player');
  if (!firstPartyCompanionId) return null;
  return companions.find((companion) => companion.id === firstPartyCompanionId) || null;
};

export const useCompanionStore = create<CompanionState>((set, get) => ({
  activeCompanion: null,
  companions: [],
  formation: [...DEFAULT_FORMATION],

  setCompanion: (companion) => {
    if (!companion) {
      set({
        activeCompanion: null,
        companions: [],
        formation: [...DEFAULT_FORMATION],
      });
      return;
    }

    const normalized = normalizeCompanion(companion);
    const formation = ['player', normalized.id, null, null];
    set({
      activeCompanion: normalized,
      companions: [{ ...normalized, status: 'party' }],
      formation,
    });
  },

  upsertCompanion: (companion) => {
    const normalized = normalizeCompanion(companion);
    set((state) => {
      const companions = state.companions.some((entry) => entry.id === normalized.id)
        ? state.companions.map((entry) => (entry.id === normalized.id ? { ...entry, ...normalized } : entry))
        : [...state.companions, normalized];
      const formation = state.formation.includes(normalized.id)
        ? [...state.formation]
        : [...state.formation];
      return {
        companions,
        activeCompanion: syncActiveCompanion(companions, formation),
      };
    });
  },

  removeCompanion: (companionId) => {
    set((state) => {
      const companions = state.companions.filter((entry) => entry.id !== companionId);
      const formation = state.formation.map((entry) => (entry === companionId ? null : entry));
      if (!formation.some((entry, index) => index < 2 && entry)) {
        const playerIndex = formation.indexOf('player');
        if (playerIndex > 1) {
          const nextFormation = [...formation];
          nextFormation[playerIndex] = null;
          nextFormation[0] = 'player';
          return {
            companions,
            formation: nextFormation,
            activeCompanion: syncActiveCompanion(companions, nextFormation),
          };
        }
      }
      return {
        companions,
        formation,
        activeCompanion: syncActiveCompanion(companions, formation),
      };
    });
  },

  setCompanionLocation: (companionId, locationId) => {
    set((state) => {
      const companions = state.companions.map((entry) =>
        entry.id === companionId ? { ...entry, locationId } : entry
      );
      return {
        companions,
        activeCompanion: syncActiveCompanion(companions, state.formation),
      };
    });
  },

  setCompanionStatus: (companionId, status) => {
    set((state) => {
      const companions = state.companions.map((entry) =>
        entry.id === companionId ? { ...entry, status } : entry
      );
      return {
        companions,
        activeCompanion: syncActiveCompanion(companions, state.formation),
      };
    });
  },

  setFormation: (formation) => {
    const normalizedFormation = formation.slice(0, 4);
    while (normalizedFormation.length < 4) normalizedFormation.push(null);

    if (!normalizedFormation.includes('player')) {
      normalizedFormation[0] = 'player';
    }

    if (!normalizedFormation.slice(0, 2).some(Boolean)) {
      const playerIndex = normalizedFormation.indexOf('player');
      if (playerIndex >= 2) {
        normalizedFormation[playerIndex] = null;
        normalizedFormation[0] = 'player';
      }
    }

    set((state) => {
      const partyIds = new Set(normalizedFormation.filter((entry): entry is string => Boolean(entry) && entry !== 'player'));
      const companions = state.companions.map((entry) => ({
        ...entry,
        status: partyIds.has(entry.id) ? 'party' : 'world',
      }));
      return {
        formation: normalizedFormation,
        companions,
        activeCompanion: syncActiveCompanion(companions, normalizedFormation),
      };
    });
  },

  updateCompanionStats: (updates) => {
    set((state) => {
      if (!state.activeCompanion) return state;
      const activeId = state.activeCompanion.id;
      const companions = state.companions.map((entry) =>
        entry.id === activeId
          ? { ...entry, stats: { ...entry.stats, ...updates } }
          : entry
      );
      return {
        companions,
        activeCompanion: syncActiveCompanion(companions, state.formation),
      };
    });
  },

  equipItem: (itemId) => {
    set((state) => {
      if (!state.activeCompanion) return state;
      const activeId = state.activeCompanion.id;
      const companions = state.companions.map((entry) =>
        entry.id === activeId
          ? { ...entry, equippedItems: [...entry.equippedItems, itemId] }
          : entry
      );
      return {
        companions,
        activeCompanion: syncActiveCompanion(companions, state.formation),
      };
    });
  },

  unequipItem: (itemId) => {
    set((state) => {
      if (!state.activeCompanion) return state;
      const activeId = state.activeCompanion.id;
      const companions = state.companions.map((entry) =>
        entry.id === activeId
          ? { ...entry, equippedItems: entry.equippedItems.filter((id) => id !== itemId) }
          : entry
      );
      return {
        companions,
        activeCompanion: syncActiveCompanion(companions, state.formation),
      };
    });
  },

  getPartyCompanions: () => {
    const { companions, formation } = get();
    const idsInFormation = formation.filter((entry): entry is string => Boolean(entry) && entry !== 'player');
    return idsInFormation
      .map((companionId) => companions.find((entry) => entry.id === companionId))
      .filter(Boolean) as Companion[];
  },
}));

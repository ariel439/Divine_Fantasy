import React from 'react';
import type { FC } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { GameManagerService } from '../../services/GameManagerService';
import { useCompanionStore } from '../../stores/useCompanionStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useLocationStore } from '../../stores/useLocationStore';

const DebugMenuScreen: FC = () => {
  const { setScreen } = useUIStore();
  const worldStateStore = useWorldStateStore();
  const locationStore = useLocationStore();

  const ensureDebugCharacter = () => {
    const state = useCharacterStore.getState();
    if (!state.characterId || !state.bio?.name) {
      GameManagerService.startNewGame('luke_orphan');
    }
  };

  const handleBackToMenu = () => {
    setScreen('mainMenu');
  };

  const handleStartSmugglerIntroFight = () => {
    ensureDebugCharacter();
    worldStateStore.setIntroMode(true);
    worldStateStore.setIntroCompleted(false);
    worldStateStore.addKnownNpc('npc_robert');
    worldStateStore.setFlag('robert_status_unknown', false);

    const charStore = useCharacterStore.getState();
    if (!charStore.bio) {
      useCharacterStore.setState({
        bio: {
          name: 'Luke',
          image: '/assets/portraits/luke.jpg',
          description: 'Driftwatch Orphan',
          gender: 'Male',
          race: 'Human',
          birthplace: 'Driftwatch',
          born: '762'
        }
      });
    }

    const companionStore = useCompanionStore.getState();
    if (!companionStore.activeCompanion) {
      companionStore.setCompanion({
        id: 'npc_robert',
        name: 'Robert',
        type: 'human',
        stats: { hp: 70, maxHp: 70, attack: 7, defence: 6, dexterity: 7 },
        equippedItems: [],
      });
    }

    locationStore.setLocation('intro_docks');

    const maxHp = charStore.maxHp || 100;
    const maxEnergy = charStore.getMaxEnergy();
    useCharacterStore.setState({
      hp: maxHp,
      energy: maxEnergy,
      hunger: 100,
    });

    if (companionStore.activeCompanion) {
      companionStore.setCompanion({
        ...companionStore.activeCompanion,
        stats: {
          ...companionStore.activeCompanion.stats,
          hp: companionStore.activeCompanion.stats.maxHp,
        },
      });
    }

    GameManagerService.startSmugglerCombat();
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black/80">
      <div className="w-full max-w-3xl mx-auto bg-zinc-950/95 border border-zinc-700 rounded-xl p-6 shadow-lg overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>
            Debug Menu
          </h1>
          <button
            onClick={handleBackToMenu}
            className="px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm text-white border border-zinc-600"
          >
            Close
          </button>
        </div>

        <div className="space-y-6">
          <section className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-3">Combat Debug</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setScreen('combatDebug')}
                className="w-full px-4 py-3 rounded-md bg-red-900/40 hover:bg-red-800/60 text-red-100 text-sm font-semibold border border-red-800/50 transition-all hover:shadow-[0_0_10px_rgba(220,38,38,0.2)]"
              >
                Open Combat Debug Workspace
              </button>
            </div>
          </section>

          <section className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-3">Quest Debug</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setScreen('questDebug')}
                className="w-full px-4 py-3 rounded-md bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-100 text-sm font-semibold border border-emerald-800/50 transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              >
                Open Quest Debug Workspace
              </button>
              <button
                onClick={handleStartSmugglerIntroFight}
                className="w-full px-4 py-2 rounded-md bg-purple-900/40 hover:bg-purple-800/60 text-purple-100 text-sm font-semibold border border-purple-800/50 transition-all hover:shadow-[0_0_10px_rgba(147,51,234,0.2)]"
              >
                Quick: Smuggler Intro Fight
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DebugMenuScreen;

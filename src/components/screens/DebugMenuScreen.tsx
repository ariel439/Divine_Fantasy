import React from 'react';
import type { FC } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { GameManagerService } from '../../services/GameManagerService';
import { useCompanionStore } from '../../stores/useCompanionStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useLocationStore } from '../../stores/useLocationStore';
import { useDiaryStore } from '../../stores/useDiaryStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useSkillStore } from '../../stores/useSkillStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';

const DebugMenuScreen: FC = () => {
  const { setScreen } = useUIStore();
  const inventoryStore = useInventoryStore();
  const worldStateStore = useWorldStateStore();
  const locationStore = useLocationStore();
  const diaryStore = useDiaryStore();
  const journalStore = useJournalStore();

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

  const handleDebugRobertaQuest = () => {
    ensureDebugCharacter();

    journalStore.updateQuest('roberta_planks_for_the_past', { active: false, completed: false, currentStage: 0 });
    journalStore.updateQuest('roberta_set_the_shop_right', { active: false, completed: false, currentStage: 0 });
    useJournalStore.setState((state) => ({
      questsList: state.questsList.filter(q => q.id !== 'roberta_planks_for_the_past' && q.id !== 'roberta_set_the_shop_right')
    }));

    [
      'roberta_lore_seen',
      'roberta_asked_manage_alone',
      'roberta_asked_shop_future',
      'roberta_upgrade_counter_done',
      'roberta_upgrade_displays_done',
      'roberta_upgrade_storefront_done',
      'roberta_shop_upgrades_complete',
      'roberta_romance_unlocked',
      'roberta_flirt_unlocked',
      'roberta_romance_open',
      'roberta_kiss_done',
      'tide_trade_wall_repaired',
      'tide_trade_upgraded',
    ].forEach((flag) => worldStateStore.setFlag(flag, false));

    const currentRel = diaryStore.relationships['npc_roberta']?.friendship?.value || 0;
    const diff = 40 - currentRel;
    if (diff !== 0) {
      diaryStore.updateRelationship('npc_roberta', { friendship: diff });
    }
    const currentLove = diaryStore.relationships['npc_roberta']?.love?.value || 0;
    if (currentLove > 0) {
      diaryStore.updateRelationship('npc_roberta', { love: -currentLove });
    }
    const currentFear = diaryStore.relationships['npc_roberta']?.fear?.value || 0;
    if (currentFear > 0) {
      diaryStore.updateRelationship('npc_roberta', { fear: -currentFear });
    }
    const currentObedience = diaryStore.relationships['npc_roberta']?.obedience?.value || 0;
    if (currentObedience > 0) {
      diaryStore.updateRelationship('npc_roberta', { obedience: -currentObedience });
    }

    useSkillStore.getState().setSkillLevel('carpentry', 10);
    useCharacterStore.getState().addCurrency('gold', 99);

    const resetAndGrant = (itemId: string, quantity: number) => {
      const currentQty = inventoryStore.getItemQuantity(itemId);
      if (currentQty > 0) {
        inventoryStore.removeItem(itemId, currentQty);
      }
      if (quantity > 0) {
        inventoryStore.addItem(itemId, quantity);
      }
    };

    resetAndGrant('wooden_plank', 26);
    resetAndGrant('iron_nails', 36);
    resetAndGrant('cloth', 5);
    resetAndGrant('rope', 4);
    resetAndGrant('hammer', 1);

    locationStore.setLocation('tide_trade');
    useWorldTimeStore.setState({ hour: 9, minute: 0 });
    setScreen('inGame');
  };

  const handleStartFinnWeekRich = () => {
    GameManagerService.startNewGame('luke_orphan');
    GameManagerService.skipStoryIntroToFinnWeek();
    useCharacterStore.getState().addCurrency('gold', 99);
    setScreen('inGame');
  };

  const handleStartRonaldRouteCheck = () => {
    GameManagerService.startNewGame('luke_orphan');
    GameManagerService.skipStoryIntroToFinnWeek();

    worldStateStore.addKnownNpc('npc_ronald');

    [
      'ronald_asked_why_alone',
      'ronald_asked_forest_secret',
      'ronald_hidden_cabin_known',
      'ronald_wolf_pack_started',
      'ronald_wolf_pack_cleared',
      'ronald_referred_by_matthias',
      'ronald_referred_by_stan',
      'loc_cabin_unlocked',
    ].forEach((flag) => worldStateStore.setFlag(flag, false));

    worldStateStore.setData('ronald_hidden_path_progress', '0');

    journalStore.updateQuest('ronald_wolf_pack', { active: false, completed: false, currentStage: 0 });
    useJournalStore.setState((state) => ({
      questsList: state.questsList.filter((q) => q.id !== 'ronald_wolf_pack')
    }));

    const currentFriendship = diaryStore.relationships['npc_ronald']?.friendship?.value || 0;
    const friendshipDiff = 20 - currentFriendship;
    if (friendshipDiff !== 0) {
      diaryStore.updateRelationship('npc_ronald', { friendship: friendshipDiff });
    }

    const currentLove = diaryStore.relationships['npc_ronald']?.love?.value || 0;
    if (currentLove !== 0) {
      diaryStore.updateRelationship('npc_ronald', { love: -currentLove });
    }

    const currentFear = diaryStore.relationships['npc_ronald']?.fear?.value || 0;
    if (currentFear !== 0) {
      diaryStore.updateRelationship('npc_ronald', { fear: -currentFear });
    }

    const currentObedience = diaryStore.relationships['npc_ronald']?.obedience?.value || 0;
    if (currentObedience !== 0) {
      diaryStore.updateRelationship('npc_ronald', { obedience: -currentObedience });
    }

    if (inventoryStore.getItemQuantity('axe_basic') === 0) {
      inventoryStore.addItem('axe_basic', 1);
    }

    if (inventoryStore.getItemQuantity('spade') === 0) {
      inventoryStore.addItem('spade', 1);
    }

    locationStore.setLocation('hunters_cabin');
    useWorldTimeStore.setState({ hour: 9, minute: 0 });
    setScreen('inGame');
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
            <h2 className="text-lg font-semibold text-white mb-3">Quest Testing</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleStartSmugglerIntroFight}
                className="w-full px-4 py-2 rounded-md bg-purple-900/40 hover:bg-purple-800/60 text-purple-100 text-sm font-semibold border border-purple-800/50 transition-all hover:shadow-[0_0_10px_rgba(147,51,234,0.2)]"
              >
                Start Smuggler Intro Fight (Luke + Robert)
              </button>
              <button
                onClick={handleStartFinnWeekRich}
                className="w-full px-4 py-2 rounded-md bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-100 text-sm font-semibold border border-emerald-800/50 transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              >
                Start Luke at Finn Week (99 Gold)
              </button>
              <button
                onClick={handleDebugRobertaQuest}
                className="w-full px-4 py-2 rounded-md bg-blue-900/40 hover:bg-blue-800/60 text-blue-100 text-sm font-semibold border border-blue-800/50 transition-all hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]"
              >
                Start Roberta Route Check
              </button>
              <button
                onClick={handleStartRonaldRouteCheck}
                className="w-full px-4 py-2 rounded-md bg-amber-900/40 hover:bg-amber-800/60 text-amber-100 text-sm font-semibold border border-amber-800/50 transition-all hover:shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              >
                Start Ronald Route Check
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DebugMenuScreen;

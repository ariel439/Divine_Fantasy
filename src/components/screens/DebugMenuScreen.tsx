import React, { useState } from 'react';
import type { FC } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { GameManagerService } from '../../services/GameManagerService';
import itemsJson from '../../data/items.json';
import type { Item, EquipmentSlot } from '../../types';
import { useWorldStateStore } from '../../stores/useWorldStateStore';

const DebugMenuScreen: FC = () => {
  const { setScreen } = useUIStore();
  const inventoryStore = useInventoryStore();
  const characterStore = useCharacterStore();
  const worldStateStore = useWorldStateStore();

  const [playerSetup, setPlayerSetup] = useState<'naked' | 'naked_dagger' | 'wolf_dagger' | 'iron_dagger'>('naked');
  const [wolfCount, setWolfCount] = useState<number>(1);

  const handleBackToMenu = () => {
    setScreen('mainMenu');
  };

  const handleFullRestore = () => {
    useCharacterStore.setState({
      energy: 100,
      hp: 100,
      hunger: 100,
    });
    // Ensure we aren't dead
    if (characterStore.hp <= 0) {
       useCharacterStore.setState({ hp: 100 });
    }
  };

  const handleStartCombatTest = () => {
    // 0. Disable Tutorial
    worldStateStore.setFlag('combat_tutorial_seen', true);
    worldStateStore.setFlag('combat_tutorial_active', false);

    // 1. Apply Player Setup
    const charStore = useCharacterStore.getState();
    const invStore = useInventoryStore.getState();

    // Unequip all current items
    if (charStore.equippedItems) {
      Object.values(charStore.equippedItems).forEach((item: any) => {
        charStore.unequipItem(item);
      });
    }

    // Helper to add and equip
    const equip = (itemId: string) => {
      invStore.addItem(itemId, 1);
      const itemDef = itemsJson[itemId as keyof typeof itemsJson];
      if (itemDef) {
        // Construct the item object as expected by equipItem (needs id and stats from json)
        // Explicitly cast equipmentSlot and ensure icon exists to prevent UI crashes
        const item = {
          ...itemDef,
          id: itemId,
          equipmentSlot: (itemDef as any).equipmentSlot as EquipmentSlot,
          icon: <img src={itemDef.image} alt={itemDef.name} className="w-full h-full object-contain" />,
          category: itemDef.type as any,
        } as unknown as Item;
        
        charStore.equipItem(item);
      }
    };

    switch (playerSetup) {
      case 'naked':
        // Already unequipped
        break;
      case 'naked_dagger':
        equip('crude_knife');
        break;
      case 'wolf_dagger':
        equip('wolf_leather_helmet');
        equip('wolf_leather_armor');
        equip('wolf_leather_legs');
        equip('wolf_tooth_amulet');
        equip('crude_knife');
        break;
      case 'iron_dagger':
        equip('iron_helmet');
        equip('iron_chainmail');
        equip('iron_leggings');
        equip('crude_knife');
        break;
    }

    // 2. Start Combat
    GameManagerService.startWoodsCombat(wolfCount);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black/80">
      <div className="w-full max-w-2xl mx-auto bg-zinc-950/95 border border-zinc-700 rounded-xl p-6 shadow-lg overflow-y-auto max-h-[90vh]">
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
            <h2 className="text-lg font-semibold text-white mb-3">Combat Testing Suite</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Player Setup</label>
                <select
                  value={playerSetup}
                  onChange={(e) => setPlayerSetup(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-md p-2 focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  <option value="naked">Luke Naked</option>
                  <option value="naked_dagger">Luke Naked + Dagger</option>
                  <option value="wolf_dagger">Wolf Set + Dagger</option>
                  <option value="iron_dagger">Iron Set + Dagger</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Enemy Setup</label>
                <select
                  value={wolfCount}
                  onChange={(e) => setWolfCount(Number(e.target.value))}
                  className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-md p-2 focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  <option value={1}>1 Forest Wolf</option>
                  <option value={2}>2 Forest Wolves</option>
                  <option value={4}>4 Forest Wolves</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleStartCombatTest}
                className="flex-1 px-4 py-2 rounded-md bg-red-900/40 hover:bg-red-800/60 text-red-100 text-sm font-semibold border border-red-800/50 transition-all hover:shadow-[0_0_10px_rgba(220,38,38,0.2)]"
              >
                Start Test Combat
              </button>
              <button
                onClick={handleFullRestore}
                className="flex-1 px-4 py-2 rounded-md bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-100 text-sm font-semibold border border-emerald-800/50 transition-all hover:shadow-[0_0_10px_rgba(5,150,105,0.2)]"
              >
                Heal & Restore Stats
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DebugMenuScreen;

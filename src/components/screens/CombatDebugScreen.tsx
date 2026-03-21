import React, { useMemo, useState } from 'react';
import type { FC } from 'react';
import { ArrowLeft, Shield, Swords, Users, Skull, Zap, Heart } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useSkillStore } from '../../stores/useSkillStore';
import { useCompanionStore } from '../../stores/useCompanionStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { GameManagerService } from '../../services/GameManagerService';
import itemsJson from '../../data/items.json';
import enemiesJson from '../../data/enemies.json';
import type { EquipmentSlot, Item } from '../../types';

type CompanionSetup = 'none' | 'wolf' | 'robert';
type EncounterMode = 'standard' | 'brawl';
type EnemySlotValue = 'none' | keyof typeof enemiesJson;
type DebugGearSlot = 'head' | 'chest' | 'legs' | 'boots' | 'weapon' | 'amulet';
type GearSelection = Record<DebugGearSlot, string>;

const GEAR_SLOT_LABELS: Record<DebugGearSlot, string> = {
  head: 'Head',
  chest: 'Chest',
  legs: 'Legs',
  boots: 'Boots',
  weapon: 'Weapon',
  amulet: 'Amulet',
};

const GEAR_PRESETS: Array<{ id: string; label: string; gear: GearSelection }> = [
  {
    id: 'naked',
    label: 'Naked',
    gear: { head: '', chest: '', legs: '', boots: '', weapon: '', amulet: '' },
  },
  {
    id: 'dagger',
    label: 'Dagger',
    gear: { head: '', chest: '', legs: '', boots: '', weapon: 'crude_knife', amulet: '' },
  },
  {
    id: 'ragged_dagger',
    label: 'Rags + Dagger',
    gear: { head: '', chest: 'ragged_shirt', legs: 'ragged_legs', boots: '', weapon: 'crude_knife', amulet: '' },
  },
  {
    id: 'wolf_set',
    label: 'Wolf Set',
    gear: {
      head: 'wolf_leather_helmet',
      chest: 'wolf_leather_armor',
      legs: 'wolf_leather_legs',
      boots: '',
      weapon: 'crude_knife',
      amulet: 'wolf_tooth_amulet',
    },
  },
  {
    id: 'iron_set',
    label: 'Iron Set',
    gear: {
      head: 'iron_helmet',
      chest: 'iron_chainmail',
      legs: 'iron_leggings',
      boots: '',
      weapon: 'iron_sword',
      amulet: '',
    },
  },
  {
    id: 'common_social',
    label: 'Common Clothes',
    gear: {
      head: '',
      chest: 'common_shirt',
      legs: 'common_legs',
      boots: 'common_shoes',
      weapon: '',
      amulet: '',
    },
  },
];

const CombatDebugScreen: FC = () => {
  const { setScreen } = useUIStore();
  const characterState = useCharacterStore();
  const [companionSetup, setCompanionSetup] = useState<CompanionSetup>('none');
  const [encounterMode, setEncounterMode] = useState<EncounterMode>('standard');
  const [enemySlots, setEnemySlots] = useState<EnemySlotValue[]>(['wolf_forest', 'none', 'none', 'none']);
  const [selectedGear, setSelectedGear] = useState<GearSelection>({
    head: '',
    chest: 'ragged_shirt',
    legs: 'ragged_legs',
    boots: '',
    weapon: '',
    amulet: '',
  });

  const equippableBySlot = useMemo(() => {
    const initial: Record<DebugGearSlot, Array<{ id: string; name: string }>> = {
      head: [],
      chest: [],
      legs: [],
      boots: [],
      weapon: [],
      amulet: [],
    };

    Object.entries(itemsJson).forEach(([id, item]) => {
      const slot = (item as any).equipmentSlot as DebugGearSlot | undefined;
      if (!slot || !(slot in initial)) return;
      initial[slot].push({ id, name: item.name });
    });

    Object.values(initial).forEach((items) => items.sort((a, b) => a.name.localeCompare(b.name)));
    return initial;
  }, []);

  const enemyOptions = useMemo(
    () =>
      Object.entries(enemiesJson).map(([id, enemy]) => ({
        id: id as keyof typeof enemiesJson,
        label: enemy.name,
      })),
    []
  );

  const previewStats = useMemo(() => {
    const baseStrength = characterState.attributes?.strength ?? 3;
    const baseDexterity = characterState.attributes?.dexterity ?? 4;

    let attack = baseStrength;
    let defence = Math.floor((baseStrength + baseDexterity) / 2);
    let dexterity = baseDexterity;
    let bonusHp = 0;

    Object.values(selectedGear).forEach((itemId) => {
      if (!itemId) return;
      const item = itemsJson[itemId as keyof typeof itemsJson] as any;
      if (!item?.stats) return;
      const stats = item.stats;
      if (typeof stats.attack === 'number') attack += stats.attack;
      if (typeof stats.strength === 'number') attack += stats.strength;
      if (typeof stats.defence === 'number') defence += stats.defence;
      if (typeof stats.dexterity === 'number') dexterity += stats.dexterity;
      if (typeof stats.hp === 'number') bonusHp += stats.hp;
    });

    const maxHp = 50 + baseStrength * 10 + bonusHp;
    return { attack, defence, dexterity, maxHp };
  }, [characterState.attributes, selectedGear]);

  const selectedEnemies = enemySlots.filter((slot): slot is keyof typeof enemiesJson => slot !== 'none');

  const ensureDebugCharacter = () => {
    const state = useCharacterStore.getState();
    if (!state.characterId || !state.bio?.name) {
      GameManagerService.startNewGame('luke_orphan');
    }
  };

  const clearEquipment = () => {
    const character = useCharacterStore.getState();
    Object.values(character.equippedItems || {}).forEach((item: any) => {
      if (item) character.unequipItem(item);
    });
  };

  const addAndEquip = (itemId: string) => {
    const inventory = useInventoryStore.getState();
    const character = useCharacterStore.getState();
    const itemDef = itemsJson[itemId as keyof typeof itemsJson];
    if (!itemDef) return;

    inventory.addItem(itemId, 1);
    const item = {
      ...itemDef,
      id: itemId,
      equipmentSlot: (itemDef as any).equipmentSlot as EquipmentSlot,
      icon: <img src={itemDef.image} alt={itemDef.name} className="w-full h-full object-contain" />,
      category: itemDef.type as any,
    } as unknown as Item;
    character.equipItem(item);
  };

  const applyPlayerSetup = () => {
    ensureDebugCharacter();
    useWorldStateStore.getState().setFlag('combat_tutorial_seen', true);
    useWorldStateStore.getState().setFlag('combat_tutorial_active', false);

    clearEquipment();
    useCompanionStore.getState().setCompanion(null);

    const skillStore = useSkillStore.getState();
    skillStore.setSkillLevel('attack', 1);
    skillStore.setSkillLevel('defense', 1);
    skillStore.setSkillLevel('agility', 1);

    (Object.keys(selectedGear) as DebugGearSlot[]).forEach((slot) => {
      const itemId = selectedGear[slot];
      if (itemId) addAndEquip(itemId);
    });

    useCharacterStore.getState().recalculateStats();
  };

  const applyCompanionSetup = () => {
    const companionStore = useCompanionStore.getState();
    if (companionSetup === 'none') {
      companionStore.setCompanion(null);
      return;
    }
    if (companionSetup === 'wolf') {
      companionStore.setCompanion({
        id: 'wolf_puppy',
        name: 'Wolf Puppy',
        type: 'wolf',
        stats: { hp: 40, maxHp: 40, attack: 5, defence: 2, dexterity: 12 },
        equippedItems: [],
      });
      return;
    }
    companionStore.setCompanion({
      id: 'npc_robert',
      name: 'Robert',
      type: 'human',
      stats: { hp: 70, maxHp: 70, attack: 7, defence: 6, dexterity: 7 },
      equippedItems: [],
    });
  };

  const handleLaunchCombat = () => {
    applyPlayerSetup();
    applyCompanionSetup();
    GameManagerService.startDebugCombat(selectedEnemies, {
      encounterType: encounterMode,
      knockoutOnDefeat: encounterMode === 'brawl',
    });
  };

  const handleRestore = () => {
    ensureDebugCharacter();
    const maxHp = useCharacterStore.getState().maxHp || 100;
    const maxEnergy = useCharacterStore.getState().getMaxEnergy();
    useCharacterStore.setState({
      hp: maxHp,
      energy: maxEnergy,
      hunger: 100,
    });
  };

  const applyGearPreset = (presetId: string) => {
    const preset = GEAR_PRESETS.find((entry) => entry.id === presetId);
    if (preset) setSelectedGear(preset.gear);
  };

  return (
    <div className="w-full h-full bg-black/85 p-4 md:p-6">
      <div className="w-full h-full bg-zinc-950/95 border border-zinc-700 rounded-2xl p-6 shadow-2xl overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Cinzel, serif' }}>
              <Swords className="text-red-400" size={30} />
              Combat Debug Workbench
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Configure gear piece by piece, build mixed enemy groups, attach companions, and launch reusable combat tests.
            </p>
          </div>
          <button
            onClick={() => setScreen('debugMenu')}
            className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm text-white border border-zinc-600 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-[1.2fr_1fr_0.8fr] gap-6">
          <section className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={18} className="text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Player Loadout</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              {GEAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyGearPreset(preset.id)}
                  className="px-3 py-3 rounded-md bg-zinc-950 border border-zinc-700 text-sm text-zinc-200 hover:border-zinc-500 transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(GEAR_SLOT_LABELS) as DebugGearSlot[]).map((slot) => (
                <div key={slot} className="flex flex-col gap-2">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">{GEAR_SLOT_LABELS[slot]}</label>
                  <select
                    value={selectedGear[slot]}
                    onChange={(e) => setSelectedGear((prev) => ({ ...prev, [slot]: e.target.value }))}
                    className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-md p-3"
                  >
                    <option value="">None</option>
                    {equippableBySlot[slot].map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <Skull size={18} className="text-red-400" />
              <h2 className="text-lg font-semibold text-white">Encounter Builder</h2>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Encounter Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setEncounterMode('standard')}
                  className={`px-4 py-3 rounded-md border text-sm font-semibold transition-all ${encounterMode === 'standard' ? 'bg-red-900/40 border-red-700 text-red-100' : 'bg-zinc-950 border-zinc-700 text-zinc-300'}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setEncounterMode('brawl')}
                  className={`px-4 py-3 rounded-md border text-sm font-semibold transition-all ${encounterMode === 'brawl' ? 'bg-orange-900/40 border-orange-700 text-orange-100' : 'bg-zinc-950 border-zinc-700 text-zinc-300'}`}
                >
                  Brawl
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enemySlots.map((slot, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">Enemy Slot {index + 1}</label>
                  <select
                    value={slot}
                    onChange={(e) => {
                      const next = [...enemySlots];
                      next[index] = e.target.value as EnemySlotValue;
                      setEnemySlots(next);
                    }}
                    className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-md p-3"
                  >
                    <option value="none">None</option>
                    {enemyOptions.map((enemy) => (
                      <option key={enemy.id} value={enemy.id}>{enemy.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <Users size={18} className="text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Preview & Launch</h2>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Companion</label>
              <select
                value={companionSetup}
                onChange={(e) => setCompanionSetup(e.target.value as CompanionSetup)}
                className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-md p-3"
              >
                <option value="none">None</option>
                <option value="wolf">Wolf Puppy</option>
                <option value="robert">Robert</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider mb-1">
                  <Heart size={12} />
                  Max HP
                </div>
                <div className="text-xl font-bold text-white">{previewStats.maxHp}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider mb-1">
                  <Swords size={12} />
                  Attack
                </div>
                <div className="text-xl font-bold text-white">{previewStats.attack}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider mb-1">
                  <Shield size={12} />
                  Defence
                </div>
                <div className="text-xl font-bold text-white">{previewStats.defence}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider mb-1">
                  <Zap size={12} />
                  Dexterity
                </div>
                <div className="text-xl font-bold text-white">{previewStats.dexterity}</div>
              </div>
            </div>

            <div className="space-y-2 mb-5 text-sm text-zinc-400">
              <div>Enemies selected: <span className="text-zinc-200">{selectedEnemies.length}</span></div>
              <div>Mode: <span className="text-zinc-200">{encounterMode === 'brawl' ? 'Brawl / Knockout' : 'Standard Combat'}</span></div>
              <div>Companion: <span className="text-zinc-200">{companionSetup === 'none' ? 'None' : companionSetup === 'wolf' ? 'Wolf Puppy' : 'Robert'}</span></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleLaunchCombat}
                disabled={selectedEnemies.length === 0}
                className="px-4 py-4 rounded-md bg-red-900/40 hover:bg-red-800/60 disabled:opacity-40 disabled:cursor-not-allowed text-red-100 text-sm font-semibold border border-red-800/50 transition-all"
              >
                Launch Combat
              </button>
              <button
                onClick={handleRestore}
                className="px-4 py-4 rounded-md bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-100 text-sm font-semibold border border-emerald-800/50 transition-all"
              >
                Heal & Restore
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CombatDebugScreen;

import React, { useMemo, useState } from 'react';
import { GripVertical, MapPin, Shield, Users, UserPlus, LogOut } from 'lucide-react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useCompanionStore } from '../../stores/useCompanionStore';
import { useLocationStore } from '../../stores/useLocationStore';
import locationsData from '../../data/locations.json';
import ProgressBar from '../ui/ProgressBar';

const SLOT_LABELS = ['Front Left', 'Front Right', 'Back Left', 'Back Right'];
const COMBAT_LAYOUT_ORDER = [2, 0, 3, 1];

const locationNameMap = locationsData as Record<string, { name?: string }>;

interface RosterEntry {
  id: string;
  name: string;
  portraitUrl: string;
  statusText: string;
  inParty: boolean;
  locationText: string;
  isPlayer: boolean;
  canRejoinHere: boolean;
  isDowned: boolean;
  hp: number;
  maxHp: number;
}

const getPlayerCombatStats = (character: ReturnType<typeof useCharacterStore.getState>) => {
  let attack = character.attributes.strength || 0;
  let defence = Math.floor(((character.attributes.strength || 0) + (character.attributes.dexterity || 0)) / 2);
  let dexterity = character.attributes.dexterity || 0;

  Object.values(character.equippedItems || {}).forEach((item: any) => {
    if (!item?.stats) return;
    const stats = Object.keys(item.stats).reduce((acc: any, key) => {
      acc[key.toLowerCase()] = item.stats[key];
      return acc;
    }, {});
    if (typeof stats.attack === 'number') attack += stats.attack;
    if (typeof stats.strength === 'number') attack += stats.strength;
    if (typeof stats.defence === 'number') defence += stats.defence;
    if (typeof stats.dexterity === 'number') dexterity += stats.dexterity;
  });

  return { attack, defence, dexterity };
};

const CompanionTab: React.FC = () => {
  const character = useCharacterStore();
  const companions = useCompanionStore((state) => state.companions || []);
  const formation = useCompanionStore((state) => state.formation || ['player', null, null, null]);
  const setFormation = useCompanionStore((state) => state.setFormation);
  const setCompanionLocation = useCompanionStore((state) => state.setCompanionLocation);
  const setCompanionStatus = useCompanionStore((state) => state.setCompanionStatus);
  const currentLocationId = useLocationStore((state) => state.currentLocationId);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<'formation' | 'roster' | null>(null);
  const playerCombatStats = useMemo(() => getPlayerCombatStats(character), [character.attributes, character.equippedItems]);

  const companionById = useMemo(
    () => Object.fromEntries(companions.map((companion) => [companion.id, companion])),
    [companions]
  );

  const describeLocation = (locationId?: string | null) => {
    if (!locationId) return 'Elsewhere';
    return locationNameMap[locationId]?.name || 'Elsewhere';
  };

  const getRestLocationForCompanion = (companionId: string) => {
    if (companionId === 'wolf_puppy') return 'hunters_cabin';
    return null;
  };

  const getOccupant = (occupantId: string | null) => {
    if (!occupantId) return null;
    if (occupantId === 'player') {
      return {
        id: 'player',
        name: character.bio?.name || 'Luke',
        portraitUrl: character.bio?.image || '/assets/portraits/luke.jpg',
        subtitle: 'You',
        hp: character.hp,
        maxHp: character.maxHp || 100,
        attack: playerCombatStats.attack,
        defence: playerCombatStats.defence,
        dexterity: playerCombatStats.dexterity,
        isPlayer: true,
      };
    }

    const companion = companionById[occupantId];
    if (!companion) return null;
    return {
      id: companion.id,
      name: companion.name,
      portraitUrl: companion.portraitUrl || '/assets/portraits/companionplaceholder.png',
      subtitle: companion.type === 'wolf' ? 'Companion Beast' : 'Companion',
      hp: companion.stats.hp,
      maxHp: companion.stats.maxHp,
      attack: companion.stats.attack,
      defence: companion.stats.defence,
      dexterity: companion.stats.dexterity,
      isPlayer: false,
    };
  };

  const commitFormation = (nextFormation: Array<string | null>) => {
    const normalized = nextFormation.slice(0, 4);
    while (normalized.length < 4) normalized.push(null);

    if (!normalized.includes('player')) return;
    if (!normalized.slice(0, 2).some(Boolean)) return;

    setFormation(normalized);
  };

  const handleDropToSlot = (targetIndex: number) => {
    if (!draggingId) return;

    const nextFormation = [...formation];
    const sourceIndex = nextFormation.findIndex((entry) => entry === draggingId);
    const targetOccupant = nextFormation[targetIndex];

    if (dragSource === 'roster') {
      const companion = companionById[draggingId];
      if (!companion || companion.stats.hp <= 0) return;
      if (companion.status === 'world' && companion.locationId && companion.locationId !== currentLocationId) return;
      if (targetOccupant === 'player') return;
      if (sourceIndex >= 0) {
        nextFormation[sourceIndex] = targetOccupant || null;
      }
      setCompanionStatus(draggingId, 'party');
      setCompanionLocation(draggingId, null);
      nextFormation[targetIndex] = draggingId;
      commitFormation(nextFormation);
      return;
    }

    if (sourceIndex === -1 || sourceIndex === targetIndex) return;
    nextFormation[sourceIndex] = targetOccupant || null;
    nextFormation[targetIndex] = draggingId;
    commitFormation(nextFormation);
  };

  const handleAddToParty = (companionId: string) => {
    const nextFormation = [...formation];
    if (nextFormation.includes(companionId)) return;

    const companion = companionById[companionId];
    if (!companion || companion.stats.hp <= 0) return;
    if (companion.status === 'world' && companion.locationId && companion.locationId !== currentLocationId) return;

    const preferredSlot = nextFormation.findIndex((entry, index) => index >= 2 && !entry);
    const anyEmptySlot = nextFormation.findIndex((entry) => !entry);
    const targetIndex = preferredSlot !== -1 ? preferredSlot : anyEmptySlot;
    if (targetIndex === -1) return;

    setCompanionStatus(companionId, 'party');
    setCompanionLocation(companionId, null);
    nextFormation[targetIndex] = companionId;
    commitFormation(nextFormation);
  };

  const handleRemoveFromParty = (companionId: string) => {
    const restLocation = getRestLocationForCompanion(companionId);
    setCompanionStatus(companionId, 'world');
    setCompanionLocation(companionId, restLocation);
    const nextFormation = formation.map((entry) => (entry === companionId ? null : entry));
    if (!nextFormation.slice(0, 2).some(Boolean)) return;
    commitFormation(nextFormation);
  };

  const rosterEntries = useMemo<RosterEntry[]>(() => {
    const playerEntry: RosterEntry = {
      id: 'player',
      name: character.bio?.name || 'Luke',
      portraitUrl: character.bio?.image || '/assets/portraits/luke.jpg',
      statusText: 'In your party',
      inParty: true,
      locationText: 'Current formation',
      isPlayer: true,
      canRejoinHere: true,
      isDowned: false,
      hp: character.hp,
      maxHp: character.maxHp || 100,
    };

    const companionEntries: RosterEntry[] = companions
      .map((companion) => ({
        id: companion.id,
        name: companion.name,
        portraitUrl: companion.portraitUrl || '/assets/portraits/companionplaceholder.png',
        statusText: formation.includes(companion.id)
          ? 'In your party'
          : companion.stats.hp <= 0
            ? `Downed at ${describeLocation(companion.locationId)}`
            : describeLocation(companion.locationId),
        locationText: formation.includes(companion.id) ? 'Current formation' : describeLocation(companion.locationId),
        inParty: formation.includes(companion.id),
        canRejoinHere: companion.locationId ? companion.locationId === currentLocationId : true,
        isDowned: companion.stats.hp <= 0,
        hp: companion.stats.hp,
        maxHp: companion.stats.maxHp,
        isPlayer: false,
      }))
      .sort((a, b) => Number(b.inParty) - Number(a.inParty) || a.name.localeCompare(b.name));

    return [playerEntry, ...companionEntries];
  }, [character.bio, companions, formation, currentLocationId]);

  return (
    <div className="w-full h-full grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-stretch animate-fade-in-up">
      <div className="min-h-0 bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-5 lg:p-6 shadow-2xl flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-100">Party Formation</h2>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Drag companions between the four combat slots</p>
          </div>
        </div>

        <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 auto-rows-fr">
                {COMBAT_LAYOUT_ORDER.map((index) => {
                  const occupantId = formation[index];
                  const occupant = getOccupant(occupantId);
                  const isFront = index < 2;
                  return (
                    <div
                      key={`${occupantId || 'empty'}-${index}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        handleDropToSlot(index);
                        setDraggingId(null);
                        setDragSource(null);
                      }}
                      className={`relative rounded-2xl border min-h-[240px] lg:min-h-[260px] h-full overflow-hidden transition-all ${
                        isFront
                          ? 'border-red-900/40 bg-red-950/10 lg:translate-x-3'
                          : 'border-sky-900/30 bg-sky-950/10 lg:-translate-x-3'
                      } ${occupant ? 'shadow-xl' : 'border-dashed'}`}
                    >
                      <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-black/70 border border-zinc-700 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-300">
                        {SLOT_LABELS[index]}
                      </div>

                      {occupant ? (
                        <div
                          draggable
                          onDragStart={() => {
                            setDraggingId(occupant.id);
                            setDragSource('formation');
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragSource(null);
                          }}
                          className="h-full flex flex-col cursor-grab active:cursor-grabbing"
                        >
                          <img src={occupant.portraitUrl} alt={occupant.name} className="w-full h-36 sm:h-40 lg:h-44 object-cover shrink-0" />
                          <div className="p-4 h-full flex flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-lg font-bold text-white truncate" style={{ fontFamily: 'Cinzel, serif' }}>{occupant.name}</p>
                              </div>
                              <div className="p-2 rounded-lg border border-zinc-700 bg-black/50 text-zinc-400 shrink-0">
                                <GripVertical size={16} />
                              </div>
                            </div>
                            <div className="mt-auto pt-4">
                              <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Health</span>
                                <span className="text-xs font-black text-zinc-200">
                                  {Math.floor(occupant.hp)}/{Math.floor(occupant.maxHp)}
                                </span>
                              </div>
                              <ProgressBar
                                value={Math.floor(occupant.hp)}
                                max={Math.max(1, Math.floor(occupant.maxHp))}
                                colorClass={occupant.isPlayer ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.35)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]'}
                                variant="thick"
                                showText={false}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                          <Shield size={28} className="text-zinc-700 mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Empty Slot</p>
                          <p className="text-xs text-zinc-600 mt-2 max-w-[180px]">
                            Drag a companion here to place them in the {isFront ? 'frontline' : 'backline'}.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </div>
      </div>

      <div className="min-h-[320px] xl:min-h-0 bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-5 shadow-2xl flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-100">Companion Tab</h2>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-3 min-h-0">
          {rosterEntries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-zinc-800/50 bg-black/30 p-3">
              <div className="flex items-center gap-3">
                <div
                  draggable={!entry.isPlayer}
                  onDragStart={() => {
                    if (entry.isPlayer) return;
                    setDraggingId(entry.id);
                    setDragSource('roster');
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragSource(null);
                  }}
                  className={entry.isPlayer ? '' : 'cursor-grab active:cursor-grabbing'}
                >
                  <img src={entry.portraitUrl} alt={entry.name} className="w-14 h-14 rounded-xl object-cover border border-zinc-700/60" />
                </div>
                <div className="min-w-0 flex-grow">
                  <p className="text-sm font-bold text-white truncate">{entry.name}</p>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    <MapPin size={12} />
                    <span className="truncate">{entry.statusText}</span>
                  </div>
                  {!entry.isPlayer && (
                    <p className="mt-1 text-[10px] text-zinc-400">
                      HP {Math.floor(entry.hp ?? 0)}/{Math.floor(entry.maxHp ?? 0)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {!entry.isPlayer && !entry.inParty && (
                  <button
                    onClick={() => handleAddToParty(entry.id)}
                    disabled={entry.isDowned || !entry.canRejoinHere}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-emerald-700/40 bg-emerald-950/20 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 hover:bg-emerald-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <UserPlus size={12} />
                    Add To Party
                  </button>
                )}
                {!entry.isPlayer && entry.inParty && (
                  <button
                    onClick={() => handleRemoveFromParty(entry.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-700/60 bg-black/40 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200 hover:bg-zinc-900/60 transition-colors"
                  >
                    <LogOut size={12} />
                    Remove
                  </button>
                )}
                {entry.isPlayer && (
                  <div className="flex-1 px-3 py-2 rounded-xl border border-amber-700/30 bg-amber-950/10 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 text-center">
                    Party Leader
                  </div>
                )}
              </div>
              {!entry.isPlayer && !entry.inParty && !entry.canRejoinHere && (
                <p className="mt-2 text-[10px] text-zinc-500">
                  Visit {entry.locationText} to bring {entry.name} back into the party.
                </p>
              )}
              {!entry.isPlayer && entry.isDowned && (
                <p className="mt-2 text-[10px] text-amber-300">
                  Downed companions recover when Luke sleeps.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanionTab;

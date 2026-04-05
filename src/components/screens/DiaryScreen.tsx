import React, { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { Search, User, Heart, ArrowLeft, BookOpen, ScrollText, MessageSquare, XCircle, Users, ShieldAlert, Sparkles } from 'lucide-react';
import type { Npc } from '../../types';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useDiaryStore } from '../../stores/useDiaryStore';
import { useUIStore } from '../../stores/useUIStore';
import npcsData from '../../data/npcs.json';
import ProgressBar from '../ui/ProgressBar';
import CompanionTab from './CompanionTab';

const ENEMY_THRESHOLD = -20;
const FRIENDLY_THRESHOLD = 20;

type DiaryStatusTone = 'romance' | 'submissive' | 'offline' | 'enemy' | 'friendly' | 'neutral' | 'unknown';

const STATUS_SORT_PRIORITY: Record<DiaryStatusTone, number> = {
    romance: 0,
    submissive: 1,
    friendly: 2,
    enemy: 3,
    neutral: 4,
    unknown: 5,
    offline: 6,
};

function getFriendshipToneClasses(value: number) {
    if (value >= FRIENDLY_THRESHOLD) {
        return {
            valueClass: 'text-emerald-300',
            iconClass: 'text-emerald-300',
            colorClass: 'bg-emerald-500/80',
            negativeColorClass: 'bg-red-500/80',
        };
    }
    if (value <= ENEMY_THRESHOLD) {
        return {
            valueClass: 'text-red-300',
            iconClass: 'text-red-300',
            colorClass: 'bg-red-500/80',
            negativeColorClass: 'bg-red-500/80',
        };
    }
    return {
        valueClass: 'text-blue-300',
        iconClass: 'text-blue-300',
        colorClass: 'bg-blue-500/80',
        negativeColorClass: 'bg-red-500/80',
    };
}

function getNpcStateFlagPrefix(npcId: string): string {
    return npcId.replace(/^npc_/, '');
}

function getDiaryStatusTone(
    npcId: string,
    friendshipValue: number,
    isDead: boolean,
    getFlag: (flag: string) => boolean
): DiaryStatusTone {
    const prefix = getNpcStateFlagPrefix(npcId);
    const npcMeta = (npcsData as Record<string, any>)[npcId];

    if (getFlag(`${prefix}_romance_open`)) return 'romance';
    if (getFlag(`${prefix}_submissive_open`)) return 'submissive';
    if (isDead) return 'offline';
    if (getFlag(`${prefix}_status_unknown`) || Boolean(npcMeta?.diary_unknown)) return 'unknown';
    if (friendshipValue <= ENEMY_THRESHOLD) return 'enemy';
    if (friendshipValue >= FRIENDLY_THRESHOLD) return 'friendly';
    return 'neutral';
}

function getStatusToneClasses(tone: DiaryStatusTone, selected: boolean) {
    const selectedBorder = selected ? 'border-zinc-100' : 'border-zinc-950';

    switch (tone) {
        case 'romance':
            return { shell: `bg-pink-950/80 ${selectedBorder}`, dot: 'bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.5)]' };
        case 'submissive':
            return { shell: `bg-purple-950/80 ${selectedBorder}`, dot: 'bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.5)]' };
        case 'offline':
            return { shell: `bg-zinc-950 ${selectedBorder}`, dot: 'bg-zinc-700 shadow-[0_0_10px_rgba(24,24,27,0.55)]' };
        case 'enemy':
            return { shell: `bg-red-950/80 ${selectedBorder}`, dot: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.45)]' };
        case 'friendly':
            return { shell: `bg-emerald-950/70 ${selectedBorder}`, dot: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)]' };
        case 'unknown':
            return { shell: `bg-slate-950/80 ${selectedBorder}`, dot: 'bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.32)]' };
        case 'neutral':
        default:
            return { shell: `bg-blue-950/70 ${selectedBorder}`, dot: 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.4)]' };
    }
}

function getNpcStatusBadges(npcId: string, statusTone: DiaryStatusTone, getFlag: (flag: string) => boolean): string[] {
    const prefix = getNpcStateFlagPrefix(npcId);
    const badges: string[] = [];

    if (getFlag(`${prefix}_romance_open`)) badges.push('Romance');
    if (getFlag(`${prefix}_submissive_open`)) badges.push('Submissive');
    if (statusTone === 'friendly') badges.push('Friendly');
    if (statusTone === 'enemy') badges.push('Enemy');
    if (statusTone === 'neutral') badges.push('Neutral');
    if (statusTone === 'unknown') badges.push('Unknown');

    return badges;
}

function getNpcStateLabel(npcId: string, statusTone: DiaryStatusTone, getFlag: (flag: string) => boolean): string {
    const prefix = getNpcStateFlagPrefix(npcId);
    const npcMeta = (npcsData as Record<string, any>)[npcId];

    if (statusTone === 'unknown') {
        return npcMeta?.title || 'Whereabouts Unknown';
    }
    if (getFlag(`${prefix}_romance_open`)) return 'Romance';
    if (getFlag(`${prefix}_submissive_open`)) return 'Submissive';
    if (statusTone === 'offline') return 'Dead';
    if (statusTone === 'friendly') return 'Friendly';
    if (statusTone === 'enemy') return 'Enemy';
    return 'Neutral';
}

const DiaryScreen: FC = () => {
    const { setScreen, diaryTab, setDiaryTab } = useUIStore();
    const [searchTerm, setSearchTerm] = useState('');
    const knownNpcs = useWorldStateStore((state) => state.knownNpcs);
    const relationships = useDiaryStore((state) => state.relationships);
    const interactionHistory = useDiaryStore((state) => state.interactionHistory);
    const worldState = useWorldStateStore();

    const allNpcs: Npc[] = useMemo(() => {
        return Object.entries(npcsData).map(([id, npc]) => ({
            id: id,
            name: npc.name,
            title: (npc as any).title || npc.name || 'Unknown',
            portrait: npc.portrait || '',
            relationships: {
                friendship: { value: 0, max: 100 },
                love: { value: 0, max: 100 },
                fear: { value: 0, max: 100 },
                obedience: { value: 0, max: 100 },
            },
            history: [],
        }));
    }, []);

    const [selectedNpc, setSelectedNpc] = useState<Npc | null>(null);

    const getNpcIsDead = (npcId: string) => {
        const npcMeta = (npcsData as any)[npcId];
        const deathFlag = npcMeta?.death_flag as string | undefined;
        if (!deathFlag) return false;
        return worldState.getFlag(deathFlag);
    };

    const filteredNpcs = useMemo(() => {
        const knownNpcObjects = allNpcs.filter(npc => knownNpcs.includes(npc.id));
        return knownNpcObjects
            .filter(npc => npc.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                const aDead = getNpcIsDead(a.id);
                const bDead = getNpcIsDead(b.id);
                const aFriendship = relationships[a.id]?.friendship?.value || 0;
                const bFriendship = relationships[b.id]?.friendship?.value || 0;
                const aStatus = getDiaryStatusTone(a.id, aFriendship, aDead, worldState.getFlag);
                const bStatus = getDiaryStatusTone(b.id, bFriendship, bDead, worldState.getFlag);
                const priorityDelta = STATUS_SORT_PRIORITY[aStatus] - STATUS_SORT_PRIORITY[bStatus];

                if (priorityDelta !== 0) return priorityDelta;
                return a.name.localeCompare(b.name);
            });
    }, [searchTerm, knownNpcs, allNpcs, relationships, worldState.worldFlags]);

    // Set initial selected NPC to the first known NPC if available
    useEffect(() => {
        if (!selectedNpc && filteredNpcs.length > 0) {
            setSelectedNpc(filteredNpcs[0]);
        }
    }, [selectedNpc, filteredNpcs]);

    const displayNpc = useMemo(() => {
        if (!selectedNpc) return null;

        const npcData = npcsData[selectedNpc.id];
        const npcRelationship = relationships[selectedNpc.id] || {
            friendship: { value: 0, max: 100 },
            love: { value: 0, max: 100 },
            fear: { value: 0, max: 100 },
            obedience: { value: 0, max: 100 },
        };
        const npcHistory = interactionHistory
            .filter((entry) => entry.startsWith(`${selectedNpc.id}:`))
            .slice()
            .reverse();
        const isDead = getNpcIsDead(selectedNpc.id);
        const friendshipValue = npcRelationship.friendship?.value || 0;
        const statusTone = getDiaryStatusTone(selectedNpc.id, friendshipValue, isDead, worldState.getFlag);
        const statusBadges = getNpcStatusBadges(selectedNpc.id, statusTone, worldState.getFlag);
        const isUnknown = statusTone === 'unknown';

        return {
            id: selectedNpc.id,
            name: npcData?.name || 'Unknown',
            title: (npcData as any)?.title || npcData?.name || 'Unknown',
            portrait: npcData?.portrait || '',
            isDead,
            isUnknown,
            deathDate: isDead ? worldState.getData(`${selectedNpc.id}_death_date`) || '' : '',
            statusTone,
            statusBadges,
            relationships: {
                friendship: { value: friendshipValue, max: 100 },
                love: { value: npcRelationship.love?.value || 0, max: 100 },
                fear: { value: npcRelationship.fear?.value || 0, max: 100 },
                obedience: { value: npcRelationship.obedience?.value || 0, max: 100 },
            },
            history: npcHistory,
        };
    }, [selectedNpc, relationships, interactionHistory, worldState.worldFlags, worldState.stringData]);

    const relationshipCards = displayNpc ? [
        {
            label: 'Friendship',
            value: displayNpc.relationships.friendship.value,
            max: displayNpc.relationships.friendship.max,
            icon: Users,
            ...getFriendshipToneClasses(displayNpc.relationships.friendship.value),
            accentClass: '',
        },
        {
            label: 'Love',
            value: displayNpc.relationships.love.value,
            max: displayNpc.relationships.love.max,
            icon: Heart,
            colorClass: 'bg-pink-500/80',
            negativeColorClass: 'bg-red-500/80',
            valueClass: 'text-pink-300',
            iconClass: 'text-pink-300',
            accentClass: '',
        },
        {
            label: 'Fear',
            value: displayNpc.relationships.fear.value,
            max: displayNpc.relationships.fear.max,
            icon: ShieldAlert,
            colorClass: 'bg-yellow-400/80',
            negativeColorClass: 'bg-red-500/80',
            valueClass: 'text-yellow-300',
            iconClass: 'text-yellow-300',
            accentClass: '',
        },
        {
            label: 'Obedience',
            value: displayNpc.relationships.obedience.value,
            max: displayNpc.relationships.obedience.max,
            icon: Sparkles,
            colorClass: 'bg-purple-500/80',
            negativeColorClass: 'bg-red-500/80',
            valueClass: 'text-purple-300',
            iconClass: 'text-purple-300',
            accentClass: '',
        },
    ] : [];

    return (
        <div className="relative w-screen h-screen bg-zinc-950 flex flex-col overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm" style={{ backgroundImage: `url(/assets/backgrounds/minimal_bg.png)` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full h-[7vh] min-h-[56px] px-8 flex justify-between items-center border-b border-zinc-800/50 backdrop-blur-xl shrink-0">
                <button 
                    onClick={() => setScreen('inGame')} 
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all group px-4 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-zinc-800"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-widest uppercase text-[10px]">Resume Game</span>
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-white tracking-[0.3em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                        Wanderer's Diary
                    </h1>
                </div>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-zinc-800/50">
                    <button 
                        onClick={() => setDiaryTab('diary')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${diaryTab === 'diary' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Diary
                    </button>
                    <button 
                        onClick={() => setDiaryTab('party')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${diaryTab === 'party' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Party
                    </button>
                </div>
            </header>

            {/* Main Content Area - Symmetrical Layout */}
            <div className="relative z-10 w-full h-[86vh] flex flex-col lg:flex-row gap-6 p-4 lg:p-6 items-stretch overflow-hidden">
                
                {diaryTab === 'diary' ? (
                    <>
                        {/* Left Panel: NPC List */}
                        <div className="w-full lg:w-[400px] xl:w-[450px] h-full flex-shrink-0">
                            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-5 shadow-2xl flex flex-col h-full animate-fade-in-up">
                                <div className="flex items-center gap-3 mb-4 shrink-0 px-2">
                                    <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-100">Social Circles</h2>
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Recorded Encounters</p>
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="relative mb-4 shrink-0">
                                    <input 
                                        type="text"
                                        placeholder="Locate character..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800/50 rounded-xl py-2.5 pl-4 pr-12 text-xs text-zinc-300 focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 outline-none transition-all placeholder:text-zinc-600 font-medium"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-zinc-800 rounded-lg text-zinc-500">
                                        <Search size={14} />
                                    </div>
                                </div>

                                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                    {filteredNpcs.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-600">
                                            <User size={40} className="mx-auto mb-4 opacity-10" />
                                            <p className="font-black uppercase tracking-widest text-[9px]">No Acquaintances Found</p>
                                        </div>
                                    ) : filteredNpcs.map(npc => {
                                        const isDead = getNpcIsDead(npc.id);
                                        const friendshipValue = relationships[npc.id]?.friendship?.value || 0;
                                        const statusTone = getDiaryStatusTone(npc.id, friendshipValue, isDead, worldState.getFlag);
                                        const statusToneClasses = getStatusToneClasses(statusTone, selectedNpc?.id === npc.id);
                                        const stateLabel = getNpcStateLabel(npc.id, statusTone, worldState.getFlag);
                                        const isUnknown = statusTone === 'unknown';
                                        return (
                                            <button
                                                key={npc.id}
                                                onClick={() => setSelectedNpc(npc)}
                                                className={`w-full flex items-center gap-4 text-left p-3 rounded-xl transition-all group ${
                                                    selectedNpc?.id === npc.id 
                                                    ? 'bg-zinc-100 text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                                    : isDead
                                                        ? 'bg-red-950/10 text-zinc-400 hover:text-white border border-red-900/20 hover:border-red-700/40 hover:bg-red-900/10'
                                                        : 'hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/50'
                                                }`}
                                            >
                                                <div className="relative shrink-0">
                                                    <img src={npc.portrait} alt={npc.name} className={`w-12 h-12 rounded-full object-cover border-2 ${selectedNpc?.id === npc.id ? 'border-zinc-900' : 'border-zinc-800 group-hover:border-zinc-600'} ${isDead ? 'grayscale opacity-75' : ''}`}/>
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${statusToneClasses.shell}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${statusToneClasses.dot}`} />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-grow">
                                                    <span className={`block text-sm font-bold truncate ${selectedNpc?.id === npc.id ? 'font-black' : ''}`}>
                                                        {npc.name}
                                                    </span>
                                                    <span className={`block text-[9px] uppercase font-black tracking-tighter truncate opacity-60 ${selectedNpc?.id === npc.id ? 'text-zinc-900' : isDead ? 'text-red-400/80' : isUnknown ? 'text-slate-400/80' : statusTone === 'friendly' ? 'text-emerald-400/80' : statusTone === 'enemy' ? 'text-red-400/80' : statusTone === 'romance' ? 'text-pink-400/80' : statusTone === 'submissive' ? 'text-purple-400/80' : 'text-zinc-500'}`}>
                                                        {stateLabel}
                                                    </span>
                                                </div>
                                                {isDead && (
                                                    <div className={`shrink-0 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-[0.2em] ${
                                                        selectedNpc?.id === npc.id
                                                            ? 'bg-zinc-900 text-red-300 border-zinc-800'
                                                            : 'bg-red-950/40 text-red-300 border-red-900/40'
                                                    }`}>
                                                        Dead
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        
                        {/* Right Panel: Details */}
                        <div className="flex-grow h-full overflow-y-auto custom-scrollbar pr-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            {displayNpc ? (
                                <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 lg:p-10 shadow-2xl flex flex-col min-h-full">
                                    {/* NPC Header */}
                                    <div className="pb-8 border-b border-zinc-800/50">
                                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                            <div className="relative group shrink-0">
                                                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-zinc-700/50 shadow-2xl">
                                                    <img src={displayNpc.portrait} alt={displayNpc.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${displayNpc.isDead ? 'grayscale opacity-75' : ''}`} />
                                                </div>
                                                <div className={`absolute -bottom-3 -right-3 p-2.5 rounded-xl border shadow-xl ${
                                                    displayNpc.isDead
                                                        ? 'bg-red-950/80 border-red-800/60 text-red-200'
                                                        : 'bg-zinc-800 border-zinc-700 text-zinc-200'
                                                }`}>
                                                    {displayNpc.isDead ? <XCircle size={20} /> : <User size={20} />}
                                                </div>
                                            </div>
                                            
                                            <div className="flex-grow text-center md:text-left pt-2">
                                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Character Dossier</span>
                                                    <div className="h-px w-12 bg-zinc-800" />
                                                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusToneClasses(displayNpc.statusTone, false).dot}`} />
                                                </div>
                                                <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                                                    {displayNpc.name}
                                                </h2>
                                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                                    <p className={`text-lg italic font-medium tracking-wide ${displayNpc.isDead ? 'text-red-400/80' : 'text-zinc-400'}`}>
                                                        {`"${displayNpc.title}"`}
                                                    </p>
                                                    {displayNpc.isDead && (
                                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-red-900/40 bg-red-950/30 text-[9px] font-black uppercase tracking-[0.25em] text-red-300">
                                                            Dead
                                                        </span>
                                                    )}
                                                </div>
                                                {!displayNpc.isDead && displayNpc.statusBadges.length > 0 && (
                                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                                                        {displayNpc.statusBadges.map((badge) => {
                                                            const badgeClasses =
                                                                badge === 'Romance'
                                                                    ? 'border-pink-500/30 bg-pink-500/10 text-pink-300'
                                                                    : badge === 'Submissive'
                                                                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                                                                        : badge === 'Friendly'
                                                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                                                : badge === 'Enemy'
                                                                                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                                                                : badge === 'Unknown'
                                                                                    ? 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                                                                                : 'border-blue-500/30 bg-blue-500/10 text-blue-300';

                                                            return (
                                                                <span
                                                                    key={badge}
                                                                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.22em] ${badgeClasses}`}
                                                                >
                                                                    {badge}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Sections */}
                                    <div className="pt-8 lg:pt-10 space-y-12">
                                        {!displayNpc.isDead ? (
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <Heart size={18} className="text-zinc-500" />
                                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">Social Standing</h3>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pl-6 border-l-2 border-zinc-800/50">
                                                    {relationshipCards.map(({ label, value, max, icon: Icon, colorClass, valueClass, iconClass, accentClass, negativeColorClass }) => (
                                                        <div key={label} className={`rounded-2xl p-2 sm:p-3 ${accentClass}`}>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-1 rounded-lg">
                                                                        <Icon size={16} className={iconClass} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{label}</p>
                                                                        <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[11px] font-semibold text-zinc-400">{Math.floor(value)} / {Math.floor(max)}</span>
                                                            </div>
                                                            <ProgressBar
                                                                value={value}
                                                                max={max}
                                                                colorClass={colorClass}
                                                                negativeColorClass={negativeColorClass}
                                                                showText={false}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <XCircle size={18} className="text-red-400/80" />
                                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-300/80">Memorial Record</h3>
                                                </div>
                                                <div className="pl-6 border-l-2 border-red-900/30">
                                                    <div className="bg-red-950/10 border border-red-900/20 rounded-xl p-5 space-y-3">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-300/80">Final Status</p>
                                                        <p className="text-sm text-zinc-300 italic leading-relaxed">
                                                            This character passed away{displayNpc.deathDate ? ` on ${displayNpc.deathDate}` : ''}. Their social standing is no longer tracked, but their history remains recorded here.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Interaction History */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <ScrollText size={18} className="text-zinc-500" />
                                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">Chronicle of Interactions</h3>
                                            </div>
                                            
                                            <div className="space-y-3 pl-6 border-l-2 border-zinc-800/50">
                                                {displayNpc.history.length === 0 ? (
                                                    <p className="text-zinc-600 text-sm italic font-medium py-4">No significant interactions have been chronicled yet.</p>
                                                ) : displayNpc.history.map((event, index) => (
                                                    <div key={index} className="bg-black/20 p-4 rounded-xl border border-zinc-800/30 group hover:border-zinc-700 transition-all flex gap-4 items-start">
                                                        <div className="mt-1 p-1 bg-zinc-800 rounded-md text-zinc-500">
                                                            <BookOpen size={12} />
                                                        </div>
                                                        <p className="text-sm text-zinc-300 leading-relaxed">{event.split(':').slice(1).join(':').trim()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-zinc-900/20 backdrop-blur-md rounded-2xl border border-zinc-800/30 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                    <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center border border-zinc-800 mb-6 opacity-20">
                                        <User size={40} className="text-zinc-400" />
                                    </div>
                                    <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px]">No Subject Selected</p>
                                    <p className="text-zinc-600 text-xs mt-2 max-w-[250px]">Choose a character from your social circles to review your shared history and standing.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <CompanionTab />
                )}
            </div>

            {/* Bottom Spacer */}
            <div className="h-[7vh] min-h-[56px] shrink-0" />

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
            `}</style>
        </div>
    );
};

export default DiaryScreen;

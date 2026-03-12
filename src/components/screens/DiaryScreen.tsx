import React, { useState, useMemo, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { Search, User, Heart, Zap, Sparkles, Shield, ArrowLeft, BookOpen, ScrollText, MessageSquare, PawPrint, Bone, Hand, Swords, XCircle, KeyRound, Gem } from 'lucide-react';
import type { Npc } from '../../types';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useDiaryStore } from '../../stores/useDiaryStore';
import { useUIStore } from '../../stores/useUIStore';
import { useCompanionStore } from '../../stores/useCompanionStore';
import npcsData from '../../data/npcs.json';
import ProgressBar from '../ui/ProgressBar';
import Section from '../ui/Section';
import Stat from '../ui/Stat';
import ActionButton from '../ui/ActionButton';
import { getDescriptiveAttributeLabel } from '../../data';

const EquipmentSlot: FC<{ icon: ReactNode; name: string; }> = ({ icon, name }) => (
    <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-zinc-800/50 group hover:border-zinc-700 transition-all">
        <div className="p-3 bg-zinc-800/50 rounded-lg text-zinc-500 border border-zinc-700/50 group-hover:text-zinc-400 transition-colors">
            {icon}
        </div>
        <div>
            <p className="font-bold text-white text-sm uppercase tracking-tight">{name}</p>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-tighter">Empty Slot</p>
        </div>
    </div>
);

const DiaryScreen: FC = () => {
    const { setScreen } = useUIStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [mainTab, setMainTab] = useState<'diary' | 'party'>('diary');
    const knownNpcs = useWorldStateStore((state) => state.knownNpcs);
    const relationships = useDiaryStore((state) => state.relationships);
    const interactionHistory = useDiaryStore((state) => state.interactionHistory);
    const activeCompanion = useCompanionStore((state) => state.activeCompanion);

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
            },
            history: [],
        }));
    }, []);

    const [selectedNpc, setSelectedNpc] = useState<Npc | null>(null);

    const filteredNpcs = useMemo(() => {
        const knownNpcObjects = allNpcs.filter(npc => knownNpcs.includes(npc.id));
        return knownNpcObjects.filter(npc => 
            npc.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, knownNpcs, allNpcs]);

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
        };
        const npcHistory = interactionHistory.filter((entry) => entry.startsWith(`${selectedNpc.id}:`));

        return {
            id: selectedNpc.id,
            name: npcData?.name || 'Unknown',
            title: (npcData as any)?.title || npcData?.name || 'Unknown',
            portrait: npcData?.portrait || '',
            relationships: {
                friendship: { value: npcRelationship.friendship?.value || 0, max: 100 },
                love: { value: npcRelationship.love?.value || 0, max: 100 },
                fear: { value: npcRelationship.fear?.value || 0, max: 100 },
            },
            history: npcHistory,
        };
    }, [selectedNpc, relationships, interactionHistory]);

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
                        onClick={() => setMainTab('diary')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mainTab === 'diary' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Diary
                    </button>
                    <button 
                        onClick={() => setMainTab('party')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mainTab === 'party' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Party
                    </button>
                </div>
            </header>

            {/* Main Content Area - Symmetrical Layout */}
            <div className="relative z-10 w-full h-[86vh] flex flex-col lg:flex-row gap-6 p-4 lg:p-6 items-stretch overflow-hidden">
                
                {mainTab === 'diary' ? (
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
                                    ) : filteredNpcs.map(npc => (
                                        <button
                                            key={npc.id}
                                            onClick={() => setSelectedNpc(npc)}
                                            className={`w-full flex items-center gap-4 text-left p-3 rounded-xl transition-all group ${
                                                selectedNpc?.id === npc.id 
                                                ? 'bg-zinc-100 text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                                : 'hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/50'
                                            }`}
                                        >
                                            <div className="relative shrink-0">
                                                <img src={npc.portrait} alt={npc.name} className={`w-12 h-12 rounded-full object-cover border-2 ${selectedNpc?.id === npc.id ? 'border-zinc-900' : 'border-zinc-800 group-hover:border-zinc-600'}`}/>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${selectedNpc?.id === npc.id ? 'bg-zinc-900 border-zinc-100' : 'bg-zinc-800 border-zinc-950'} flex items-center justify-center`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedNpc?.id === npc.id ? 'bg-zinc-100' : 'bg-zinc-500'}`} />
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <span className={`block text-sm font-bold truncate ${selectedNpc?.id === npc.id ? 'font-black' : ''}`}>
                                                    {npc.name}
                                                </span>
                                                <span className={`block text-[9px] uppercase font-black tracking-tighter truncate opacity-60 ${selectedNpc?.id === npc.id ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                                    {npc.title}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
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
                                                    <img src={displayNpc.portrait} alt={displayNpc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                </div>
                                                <div className="absolute -bottom-3 -right-3 p-2.5 bg-zinc-800 rounded-xl border border-zinc-700 text-zinc-200 shadow-xl">
                                                    <User size={20} />
                                                </div>
                                            </div>
                                            
                                            <div className="flex-grow text-center md:text-left pt-2">
                                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Character Dossier</span>
                                                    <div className="h-px w-12 bg-zinc-800" />
                                                </div>
                                                <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                                                    {displayNpc.name}
                                                </h2>
                                                <p className="text-zinc-400 text-lg italic font-medium tracking-wide">
                                                    "{displayNpc.title}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Sections */}
                                    <div className="pt-8 lg:pt-10 space-y-12">
                                        {/* Relationships Section */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <Heart size={18} className="text-zinc-500" />
                                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-200">Social Standing</h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-6 border-l-2 border-zinc-800/50">
                                                <ProgressBar 
                                                    label="Friendship" 
                                                    value={displayNpc.relationships.friendship.value} 
                                                    max={displayNpc.relationships.friendship.max} 
                                                    colorClass="bg-emerald-500/80" 
                                                    negativeColorClass="bg-red-500/80" 
                                                />
                                                <ProgressBar 
                                                    label="Love" 
                                                    value={displayNpc.relationships.love.value} 
                                                    max={displayNpc.relationships.love.max} 
                                                    colorClass="bg-pink-500/80" 
                                                />
                                                <ProgressBar 
                                                    label="Fear" 
                                                    value={displayNpc.relationships.fear.value} 
                                                    max={displayNpc.relationships.fear.max} 
                                                    colorClass="bg-amber-500/80" 
                                                />
                                            </div>
                                        </div>

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
                    // Party Integration (Companion)
                    <div className="w-full h-full flex flex-col lg:flex-row gap-6 items-stretch animate-fade-in-up">
                        {!activeCompanion ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-12 shadow-2xl max-w-md">
                                    <PawPrint size={64} className="text-zinc-600 mb-6 mx-auto opacity-20" />
                                    <h2 className="text-3xl font-bold text-zinc-400 mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Solitary Wanderer</h2>
                                    <p className="text-zinc-500 font-medium leading-relaxed">
                                        You currently have no companions in your party. Explore the world to find loyal friends who will aid you in your journey.
                                    </p>
                                </div>
                            </div>
                        ) : (() => {
                            const companion = {
                                name: activeCompanion.name,
                                title: "Loyal Companion",
                                portraitUrl: "/assets/portraits/CompanionPlaceholder.png",
                                vitals: {
                                    hp: { current: Math.floor(activeCompanion.stats.hp), max: Math.floor(activeCompanion.stats.maxHp || activeCompanion.stats.hp) },
                                    energy: { current: 100, max: 100 },
                                },
                                attributes: { 
                                    attack: activeCompanion.stats.attack, 
                                    dexterity: activeCompanion.stats.dexterity 
                                },
                                info: "Your loyal companion who fights by your side."
                            };

                            return (
                                <>
                                    {/* Left Column (Portrait & Vitals) */}
                                    <div className="w-full lg:w-[400px] xl:w-[450px] h-full flex flex-col gap-6 flex-shrink-0">
                                        <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 shadow-2xl flex flex-col h-full">
                                            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-zinc-700/50 shadow-2xl mb-8 group">
                                                <img src={companion.portraitUrl} alt={companion.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            </div>
                                            <div className="space-y-6">
                                                <div>
                                                    <div className="flex justify-between items-end mb-2 px-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Vitality</span>
                                                        <span className="text-[11px] font-sans font-black text-red-400">{companion.vitals.hp.current} / {companion.vitals.hp.max}</span>
                                                    </div>
                                                    <ProgressBar value={companion.vitals.hp.current} max={companion.vitals.hp.max} colorClass="bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" variant="thick" showText={false} />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-end mb-2 px-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Spirit</span>
                                                        <span className="text-[11px] font-sans font-black text-sky-400">{companion.vitals.energy.current} / {companion.vitals.energy.max}</span>
                                                    </div>
                                                    <ProgressBar value={companion.vitals.energy.current} max={companion.vitals.energy.max} colorClass="bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]" variant="thick" showText={false} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column (Info, Stats, Gear) */}
                                    <div className="flex-grow h-full overflow-y-auto custom-scrollbar pr-4">
                                        <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-8 shadow-2xl flex flex-col min-h-full space-y-12">
                                            {/* Header */}
                                            <div className="pb-8 border-b border-zinc-800/50">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Party Member Dossier</span>
                                                    <div className="h-px w-12 bg-zinc-800" />
                                                </div>
                                                <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                                                    {companion.name}
                                                </h2>
                                                <p className="text-zinc-400 text-lg italic font-medium tracking-wide">
                                                    "{companion.title}"
                                                </p>
                                            </div>

                                            {/* Sections */}
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                                <div className="space-y-12">
                                                    <Section title="Nature & Background">
                                                        <p className="text-zinc-300 text-sm leading-relaxed bg-black/40 p-5 rounded-2xl border border-zinc-800/50 italic">
                                                            "{companion.info}"
                                                        </p>
                                                    </Section>

                                                    <Section title="Combat Prowess">
                                                        <div className="p-5 bg-black/40 rounded-2xl border border-zinc-800/50 space-y-3">
                                                            <Stat label="Offensive Power" value={getDescriptiveAttributeLabel('attack', companion.attributes.attack)} />
                                                            <Stat label="Swiftness" value={getDescriptiveAttributeLabel('dexterity', companion.attributes.dexterity)} />
                                                        </div>
                                                    </Section>
                                                </div>

                                                <div className="space-y-12">
                                                    <Section title="Interaction">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <ActionButton icon={<Bone size={18} className="text-orange-300" />} text="Feed" category="action" />
                                                            <ActionButton icon={<Hand size={18} className="text-sky-300" />} text="Bond" category="dialogue" />
                                                            <ActionButton icon={<Swords size={18} className="text-red-400" />} text="Spar" category="action" />
                                                            <ActionButton icon={<XCircle size={18} className="text-zinc-400" />} text="Dismiss" category="explore" />
                                                        </div>
                                                    </Section>

                                                    <Section title="Equipments & Charms">
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <EquipmentSlot icon={<KeyRound size={20} />} name="Collar Attachment" />
                                                            <EquipmentSlot icon={<Gem size={20} />} name="Amulet / Charm" />
                                                        </div>
                                                    </Section>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
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
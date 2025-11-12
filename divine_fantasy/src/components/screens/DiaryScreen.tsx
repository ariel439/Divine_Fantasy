import React, { useState, useMemo } from 'react';
import type { FC } from 'react';
import { Search } from 'lucide-react';
import type { Npc } from '../../types';
import { mockNpcs } from '../../data';
import Section from '../ui/Section';
import ProgressBar from '../ui/ProgressBar';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useDiaryStore } from '../../stores/useDiaryStore';
import npcsData from '../../data/npcs.json';

const DiaryScreen: FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const knownNpcs = useWorldStateStore((state) => state.knownNpcs);
    const relationships = useDiaryStore((state) => state.relationships);
    const interactionHistory = useDiaryStore((state) => state.interactionHistory);

    const allNpcs: Npc[] = useMemo(() => {
        return Object.entries(npcsData).map(([id, npc]) => ({
            id: id,
            name: npc.name,
            title: (npc as any).title || npc.name, // Use npc.name as fallback for title
            portrait: npc.portrait,
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

    const filteredNpcs = useMemo(() => {
        const knownNpcObjects = allNpcs.filter(npc => knownNpcs.includes(npc.id));
        return knownNpcObjects.filter(npc => 
            npc.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, knownNpcs, allNpcs]);

    // Set initial selected NPC to the first known NPC if available
    React.useEffect(() => {
        if (!selectedNpc && filteredNpcs.length > 0) {
            setSelectedNpc(filteredNpcs[0]);
        }
    }, [selectedNpc, filteredNpcs]);

    const displayNpc = useMemo(() => {
        if (!selectedNpc) return null;

        const npcData = npcsData[selectedNpc.id];
        const npcRelationship = relationships[selectedNpc.id] || {};
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
                obedience: { value: npcRelationship.obedience?.value || 0, max: 100 },
            },
            history: npcHistory,
        };
    }, [selectedNpc, relationships, interactionHistory, npcsData]);

    return (
        <div className="w-full h-full p-8 pt-12 pb-20 flex flex-col">
            <header className="w-full max-w-screen-2xl mx-auto mb-8 flex-shrink-0">
                <h1 className="text-5xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>Diary</h1>
            </header>
            <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow min-h-0">
                {/* Left Panel: NPC List */}
                <div className="lg:col-span-1 bg-black/20 rounded-lg border border-zinc-800 p-4 flex flex-col h-full">
                     {/* Search Bar */}
                     <div className="relative mb-4 flex-shrink-0">
                        <input 
                            type="text"
                            placeholder="Search characters..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/30 border border-zinc-700 rounded-md py-2 pl-4 pr-10 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition"
                        />
                         <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                     </div>
                     {/* List */}
                     <div className="overflow-y-auto flex-grow custom-scrollbar pr-2 space-y-2">
                        {filteredNpcs.map(npc => (
                            <button
                                key={npc.id}
                                onClick={() => setSelectedNpc(npc)}
                                className={`w-full flex items-center gap-4 text-left p-2 rounded-lg transition-colors ${selectedNpc?.id === npc.id ? 'bg-zinc-700/50' : 'hover:bg-white/5'}`}
                            >
                                <img src={npc.portrait} alt={npc.name} className="w-12 h-12 rounded-full object-cover border-2 border-zinc-600"/>
                                <span className="font-semibold text-white">{npc.name}</span>
                            </button>
                        ))}
                     </div>
                </div>
                
                {/* Right Panel: Details */}
                <div className="lg:col-span-2 bg-black/20 rounded-lg border border-zinc-800 p-6 flex flex-col overflow-y-auto custom-scrollbar h-full">
                    {displayNpc ? (
                        <>
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left border-b border-zinc-700 pb-6 mb-6">
                                <img src={displayNpc.portrait} alt={displayNpc.name} className="w-24 h-24 rounded-full object-cover border-4 border-zinc-600 flex-shrink-0"/>
                                <div>
                                    <h2 className="text-4xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>{displayNpc.name}</h2>
                                    <p className="text-lg text-zinc-300/80 italic">{displayNpc.title}</p>
                                </div>
                            </div>
                            
                            {/* Sections */}
                            <div className="space-y-8">
                                <Section title="Relationships">
                                    <div className="space-y-3">
                                        <ProgressBar label="Friendship" value={displayNpc.relationships.friendship.value} max={displayNpc.relationships.friendship.max} colorClass="bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
                                        <ProgressBar label="Love" value={displayNpc.relationships.love.value} max={displayNpc.relationships.love.max} colorClass="bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.7)]" />
                                        <ProgressBar label="Obedience" value={displayNpc.relationships.obedience.value} max={displayNpc.relationships.obedience.max} colorClass="bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
                                        <ProgressBar label="Fear" value={displayNpc.relationships.fear.value} max={displayNpc.relationships.fear.max} colorClass="bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                                    </div>
                                </Section>
                                <Section title="Recent History">
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                        {displayNpc.history.map((event, index) => (
                                            <div key={index} className="bg-black/20 p-3 rounded-md text-sm text-zinc-300 border-l-2 border-zinc-600">
                                                <p>{event}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-center text-zinc-500">
                            <p className="text-lg">Select a character to view your relationship.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiaryScreen;

import React, { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { CheckSquare, Square, Search } from 'lucide-react';
import type { Quest } from '../../types';
import { useJournalStore } from '../../stores/useJournalStore';
import Section from '../ui/Section';

const JournalScreen: FC = () => {
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [questStatusTab, setQuestStatusTab] = useState<'active' | 'completed'>('active');
    const { questsList } = useJournalStore();

    // Do not seed mock quests; show only actual quests present in store

    const filteredQuests = useMemo(() => {
        const source = questsList || [];
        let quests = source.filter(q => q.status === questStatusTab);
        if (searchTerm) {
            quests = quests.filter(q => 
                q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return quests;
    }, [questStatusTab, searchTerm, questsList]);
    
    // Set initial quest on tab change or first load
    useEffect(() => {
        setSelectedQuest(filteredQuests[0] || null);
    }, [questStatusTab]);


    // Update selected quest if it's filtered out
    useEffect(() => {
        const isSelectedQuestInList = filteredQuests.some(q => q.id === selectedQuest?.id);
        if (!isSelectedQuestInList) {
            setSelectedQuest(filteredQuests[0] || null);
        }
    }, [filteredQuests, selectedQuest]);

    return (
        <div className="w-full h-full p-8 pt-12 pb-20 flex flex-col">
            <header className="w-full max-w-screen-2xl mx-auto mb-8 flex-shrink-0">
                <h1 className="text-5xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>Journal</h1>
            </header>
            <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow min-h-0">
                {/* Left Panel: Quest List */}
                <div className="lg:col-span-1 bg-black/20 rounded-lg border border-zinc-800 p-4 flex flex-col h-full">
                    <div className="flex-shrink-0 flex items-center gap-2 border-b-2 border-zinc-800 mb-2">
                        {(['active', 'completed'] as const).map(tab => (
                            <button key={tab} onClick={() => setQuestStatusTab(tab)} className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${questStatusTab === tab ? 'text-white border-b-2 border-zinc-300 -mb-px' : 'text-zinc-400 hover:text-white'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                    {/* Search Bar */}
                    <div className="relative my-2 flex-shrink-0">
                        <input 
                            type="text"
                            placeholder="Search quests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/30 border border-zinc-700 rounded-md py-2 pl-4 pr-10 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition"
                        />
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    </div>
                    <div className="overflow-y-auto flex-grow custom-scrollbar pr-2 space-y-1 mt-2">
                        {filteredQuests.length === 0 ? (
                            <div className="text-zinc-500 text-sm p-3">No quests yet. Talk to NPCs to discover quests.</div>
                        ) : filteredQuests.map(quest => (
                            <button
                                key={quest.id}
                                onClick={() => setSelectedQuest(quest)}
                                className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${selectedQuest?.id === quest.id ? 'bg-zinc-700/50 font-semibold text-white' : 'hover:bg-white/5 text-zinc-300'}`}
                            >
                                {quest.title}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Right Panel: Details */}
                 <div className="lg:col-span-2 bg-black/20 rounded-lg border border-zinc-800 p-6 flex flex-col overflow-y-auto custom-scrollbar h-full">
                    {selectedQuest ? (
                        <>
                            <div className="border-b border-zinc-700 pb-4 mb-6">
                                <h2 className="text-4xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>{selectedQuest.title}</h2>
                                <p className="text-md text-zinc-400 italic mt-1">From: {selectedQuest.giver}</p>
                            </div>

                            <div className="space-y-6">
                                <p className="text-zinc-300 leading-relaxed">{selectedQuest.description}</p>
                                <Section title="Objectives">
                                    <div className="space-y-2">
                                        {selectedQuest.objectives.map((obj, index) => (
                                            <div key={index} className="flex items-center gap-3 bg-black/20 p-3 rounded-md">
                                                {obj.completed ? <CheckSquare size={20} className="text-green-400 flex-shrink-0" /> : <Square size={20} className="text-zinc-500 flex-shrink-0" />}
                                                <p className={`text-sm ${obj.completed ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>{obj.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                                {selectedQuest.status === 'completed' && (
                                  <Section title="Rewards">
                                       <div className="space-y-2">
                                          {selectedQuest.rewards.map((reward, index) => (
                                               <div key={index} className="bg-black/20 p-3 rounded-md text-sm text-yellow-300 border-l-2 border-yellow-400">
                                                  <p>{reward}</p>
                                              </div>
                                          ))}
                                      </div>
                                  </Section>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-center text-zinc-500">
                            <p className="text-lg">Select a quest to view its details.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default JournalScreen;

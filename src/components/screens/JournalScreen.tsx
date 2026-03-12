
import React, { useState, useMemo, useEffect } from 'react';
import type { FC } from 'react';
import { CheckSquare, Square, Search, XCircle, ArrowLeft, BookOpen, ScrollText, Award, User, Target } from 'lucide-react';
import type { Quest } from '../../types';
import { useJournalStore } from '../../stores/useJournalStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useUIStore } from '../../stores/useUIStore';

const JournalScreen: FC = () => {
    const { setScreen } = useUIStore();
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [questStatusTab, setQuestStatusTab] = useState<'active' | 'completed'>('active');
    const { questsList, quests } = useJournalStore();

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
        if (filteredQuests.length > 0 && !selectedQuest) {
            setSelectedQuest(filteredQuests[0]);
        }
    }, [filteredQuests]);

    // Update selected quest if it's filtered out
    useEffect(() => {
        if (selectedQuest && !filteredQuests.some(q => q.id === selectedQuest.id)) {
            setSelectedQuest(filteredQuests[0] || null);
        }
    }, [filteredQuests, selectedQuest]);

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
                        Adventurer's Journal
                    </h1>
                </div>
                <div className="w-32"></div>
            </header>

            {/* Main Content Area - Symmetrical Layout */}
            <div className="relative z-10 w-full h-[86vh] flex flex-col lg:flex-row gap-6 p-4 lg:p-6 items-stretch overflow-hidden">
                
                {/* Left Panel: Quest List */}
                <div className="w-full lg:w-[400px] xl:w-[450px] h-full flex-shrink-0">
                    <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-5 shadow-2xl flex flex-col h-full animate-fade-in-up">
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-zinc-800/50 mb-4 shrink-0">
                            {(['active', 'completed'] as const).map(tab => (
                                <button 
                                    key={tab} 
                                    onClick={() => setQuestStatusTab(tab)} 
                                    className={`flex-1 px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-lg ${
                                        questStatusTab === tab 
                                        ? 'bg-zinc-100 text-black shadow-lg' 
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-4 shrink-0">
                            <input 
                                type="text"
                                placeholder="Search chronicles..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/40 border border-zinc-800/50 rounded-xl py-2.5 pl-4 pr-12 text-xs text-zinc-300 focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 outline-none transition-all placeholder:text-zinc-600 font-medium"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-zinc-800 rounded-lg text-zinc-500">
                                <Search size={14} />
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-1">
                            {filteredQuests.length === 0 ? (
                                <div className="text-center py-12 text-zinc-600">
                                    <ScrollText size={40} className="mx-auto mb-4 opacity-10" />
                                    <p className="font-black uppercase tracking-widest text-[9px]">No Records Found</p>
                                </div>
                            ) : filteredQuests.map(quest => (
                                <button
                                    key={quest.id}
                                    onClick={() => setSelectedQuest(quest)}
                                    className={`w-full text-left p-3.5 rounded-xl transition-all group ${
                                        selectedQuest?.id === quest.id 
                                        ? 'bg-zinc-100 text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                        : 'hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/50'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm font-bold tracking-tight ${selectedQuest?.id === quest.id ? 'font-black' : ''}`}>
                                            {quest.title}
                                        </span>
                                        {selectedQuest?.id === quest.id && <BookOpen size={12} />}
                                    </div>
                                    <p className={`text-[9px] uppercase font-black tracking-tighter mt-1 opacity-50 ${selectedQuest?.id === quest.id ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                        From: {quest.giver}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Right Panel: Details */}
                <div className="flex-grow h-full overflow-y-auto custom-scrollbar pr-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    {selectedQuest ? (
                        <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 lg:p-10 shadow-2xl flex flex-col min-h-full">
                            {/* Quest Header */}
                            <div className="pb-6 border-b border-zinc-800/50">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-zinc-800 rounded-lg text-zinc-400">
                                                <ScrollText size={16} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Chronicled Event</span>
                                        </div>
                                        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Cinzel, serif' }}>{selectedQuest.title}</h2>
                                    </div>
                                    <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800/50">
                                        <User size={14} className="text-zinc-500" />
                                        <div className="text-right">
                                            <p className="text-[7px] font-black uppercase tracking-tighter text-zinc-600">Contract Giver</p>
                                            <p className="text-[10px] font-bold text-zinc-300">{selectedQuest.giver}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="pt-6 lg:pt-8 space-y-8 flex-grow">
                                {/* Description */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <BookOpen size={16} className="text-zinc-500" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200">The Objective</h3>
                                    </div>
                                    <p className="text-zinc-400 text-base lg:text-lg leading-relaxed font-medium italic pl-6 border-l-2 border-zinc-800/50">
                                        "{selectedQuest.description}"
                                    </p>
                                </div>

                                {/* Objectives Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Target size={16} className="text-zinc-500" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200">Progress Tracker</h3>
                                    </div>
                                    {/* ... rest of objectives logic ... */}
                                    {(() => {
                                        const isActive = selectedQuest.status === 'active';
                                        const isLukeTutorial = selectedQuest.id === 'luke_tutorial';
                                        const coreQuest = quests[selectedQuest.id];
                                        const currentStage = coreQuest?.currentStage ?? 0;
                                        const coreStagesRaw = (coreQuest?.stages || []);
                                        const coreStages = coreStagesRaw.filter((s: any) => {
                                            if (isLukeTutorial && (s.id === 0 || s.id === 3)) return false;
                                            return true;
                                        });
                                        const world = useWorldStateStore.getState();

                                        const displayStages = (() => {
                                            if (!isActive) return coreStages.map(s => ({ ...s, __completed: true }));
                                            
                                            const collectStages = coreStages.filter((s: any) => s.type === 'collect');
                                            if (collectStages.length >= 2) {
                                                return coreStages.map((s: any) => {
                                                    const flagMap: Record<string, string> = {
                                                        'npc_ben': 'debt_paid_by_ben',
                                                        'npc_beryl': 'debt_paid_by_beryl',
                                                        'npc_elara': 'debt_paid_by_elara',
                                                    };
                                                    const flag = flagMap[s.target];
                                                    const isBeryl = s.target === 'npc_beryl';
                                                    const failed = isBeryl && world.getFlag('beryl_debt_forgiven');
                                                    const completed = flag ? world.getFlag(flag) : ((s.id ?? 0) < currentStage);
                                                    return { ...s, __completed: completed, __failed: failed };
                                                });
                                            }
                                            
                                            const seq = coreStages.filter((s: any) => (s.id ?? 0) <= currentStage).map((s: any) => ({ ...s, __completed: (s.id ?? 0) < currentStage }));
                                            if (seq.length === 0) {
                                                const nextIdx = coreStages.findIndex((s: any) => (s.id ?? 0) > currentStage);
                                                if (nextIdx !== -1) seq.push({ ...coreStages[nextIdx], __completed: false });
                                            }
                                            if (!seq.some((s: any) => (s.id ?? 0) === currentStage)) {
                                                const current = coreStages.find((s: any) => (s.id ?? 0) === currentStage);
                                                if (current) seq.push({ ...current, __completed: false });
                                            }
                                            return seq;
                                        })();

                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                                                {displayStages.map((s: any, index: number) => {
                                                    const stageId = s.id ?? index;
                                                    const completed = s.__completed;
                                                    return (
                                                        <div key={`${stageId}-${index}`} className={`flex items-center gap-3 p-3 rounded-xl bg-black/40 border transition-all ${
                                                            s.__failed ? 'border-red-900/50 bg-red-950/10' : 
                                                            completed ? 'border-emerald-900/50 bg-emerald-950/5' : 
                                                            'border-zinc-800 group hover:border-zinc-700'
                                                        }`}>
                                                            <div className="flex-shrink-0">
                                                                {s.__failed ? (
                                                                    <XCircle size={16} className="text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                                                                ) : completed ? (
                                                                    <CheckSquare size={16} className="text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                                                ) : (
                                                                    <Square size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                                                )}
                                                            </div>
                                                            <p className={`text-xs font-medium tracking-wide ${
                                                                s.__failed ? 'text-red-400/70 line-through' : 
                                                                completed ? 'text-zinc-500 line-through' : 
                                                                'text-zinc-200'
                                                            }`}>
                                                                {s.text}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Rewards Section */}
                                {selectedQuest.status === 'completed' && (
                                    <div className="space-y-4 animate-fade-in pt-4" style={{ animationDelay: '400ms' }}>
                                        <div className="flex items-center gap-3">
                                            <Award size={16} className="text-yellow-500" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/80">Spoils of Adventure</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                                            {selectedQuest.rewards.map((reward, index) => (
                                                <div key={index} className="flex items-center gap-3 bg-yellow-950/10 border border-yellow-900/30 p-3 rounded-xl group hover:bg-yellow-900/20 transition-all">
                                                    <Award size={14} className="text-yellow-600 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-black text-yellow-200 uppercase tracking-tight">{reward}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-zinc-900/20 backdrop-blur-md rounded-2xl border border-zinc-800/30 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center border border-zinc-800 mb-6 opacity-20">
                                <ScrollText size={40} className="text-zinc-400" />
                            </div>
                            <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px]">No Records Selected</p>
                            <p className="text-zinc-600 text-xs mt-2 max-w-[250px]">Select a chronicle from the archives to review its details and progress.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Spacer - Critical for clearing LocationNav (7vh to match header) */}
            <div className="h-[7vh] min-h-[56px] shrink-0" />

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }

                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
                
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default JournalScreen;

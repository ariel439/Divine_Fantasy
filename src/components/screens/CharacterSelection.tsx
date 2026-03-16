
import React, { useState } from 'react';
import type { FC } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, User, Shield, Zap, Brain, BookOpen, Sparkles } from 'lucide-react';
// FIX: Changed to a named import to resolve module issue.
import { GameModeSelectionModal } from '../modals/GameModeSelectionModal';
import { characters, getDescriptiveAttributeLabel } from '../../data';
import { useUIStore } from '../../stores/useUIStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useLocationStore } from '../../stores/useLocationStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { GameManagerService } from '../../services/GameManagerService';
import { DialogueService } from '../../services/DialogueService';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';

const AttributeIcon = ({ label }: { label: string }) => {
    switch (label.toLowerCase()) {
        case 'strength': return <Shield size={16} className="text-red-400" />;
        case 'dexterity': return <Zap size={16} className="text-yellow-400" />;
        case 'intelligence': return <Brain size={16} className="text-blue-400" />;
        case 'charisma': return <User size={16} className="text-pink-400" />;
        default: return <Shield size={16} />;
    }
};

const AttributeBar: FC<{ label: keyof typeof characters[0]['attributes']; value: number }> = ({ label, value }) => {
    const maxValue = 10;
    const percentage = (value / maxValue) * 100;
    const descriptiveLabel = getDescriptiveAttributeLabel(label, value);

    return (
        <div className="w-full group/attr">
            <div className="flex justify-between items-center mb-1.5 text-sm">
                <div className="flex items-center gap-2">
                    <AttributeIcon label={label} />
                    <span className="font-bold text-zinc-100/90 capitalize tracking-wide">{label}</span>
                </div>
                <span className="text-zinc-400 font-bold group-hover/attr:text-white transition-colors">{descriptiveLabel}</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2 shadow-inner border border-zinc-800/50 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-zinc-600 to-zinc-400 h-full rounded-full animate-fill-bar"
                    style={{ '--fill-percentage': `${percentage}%` } as React.CSSProperties}
                ></div>
            </div>
        </div>
    );
};


const CharacterSelection: FC = () => {
    const { setScreen } = useUIStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isGameModeModalOpen, setIsGameModeModalOpen] = useState(false);
    const character = characters[currentIndex];

    const handleBeginJourneyClick = () => {
        setIsGameModeModalOpen(true);
    };

    const handleStartGame = (mode: 'story' | 'sandbox') => {
        setIsGameModeModalOpen(false);
        const setGameMode = useWorldStateStore.getState().setGameMode;
        setGameMode(mode);
        
        // Start new game with the selected template
        GameManagerService.startNewGame('luke_orphan');

        if (mode === 'sandbox') {
            useCharacterStore.setState((state) => ({
                ...state,
                energy: 100,
                hunger: 100,
            }));
            useWorldStateStore.getState().setIntroMode(false);
            useWorldStateStore.getState().setIntroCompleted(true);
            useWorldStateStore.getState().setFlag('intro_completed', true);
            useWorldStateStore.getState().setTutorialStep(100);
            useJournalStore.getState().completeQuest('luke_tutorial');
            useWorldTimeStore.setState({ year: 780, month: 5, day: 1, hour: 8, minute: 0 });
            useLocationStore.getState().setLocation('driftwatch');
        } else {
            useWorldStateStore.getState().setIntroMode(true);
            useWorldStateStore.getState().setIntroCompleted(false);
            useWorldStateStore.getState().setTutorialStep(0);
            useWorldTimeStore.setState({ year: 775 });
            DialogueService.executeAction('start_quest:luke_tutorial');
            useLocationStore.getState().setLocation('orphanage_room');
        }

        setScreen('inGame');
    };
    
    const NavArrow: FC<{direction: 'left' | 'right', disabled: boolean}> = ({ direction, disabled }) => {
        const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
        return (
            <div className={`fixed top-1/2 -translate-y-1/2 z-20 ${direction === 'left' ? 'left-4 sm:left-8' : 'right-4 sm:right-8'} group`}>
                <button 
                    disabled={disabled} 
                    onClick={() => !disabled && setCurrentIndex(prev => direction === 'left' ? prev - 1 : prev + 1)}
                    className="p-4 text-zinc-500 bg-black/40 backdrop-blur-md rounded-full border border-zinc-700/50 transition-all hover:bg-white/10 hover:text-white hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed group-hover:scale-110 active:scale-95"
                >
                    <Icon size={40} />
                </button>
                {disabled && (
                    <div className={`absolute bottom-full mb-4 ${direction === 'left' ? 'left-0' : 'right-0'} px-4 py-2 text-sm font-semibold text-white bg-zinc-900/95 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap backdrop-blur-md border border-zinc-700/50 z-30`}>
                        More characters coming soon!
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative w-full h-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
            {/* Background with improved overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20000ms] scale-110 animate-slow-pan"
                style={{ backgroundImage: `url(/assets/backgrounds/minimal_bg.png)` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
            
            {/* Back Button */}
            <button 
                onClick={() => setScreen('mainMenu')} 
                className="absolute top-8 left-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-all group z-30 bg-black/20 px-4 py-2 rounded-full border border-transparent hover:border-zinc-700 hover:bg-black/40"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium tracking-widest uppercase text-sm">Return</span>
            </button>

            {/* Navigation Arrows (Fixed Position) */}
            <NavArrow direction="left" disabled={currentIndex <= 0} />
            <NavArrow direction="right" disabled={currentIndex >= characters.length - 1} />

            {/* Main Content Container */}
            <div className="relative z-10 w-full max-w-[1400px] h-full flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
                
                {/* Header Section */}
                <div className="text-center mb-8 lg:mb-12 animate-fade-in-down">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-[0.2em] uppercase mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                        Choose Your Path
                    </h1>
                    <div className="h-1 w-32 bg-gradient-to-r from-transparent via-zinc-500 to-transparent mx-auto"></div>
                </div>

                {/* Character Card */}
                <div className="w-full flex-grow max-h-[85vh] bg-zinc-950/40 backdrop-blur-2xl rounded-2xl border border-zinc-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row animate-fade-in-up">
                    
                    {/* Left: Character Portrait Area */}
                    <div className="w-full lg:w-2/5 relative overflow-hidden group">
                        <img 
                            src={character.image} 
                            alt={character.name} 
                            className="w-full h-full object-cover object-top transition-transform duration-[5000ms] group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60"></div>
                        
                        {/* Character Summary Overlay (Mobile only or decorative) */}
                        <div className="absolute bottom-6 left-6 right-6 lg:hidden">
                            <h2 className="text-4xl font-bold text-white mb-1" style={{fontFamily: 'Cinzel, serif'}}>{character.name}</h2>
                            <p className="text-zinc-300 italic">{character.title}</p>
                        </div>
                    </div>

                    {/* Right: Character Details Area */}
                    <div className="w-full lg:w-3/5 p-8 lg:p-12 flex flex-col h-full overflow-y-auto custom-scrollbar">
                        
                        {/* Character Header */}
                        <div className="hidden lg:block mb-8">
                            <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
                                <div>
                                    <h2 className="text-5xl font-bold text-white tracking-wider mb-2" style={{fontFamily: 'Cinzel, serif'}}>{character.name}</h2>
                                    <p className="text-xl text-zinc-400 italic">{character.title}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl text-zinc-300 font-mono mb-2">{character.age} Years Old</p>
                                    <span className="inline-block text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-md bg-red-950/50 text-red-400 border border-red-900/50">
                                        Difficulty: {character.difficulty}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Backstory Section */}
                        <div className="mb-10 animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <BookOpen size={20} className="text-zinc-500" />
                                <h3 className="text-xl font-bold text-zinc-100 uppercase tracking-widest" style={{fontFamily: 'Cinzel, serif'}}>Backstory</h3>
                            </div>
                            <p className="text-zinc-400 text-lg leading-relaxed font-light">
                                {character.description}
                            </p>
                        </div>

                        {/* Attributes Grid */}
                        <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles size={20} className="text-zinc-500" />
                                <h3 className="text-xl font-bold text-zinc-100 uppercase tracking-widest" style={{fontFamily: 'Cinzel, serif'}}>Core Attributes</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                {Object.entries(character.attributes).map(([key, value]) => (
                                    <AttributeBar key={key} label={key as keyof typeof character.attributes} value={value} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Button Section (Centered Below Card) */}
                <div className="mt-8 lg:mt-10 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                    <button
                        onClick={handleBeginJourneyClick}
                        className="group relative px-10 py-4 bg-white text-black font-black uppercase tracking-[0.3em] text-lg rounded-sm transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] overflow-hidden"
                    >
                        <span className="relative z-10">Begin Journey</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    </button>
                </div>
            </div>

            <GameModeSelectionModal
                isOpen={isGameModeModalOpen}
                onSelectMode={handleStartGame}
                onCancel={() => setIsGameModeModalOpen(false)}
            />

            {/* Global styles for animations */}
            <style>{`
                @keyframes slow-pan {
                    0% { transform: scale(1.1) translate(0, 0); }
                    50% { transform: scale(1.15) translate(-1%, -1%); }
                    100% { transform: scale(1.1) translate(0, 0); }
                }
                .animate-slow-pan { animation: slow-pan 60s ease-in-out infinite; }
                
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }

                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 1s ease-out forwards; }

                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer { animation: shimmer 1.5s infinite; }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }

                @keyframes fill-bar {
                    from { width: 0%; }
                    to { width: var(--fill-percentage); }
                }
                .animate-fill-bar { animation: fill-bar 1.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default CharacterSelection;

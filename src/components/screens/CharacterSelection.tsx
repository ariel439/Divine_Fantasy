
import React, { useState } from 'react';
import type { FC } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
// FIX: Changed to a named import to resolve module issue.
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { characters, getDescriptiveAttributeLabel } from '../../data';
import { useUIStore } from '../../stores/useUIStore';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useLocationStore } from '../../stores/useLocationStore';
import { GameManagerService } from '../../services/GameManagerService';
import { DialogueService } from '../../services/DialogueService';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';

const AttributeBar: FC<{ label: keyof typeof characters[0]['attributes']; value: number }> = ({ label, value }) => {
    const maxValue = 10;
    const percentage = (value / maxValue) * 100;
    const descriptiveLabel = getDescriptiveAttributeLabel(label, value);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-white/90 capitalize">{label}</span>
                <span className="text-zinc-400 font-bold animate-fade-in-text">{descriptiveLabel}</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2.5 shadow-inner border border-zinc-700/50">
                <div
                    className="bg-zinc-500 h-full rounded-full animate-fill-bar"
                    style={{ '--fill-percentage': `${percentage}%` } as React.CSSProperties}
                ></div>
            </div>
        </div>
    );
};


const CharacterSelection: FC = () => {
    const { setScreen } = useUIStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const character = characters[currentIndex];

    const handleBeginJourneyClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmJourney = () => {
        setIsConfirmModalOpen(false);
        // Start new game with the selected template
        GameManagerService.startNewGame('luke_orphan');
        useWorldStateStore.getState().setIntroMode(true);
        useWorldStateStore.getState().setIntroCompleted(false);
        useWorldStateStore.getState().setTutorialStep(0);
        useWorldTimeStore.setState({ year: 775 });
        DialogueService.executeAction('start_quest:luke_tutorial');
        useLocationStore.getState().setLocation('orphanage_room');
        setScreen('inGame');
    };
    
    const NavArrow: FC<{direction: 'left' | 'right', disabled: boolean}> = ({ direction, disabled }) => {
        const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
        return (
            <div className="relative group">
                <button 
                    disabled={disabled} 
                    className="p-3 text-zinc-500 bg-black/30 rounded-full border border-zinc-700 transition-all hover:bg-white/10 hover:text-white disabled:bg-black/20 disabled:text-zinc-700 disabled:cursor-not-allowed"
                >
                    <Icon size={32} />
                </button>
                {disabled && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-sm font-semibold text-white bg-zinc-900/90 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap backdrop-blur-sm z-20">
                        More characters coming soon!
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="w-full h-full" style={{ backgroundImage: `url(https://i.imgur.com/WsODuhO.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 sm:p-6">
                    <button onClick={() => setScreen('mainMenu')} className="absolute top-6 left-6 text-zinc-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-10">
                        <ArrowLeft size={24} />
                    </button>
                     <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6" style={{ fontFamily: 'Cinzel, serif' }}>Choose Your Path</h1>
                    <div className="w-full max-w-7xl flex items-center justify-center gap-8">
                        <NavArrow direction="left" disabled={currentIndex <= 0} />

                        <div className="w-full max-w-6xl bg-zinc-950/85 backdrop-blur-xl rounded-xl border border-zinc-700/80 p-6 sm:p-8 grid md:grid-cols-2 gap-8">
                            {/* Left Column: Image */}
                            <div>
                                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-zinc-700 shadow-lg">
                                    <img src={character.image} alt={character.name} className="w-full h-full object-cover animate-subtle-zoom"/>
                                </div>
                            </div>

                            {/* Right Column: Details */}
                            <div className="flex flex-col justify-between overflow-y-auto custom-scrollbar pr-4">
                                 {/* Character Header */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-4xl font-bold text-white" style={{fontFamily: 'Cinzel, serif'}}>{character.name}</h2>
                                            <p className="text-lg text-zinc-300/80 italic">{character.title}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                             <p className="text-lg text-zinc-400 font-semibold">{character.age} years old</p>
                                             <span className="mt-1 inline-block text-sm font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-red-900/50 text-red-300 border border-red-700">
                                                {character.difficulty}
                                             </span>
                                        </div>
                                    </div>
                                    <div className="w-full h-px bg-zinc-700 mt-4"></div>
                                </div>

                                <div className="my-4">
                                     <h3 className="text-xl font-bold text-zinc-300 mb-2 tracking-wider" style={{fontFamily: 'Cinzel, serif'}}>Backstory</h3>
                                     <p className="text-zinc-300 text-sm leading-relaxed">{character.description}</p>
                                </div>
                                <div className="mt-4">
                                     <h3 className="text-xl font-bold text-zinc-300 mb-3 tracking-wider" style={{fontFamily: 'Cinzel, serif'}}>Attributes</h3>
                                     <div className="space-y-4">
                                        {Object.entries(character.attributes).map(([key, value]) => (
                                            <AttributeBar key={key} label={key as keyof typeof character.attributes} value={value} />
                                        ))}
                                     </div>
                                </div>
                            </div>
                        </div>

                        <NavArrow direction="right" disabled={currentIndex >= characters.length - 1} />
                    </div>
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleBeginJourneyClick}
                            className="w-full max-w-xs px-8 py-3 text-lg font-semibold tracking-widest uppercase text-white/90 bg-zinc-800 border border-zinc-700 rounded-md transition-all duration-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 animate-pulse-journey"
                        >
                            Begin Journey
                        </button>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                title="Begin Your Journey?"
                message={`Do you want to start your adventure as ${character.name}?`}
                onConfirm={handleConfirmJourney}
                onCancel={() => setIsConfirmModalOpen(false)}
                confirmText="Yes"
                cancelText="No"
            />
        </>
    );
};

export default CharacterSelection;

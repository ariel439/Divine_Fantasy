import React, { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { DialogueOption, ConversationEntry } from '../../types';

import { useCharacterStore } from '../../stores/useCharacterStore';
import { Zap } from 'lucide-react';

interface DialogueScreenProps {
  npcName: string;
  npcPortraitUrl: string;
  playerPortraitUrl: string;
  history: ConversationEntry[];
  options: DialogueOption[];
  onOptionSelect: (option: DialogueOption, index: number) => void;
  onEndDialogue: () => void;
}

const DialogueScreen: FC<DialogueScreenProps> = ({ 
    npcName, 
    npcPortraitUrl, 
    playerPortraitUrl, 
    history, 
    options, 
    onOptionSelect, 
    onEndDialogue 
}) => {
    const historyEndRef = useRef<HTMLDivElement>(null);
    
    const [currentPortrait, setCurrentPortrait] = useState(npcPortraitUrl);
    const [transitioningPortrait, setTransitioningPortrait] = useState<string | null>(null);

    // Preload portraits
    useEffect(() => {
        const allPortraits = [
            npcPortraitUrl,
            ...options
                .map(opt => opt.nextPortraitUrl)
                .filter((url): url is string => !!url)
        ];
        const uniquePortraits = [...new Set(allPortraits)];
        
        uniquePortraits.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }, [npcPortraitUrl, options]);

    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    useEffect(() => {
        if (transitioningPortrait) {
            const timer = setTimeout(() => {
                setTransitioningPortrait(null);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [transitioningPortrait]);

    const handleOptionSelect = (option: DialogueOption, index: number) => {
        // Check social energy
        const socialCost = 1;
        const currentSocial = useCharacterStore.getState().socialEnergy;
        
        // If option requires social energy (you might want to add a flag to DialogueOption later)
        // For now, assume all options cost 1 social energy
        if (currentSocial < socialCost) {
            // Shake effect or feedback could be added here
            // For now, we allow it but maybe with a penalty or just block it?
            // User requirement: "Limited by Charisma stat"
            // Let's block it if 0
            if (currentSocial <= 0) {
                 // Optionally show feedback
                 return;
            }
        }
        
        useCharacterStore.setState({ socialEnergy: currentSocial - socialCost });

        if (option.nextPortraitUrl && option.nextPortraitUrl !== currentPortrait) {
            setTransitioningPortrait(currentPortrait);
            setCurrentPortrait(option.nextPortraitUrl);
        }
        onOptionSelect(option, index);
    };

    const socialEnergy = useCharacterStore((state) => state.socialEnergy);
    const maxSocialEnergy = useCharacterStore((state) => state.maxSocialEnergy);

    return (
        <div className="relative w-full h-full bg-zinc-950/85 backdrop-blur-lg flex flex-col lg:flex-row">
            <style>{`
                @keyframes panelSlideInLeft {
                    from { opacity: 0; transform: translateX(-50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes panelSlideInRight {
                    from { opacity: 0; transform: translateX(50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-panel-left { animation: panelSlideInLeft 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
                .animate-panel-right { animation: panelSlideInRight 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
            `}</style>
            
            {/* Left Panel: NPC Portrait */}
            <div className="w-full lg:w-2/5 h-2/5 lg:h-full flex flex-col items-center justify-center p-4 animate-panel-left">
                <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-full border border-purple-500/30">
                    <Zap size={16} className="text-purple-400" />
                    <span className="text-purple-200 font-mono text-sm">{socialEnergy} / {maxSocialEnergy} Social</span>
                </div>
                <h2 className="text-4xl font-bold text-white tracking-wider mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
                    {npcName}
                </h2>
                <div className="relative w-full max-w-xl">
                     <img 
                        key={`${currentPortrait}-spacer`}
                        src={currentPortrait} 
                        alt="" 
                        className="w-full h-auto max-h-[75vh] object-contain opacity-0"
                    />
                    <div className="absolute inset-0">
                        {transitioningPortrait && (
                             <img 
                                key={transitioningPortrait}
                                src={transitioningPortrait} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-fade-out"
                            />
                        )}
                        <img 
                            key={currentPortrait}
                            src={currentPortrait} 
                            alt={npcName} 
                            className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-fade-in-slow"
                        />
                    </div>
                </div>
            </div>

            {/* Right Panel: Dialogue Box */}
            <div className="w-full lg:w-3/5 h-3/5 lg:h-full flex items-center justify-center p-4 animate-panel-right">
                <div className="w-full h-full max-w-3xl bg-zinc-950/90 border border-zinc-700 rounded-xl shadow-2xl flex flex-col p-6">
                    {/* History */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-6 mb-4">
                        {history.map((entry, index) => (
                             <div key={index} className={`flex items-end gap-3 ${entry.speaker === 'player' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 border-2 border-zinc-700">
                                     {entry.speaker === 'npc' ? (
                                        <img src={currentPortrait} alt={npcName} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={playerPortraitUrl} alt="Player" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className={`relative max-w-[85%] px-4 py-3 rounded-lg text-base lg:text-lg ${
                                    entry.speaker === 'player' 
                                    ? 'bg-zinc-700/70 text-right bubble-player' 
                                    : 'bg-zinc-800/80 bubble-npc'
                                }`}>
                                    <p>{entry.text}</p>
                                </div>
                            </div>
                        ))}
                         <div ref={historyEndRef} />
                    </div>

                    {/* Options */}
                    <div className="flex-shrink-0 mt-auto space-y-4">
                        {options.map((option, index) => {
                            const isUnavailable = (option.disabled ?? false) || socialEnergy <= 0;
                            return (
                                <button
                                    key={index}
                                    onClick={() => !isUnavailable && handleOptionSelect(option, index)}
                                    disabled={isUnavailable}
                                    className={`w-full text-left p-4 rounded-lg border transition-all duration-300 group relative overflow-hidden ${
                                        isUnavailable
                                            ? 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed'
                                            : 'bg-black/40 border-zinc-700/50 hover:bg-zinc-800/60 hover:border-zinc-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] text-zinc-300 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <span className="text-lg font-medium tracking-wide group-hover:translate-x-1 transition-transform duration-300">
                                            {option.text}
                                        </span>
                                        {!isUnavailable && <span className="text-purple-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">-1 Social</span>}
                                    </div>
                                    {!isUnavailable && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DialogueScreen;

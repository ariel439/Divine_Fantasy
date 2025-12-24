import React, { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { DialogueOption, ConversationEntry } from '../../types';

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
        if (option.nextPortraitUrl && option.nextPortraitUrl !== currentPortrait) {
            setTransitioningPortrait(currentPortrait);
            setCurrentPortrait(option.nextPortraitUrl);
        }
        onOptionSelect(option, index);
    };

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
                        {options.map((opt, index) => (
                            <button 
                                key={index} 
                                onClick={() => handleOptionSelect(opt, index)} 
                                className="w-full text-left p-3 sm:p-4 bg-zinc-800/80 border border-zinc-700 rounded-lg transition-all duration-300 hover:bg-zinc-700/60 hover:border-zinc-600 hover:border-l-4 hover:border-l-zinc-500 group"
                            >
                                <span className="font-semibold text-white/90">
                                    {opt.skillCheck && (
                                        <span className="mr-2 text-yellow-400 font-bold capitalize">
                                            [{opt.skillCheck.skill}]
                                        </span>
                                    )}
                                    {opt.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DialogueScreen;

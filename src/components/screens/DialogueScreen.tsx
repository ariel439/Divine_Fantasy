import React, { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { DialogueOption, ConversationEntry } from '../../types';

import { useCharacterStore } from '../../stores/useCharacterStore';
import { useDiaryStore } from '../../stores/useDiaryStore';
import { Zap } from 'lucide-react';

interface DialogueScreenProps {
  npcId: string;
  npcName: string;
  npcPortraitUrl: string;
  playerPortraitUrl: string;
  history: ConversationEntry[];
  options: DialogueOption[];
  onOptionSelect: (option: DialogueOption, index: number) => void;
  onEndDialogue: () => void;
  socialEnergy: number;
  maxSocialEnergy: number;
}

const DialogueScreen: FC<DialogueScreenProps> = ({ 
    npcId,
    npcName, 
    npcPortraitUrl, 
    playerPortraitUrl, 
    history, 
    options, 
    onOptionSelect, 
    onEndDialogue,
    socialEnergy,
    maxSocialEnergy
}) => {
    const historyEndRef = useRef<HTMLDivElement>(null);
    
    const [currentPortrait, setCurrentPortrait] = useState(npcPortraitUrl);
    const [transitioningPortrait, setTransitioningPortrait] = useState<string | null>(null);

    const relationships = useDiaryStore((state) => state.relationships[npcId]) || {
        friendship: { value: 0, max: 100 },
        love: { value: 0, max: 100 },
        fear: { value: 0, max: 100 },
    };

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

    // Handle portrait transitions
    useEffect(() => {
        const activeOption = options.find(opt => opt.nextPortraitUrl);
        if (activeOption?.nextPortraitUrl && activeOption.nextPortraitUrl !== currentPortrait) {
            setTransitioningPortrait(currentPortrait);
            setCurrentPortrait(activeOption.nextPortraitUrl);
            const timer = setTimeout(() => setTransitioningPortrait(null), 1000);
            return () => clearTimeout(timer);
        }
    }, [options]);

    const scrollToBottom = () => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleOptionSelect = (option: DialogueOption, index: number) => {
        onOptionSelect(option, index);
    };

    return (
        <div className="relative w-full h-full bg-zinc-950/50 backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden">
             {/* Background Layer with blur */}
             <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 blur-md" style={{ backgroundImage: `url(/assets/backgrounds/minimal_bg.png)` }} />

            <style>{`
                @keyframes panelSlideInLeft {
                    from { opacity: 0; transform: translateX(-50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes panelSlideInRight {
                    from { opacity: 0; transform: translateX(50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-panel-left { animation: panelSlideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-panel-right { animation: panelSlideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
            
            {/* Left Panel: NPC Portrait */}
            <div className="relative z-10 w-full lg:w-2/5 h-2/5 lg:h-full flex flex-col items-center justify-center p-8 animate-panel-left">
                <div className="text-center mb-8">
                    <h2 className="text-5xl font-bold text-white tracking-[0.2em] uppercase mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                        {npcName}
                    </h2>
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-zinc-500 to-transparent mx-auto" />
                </div>

                <div className="relative w-full max-w-xl group">
                    <div className="absolute -inset-4 bg-zinc-100/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                     <img 
                        key={`${currentPortrait}-spacer`}
                        src={currentPortrait} 
                        alt="" 
                        className="w-full h-auto max-h-[70vh] object-contain opacity-0"
                    />
                    <div className="absolute inset-0">
                        {transitioningPortrait && (
                             <img 
                                key={transitioningPortrait}
                                src={transitioningPortrait} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] animate-fade-out"
                            />
                        )}
                        <img 
                            key={currentPortrait}
                            src={currentPortrait} 
                            alt={npcName} 
                            className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] animate-fade-in-slow"
                        />
                    </div>
                </div>

                {/* Relationship Stats - Positioned under portrait */}
                <div className="mt-8 grid grid-cols-3 gap-8 w-full max-w-md px-4">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Friendship</span>
                        <div className="text-lg font-bold text-emerald-400">{relationships.friendship.value}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Love</span>
                        <div className="text-lg font-bold text-pink-400">{relationships.love?.value || 0}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Fear</span>
                        <div className="text-lg font-bold text-amber-400">{relationships.fear?.value || 0}</div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Dialogue Box */}
            <div className="relative z-10 w-full lg:w-3/5 h-3/5 lg:h-full flex items-center justify-center p-6 lg:p-12 animate-panel-right">
                <div className="w-full h-full max-w-4xl bg-zinc-950/50 backdrop-blur-2xl border border-zinc-800/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col p-8 lg:p-10 relative overflow-hidden">
                    {/* Top glass accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />

                    {/* Social Energy - Positioned top right of dialogue box */}
                    <div className="absolute top-6 right-8 flex items-center space-x-3 bg-zinc-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800/50">
                        <Zap size={14} className="text-purple-400 animate-pulse" />
                        <span className="text-zinc-300 font-black uppercase tracking-[0.2em] text-[10px]">{Math.floor(socialEnergy)} / {Math.floor(maxSocialEnergy)}</span>
                    </div>

                    {/* History */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar pr-6 space-y-8 mb-8 mt-4">
                        {history.map((entry, index) => (
                             <div key={index} className={`flex items-start gap-4 ${entry.speaker === 'player' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-zinc-800/50 shadow-xl">
                                     {entry.speaker === 'npc' ? (
                                        <img src={currentPortrait} alt={npcName} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={playerPortraitUrl} alt="Player" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className={`relative max-w-[80%] px-6 py-4 rounded-2xl text-lg lg:text-xl font-light italic leading-relaxed shadow-2xl ${
                                    entry.speaker === 'player' 
                                    ? 'bg-zinc-900/80 text-right text-zinc-200 border border-zinc-700/30' 
                                    : 'bg-black/80 text-zinc-100 border border-zinc-800/30'
                                }`}>
                                    <p>"{entry.text}"</p>
                                </div>
                            </div>
                        ))}
                         <div ref={historyEndRef} />
                    </div>

                    {/* Options */}
                    <div className="flex-shrink-0 mt-auto space-y-3">
                        {options.map((option, index) => {
                            const isUnavailable = option.disabled ?? false;
                            return (
                                <button
                                    key={index}
                                    onClick={() => !isUnavailable && handleOptionSelect(option, index)}
                                    disabled={isUnavailable}
                                    className={`w-full text-left p-4 bg-black/80 backdrop-blur-md border border-zinc-800/50 rounded-xl transition-all duration-500 hover:bg-white/10 hover:border-zinc-400 hover:shadow-2xl hover:-translate-y-0.5 group disabled:bg-zinc-900/30 disabled:border-zinc-800/50 disabled:text-zinc-600 disabled:cursor-not-allowed disabled:transform-none`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold tracking-widest uppercase text-xs text-zinc-100 group-hover:text-white transition-colors">
                                            {option.text}
                                        </span>
                                        <div className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center group-hover:border-zinc-400 transition-colors">
                                            <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full group-hover:bg-zinc-400 transition-colors" />
                                        </div>
                                    </div>
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

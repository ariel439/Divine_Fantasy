import React from 'react';
import type { FC } from 'react';
import { Scroll, SkipForward } from 'lucide-react';

interface GameModeSelectionModalProps {
    isOpen: boolean;
    onSelectMode: (options?: { skipIntro?: boolean }) => void;
    onCancel: () => void;
}

export const GameModeSelectionModal: FC<GameModeSelectionModalProps> = ({ isOpen, onSelectMode, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-[1100px] xl:max-w-[58vw] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="bg-black/60 p-6 border-b border-zinc-800">
                    <h2 className="text-2xl font-bold text-white text-center" style={{ fontFamily: 'Cinzel, serif' }}>
                        Choose Your Beginning
                    </h2>
                </div>
                
                <div className="p-5 md:p-6 xl:p-7 grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-5">
                    <button 
                        onClick={() => onSelectMode()}
                        className="group flex flex-col items-center p-5 xl:p-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-700/50 rounded-lg transition-all duration-300 text-left relative overflow-hidden min-h-[300px] xl:min-h-[320px]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/0 to-amber-900/0 group-hover:from-amber-900/10 group-hover:to-amber-900/5 transition-all duration-500"></div>
                        
                        <div className="mb-4 p-4 rounded-full bg-zinc-950 border border-zinc-700 group-hover:border-amber-500/50 group-hover:text-amber-500 transition-colors">
                            <Scroll size={32} />
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-100 transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>
                            Play Intro
                        </h3>
                        
                        <p className="text-sm text-zinc-400 text-center leading-relaxed max-w-[28ch]">
                            Begin with Luke's orphanage prologue, follow the opening choices, and let the full first week in Driftwatch unfold naturally.
                        </p>
                        
                        <div className="mt-4 px-3 py-1 bg-zinc-950/50 rounded text-xs font-mono text-zinc-500 border border-zinc-800 group-hover:border-amber-900/30 transition-colors">
                            Recommended for first time
                        </div>
                    </button>

                    <button
                        onClick={() => onSelectMode({ skipIntro: true })}
                        className="group flex flex-col items-center p-5 xl:p-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-orange-700/50 rounded-lg transition-all duration-300 text-left relative overflow-hidden min-h-[300px] xl:min-h-[320px]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/0 to-orange-900/0 group-hover:from-orange-900/10 group-hover:to-orange-900/5 transition-all duration-500"></div>

                        <div className="mb-4 p-4 rounded-full bg-zinc-950 border border-zinc-700 group-hover:border-orange-500/50 group-hover:text-orange-400 transition-colors">
                            <SkipForward size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-100 transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>
                            Skip Intro
                        </h3>

                        <p className="text-sm text-zinc-400 text-center leading-relaxed max-w-[28ch]">
                            Start directly in Finn's debt week at the Salty Mug, skipping the orphanage opening and its early route rewards.
                        </p>

                        <div className="mt-4 px-3 py-1 bg-zinc-950/50 rounded text-xs font-mono text-zinc-500 border border-zinc-800 group-hover:border-orange-900/30 transition-colors">
                            Faster Start
                        </div>
                    </button>
                </div>

                <div className="p-4 bg-black/40 border-t border-zinc-800 flex justify-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 text-zinc-400 hover:text-white transition-colors text-sm uppercase tracking-wider font-semibold"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

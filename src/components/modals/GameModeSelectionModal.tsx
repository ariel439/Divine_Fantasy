import React from 'react';
import type { FC } from 'react';
import { Scroll, Compass } from 'lucide-react';

interface GameModeSelectionModalProps {
    isOpen: boolean;
    onSelectMode: (mode: 'story' | 'sandbox') => void;
    onCancel: () => void;
}

export const GameModeSelectionModal: FC<GameModeSelectionModalProps> = ({ isOpen, onSelectMode, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="bg-black/60 p-6 border-b border-zinc-800">
                    <h2 className="text-2xl font-bold text-white text-center" style={{ fontFamily: 'Cinzel, serif' }}>
                        Select Game Mode
                    </h2>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Story Mode Option */}
                    <button 
                        onClick={() => onSelectMode('story')}
                        className="group flex flex-col items-center p-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-700/50 rounded-lg transition-all duration-300 text-left relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/0 to-amber-900/0 group-hover:from-amber-900/10 group-hover:to-amber-900/5 transition-all duration-500"></div>
                        
                        <div className="mb-4 p-4 rounded-full bg-zinc-950 border border-zinc-700 group-hover:border-amber-500/50 group-hover:text-amber-500 transition-colors">
                            <Scroll size={32} />
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-100 transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>
                            Story Mode
                        </h3>
                        
                        <p className="text-sm text-zinc-400 text-center leading-relaxed">
                            Experience the narrative of Divine Fantasy. Follow the journey of Luke, complete quests, and uncover the mysteries of Driftwatch.
                        </p>
                        
                        <div className="mt-4 px-3 py-1 bg-zinc-950/50 rounded text-xs font-mono text-zinc-500 border border-zinc-800 group-hover:border-amber-900/30 transition-colors">
                            Recommended for first time
                        </div>
                    </button>

                    {/* Sandbox Mode Option */}
                    <button 
                        onClick={() => onSelectMode('sandbox')}
                        className="group flex flex-col items-center p-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-700/50 rounded-lg transition-all duration-300 text-left relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/0 to-emerald-900/0 group-hover:from-emerald-900/10 group-hover:to-emerald-900/5 transition-all duration-500"></div>
                        
                        <div className="mb-4 p-4 rounded-full bg-zinc-950 border border-zinc-700 group-hover:border-emerald-500/50 group-hover:text-emerald-500 transition-colors">
                            <Compass size={32} />
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-100 transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>
                            Sandbox Mode
                        </h3>
                        
                        <p className="text-sm text-zinc-400 text-center leading-relaxed">
                            Forge your own path. Skip the introduction and tutorial. No main quest timer. Explore the world freely at your own pace.
                        </p>
                        
                        <div className="mt-4 px-3 py-1 bg-zinc-950/50 rounded text-xs font-mono text-zinc-500 border border-zinc-800 group-hover:border-emerald-900/30 transition-colors">
                            Free Roam
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

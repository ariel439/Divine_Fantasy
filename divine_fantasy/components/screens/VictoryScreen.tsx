
import React from 'react';
import type { FC } from 'react';
import type { Item } from '../../types';
import { Coins, Package } from 'lucide-react';
import Section from '../ui/Section';

interface VictoryScreenProps {
  rewards: {
    items: Item[];
    copper: number;
  };
  onContinue: () => void;
}

const VictoryScreen: FC<VictoryScreenProps> = ({ rewards, onContinue }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
        <div 
            className="w-full max-w-2xl bg-zinc-950/90 rounded-xl border border-zinc-700 shadow-2xl p-8 transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
            style={{ animation: 'scaleIn 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}
        >
            <header className="text-center border-b-2 border-yellow-500/50 pb-4 mb-6">
                <h1 
                    className="text-6xl md:text-7xl font-bold text-yellow-300 tracking-wider animate-fade-in-up"
                    style={{ fontFamily: 'Cinzel, serif', textShadow: '0 4px 15px rgba(252, 211, 77, 0.3)' }}
                >
                    VICTORY
                </h1>
            </header>
            
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <Section title="Loot Obtained">
                     <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                        {rewards.items.length > 0 ? rewards.items.map(item => (
                            <div key={item.id} className="flex items-center gap-4 bg-black/20 p-2 rounded-md border border-zinc-800">
                                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-black/40 rounded-md border border-zinc-700">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{item.name}</p>
                                    <p className="text-xs text-zinc-400">{item.category}</p>
                                </div>
                            </div>
                        )) : (
                             <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-4">
                                <Package size={32} />
                                <p className="mt-2 text-sm">No items looted.</p>
                            </div>
                        )}
                    </div>
                </Section>
                
                <Section title="Currency Gained">
                    <div className="flex items-center justify-center gap-3 bg-black/20 p-4 rounded-md border border-zinc-800">
                        <Coins size={28} className="text-orange-400" />
                        <span className="text-2xl font-bold text-white">{rewards.copper}</span>
                        <span className="text-lg text-zinc-300">Copper</span>
                    </div>
                </Section>
            </div>

            <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <button
                    onClick={onContinue}
                    className="w-full max-w-xs px-8 py-3 text-lg font-semibold tracking-widest uppercase text-white/90 bg-zinc-800 border border-zinc-700 rounded-md transition-all duration-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                    Continue
                </button>
            </div>

        </div>
       <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scaleIn 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default VictoryScreen;

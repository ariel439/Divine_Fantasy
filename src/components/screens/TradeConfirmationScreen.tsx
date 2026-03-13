
import React, { useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import { Coins, Package } from 'lucide-react';
import type { OfferItem, Item } from '../../types';
import { convertCopperToGSC } from '../../data';

interface TradeConfirmationScreenProps {
  onConfirm: () => void;
  onCancel: () => void;
  playerOffer: OfferItem[];
  merchantOffer: OfferItem[];
  balance: number;
}

const TradeConfirmationScreen: FC<TradeConfirmationScreenProps> = ({ onConfirm, onCancel, playerOffer, merchantOffer, balance }) => {
    
    const playerOfferValue = useMemo(() => playerOffer.reduce((sum, offer) => {
        return sum + (offer.item.base_value * offer.quantity);
    }, 0), [playerOffer]);

    const merchantOfferValue = useMemo(() => merchantOffer.reduce((sum, offer) => {
        return sum + (offer.item.base_value * offer.quantity);
    }, 0), [merchantOffer]);

    const BalanceDisplay: FC<{ amount: number }> = ({ amount }) => {
        if (amount === 0) {
            return <div className="flex items-center justify-center gap-1"><span>0</span><Coins size={20} className="text-orange-400" /></div>;
        }
        const { gold, silver, copper } = convertCopperToGSC(amount);
        const parts = [];
        if (gold > 0) parts.push(<div key="g" className="flex items-center gap-1"><span>{gold}</span><Coins size={24} className="text-yellow-400" /></div>);
        if (silver > 0) parts.push(<div key="s" className="flex items-center gap-1"><span>{silver}</span><Coins size={24} className="text-gray-400" /></div>);
        if (copper > 0) parts.push(<div key="c" className="flex items-center gap-1"><span>{copper}</span><Coins size={24} className="text-orange-400" /></div>);
        
        return <div className="flex items-center justify-center gap-4">{parts}</div>;
    };

    const OfferList: FC<{title: string, items: OfferItem[], totalValue: number}> = ({ title, items, totalValue }) => (
        <div className="bg-black/40 rounded-lg border border-zinc-800 p-4 flex flex-col h-full min-h-0">
            <h2 className="text-xl font-bold text-white mb-2 flex-shrink-0 border-b border-zinc-700 pb-2" style={{ fontFamily: 'Cinzel, serif' }}>{title}</h2>
             <div className="overflow-y-auto flex-grow min-h-0 custom-scrollbar pr-2 space-y-2 py-2">
                {items.length > 0 ? items.map(offer => {
                    const itemValue = offer.item.base_value;
                    return (
                        <div key={offer.item.id} className="flex justify-between items-center p-2 rounded-md bg-zinc-900/80">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-black/40 rounded-md border border-zinc-700">
                                    {offer.item.icon || ((itemsData as any)[offer.item.id]?.image ? <img src={(itemsData as any)[offer.item.id].image} alt={offer.item.name} className="w-6 h-6" /> : null)}
                                </div>
                                <span className="truncate">{offer.item.name}</span>
                                {offer.item.stackable && offer.quantity > 1 && <span className="text-xs text-zinc-400">({offer.quantity})</span>}
                            </div>
                            <span className="text-right text-yellow-300/90 font-mono">{`${convertCopperToGSC(itemValue * offer.quantity).gold}g ${convertCopperToGSC(itemValue * offer.quantity).silver}s ${convertCopperToGSC(itemValue * offer.quantity).copper}c`}</span>
                        </div>
                    );
                }) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <Package size={32} />
                        <p className="mt-2 text-sm">No items offered.</p>
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 flex justify-between items-center pt-3 mt-2 border-t border-zinc-700">
                <span className="font-bold text-lg">Total Value:</span>
                <span className="font-bold text-lg text-yellow-300">{totalValue}c</span>
            </div>
        </div>
    );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-8 animate-fade-in backdrop-blur-md">
        <div className="w-full max-w-5xl bg-zinc-950/90 backdrop-blur-2xl rounded-xl border border-zinc-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 relative flex flex-col max-h-[90vh] overflow-hidden">
            {/* Top glass accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />
            
            <h1 className="text-4xl lg:text-5xl font-bold text-center mb-10 tracking-[0.2em] uppercase text-white" style={{ fontFamily: 'Cinzel, serif' }}>Confirm Exchange</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow min-h-0">
                <OfferList title="Offering" items={playerOffer} totalValue={playerOfferValue} />
                <OfferList title="Receiving" items={merchantOffer} totalValue={merchantOfferValue} />
            </div>

            <div className="mt-8 p-6 rounded-xl bg-black/60 border border-zinc-800/50 flex flex-col items-center flex-shrink-0">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-4">Final Settlement</h3>
                <div className={`text-4xl font-bold tracking-tighter ${balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-white'}`}>
                    <BalanceDisplay amount={Math.abs(balance)} />
                </div>
                <p className={`mt-4 text-[10px] font-black uppercase tracking-[0.2em] ${balance > 0 ? 'text-green-500/70' : balance < 0 ? 'text-red-500/70' : 'text-zinc-500'}`}>
                    {balance > 0 ? 'Surplus Credit' : balance < 0 ? 'Trade Deficit' : 'Balanced Exchange'}
                </p>
            </div>

            <div className="mt-10 flex justify-center gap-6 flex-shrink-0">
                <button 
                    onClick={onCancel} 
                    className="px-10 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all border border-transparent hover:border-zinc-800 rounded-xl hover:bg-white/5"
                >
                    Cancel
                </button>
                 <button 
                    onClick={onConfirm}
                    className="px-12 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-zinc-800/50 border border-zinc-700/50 rounded-xl transition-all hover:bg-white/10 hover:border-zinc-400 hover:shadow-2xl active:scale-95"
                 >
                    Seal the Deal
                </button>
            </div>
        </div>
    </div>
  );
};

export default TradeConfirmationScreen;
import itemsData from '../../data/items.json';

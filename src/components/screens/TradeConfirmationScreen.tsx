
import React, { useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import { Coins, Package } from 'lucide-react';
import type { OfferItem, Item } from '../../types';
import { convertCopperToGSC } from '../../data';

interface TradeConfirmationScreenProps {
  onClose: () => void;
  onCancel: () => void;
  playerOffer: OfferItem[];
  merchantOffer: OfferItem[];
}

const TradeConfirmationScreen: FC<TradeConfirmationScreenProps> = ({ onClose, onCancel, playerOffer, merchantOffer }) => {
    
    const playerOfferValue = useMemo(() => playerOffer.reduce((sum, offer) => sum + offer.item.value * offer.quantity, 0), [playerOffer]);
    const merchantOfferValue = useMemo(() => merchantOffer.reduce((sum, offer) => sum + offer.item.value * offer.quantity, 0), [merchantOffer]);
    const balance = playerOfferValue - merchantOfferValue;

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
        <div className="bg-black/20 rounded-lg border border-zinc-800 p-4 flex flex-col h-full min-h-0">
            <h2 className="text-xl font-bold text-white mb-2 flex-shrink-0 border-b border-zinc-700 pb-2" style={{ fontFamily: 'Cinzel, serif' }}>{title}</h2>
             <div className="overflow-y-auto flex-grow min-h-0 custom-scrollbar pr-2 space-y-2 py-2">
                {items.length > 0 ? items.map(offer => (
                    <div key={offer.item.id} className="flex justify-between items-center p-2 rounded-md bg-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-black/40 rounded-md border border-zinc-700">
                                {offer.item.icon}
                            </div>
                            <span className="truncate">{offer.item.name}</span>
                            {offer.item.stackable && offer.quantity > 1 && <span className="text-xs text-zinc-400">({offer.quantity})</span>}
                        </div>
                        <span className="text-right text-yellow-300/90 font-mono">{offer.item.value * offer.quantity}c</span>
                    </div>
                )) : (
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
    <div className="w-full h-full p-8 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-zinc-950/80 backdrop-blur-lg rounded-xl border border-zinc-700 p-6 relative flex flex-col max-h-[90vh]">
            <h1 className="text-4xl font-bold text-center mb-6 flex-shrink-0" style={{ fontFamily: 'Cinzel, serif' }}>Confirm Trade</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
                <OfferList title="You Give" items={playerOffer} totalValue={playerOfferValue} />
                <OfferList title="You Receive" items={merchantOffer} totalValue={merchantOfferValue} />
            </div>

            <div className="mt-6 p-4 rounded-lg bg-black/30 border border-zinc-800 flex flex-col items-center flex-shrink-0">
                <h3 className="text-lg font-semibold text-zinc-300">Final Balance</h3>
                <div className={`text-3xl my-2 ${balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-white'}`}>
                    <BalanceDisplay amount={Math.abs(balance)} />
                </div>
                <p className={`text-md font-semibold ${balance > 0 ? 'text-green-500' : balance < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                    {balance > 0 ? 'You will receive this amount' : balance < 0 ? 'You will pay this amount' : 'An even trade'}
                </p>
            </div>

            <div className="mt-6 flex justify-center gap-4 flex-shrink-0">
                <button 
                    onClick={onCancel} 
                    className="px-8 py-3 text-md font-semibold tracking-wide text-white/90 bg-zinc-700/80 border border-zinc-600 rounded-md transition-all duration-300 hover:bg-zinc-600/80 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                    Cancel
                </button>
                 <button 
                    onClick={onClose}
                    className="px-8 py-3 text-md font-semibold tracking-wide text-white/90 bg-zinc-700 border border-zinc-600 rounded-md transition-all duration-300 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                 >
                    Confirm Trade
                </button>
            </div>
        </div>
    </div>
  );
};

export default TradeConfirmationScreen;
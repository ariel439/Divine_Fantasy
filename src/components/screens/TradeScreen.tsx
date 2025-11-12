
import React, { useState, useMemo } from 'react';
import type { FC } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import type { Item, OfferItem } from '../../types';
import { mockInventory, mockMerchant } from '../../data';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import ItemSelectionPanel from '../ui/ItemSelectionPanel';
// FIX: Changed to a named import to resolve module issue.
import { QuantityModal } from '../modals/QuantityModal';

interface TradeScreenProps {
  onClose: () => void;
  onConfirmTrade: (playerOffer: OfferItem[], merchantOffer: OfferItem[]) => void;
}

const TradeScreen: FC<TradeScreenProps> = ({ onClose, onConfirmTrade }) => {
    const [playerItems, setPlayerItems] = useState<Item[]>(mockInventory);
    const [merchantItems, setMerchantItems] = useState<Item[]>(mockMerchant.inventory);
    const [playerOffer, setPlayerOffer] = useState<OfferItem[]>([]);
    const [merchantOffer, setMerchantOffer] = useState<OfferItem[]>([]);
    
    const [quantityModalState, setQuantityModalState] = useState<{
        isOpen: boolean;
        item: Item | null;
        side: 'player' | 'merchant' | null;
    }>({ isOpen: false, item: null, side: null });

    const playerTotalCopper = 135080; // Represents 13 gold, 50 silver, 80 copper
    
    const playerOfferValue = useMemo(() => playerOffer.reduce((sum, offer) => sum + offer.item.value * offer.quantity, 0), [playerOffer]);
    const merchantOfferValue = useMemo(() => merchantOffer.reduce((sum, offer) => sum + offer.item.value * offer.quantity, 0), [merchantOffer]);
    
    const balance = playerOfferValue - merchantOfferValue;

    const canAfford = (playerTotalCopper + balance) >= 0;

    const handleItemSelect = (item: Item, side: 'player' | 'merchant') => {
        const offer = side === 'player' ? playerOffer : merchantOffer;
        const setOffer = side === 'player' ? setPlayerOffer : setMerchantOffer;
        const existingOffer = offer.find(o => o.item.id === item.id);

        if (existingOffer) {
            // If item is already in offer, remove it
            setOffer(offer.filter(o => o.item.id !== item.id));
        } else {
            // If item is not in offer, add it
            if (item.stackable && (item.quantity ?? 1) > 1) {
                // Open modal for stackable items
                setQuantityModalState({ isOpen: true, item, side });
            } else {
                // Add non-stackable items directly
                setOffer([...offer, { item, quantity: 1 }]);
            }
        }
    };
    
    const handleQuantityConfirm = (quantity: number) => {
        const { item, side } = quantityModalState;
        if (!item || !side) return;

        const offer = side === 'player' ? playerOffer : merchantOffer;
        const setOffer = side === 'player' ? setPlayerOffer : setMerchantOffer;
        
        setOffer([...offer, { item, quantity }]);
        setQuantityModalState({ isOpen: false, item: null, side: null });
    };

    const playerOfferIds = useMemo(() => new Set(playerOffer.map(o => o.item.id)), [playerOffer]);
    const merchantOfferIds = useMemo(() => new Set(merchantOffer.map(o => o.item.id)), [merchantOffer]);
    
    return (
        <>
            <div className="w-full h-full p-4 sm:p-8 flex items-center justify-center">
                 <div className="w-full h-full max-w-screen-xl bg-zinc-950/80 backdrop-blur-lg rounded-xl border border-zinc-700 p-6 flex flex-col relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-20"><X size={24} /></button>
                    <header className="flex-shrink-0 text-center mb-4">
                        <h1 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Trading with {mockMerchant.name}</h1>
                    </header>
                    
                    <div className="flex-grow grid grid-cols-11 gap-4 min-h-0">
                        {/* Player Inventory */}
                        <div className="col-span-5 flex flex-col min-h-0">
                            <CurrencyDisplay totalCopper={playerTotalCopper} />
                            <div className="flex-grow min-h-0 mt-1">
                                 <ItemSelectionPanel 
                                    title="Your Items" 
                                    items={playerItems} 
                                    onItemSelect={(item) => handleItemSelect(item, 'player')}
                                    selectedItemId={null} // We use a different selection indicator
                                    highlightedItemIds={playerOfferIds}
                                />
                            </div>
                        </div>

                        {/* Middle Barter Section */}
                        <div className="col-span-1 flex flex-col items-center justify-center">
                            <ArrowRightLeft size={32} className="text-zinc-500 mb-4" />
                            <div className="text-center my-4">
                                <p className="text-sm text-zinc-400">Balance</p>
                                <p className={`text-xl font-bold ${balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-white'}`}>
                                    {Math.abs(balance)}c
                                </p>
                                <p className={`text-xs ${balance > 0 ? 'text-green-500' : balance < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                                    {balance > 0 ? 'You Get' : balance < 0 ? 'You Owe' : 'Even'}
                                </p>
                            </div>
                            <button 
                                onClick={() => onConfirmTrade(playerOffer, merchantOffer)}
                                disabled={(playerOffer.length === 0 && merchantOffer.length === 0) || !canAfford}
                                className="w-full mt-4 p-3 text-sm font-semibold tracking-wide bg-zinc-700 border border-zinc-600 rounded-md transition-all hover:bg-zinc-600 disabled:bg-zinc-600/50 disabled:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-400"
                            >
                                {canAfford ? "Barter" : "Can't Afford"}
                            </button>
                        </div>

                        {/* Merchant Inventory */}
                        <div className="col-span-5 flex flex-col min-h-0">
                            <CurrencyDisplay totalCopper={mockMerchant.totalCopper} />
                            <div className="flex-grow min-h-0 mt-1">
                                 <ItemSelectionPanel 
                                    title="Merchant's Wares" 
                                    items={merchantItems} 
                                    onItemSelect={(item) => handleItemSelect(item, 'merchant')}
                                    selectedItemId={null} // We use a different selection indicator
                                    highlightedItemIds={merchantOfferIds}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <QuantityModal
                isOpen={quantityModalState.isOpen}
                item={quantityModalState.item}
                onConfirm={handleQuantityConfirm}
                onClose={() => setQuantityModalState({ isOpen: false, item: null, side: null })}
            />
        </>
    );
};

export default TradeScreen;
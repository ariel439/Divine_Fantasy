
import React, { FC, useState, useMemo } from 'react';
import { useShopStore } from '../../stores/useShopStore';
import { useInventoryStore, InventoryState } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { Item, OfferItem } from '../../types';
import { shallow } from 'zustand/shallow';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import ItemSelectionPanel from '../ui/ItemSelectionPanel';
import { QuantityModal } from '../modals/QuantityModal';
import TradeConfirmationScreen from './TradeConfirmationScreen';
import itemsData from '../../data/items.json';
import { X, ArrowRightLeft } from 'lucide-react';

interface TradeScreenProps {
  shopId: string;
  onClose: () => void;
  onConfirmTrade: (playerOffer: OfferItem[], merchantOffer: OfferItem[]) => void;
}

const itemsMap: Record<string, Item> = {};
Object.entries(itemsData).forEach(([id, item]) => {
  itemsMap[id] = { ...item, id } as Item;
});

const TradeScreen: FC<TradeScreenProps> = ({ shopId, onClose, onConfirmTrade }) => {
    const { getShop, updateShopInventory } = useShopStore();
    const inventoryState = useInventoryStore((state) => state) as InventoryState;
    const playerInventory = inventoryState.items;
    const { addCurrency, removeCurrency, currency } = useCharacterStore();
    const shop = useShopStore((state) => state.shops[shopId]);

    const [playerOffer, setPlayerOffer] = useState<OfferItem[]>([]);
    const [merchantOffer, setMerchantOffer] = useState<OfferItem[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [selectedPlayerItemId, setSelectedPlayerItemId] = useState<string | null>(null);
    const [selectedMerchantItemId, setSelectedMerchantItemId] = useState<string | null>(null);
    
    const [quantityModalState, setQuantityModalState] = useState<{
        isOpen: boolean;
        item: Item | null;
        side: 'player' | 'merchant' | null;
        currentQuantity?: number; // Add this line
    }>({ isOpen: false, item: null, side: null });

    if (!shop) {
        return <div className="text-white">Shop not found!</div>;
    }

    const playerTotalCopper = currency.copper + currency.silver * 100 + currency.gold * 10000;
    const merchantTotalCopper = shop.currency; // Use actual shop currency

    const SELL_PRICE_MULTIPLIER = 0.5; // Player sells items for half their base value

    const tradeMode = useMemo(() => {
        if (playerOffer.length > 0 && merchantOffer.length === 0) return 'selling';
        if (merchantOffer.length > 0 && playerOffer.length === 0) return 'buying';
        if (playerOffer.length > 0 && merchantOffer.length > 0) return 'bartering';
        return 'idle';
    }, [playerOffer, merchantOffer]);

    const playerOfferValue = useMemo(() => playerOffer.reduce((sum, offer) => {
        const value = tradeMode === 'selling' || tradeMode === 'bartering'
            ? Math.floor(offer.item.base_value * SELL_PRICE_MULTIPLIER)
            : offer.item.base_value; // If buying, player's items are valued at full price
        return sum + value * offer.quantity;
    }, 0), [playerOffer, tradeMode]);

    const merchantOfferValue = useMemo(() => merchantOffer.reduce((sum, offer) => {
        const value = tradeMode === 'buying' || tradeMode === 'bartering'
            ? offer.item.base_value
            : Math.floor(offer.item.base_value * SELL_PRICE_MULTIPLIER); // If selling, merchant's items are valued at half price
        return sum + value * offer.quantity;
    }, 0), [merchantOffer, tradeMode]);
    
    const balance = playerOfferValue - merchantOfferValue;

    const canAfford = (playerTotalCopper + balance) >= 0;

    const handleItemSelect = (item: Item, side: 'player' | 'merchant') => {
        const offer = side === 'player' ? playerOffer : merchantOffer;
        const setOffer = side === 'player' ? setPlayerOffer : setMerchantOffer;

        // For non-stackable items, we need to find by UUID
        const existingOfferIndex = item.stackable
            ? offer.findIndex(o => o.item.id === item.id)
            : offer.findIndex(o => o.item.uuid === item.uuid);

        if (existingOfferIndex !== -1) {
            // Item is already in offer
            if (item.stackable) {
                // If stackable, open quantity modal to adjust quantity
                setQuantityModalState({ isOpen: true, item: offer[existingOfferIndex].item, side, currentQuantity: offer[existingOfferIndex].quantity });
            } else {
                // If not stackable, remove it
                setOffer(offer.filter((_, index) => index !== existingOfferIndex));
                if (side === 'player') setSelectedPlayerItemId(null);
                else setSelectedMerchantItemId(null);
            }
        } else {
            // Item is not in offer, add it
            if (item.stackable && (item.quantity ?? 1) > 1) {
                setQuantityModalState({ isOpen: true, item, side, currentQuantity: 0 }); // New item, start with 0 or 1
            } else {
                setOffer([...offer, { item, quantity: 1 }]);
                if (side === 'player') setSelectedPlayerItemId(item.uuid || item.id);
                else setSelectedMerchantItemId(item.uuid || item.id);
            }
        }
    };
    
    const handleQuantityConfirm = (quantity: number) => {
        const { item, side, currentQuantity } = quantityModalState;
        if (!item || !side) return;

        const offer = side === 'player' ? playerOffer : merchantOffer;
        const setOffer = side === 'player' ? setPlayerOffer : setMerchantOffer;

        const existingOfferIndex = item.stackable
            ? offer.findIndex(o => o.item.id === item.id)
            : offer.findIndex(o => o.item.uuid === item.uuid);

        if (existingOfferIndex !== -1) {
            // Update existing item quantity
            const newOffer = [...offer];
            if (quantity === 0) {
                newOffer.splice(existingOfferIndex, 1); // Remove if quantity is 0
            } else {
                newOffer[existingOfferIndex] = { ...newOffer[existingOfferIndex], quantity };
            }
            setOffer(newOffer);
        } else {
            // Add new item to offer
            setOffer([...offer, { item, quantity }]);
        }

        if (side === 'player') setSelectedPlayerItemId(item.uuid || item.id);
        else setSelectedMerchantItemId(item.uuid || item.id);

        setQuantityModalState({ isOpen: false, item: null, side: null, currentQuantity: undefined });
    };

    const playerOfferIds = useMemo(() => new Set(playerOffer.map(o => o.item.uuid || o.item.id)), [playerOffer]);
    const merchantOfferIds = useMemo(() => new Set(merchantOffer.map(o => o.item.uuid || o.item.id)), [merchantOffer]);
    
    const handleConfirmTrade = () => {
        if (!shop) return;

        // Calculate final balance
        const finalBalance = playerOfferValue - merchantOfferValue;

        // Update player currency
        if (finalBalance > 0) {
            addCurrency("copper", finalBalance);
        } else if (finalBalance < 0) {
            removeCurrency(Math.abs(finalBalance));
        }

        // Update shop currency
        useShopStore.getState().updateShopCurrency(shop.shop_id, shop.currency - finalBalance);

        // Update player inventory
        playerOffer.forEach(offer => {
            useInventoryStore.getState().removeItem(offer.item.id, offer.quantity);
        });
        merchantOffer.forEach(offer => {
            useInventoryStore.getState().addItem(offer.item.id, offer.quantity);
        });

        // Update shop inventory
        const newShopInventory = [...shop.inventory];
        playerOffer.forEach(offer => {
            const existingShopItemIndex = newShopInventory.findIndex(si => si.item.id === offer.item.id);
            if (existingShopItemIndex !== -1) {
                newShopInventory[existingShopItemIndex].quantity += offer.quantity;
            } else {
                newShopInventory.push({ item: offer.item, quantity: offer.quantity });
            }
        });
        merchantOffer.forEach(offer => {
            const existingShopItemIndex = newShopInventory.findIndex(si => si.item.id === offer.item.id);
            if (existingShopItemIndex !== -1) {
                newShopInventory[existingShopItemIndex].quantity -= offer.quantity;
            } else {
                // This case should ideally not happen if merchant only offers items they have
                console.warn(`Merchant offered item not in inventory: ${offer.item.name}`);
            }
        });
        updateShopInventory(shop.shop_id, newShopInventory);

        // Clear offers and close modal
        setPlayerOffer([]);
        setMerchantOffer([]);
        onConfirmTrade(playerOffer, merchantOffer); // Call original onConfirmTrade for any parent logic
        setShowConfirmation(false);
    };

    const handleFinalizeTrade = () => {
        handleConfirmTrade(); // Call the actual trade logic
        onClose(); // Close the trade screen after finalizing
    };

    return (
        <>
            <div className="w-full h-full p-4 sm:p-8 flex items-center justify-center">
                 <div className="w-full h-full max-w-screen-xl bg-zinc-950/80 backdrop-blur-lg rounded-xl border border-zinc-700 p-6 flex flex-col relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-20"><X size={24} /></button>
                    <header className="flex-shrink-0 text-center mb-4">
                        <h1 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Trading with {shop.name}</h1>
                    </header>
                    
                    <div className="flex-grow grid grid-cols-11 gap-4 min-h-0">
                        {/* Player Inventory */}
                        <div className="col-span-5 flex flex-col min-h-0">
                            <CurrencyDisplay totalCopper={playerTotalCopper} />
                            <div className="flex-grow min-h-0 mt-1">
                                 <ItemSelectionPanel 
                                    title="Your Items" 
                                    items={playerInventory
                                        .filter(invItem => itemsMap[invItem.id]) // Filter out items not in database
                                        .map(invItem => ({ ...itemsMap[invItem.id], quantity: invItem.quantity, uuid: invItem.uuid }))} 
                                    onItemSelect={(item) => handleItemSelect(item, 'player')}
                                    selectedItemId={selectedPlayerItemId}
                                    highlightedItemIds={playerOfferIds}
                                    valueMultiplier={SELL_PRICE_MULTIPLIER}
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
                                onClick={() => {
                                    setShowConfirmation(true);
                                }}
                                disabled={(playerOffer.length === 0 && merchantOffer.length === 0) || !canAfford}
                                className="w-full mt-4 p-3 text-sm font-semibold tracking-wide bg-zinc-700 border border-zinc-600 rounded-md transition-all hover:bg-zinc-600/50 disabled:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-400"
                            >
                                {canAfford ? "Barter" : "Can't Afford"}
                            </button>
                        </div>

                        {/* Merchant Inventory */}
                        <div className="col-span-5 flex flex-col min-h-0">
                            <CurrencyDisplay totalCopper={merchantTotalCopper} />
                            <div className="flex-grow min-h-0 mt-1">
                                 <ItemSelectionPanel 
                                    title="Merchant's Wares" 
                                    items={shop.inventory
                                        .filter(shopItem => shopItem.item) // Filter out items that failed to load
                                        .map(shopItem => ({ ...shopItem.item, quantity: shopItem.quantity, uuid: shopItem.item.uuid }))} 
                                    onItemSelect={(item) => handleItemSelect(item, 'merchant')}
                                    selectedItemId={selectedMerchantItemId}
                                    highlightedItemIds={merchantOfferIds}
                                    valueMultiplier={1.0}
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

            {showConfirmation && (
                <TradeConfirmationScreen
                    onClose={handleFinalizeTrade}
                    onCancel={() => setShowConfirmation(false)}
                    playerOffer={playerOffer}
                    merchantOffer={merchantOffer}
                    tradeMode={tradeMode}
                />
            )}
        </>
    );
};

export default TradeScreen;
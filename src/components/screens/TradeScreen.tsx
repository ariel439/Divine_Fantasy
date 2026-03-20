
import React, { FC, useState, useMemo } from 'react';
import { useShopStore } from '../../stores/useShopStore';
import { useInventoryStore, InventoryState } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { Item, OfferItem } from '../../types';
import ItemSelectionPanel from '../ui/ItemSelectionPanel';
import { QuantityModal } from '../modals/QuantityModal';
import TradeConfirmationScreen from './TradeConfirmationScreen';
import itemsData from '../../data/items.json';
import { X, ArrowRightLeft } from 'lucide-react';
import locationsData from '../../data/locations.json';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';
import { useLocationStore } from '../../stores/useLocationStore';

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
    const updateShopInventory = useShopStore((state) => state.updateShopInventory);
    const inventoryState = useInventoryStore((state) => state) as InventoryState;
    const playerInventory = inventoryState.items;
    const { addCurrency, removeCurrency, currency } = useCharacterStore();
    const shop = useShopStore((state) => state.shops[shopId]);
    const { hour } = useWorldTimeStore();
    const currentLocationId = useLocationStore((state) => state.currentLocationId);

    const [playerOffer, setPlayerOffer] = useState<OfferItem[]>([]);
    const [merchantOffer, setMerchantOffer] = useState<OfferItem[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [selectedPlayerItemId, setSelectedPlayerItemId] = useState<string | null>(null);
    const [selectedMerchantItemId, setSelectedMerchantItemId] = useState<string | null>(null);
    
    const [quantityModalState, setQuantityModalState] = useState<{
        isOpen: boolean;
        item: Item | null;
        side: 'player' | 'merchant' | null;
        currentQuantity?: number;
    }>({ isOpen: false, item: null, side: null });

    if (!shop) {
        return <div className="text-white">Shop not found!</div>;
    }

    const locationData = (locationsData as any)[currentLocationId] || (locationsData as any)[shop.location_id];
    const tradeBackground = (() => {
        if (!locationData) return '/assets/backgrounds/minimal_bg.png';
        const isNight = hour < 6 || hour >= 18;
        if (isNight && locationData.night_background) return locationData.night_background;
        return locationData.day_background || locationData.background || '/assets/backgrounds/minimal_bg.png';
    })();

    const playerTotalCopper = currency.copper + currency.silver * 100 + currency.gold * 10000;
    const merchantTotalCopper = shop.currency; // Use actual shop currency

    const tradeMode = useMemo(() => {
        if (playerOffer.length > 0 && merchantOffer.length === 0) return 'selling';
        if (merchantOffer.length > 0 && playerOffer.length === 0) return 'buying';
        if (playerOffer.length > 0 && merchantOffer.length > 0) return 'bartering';
        return 'idle';
    }, [playerOffer, merchantOffer]);

    const playerOfferValue = useMemo(() => playerOffer.reduce((sum, offer) => {
        const value = tradeMode === 'selling' || tradeMode === 'bartering'
            ? Math.floor(offer.item.base_value * shop.buy_multiplier)
            : offer.item.base_value; // If buying, player's items are valued at full price
        return sum + value * offer.quantity;
    }, 0), [playerOffer, tradeMode, shop.buy_multiplier]);

    const merchantOfferValue = useMemo(() => merchantOffer.reduce((sum, offer) => {
        const value = tradeMode === 'buying' || tradeMode === 'bartering'
            ? Math.floor(offer.item.base_value * shop.sell_multiplier)
            : Math.floor(offer.item.base_value * shop.buy_multiplier);
        return sum + value * offer.quantity;
    }, 0), [merchantOffer, tradeMode, shop.sell_multiplier, shop.buy_multiplier]);
    
    const balance = playerOfferValue - merchantOfferValue;

    const canAfford = (playerTotalCopper + balance) >= 0;

    const handleItemSelect = (item: Item, side: 'player' | 'merchant') => {
        // Check if shop accepts this item category when player is selling
        if (side === 'player' && shop.accepted_categories) {
            // Determine item category/type
            // Use 'type' field if available, fallback to 'category' or guess based on item properties
            const itemType = item.type || (item.category ? item.category.toLowerCase() : 'misc');
            
            // Check if item type is in accepted categories
            // We need to handle potential mismatches in naming conventions (e.g. 'consumable' vs 'Consumable')
            const isAccepted = shop.accepted_categories.some(cat => 
                cat.toLowerCase() === itemType.toLowerCase() || 
                (item.category && cat.toLowerCase() === item.category.toLowerCase())
            );

            if (!isAccepted) {
                // Ideally show a toast or message here
                // For now, we can just return and maybe log it
                // console.log(`Shop ${shop.name} does not accept ${itemType}`);
                // You might want to use the toast system here if available in this context
                // toast.addToast(`${shop.name} doesn't buy ${itemType} items.`, 'warning');
                return;
            }
        }

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
        const { item, side } = quantityModalState;
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
                if (side === 'player') setSelectedPlayerItemId(null);
                else setSelectedMerchantItemId(null);
            } else {
                newOffer[existingOfferIndex] = { ...newOffer[existingOfferIndex], quantity };
            }
            setOffer(newOffer);
        } else {
            // Add new item to offer
            if (quantity > 0) {
                setOffer([...offer, { item, quantity }]);
            }
        }

        if (quantity > 0) {
            if (side === 'player') setSelectedPlayerItemId(item.uuid || item.id);
            else setSelectedMerchantItemId(item.uuid || item.id);
        }

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
        <div className="relative w-screen h-screen bg-zinc-950 flex flex-col overflow-hidden">
            {/* Background Layer with blur */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 blur-md" style={{ backgroundImage: `url(${tradeBackground})` }} />
            
            {/* Header */}
            <header className="relative z-20 w-full h-[7vh] min-h-[56px] px-8 flex justify-between items-center border-b border-zinc-800/50 backdrop-blur-xl shrink-0 bg-zinc-950/50">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all group px-4 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-zinc-800"
                >
                    <X size={16} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-bold tracking-widest uppercase text-[10px]">Close Trade</span>
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-white tracking-[0.3em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                        The Merchant's Exchange
                    </h1>
                </div>
                <div className="w-[120px]" />
            </header>

            {/* Main Content Area */}
            <div className="relative z-10 w-full h-[86vh] flex flex-col lg:flex-row gap-6 p-6 items-stretch overflow-hidden">
                {/* Left Panel: Merchant Inventory */}
                <div className="w-full lg:w-[45%] h-full flex flex-col min-h-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex-grow bg-zinc-950/80 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden flex flex-col h-full relative">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />
                        <ItemSelectionPanel
                            title={`${shop.name}'s Wares`}
                            items={shop.inventory.map(si => ({ ...si.item, quantity: si.quantity }))}
                            onItemSelect={(item) => handleItemSelect(item, 'merchant')}
                            selectedItemId={selectedMerchantItemId}
                            highlightedItemIds={merchantOfferIds}
                            valueMultiplier={shop.sell_multiplier}
                            currency={{
                                gold: Math.floor(merchantTotalCopper / 10000),
                                silver: Math.floor((merchantTotalCopper % 10000) / 100),
                                copper: merchantTotalCopper % 100,
                            }}
                        />
                    </div>
                </div>

                {/* Center Panel: Trade Summary */}
                <div className="w-full lg:w-[10%] flex flex-col items-center justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="p-4 bg-zinc-950/80 backdrop-blur-md rounded-full border border-zinc-800/50 shadow-xl">
                        <ArrowRightLeft size={24} className={`text-zinc-400 ${tradeMode !== 'idle' ? 'animate-pulse text-zinc-100' : ''}`} />
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Balance</span>
                        <div className={`text-xl font-bold font-mono tracking-tighter ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {balance >= 0 ? `+${balance}` : balance}
                        </div>
                    </div>

                    <button
                        onClick={() => setShowConfirmation(true)}
                        disabled={tradeMode === 'idle'}
                        className="px-6 py-3 bg-zinc-100 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-lg transition-all hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed shadow-xl"
                    >
                        Review
                    </button>
                </div>

                {/* Right Panel: Player Inventory */}
                <div className="w-full lg:w-[45%] h-full flex flex-col min-h-0 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                    <div className="flex-grow bg-zinc-950/80 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden flex flex-col h-full relative">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />
                        <ItemSelectionPanel
                            title="Your Belongings"
                            items={playerInventory
                                .filter(invItem => itemsMap[invItem.id])
                                .map(invItem => ({ ...itemsMap[invItem.id], quantity: invItem.quantity, uuid: invItem.uuid }))}
                            onItemSelect={(item) => handleItemSelect(item, 'player')}
                            selectedItemId={selectedPlayerItemId}
                            highlightedItemIds={playerOfferIds}
                            valueMultiplier={shop.buy_multiplier}
                            acceptedCategories={shop.accepted_categories}
                            currency={currency}
                        />
                    </div>
                </div>
            </div>

            <QuantityModal
                isOpen={quantityModalState.isOpen}
                item={quantityModalState.item}
                side={quantityModalState.side}
                currentQuantity={quantityModalState.currentQuantity}
                maxQuantity={quantityModalState.item?.quantity ?? 1}
                onConfirm={handleQuantityConfirm}
                onCancel={() => setQuantityModalState({ isOpen: false, item: null, side: null })}
            />

            {showConfirmation && (
                <TradeConfirmationScreen
                    playerOffer={playerOffer}
                    merchantOffer={merchantOffer}
                    balance={balance}
                    canAfford={canAfford}
                    onConfirm={handleFinalizeTrade}
                    onCancel={() => setShowConfirmation(false)}
                />
            )}
        </div>
    );
};

export default TradeScreen;

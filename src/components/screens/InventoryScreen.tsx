import React, { useState, useMemo } from 'react';
import type { FC } from 'react';
import { Coins, ArrowLeft, Settings2 } from 'lucide-react';
import type { Item, EquipmentSlot, FilterCategory } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useUIStore } from '../../stores/useUIStore';
import ProgressBar from '../ui/ProgressBar';
import ItemSelectionPanel from '../ui/ItemSelectionPanel';
import EquippedGearPanel from '../ui/EquippedGearPanel';
import ItemDetailsPanel from '../ui/ItemDetailsPanel';
import ConfirmationModal from '../modals/ConfirmationModal';
import QuantityModal from '../modals/QuantityModal';
import itemsData from '../../data/items.json';
import { useWorldStateStore } from '../../stores/useWorldStateStore';

const isSocialEquipment = (item: Item): boolean => {
    if (!item.equipmentSlot) return false;
    if (item.equipmentSlot === 'weapon' || item.equipmentSlot === 'shield') return false;
    if ((item.threatTier ?? 0) > 0) return false;
    return (item.presentationTier ?? 0) > 0;
};

const InventoryScreen: FC = () => {
    const { setScreen } = useUIStore();
    const { items: inventoryItems, getCurrentWeight, useItem, removeItem, currentWeight } = useInventoryStore();
    const { currency, maxWeight, equippedItems, equipmentLoadouts, activeEquipmentLoadout, equipItem, unequipItem, hunger } = useCharacterStore();
    const { getData, setData } = useWorldStateStore();

    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [rightPanelView, setRightPanelView] = useState<'equipment' | 'details'>('equipment');
    const [showAutoEatSettings, setShowAutoEatSettings] = useState(false);
    const [dropConfirmItem, setDropConfirmItem] = useState<Item | null>(null);
    const [dropQuantityItem, setDropQuantityItem] = useState<Item | null>(null);

    const buildDisplayItem = (baseItem: { id: string; quantity?: number; uuid?: string }): Item | null => {
        const itemData = itemsData[baseItem.id as keyof typeof itemsData];
        if (!itemData) return null;

        const equipSlot = (itemData as any).equipmentSlot as EquipmentSlot | undefined;
        const iconSrc = (itemData as any).image as string | undefined;

        let category: FilterCategory = 'Misc';
        const itemType = (itemData as any).type as string;

        if (itemType === 'weapon' || itemType === 'armor' || itemType === 'accessory' || itemType === 'clothing') {
            category = isSocialEquipment({
                id: baseItem.id,
                name: itemData.name,
                description: itemData.description,
                weight: itemData.weight,
                base_value: itemData.base_value,
                quantity: baseItem.quantity ?? 1,
                stackable: itemData.stackable,
                type: itemType,
                equipmentSlot: equipSlot,
                presentationTier: (itemData as any).presentationTier,
                threatTier: (itemData as any).threatTier,
            } as Item)
                ? 'Cloth'
                : 'Equipment';
        } else if (itemType === 'resource') {
            category = 'Resource';
        } else if (itemType === 'consumable') {
            category = 'Consumable';
        } else if (itemType === 'tool') {
            category = 'Tool';
        } else if (itemType === 'key_item' || itemType === 'quest') {
            category = 'Quest';
        }

        return {
            id: baseItem.id,
            uuid: baseItem.uuid,
            name: itemData.name,
            description: itemData.description,
            icon: iconSrc ? (<img src={iconSrc} alt={itemData.name} className="w-6 h-6" />) : undefined,
            category,
            type: itemType,
            weight: itemData.weight,
            base_value: itemData.base_value,
            quantity: baseItem.quantity ?? 1,
            stackable: itemData.stackable,
            effects: (itemData as any).effects,
            actions: equipSlot ? ['Equip', 'Drop'] : ['Use', 'Drop'],
            bookId: (itemData as any).bookId,
            combatTags: (itemData as any).combatTags,
            equipmentSlot: equipSlot,
            stats: (itemData as any).stats || {},
            presentationTier: (itemData as any).presentationTier,
            presentationRole: (itemData as any).presentationRole,
            threatTier: (itemData as any).threatTier,
            threatRole: (itemData as any).threatRole,
        } as Item;
    };

    // Map inventoryItems to Item[] with data from items.json
    const inventory = useMemo(() => {
        return inventoryItems.map(invItem => {
            return buildDisplayItem(invItem);
        }).filter(Boolean) as Item[];
    }, [inventoryItems]);

    const socialEquippedItems = useMemo(() => {
        const enriched: Partial<Record<EquipmentSlot, Item>> = {};

        (Object.entries(equipmentLoadouts[2] || {}) as [EquipmentSlot, string | undefined][]).forEach(([slot, itemId]) => {
            if (!itemId) return;
            const displayItem = buildDisplayItem({ id: itemId, quantity: 1 });
            if (!displayItem) return;
            enriched[slot] = displayItem;
        });

        return enriched;
    }, [equipmentLoadouts]);

    const combatEquippedItems = useMemo(() => {
        const enriched: Partial<Record<EquipmentSlot, Item>> = {};

        (Object.entries(equippedItems) as [EquipmentSlot, Item | undefined][]).forEach(([slot, item]) => {
            if (!item) return;
            const displayItem = buildDisplayItem({ id: item.id, quantity: item.quantity });
            if (!displayItem) return;
            enriched[slot] = displayItem;
        });

        return enriched;
    }, [equippedItems]);

    const displayedEquippedItems = useMemo(() => {
        return activeEquipmentLoadout === 1 ? combatEquippedItems : socialEquippedItems;
    }, [activeEquipmentLoadout, combatEquippedItems, socialEquippedItems]);

    const totalWeight = useMemo(() => {
        return getCurrentWeight();
    }, [currentWeight, combatEquippedItems, socialEquippedItems, getCurrentWeight]);
    
    const equippedItemForComparison = useMemo(() => {
        if (!selectedItem || !selectedItem.equipmentSlot || rightPanelView !== 'details') {
            return null;
        }
        const source = isSocialEquipment(selectedItem) ? socialEquippedItems : combatEquippedItems;
        return source[selectedItem.equipmentSlot] || null;
    }, [selectedItem, socialEquippedItems, combatEquippedItems, rightPanelView]);

    const isSelectedItemEquipped = useMemo(() => {
        if (!selectedItem) return false;
        return [...Object.values(combatEquippedItems), ...Object.values(socialEquippedItems)]
            .filter((item): item is Item => !!item)
            .some(item => item.id === selectedItem.id);
    }, [selectedItem, combatEquippedItems, socialEquippedItems]);

    const handleSelectItem = (item: Item) => {
        setSelectedItem(item);
        setRightPanelView('details');
    };

    const handleShowEquipment = () => {
        setRightPanelView('equipment');
        setSelectedItem(null);
    };

    const handleAction = (action: 'Equip' | 'Unequip' | 'Use' | 'Drop' | 'UseMax') => {
        if (!selectedItem) return;

        if (action === 'Use') {
            useItem(selectedItem.id);
        } else if (action === 'UseMax') {
            const itemData = itemsData[selectedItem.id as keyof typeof itemsData] as any;
            const hungerPerUse = Number(itemData?.effects?.hunger || 0);
            let remaining = selectedItem.quantity ?? 1;
            while (remaining > 0 && useCharacterStore.getState().hunger < 100 && hungerPerUse > 0) {
                const used = useInventoryStore.getState().useItem(selectedItem.id);
                if (!used) break;
                remaining -= 1;
            }
        } else if (action === 'Drop') {
            if ((selectedItem.quantity ?? 1) > 1) {
                setDropQuantityItem(selectedItem);
                return;
            }
            setDropConfirmItem(selectedItem);
            return;
        } else if (action === 'Equip') {
            equipItem(selectedItem);
        } else if (action === 'Unequip') {
            unequipItem(selectedItem);
        }

        handleShowEquipment();
    };

    const autoEatThreshold = parseInt(getData('auto_eat_threshold') || '0', 10) || 0;

    const handleConfirmSingleDrop = () => {
        if (!dropConfirmItem) return;
        removeItem(dropConfirmItem.id, 1);
        setDropConfirmItem(null);
        handleShowEquipment();
    };

    const handleConfirmQuantityDrop = (quantity: number) => {
        if (!dropQuantityItem || quantity <= 0) {
            setDropQuantityItem(null);
            return;
        }
        removeItem(dropQuantityItem.id, quantity);
        setDropQuantityItem(null);
        handleShowEquipment();
    };
    
    return (
        <>
        <div className="relative w-screen h-screen bg-zinc-950 flex flex-col overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm" style={{ backgroundImage: `url(/assets/backgrounds/minimal_bg.png)` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full h-[7vh] min-h-[56px] px-8 flex justify-between items-center border-b border-zinc-800/50 backdrop-blur-xl shrink-0">
                <button 
                    onClick={() => setScreen('inGame')} 
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all group px-4 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-zinc-800"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-widest uppercase text-[10px]">Resume Game</span>
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-white tracking-[0.3em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                        Inventory
                    </h1>
                </div>
                <div className="relative w-32 flex justify-end">
                    <button
                        onClick={() => setShowAutoEatSettings((prev) => !prev)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all group px-4 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-zinc-800"
                    >
                        <Settings2 size={16} className="group-hover:rotate-12 transition-transform" />
                        <span className="font-bold tracking-widest uppercase text-[10px]">Auto Eat</span>
                    </button>
                    {showAutoEatSettings && (
                        <div className="absolute top-12 right-0 z-30 w-80 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/70 rounded-2xl shadow-2xl p-4 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Auto Ration</p>
                            <p className="text-xs text-zinc-400">
                                Luke will automatically eat from any valid food in his inventory when hunger drops below the selected threshold. This also works while waiting or sleeping.
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={() => setData('auto_eat_threshold', '0')}
                                    className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                        autoEatThreshold === 0
                                            ? 'bg-amber-100 text-black border-amber-100'
                                            : 'bg-zinc-800/40 text-zinc-300 border-zinc-700/50 hover:bg-zinc-700/60'
                                    }`}
                                >
                                    Off
                                </button>
                                {[25, 50, 75].map((threshold) => (
                                    <button
                                        key={threshold}
                                        onClick={() => setData('auto_eat_threshold', String(threshold))}
                                        className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                            autoEatThreshold === threshold
                                                ? 'bg-amber-100 text-black border-amber-100'
                                                : 'bg-amber-950/20 text-amber-300 border-amber-900/30 hover:bg-amber-900/40'
                                        }`}
                                    >
                                        {threshold}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-500">Current hunger: {Math.floor(hunger)}</p>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area - Symmetrical Layout */}
            <div className="relative z-10 w-full h-[86vh] flex flex-col gap-4 p-4 lg:p-6 items-stretch overflow-hidden">
                
                {/* Main Content Grid - Responsive layout with scrollable panels */}
                <div className="w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0">
                    {/* Left Panel: Item List */}
                    <div className="lg:col-span-7 h-full flex flex-col min-h-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="flex-grow bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden flex flex-col h-full">
                            <ItemSelectionPanel
                                title="Your Belongings"
                                items={inventory}
                                onItemSelect={handleSelectItem}
                                selectedItemId={selectedItem?.id}
                                totalWeight={totalWeight}
                                maxWeight={maxWeight}
                                currency={currency}
                            />
                        </div>
                    </div>

                    {/* Right Dynamic Panel */}
                    <div className="lg:col-span-5 h-full flex flex-col min-h-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                       <div className="flex-grow bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden flex flex-col h-full">
                            {rightPanelView === 'equipment' ? (
                                <EquippedGearPanel
                                    equippedItems={displayedEquippedItems}
                                    onItemSelect={handleSelectItem}
                                />
                            ) : (
                                <ItemDetailsPanel
                                    selectedItem={selectedItem}
                                    equippedItem={equippedItemForComparison}
                                    onShowEquipment={handleShowEquipment}
                                    onAction={handleAction}
                                    isEquipped={isSelectedItemEquipped}
                                />
                            )}
                       </div>
                    </div>
                </div>
            </div>

            {/* Bottom Spacer - Critical for clearing LocationNav (7vh to match header) */}
            <div className="h-[7vh] min-h-[56px] shrink-0" />

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
            `}</style>
        </div>
        <ConfirmationModal
            isOpen={Boolean(dropConfirmItem)}
            title="Drop Item"
            message={dropConfirmItem ? `Drop ${dropConfirmItem.name}?` : ''}
            onConfirm={handleConfirmSingleDrop}
            onCancel={() => setDropConfirmItem(null)}
            confirmText="Drop"
            cancelText="Cancel"
        />
        <QuantityModal
            isOpen={Boolean(dropQuantityItem)}
            item={dropQuantityItem}
            maxQuantity={dropQuantityItem?.quantity ?? 1}
            onConfirm={handleConfirmQuantityDrop}
            onCancel={() => setDropQuantityItem(null)}
        />
        </>
    );
};

export default InventoryScreen;

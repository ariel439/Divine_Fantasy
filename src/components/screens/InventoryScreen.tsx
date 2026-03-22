import React, { useState, useMemo } from 'react';
import type { FC } from 'react';
import { Coins, ArrowLeft, Weight } from 'lucide-react';
import type { Item, EquipmentSlot, FilterCategory } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useUIStore } from '../../stores/useUIStore';
import ProgressBar from '../ui/ProgressBar';
import ItemSelectionPanel from '../ui/ItemSelectionPanel';
import EquippedGearPanel from '../ui/EquippedGearPanel';
import ItemDetailsPanel from '../ui/ItemDetailsPanel';
import itemsData from '../../data/items.json';

const InventoryScreen: FC = () => {
    const { setScreen } = useUIStore();
    const { items: inventoryItems, getCurrentWeight, useItem, removeItem } = useInventoryStore();
    const { currency, maxWeight, equippedItems, equipItem, unequipItem } = useCharacterStore();

    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [rightPanelView, setRightPanelView] = useState<'equipment' | 'details'>('equipment');

    const buildDisplayItem = (baseItem: { id: string; quantity?: number }): Item | null => {
        const itemData = itemsData[baseItem.id as keyof typeof itemsData];
        if (!itemData) return null;

        const equipSlot = (itemData as any).equipmentSlot as EquipmentSlot | undefined;
        const iconSrc = (itemData as any).image as string | undefined;

        let category: FilterCategory = 'Misc';
        const itemType = (itemData as any).type as string;

        if (itemType === 'weapon' || itemType === 'armor' || itemType === 'accessory') {
            category = 'Equipment';
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
            actions: equipSlot ? ['Equip', 'Use', 'Drop'] : ['Use', 'Drop'],
            bookId: (itemData as any).bookId,
            equipmentSlot: equipSlot,
            stats: (itemData as any).stats || {}
        } as Item;
    };

    // Map inventoryItems to Item[] with data from items.json
    const inventory = useMemo(() => {
        return inventoryItems.map(invItem => {
            return buildDisplayItem(invItem);
        }).filter(Boolean) as Item[];
    }, [inventoryItems]);

    const enrichedEquippedItems = useMemo(() => {
        const enriched: Partial<Record<EquipmentSlot, Item>> = {};

        (Object.entries(equippedItems) as [EquipmentSlot, Item | undefined][]).forEach(([slot, item]) => {
            if (!item) return;
            const displayItem = buildDisplayItem({ id: item.id, quantity: item.quantity });
            if (!displayItem) return;
            enriched[slot] = displayItem;
        });

        return enriched;
    }, [equippedItems]);

    const totalWeight = useMemo(() => {
        return getCurrentWeight();
    }, [getCurrentWeight]);
    
    const equippedItemForComparison = useMemo(() => {
        if (!selectedItem || !selectedItem.equipmentSlot || rightPanelView !== 'details') {
            return null;
        }
        return enrichedEquippedItems[selectedItem.equipmentSlot] || null;
    }, [selectedItem, enrichedEquippedItems, rightPanelView]);

    const isSelectedItemEquipped = useMemo(() => {
        if (!selectedItem) return false;
        return Object.values(enrichedEquippedItems).filter((item): item is Item => !!item).some(item => item.id === selectedItem.id);
    }, [selectedItem, enrichedEquippedItems]);

    const handleSelectItem = (item: Item) => {
        setSelectedItem(item);
        setRightPanelView('details');
    };

    const handleShowEquipment = () => {
        setRightPanelView('equipment');
        setSelectedItem(null);
    };

    const handleAction = (action: 'Equip' | 'Unequip' | 'Use' | 'Drop') => {
        if (!selectedItem) return;

        if (action === 'Use') {
            useItem(selectedItem.id);
        } else if (action === 'Drop') {
            removeItem(selectedItem.id, 1);
        } else if (action === 'Equip') {
            equipItem(selectedItem);
        } else if (action === 'Unequip') {
            unequipItem(selectedItem);
        }

        handleShowEquipment();
    };
    
    return (
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
                <div className="w-32"></div>
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
                                    equippedItems={enrichedEquippedItems}
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
    );
};

export default InventoryScreen;

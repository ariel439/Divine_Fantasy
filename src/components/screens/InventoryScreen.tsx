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

    // Map inventoryItems to Item[] with data from items.json
    const inventory = useMemo(() => {
        return inventoryItems.map(invItem => {
            const itemData = itemsData[invItem.id as keyof typeof itemsData];
            if (!itemData) return null;
            const equipSlot = (itemData as any).equipmentSlot as EquipmentSlot | undefined;
            const iconSrc = (itemData as any).image as string | undefined;
            
            // Map JSON types to FilterCategory
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
                id: invItem.id,
                name: itemData.name,
                description: itemData.description,
                icon: iconSrc ? (<img src={iconSrc} alt={itemData.name} className="w-6 h-6" />) : undefined,
                category: category, 
                type: itemType, // Keep original type for other checks
                weight: itemData.weight,
                base_value: itemData.base_value,
                quantity: invItem.quantity,
                stackable: itemData.stackable,
                effects: (itemData as any).effects,
                actions: (('equipmentSlot' in itemData) && (itemData as any).equipmentSlot) ? ['Equip', 'Use', 'Drop'] : ['Use', 'Drop'],
                equipmentSlot: equipSlot,
                stats: (itemData as any).stats || {}
            } as Item;
        }).filter(Boolean) as Item[];
    }, [inventoryItems]);

    const totalWeight = useMemo(() => {
        return getCurrentWeight();
    }, [getCurrentWeight]);
    
    const equippedItemForComparison = useMemo(() => {
        if (!selectedItem || !selectedItem.equipmentSlot || rightPanelView !== 'details') {
            return null;
        }
        return equippedItems[selectedItem.equipmentSlot] || null;
    }, [selectedItem, equippedItems, rightPanelView]);

    const isSelectedItemEquipped = useMemo(() => {
        if (!selectedItem) return false;
        return Object.values(equippedItems).filter((item): item is Item => !!item).some(item => item.id === selectedItem.id);
    }, [selectedItem, equippedItems]);

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
        <div className="relative w-full h-full min-h-screen bg-zinc-950 flex flex-col items-center overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm" style={{ backgroundImage: `url(/assets/backgrounds/minimal_bg.png)` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full px-8 py-6 flex justify-between items-center border-b border-zinc-800/50 backdrop-blur-xl shrink-0">
                <button 
                    onClick={() => setScreen('inGame')} 
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all group px-4 py-2 rounded-full hover:bg-white/5 border border-transparent hover:border-zinc-800"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-widest uppercase text-xs">Resume Game</span>
                </button>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white tracking-[0.3em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                        Inventory
                    </h1>
                </div>
                <div className="w-32"></div>
            </header>

            {/* Main Content Area */}
            <div className="relative z-10 w-full flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="max-w-[1600px] mx-auto w-full min-h-full flex flex-col gap-6 p-8 lg:p-12 lg:pb-32 items-start">
                    
                    {/* Top Stats Bar */}
                    <div className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 p-6 bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl animate-fade-in-up">
                        <div className="flex items-center gap-4 w-full md:w-1/3 lg:w-1/4">
                            <div className="p-3 bg-zinc-800 rounded-xl text-zinc-400">
                                <Weight size={24} />
                            </div>
                            <div className="flex-grow">
                                <ProgressBar label="Carrying Capacity" value={Number(totalWeight.toFixed(1))} max={maxWeight} colorClass="bg-orange-500/80" variant="weight" />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-around md:justify-end gap-8 text-xl border-t md:border-t-0 md:border-l border-zinc-800/50 pt-4 md:pt-0 md:pl-8">
                            <div className="flex flex-col items-center md:items-end gap-1 group" title="Gold">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-white group-hover:text-yellow-400 transition-colors">{currency.gold}</span>
                                    <Coins size={20} className="text-yellow-500 shadow-yellow-500/50" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500">Gold Sovereigns</span>
                            </div>
                            <div className="flex flex-col items-center md:items-end gap-1 group" title="Silver">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-white group-hover:text-zinc-300 transition-colors">{currency.silver}</span>
                                    <Coins size={20} className="text-zinc-400 shadow-zinc-400/50" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500">Silver Shillings</span>
                            </div>
                            <div className="flex flex-col items-center md:items-end gap-1 group" title="Copper">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-white group-hover:text-orange-400 transition-colors">{currency.copper}</span>
                                    <Coins size={20} className="text-orange-600 shadow-orange-600/50" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500">Copper Pennies</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Panel: Item List */}
                        <div className="lg:col-span-7 h-[700px] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <div className="h-full bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden">
                                <ItemSelectionPanel
                                    title="Your Belongings"
                                    items={inventory}
                                    onItemSelect={handleSelectItem}
                                    selectedItemId={selectedItem?.id}
                                />
                            </div>
                        </div>

                        {/* Right Dynamic Panel */}
                        <div className="lg:col-span-5 h-[700px] animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                           <div className="h-full bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl overflow-hidden">
                                {rightPanelView === 'equipment' ? (
                                    <EquippedGearPanel
                                        equippedItems={equippedItems}
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
            </div>

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

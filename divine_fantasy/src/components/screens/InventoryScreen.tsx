import React, { useState, useMemo, ReactElement } from 'react';
import type { FC } from 'react';
import { Coins } from 'lucide-react';
import type { Item, EquipmentSlot } from '../../types';
import { mockInventory, mockEquippedItems } from '../../data';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useUIStore } from '../../stores/useUIStore';
import ProgressBar from '../ui/ProgressBar';
import ItemSelectionPanel from '../ui/ItemSelectionPanel';
import EquippedGearPanel from '../ui/EquippedGearPanel';
import ItemDetailsPanel from '../ui/ItemDetailsPanel';
import LocationNav from '../LocationNav';
import itemsData from '../../data/items.json';

const InventoryScreen: FC = () => {
    const { items: inventoryItems, getCurrentWeight, getItemQuantity, useItem, removeItem } = useInventoryStore();
    const { currency, maxWeight } = useCharacterStore();

    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [rightPanelView, setRightPanelView] = useState<'equipment' | 'details'>('equipment');

    // Map inventoryItems to Item[] with data from items.json
    const inventory = useMemo(() => {
        return inventoryItems.map(invItem => {
            const itemData = itemsData[invItem.id as keyof typeof itemsData];
            if (!itemData) return null;
            return {
                id: invItem.id,
                name: itemData.name,
                description: itemData.description,
                icon: <div>Icon</div>, // TODO: Add proper icons
                category: itemData.type as any, // TODO: Map to proper categories
                weight: itemData.weight,
                value: itemData.base_value,
                quantity: invItem.quantity,
                stackable: itemData.stackable,
                effects: (itemData as any).effects,
                actions: ['Use', 'Drop'], // TODO: Add equip if applicable
                equipmentSlot: (itemData as any).equip_slot as any,
                stats: {} // TODO: Add stats if applicable
            } as Item;
        }).filter(Boolean) as Item[];
    }, [inventoryItems]);

    // TODO: Implement equipped items store
    const equippedItems = useMemo(() => ({} as Partial<Record<EquipmentSlot, Item>>), []);

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
        // FIX: Filter out undefined items to ensure type safety before accessing properties.
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
        } else if (action === 'Equip' || action === 'Unequip') {
            // TODO: Implement equip/unequip with store
            console.log(`${action} ${selectedItem.name}`);
        }

        handleShowEquipment();
    };
    
    const handleNavigate = (screen: any) => {
        const { setScreen } = useUIStore.getState();
        setScreen(screen);
    };

    const handleOpenSleepWaitModal = (mode: 'sleep' | 'wait') => {
        // TODO: Implement sleep/wait modal
        console.log('Open sleep/wait modal:', mode);
    };

    const handleOpenOptionsModal = () => {
        // TODO: Implement options modal
        console.log('Open options modal');
    };

    const handleOpenSaveLoadModal = () => {
        // TODO: Implement save/load modal
        console.log('Open save/load modal');
    };

    return (
        <>
            <div className="w-full h-full p-6 pt-10 pb-20 flex flex-col">
                <div className="w-full max-w-screen-2xl mx-auto flex flex-col flex-grow min-h-0">
                    {/* Header Section */}
                    <header className="mb-6 flex-shrink-0">
                        <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Inventory</h1>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-4 bg-black/20 rounded-lg border border-zinc-800">
                            <div className="w-full md:w-1/3 lg:w-1/4">
                                 <ProgressBar label="Weight" value={Number(totalWeight.toFixed(1))} max={maxWeight} colorClass="bg-orange-500" variant="weight" />
                            </div>
                            <div className="flex items-center gap-6 text-lg">
                                <div className="flex items-center gap-2" title="Gold"><Coins size={20} className="text-yellow-400" /> <span>{currency.gold}</span></div>
                                <div className="flex items-center gap-2" title="Silver"><Coins size={20} className="text-gray-400" /> <span>{currency.silver}</span></div>
                                <div className="flex items-center gap-2" title="Copper"><Coins size={20} className="text-orange-400" /> <span>{currency.copper}</span></div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-8 gap-6 flex-grow min-h-0">
                        {/* Left Panel: Item List */}
                        <div className="lg:col-span-5 min-h-0">
                            <ItemSelectionPanel
                                title="Your Belongings"
                                items={inventory}
                                onItemSelect={handleSelectItem}
                                selectedItemId={selectedItem?.id}
                            />
                        </div>

                        {/* Right Dynamic Panel */}
                        <div className="lg:col-span-3 min-h-0">
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


        </>
    );
};

export default InventoryScreen;
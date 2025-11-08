import React, { ReactElement } from 'react';
import type { FC, ReactNode } from 'react';
// FIX: Replaced non-existent 'Ring' icon with 'Radio' as 'Ring' is not an exported member of 'lucide-react'.
import { Shield, Sword, HardHat, Shirt, Hand, Footprints, Gem, Radio, Ribbon, SplitSquareHorizontal } from 'lucide-react';
import type { Item, EquipmentSlot } from '../../types';

interface EquippedGearPanelProps {
    equippedItems: Partial<Record<EquipmentSlot, Item>>;
    onItemSelect: (item: Item) => void;
}

const Slot: FC<{
    slot: EquipmentSlot;
    item: Item | undefined;
    placeholder: ReactNode;
    onItemSelect: (item: Item) => void;
}> = ({ slot, item, placeholder, onItemSelect }) => {
    
    const Component = item ? 'button' : 'div';
    const handleClick = () => {
        if (item) {
            onItemSelect(item);
        }
    };

    return (
        <Component 
            onClick={handleClick}
            className={`relative w-20 h-20 md:w-24 md:h-24 bg-black/30 border border-zinc-700 rounded-lg flex items-center justify-center transition-all duration-200 ${item ? 'cursor-pointer hover:bg-zinc-700/80 hover:border-zinc-500' : ''}`}
            title={item ? item.name : slot.charAt(0).toUpperCase() + slot.slice(1)}
        >
            {/* FIX: Provided a more specific type assertion to React.cloneElement to ensure the `size` prop is recognized. */}
            {item ? React.cloneElement(item.icon as ReactElement<{ size: number }>, { size: 32 }) : placeholder}
        </Component>
    );
};


const EquippedGearPanel: FC<EquippedGearPanelProps> = ({ equippedItems, onItemSelect }) => {
    const EmptySlot = () => <div className="w-20 h-20 md:w-24 md:h-24" />;

    const slots: { slot: EquipmentSlot, placeholder: ReactNode }[] = [
        { slot: 'head', placeholder: <HardHat size={32} className="text-zinc-600" /> },
        { slot: 'cape', placeholder: <Ribbon size={32} className="text-zinc-600" /> },
        { slot: 'amulet', placeholder: <Gem size={32} className="text-zinc-600" /> },
        { slot: 'weapon', placeholder: <Sword size={32} className="text-zinc-600" /> },
        { slot: 'chest', placeholder: <Shirt size={32} className="text-zinc-600" /> },
        { slot: 'shield', placeholder: <Shield size={32} className="text-zinc-600" /> },
        { slot: 'legs', placeholder: <SplitSquareHorizontal size={32} className="text-zinc-600" /> },
        { slot: 'gloves', placeholder: <Hand size={32} className="text-zinc-600" /> },
        { slot: 'boots', placeholder: <Footprints size={32} className="text-zinc-600" /> },
        { slot: 'ring', placeholder: <Radio size={32} className="text-zinc-600" /> },
    ];

    const getSlot = (slotName: EquipmentSlot) => {
        const slotConfig = slots.find(s => s.slot === slotName)!;
        return <Slot 
            slot={slotName}
            item={equippedItems[slotName]}
            placeholder={slotConfig.placeholder}
            onItemSelect={onItemSelect}
        />;
    };


    return (
        <div className="bg-black/20 rounded-lg border border-zinc-800 p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold text-white mb-4 text-center flex-shrink-0" style={{ fontFamily: 'Cinzel, serif' }}>Equipped</h2>
            <div className="flex-grow flex items-center justify-center">
                <div className="grid grid-cols-3 gap-x-4 gap-y-2 justify-items-center">
                    {/* Row 1 */}
                    <EmptySlot />
                    {getSlot('head')}
                    <EmptySlot />

                    {/* Row 2 */}
                    {getSlot('cape')}
                    {getSlot('amulet')}
                    <EmptySlot />

                    {/* Row 3 */}
                    {getSlot('weapon')}
                    {getSlot('chest')}
                    {getSlot('shield')}

                    {/* Row 4 */}
                    <EmptySlot />
                    {getSlot('legs')}
                    <EmptySlot />

                    {/* Row 5 */}
                    {getSlot('gloves')}
                    {getSlot('boots')}
                    {getSlot('ring')}
                 </div>
            </div>
        </div>
    );
};

export default EquippedGearPanel;
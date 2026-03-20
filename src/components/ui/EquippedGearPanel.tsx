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
            className={`relative w-20 h-20 md:w-24 md:h-24 bg-black/40 border border-zinc-800 rounded-2xl flex items-center justify-center transition-all duration-300 group ${item ? 'cursor-pointer hover:bg-zinc-100 hover:border-white shadow-xl' : 'hover:border-zinc-700'}`}
            title={item ? item.name : slot.charAt(0).toUpperCase() + slot.slice(1)}
        >
            {item ? (
                <div className="text-zinc-100 group-hover:text-black transition-colors">
                    {(() => {
                        const iconEl = item.icon as ReactElement<any> | undefined;
                        if (iconEl && typeof iconEl.type === 'string' && iconEl.type === 'img') {
                            const src = (iconEl.props && (iconEl.props as any).src) || '';
                            const alt = (iconEl.props && (iconEl.props as any).alt) || item.name;
                            return <img src={src} alt={alt} className="w-10 h-10 object-contain rounded transition-transform group-hover:scale-110" />;
                        }
                        return iconEl ? React.cloneElement(iconEl, { size: 36 }) : null;
                    })()}
                </div>
            ) : (
                <div className="opacity-20 group-hover:opacity-40 transition-opacity">
                    {placeholder}
                </div>
            )}
            
            {/* Slot Label */}
            <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border transition-all ${item ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}>
                {slot}
            </span>
        </Component>
    );
};


const EquippedGearPanel: FC<EquippedGearPanelProps> = ({ equippedItems, onItemSelect }) => {
    const EmptySlot = () => <div className="w-20 h-20 md:w-24 md:h-24" />;

    const slots: { slot: EquipmentSlot, placeholder: ReactNode }[] = [
        { slot: 'head', placeholder: <HardHat size={32} /> },
        { slot: 'cape', placeholder: <Ribbon size={32} /> },
        { slot: 'amulet', placeholder: <Gem size={32} /> },
        { slot: 'weapon', placeholder: <Sword size={32} /> },
        { slot: 'chest', placeholder: <Shirt size={32} /> },
        { slot: 'shield', placeholder: <Shield size={32} /> },
        { slot: 'legs', placeholder: <SplitSquareHorizontal size={32} /> },
        { slot: 'gloves', placeholder: <Hand size={32} /> },
        { slot: 'boots', placeholder: <Footprints size={32} /> },
        { slot: 'ring', placeholder: <Radio size={32} /> },
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
        <div className="bg-transparent flex flex-col h-full p-6">
            <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-[0.2em] mb-8 text-center flex-shrink-0" style={{ fontFamily: 'Cinzel, serif' }}>Equipped Gear</h2>
            <div className="flex-grow flex items-center justify-center">
                <div className="grid grid-cols-3 gap-x-6 gap-y-8 justify-items-center">
                    {/* Row 1 */}
                    <EmptySlot />
                    {getSlot('head')}
                    <EmptySlot />

                    {/* Row 2 */}
                    {getSlot('cape')}
                    {getSlot('amulet')}
                    {getSlot('ring')}

                    {/* Row 3 */}
                    {getSlot('weapon')}
                    {getSlot('chest')}
                    {getSlot('shield')}

                    {/* Row 4 */}
                    {getSlot('gloves')}
                    {getSlot('legs')}
                    {getSlot('boots')}
                 </div>
            </div>
        </div>
    );
};

export default EquippedGearPanel;

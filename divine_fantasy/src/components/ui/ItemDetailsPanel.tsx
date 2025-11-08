// FIX: Imported `useMemo` to resolve "Cannot find name 'useMemo'" error.
import React, { ReactElement, useMemo } from 'react';
import type { FC } from 'react';
import { User, ChevronLeft } from 'lucide-react';
import type { Item } from '../../types';

interface ItemDetailsPanelProps {
    selectedItem: Item | null;
    equippedItem: Item | null;
    onShowEquipment: () => void;
    onAction: (action: 'Equip' | 'Unequip') => void;
    isEquipped: boolean;
}

const StatComparisonRow: FC<{ label: string, selectedValue?: number, equippedValue?: number }> = ({ label, selectedValue = 0, equippedValue = 0 }) => {
    const diff = selectedValue - equippedValue;
    let diffColor = 'text-zinc-400';
    let diffSign = '';
    if (diff > 0) {
        diffColor = 'text-green-400';
        diffSign = '+';
    } else if (diff < 0) {
        diffColor = 'text-red-400';
    }

    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-300">{label}</span>
            <div className="flex items-center gap-3 font-mono">
                <span className="text-zinc-100 w-8 text-center">{selectedValue}</span>
                <span className={`w-12 text-center font-bold ${diffColor}`}>({diffSign}{diff})</span>
            </div>
        </div>
    )
};

const ItemDetailsPanel: FC<ItemDetailsPanelProps> = ({ selectedItem, equippedItem, onShowEquipment, onAction, isEquipped }) => {
    
    if (!selectedItem) {
        return (
            <div className="bg-black/20 rounded-lg border border-zinc-800 p-4 flex flex-col h-full items-center justify-center text-center text-zinc-500">
                <p>Select an item to see details</p>
            </div>
        );
    }
    
    const isComparing = selectedItem.equipmentSlot && equippedItem && !isEquipped;
    const allStatKeys = useMemo(() => {
        const keys = new Set<string>();
        if (selectedItem?.stats) Object.keys(selectedItem.stats).forEach(k => keys.add(k));
        if (equippedItem?.stats) Object.keys(equippedItem.stats).forEach(k => keys.add(k));
        return Array.from(keys);
    }, [selectedItem, equippedItem]);

    const renderActions = () => {
        const actionsToShow = [...selectedItem.actions];
        if (selectedItem.equipmentSlot) {
            const equipIndex = actionsToShow.indexOf('Equip');
            if (equipIndex !== -1) {
                actionsToShow.splice(equipIndex, 1); // Remove generic 'Equip'
            }
        }
        
        return (
            <>
                {selectedItem.equipmentSlot && (
                    <button 
                        onClick={() => onAction(isEquipped ? 'Unequip' : 'Equip')} 
                        className="w-full text-center p-2.5 bg-zinc-700/80 border border-zinc-600 rounded-lg transition-all hover:bg-zinc-600 hover:border-zinc-500 font-semibold"
                    >
                        {isEquipped ? 'Unequip' : 'Equip'}
                    </button>
                )}
                {actionsToShow.map(action => (
                    <button key={action} className="w-full text-center p-2.5 bg-zinc-800/60 border border-zinc-700 rounded-lg transition-all hover:bg-zinc-700/80">
                        {action}
                    </button>
                ))}
            </>
        )
    };

    return (
        <div className="bg-black/20 rounded-lg border border-zinc-800 p-4 flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="text-center border-b border-zinc-700 pb-4 mb-4 relative">
                <button onClick={onShowEquipment} className="absolute -top-2 left-0 flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors">
                    <ChevronLeft size={16} /> Show Equipment
                </button>
                <div className="mx-auto w-24 h-24 bg-black/30 rounded-lg flex items-center justify-center p-4 border border-zinc-700 mt-6">
                    {/* FIX: Provided a more specific type assertion to React.cloneElement to ensure the `size` prop is recognized. */}
                    {React.cloneElement(selectedItem.icon as ReactElement<{ size: number }>, { size: 56 })}
                </div>
                <h2 className="text-2xl font-bold mt-3 text-white" style={{ fontFamily: 'Cinzel, serif' }}>{selectedItem.name}</h2>
            </div>
            
            {/* Main Details */}
            <div className="space-y-4 text-sm flex-grow">
                <p className="text-zinc-400 italic leading-relaxed text-base">{selectedItem.description}</p>
                
                <div className="bg-white/5 p-3 rounded-md space-y-2">
                    <div className="flex justify-between"><span className="text-zinc-300">Category:</span> <span className="font-semibold">{selectedItem.category}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-300">Weight:</span> <span className="font-semibold">{selectedItem.weight.toFixed(1)} kg</span></div>
                    <div className="flex justify-between"><span className="text-zinc-300">Value:</span> <span className="font-semibold">{selectedItem.value}c</span></div>
                    {selectedItem.effects && Object.entries(selectedItem.effects).map(([key, value]) => (
                        <div key={key} className="flex justify-between"><span className="text-green-400">{key}:</span> <span className="font-semibold text-green-300">{value}</span></div>
                    ))}
                </div>

                {isComparing && (
                    <div className="bg-white/5 p-3 rounded-md space-y-2">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-zinc-300 text-base">Comparison vs. {equippedItem.name}</h3>
                            <div className="flex items-center gap-3 text-xs">
                                <span className="text-zinc-100 w-8 text-center font-bold">New</span>
                                <span className="text-zinc-400 w-12 text-center font-bold">Change</span>
                            </div>
                        </div>
                        {allStatKeys.map(key => (
                           <StatComparisonRow 
                             key={key}
                             label={key}
                             selectedValue={selectedItem.stats?.[key]}
                             equippedValue={equippedItem.stats?.[key]}
                           />
                        ))}
                    </div>
                )}
            </div>
            
            {/* Actions */}
            <div className="mt-auto pt-4 space-y-2">
                {renderActions()}
            </div>
        </div>
    );
};

export default ItemDetailsPanel;
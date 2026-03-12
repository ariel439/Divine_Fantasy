// FIX: Imported `useMemo` to resolve "Cannot find name 'useMemo'" error.
import React, { ReactElement, useMemo } from 'react';
import type { FC } from 'react';
import { User, ChevronLeft } from 'lucide-react';
import type { Item } from '../../types';

interface ItemDetailsPanelProps {
    selectedItem: Item | null;
    equippedItem: Item | null;
    onShowEquipment: () => void;
    onAction: (action: 'Equip' | 'Unequip' | 'Use' | 'Drop') => void;
    isEquipped: boolean;
}

const StatComparisonRow: FC<{ label: string, selectedValue?: number, equippedValue?: number }> = ({ label, selectedValue = 0, equippedValue = 0 }) => {
    const diff = selectedValue - equippedValue;
    let diffColor = 'text-zinc-500';
    let diffSign = '';
    if (diff > 0) {
        diffColor = 'text-emerald-400';
        diffSign = '+';
    } else if (diff < 0) {
        diffColor = 'text-rose-400';
    }

    return (
        <div className="flex justify-between items-center py-2 border-b border-zinc-800/30 last:border-0 group/stat">
            <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest group-hover/stat:text-zinc-200 transition-colors">{label}</span>
            <div className="flex items-center gap-4 font-mono">
                <span className="text-zinc-100 font-black">{selectedValue}</span>
                {diff !== 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-black/40 border border-zinc-800/50 ${diffColor}`}>
                        {diffSign}{diff}
                    </span>
                )}
            </div>
        </div>
    )
};

const ItemDetailsPanel: FC<ItemDetailsPanelProps> = ({ selectedItem, equippedItem, onShowEquipment, onAction, isEquipped }) => {
    
    if (!selectedItem) {
        return (
            <div className="bg-transparent flex flex-col h-full items-center justify-center text-center p-12">
                <div className="w-24 h-24 bg-black/40 rounded-full flex items-center justify-center border border-zinc-800 mb-6 opacity-20">
                    <User size={48} className="text-zinc-400" />
                </div>
                <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-xs">No Item Selected</p>
                <p className="text-zinc-600 text-sm mt-2 max-w-[200px]">Inspect your belongings to view their properties here.</p>
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
                actionsToShow.splice(equipIndex, 1);
            }
        }
        
        return (
            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-zinc-800/50">
                {selectedItem.equipmentSlot && (
                    <button 
                        onClick={() => onAction(isEquipped ? 'Unequip' : 'Equip')} 
                        className="col-span-2 py-4 bg-white text-black font-black uppercase tracking-[0.3em] text-sm rounded-xl transition-all hover:bg-zinc-200 active:scale-95 shadow-xl"
                    >
                        {isEquipped ? 'Unequip' : 'Equip Gear'}
                    </button>
                )}
                {actionsToShow.map(action => (
                    <button 
                        key={action} 
                        onClick={() => onAction(action as 'Equip' | 'Unequip' | 'Use' | 'Drop')}
                        className={`py-3 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all border border-zinc-800/50 active:scale-95 ${
                            action === 'Drop' 
                            ? 'bg-rose-950/20 text-rose-500 hover:bg-rose-900/40 border-rose-900/30' 
                            : 'bg-zinc-800/40 text-zinc-300 hover:bg-zinc-700/60'
                        }`}
                    >
                        {action}
                    </button>
                ))}
            </div>
        )
    };

    return (
        <div className="bg-transparent flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-6 border-b border-zinc-800/50 relative bg-black/20">
                <button 
                    onClick={onShowEquipment} 
                    className="absolute top-6 left-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all group"
                >
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Loadout
                </button>
                
                <div className="mt-8 flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 bg-black/60 rounded-2xl flex items-center justify-center p-6 border border-zinc-800/50 shadow-inner group-hover:border-zinc-600 transition-colors">
                            {(() => {
                                const iconEl = selectedItem.icon as ReactElement<any> | undefined;
                                if (iconEl && typeof iconEl.type === 'string' && iconEl.type === 'img') {
                                    const src = (iconEl.props && (iconEl.props as any).src) || '';
                                    const alt = (iconEl.props && (iconEl.props as any).alt) || selectedItem.name;
                                    return <img src={src} alt={alt} className="w-24 h-24 object-contain rounded transition-transform group-hover:scale-110"/>;
                                }
                                return iconEl ? React.cloneElement(iconEl, { size: 64, className: 'text-zinc-100 transition-transform group-hover:scale-110' }) : null;
                            })()}
                        </div>
                        {isEquipped && (
                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-black px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-lg">
                                Equipped
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center mt-6">
                        <h2 className="text-2xl font-bold text-white tracking-tight leading-none" style={{ fontFamily: 'Cinzel, serif' }}>{selectedItem.name}</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-2">{selectedItem.category} Identification</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-8 pt-6 space-y-8">
                {/* Description */}
                <div>
                    <p className="text-zinc-400 text-sm leading-relaxed font-medium italic">
                        "{selectedItem.description}"
                    </p>
                </div>

                {/* Vitals / Stats */}
                <div className="space-y-4 bg-black/20 rounded-2xl border border-zinc-800/30 p-6">
                    <div className="grid grid-cols-2 gap-6 pb-4 border-b border-zinc-800/50">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">Mass</p>
                            <p className="text-lg font-black text-zinc-200">{selectedItem.weight.toFixed(1)} <span className="text-xs text-zinc-500">kg</span></p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">Market Value</p>
                            <p className="text-lg font-black text-zinc-200">{selectedItem.base_value} <span className="text-xs text-zinc-500">c</span></p>
                        </div>
                    </div>

                    {allStatKeys.length > 0 && (
                        <div className="pt-2">
                            <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500/60 mb-4">Functional Analysis</p>
                            <div className="space-y-1">
                                {allStatKeys.map(key => (
                                    <StatComparisonRow 
                                        key={key}
                                        label={key}
                                        selectedValue={selectedItem.stats?.[key]}
                                        equippedValue={equippedItem?.stats?.[key]}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedItem.effects && Object.keys(selectedItem.effects).length > 0 && (
                        <div className="pt-2">
                            <p className="text-[8px] font-black uppercase tracking-widest text-sky-500/60 mb-4">Chemical Properties</p>
                            <div className="space-y-3">
                                {Object.entries(selectedItem.effects).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center bg-sky-950/10 border border-sky-900/20 p-2 rounded-lg">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">{key}</span>
                                        <span className="text-xs font-black text-sky-100">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {renderActions()}
            </div>
        </div>
    );
};

export default ItemDetailsPanel;

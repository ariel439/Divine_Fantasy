import React, { useState, useMemo } from 'react';
import type { FC } from 'react';
import { Search } from 'lucide-react';
import type { Item, FilterCategory } from '../../types';

interface ItemSelectionPanelProps {
    title: string;
    items: Item[];
    onItemSelect: (item: Item) => void;
    selectedItemId?: string | null;
    highlightedItemIds?: Set<string>;
    valueMultiplier?: number; // Added value multiplier prop
    acceptedCategories?: string[]; // Optional: restrict which items can be selected
}

const ItemSelectionPanel: FC<ItemSelectionPanelProps> = ({ title, items, onItemSelect, selectedItemId, highlightedItemIds, valueMultiplier = 1.0, acceptedCategories }) => {
    const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
    const [searchTerm, setSearchTerm] = useState('');

    const isItemAccepted = (item: Item) => {
        if (!acceptedCategories) return true;
        const itemType = item.type || (item.category ? item.category.toLowerCase() : 'misc');
        return acceptedCategories.some(cat => 
            cat.toLowerCase() === itemType.toLowerCase() || 
            (item.category && cat.toLowerCase() === item.category.toLowerCase())
        );
    };

    const filteredItems = useMemo(() => {
        let filtered = items;
        if (activeFilter !== 'All') {
            filtered = filtered.filter(item => item.category === activeFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [items, activeFilter, searchTerm]);

    const filterTabs: FilterCategory[] = ['All', 'Equipment', 'Resource', 'Consumable', 'Tool', 'Quest'];

    const getRowClass = (item: Item) => {
        const accepted = isItemAccepted(item);
        if (!accepted) return 'opacity-40 cursor-not-allowed grayscale';

        if (highlightedItemIds?.has(item.uuid || item.id)) {
            return 'bg-zinc-700/40 font-bold text-white border-l-4 border-zinc-400 shadow-inner';
        }
        if (selectedItemId === (item.uuid || item.id)) {
            return 'bg-zinc-100 text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.1)]';
        }
        return 'hover:bg-white/5 text-zinc-400 hover:text-white transition-all';
    };

    return (
        <div className="bg-transparent flex flex-col h-full overflow-hidden">
            <div className="p-6 pb-0 flex-shrink-0">
                <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-[0.2em] mb-4" style={{ fontFamily: 'Cinzel, serif' }}>{title}</h2>
                
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-zinc-800/50 mb-4 overflow-x-auto no-scrollbar">
                    {filterTabs.map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveFilter(tab)} 
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg whitespace-nowrap ${
                                activeFilter === tab 
                                ? 'bg-zinc-100 text-black shadow-lg' 
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <input 
                        type="text"
                        placeholder="Search belongings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800/50 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-300 focus:ring-2 focus:ring-zinc-700 focus:border-zinc-600 outline-none transition-all placeholder:text-zinc-600 font-medium"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 rounded-lg text-zinc-500">
                        <Search size={16} />
                    </div>
                </div>

                {/* Header Row */}
                <div className="flex justify-between items-center px-4 py-2 text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] border-b border-zinc-800/50">
                    <span className="w-3/5">Identification</span>
                    <span className="w-1/5 text-right">Mass</span>
                    <span className="w-1/5 text-right">Value</span>
                </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 pt-2 space-y-1">
                {filteredItems.map(item => {
                    const accepted = isItemAccepted(item);
                    return (
                    <button 
                        key={item.uuid || item.id} 
                        onClick={() => accepted && onItemSelect(item)}
                        disabled={!accepted}
                        className={`w-full flex justify-between items-center p-3 rounded-xl text-sm group ${getRowClass(item)}`}
                    >
                        <div className="flex items-center gap-4 w-3/5">
                            <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center bg-black/60 rounded-xl border border-zinc-800/50 group-hover:border-zinc-700 transition-colors ${!accepted ? 'opacity-50' : ''}`}>
                                {item.icon || ((itemsData as any)[item.id]?.image ? <img src={(itemsData as any)[item.id].image} alt={item.name} className="w-7 h-7 object-contain" /> : null)}
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="truncate font-bold tracking-tight">{item.name}</span>
                                <span className="text-[10px] uppercase font-black tracking-tighter opacity-50">{item.category}</span>
                            </div>
                        </div>
                        <div className="w-1/5 text-right font-mono text-xs opacity-70">
                            {item.weight.toFixed(1)}kg
                        </div>
                        <div className="w-1/5 text-right font-black text-zinc-100">
                            {Math.floor(item.base_value * valueMultiplier)}c
                        </div>
                    </button>
                    );
                })}
                {filteredItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">No items found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemSelectionPanel;
import itemsData from '../../data/items.json';

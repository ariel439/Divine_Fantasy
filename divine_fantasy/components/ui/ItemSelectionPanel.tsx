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
}

const ItemSelectionPanel: FC<ItemSelectionPanelProps> = ({ title, items, onItemSelect, selectedItemId, highlightedItemIds }) => {
    const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
    const [searchTerm, setSearchTerm] = useState('');

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
        if (highlightedItemIds?.has(item.id)) {
            return 'bg-zinc-700/60 font-semibold text-white border-l-4 border-zinc-400';
        }
        if (selectedItemId === item.id) {
            return 'bg-zinc-700/50 font-semibold text-white';
        }
        return 'hover:bg-white/5 text-zinc-300';
    };

    return (
        <div className="bg-black/20 rounded-lg border border-zinc-800 p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold text-white mb-2 flex-shrink-0" style={{ fontFamily: 'Cinzel, serif' }}>{title}</h2>
            {/* Filter Tabs */}
            <div className="flex-shrink-0 flex items-center gap-2 border-b-2 border-zinc-800 flex-wrap pb-2">
                {filterTabs.map(tab => (
                    <button key={tab} onClick={() => setActiveFilter(tab)} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeFilter === tab ? 'text-white border-b-2 border-zinc-300 -mb-px' : 'text-zinc-400 hover:text-white'}`}>
                        {tab}
                    </button>
                ))}
            </div>
            {/* Search Bar */}
            <div className="relative my-2 flex-shrink-0">
                <input 
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/30 border border-zinc-700 rounded-md py-2 pl-4 pr-10 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition"
                />
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>
            {/* Header Row */}
            <div className="flex-shrink-0 flex justify-between items-center px-3 py-1 text-xs text-zinc-400 font-bold uppercase tracking-wider">
                <span className="w-3/5">Item</span>
                <span className="w-1/5 text-right">Weight</span>
                <span className="w-1/5 text-right">Value</span>
            </div>
            {/* List */}
            <div className="overflow-y-auto flex-grow custom-scrollbar pr-2 space-y-1">
                {filteredItems.map(item => (
                    <button 
                        key={item.id} 
                        onClick={() => onItemSelect(item)}
                        className={`w-full flex justify-between items-center p-2 rounded-lg transition-colors text-sm ${getRowClass(item)}`}
                    >
                        <div className="flex items-center gap-3 w-3/5">
                            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-black/40 rounded-md border border-zinc-700">
                                {item.icon}
                            </div>
                            <span className="truncate">{item.name}</span>
                            {item.stackable && item.quantity && item.quantity > 1 && <span className="text-xs text-zinc-400">({item.quantity})</span>}
                        </div>
                        <span className="text-right w-1/5">{item.weight.toFixed(1)}</span>
                        <span className="text-right w-1/5 text-yellow-300/90">{item.value}c</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ItemSelectionPanel;
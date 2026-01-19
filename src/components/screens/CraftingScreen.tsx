

import React, { useState, useMemo, useEffect, ReactNode, ReactElement } from 'react';
import type { FC } from 'react';
import { X, Search, CookingPot, Hammer, Clock, Zap, Minus, Plus, Coins } from 'lucide-react';
import { mockRecipes } from '../../data';
import type { Recipe, Item, CraftingSkill } from '../../types';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import itemsData from '../../data/items.json';

interface CraftingScreenProps {
  onClose: () => void;
  initialSkill: CraftingSkill | null;
  onStartCrafting: (recipe: Recipe, quantity: number) => void;
}

const formatDuration = (totalMinutes: number): string => {
    if (totalMinutes < 1) return '< 1 min';
    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
}

const CraftingScreen: FC<CraftingScreenProps> = ({ onClose, initialSkill, onStartCrafting }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [craftQuantity, setCraftQuantity] = useState(1);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'level' | 'name'>('level');
    
    const playerInventoryMap = useMemo(() => {
        const map = new Map<string, number>();
        const inv = useInventoryStore.getState();
        inv.items.forEach(invItem => {
            map.set(invItem.id, invItem.quantity);
        });
        return map;
    }, []);
    
    const sortedAndFilteredRecipes = useMemo(() => {
        if (!initialSkill) return [];
        
        const filtered = mockRecipes.filter(recipe => 
            recipe.skill === initialSkill &&
            recipe.result.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            if (sortBy === 'level') {
                if (a.levelRequired === b.levelRequired) {
                    return a.result.name.localeCompare(b.result.name); // Secondary sort by name
                }
                return a.levelRequired - b.levelRequired;
            } else { // sortBy === 'name'
                return a.result.name.localeCompare(b.result.name);
            }
        });
    }, [initialSkill, searchTerm, sortBy]);

    useEffect(() => {
        setSelectedRecipe(sortedAndFilteredRecipes[0] || null);
    }, [sortedAndFilteredRecipes]);

    useEffect(() => {
        setCraftQuantity(1);
    }, [selectedRecipe]);
    
    const ingredientsWithStatus = useMemo(() => {
        if (!selectedRecipe) return [];
        return selectedRecipe.ingredients.map(ing => {
            const data = itemsData[ing.itemId as keyof typeof itemsData] as any;
            const playerQty = playerInventoryMap.get(ing.itemId) || 0;
            return {
                ...ing,
                itemData: data,
                playerQty,
            };
        });
    }, [selectedRecipe, playerInventoryMap]);
    
    const maxCraftable = useMemo(() => {
        if (!selectedRecipe || ingredientsWithStatus.length === 0) return 1;
        const craftableAmounts = ingredientsWithStatus.map(ing => {
            return Math.floor(ing.playerQty / ing.quantity);
        });
        let baseMax = Math.max(1, Math.min(...craftableAmounts));
        if (selectedRecipe.result.id === 'wooden_plank') {
            const copper = useCharacterStore.getState().currency.copper;
            const maxByCopper = Math.floor(copper / 2);
            baseMax = Math.max(1, Math.min(baseMax, maxByCopper));
        }
        return baseMax;
    }, [selectedRecipe, ingredientsWithStatus]);

    const canCraftQuantity = useMemo(() => {
        if (!selectedRecipe || craftQuantity === 0) return false;
        const itemsOk = ingredientsWithStatus.every(ing => ing.playerQty >= (ing.quantity * craftQuantity));
        if (!itemsOk) return false;
        if (selectedRecipe.result.id === 'wooden_plank') {
            const copper = useCharacterStore.getState().currency.copper;
            return copper >= (2 * craftQuantity);
        }
        return true;
    }, [ingredientsWithStatus, craftQuantity, selectedRecipe]);

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setCraftQuantity(Math.max(1, Math.min(maxCraftable, value)));
        }
    };

    const handleCraftClick = () => {
        if (canCraftQuantity && selectedRecipe) {
            setIsConfirmModalOpen(true);
        }
    };

    const handleConfirmCraft = () => {
        if (!selectedRecipe) return;
        onStartCrafting(selectedRecipe, craftQuantity);
        setIsConfirmModalOpen(false);
    };

    const renderConfirmationMessage = () => {
        if (!selectedRecipe) return '';
        
        return (
          <div>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Are you sure you want to craft <span className="font-bold text-white">{craftQuantity}x {selectedRecipe.result.name}</span>? This will take some time and the following resources will be used:
            </p>
            <div className="bg-black/20 p-3 rounded-md border border-zinc-700 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {ingredientsWithStatus.map(ing => (
                <div key={ing.itemId} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-300">{ing.itemData?.name || ing.itemId}</span>
                  <span className="font-mono text-zinc-400">
                    {ing.quantity * craftQuantity} used
                  </span>
                </div>
              ))}
              {selectedRecipe && selectedRecipe.result.id === 'wooden_plank' && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-300">Copper</span>
                  <span className="font-mono text-zinc-400">{2 * craftQuantity} used</span>
                </div>
              )}
            </div>
            <div className="mt-4 border-t border-zinc-700 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total Time Cost:</span>
                    <span className="font-semibold text-white">{formatDuration(selectedRecipe.timeCost * craftQuantity)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total Energy Cost:</span>
                    <span className="font-semibold text-white">{selectedRecipe.energyCost * craftQuantity}</span>
                </div>
            </div>
          </div>
        );
    };
    
  return (
    <>
        <div className="w-full h-full p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full h-full max-w-7xl bg-zinc-950/80 backdrop-blur-lg rounded-xl border border-zinc-700 p-6 relative flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-20"><X size={24} /></button>
                <header className="flex-shrink-0 text-center mb-4">
                    <h1 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{initialSkill || 'Crafting'}</h1>
                </header>
                
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                    {/* Left Panel: Recipe List */}
                    <div className="md:col-span-1 bg-black/20 rounded-lg border border-zinc-800 p-4 flex flex-col h-full">
                        {/* Search Bar */}
                        <div className="relative my-2 flex-shrink-0">
                            <input 
                                type="text"
                                placeholder="Search recipes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/30 border border-zinc-700 rounded-md py-2 pl-4 pr-10 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none transition"
                            />
                            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        </div>
                        {/* Sort Controls */}
                        <div className="flex items-center justify-start gap-2 mb-2 flex-shrink-0 text-sm">
                            <span className="text-zinc-400">Sort by:</span>
                            <button onClick={() => setSortBy('level')} className={`px-3 py-1 rounded-md transition-colors ${sortBy === 'level' ? 'bg-zinc-700 text-white font-semibold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>Level</button>
                            <button onClick={() => setSortBy('name')} className={`px-3 py-1 rounded-md transition-colors ${sortBy === 'name' ? 'bg-zinc-700 text-white font-semibold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>Name</button>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-grow custom-scrollbar pr-2 space-y-1 mt-2">
                            {sortedAndFilteredRecipes.map(recipe => (
                                <button 
                                    key={recipe.id} 
                                    onClick={() => setSelectedRecipe(recipe)}
                                    className={`w-full flex justify-between items-center p-2 rounded-lg transition-colors text-sm text-left ${selectedRecipe?.id === recipe.id ? 'bg-zinc-700/50 font-semibold text-white' : 'hover:bg-white/5 text-zinc-300'}`}
                                >
                                    <span className="truncate">{recipe.result.name}</span>
                                    <span className="text-xs text-zinc-400">Lvl. {recipe.levelRequired}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Details */}
                    <div className="md:col-span-2 bg-black/20 rounded-lg border border-zinc-800 p-4 flex flex-col overflow-y-auto custom-scrollbar">
                        {selectedRecipe ? (
                            <>
                                <div className="text-center border-b border-zinc-700 pb-4 mb-4">
                                    <div className="mx-auto w-28 h-28 bg-black/30 rounded-lg flex items-center justify-center p-4 border border-zinc-700">
                                        {(() => {
                                            const data = itemsData[selectedRecipe.result.id as keyof typeof itemsData] as any;
                                            const img = data?.image;
                                            if (img) return <img src={img} alt={data?.name || selectedRecipe.result.name} className="w-20 h-20 object-contain" />;
                                            if (selectedRecipe.result.icon) return React.cloneElement(selectedRecipe.result.icon as ReactElement<{ size: number }>, { size: 64 });
                                            return <Hammer size={64} className="text-zinc-400"/>;
                                        })()}
                                    </div>
                                    <h2 className="text-3xl font-bold mt-3 text-white" style={{ fontFamily: 'Cinzel, serif' }}>{selectedRecipe.result.name}</h2>
                                    <p className="text-zinc-400 italic leading-relaxed text-base mt-1">{selectedRecipe.result.description}</p>
                                </div>
                                
                                <div className="flex-grow space-y-4">
                                    <h3 className="text-lg font-bold text-zinc-300 tracking-wider">Required Materials</h3>
                                    <div className="space-y-2">
                                        {ingredientsWithStatus.map(ing => (
                                            <div key={ing.itemId} className="flex justify-between items-center bg-zinc-900/70 p-2 rounded-md">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-black/40 rounded-md border border-zinc-700 overflow-hidden">
                                                        {ing.itemData?.image ? <img src={ing.itemData.image} alt={ing.itemData?.name || ing.itemId} className="w-full h-full object-contain"/> : <Hammer size={16} className="text-zinc-400"/>}
                                                    </div>
                                                    <span className="truncate">{ing.itemData?.name || ing.itemId}</span>
                                                </div>
                                                <span className={`font-mono text-sm ${ing.playerQty >= (ing.quantity * craftQuantity) ? 'text-zinc-300' : 'text-red-400'}`}>
                                                    {ing.quantity * craftQuantity} / {ing.playerQty}
                                                </span>
                                            </div>
                                        ))}
                                        {selectedRecipe && selectedRecipe.result.id === 'wooden_plank' && (
                                            <div className="flex justify-between items-center bg-zinc-900/70 p-2 rounded-md">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-black/40 rounded-md border border-zinc-700">
                                                        <Coins size={16} className="text-amber-300"/>
                                                    </div>
                                                    <span className="truncate">Copper</span>
                                                </div>
                                                <span className={`font-mono text-sm ${useCharacterStore.getState().currency.copper >= (2 * craftQuantity) ? 'text-zinc-300' : 'text-red-400'}`}>
                                                    {2 * craftQuantity} / {useCharacterStore.getState().currency.copper}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-auto pt-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <button onClick={() => setCraftQuantity(q => Math.max(1, q - 1))} className="p-3 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-colors"><Minus size={16}/></button>
                                        <div className="text-center flex-grow">
                                            <div className="text-2xl font-bold font-mono w-full">{craftQuantity}</div>
                                            <input type="range" min="1" max={maxCraftable} value={craftQuantity} onChange={handleQuantityChange} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb mt-2"/>
                                        </div>
                                        <button onClick={() => setCraftQuantity(q => Math.min(maxCraftable, q + 1))} className="p-3 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-colors"><Plus size={16}/></button>
                                    </div>
                                    <div className="flex justify-around items-center text-xs text-zinc-400 mt-4">
                                        <div className="flex items-center gap-1.5"><Clock size={14}/><span>Time: {formatDuration(selectedRecipe.timeCost * craftQuantity)}</span></div>
                                        <div className="flex items-center gap-1.5"><Zap size={14}/><span>Energy: {selectedRecipe.energyCost * craftQuantity}</span></div>
                                    </div>
                                    <button
                                        onClick={handleCraftClick}
                                        disabled={!canCraftQuantity}
                                        className="w-full mt-4 p-3 text-md font-semibold tracking-wide bg-zinc-700 border border-zinc-600 rounded-md transition-all hover:bg-zinc-600 disabled:bg-zinc-600/50 disabled:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-400"
                                    >
                                        {selectedRecipe?.result.id === 'wooden_plank' ? 'Make Planks' : 'Craft'} {craftQuantity > 1 ? `${craftQuantity}x` : ''}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-center text-zinc-500">
                                <p>Select a recipe to see details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                .range-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #71717a; cursor: pointer; border-radius: 50%; border: 2px solid #3f3f46; }
                .range-thumb::-moz-range-thumb { width: 16px; height: 16px; background: #71717a; cursor: pointer; border-radius: 50%; border: 2px solid #3f3f46; }
            `}</style>
        </div>
        <ConfirmationModal
            isOpen={isConfirmModalOpen}
            title="Confirm Crafting"
            message={renderConfirmationMessage()}
            onConfirm={handleConfirmCraft}
            onCancel={() => setIsConfirmModalOpen(false)}
            confirmText={selectedRecipe?.result.id === 'wooden_plank' ? 'Make Planks' : 'Craft'}
        />
    </>
  );
};

export default CraftingScreen;

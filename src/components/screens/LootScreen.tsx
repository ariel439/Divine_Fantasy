import React, { useState, useEffect } from 'react';
import { Package, Hand, ArrowLeft, Backpack, ChevronRight, ChevronLeft } from 'lucide-react';
import itemsJson from '../../data/items.json';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useCharacterStore } from '../../stores/useCharacterStore';

interface LootItem {
  itemId: string;
  quantity: number;
}

interface LootScreenProps {
  loot: LootItem[];
  onClose: () => void;
}

export const LootScreen: React.FC<LootScreenProps> = ({ loot, onClose }) => {
  // Local state to track what's left in the container (Loot - Right Side)
  const [containerItems, setContainerItems] = useState<LootItem[]>([]);
  
  // Access global inventory (Player - Left Side)
  const { items: inventoryItems, addItem, removeItem, currentWeight } = useInventoryStore();
  const maxWeight = useCharacterStore((state) => state.maxWeight);

  useEffect(() => {
    setContainerItems(loot);
  }, [loot]);

  // Take Item: Move from Container (Right) to Inventory (Left)
  const handleTakeItem = (index: number) => {
    const item = containerItems[index];
    const success = addItem(item.itemId, item.quantity);
    
    if (success) {
      // Remove from container only if successfully added to inventory
      const newItems = [...containerItems];
      newItems.splice(index, 1);
      setContainerItems(newItems);
    }
  };

  // Give Item: Move from Inventory (Left) to Container (Right)
  // Note: We use removeItem which handles stack logic, but for this UI we need to be careful
  // If we drop 1 item from a stack of 10, we add 1 to container.
  const handleGiveItem = (itemId: string, quantity: number) => {
    const success = removeItem(itemId, quantity);
    
    if (success) {
      // Add to container
      setContainerItems(prev => {
        const existing = prev.find(i => i.itemId === itemId);
        if (existing) {
          // Clone array to trigger re-render
          return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + quantity } : i);
        } else {
          return [...prev, { itemId, quantity }];
        }
      });
    }
  };

  const handleTakeAll = () => {
    // Try to take all items one by one
    const remainingItems: LootItem[] = [];
    
    containerItems.forEach(item => {
      const success = addItem(item.itemId, item.quantity);
      if (!success) {
        remainingItems.push(item);
      }
    });
    
    setContainerItems(remainingItems);
  };

  const renderItem = (item: { itemId: string; quantity: number }, onClick: () => void, actionIcon: React.ReactNode, isInventory: boolean) => {
    const itemDef = itemsJson[item.itemId as keyof typeof itemsJson];
    if (!itemDef) return null;

    return (
      <div 
        key={`${item.itemId}-${Math.random()}`} // Simple key strategy
        onClick={onClick}
        className="group flex items-center gap-3 p-2 bg-zinc-950/50 border border-zinc-800 rounded-lg hover:border-amber-600/50 hover:bg-zinc-900 cursor-pointer transition-all mb-2"
      >
        <div className="w-10 h-10 bg-zinc-950 rounded border border-zinc-700 flex items-center justify-center p-1 group-hover:border-amber-500/30">
          <img src={itemDef.image} alt={itemDef.name} className="w-full h-full object-contain" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-zinc-300 text-sm truncate group-hover:text-amber-100 transition-colors">
              {itemDef.name}
            </span>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 ml-2">
              x{item.quantity}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-0.5">
            <span className="truncate max-w-[120px]">{itemDef.type}</span>
            <span>{itemDef.weight * item.quantity}kg</span>
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-500">
          {actionIcon}
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-5xl h-[80vh] bg-zinc-900 border-2 border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Package className="text-amber-600" size={24} />
            <h2 className="text-2xl font-bold text-zinc-100" style={{ fontFamily: 'Cinzel, serif' }}>
              Loot
            </h2>
          </div>
          <div className="flex gap-4 text-sm font-medium text-zinc-400">
             <div className="flex items-center gap-2">
                <Backpack size={16} />
                <span className={currentWeight > maxWeight ? 'text-red-500' : ''}>
                  {currentWeight} / {maxWeight} kg
                </span>
             </div>
          </div>
        </div>

        {/* Two Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Inventory */}
          <div className="flex-1 flex flex-col border-r border-zinc-800 bg-zinc-900/30">
            <div className="p-3 bg-zinc-950/50 border-b border-zinc-800 flex justify-between items-center">
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-xs">Your Inventory</span>
              <span className="text-xs text-zinc-600">{inventoryItems.length} items</span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
               {inventoryItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic text-sm">
                    <p>Inventory Empty</p>
                  </div>
               ) : (
                  // Consolidate inventory items for display (group by ID)
                  // Actually inventoryStore items are already grouped if stackable, but non-stackable are separate.
                  // For this view, let's just map them directly.
                  inventoryItems.map((item) => (
                    renderItem(
                      { itemId: item.id, quantity: item.quantity }, 
                      // For now, moving 1 at a time or all? Let's just move 1 for simplicity or the whole stack? 
                      // Inventory removeItem takes quantity. Let's move 1 for now to be safe or maybe all?
                      // M&B usually moves stack with Ctrl+Click.
                      // Let's just move 1.
                      () => handleGiveItem(item.id, 1), 
                      <ChevronRight size={18} />, 
                      true
                    )
                  ))
               )}
            </div>
          </div>

          {/* Center Divider Actions (Optional, but useful for Take All) */}
          <div className="w-16 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center justify-center gap-4 p-2 shrink-0">
             <button
              onClick={handleTakeAll}
              disabled={containerItems.length === 0}
              className="p-2 rounded-full bg-amber-900/20 hover:bg-amber-600 hover:text-white text-amber-600 border border-amber-800/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Take All"
             >
               <div className="flex flex-col items-center">
                 <ArrowLeft size={20} />
                 <ArrowLeft size={20} className="-mt-3" />
               </div>
             </button>
          </div>

          {/* Right Panel: Loot Container */}
          <div className="flex-1 flex flex-col bg-zinc-900/30">
            <div className="p-3 bg-zinc-950/50 border-b border-zinc-800 flex justify-between items-center">
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-xs">Loot</span>
              <span className="text-xs text-zinc-600">{containerItems.length} items</span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
              {containerItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic text-sm">
                  <p>Empty</p>
                </div>
              ) : (
                containerItems.map((item, index) => (
                  renderItem(
                    item, 
                    () => handleTakeItem(index), 
                    <ChevronLeft size={18} />, 
                    false
                  )
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center shrink-0">
          <div className="text-xs text-zinc-500">
             Click items to transfer • Take All available
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-8 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold rounded shadow-lg shadow-amber-900/20 transition-all transform hover:scale-105 active:scale-95 border border-amber-600/50"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

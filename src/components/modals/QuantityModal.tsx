
import React, { useState, useEffect } from 'react';
import type { FC, ReactElement } from 'react';
import type { Item } from '../../types';
import { Plus, Minus } from 'lucide-react';
import itemsData from '../../data/items.json';

interface QuantityModalProps {
  isOpen: boolean;
  item: Item | null;
  side?: 'player' | 'merchant' | null;
  currentQuantity?: number;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

// FIX: Changed to a named export to resolve module issue.
export const QuantityModal: FC<QuantityModalProps> = ({ isOpen, item, onConfirm, onCancel }) => {
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = item?.quantity || 1;

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!isOpen || !item) {
    return null;
  }

  const handleConfirm = () => {
    if (quantity > 0) {
      onConfirm(quantity);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
        setQuantity(Math.max(1, Math.min(maxQuantity, value)));
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-opacity duration-500"
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-sm bg-zinc-950/90 backdrop-blur-2xl rounded-2xl border border-zinc-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 overflow-hidden relative group animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glass accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />

        <div className="text-center border-b border-zinc-800/50 pb-6 mb-6">
          <div className="mx-auto w-24 h-24 bg-black/40 rounded-xl flex items-center justify-center p-3 border border-zinc-800/50">
              {item.icon
                ? React.cloneElement(item.icon as ReactElement<{ size: number }>, { size: 64 })
                : ((itemsData as any)[item.id]?.image ? <img src={(itemsData as any)[item.id].image} alt={item.name} className="w-16 h-16" /> : null)
              }
          </div>
          <h2 className="text-3xl font-bold mt-4 text-white tracking-[0.1em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>{item.name}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2">Select quantity</p>
        </div>
        
        <div className="my-10 space-y-8">
            <div className="flex items-center justify-between gap-6 px-4">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                  className="p-3 rounded-full bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700 hover:border-zinc-500 transition-all active:scale-95"
                >
                  <Minus size={20} className="text-zinc-400" />
                </button>
                <div className="text-center">
                    <div className="text-6xl font-bold font-mono tracking-tighter text-white">{quantity}</div>
                </div>
                <button 
                  onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))} 
                  className="p-3 rounded-full bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700 hover:border-zinc-500 transition-all active:scale-95"
                >
                  <Plus size={20} className="text-zinc-400" />
                </button>
            </div>
             <input
                type="range"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100 hover:accent-white transition-all"
            />
        </div>

        <div className="flex justify-between items-center gap-4 mt-10">
          <button 
            onClick={() => setQuantity(maxQuantity)}
            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all border border-transparent hover:border-zinc-800 rounded-lg hover:bg-white/5"
          >
            Offer All
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={onCancel}
              className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all border border-transparent hover:border-zinc-800 rounded-lg hover:bg-white/5"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="px-8 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-zinc-800/50 border border-zinc-700/50 rounded-lg transition-all hover:bg-white/10 hover:border-zinc-400 hover:shadow-xl active:scale-95"
            >
              Confirm
            </button>
          </div>
        </div>
       <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.98) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5); margin-top: -6px;
        }
        input[type=range]::-moz-range-thumb {
            width: 16px; height: 16px; border-radius: 50%; background: #fff; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5); border: none;
        }
      `}</style>
    </div>
    </div>
  );
};

export default QuantityModal;


import React, { useState, useEffect } from 'react';
import type { FC, ReactElement } from 'react';
import type { Item } from '../../types';
import { Plus, Minus } from 'lucide-react';

interface QuantityModalProps {
  isOpen: boolean;
  item: Item | null;
  onConfirm: (quantity: number) => void;
  onClose: () => void;
}

// FIX: Changed to a named export to resolve module issue.
export const QuantityModal: FC<QuantityModalProps> = ({ isOpen, item, onConfirm, onClose }) => {
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-zinc-950 rounded-xl border border-zinc-700 shadow-2xl p-6 transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s ease-out forwards' }}
      >
        <div className="text-center border-b border-zinc-700 pb-4 mb-4">
          <div className="mx-auto w-20 h-20 bg-black/30 rounded-lg flex items-center justify-center p-2 border border-zinc-700">
              {React.cloneElement(item.icon as ReactElement<{ size: number }>, { size: 48 })}
          </div>
          <h2 className="text-2xl font-bold mt-3 text-white" style={{ fontFamily: 'Cinzel, serif' }}>{item.name}</h2>
          <p className="text-sm text-zinc-400">Select quantity to offer</p>
        </div>
        
        <div className="my-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-colors"><Minus size={20}/></button>
                <div className="text-center">
                    <div className="text-4xl font-bold font-mono w-24">{quantity}</div>
                </div>
                <button onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))} className="p-3 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-colors"><Plus size={20}/></button>
            </div>
             <input
                type="range"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb"
            />
        </div>

        <div className="flex justify-between items-center gap-4 mt-8">
          <button 
            onClick={() => setQuantity(maxQuantity)}
            className="px-5 py-2 text-sm font-semibold tracking-wide text-zinc-300 bg-zinc-700/50 border border-zinc-600/80 rounded-md transition-all duration-300 hover:bg-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            MAX
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold tracking-wide text-white/90 bg-zinc-700/80 border border-zinc-600 rounded-md transition-all duration-300 hover:bg-zinc-600/80 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="px-5 py-2 text-sm font-semibold tracking-wide text-white/90 bg-zinc-700 border border-zinc-600 rounded-md transition-all duration-300 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              Confirm
            </button>
          </div>
        </div>
       <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
        .range-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #71717a; /* zinc-500 */
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid #3f3f46; /* zinc-700 */
        }
        .range-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #71717a; /* zinc-500 */
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid #3f3f46; /* zinc-700 */
        }
      `}</style>
    </div>
    </div>
  );
};

export default QuantityModal;

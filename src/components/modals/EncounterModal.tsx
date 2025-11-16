import React from 'react';
import { X, Swords } from 'lucide-react';

interface EncounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  encounter: {
    type: 'combat';
    description: string;
    enemies: string[];
    wolfCount?: number;
  } | null;
}

const EncounterModal: React.FC<EncounterModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  encounter 
}) => {
  if (!isOpen || !encounter) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Swords size={20} />
            Encounter!
          </h3>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-zinc-300 mb-4">{encounter.description}</p>
          
          {encounter.type === 'combat' && (
            <div className="bg-zinc-700 rounded p-3">
              <p className="text-sm text-zinc-400 mb-2">You face:</p>
              <ul className="space-y-1">
                {encounter.enemies.map((enemy, index) => (
                  <li key={index} className="text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    {enemy}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded transition-colors"
          >
            Retreat
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors flex items-center justify-center gap-2"
          >
            <Swords size={16} />
            Fight!
          </button>
        </div>
      </div>
    </div>
  );
};

export default EncounterModal;
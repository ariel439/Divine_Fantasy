import React from 'react';
import { Save, FolderOpen, Settings, Home, X } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';

interface SystemMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSaveLoad: () => void;
  onOpenOptions: () => void;
  onReturnToMainMenu: () => void;
}

const SystemMenuModal: React.FC<SystemMenuModalProps> = ({ isOpen, onClose, onOpenSaveLoad, onOpenOptions, onReturnToMainMenu }) => {
  if (!isOpen) return null;

  const handleSave = () => {
    onOpenSaveLoad();
  };

  const handleLoad = () => {
    // We can reuse the same modal for load, maybe with a different context if needed, 
    // but typically Save/Load modal handles both or has tabs. 
    // For now, let's assume onOpenSaveLoad opens the unified modal.
    onOpenSaveLoad();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h2 className="text-xl font-serif text-amber-500 flex items-center">
            <Settings className="mr-2" size={20} />
            System Menu
          </h2>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          <button 
            onClick={handleSave}
            className="w-full flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-zinc-500 rounded-lg transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-zinc-900 rounded-md text-zinc-400 group-hover:text-emerald-400 transition-colors">
                <Save size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-zinc-200 group-hover:text-white">Save / Load</div>
                <div className="text-xs text-zinc-500">Manage your save files</div>
              </div>
            </div>
          </button>

          <button 
            onClick={onOpenOptions}
            className="w-full flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-zinc-500 rounded-lg transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-zinc-900 rounded-md text-zinc-400 group-hover:text-blue-400 transition-colors">
                <Settings size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-zinc-200 group-hover:text-white">Options</div>
                <div className="text-xs text-zinc-500">Audio, Graphics, Gameplay</div>
              </div>
            </div>
          </button>

          <div className="h-px bg-zinc-800 my-2" />

          <button 
            onClick={onReturnToMainMenu}
            className="w-full flex items-center justify-between p-4 bg-red-900/10 hover:bg-red-900/20 border border-red-900/30 hover:border-red-800/50 rounded-lg transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-zinc-900 rounded-md text-red-400 group-hover:text-red-300 transition-colors">
                <Home size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-red-200 group-hover:text-red-100">Main Menu</div>
                <div className="text-xs text-red-400/70">Return to title screen</div>
              </div>
            </div>
          </button>
        </div>
        
        {/* Footer */}
        <div className="p-3 bg-zinc-950/30 text-center text-xs text-zinc-600 border-t border-zinc-800">
           Game Paused
        </div>
      </div>
    </div>
  );
};

export default SystemMenuModal;

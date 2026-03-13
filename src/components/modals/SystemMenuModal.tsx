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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-opacity duration-500 animate-fade-in">
      <div className="w-full max-w-md bg-zinc-950/90 backdrop-blur-2xl rounded-2xl border border-zinc-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative group animate-scale-in">
        {/* Top glass accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />

        {/* Header */}
        <div className="p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-950/50">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <Settings className="text-zinc-400" size={20} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white tracking-[0.1em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                    System
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Game Paused</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white transition-all border border-transparent hover:border-zinc-800 rounded-full hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-4">
          <button 
            onClick={handleSave}
            className="w-full flex items-center justify-between p-5 bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-xl transition-all duration-500 hover:bg-white/10 hover:border-emerald-500/50 hover:shadow-2xl hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500 group-hover:text-emerald-400 transition-colors">
                <Save size={20} />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-emerald-400/70 transition-colors">Storage</div>
                <div className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">Save / Load</div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full group-hover:bg-emerald-500 transition-colors" />
            </div>
          </button>

          <button 
            onClick={onOpenOptions}
            className="w-full flex items-center justify-between p-5 bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-xl transition-all duration-500 hover:bg-white/10 hover:border-blue-500/50 hover:shadow-2xl hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500 group-hover:text-blue-400 transition-colors">
                <Settings size={20} />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-blue-400/70 transition-colors">Preferences</div>
                <div className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">Options</div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full group-hover:bg-blue-400 transition-colors" />
            </div>
          </button>

          <div className="py-4">
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />
          </div>

          <button 
            onClick={onReturnToMainMenu}
            className="w-full flex items-center justify-between p-5 bg-red-950/10 backdrop-blur-md border border-red-900/20 rounded-xl transition-all duration-500 hover:bg-red-900/20 hover:border-red-500/50 hover:shadow-2xl hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-zinc-900 rounded-lg text-zinc-600 group-hover:text-red-400 transition-colors">
                <Home size={20} />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest text-red-900/50 group-hover:text-red-400/70 transition-colors">Exit</div>
                <div className="text-sm font-bold text-red-200/70 group-hover:text-red-100 transition-colors">Main Menu</div>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border border-red-900/20 flex items-center justify-center group-hover:border-red-500/50 transition-colors">
                <div className="w-1.5 h-1.5 bg-red-900/20 rounded-full group-hover:bg-red-500 transition-colors" />
            </div>
          </button>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-zinc-950/50 text-center border-t border-zinc-800/50">
           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600">Chronicle Version 0.1.0-alpha</span>
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
      `}</style>
    </div>
  );
};

export default SystemMenuModal;

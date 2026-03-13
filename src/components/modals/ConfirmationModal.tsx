
import React from 'react';
import type { FC, ReactNode } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  singleButton?: boolean;
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  singleButton = false,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-opacity duration-500"
      onClick={onCancel}
    >
      <div 
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-zinc-950/90 backdrop-blur-2xl rounded-2xl border border-zinc-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 overflow-hidden relative group animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glass accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />
        
        {title && (
          <h2 className="text-2xl font-bold text-white mb-4 tracking-[0.15em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
            {title}
          </h2>
        )}
        <div className="text-zinc-300 leading-relaxed font-light italic mb-8">
            "{message}"
        </div>
        
        <div className="flex justify-end items-center gap-3">
          {!singleButton && (
            <button 
              onClick={onCancel}
              className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all border border-transparent hover:border-zinc-800 rounded-lg hover:bg-white/5"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm}
            className="px-8 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-zinc-800/50 border border-zinc-700/50 rounded-lg transition-all hover:bg-white/10 hover:border-zinc-400 hover:shadow-xl active:scale-95"
          >
            {confirmText}
          </button>
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
    </div>
  );
};

export default ConfirmationModal;
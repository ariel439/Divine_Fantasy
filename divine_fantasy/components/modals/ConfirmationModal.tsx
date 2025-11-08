
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
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
      onClick={onCancel}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "confirmation-title" : undefined}
        aria-describedby="confirmation-message"
        className="w-full max-w-md bg-zinc-950 rounded-xl border border-zinc-700 shadow-2xl p-6 transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s ease-out forwards' }}
      >
        {title && (
          <h2 id="confirmation-title" className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
            {title}
          </h2>
        )}
        <div id="confirmation-message" className="text-zinc-300 leading-relaxed">{message}</div>
        <div className="flex justify-end items-center gap-4 mt-6">
          <button 
            onClick={onCancel}
            className="px-5 py-2 text-sm font-semibold tracking-wide text-white/90 bg-zinc-700/80 border border-zinc-600 rounded-md transition-all duration-300 hover:bg-zinc-600/80 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-semibold tracking-wide text-white/90 bg-zinc-800 border border-zinc-700 rounded-md transition-all duration-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            {confirmText}
          </button>
        </div>
       <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  </div>
  );
};

export default ConfirmationModal;
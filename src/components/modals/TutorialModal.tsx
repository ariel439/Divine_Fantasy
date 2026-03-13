import React from 'react';
import type { FC } from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  secondaryActionText?: string;
  onSecondary?: () => void;
}

const TutorialModal: FC<TutorialModalProps> = ({ isOpen, title = 'Tutorial', message, onClose, secondaryActionText, onSecondary }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-opacity duration-500 animate-fade-in">
      <div 
        className="w-full max-w-lg bg-zinc-950/90 backdrop-blur-2xl rounded-2xl border border-zinc-800/50 shadow-[0_0_50px_rgba(234,179,8,0.15)] p-8 overflow-hidden relative group animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glass accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
        
        <div className="flex items-center gap-4 mb-6">
            <div className="p-2.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-[0.1em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                {title}
            </h2>
        </div>

        <div className="text-zinc-300 leading-relaxed font-light italic mb-8 border-l-2 border-zinc-800/50 pl-6 py-2">
            "{message}"
        </div>

        <div className="flex justify-end items-center gap-3">
          {secondaryActionText && onSecondary && (
            <button
              className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all border border-transparent hover:border-zinc-800 rounded-lg hover:bg-white/5"
              onClick={onSecondary}
            >
              {secondaryActionText}
            </button>
          )}
          <button
            className="px-8 py-2 text-[10px] font-black uppercase tracking-widest text-black bg-yellow-500 border border-yellow-400 rounded-lg transition-all hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] active:scale-95"
            onClick={onClose}
          >
            Acknowledge
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

export default TutorialModal;

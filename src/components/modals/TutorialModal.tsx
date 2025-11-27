import React from 'react';
import type { FC } from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

const TutorialModal: FC<TutorialModalProps> = ({ isOpen, title = 'Tutorial', message, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-w-lg w-full mx-4 bg-zinc-900 border border-zinc-700 rounded-xl p-6 animate-fade-in shadow-[0_0_28px_rgba(234,179,8,0.25)]">
        <h2 className="text-2xl font-bold mb-3 text-yellow-300">{title}</h2>
        <p className="text-zinc-200 leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-md hover:bg-yellow-400 transition-colors"
            onClick={onClose}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;

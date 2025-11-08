import React from 'react';
import type { FC, ReactNode } from 'react';

interface ActionButtonProps {
  icon: ReactNode;
  text: string;
  category?: 'dialogue' | 'action' | 'travel' | 'commerce' | 'explore';
  onClick?: () => void;
}

const ActionButton: FC<ActionButtonProps> = ({ icon, text, category, onClick }) => {
    const categoryStyles = {
        dialogue: 'border-l-sky-400',
        action: 'border-l-orange-400',
        travel: 'border-l-green-400',
        commerce: 'border-l-yellow-400',
        explore: 'border-l-zinc-400',
    };
    
    const borderClass = category ? `border-l-2 ${categoryStyles[category]}` : 'border-l-transparent';

    return (
        <button onClick={onClick} className={`flex items-center w-full text-left p-3 bg-zinc-800/85 border border-zinc-700 rounded-lg hover:bg-zinc-700/80 hover:shadow-[0_0_20px_rgba(212,212,216,0.1)] transition-all duration-300 group flex-shrink-0 ${borderClass}`}>
            <div className="mr-4 bg-white/5 p-2 rounded-md group-hover:bg-white/10">
                {icon}
            </div>
            <span className="font-medium tracking-wide">{text}</span>
        </button>
    );
}

export default ActionButton;
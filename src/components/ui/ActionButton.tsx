import React from 'react';
import type { FC, ReactNode } from 'react';

interface ActionButtonProps {
  icon: ReactNode;
  text: string;
  category?: 'dialogue' | 'action' | 'travel' | 'commerce' | 'explore' | 'highlighted';
  onClick?: () => void;
  disabled?: boolean;
  highlight?: boolean;
  tooltip?: string;
}

const ActionButton: FC<ActionButtonProps> = ({ icon, text, category, onClick, disabled, highlight, tooltip }) => {
    const categoryStyles = {
        dialogue: 'border-l-sky-400',
        action: 'border-l-orange-400',
        travel: 'border-l-green-400',
        commerce: 'border-l-yellow-400',
        explore: 'border-l-zinc-400',
        highlighted: 'border-l-yellow-400'
    };
    
    const isHighlighted = Boolean(highlight) || category === 'highlighted';
    const borderClass = isHighlighted ? 'border-l-2 border-l-yellow-400 border-yellow-400' : (category ? `border-l-2 ${categoryStyles[category]}` : 'border-l-transparent');

    return (
        <div className="relative">
          <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`flex items-center w-full text-left p-3 bg-zinc-800/85 border border-zinc-700 rounded-lg transition-all duration-300 group flex-shrink-0 ${borderClass} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700/80'}`}
          >
              <div className={`mr-4 p-2 rounded-md ${disabled ? 'bg-white/5' : 'bg-white/5 group-hover:bg-white/10'}`}>
                  {isHighlighted && React.isValidElement(icon) ? React.cloneElement(icon as any, { className: 'text-yellow-300' }) : icon}
              </div>
              <span className="font-medium tracking-wide">{text}</span>
          </button>
        </div>
    );
}

export default ActionButton;

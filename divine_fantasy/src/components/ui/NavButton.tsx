
import React from 'react';
import type { FC, ReactNode } from 'react';

interface NavButtonProps {
  icon: ReactNode;
  tooltip: string;
  onClick?: () => void;
  isActive?: boolean;
}

const NavButton: FC<NavButtonProps> = ({ icon, tooltip, onClick, isActive = false }) => {
  const buttonClasses = `p-3 rounded-full text-zinc-300 transition-all duration-300 ${
    isActive 
      ? 'bg-zinc-700/80 text-white scale-110 cursor-default' 
      : 'hover:text-white hover:bg-white/10 hover:scale-110'
  }`;

  // Tooltip now only appears on hover, regardless of the button's active state.
  const tooltipClasses = `absolute bottom-full mb-2 px-3 py-1.5 text-sm font-semibold text-white bg-zinc-900/90 rounded-md shadow-lg transition-opacity duration-300 pointer-events-none whitespace-nowrap backdrop-blur-sm opacity-0 group-hover:opacity-100`;

  return (
    <div className="relative group flex justify-center">
      <button onClick={onClick} className={buttonClasses} disabled={isActive}>
        {icon}
      </button>
      <div className={tooltipClasses}>
        {tooltip}
      </div>
    </div>
  );
};

export default NavButton;

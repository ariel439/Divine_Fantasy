import React from 'react';
import type { FC } from 'react';
import { Weight } from 'lucide-react';

interface ProgressBarProps {
  value: number;
  max: number;
  colorClass: string;
  negativeColorClass?: string;
  label?: string;
  variant?: 'slim' | 'thick' | 'weight';
  showText?: boolean;
  unit?: string;
}

const ProgressBar: FC<ProgressBarProps> = ({ label, value, max, colorClass, negativeColorClass = 'bg-red-500/80', variant = 'slim', showText = true, unit }) => {
  const isNegative = value < 0;
  const percentage = Math.min(100, Math.max(0, (Math.abs(value) / max) * 100));
  
  const barStyle = { 
    width: `${percentage}%`,
    transition: 'width 0.5s ease-out', // Smooth transition for value changes
  };
    
  const barClass = `${isNegative ? negativeColorClass : colorClass} ${variant === 'thick' ? 'h-full' : 'h-2'} rounded-full`;

  const renderBar = () => (
    <div 
      className={barClass}
      style={barStyle}
    />
  );

  if (variant === 'thick') {
    return (
      <div className="relative w-full bg-black/50 rounded-full h-5 shadow-inner border border-zinc-700 overflow-hidden">
        {renderBar()}
        {showText && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          {Math.floor(value)} / {Math.floor(max)}{unit ? ` ${unit}` : ''}
        </div>}
      </div>
    );
  }
  
  if (variant === 'weight') {
     return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1">
                {label && <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-zinc-300"><Weight size={14}/><span>{label}</span></div>}
                <span className="font-sans font-semibold text-xs text-zinc-300">{value} / {max} kg</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-1.5 shadow-inner border border-zinc-800/50 overflow-hidden">
                {renderBar()}
            </div>
        </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        {label && <span className="font-bold tracking-widest uppercase text-zinc-300 text-[10px]">{label}</span>}
        {showText && <span className="font-sans font-semibold text-[11px] text-zinc-300">{Math.floor(value)} / {Math.floor(max)}</span>}
      </div>
      <div className="w-full bg-black/40 rounded-full h-1.5 shadow-inner border border-zinc-800/50 overflow-hidden">
        {renderBar()}
      </div>
    </div>
  );
};

export default ProgressBar;
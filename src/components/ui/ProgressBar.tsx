

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

const ProgressBar: FC<ProgressBarProps> = ({ label, value, max, colorClass, negativeColorClass = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]', variant = 'slim', showText = true, unit }) => {
  const isNegative = value < 0;
  const percentage = Math.min(100, Math.max(0, (Math.abs(value) / max) * 100));
  const barStyle = isNegative
    ? { width: `${percentage}%`, marginLeft: `${100 - percentage}%` }
    : { width: `${percentage}%` };
  const barClass = `${isNegative ? negativeColorClass : colorClass} ${variant === 'thick' ? 'h-full' : 'h-2'} rounded-full transition-all duration-500`;

  if (variant === 'thick') {
    return (
      <div className="relative w-full bg-black/50 rounded-full h-5 shadow-inner border border-zinc-700">
        <div className={barClass} style={barStyle}></div>
        {showText && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          {value} / {max}{unit ? ` ${unit}` : ''}
        </div>}
      </div>
    );
  }
  
  if (variant === 'weight') {
     return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1 text-xs text-white/90">
                {label && <div className="flex items-center gap-2 font-bold tracking-wide"><Weight size={16}/><span>{label}</span></div>}
                <span>{value} / {max} kg</span>
            </div>
            <div className="w-full bg-black/50 rounded-full h-2 shadow-inner">
                <div className={barClass} style={barStyle}></div>
            </div>
        </div>
    );
  }


  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 text-xs text-white/90">
        {label && <span className="font-bold tracking-wide">{label}</span>}
        {showText && <span>{value} / {max}</span>}
      </div>
      <div className="w-full bg-black/50 rounded-full h-2 shadow-inner">
        <div className={barClass} style={barStyle}></div>
      </div>
    </div>
  );
};

export default ProgressBar;

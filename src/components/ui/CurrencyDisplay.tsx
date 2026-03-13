
import React from 'react';
import type { FC } from 'react';
import { Coins } from 'lucide-react';
import { convertCopperToGSC } from '../../data';

const CurrencyDisplay: FC<{ totalCopper: number, variant?: 'default' | 'minimal' }> = ({ totalCopper, variant = 'default' }) => {
    const { gold, silver, copper } = convertCopperToGSC(totalCopper);
    
    if (variant === 'minimal') {
        return (
            <div className="flex items-center gap-4 text-[10px] font-black font-mono">
                {gold > 0 && <div className="flex items-center gap-1 text-yellow-400" title="Gold"><span>{gold}G</span></div>}
                {silver > 0 && <div className="flex items-center gap-1 text-zinc-400" title="Silver"><span>{silver}S</span></div>}
                <div className="flex items-center gap-1 text-orange-400" title="Copper"><span>{copper}C</span></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-end gap-4 text-sm">
            <div className="flex items-center gap-1" title="Gold"><Coins size={16} className="text-yellow-400" /> <span>{gold}</span></div>
            <div className="flex items-center gap-1" title="Silver"><Coins size={16} className="text-gray-400" /> <span>{silver}</span></div>
            <div className="flex items-center gap-1" title="Copper"><Coins size={16} className="text-orange-400" /> <span>{copper}</span></div>
        </div>
    );
};

export default CurrencyDisplay;
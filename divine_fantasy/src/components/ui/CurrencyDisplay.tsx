
import React from 'react';
import type { FC } from 'react';
import { Coins } from 'lucide-react';
import { convertCopperToGSC } from '../../data';

const CurrencyDisplay: FC<{ totalCopper: number }> = ({ totalCopper }) => {
    const { gold, silver, copper } = convertCopperToGSC(totalCopper);
    return (
        <div className="flex items-center justify-end gap-4 text-sm">
            <div className="flex items-center gap-1" title="Gold"><Coins size={16} className="text-yellow-400" /> <span>{gold}</span></div>
            <div className="flex items-center gap-1" title="Silver"><Coins size={16} className="text-gray-400" /> <span>{silver}</span></div>
            <div className="flex items-center gap-1" title="Copper"><Coins size={16} className="text-orange-400" /> <span>{copper}</span></div>
        </div>
    );
};

export default CurrencyDisplay;

import React from 'react';
import type { FC, ReactNode } from 'react';

const Stat: FC<{ label: string, value: ReactNode, valueSide?: 'left' | 'right' }> = ({ label, value, valueSide = 'right' }) => (
    <div className="flex justify-between items-center bg-black/20 px-4 py-2.5 rounded-md text-sm">
        <span className="font-semibold text-white/80">{label}</span>
        <span className="font-bold text-zinc-200 text-right">{value}</span>
    </div>
);

export default Stat;

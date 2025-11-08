
import React from 'react';
import type { FC, ReactNode } from 'react';

const Section: FC<{ title: string, children: ReactNode, className?: string }> = ({ title, children, className }) => (
    <div className={className}>
        <h3 className="text-xl font-bold text-zinc-300 mb-4 tracking-wider" style={{ fontFamily: 'Cinzel, serif' }}>{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

export default Section;
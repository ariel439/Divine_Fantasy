

import React from 'react';
import type { FC, ReactNode } from 'react';
import ProgressBar from './ProgressBar';

interface SkillProps {
    icon: ReactNode;
    name: string;
    level: number;
    xp: number;
    xpToNext: number;
}

const Skill: FC<SkillProps> = ({ icon, name, level, xp, xpToNext }) => (
    <div className="bg-black/20 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-black/30 rounded-md text-zinc-300">{icon}</div>
                <span className="font-semibold text-white">{name}</span>
            </div>
            <span className="text-sm font-bold text-zinc-300">Level {level}</span>
        </div>
        <ProgressBar value={xp} max={xpToNext} colorClass="bg-zinc-600/70" variant="thick" unit="XP" />
    </div>
);

export default Skill;
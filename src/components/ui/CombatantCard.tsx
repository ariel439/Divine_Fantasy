
import React from 'react';
import type { FC } from 'react';
import type { Combatant } from '../../types';
import ProgressBar from './ProgressBar';

interface CombatantCardProps {
  combatant: Combatant;
  isPartyMember: boolean;
  isActive?: boolean;
  isSelected?: boolean;
  wasJustHit?: boolean;
  onClick?: () => void;
}

const CombatantCard: FC<CombatantCardProps> = ({ combatant, isPartyMember, isActive = false, isSelected = false, wasJustHit = false, onClick }) => {
    const cardClasses = `
        relative w-full bg-zinc-950/80 backdrop-blur-sm rounded-xl border-2 shadow-2xl overflow-hidden transition-all duration-300
        ${isActive && !isPartyMember ? 'border-yellow-400' : ''}
        ${isActive && isPartyMember ? 'border-yellow-400 animate-pulse-active' : 'border-zinc-700/80'}
        ${isSelected ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}
        ${onClick ? 'cursor-pointer hover:border-zinc-500' : ''}
        ${wasJustHit ? 'animate-shake' : ''}
    `;

    const hpColor = isPartyMember ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]";

    const cardContent = (
        <>
            <img src={combatant.portraitUrl} alt={combatant.name} className="w-full h-48 object-cover" />
            <div className="p-4">
                <h3 className="text-xl font-bold text-white truncate" style={{ fontFamily: 'Cinzel, serif' }}>
                    {combatant.name}
                </h3>
                <div className="mt-2">
                    <ProgressBar 
                        value={combatant.hp}
                        max={combatant.maxHp}
                        colorClass={hpColor}
                        variant="thick"
                    />
                </div>
            </div>
        </>
    );

    if (onClick) {
        return <button onClick={onClick} className={cardClasses}>{cardContent}</button>;
    }
    
    return <div className={cardClasses}>{cardContent}</div>;
};

export default CombatantCard;
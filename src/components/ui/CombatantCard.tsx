
import React from 'react';
import { Shield, Droplets } from 'lucide-react';
import type { FC } from 'react';
import type { CombatParticipant } from '../../types';
import ProgressBar from './ProgressBar';

interface CombatantCardProps {
  combatant: CombatParticipant;
  isPartyMember: boolean;
  isActive?: boolean;
  isSelected?: boolean;
  isTargetable?: boolean;
  wasJustHit?: boolean;
  isRetreating?: boolean;
  onClick?: () => void;
}

const CombatantCard: FC<CombatantCardProps> = ({ combatant, isPartyMember, isActive = false, isSelected = false, isTargetable = true, wasJustHit = false, isRetreating = false, onClick }) => {
    const isDead = combatant.hp <= 0;

    const cardClasses = `
        relative w-full bg-zinc-950/80 backdrop-blur-sm rounded-xl border-2 shadow-2xl overflow-hidden transition-all duration-1000
        ${isActive && !isPartyMember ? 'border-yellow-400' : ''}
        ${isActive && isPartyMember ? 'border-yellow-400 animate-pulse-active' : 'border-zinc-700/80'}
        ${isSelected ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}
        ${onClick ? 'cursor-pointer hover:border-zinc-500' : ''}
        ${!isPartyMember && !isTargetable ? 'saturate-50 brightness-75' : ''}
        ${wasJustHit ? 'animate-shake' : ''}
        ${isRetreating ? 'animate-retreat-left pointer-events-none' : ''}
        ${isDead && !isRetreating ? 'opacity-0 grayscale pointer-events-none' : 'opacity-100'}
    `;

    const hpColor = isPartyMember ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]";
    const bleedBadge = (combatant.bleeding ?? 0) > 0;
    const bleedDamagePerTurn = bleedBadge ? Math.ceil((combatant.bleeding ?? 0) / 4) : 0;

    const cardContent = (
        <>
            <img src={combatant.portraitUrl} alt={combatant.name} className="w-full h-48 object-cover" />
            {combatant.defending && (
                <div className="absolute top-2 right-2 bg-zinc-900/80 p-1.5 rounded-full border border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)] z-10 animate-pulse-slow">
                    <Shield size={20} className="text-blue-400" />
                </div>
            )}
            {bleedBadge && (
                <div className="absolute top-2 left-2 bg-zinc-900/85 px-2 py-1 rounded-full border border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.35)] z-10 flex items-center gap-1">
                    <Droplets size={14} className="text-red-400" />
                    <span className="text-[10px] font-black text-red-200">{bleedDamagePerTurn}</span>
                </div>
            )}
            <div className="p-4">
                <h3 className="text-xl font-bold text-white truncate text-center" style={{ fontFamily: 'Cinzel, serif' }}>
                    {combatant.name}
                </h3>
                <div className="mt-2">
                    <ProgressBar 
                        value={combatant.hp}
                        max={combatant.maxHp}
                        colorClass={`${hpColor} ${bleedBadge ? 'animate-bleed-bar' : ''}`}
                        variant="thick"
                    />
                </div>
            </div>
        </>
    );

    const renderedCard = onClick
        ? <button onClick={onClick} className={cardClasses}>{cardContent}</button>
        : <div className={cardClasses}>{cardContent}</div>;

    return (
        <>
            {renderedCard}
            <style>{`
                @keyframes bleed-bar {
                    0%, 100% { filter: brightness(1); }
                    50% { filter: brightness(1.35); }
                }
                .animate-bleed-bar { animation: bleed-bar 1.2s ease-in-out infinite; }
            `}</style>
        </>
    );
};

export default CombatantCard;

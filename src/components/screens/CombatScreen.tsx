

import React, { useRef, useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { Swords, Footprints } from 'lucide-react';
import type { CombatParticipant } from '../../types';
import CombatantCard from '../ui/CombatantCard';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useAudioStore } from '../../stores/useAudioStore';

interface CombatScreenProps {
  party: CombatParticipant[];
  enemies: CombatParticipant[];
  turnOrder: CombatParticipant[];
  activeCharacterId?: string;
  selectedTargetId?: string;
  isPlayerTurn: boolean;
  onSelectTarget: (enemyId: string) => void;
  onAttack: () => void;
  onFlee: () => void;
  combatLog: string[];
}

const TurnOrderTimeline: FC<{ combatants: CombatParticipant[]; activeId?: string }> = ({ combatants, activeId }) => (
    <div className="w-full max-w-4xl p-2 flex justify-center items-center gap-3">
        {combatants.map((c, index) => (
            <div key={`${c.id}-${index}`} className="relative group">
                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-300 ${activeId === c.id ? 'border-yellow-400 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'border-zinc-600'}`}>
                    <img src={c.portraitUrl} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-semibold text-white bg-zinc-900/90 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap backdrop-blur-sm z-20">
                    {c.name}
                </div>
            </div>
        ))}
    </div>
);


const CombatScreen: FC<CombatScreenProps> = ({
  party,
  enemies,
  turnOrder,
  activeCharacterId,
  selectedTargetId,
  isPlayerTurn,
  onSelectTarget,
  onAttack,
  onFlee,
  combatLog
}) => {
    const logEndRef = useRef<HTMLDivElement>(null);
    const [enemyDamageEvents, setEnemyDamageEvents] = useState<{ targetId: string, damage: number, key: number }[]>([]);
    const [partyDamageEvents, setPartyDamageEvents] = useState<{ targetId: string, damage: number, key: number }[]>([]);
    const tutorialActive = useWorldStateStore.getState().getFlag('combat_tutorial_active');
    const prevEnemiesRef = useRef<CombatParticipant[]>(JSON.parse(JSON.stringify(enemies)));
    const prevPartyRef = useRef<CombatParticipant[]>(JSON.parse(JSON.stringify(party)));
    const { sfxEnabled, sfxVolume } = useAudioStore();

    const playSfx = (src: string) => {
        if (sfxEnabled) {
            const audio = new Audio(src);
            audio.volume = sfxVolume;
            audio.play().catch(() => {});
        }
    };

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [combatLog]);
    
    useEffect(() => {
        const newDamageEvents: { targetId: string, damage: number, key: number }[] = [];
        enemies.forEach(currentEnemy => {
            const prevEnemy = prevEnemiesRef.current.find(e => e.id === currentEnemy.id);
            if (prevEnemy && prevEnemy.hp > currentEnemy.hp) {
                const damage = prevEnemy.hp - currentEnemy.hp;
                newDamageEvents.push({ targetId: currentEnemy.id, damage, key: Date.now() + Math.random() });
            }
        });

        if (newDamageEvents.length > 0) {
            setEnemyDamageEvents(prev => [...prev, ...newDamageEvents]);
            newDamageEvents.forEach(event => {
                setTimeout(() => {
                    setEnemyDamageEvents(currentEvents => currentEvents.filter(e => e.key !== event.key));
                }, 1000); // Animation duration is 1s
            });
        }
        
        // Deep copy for accurate comparison next render
        prevEnemiesRef.current = JSON.parse(JSON.stringify(enemies));
    }, [enemies]);

    useEffect(() => {
        const newDamageEvents: { targetId: string, damage: number, key: number }[] = [];
        let tookDamage = false;
        party.forEach(currentMember => {
            const prevMember = prevPartyRef.current.find(e => e.id === currentMember.id);
            if (prevMember && prevMember.hp > currentMember.hp) {
                const damage = prevMember.hp - currentMember.hp;
                newDamageEvents.push({ targetId: currentMember.id, damage, key: Date.now() + Math.random() });
                tookDamage = true;
            }
        });

        if (tookDamage) {
            playSfx('/assets/sfx/combat_sword_swing.mp3');
        }

        if (newDamageEvents.length > 0) {
            setPartyDamageEvents(prev => [...prev, ...newDamageEvents]);
            newDamageEvents.forEach(event => {
                setTimeout(() => {
                    setPartyDamageEvents(currentEvents => currentEvents.filter(e => e.key !== event.key));
                }, 1000);
            });
        }

        prevPartyRef.current = JSON.parse(JSON.stringify(party));
    }, [party]);

    // Use the provided turnOrder from the combat store instead of creating our own
    /*const turnOrder = useMemo(() => {
        // Simple alternating turn order for the demo
        const order: Combatant[] = [];
        const maxLength = Math.max(party.length, enemies.length);
        for (let i = 0; i < maxLength; i++) {
            if (party[i]) order.push(party[i]);
            if (enemies[i]) order.push(enemies[i]);
        }
        return order;
    }, [party, enemies]);*/
    
    const CombatActionButton: FC<{ icon: React.ReactNode; text: string; onClick: () => void; disabled?: boolean }> = ({ icon, text, onClick, disabled }) => (
        <button
            onClick={() => {
                if (text === 'Attack' && !disabled) playSfx('/assets/sfx/combat_punch.mp3');
                onClick();
            }}
            disabled={disabled}
            className={`flex items-center justify-center gap-2 w-full max-w-[140px] px-4 py-3 bg-zinc-800/80 border ${text === 'Attack' && tutorialActive ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'border-zinc-700'} rounded-lg transition-all duration-300 hover:enabled:bg-zinc-700/60 hover:enabled:${text === 'Attack' && tutorialActive ? 'border-yellow-300' : 'border-zinc-600'} disabled:opacity-50 disabled:cursor-not-allowed group`}
        >
            <div className="text-zinc-300 group-hover:enabled:text-white transition-colors">{icon}</div>
            <span className="font-semibold text-sm text-white/90">{text}</span>
        </button>
    );
    
  return (
    <div className="w-full h-full flex flex-col relative">
            {/* Main Combat Area */}
            <main className="flex-grow flex flex-col lg:flex-row items-center justify-around p-4 md:p-8">
                {/* Party Column */}
                <div className="w-full max-w-xl grid gap-4 lg:gap-8 mb-8 lg:mb-0" style={{ gridTemplateColumns: `repeat(${Math.min(2, party.length)}, minmax(0, 1fr))` }}>
                    {party.map(member => (
                        <div key={member.id} className="relative w-full">
                             <CombatantCard
                                combatant={member}
                                isPartyMember={true}
                                isActive={member.id === activeCharacterId}
                                wasJustHit={partyDamageEvents.some(e => e.targetId === member.id)}
                             />
                            {partyDamageEvents.filter(e => e.targetId === member.id).map(event => (
                                <div key={event.key} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-red-500 animate-float-up" style={{textShadow: '0 0 8px rgba(255, 255, 255, 0.7)'}}>
                                  {event.damage}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Enemies Grid */}
                <div className={`grid gap-4 lg:gap-6 w-full max-w-xl ${tutorialActive ? 'ring-2 ring-yellow-400 rounded-lg p-2' : ''}`} style={{ gridTemplateColumns: `repeat(${Math.min(2, enemies.length)}, minmax(0, 1fr))` }}>
                    {enemies.map(enemy => (
                         <div key={enemy.id} className="relative">
                            <CombatantCard
                                combatant={enemy}
                                isPartyMember={false}
                                isSelected={enemy.id === selectedTargetId}
                                onClick={() => onSelectTarget(enemy.id)}
                                wasJustHit={enemyDamageEvents.some(e => e.targetId === enemy.id)}
                            />
                            {enemyDamageEvents.filter(e => e.targetId === enemy.id).map(event => (
                                <div key={event.key} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-red-500 animate-float-up" style={{textShadow: '0 0 8px rgba(255, 255, 255, 0.7)'}}>
                                  {event.damage}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </main>

            {/* Bottom Command Panel */}
            <footer className="flex-shrink-0 w-full bg-zinc-950/90 backdrop-blur-sm border-t border-zinc-700 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    
                    {/* Combat Log */}
                    <div className="md:col-span-1 h-32 bg-black/30 rounded-lg p-2 flex flex-col border border-zinc-800 order-3 md:order-1">
                        <div className="overflow-y-auto custom-scrollbar pr-2 flex-grow">
                            {combatLog.map((entry, index) => (
                                <p key={index} className="text-sm text-zinc-300 mb-1">{entry}</p>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                    
                    {/* Turn Indicator & Timeline */}
                    <div className="md:col-span-1 text-center font-bold tracking-wider order-1 md:order-2 flex flex-col items-center">
                        <h3 className={`text-xl transition-opacity duration-300 mb-2 ${isPlayerTurn ? 'text-blue-400' : 'text-red-400'}`}>
                            {isPlayerTurn ? "PLAYER'S TURN" : "ENEMY'S TURN"}
                        </h3>
                        <TurnOrderTimeline combatants={turnOrder} activeId={activeCharacterId} />
                    </div>

                    {/* Action Buttons */}
                    <div className="md:col-span-1 flex justify-center md:justify-end gap-2 order-2 md:order-3">
                        <CombatActionButton icon={<Swords size={20} />} text="Attack" onClick={onAttack} disabled={!isPlayerTurn || !selectedTargetId} />
                        <CombatActionButton icon={<Footprints size={20} />} text="Flee" onClick={onFlee} disabled={!isPlayerTurn} />
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CombatScreen;

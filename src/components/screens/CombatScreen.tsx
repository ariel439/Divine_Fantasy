

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
    <div className="w-full max-w-4xl p-4 flex justify-center items-center gap-4 bg-zinc-950/50 backdrop-blur-xl rounded-full border border-zinc-800/50 shadow-2xl relative overflow-hidden">
        {/* Top glass accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />
        
        {combatants.map((c, index) => {
            const isDead = c.hp <= 0;
            return (
                <div key={`${c.id}-${index}`} className={`relative group transition-all duration-1000 ${isDead ? 'opacity-20 grayscale scale-90' : 'opacity-100'}`}>
                    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all duration-500 ${activeId === c.id ? 'border-zinc-100 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-zinc-700'}`}>
                        <img src={c.portraitUrl} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                    {activeId === c.id && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-zinc-100 rounded-full animate-pulse shadow-[0_0_10px_white]" />
                    )}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-zinc-950/90 rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap backdrop-blur-md z-20 border border-zinc-800">
                        {c.name}
                    </div>
                </div>
            );
        })}
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
    const [displayedEnemies, setDisplayedEnemies] = useState<CombatParticipant[]>(enemies);
    const [enemyDamageEvents, setEnemyDamageEvents] = useState<{ targetId: string, damage: number, key: number }[]>([]);
    const [partyDamageEvents, setPartyDamageEvents] = useState<{ targetId: string, damage: number, key: number }[]>([]);
    const [soloEnemyFocusId, setSoloEnemyFocusId] = useState<string | null>(null);
    const tutorialActive = useWorldStateStore.getState().getFlag('combat_tutorial_active');
    const prevEnemiesRef = useRef<CombatParticipant[]>(JSON.parse(JSON.stringify(enemies)));
    const previousAliveEnemiesRef = useRef<CombatParticipant[]>(JSON.parse(JSON.stringify(enemies)));
    const prevPartyRef = useRef<CombatParticipant[]>(JSON.parse(JSON.stringify(party)));
    const previousEnemyCountRef = useRef(enemies.length);
    const { sfxEnabled, sfxVolume } = useAudioStore();

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [combatLog]);

    useEffect(() => {
        const previousAliveEnemies = previousAliveEnemiesRef.current;
        const removedEnemies = previousAliveEnemies.filter(
            (enemy) => !enemies.some((aliveEnemy) => aliveEnemy.id === enemy.id)
        );

        if (removedEnemies.length === 0) {
            setDisplayedEnemies(enemies);
            previousAliveEnemiesRef.current = JSON.parse(JSON.stringify(enemies));
            return;
        }

        const nextDisplayedEnemies = previousAliveEnemies.map((enemy) => {
            const aliveVersion = enemies.find((aliveEnemy) => aliveEnemy.id === enemy.id);
            return aliveVersion ? aliveVersion : { ...enemy, hp: 0 };
        });

        setDisplayedEnemies(nextDisplayedEnemies);

        const timer = setTimeout(() => {
            setDisplayedEnemies(enemies);
            previousAliveEnemiesRef.current = JSON.parse(JSON.stringify(enemies));
        }, 700);

        return () => clearTimeout(timer);
    }, [enemies]);

    useEffect(() => {
        const previousEnemyCount = previousEnemyCountRef.current;
        if (previousEnemyCount > 1 && enemies.length === 1) {
            setSoloEnemyFocusId(enemies[0]?.id || null);
            const timer = setTimeout(() => setSoloEnemyFocusId(null), 700);
            previousEnemyCountRef.current = enemies.length;
            return () => clearTimeout(timer);
        }

        previousEnemyCountRef.current = enemies.length;
    }, [enemies]);
    
    useEffect(() => {
        const newDamageEvents: { targetId: string, damage: number, key: number }[] = [];
        displayedEnemies.forEach(currentEnemy => {
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
        prevEnemiesRef.current = JSON.parse(JSON.stringify(displayedEnemies));
    }, [displayedEnemies]);

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
            // SFX handled by CombatManager
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
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-center gap-3 w-full max-w-[160px] px-6 py-3 bg-zinc-950/50 backdrop-blur-md border ${text === 'Attack' && tutorialActive ? 'border-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-zinc-800/50'} rounded-xl transition-all duration-500 hover:enabled:bg-white/10 hover:enabled:border-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed group active:scale-95`}
        >
            <div className="text-zinc-400 group-hover:enabled:text-zinc-100 transition-colors">{icon}</div>
            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-white/90">{text}</span>
        </button>
    );
    
  const activeParticipant = party.find(p => p.id === activeCharacterId);
    const isCompanionTurn = activeParticipant?.isCompanion;
    const enemyColumnCount = Math.min(2, displayedEnemies.length);
    const enemyCardWrapperClass =
        displayedEnemies.length === 1
            ? 'w-full max-w-sm'
            : displayedEnemies.length === 2
                ? 'w-full max-w-sm justify-self-center'
                : 'w-full';

  return (
    <div className="w-full h-full flex flex-col relative bg-zinc-950">
            {/* Background Layer with blur */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 blur-md" style={{ backgroundImage: `url(/assets/backgrounds/minimal_bg.png)` }} />
            
            {/* Main Combat Area */}
            <main className="relative z-10 flex-grow flex flex-col lg:flex-row items-center justify-around p-4 md:p-8 transition-all duration-500 ease-out">
                {/* Party Column */}
                <div className="flex flex-col gap-6 w-full lg:w-1/3 items-center transition-all duration-500 ease-out">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2">Vanguard</h3>
                    {party.map(member => (
                        <div key={member.id} className="relative w-full max-w-sm transition-all duration-500 ease-out">
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
                <div className="flex flex-col gap-6 w-full lg:w-1/3 items-center transition-all duration-500 ease-out">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/70 mb-2">Adversaries</h3>
                    <div className={`grid gap-4 lg:gap-6 w-full transition-all duration-500 ease-out ${tutorialActive ? 'ring-2 ring-yellow-400 rounded-lg p-2' : ''}`} style={{ gridTemplateColumns: `repeat(${Math.min(2, displayedEnemies.length)}, minmax(0, 1fr))` }}>
                        {displayedEnemies.map(enemy => (
                            <div
                                key={enemy.id}
                                className={`relative transition-all duration-500 ease-out ${enemyCardWrapperClass} ${enemyColumnCount === 1 ? 'mx-auto' : ''} ${soloEnemyFocusId === enemy.id ? 'scale-[1.03]' : ''}`}
                            >
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
                </div>
            </main>

            {/* Bottom Command Panel - Cinematic & Minimalist */}
            <footer className="relative z-20 flex-shrink-0 w-full h-[25vh] bg-zinc-950/50 backdrop-blur-2xl border-t border-zinc-800/50 p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                {/* Top glass accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />

                <div className="w-full max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center h-full">
                    
                    {/* Combat Log */}
                    <div className="md:col-span-1 h-full flex flex-col order-3 md:order-1 min-h-0">
                        <div className="flex items-center gap-2 mb-3 text-zinc-500 flex-shrink-0">
                            <Swords size={12} className="animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Battle Chronicle</span>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-2 font-light italic text-sm text-zinc-300 min-h-0">
                            {combatLog.map((entry, index) => (
                                <div key={index} className="animate-fade-in-up border-l border-zinc-800/50 pl-4 py-1">
                                    {entry}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                    
                    {/* Turn Indicator & Timeline */}
                    <div className="md:col-span-1 text-center font-bold tracking-wider order-1 md:order-2 flex flex-col items-center justify-center">
                        <div className="mb-4">
                            <span className={`text-[10px] font-black uppercase tracking-[0.4em] px-4 py-1 rounded-full border ${
                                isCompanionTurn ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5' : 
                                (isPlayerTurn ? 'text-zinc-100 border-zinc-100/30 bg-zinc-100/5' : 'text-red-400 border-red-400/30 bg-red-400/5')
                            }`}>
                                {isCompanionTurn ? "Companion's Initiative" : (isPlayerTurn ? "Player's Initiative" : "Enemy's Initiative")}
                            </span>
                        </div>
                        <TurnOrderTimeline combatants={turnOrder} activeId={activeCharacterId} />
                    </div>

                    {/* Action Buttons */}
                    <div className="md:col-span-1 flex flex-col justify-center items-center md:items-end gap-4 order-2 md:order-3">
                         <div className="flex items-center gap-3 text-zinc-500 mb-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Command Matrix</span>
                        </div>
                        <div className="flex gap-4">
                            <CombatActionButton icon={<Swords size={18} />} text="Attack" onClick={onAttack} disabled={!isPlayerTurn || isCompanionTurn || !selectedTargetId} />
                            <CombatActionButton icon={<Footprints size={18} />} text="Flee" onClick={onFlee} disabled={!isPlayerTurn || isCompanionTurn} />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CombatScreen;

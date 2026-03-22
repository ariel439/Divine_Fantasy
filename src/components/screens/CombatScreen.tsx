
import React, { useRef, useEffect, useState } from 'react';
import type { FC } from 'react';
import { Swords, Footprints } from 'lucide-react';
import type { CombatParticipant } from '../../types';
import CombatantCard from '../ui/CombatantCard';
import { useWorldStateStore } from '../../stores/useWorldStateStore';

interface CombatScreenProps {
  party: CombatParticipant[];
  enemies: CombatParticipant[];
  turnOrder: CombatParticipant[];
  activeCharacterId?: string;
  selectedTargetId?: string;
  targetableEnemyIds: string[];
  thunderStrikeIds: string[];
  isPlayerTurn: boolean;
  onSelectTarget: (enemyId: string) => void;
  onAttack: () => void;
  onFlee: () => void;
  combatLog: string[];
}

type ThunderPoint = { x: number; y: number };
type ThunderPath = { id: string; d: string; delay: number };

const createLightningPath = (start: ThunderPoint, end: ThunderPoint, seedOffset: number) => {
    const segments = 10;
    const points: ThunderPoint[] = [start];

    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const drift = Math.sin((t + seedOffset) * Math.PI * 4) * (28 - t * 16);
        points.push({
            x: start.x + (end.x - start.x) * t + drift,
            y: start.y + (end.y - start.y) * t + Math.cos((t + seedOffset) * Math.PI * 2) * 4,
        });
    }

    points.push(end);

    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
};

const ThunderOverlay: FC<{
    width: number;
    height: number;
    paths: ThunderPath[];
    flashActive: boolean;
}> = ({ width, height, paths, flashActive }) => {
    if (width === 0 || height === 0 || paths.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
            {flashActive && (
                <>
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-cyan-200/10 to-transparent animate-pulse" />
                </>
            )}
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
            >
                <defs>
                    <filter id="thunder-glow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {paths.map((path) => (
                    <g key={path.id}>
                        <path d={path.d} fill="none" stroke="rgba(34,211,238,0.42)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#thunder-glow)" className="animate-thunder-bolt" style={{ animationDelay: `${path.delay}ms` }} />
                        <path d={path.d} fill="none" stroke="rgba(250,204,21,0.78)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#thunder-glow)" className="animate-thunder-bolt" style={{ animationDelay: `${path.delay + 20}ms` }} />
                        <path d={path.d} fill="none" stroke="rgba(255,255,255,0.98)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="animate-thunder-bolt" style={{ animationDelay: `${path.delay + 35}ms` }} />
                    </g>
                ))}
            </svg>
        </div>
    );
};

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
  targetableEnemyIds,
  thunderStrikeIds,
  isPlayerTurn,
  onSelectTarget,
  onAttack,
  onFlee,
  combatLog
}) => {
    const logEndRef = useRef<HTMLDivElement>(null);
    const enemyBoardRef = useRef<HTMLDivElement>(null);
    const enemySlotRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const lastThunderSignatureRef = useRef<string>('');
    const previousEnemyFormationRef = useRef<{ hadFrontAlive: boolean; frontIds: string[]; backIds: string[] }>({ hadFrontAlive: false, frontIds: [], backIds: [] });
    const [displayedEnemies, setDisplayedEnemies] = useState<CombatParticipant[]>(enemies);
    const [enemyDamageEvents, setEnemyDamageEvents] = useState<{ targetId: string, damage: number, key: number }[]>([]);
    const [partyDamageEvents, setPartyDamageEvents] = useState<{ targetId: string, damage: number, key: number }[]>([]);
    const [thunderPaths, setThunderPaths] = useState<ThunderPath[]>([]);
    const [thunderBounds, setThunderBounds] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [thunderFlashActive, setThunderFlashActive] = useState(false);
    const [boardShakeActive, setBoardShakeActive] = useState(false);
    const [promotedEnemyIds, setPromotedEnemyIds] = useState<string[]>([]);
    const tutorialActive = useWorldStateStore.getState().getFlag('combat_tutorial_active');
    const prevEnemiesRef = useRef<CombatParticipant[]>(JSON.parse(JSON.stringify(enemies)));
    const previousAliveEnemiesRef = useRef<CombatParticipant[]>(JSON.parse(JSON.stringify(enemies)));
    const prevPartyRef = useRef<CombatParticipant[]>(JSON.parse(JSON.stringify(party)));

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [combatLog]);

    useEffect(() => {
        const signature = thunderStrikeIds.join('|');
        if (thunderStrikeIds.length === 0) {
            setThunderPaths([]);
            setThunderFlashActive(false);
            lastThunderSignatureRef.current = '';
            return;
        }
        if (lastThunderSignatureRef.current === signature) return;
        lastThunderSignatureRef.current = signature;

        const boardEl = enemyBoardRef.current;
        if (!boardEl) return;

        const boardRect = boardEl.getBoundingClientRect();
        if (boardRect.width === 0 || boardRect.height === 0) return;

        const source = {
            x: boardRect.width * 0.5,
            y: Math.max(8, boardRect.height * 0.04),
        };

        const nextPaths: ThunderPath[] = thunderStrikeIds.flatMap((targetId, index) => {
            const slotEl = enemySlotRefs.current[targetId];
            if (!slotEl) return [];

            const slotRect = slotEl.getBoundingClientRect();
            const target = {
                x: slotRect.left - boardRect.left + slotRect.width * 0.5,
                y: slotRect.top - boardRect.top + slotRect.height * 0.45,
            };

            return [
                {
                    id: `${targetId}-main`,
                    d: createLightningPath(source, target, index * 0.17 + 0.05),
                    delay: index * 35,
                },
                {
                    id: `${targetId}-branch`,
                    d: createLightningPath(
                        { x: source.x + (index % 2 === 0 ? -18 : 22), y: source.y + 14 },
                        { x: target.x + (index % 2 === 0 ? 14 : -12), y: target.y - 10 },
                        index * 0.11 + 0.24
                    ),
                    delay: index * 35 + 45,
                },
            ];
        });

        setThunderBounds({ width: boardRect.width, height: boardRect.height });
        setThunderFlashActive(true);
        setBoardShakeActive(true);
        setThunderPaths(nextPaths);

        const flashTimer = setTimeout(() => setThunderFlashActive(false), 180);
        const shakeTimer = setTimeout(() => setBoardShakeActive(false), 280);
        const cleanupTimer = setTimeout(() => setThunderPaths([]), 520);

        return () => {
            clearTimeout(flashTimer);
            clearTimeout(shakeTimer);
            clearTimeout(cleanupTimer);
        };
    }, [thunderStrikeIds]);

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
        const currentFrontIds = enemies.filter((enemy) => enemy.combatRow === 'front').map((enemy) => enemy.id);
        const currentBackIds = enemies.filter((enemy) => enemy.combatRow === 'back').map((enemy) => enemy.id);
        const currentHasFrontAlive = enemies.some((enemy) => enemy.combatRow === 'front' && enemy.hp > 0);
        const previous = previousEnemyFormationRef.current;

        if (previous.hadFrontAlive && !currentHasFrontAlive && currentBackIds.length > 0) {
            setPromotedEnemyIds(currentBackIds);
            const timer = setTimeout(() => setPromotedEnemyIds([]), 650);
            previousEnemyFormationRef.current = {
                hadFrontAlive: currentHasFrontAlive,
                frontIds: currentFrontIds,
                backIds: currentBackIds,
            };
            return () => clearTimeout(timer);
        }

        previousEnemyFormationRef.current = {
            hadFrontAlive: currentHasFrontAlive,
            frontIds: currentFrontIds,
            backIds: currentBackIds,
        };
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
    const buildFormation = (combatants: CombatParticipant[]) => {
        const aliveFront = combatants.filter((c) => c.hp > 0 && c.combatRow === 'front');
        const hasAnyFront = combatants.some((c) => c.combatRow === 'front');
        const frontSource = hasAnyFront
            ? combatants.filter((c) => c.combatRow === 'front')
            : combatants.filter((c) => c.combatRow === 'back');
        const backSource = hasAnyFront ? combatants.filter((c) => c.combatRow === 'back') : [];

        const orderedFront = [...frontSource].sort((a, b) => (a.combatSlot ?? 0) - (b.combatSlot ?? 0));
        const orderedBack = [...backSource].sort((a, b) => (a.combatSlot ?? 0) - (b.combatSlot ?? 0));

        return {
            front: [orderedFront[0] || null, orderedFront[1] || null],
            back: [orderedBack[0] || null, orderedBack[1] || null],
        };
    };

    const partyFormation = buildFormation(party);
    const enemyFormation = buildFormation(displayedEnemies);

    const renderSlot = (
        combatant: CombatParticipant | null,
        side: 'party' | 'enemy',
        key: string,
        depth: 'front' | 'back'
    ) => {
        const damageEvents = side === 'party' ? partyDamageEvents : enemyDamageEvents;
        const isTargetable = combatant ? targetableEnemyIds.includes(combatant.id) : false;
        const isSelected = combatant ? combatant.id === selectedTargetId : false;
        const canClickEnemy = side === 'enemy' && combatant && isTargetable;
        const isThunderStruck = combatant ? thunderStrikeIds.includes(combatant.id) : false;
        const isPromoted = combatant ? promotedEnemyIds.includes(combatant.id) : false;

        return (
            <div
                key={key}
                ref={(node) => {
                    if (side === 'enemy' && combatant) {
                        enemySlotRefs.current[combatant.id] = node;
                    }
                }}
                className={`relative w-full max-w-sm transition-all duration-700 ease-out ${depth === 'back' ? 'scale-95 opacity-80 translate-y-2' : 'translate-y-0'} ${side === 'enemy' && isPromoted && depth === 'front' ? 'animate-row-promote' : ''}`}
            >
                {combatant ? (
                    <>
                        <CombatantCard
                            combatant={combatant}
                            isPartyMember={side === 'party'}
                            isActive={combatant.id === activeCharacterId}
                            isSelected={isSelected}
                            isTargetable={side === 'enemy' ? isTargetable : true}
                            onClick={canClickEnemy ? () => onSelectTarget(combatant.id) : undefined}
                            wasJustHit={damageEvents.some(e => e.targetId === combatant.id)}
                        />
                        {isThunderStruck && combatant.hp > 0 && (
                            <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-cyan-200/10 to-amber-200/18 animate-pulse" />
                                <div className="absolute inset-0 border border-cyan-100/65 shadow-[0_0_22px_rgba(255,255,255,0.25),0_0_34px_rgba(34,211,238,0.22),0_0_44px_rgba(250,204,21,0.18)] rounded-xl" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.35),transparent_62%)]" />
                            </div>
                        )}
                        {side === 'enemy' && !isTargetable && combatant.hp > 0 && (
                            <div className="absolute inset-0 rounded-xl bg-black/45 border border-zinc-800/60 flex items-center justify-center pointer-events-none">
                                <span className="px-3 py-1 rounded-full bg-zinc-950/90 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 border border-zinc-700/70">
                                    Front Line Blocks
                                </span>
                            </div>
                        )}
                        {damageEvents.filter(e => e.targetId === combatant.id).map(event => (
                            <div key={event.key} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold animate-float-up ${isThunderStruck ? 'text-yellow-100' : 'text-red-500'}`} style={{textShadow: isThunderStruck ? '0 0 10px rgba(255,255,255,0.95), 0 0 18px rgba(34,211,238,0.85), 0 0 26px rgba(250,204,21,0.75)' : '0 0 8px rgba(255, 255, 255, 0.7)'}}>
                                {event.damage}
                            </div>
                        ))}
                    </>
                ) : (
                    <div className={`w-full h-[280px] rounded-xl border border-dashed ${depth === 'front' ? 'border-zinc-800/70' : 'border-zinc-900/70'} bg-black/15`} />
                )}
            </div>
        );
    };

  return (
    <div className="w-full h-full flex flex-col relative bg-zinc-950">
            <style>{`
                @keyframes thunderBolt {
                    0% { opacity: 0; stroke-dasharray: 12 220; stroke-dashoffset: 120; }
                    20% { opacity: 1; stroke-dasharray: 220 0; stroke-dashoffset: 0; }
                    60% { opacity: 1; }
                    100% { opacity: 0; stroke-dasharray: 220 0; stroke-dashoffset: -18; }
                }
                @keyframes boardShake {
                    0%, 100% { transform: translate3d(0, 0, 0); }
                    20% { transform: translate3d(-6px, 1px, 0); }
                    40% { transform: translate3d(5px, -2px, 0); }
                    60% { transform: translate3d(-3px, 2px, 0); }
                    80% { transform: translate3d(2px, -1px, 0); }
                }
                @keyframes rowPromote {
                    0% { transform: translate3d(32px, 6px, 0) scale(0.95); opacity: 0.75; }
                    100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
                }
                .animate-thunder-bolt {
                    animation: thunderBolt 300ms ease-out forwards;
                }
                .animate-board-shake {
                    animation: boardShake 260ms ease-out;
                }
                .animate-row-promote {
                    animation: rowPromote 420ms ease-out;
                }
            `}</style>
            {/* Background Layer with blur */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 blur-md" style={{ backgroundImage: `url(/assets/backgrounds/minimal_bg.png)` }} />
            
            {/* Main Combat Area */}
            <main className="relative z-10 flex-grow flex flex-col lg:flex-row items-center justify-around p-4 md:p-8 transition-all duration-500 ease-out">
                {/* Party Column */}
                <div className="flex flex-col gap-6 w-full lg:w-1/3 items-center transition-all duration-500 ease-out">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2">Vanguard</h3>
                    <div className="grid grid-cols-2 gap-4 lg:gap-6 w-full">
                        {renderSlot(partyFormation.back[0], 'party', 'party-back-0', 'back')}
                        {renderSlot(partyFormation.front[0], 'party', 'party-front-0', 'front')}
                        {renderSlot(partyFormation.back[1], 'party', 'party-back-1', 'back')}
                        {renderSlot(partyFormation.front[1], 'party', 'party-front-1', 'front')}
                    </div>
                </div>

                {/* Enemies Grid */}
                <div className="flex flex-col gap-6 w-full lg:w-1/3 items-center transition-all duration-500 ease-out">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/70 mb-2">Adversaries</h3>
                    <div
                        ref={enemyBoardRef}
                        className={`relative grid grid-cols-2 gap-4 lg:gap-6 w-full transition-all duration-500 ease-out ${tutorialActive ? 'ring-2 ring-yellow-400 rounded-lg p-2' : ''} ${boardShakeActive ? 'animate-board-shake' : ''}`}
                    >
                        <ThunderOverlay
                            width={thunderBounds.width}
                            height={thunderBounds.height}
                            paths={thunderPaths}
                            flashActive={thunderFlashActive}
                        />
                        {renderSlot(enemyFormation.front[0], 'enemy', 'enemy-front-0', 'front')}
                        {renderSlot(enemyFormation.back[0], 'enemy', 'enemy-back-0', 'back')}
                        {renderSlot(enemyFormation.front[1], 'enemy', 'enemy-front-1', 'front')}
                        {renderSlot(enemyFormation.back[1], 'enemy', 'enemy-back-1', 'back')}
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

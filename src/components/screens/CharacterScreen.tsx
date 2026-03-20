

import React from 'react';
import type { FC } from 'react';
import { Axe, Fish, ChefHat, Hammer, Smile, Angry, Sword, Wind, Shield, Zap, Brain, Sparkles, User, Heart, Utensils, MessageSquare, ArrowLeft, BookOpen, ScrollText } from 'lucide-react';
import { getDescriptiveAttributeLabel, getDescriptiveSkillLabel } from '../../data';
import Stat from '../ui/Stat';
import ProgressBar from '../ui/ProgressBar';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useSkillStore } from '../../stores/useSkillStore';
import { useUIStore } from '../../stores/useUIStore';
import { getIntimidationSummary, getPresentationSummary } from '../../utils/socialPresentation';

const AttributeIcon = ({ label }: { label: string }) => {
    switch (label.toLowerCase()) {
        case 'strength': return <Shield size={16} className="text-red-400" />;
        case 'dexterity': return <Zap size={16} className="text-yellow-400" />;
        case 'intelligence': return <Brain size={16} className="text-blue-400" />;
        case 'charisma': return <User size={16} className="text-pink-400" />;
        default: return <Shield size={16} />;
    }
};

const StatusCard: FC<{ label: string, value: number, max: number, icon: React.ReactNode, colorClass: string }> = ({ label, value, max, icon, colorClass }) => (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-4 rounded-xl flex flex-col gap-3 group hover:border-zinc-700/50 transition-all">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                {icon}
                <span className="text-xs font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-sm font-mono text-zinc-300">{value} / {max}</span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-zinc-800/30">
            <div 
                className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
                style={{ width: `${(value / max) * 100}%` }}
            />
        </div>
    </div>
);

const CharacterPortrait: FC<{ characterData: any }> = ({ characterData }) => (
    <div className="flex flex-col gap-6">
        <div className="relative group">
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-700/50 shadow-2xl relative">
                <img src={characterData.image} alt={characterData.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <StatusCard label="Health" value={characterData.hp} max={100} icon={<Heart size={14} />} colorClass="bg-red-500" />
            <StatusCard label="Energy" value={characterData.energy} max={100} icon={<Zap size={14} />} colorClass="bg-blue-500" />
            <StatusCard label="Hunger" value={characterData.hunger} max={100} icon={<Utensils size={14} />} colorClass="bg-orange-500" />
            <StatusCard label="Social" value={characterData.socialEnergy} max={characterData.maxSocialEnergy} icon={<MessageSquare size={14} />} colorClass="bg-purple-500" />
        </div>
    </div>
);

const CharacterScreen: FC = () => {
    const { setScreen } = useUIStore();
    const { attributes, hp, energy, hunger, socialEnergy, maxSocialEnergy, bio } = useCharacterStore();
    const { skills, getSkillLevel } = useSkillStore();
    const presentation = getPresentationSummary();
    const intimidation = getIntimidationSummary();

    const characterData = {
        name: bio?.name || 'Unknown',
        image: bio?.image || 'https://i.imgur.com/gUNzyBA.jpeg',
        bio: {
            gender: bio?.gender || 'Unknown',
            race: bio?.race || 'Unknown',
            birthplace: bio?.birthplace || 'Unknown',
            born: bio?.born || 'Unknown',
        },
        hp: Math.floor(hp),
        energy: Math.floor(energy),
        hunger: Math.floor(hunger),
        socialEnergy: Math.floor(socialEnergy),
        maxSocialEnergy,
        attributes: {
            strength: attributes.strength,
            dexterity: attributes.dexterity,
            intelligence: attributes.intelligence,
            charisma: attributes.charisma
        },
        skills: [
            { name: 'Attack', level: getSkillLevel('attack'), icon: <Sword size={18} /> },
            { name: 'Defense', level: getSkillLevel('defense'), icon: <Shield size={18} /> },
            { name: 'Agility', level: getSkillLevel('agility'), icon: <Wind size={18} /> },
            { name: 'Woodcutting', level: getSkillLevel('woodcutting'), icon: <Axe size={18} /> },
            { name: 'Fishing', level: getSkillLevel('fishing'), icon: <Fish size={18} /> },
            { name: 'Cooking', level: getSkillLevel('cooking'), icon: <ChefHat size={18} /> },
            { name: 'Carpentry', level: getSkillLevel('carpentry'), icon: <Hammer size={18} /> },
            { name: 'Crafting', level: getSkillLevel('crafting'), icon: <Hammer size={18} /> },
            { name: 'Persuasion', level: getSkillLevel('persuasion'), icon: <Smile size={18} /> },
            { name: 'Coercion', level: getSkillLevel('coercion'), icon: <Angry size={18} /> },
        ]
    };

    return (
        <div className="relative w-screen h-screen bg-zinc-950 flex flex-col overflow-hidden">
            {/* Background Layer */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 blur-sm" style={{ backgroundImage: `url(/assets/backgrounds/minimal_bg.png)` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full h-[7vh] min-h-[56px] px-8 flex justify-between items-center border-b border-zinc-800/50 backdrop-blur-xl shrink-0">
                <button 
                    onClick={() => setScreen('inGame')} 
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all group px-4 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-zinc-800"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-widest uppercase text-[10px]">Resume Game</span>
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-white tracking-[0.3em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                        Character Sheet
                    </h1>
                </div>
                <div className="w-32"></div> {/* Spacer for symmetry */}
            </header>

            {/* Main Content Area - Symmetrical Layout */}
            <div className="relative z-10 w-full h-[86vh] flex flex-col lg:flex-row gap-6 p-4 lg:p-6 items-stretch overflow-hidden">
                
                {/* Column 1: Portrait & Stats */}
                <div className="w-full lg:w-[25vw] max-w-[450px] h-full overflow-y-auto custom-scrollbar flex-shrink-0 pr-2">
                    <CharacterPortrait characterData={characterData} />
                </div>

                {/* Column 2: Details Grid */}
                <div className="flex-grow h-full overflow-y-auto custom-scrollbar space-y-6 pr-4">
                    
                    {/* Character Identity & Bio */}
                    <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 shadow-2xl animate-fade-in-up">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-2.5 bg-zinc-800 rounded-xl text-zinc-400">
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-wider" style={{ fontFamily: 'Cinzel, serif' }}>{characterData.name}</h2>
                                <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em] mt-1">The Wanderer of Whispers</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-6">
                            <Stat label="Gender" value={characterData.bio.gender} icon={<User size={12} className="text-zinc-500" />} />
                            <Stat label="Race" value={characterData.bio.race} icon={<Sparkles size={12} className="text-zinc-500" />} />
                            <Stat label="Birthplace" value={characterData.bio.birthplace} icon={<ScrollText size={12} className="text-zinc-500" />} />
                            <Stat label="Born" value={characterData.bio.born} icon={<BookOpen size={12} className="text-zinc-500" />} />
                            <Stat label="Presentation" value={`${presentation.label} (${presentation.score >= 0 ? '+' : ''}${presentation.score})`} icon={<MessageSquare size={12} className="text-zinc-500" />} />
                            <Stat label="Intimidation" value={`${intimidation.label} (${intimidation.score >= 0 ? '+' : ''}${intimidation.score})`} icon={<Angry size={12} className="text-zinc-500" />} />
                        </div>
                    </div>

                    {/* Attributes Section */}
                    <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 shadow-2xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center gap-3 mb-6 border-b border-zinc-800/50 pb-4">
                            <Sparkles size={18} className="text-zinc-500" />
                            <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-[0.2em]" style={{ fontFamily: 'Cinzel, serif' }}>Core Attributes</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(characterData.attributes).map(([key, value]) => (
                                <div key={key} className="bg-black/20 p-4 rounded-xl border border-zinc-800/30 flex justify-between items-center group hover:border-zinc-700 transition-all">
                                    <div className="flex items-center gap-3">
                                        <AttributeIcon label={key} />
                                        <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">{key}</span>
                                    </div>
                                    <span className="text-zinc-100 font-black text-xs">{getDescriptiveAttributeLabel(key as any, value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skills Grid */}
                    <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-6 shadow-2xl animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <div className="flex items-center gap-3 mb-6 border-b border-zinc-800/50 pb-4">
                            <Sword size={18} className="text-zinc-500" />
                            <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-[0.2em]" style={{ fontFamily: 'Cinzel, serif' }}>Skill Proficiencies</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {characterData.skills.map(skill => (
                                <div key={skill.name} className="bg-black/20 p-4 rounded-xl border border-zinc-800/30 group hover:border-zinc-700/50 transition-all">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500 group-hover:text-zinc-200 transition-colors border border-zinc-800">
                                            {skill.icon}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-end mb-1">
                                                <p className="font-black text-white text-[10px] uppercase tracking-widest">{skill.name}</p>
                                            </div>
                                            <p className="text-xs text-zinc-400 font-medium">{getDescriptiveSkillLabel(skill.level)}</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-1 overflow-hidden border border-zinc-800/30">
                                        <div 
                                            className="h-full bg-gradient-to-r from-zinc-700 to-zinc-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${((skill.level - 1) % 10 + 1) * 10}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Spacer - Critical for clearing LocationNav (7vh to match header) */}
            <div className="h-[7vh] min-h-[56px] shrink-0" />

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
                
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
            `}</style>
        </div>
    );
};

export default CharacterScreen;

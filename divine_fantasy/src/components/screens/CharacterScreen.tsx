

import React from 'react';
import type { FC } from 'react';
// FIX: Replaced non-existent 'Fist' icon with 'Dumbbell' as 'Fist' is not an exported member of 'lucide-react'.
import { Axe, Fish, ChefHat, Hammer, Smile, Angry, Sword, Wind, Shield } from 'lucide-react';
import { getDescriptiveAttributeLabel, getDescriptiveSkillLabel } from '../../data';
import Stat from '../ui/Stat';
import ProgressBar from '../ui/ProgressBar';
import type { Vitals } from '../../types';

const CharacterPortrait: FC<{ characterData: any }> = ({ characterData }) => (
    <>
        <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-zinc-700 shadow-lg">
            <img src={characterData.image} alt={characterData.name} className="w-full h-full object-cover" />
        </div>
        <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-zinc-800">
            <ProgressBar label="HP" value={characterData.vitals.hp.current} max={characterData.vitals.hp.max} colorClass="bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" variant="thick" showText={true} />
            <ProgressBar label="Energy" value={characterData.vitals.energy.current} max={characterData.vitals.energy.max} colorClass="bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]" variant="thick" showText={true} />
            <ProgressBar label="Hunger" value={characterData.vitals.hunger.current} max={characterData.vitals.hunger.max} colorClass="bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]" variant="thick" showText={true} />
        </div>
    </>
);

const CharacterScreen: FC<{ vitals: Vitals }> = ({ vitals }) => {
    // Mock data
    const characterData = {
        name: 'Luke',
        image: 'https://i.imgur.com/gUNzyBA.jpeg',
        bio: {
            gender: 'Male',
            race: 'Human',
            birthplace: 'Driftwatch',
            born: '10th of July, 760',
        },
        vitals: vitals,
        attributes: { strength: 4, dexterity: 6, intelligence: 8, wisdom: 5, charisma: 3 },
        skills: [
            // FIX: Replaced non-existent 'Fist' icon with 'Dumbbell'.
            { name: 'Attack', level: 1, icon: <Sword size={24} /> },
            { name: 'Agility', level: 1, icon: <Wind size={24} /> },
            { name: 'Defence', level: 1, icon: <Shield size={24} /> },
            { name: 'Woodcutting', level: 1, icon: <Axe size={24} /> },
            { name: 'Fishing', level: 1, icon: <Fish size={24} /> },
            { name: 'Cooking', level: 1, icon: <ChefHat size={24} /> },
            { name: 'Carpentry', level: 1, icon: <Hammer size={24} /> },
            { name: 'Charisma', level: 1, icon: <Smile size={24} /> },
            { name: 'Coercion', level: 1, icon: <Angry size={24} /> },
        ]
    };
    
    return (
        <div className="w-full h-full p-8 pt-12 pb-24">
            <div className="w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-8 h-full">
                {/* Column 1: Fixed Portrait for Desktop */}
                <div className="hidden lg:flex flex-col justify-center w-96 flex-shrink-0">
                    <div className="space-y-6">
                        <CharacterPortrait characterData={characterData} />
                    </div>
                </div>
                
                {/* Column 2: Scrollable Content */}
                <div className="lg:flex-grow bg-black/20 rounded-lg border border-zinc-800 overflow-y-auto custom-scrollbar min-h-0">
                    
                    {/* Portrait for Mobile/Tablet */}
                    <div className="lg:hidden p-6 pb-0">
                        <div className="max-w-sm mx-auto space-y-6">
                            <CharacterPortrait characterData={characterData} />
                        </div>
                    </div>

                    <header className="p-6 text-center border-b border-zinc-700">
                        <h2 className="text-5xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>{characterData.name}</h2>
                    </header>
                    <div className="p-6">
                        <div className="space-y-8">
                            {/* Biography Section */}
                            <div>
                                <h3 className="text-2xl font-bold text-zinc-300 mb-4 tracking-wider" style={{ fontFamily: 'Cinzel, serif' }}>Biography</h3>
                                <div className="space-y-2">
                                    <Stat label="Gender" value={characterData.bio.gender} />
                                    <Stat label="Race" value={characterData.bio.race} />
                                    <Stat label="Birthplace" value={characterData.bio.birthplace} />
                                    <Stat label="Born" value={characterData.bio.born} />
                                </div>
                            </div>

                            {/* Attributes Section */}
                            <div>
                                <h3 className="text-2xl font-bold text-zinc-300 mb-4 tracking-wider" style={{ fontFamily: 'Cinzel, serif' }}>Attributes</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {Object.entries(characterData.attributes).map(([key, value]) => (
                                        <Stat 
                                            key={key}
                                            label={key.charAt(0).toUpperCase() + key.slice(1)} 
                                            value={getDescriptiveAttributeLabel(key as keyof typeof characterData.attributes, value)} 
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            {/* Skills Section */}
                            <div>
                                <h3 className="text-2xl font-bold text-zinc-300 mb-4 tracking-wider" style={{ fontFamily: 'Cinzel, serif' }}>Skills</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {characterData.skills.map(skill => (
                                        <div key={skill.name} className="flex items-center gap-4 bg-black/20 p-3 rounded-lg border border-zinc-800">
                                            <div className="p-3 bg-black/30 rounded-md text-zinc-300 border border-zinc-700">
                                                {skill.icon}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white text-lg">{skill.name}</p>
                                                <p className="text-md text-zinc-400">{getDescriptiveSkillLabel(skill.level)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterScreen;



import React from 'react';
import type { FC } from 'react';
import { Axe, Fish, ChefHat, Hammer, Smile, Angry, Sword, Wind, Shield } from 'lucide-react';
import { getDescriptiveAttributeLabel, getDescriptiveSkillLabel } from '../../data';
import Stat from '../ui/Stat';
import ProgressBar from '../ui/ProgressBar';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useSkillStore } from '../../stores/useSkillStore';
import { useUIStore } from '../../stores/useUIStore';
import LocationNav from '../LocationNav';

const CharacterPortrait: FC<{ characterData: any }> = ({ characterData }) => (
    <>
        <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-zinc-700 shadow-lg">
            <img src={characterData.image} alt={characterData.name} className="w-full h-full object-cover" />
        </div>
        <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-zinc-800">
            <ProgressBar label="HP" value={characterData.hp} max={100} colorClass="bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" variant="thick" showText={true} />
            <ProgressBar label="Energy" value={characterData.energy} max={100} colorClass="bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]" variant="thick" showText={true} />
            <ProgressBar label="Hunger" value={characterData.hunger} max={100} colorClass="bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]" variant="thick" showText={true} />
            <ProgressBar label="Social" value={characterData.socialEnergy} max={characterData.maxSocialEnergy} colorClass="bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]" variant="thick" showText={true} />
        </div>
    </>
);

const CharacterScreen: FC = () => {
    const { attributes, hp, energy, hunger, socialEnergy, maxSocialEnergy, bio } = useCharacterStore();
    const { skills, getSkillLevel } = useSkillStore();

    const characterData = {
        name: bio?.name || 'Unknown',
        image: bio?.image || 'https://i.imgur.com/gUNzyBA.jpeg',
        bio: {
            gender: bio?.gender || 'Unknown',
            race: bio?.race || 'Unknown',
            birthplace: bio?.birthplace || 'Unknown',
            born: bio?.born || 'Unknown',
        },
        hp,
        energy,
        hunger,
        socialEnergy,
        maxSocialEnergy,
        attributes: {
            strength: attributes.strength,
            dexterity: attributes.dexterity,
            intelligence: attributes.intelligence,
            wisdom: attributes.wisdom,
            charisma: attributes.charisma
        },
        skills: [
            { name: 'Attack', level: getSkillLevel('attack'), icon: <Sword size={24} /> },
            { name: 'Defense', level: getSkillLevel('defense'), icon: <Shield size={24} /> },
            { name: 'Dexterity', level: getSkillLevel('dexterity'), icon: <Wind size={24} /> },
            { name: 'Woodcutting', level: getSkillLevel('woodcutting'), icon: <Axe size={24} /> },
            { name: 'Fishing', level: getSkillLevel('fishing'), icon: <Fish size={24} /> },
            { name: 'Cooking', level: getSkillLevel('cooking'), icon: <ChefHat size={24} /> },
            { name: 'Carpentry', level: getSkillLevel('carpentry'), icon: <Hammer size={24} /> },
            { name: 'Crafting', level: getSkillLevel('crafting'), icon: <Hammer size={24} /> },
            { name: 'Persuasion', level: getSkillLevel('persuasion'), icon: <Smile size={24} /> },
            { name: 'Coercion', level: getSkillLevel('coercion'), icon: <Angry size={24} /> },
        ]
    };

    const handleNavigate = (screen: any) => {
        const { setScreen } = useUIStore.getState();
        setScreen(screen);
    };

    const handleOpenSleepWaitModal = (mode: 'sleep' | 'wait') => {
        // TODO: Implement sleep/wait modal
        console.log('Open sleep/wait modal:', mode);
    };

    const handleOpenOptionsModal = () => {
        // TODO: Implement options modal
        console.log('Open options modal');
    };

    const handleOpenSaveLoadModal = () => {
        // TODO: Implement save/load modal
        console.log('Open save/load modal');
    };
    
    return (
        <>
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
                                            <div key={skill.name} className="bg-black/20 p-3 rounded-lg border border-zinc-800">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="p-3 bg-black/30 rounded-md text-zinc-300 border border-zinc-700">
                                                        {skill.icon}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white text-lg">{skill.name}</p>
                                                        <p className="text-md text-zinc-400">{getDescriptiveSkillLabel(skill.level)}</p>
                                                    </div>
                                                </div>
                                                <ProgressBar 
                                                    value={((skill.level - 1) % 10) + 1} 
                                                    max={10} 
                                                    colorClass="bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.5)]" 
                                                    variant="slim"
                                                    showText={false}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </>
    );
};

export default CharacterScreen;

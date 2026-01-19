

import React from 'react';
import type { FC, ReactNode } from 'react';
import { Bone, Hand, Swords, XCircle, KeyRound, Gem, PawPrint } from 'lucide-react';
import Section from '../ui/Section';
import ProgressBar from '../ui/ProgressBar';
import Stat from '../ui/Stat';
import ActionButton from '../ui/ActionButton';
import { getDescriptiveAttributeLabel } from '../../data';

// Companion Portrait Component, similar to CharacterScreen for consistency
const CompanionPortrait: FC<{ companionData: any }> = ({ companionData }) => (
    <>
        <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-zinc-700 shadow-lg">
            <img src={companionData.portraitUrl} alt={companionData.name} className="w-full h-full object-cover" />
        </div>
        <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-zinc-800">
            <ProgressBar label="Health" value={companionData.vitals.hp.current} max={companionData.vitals.hp.max} colorClass="bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" variant="thick" showText={true} />
            <ProgressBar label="Energy" value={companionData.vitals.energy.current} max={companionData.vitals.energy.max} colorClass="bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]" variant="thick" showText={true} />
        </div>
    </>
);


const EquipmentSlot: FC<{ icon: ReactNode; name: string; }> = ({ icon, name }) => (
    <div className="flex items-center gap-4 bg-black/20 p-3 rounded-lg border border-zinc-800">
        <div className="p-3 bg-black/30 rounded-md text-zinc-500 border border-zinc-700">
            {icon}
        </div>
        <div>
            <p className="font-semibold text-white text-lg">{name}</p>
            <p className="text-md text-zinc-500 italic">Empty</p>
        </div>
    </div>
);


const CompanionScreen: FC<{ hasPet: boolean }> = ({ hasPet }) => {
    if (!hasPet) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                <PawPrint size={64} className="text-zinc-600 mb-4" />
                <h1 className="text-4xl font-bold text-zinc-400" style={{ fontFamily: 'Cinzel, serif' }}>No Companion</h1>
                <p className="text-lg text-zinc-500 mt-2 max-w-md">You do not have a companion yet. Explore the world and you may find a loyal friend to join your journey.</p>
            </div>
        );
    }

  // Mock data for the companion
  const companion = {
    name: "Wolf Puppy",
    title: "Loyal Wolf Puppy",
    portraitUrl: "https://i.imgur.com/DS1LuU3.png",
    vitals: {
        hp: { current: 80, max: 80 },
        energy: { current: 65, max: 100 },
    },
    attributes: { attack: 5, dexterity: 8 },
    info: "A young wolf you found, wounded and alone, in the forest. After nursing it back to health, it has become your loyal and steadfast companion."
  };

  return (
    <div className="w-full h-full p-8 pt-12 pb-24">
        <div className="w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-8 h-full">
            {/* Column 1: Fixed Portrait for Desktop */}
            <div className="hidden lg:flex flex-col justify-center w-96 flex-shrink-0">
                <div className="space-y-6">
                    <CompanionPortrait companionData={companion} />
                </div>
            </div>
            
            {/* Column 2: Scrollable Content */}
            <div className="lg:flex-grow bg-black/20 rounded-lg border border-zinc-800 overflow-y-auto custom-scrollbar min-h-0">
                
                {/* Portrait for Mobile/Tablet */}
                <div className="lg:hidden p-6 pb-0">
                    <div className="max-w-sm mx-auto space-y-6">
                        <CompanionPortrait companionData={companion} />
                    </div>
                </div>

                <header className="p-6 text-center border-b border-zinc-700">
                    <h2 className="text-5xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>{companion.name}</h2>
                    <p className="text-lg text-zinc-300/80 italic">{companion.title}</p>
                </header>
                <div className="p-6">
                    <div className="space-y-8">
                        <Section title="Profile">
                            <p className="text-zinc-300 leading-relaxed bg-black/20 p-4 rounded-md border border-zinc-800">{companion.info}</p>
                        </Section>

                        <Section title="Attributes">
                            <div className="p-4 bg-black/20 rounded-lg border border-zinc-800 space-y-2">
                                <Stat label="Attack" value={getDescriptiveAttributeLabel('attack', companion.attributes.attack)} />
                                <Stat label="Dexterity" value={getDescriptiveAttributeLabel('dexterity', companion.attributes.dexterity)} />
                            </div>
                        </Section>
                        
                        <Section title="Actions">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <ActionButton icon={<Bone size={20} className="text-orange-300" />} text="Feed" category="action" />
                                <ActionButton icon={<Hand size={20} className="text-sky-300" />} text="Pet" category="dialogue" />
                                <ActionButton icon={<Swords size={20} className="text-red-400" />} text="Train" category="action" />
                                <ActionButton icon={<XCircle size={20} className="text-zinc-400" />} text="Dismiss" category="explore" />
                            </div>
                        </Section>

                        <Section title="Equipment">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <EquipmentSlot icon={<KeyRound size={24} />} name="Collar Slot" />
                                <EquipmentSlot icon={<Gem size={24} />} name="Charm Slot" />
                            </div>
                        </Section>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CompanionScreen;

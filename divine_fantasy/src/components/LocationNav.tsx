import React from 'react';
import type { FC } from 'react';
import { User, Backpack, ScrollText, Settings, MapPin, Watch, PawPrint, Save, MoreHorizontal, Briefcase, BookUser, BookOpen } from 'lucide-react';
import type { GameState, NavVariant } from '../types';
import NavButton from './ui/NavButton';

interface LocationNavProps {
    onNavigate: (screen: GameState) => void;
    variant: NavVariant;
    activeScreen: GameState;
    onOpenSleepWaitModal: (mode: 'sleep' | 'wait') => void;
    showTimeControls: boolean;
    onOpenOptionsModal: () => void;
    onOpenSaveLoadModal: () => void;
}

const LocationNav: FC<LocationNavProps> = ({ onNavigate, variant, activeScreen, onOpenSleepWaitModal, showTimeControls, onOpenOptionsModal, onOpenSaveLoadModal }) => {
    const isSolid = variant === 'solid';

    const footerClasses = `
        absolute bottom-0 left-0 right-0 z-20 flex justify-center
    `;

    const containerClasses = `
        backdrop-blur-lg shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] border
        ${isSolid 
            ? 'w-full max-w-full rounded-none bg-zinc-950/80 border-t-zinc-700/80 border-x-transparent border-b-transparent translate-y-0' 
            : 'w-auto rounded-full bg-zinc-950/85 border-zinc-800 -translate-y-6'
        }
    `;
    
    const moreActionsPopover = (
      <div className="relative group/more">
        <div className="p-3 rounded-full text-zinc-300 transition-all duration-300 hover:text-white hover:bg-white/10 hover:scale-110 cursor-pointer">
            <MoreHorizontal size={24} />
        </div>
        
        <div className="absolute bottom-full right-1/2 translate-x-1/2 flex justify-center pb-3 opacity-0 group-hover/more:opacity-100 pointer-events-none group-hover/more:pointer-events-auto transition-opacity duration-300">
            <div className="flex items-center space-x-2 p-2 bg-zinc-800/95 rounded-full border border-zinc-700 backdrop-blur-sm transform group-hover/more:translate-y-0 translate-y-2 transition-transform duration-300">
                <NavButton icon={<Watch size={24} />} tooltip="Pass Time" onClick={() => onOpenSleepWaitModal('wait')} />
                <NavButton icon={<Save size={24} />} tooltip="Save Game" onClick={onOpenSaveLoadModal} />
                <NavButton icon={<Settings size={24} />} tooltip="Options" onClick={onOpenOptionsModal} />
            </div>
        </div>
      </div>
    );

    return (
        <footer className={footerClasses}>
            <div className={containerClasses}>
                 <nav className="flex justify-center items-center space-x-1 md:space-x-2 p-2">
                    <NavButton icon={<MapPin size={24} />} tooltip="Location" onClick={() => onNavigate('inGame')} isActive={activeScreen === 'inGame'} />
                    <NavButton icon={<User size={24} />} tooltip="Character" onClick={() => onNavigate('characterScreen')} isActive={activeScreen === 'characterScreen'} />
                    <NavButton icon={<Backpack size={24} />} tooltip="Inventory" onClick={() => onNavigate('inventory')} isActive={activeScreen === 'inventory'} />
                    <NavButton icon={<ScrollText size={24} />} tooltip="Journal" onClick={() => onNavigate('journal')} isActive={activeScreen === 'journal'} />
                    <NavButton icon={<BookUser size={24} />} tooltip="Diary" onClick={() => onNavigate('diary')} isActive={activeScreen === 'diary'} />
                    <NavButton icon={<Briefcase size={24} />} tooltip="Job" onClick={() => onNavigate('jobScreen')} isActive={activeScreen === 'jobScreen'} />
                    <NavButton icon={<PawPrint size={24} />} tooltip="Companion" onClick={() => onNavigate('companion')} isActive={activeScreen === 'companion'} />
                    
                    {showTimeControls && moreActionsPopover}
                </nav>
            </div>
        </footer>
    );
};

export default LocationNav;

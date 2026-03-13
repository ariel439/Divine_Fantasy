import React from 'react';
import type { FC, ReactNode } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { GameManagerService } from '../../services/GameManagerService';
import { useWorldStateStore } from '../../stores/useWorldStateStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';
import { useLocationStore } from '../../stores/useLocationStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudioStore } from '../../stores/useAudioStore';

const MainMenu: FC = () => {
    const { setScreen, openModal } = useUIStore();
    
    const showDebug = import.meta.env.VITE_SHOW_DEBUG_MENU === 'true' || import.meta.env.DEV;

    const MenuButton: FC<{children: ReactNode, onClick?: () => void}> = ({ children, onClick }) => (
        <button 
            onClick={onClick}
            className="w-full max-w-xs px-8 py-3 text-lg font-bold tracking-[0.3em] uppercase text-white/90 bg-zinc-950 border border-zinc-800 rounded-lg transition-all duration-500 transform-gpu hover:bg-white/10 hover:text-white hover:border-zinc-400 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 focus:outline-none focus:ring-1 focus:ring-white/30"
            style={{ fontFamily: 'Cinzel, serif' }}
        >
            {children}
        </button>
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center relative">
            <div className="relative z-10">
                <h1
                    className="text-6xl md:text-8xl font-bold text-white tracking-widest animate-fade-in-up"
                    style={{ fontFamily: 'Cinzel, serif', textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
                >
                    Divine Fantasy
                </h1>
                <h2
                    className="text-2xl md:text-3xl text-white/80 mt-2 tracking-[0.2em] animate-fade-in-up delay-300"
                    style={{ fontFamily: 'Cinzel, serif', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                >
                    WHISPERS
                </h2>
                <div className="mt-12 flex flex-col items-center space-y-4 animate-fade-in-up delay-500">
                    <MenuButton onClick={() => setScreen('characterSelection')}>New Game</MenuButton>
                    {showDebug && (
                        <MenuButton onClick={() => setScreen('debugMenu')}>Debug</MenuButton>
                    )}
                    <MenuButton onClick={() => openModal('saveLoad')}>Load Game</MenuButton>
                    <MenuButton onClick={() => openModal('options')}>Settings</MenuButton>
                    <MenuButton>Quit</MenuButton>
                </div>
            </div>
            <div
                className="absolute bottom-4 right-4 text-zinc-400 text-xs font-mono animate-fade-in-up delay-700"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
            >
                v0.1.0-alpha
            </div>
            {(() => {
                const { musicEnabled, sfxEnabled, weatherEnabled, setMusicEnabled, setSFXEnabled, setWeatherEnabled } = useAudioStore();
                const allEnabled = musicEnabled && sfxEnabled && weatherEnabled;
                const Icon = allEnabled ? Volume2 : VolumeX;
                const toggleAll = () => {
                    const next = !allEnabled;
                    setMusicEnabled(next);
                    setSFXEnabled(next);
                    setWeatherEnabled(next);
                };
                return (
                    <button
                        onClick={toggleAll}
                        className="absolute bottom-4 left-4 p-3 rounded-full bg-black/40 border border-white/30 text-white hover:bg-white/10 hover:border-white/70 transition-colors"
                        aria-label={allEnabled ? 'Disable Sound' : 'Enable Sound'}
                    >
                        <Icon size={22} />
                    </button>
                );
            })()}
        </div>
    );
};

export default MainMenu;

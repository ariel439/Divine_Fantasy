import React from 'react';
import type { FC, ReactNode } from 'react';
import { useUIStore } from '../../stores/useUIStore';

const MainMenu: FC = () => {
    const { setScreen } = useUIStore();
    const MenuButton: FC<{children: ReactNode, onClick?: () => void}> = ({ children, onClick }) => (
        <button 
            onClick={onClick}
            className="w-full max-w-xs px-8 py-3 text-lg font-semibold tracking-widest uppercase text-white/90 bg-black/60 border border-white/30 rounded-md transition-all duration-300 transform-gpu hover:bg-white/10 hover:text-white hover:border-white/70 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
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
                    <MenuButton onClick={() => setScreen('characterSelection')}>Continue</MenuButton>
                    <MenuButton>Load Game</MenuButton>
                    <MenuButton>Settings</MenuButton>
                    <MenuButton>Quit</MenuButton>
                </div>
            </div>
            <div
                className="absolute bottom-4 right-4 text-zinc-400 text-xs font-mono animate-fade-in-up delay-700"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
            >
                v0.1.0-alpha
            </div>
        </div>
    );
};

export default MainMenu;
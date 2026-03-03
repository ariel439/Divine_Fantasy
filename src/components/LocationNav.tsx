import React from 'react';
import type { FC } from 'react';
import { User, Backpack, ScrollText, Settings, MapPin, PawPrint, Briefcase, BookUser, Sun, Moon, Cloud, CloudRain, Snowflake, Leaf, Sprout, Hourglass } from 'lucide-react';
import type { GameState, NavVariant } from '../types';
import NavButton from './ui/NavButton';
import { useWorldStateStore } from '../stores/useWorldStateStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';

interface LocationNavProps {
    onNavigate: (screen: GameState) => void;
    variant: NavVariant;
    activeScreen: GameState;
    onOpenSleepWaitModal: (mode: 'sleep' | 'wait') => void;
    showTimeControls: boolean;
    onOpenSystemMenu: () => void;
}

const LocationNav: FC<LocationNavProps> = ({ onNavigate, activeScreen, onOpenSleepWaitModal, showTimeControls, onOpenSystemMenu }) => {
    const { introMode, tutorialStep } = useWorldStateStore();
    const { month, dayOfMonth, hour, minute, getFormattedTime, getFormattedDate, getSeason, getWeather, temperatureC } = useWorldTimeStore();

    const footerClasses = `
        absolute bottom-0 left-0 right-0 z-20 flex justify-center
    `;

    const containerClasses = `
        relative backdrop-blur-lg shadow-2xl border w-full bg-zinc-950/90 border-t-zinc-700/80 border-x-transparent border-b-transparent
    `;

    // Time Logic
    const timeString = getFormattedTime();
    const dateString = getFormattedDate();
    const firstDayOfWeekForMonth = ((month - 1) * 30) % 7;
    const weekdayIndex = (firstDayOfWeekForMonth + dayOfMonth - 1) % 7;
    const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const weekday = weekdayNames[weekdayIndex];
    const season = getSeason();
    const weather = getWeather();
    const isNight = hour >= 18 || hour < 6;

    const seasonIcons = {
        Spring: Sprout,
        Summer: Sun,
        Autumn: Leaf,
        Winter: Snowflake,
    };
    const SeasonIcon = seasonIcons[season];

    let WeatherIcon = Sun;
    let weatherText: string = weather;
    if (weather === 'Sunny') {
        WeatherIcon = isNight ? Moon : Sun;
        weatherText = isNight ? 'Clear' : 'Sunny';
    } else if (weather === 'Cloudy') {
        WeatherIcon = Cloud;
    } else if (weather === 'Rainy') {
        WeatherIcon = CloudRain;
    } else if (weather === 'Snowy') {
        WeatherIcon = Snowflake;
    }

    return (
        <footer className={footerClasses}>
            <div className={containerClasses}>
                 {/* Left Side: Weather & Season */}
                 {showTimeControls && !introMode && (
                    <div className="absolute top-1/2 left-6 -translate-y-1/2 flex items-center space-x-4 hidden md:flex">
                        <div className="flex flex-col items-start">
                            <div className="flex items-center space-x-2 text-zinc-300">
                                <SeasonIcon size={18} className="text-zinc-400" />
                                <span className="text-sm font-medium">{season}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-zinc-500">
                                <WeatherIcon size={14} className="text-zinc-500" />
                                <span>{weatherText}, {temperatureC}°C</span>
                            </div>
                        </div>
                    </div>
                 )}

                 <div className="flex justify-center items-center p-2 max-w-7xl mx-auto w-full">
                    {/* Navigation Buttons */}
                    <nav className="flex justify-center items-center space-x-1 md:space-x-2 transition-all duration-300 ease-in-out">
                        <NavButton icon={<MapPin size={24} />} tooltip="Location" onClick={() => onNavigate('inGame')} isActive={activeScreen === 'inGame'} />
                        {!introMode && <NavButton icon={<User size={24} />} tooltip="Character" onClick={() => onNavigate('characterScreen')} isActive={activeScreen === 'characterScreen'} />}
                        {!introMode && <NavButton icon={<Backpack size={24} />} tooltip="Inventory" onClick={() => onNavigate('inventory')} isActive={activeScreen === 'inventory'} />}
                        <NavButton icon={<ScrollText size={24} />} tooltip="Journal" onClick={() => onNavigate('journal')} isActive={activeScreen === 'journal'} />
                        {!introMode && <NavButton icon={<BookUser size={24} />} tooltip="Diary" onClick={() => onNavigate('diary')} isActive={activeScreen === 'diary'} />}
                        {!introMode && <NavButton icon={<Briefcase size={24} />} tooltip="Job" onClick={() => onNavigate('jobScreen')} isActive={activeScreen === 'jobScreen'} />}
                        {!introMode && <NavButton icon={<PawPrint size={24} />} tooltip="Companion" onClick={() => onNavigate('companion')} isActive={activeScreen === 'companion'} />}
                        
                        {/* Wait Button */}
                        {!introMode && <NavButton icon={<Hourglass size={24} />} tooltip="Wait (T)" onClick={() => onOpenSleepWaitModal('wait')} isActive={false} />}
                        
                        {/* System Menu Button */}
                        <NavButton 
                            icon={<Settings size={24} />} 
                            tooltip="System Menu" 
                            onClick={onOpenSystemMenu} 
                        />
                    </nav>
                 </div>

                 {/* Right Side: Time & Date */}
                 {showTimeControls && (
                    <div className="absolute top-1/2 right-6 -translate-y-1/2 flex items-center space-x-4">
                         <div className="flex flex-col items-end mr-2 hidden sm:flex">
                             {introMode ? (
                                <div className="flex items-center space-x-2 text-zinc-200">
                                    <span className="font-mono font-bold text-lg leading-none">
                                        {tutorialStep < 4 ? 'Morning' : tutorialStep < 6 ? 'Midday' : 'Evening'}
                                    </span>
                                </div>
                             ) : (
                                 <>
                                     <div className="flex items-center space-x-2 text-zinc-200">
                                         <span className="font-mono font-bold text-lg leading-none">{timeString}</span>
                                     </div>
                                     <div className="flex items-center space-x-2 text-xs text-zinc-500">
                                         <span>{weekday}, {dateString}</span>
                                     </div>
                                 </>
                             )}
                         </div>
                    </div>
                )}
            </div>
        </footer>
    );
};

export default LocationNav;

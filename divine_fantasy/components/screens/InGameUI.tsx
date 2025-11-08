

import React from 'react';
import type { FC } from 'react';
import { Sun, Moon, MessageSquare, Hammer, Fish, MapPin, ShoppingCart, CookingPot, Bed, Search, Swords, Leaf, Snowflake, Sprout, Cloud, CloudRain, BookOpen } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import ActionButton from '../ui/ActionButton';
import type { CraftingSkill, Vitals, Season, Weather } from '../../types';

interface InGameUIProps {
    vitals: Vitals;
    day: number;
    hour: number;
    minute: number;
    isNight: boolean;
    season: Season;
    weather: Weather;
    onTalkToElias: () => void;
    onTalkToRoberta: () => void;
    onTrade: () => void;
    onStartCrafting: (skill: CraftingSkill) => void;
    onWork: () => void;
    onFish: () => void;
    onSleep: () => void;
    onInvestigate: () => void;
    onStartCombat: () => void;
    onVisitLibrary: () => void;
}

const InGameUI: FC<InGameUIProps> = ({ vitals, day, hour, minute, isNight, season, weather, onTalkToElias, onTalkToRoberta, onTrade, onStartCrafting, onWork, onFish, onSleep, onInvestigate, onStartCombat, onVisitLibrary }) => {
    
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const dateString = `Tuesday, May ${2 + day}, 780`; // Assumes game starts Day 1 = May 3rd

    const seasonIcons: Record<Season, FC<{ size: number; className?: string }>> = {
        Spring: Sprout,
        Summer: Sun,
        Autumn: Leaf,
        Winter: Snowflake,
    };
    const SeasonIcon = seasonIcons[season];

    const getWeatherDisplay = () => {
        let temp = 15;
        let weatherText = weather;
        let WeatherIcon: FC<{ size: number; className?: string }> = Sun;

        switch (season) {
            case 'Summer': temp = 24; break;
            case 'Autumn': temp = 12; break;
            case 'Winter': temp = -2; break;
        }

        switch (weather) {
            case 'Sunny':
                weatherText = isNight ? 'Clear' : 'Sunny';
                WeatherIcon = isNight ? Moon : Sun;
                break;
            case 'Cloudy':
                WeatherIcon = Cloud;
                temp -= 4;
                break;
            case 'Snowy':
                WeatherIcon = Snowflake;
                break;
            case 'Rainy':
                WeatherIcon = CloudRain;
                temp -= 2;
                break;
        }
        
        const getIconColor = () => {
            if (isNight && weather !== 'Rainy' && weather !== 'Snowy') return "text-sky-200";
            switch(weather) {
                case 'Sunny': return "text-yellow-300";
                case 'Cloudy': return "text-zinc-300";
                case 'Rainy': return "text-blue-300";
                case 'Snowy': return "text-cyan-200";
                default: return "text-yellow-300";
            }
        };

        return { temp, weatherText, WeatherIcon: <WeatherIcon size={22} className={getIconColor()} /> };
    };
    
    const { temp, weatherText, WeatherIcon } = getWeatherDisplay();

    return (
        <>
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none"></div>

            {/* Top-Left: Stats */}
            <div className="absolute top-8 left-8 z-10 flex flex-col space-y-2 p-3 bg-zinc-950/85 backdrop-blur-xl rounded-lg border border-zinc-700/80 w-64">
                <ProgressBar label="HP" value={vitals.hp.current} max={vitals.hp.max} colorClass="bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                <ProgressBar label="Energy" value={vitals.energy.current} max={vitals.energy.max} colorClass="bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
                <ProgressBar label="Hunger" value={vitals.hunger.current} max={vitals.hunger.max} colorClass="bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]" />
            </div>

            {/* Right-Side: Information & Actions Panel */}
            <aside className="absolute top-8 right-8 bottom-24 z-10 w-full max-w-sm bg-zinc-950/85 backdrop-blur-xl rounded-xl border border-zinc-700/80 p-4 flex flex-col">
                {/* Date & Time Header */}
                <div className="flex-shrink-0 mb-4 px-2">
                    <div className="flex justify-between items-center">
                        <h2 className="text-4xl font-bold font-mono tracking-tighter" style={{lineHeight: '1'}}>{timeString}</h2>
                        <div className="flex items-center space-x-2 text-lg text-white/90">
                            <span className="font-semibold">{temp}°C {weatherText}</span>
                            {WeatherIcon}
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-white/70">{dateString}</p>
                        <div className="flex items-center space-x-2 text-sm text-zinc-300">
                           <SeasonIcon size={18} />
                           <span className="font-semibold">{season}</span>
                        </div>
                    </div>
                    <div className="w-full h-px bg-zinc-700 mt-3"></div>
                </div>
                
                {/* Scrollable Actions */}
                <div className="overflow-y-auto flex-grow pr-2 space-y-3 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800/50 hover:scrollbar-thumb-zinc-500">
                    <ActionButton onClick={onTalkToElias} category="dialogue" icon={<MessageSquare size={20} className="text-sky-300" />} text="Talk to Captain Elias" />
                    <ActionButton onClick={onTalkToRoberta} category="dialogue" icon={<MessageSquare size={20} className="text-sky-300" />} text="Talk to Roberta" />
                    <ActionButton onClick={onInvestigate} category="explore" icon={<Search size={20} className="text-zinc-300" />} text="Investigate Disturbance" />
                    <ActionButton onClick={onVisitLibrary} category="explore" icon={<BookOpen size={20} className="text-zinc-300" />} text="Visit the Library" />
                    <ActionButton onClick={onStartCombat} category="action" icon={<Swords size={20} className="text-red-400" />} text="Fight Wolves" />
                    <ActionButton onClick={onSleep} category="action" icon={<Bed size={20} className="text-purple-300" />} text="Sleep in Bed" />
                    <ActionButton onClick={onTrade} category="commerce" icon={<ShoppingCart size={20} className="text-yellow-300" />} text="Trade with the Fishmonger" />
                    <ActionButton onClick={() => onStartCrafting('Cooking')} category="action" icon={<CookingPot size={20} className="text-orange-300" />} text="Use Cooking Stove" />
                    <ActionButton onClick={onWork} category="action" icon={<Hammer size={20} className="text-orange-300" />} text="Work at the Docks" />
                    <ActionButton onClick={onFish} category="action" icon={<Fish size={20} className="text-orange-300" />} text="Fish at Canals" />
                    <ActionButton category="travel" icon={<MapPin size={20} className="text-green-300" />} text="Travel to fishmonger" />
                    <ActionButton category="travel" icon={<MapPin size={20} className="text-green-300" />} text="Travel to Main Street" />
                </div>
            </aside>

            {/* Bottom-Left: Location Info */}
            <main className="absolute bottom-28 left-8 z-10">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider text-white drop-shadow-xl" style={{ fontFamily: 'serif' }}>
                    Driftwatch Docks
                </h1>
                <p className="mt-3 text-white/80 max-w-2xl leading-relaxed drop-shadow-lg">
                    The sharp scent of salt and fish hangs heavy in the morning air. Gulls with voices like rusty hinges cry overhead as weathered fishermen haul in their nets, their songs a low murmur against the rhythmic wash of waves against the pylons.
                </p>
            </main>
        </>
    );
};

export default InGameUI;
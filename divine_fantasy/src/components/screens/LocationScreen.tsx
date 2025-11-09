import React, { useState, useEffect } from 'react';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';
import { useLocationStore } from '../../stores/useLocationStore';
import { useUIStore } from '../../stores/useUIStore';
import { Sun, Moon, MessageSquare, Hammer, Fish, MapPin, ShoppingCart, CookingPot, Bed, Search, Swords, Leaf, Snowflake, Sprout, Cloud, CloudRain, BookOpen, User, Package, Briefcase, Heart, Library } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import ActionButton from '../ui/ActionButton';
import LocationNav from '../LocationNav';
import WeatherParticles from '../effects/WeatherParticles';
import type { Weather } from '../../types';

const LocationScreen: React.FC = () => {
  const { attributes, hp, energy, hunger, maxWeight } = useCharacterStore();
  const { day, hour, minute, getFormattedTime, getFormattedDate } = useWorldTimeStore();
  const { getCurrentLocation } = useLocationStore();
  const { setScreen, currentScreen } = useUIStore();

  const currentLocation = getCurrentLocation();
  const isNight = hour >= 18 || hour < 6;

  const timeString = getFormattedTime();
  const dateString = getFormattedDate();

  // Simple season calculation based on day
  const getSeason = () => {
    const seasonIndex = Math.floor((day - 1) / 30) % 4;
    return ['Spring', 'Summer', 'Autumn', 'Winter'][seasonIndex] as 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  };

  const season = getSeason();

  // Weather state that changes every 10 minutes
  const [weather, setWeather] = useState<Weather>('Sunny');

  useEffect(() => {
    const weatherCycle = ['Sunny', 'Cloudy', 'Rainy', 'Snowy'] as Weather[];
    const weatherIndex = Math.floor((minute / 10) % weatherCycle.length);
    setWeather(weatherCycle[weatherIndex]);
  }, [minute]);

  const seasonIcons = {
    Spring: Sprout,
    Summer: Sun,
    Autumn: Leaf,
    Winter: Snowflake,
  };
  const SeasonIcon = seasonIcons[season];

  const getWeatherDisplay = () => {
    let temp = 15;
    let weatherText = weather;
    let WeatherIcon: React.FC<{ size: number; className?: string }> = Sun;

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
      case 'Rainy':
        WeatherIcon = CloudRain;
        temp -= 2;
        break;
      case 'Snowy':
        WeatherIcon = Snowflake;
        temp -= 6;
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

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'dialogue':
        setScreen('dialogue');
        break;
      case 'shop':
        setScreen('trade');
        break;
      case 'fish':
        // TODO: Implement fishing
        break;
      case 'job':
        setScreen('jobScreen');
        break;
      case 'navigate':
        // TODO: Implement navigation
        break;
      default:
        console.log('Action not implemented:', action);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'dialogue': return <MessageSquare size={20} className="text-sky-300" />;
      case 'shop': return <ShoppingCart size={20} className="text-yellow-300" />;
      case 'fish': return <Fish size={20} className="text-blue-300" />;
      case 'job': return <Briefcase size={20} className="text-orange-300" />;
      case 'navigate': return <MapPin size={20} className="text-green-300" />;
      default: return <Search size={20} className="text-zinc-300" />;
    }
  };

  const getActionCategory = (type: string) => {
    switch (type) {
      case 'dialogue': return 'dialogue';
      case 'shop': return 'commerce';
      case 'fish': case 'job': return 'action';
      case 'navigate': return 'travel';
      default: return 'explore';
    }
  };

  const handleNavigate = (screen: any) => {
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
      {/* Weather Particles */}
      <WeatherParticles weather={weather} />

      {/* Gradient Overlay for Text Readability */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none"></div>

      {/* Top-Left: Stats */}
      <div className="absolute top-8 left-8 z-10 flex flex-col space-y-2 p-3 bg-zinc-950/85 backdrop-blur-xl rounded-lg border border-zinc-700/80 w-64">
        <ProgressBar label="HP" value={hp} max={100} colorClass="bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
        <ProgressBar label="Energy" value={energy} max={100} colorClass="bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
        <ProgressBar label="Hunger" value={hunger} max={100} colorClass="bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]" />
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
          {currentLocation.actions.map((action, index) => (
            <ActionButton
              key={index}
              onClick={() => handleAction(action)}
              category={getActionCategory(action.type)}
              icon={getActionIcon(action.type)}
              text={action.text}
            />
          ))}
        </div>
      </aside>

      {/* Bottom-Left: Location Info */}
      <main className="absolute bottom-28 left-8 z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider text-white drop-shadow-xl" style={{ fontFamily: 'serif' }}>
          {currentLocation.name}
        </h1>
        <p className="mt-3 text-white/80 max-w-2xl leading-relaxed drop-shadow-lg">
          {currentLocation.description}
        </p>
      </main>

      {/* Navigation */}
      <LocationNav
        onNavigate={handleNavigate}
        variant="floating"
        activeScreen={currentScreen}
        onOpenSleepWaitModal={handleOpenSleepWaitModal}
        showTimeControls={true}
        onOpenOptionsModal={handleOpenOptionsModal}
        onOpenSaveLoadModal={handleOpenSaveLoadModal}
      />
    </>
  );
};

export default LocationScreen;

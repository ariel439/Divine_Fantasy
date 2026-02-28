import React, { useEffect, useRef } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useWorldTimeStore } from '../stores/useWorldTimeStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useAudioStore } from '../stores/useAudioStore';

const AudioManager: React.FC = () => {
  const { currentScreen } = useUIStore();
  const { hour, weather } = useWorldTimeStore();
  const { currentLocationId, getCurrentLocation } = useLocationStore();
  const { musicEnabled, sfxEnabled, weatherEnabled, musicVolume, sfxVolume, weatherVolume } = useAudioStore();

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackPathRef = useRef<string | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const currentSfxPathRef = useRef<string | null>(null);
  const weatherRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sfxSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const shelfNodeRef = useRef<BiquadFilterNode | null>(null);
  const weatherSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Resume AudioContext on interaction
  useEffect(() => {
    const handleInteraction = () => {
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch((e) => console.warn('Audio resume failed', e));
      }
      
      // Retry playback if stuck
      if (useAudioStore.getState().musicEnabled && musicRef.current && musicRef.current.paused) {
          musicRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Music Logic
  useEffect(() => {
    let desiredMusicSrc = '/assets/musics/driftwatch_region.mp3'; // Default / Exploration

    if ((currentScreen as string) === 'mainMenu' || (currentScreen as string) === 'characterSelection') {
      desiredMusicSrc = '/assets/musics/Whisper of the Pines.mp3';
    } else if (currentScreen === 'combat') {
      desiredMusicSrc = '/assets/musics/combat_theme.mp3';
    } else if ((currentScreen === 'dialogue' || currentScreen === 'event') && currentTrackPathRef.current) {
      // Keep playing current music during dialogue/events
      desiredMusicSrc = currentTrackPathRef.current;
    }

    if (!musicRef.current) {
      musicRef.current = new Audio(desiredMusicSrc);
      musicRef.current.loop = true;
      currentTrackPathRef.current = desiredMusicSrc;
    }

    const audio = musicRef.current;
    
    // Change track if needed
    if (currentTrackPathRef.current !== desiredMusicSrc) {
        audio.src = desiredMusicSrc;
        currentTrackPathRef.current = desiredMusicSrc;
        if (musicEnabled) {
            audio.play().catch(() => {});
        }
    }

    // Apply a scaling factor to music volume so it's not too loud even at 100%
    // User sees 50%, code uses 0.5 * 0.4 = 0.2 actual volume
    audio.volume = musicVolume * 0.4; 
    
    if (musicEnabled) {
      if (audio.paused) audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [musicEnabled, musicVolume, currentScreen]);

  // Combined Audio Logic (Ambience & Weather & Muffling)
  useEffect(() => {
    // 1. Initialize Audio Context
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported');
      }
    }

    const ctx = audioCtxRef.current;
    
    // If not in game (e.g. main menu), stop all ambience/weather
    if ((currentScreen as string) === 'mainMenu' || (currentScreen as string) === 'characterSelection') {
        if (sfxRef.current) {
            sfxRef.current.pause();
            sfxRef.current.currentTime = 0;
        }
        if (weatherRef.current) {
            weatherRef.current.pause();
            weatherRef.current.currentTime = 0;
        }
        return;
    }

    // 2. Initialize Filters
    if (ctx) {
      if (!filterNodeRef.current) {
        filterNodeRef.current = ctx.createBiquadFilter();
        filterNodeRef.current.type = 'lowpass';
        filterNodeRef.current.frequency.value = 800;
        filterNodeRef.current.Q.value = 0.7;
      }
      if (!shelfNodeRef.current) {
        shelfNodeRef.current = ctx.createBiquadFilter();
        shelfNodeRef.current.type = 'highshelf';
        shelfNodeRef.current.frequency.value = 3000;
        shelfNodeRef.current.gain.value = -12;
      }
    }

    // 3. Initialize Audio Elements
    if (!sfxRef.current) {
      sfxRef.current = new Audio();
      sfxRef.current.loop = true;
    }
    if (!weatherRef.current) {
      weatherRef.current = new Audio('/assets/sfx/weather_rain.mp3');
      weatherRef.current.loop = true;
    }

    // 4. Initialize Sources
    if (ctx) {
      if (!sfxSourceRef.current && sfxRef.current) {
        try { sfxSourceRef.current = ctx.createMediaElementSource(sfxRef.current); } catch {}
      }
      if (!weatherSourceRef.current && weatherRef.current) {
        try { weatherSourceRef.current = ctx.createMediaElementSource(weatherRef.current); } catch {}
      }
    }

    // 5. Determine Logic
    // We use currentLocationId from store (via hook in component) to ensure reactivity
    const loc = useLocationStore.getState().getLocation(currentLocationId) || useLocationStore.getState().getCurrentLocation();
    
    // Muffle Logic
    // Indoor check: Use store property OR hardcoded list for fallback
    const isIndoor = loc.is_indoor || ['leo_lighthouse', 'orphanage_room', 'beryls_general_goods', 'kaelens_forge', 'grand_library', 'tide_trade', 'salty_mug', 'salty_mug_rented_room', 'herbalists_hovel'].includes(loc.id);
    
    // Apply muffle if indoor AND NOT in Main Menu or Combat
    // We want muffling in: inGame, dialogue, event, inventory, journal, diary, etc.
    const applyMuffle = isIndoor && currentScreen !== 'mainMenu' && currentScreen !== 'combat' && currentScreen !== 'characterSelection' && currentScreen !== 'prologue';

    // Debug Audio Logic
    // console.log('Audio Debug:', { locId: loc.id, isIndoor, currentScreen, applyMuffle, weather });

    // 6. Routing
    if (ctx && filterNodeRef.current && shelfNodeRef.current) {
      const connectSource = (source: MediaElementAudioSourceNode | null) => {
        if (!source) return;
        try {
            source.disconnect();
        } catch {} // Ignore if not connected
        
        if (applyMuffle) {
          try { source.connect(filterNodeRef.current!); } catch {}
        } else {
          try { source.connect(ctx.destination); } catch {}
        }
      };

      connectSource(sfxSourceRef.current);
      connectSource(weatherSourceRef.current);

      // Connect filters chain
      try { filterNodeRef.current.disconnect(); } catch {}
      try { shelfNodeRef.current.disconnect(); } catch {}
      
      if (applyMuffle) {
        try {
            filterNodeRef.current.connect(shelfNodeRef.current);
            shelfNodeRef.current.connect(ctx.destination);
        } catch {}
      }
      
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    }

    // 7. Update Ambience Track
    let desiredSfxSrc: string | undefined;
    const ruralLocations = ['the_crossroads', 'homestead_farm', 'driftwatch_woods', 'hunters_cabin', 'sawmill'];
    const isRural = ruralLocations.includes(loc.id);

    // Determine base ambience
    if (currentScreen === 'inGame' || ['inventory', 'journal', 'diary', 'characterScreen', 'jobScreen', 'companion'].includes(currentScreen)) {
        if (loc.id === 'salty_mug') {
             desiredSfxSrc = '/assets/sfx/bar.mp3';
        } else if (isRural) {
             desiredSfxSrc = (hour >= 6 && hour < 18) ? '/assets/sfx/ambience_rural_day.mp3' : '/assets/sfx/ambience_rural_night.mp3';
        } else {
             desiredSfxSrc = (hour >= 6 && hour < 18) ? '/assets/sfx/coastal.mp3' : '/assets/sfx/waves.mp3';
        }
    } else if (['dialogue', 'event', 'choiceEvent'].includes(currentScreen)) {
         if (loc.id === 'salty_mug') {
             desiredSfxSrc = '/assets/sfx/bar.mp3';
         } else if (isRural) {
             desiredSfxSrc = (hour >= 6 && hour < 18) ? '/assets/sfx/ambience_rural_day.mp3' : '/assets/sfx/ambience_rural_night.mp3';
         } else {
             desiredSfxSrc = (hour >= 6 && hour < 18) ? '/assets/sfx/coastal.mp3' : '/assets/sfx/waves.mp3';
         }
    }

    const sfxAudio = sfxRef.current;
    if (sfxAudio) {
       sfxAudio.volume = applyMuffle ? Math.max(0, Math.min(1, sfxVolume * 0.3)) : sfxVolume * 0.5;
       
       if (desiredSfxSrc && sfxEnabled) {
          if (currentSfxPathRef.current !== desiredSfxSrc) {
             sfxAudio.src = desiredSfxSrc;
             currentSfxPathRef.current = desiredSfxSrc;
             sfxAudio.play().catch(() => {});
          } else if (sfxAudio.paused) {
             sfxAudio.play().catch(() => {});
          }
       } else {
          if (!sfxAudio.paused) sfxAudio.pause();
       }
    }

    // 8. Update Weather Track
    const weatherAudio = weatherRef.current;
    if (weatherAudio) {
        weatherAudio.volume = applyMuffle ? Math.max(0, Math.min(1, weatherVolume * 0.2)) : weatherVolume * 0.5;
        
        if (weatherEnabled && weather === 'Rainy') {
            if (weatherAudio.paused) weatherAudio.play().catch(() => {});
        } else {
            if (!weatherAudio.paused) weatherAudio.pause();
        }
    }

  }, [hour, sfxEnabled, sfxVolume, weatherEnabled, weatherVolume, weather, currentLocationId, currentScreen]);

  return null;
};

export default AudioManager;

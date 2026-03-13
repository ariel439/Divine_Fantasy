

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { X, Bed, Clock, Zap, Sun } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { useCharacterStore } from '../../stores/useCharacterStore';

interface SleepWaitModalProps {
  isOpen: boolean;
  mode: 'sleep' | 'wait';
  sleepQuality?: number; // e.g., 1.0 for a good bed, 0.5 for the floor
  onComplete: (hours: number) => void;
  onCancel: () => void;
  currentTimeInSeconds: number;
  fixedDuration?: number;
}

const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return [hours, minutes]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
};


const SleepWaitModal: FC<SleepWaitModalProps> = ({
  isOpen,
  mode,
  sleepQuality = 1.0,
  onComplete,
  onCancel,
  currentTimeInSeconds,
  fixedDuration,
}) => {
  const [duration, setDuration] = useState(1);
  const [isProgressing, setIsProgressing] = useState(false);
  const [progressTime, setProgressTime] = useState(0);
  const progressTimerRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);
  
  const MOCK_ENERGY_RESTORE_PER_HOUR = 10;
  const HP_RESTORE_PER_HOUR_BASE = 5; // 40 HP / 8 hours
  const hunger = useCharacterStore(state => state.hunger);

  const getEffectsText = () => {
    if (mode !== 'sleep') return "Time will pass.";
    const energyRestore = Math.floor(duration * MOCK_ENERGY_RESTORE_PER_HOUR * sleepQuality);
    const hpRestore = hunger > 0 ? Math.floor(HP_RESTORE_PER_HOUR_BASE * sleepQuality * duration) : 0;
    
    let text = `+${energyRestore} Energy`;
    if (hpRestore > 0) text += `, +${hpRestore} HP`;
    else if (hunger <= 0) text += `, 0 HP (Starving)`;
    
    return text;
  };

  useEffect(() => {
    if (isOpen) {
      setDuration(fixedDuration ?? 1);
      setIsProgressing(false);
      setProgressTime(0);
      completedRef.current = false;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
  }, [isOpen, fixedDuration]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
      setIsProgressing(true);
      
      const totalSeconds = duration * 3600;
      const stepDuration = 50; // ms per update
      const timeStep = totalSeconds / (2000 / stepDuration); // Complete in 2 seconds

      progressTimerRef.current = window.setInterval(() => {
          setProgressTime(prev => {
              const newTime = prev + timeStep;
              if (newTime >= totalSeconds) {
                  if (progressTimerRef.current) clearInterval(progressTimerRef.current);
                  setTimeout(() => {
                    if (!completedRef.current) {
                      completedRef.current = true;
                      onComplete(duration); // Close modal and apply changes after a short delay
                    }
                  }, 300);
                  return totalSeconds;
              }
              return newTime;
          });
      }, stepDuration);
  };

  const handleCancelAction = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    onCancel();
  };

  const title = mode === 'sleep' ? "How long will you sleep?" : "How long will you wait?";
  const Icon = mode === 'sleep' ? Bed : Clock;

  const renderSetupView = () => (
    <>
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Select duration</p>
        <div className="text-6xl font-bold tracking-tighter text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
            {duration}<span className="text-2xl ml-2 text-zinc-500 tracking-normal uppercase">hr{duration > 1 ? 's' : ''}</span>
        </div>
        <div className="px-4 mt-8">
            <input
                type="range"
                min="1"
                max={mode === 'wait' ? 24 : 12}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                disabled={!!fixedDuration}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100 hover:accent-white transition-all"
            />
            <div className="flex justify-between mt-3 px-1">
                <span className="text-[10px] font-black text-zinc-700">1H</span>
                <span className="text-[10px] font-black text-zinc-700">{mode === 'wait' ? 24 : 12}H</span>
            </div>
        </div>
      </div>

      <div className="my-8 p-6 bg-black/40 border border-zinc-800/50 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-3">
                <Sun size={12} className="text-zinc-600"/> End Time
            </span>
            <span className="text-xs font-bold text-white tracking-widest">
                {formatTime(currentTimeInSeconds + duration * 3600)}
            </span>
        </div>
        <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-3">
                {mode === 'sleep' ? <Zap size={12} className="text-blue-500/50"/> : <Clock size={12} className="text-zinc-600"/>} Expected Effects
            </span>
            <span className="text-[10px] font-black uppercase text-white text-right tracking-tighter">
                {getEffectsText()}
            </span>
        </div>
      </div>
      
      <div className="flex justify-end items-center gap-3">
        <button 
          onClick={onCancel}
          className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all border border-transparent hover:border-zinc-800 rounded-lg hover:bg-white/5"
        >
          Cancel
        </button>
        <button 
          onClick={handleConfirm}
          className="px-8 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-zinc-800/50 border border-zinc-700/50 rounded-lg transition-all hover:bg-white/10 hover:border-zinc-400 hover:shadow-xl active:scale-95"
        >
          Begin
        </button>
      </div>
    </>
  );

  const renderProgressView = () => {
    const totalDurationSeconds = duration * 3600;
    const currentTimeDisplay = formatTime(currentTimeInSeconds + progressTime);

    return (
        <>
            <div className="text-center my-8">
                 <p className="text-zinc-300 text-lg mt-4">Time Passing...</p>
                 <p className="text-5xl font-bold font-mono text-white mt-1">{currentTimeDisplay}</p>
                 <div className="mt-6">
                    <ProgressBar value={progressTime} max={totalDurationSeconds} colorClass="bg-zinc-600/70" variant="thick" showText={false}/>
                 </div>
            </div>
            <div className="flex justify-center mt-4">
              <button 
                onClick={handleCancelAction}
                className="px-6 py-2 text-sm font-semibold text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-2"
              >
                <X size={16}/> Cancel Rest
              </button>
            </div>
        </>
    );
  }

    return (
     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-opacity duration-500">
        <div 
          role="dialog"
          aria-modal="true"
          className="w-full max-w-md bg-zinc-950/90 backdrop-blur-2xl rounded-2xl border border-zinc-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 overflow-hidden relative group animate-scale-in"
        >
          {/* Top glass accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />
  
          <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                  <Icon size={24} className="text-zinc-400" />
              </div>
              <div>
                  <h2 className="text-xl font-bold text-white tracking-[0.1em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                      {mode === 'sleep' ? 'Rest & Recovery' : 'Pass the Time'}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-1">{title}</p>
              </div>
          </div>
          
          {isProgressing ? (
              <div className="text-center py-4">
                  <div className="mb-8">
                      <div className="flex justify-between items-end mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Current Time</span>
                          <span className="text-2xl font-bold font-mono tracking-tighter text-white">
                              {formatTime(currentTimeInSeconds + progressTime)}
                          </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full border border-zinc-800/50 overflow-hidden">
                          <div 
                              className="h-full bg-gradient-to-r from-zinc-600 via-zinc-400 to-white transition-all duration-300"
                              style={{ width: `${(progressTime / (duration * 3600)) * 100}%` }}
                          />
                      </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 animate-pulse">
                      {mode === 'sleep' ? 'Dreaming...' : 'Waiting...'}
                  </p>
              </div>
          ) : renderSetupView()}
          
          <style>{`
            @keyframes scaleIn {
              from { transform: scale(0.98) translateY(10px); opacity: 0; }
              to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .animate-scale-in {
              animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            input[type=range]::-webkit-slider-thumb {
              -webkit-appearance: none;
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: #fff;
              cursor: pointer;
              box-shadow: 0 0 10px rgba(0,0,0,0.5);
              margin-top: -6px;
            }
            input[type=range]::-moz-range-thumb {
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: #fff;
              cursor: pointer;
              box-shadow: 0 0 10px rgba(0,0,0,0.5);
              border: none;
            }
          `}</style>
        </div>
      </div>
    );
};

export default SleepWaitModal;

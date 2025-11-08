import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { X, Clock, Zap } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';

interface TimedActionModalProps {
  isOpen: boolean;
  actionName?: string;
  maxDuration?: number; // in hours
  calculatePreview?: (hours: number) => {
    energyCost?: number;
    rewardsSummary: string;
  };
  onStart?: (hours: number) => void;
  onClose: () => void;
  progress?: {
    currentTime: number; // in-game seconds for animation progress
    totalTime: number; // total in-game seconds for animation
    startTime: number; // in-game seconds, passed from game state
  } | null;
}

const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return [hours, minutes]
        .map(v => v.toString().padStart(2, '0'))
        .join(':');
};

const TimedActionModal: FC<TimedActionModalProps> = ({
  isOpen,
  actionName,
  maxDuration,
  calculatePreview,
  onStart,
  onClose,
  progress,
}) => {
  const [duration, setDuration] = useState(1);
  const preview = useMemo(() => {
      if (calculatePreview) return calculatePreview(duration);
      return null;
  }, [duration, calculatePreview]);

  const [progressTime, setProgressTime] = useState(0);
  const progressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && !progress) {
      // Reset state when opening in setup view
      setDuration(1);
      setProgressTime(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
  }, [isOpen, progress]);

  // This effect starts the fast animation when the `progress` prop is set
  useEffect(() => {
    if (progress && progress.totalTime > 0) {
      setProgressTime(0); // Reset progress time on new animation
      const totalSeconds = progress.totalTime;
      const stepDuration = 50; // ms per update
      const timeStep = totalSeconds / (2000 / stepDuration); // Complete in 2 seconds real time

      progressTimerRef.current = window.setInterval(() => {
          setProgressTime(prev => {
              const newTime = prev + timeStep;
              if (newTime >= totalSeconds) {
                  if (progressTimerRef.current) clearInterval(progressTimerRef.current);
                  setTimeout(() => {
                    onClose(); // Close modal after animation
                  }, 300);
                  return totalSeconds;
              }
              return newTime;
          });
      }, stepDuration);
      
      return () => {
          if(progressTimerRef.current) clearInterval(progressTimerRef.current);
      }
    }
  }, [progress, onClose]);


  if (!isOpen) {
    return null;
  }
  
  const renderSetupView = () => {
    if (!maxDuration || !preview || !onStart) return null;

    return (
    <>
      <div className="text-center">
        <p className="text-sm text-zinc-400 mb-6">Select duration for the action</p>
        <div className="text-5xl font-bold font-mono my-2">{duration} <span className="text-3xl">Hour{duration > 1 ? 's' : ''}</span></div>
        <input
            type="range"
            min="1"
            max={maxDuration}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-thumb mt-4"
        />
      </div>

      <div className="my-6 p-4 bg-black/30 border border-zinc-700 rounded-lg space-y-3 text-sm">
        <div className="flex justify-between items-center">
            <span className="text-zinc-400 flex items-center gap-2"><Clock size={16}/> Duration:</span>
            <span className="font-semibold text-white">{duration} hour{duration > 1 && 's'}</span>
        </div>
        {preview.energyCost !== undefined && (
            <div className="flex justify-between items-center">
                <span className="text-zinc-400 flex items-center gap-2"><Zap size={16}/> Est. Energy Cost:</span>
                <span className="font-semibold text-white">{preview.energyCost}</span>
            </div>
        )}
        <div className="flex justify-between items-start">
            <span className="text-zinc-400 flex-shrink-0 mr-4">Rewards:</span>
            <span className="font-semibold text-white text-right">{preview.rewardsSummary}</span>
        </div>
      </div>
      
      <div className="flex justify-end items-center gap-4 mt-6">
        <button 
          onClick={onClose}
          className="px-5 py-2 text-sm font-semibold tracking-wide text-white/90 bg-zinc-700/80 border border-zinc-600 rounded-md transition-all duration-300 hover:bg-zinc-600/80 focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          Cancel
        </button>
        <button 
          onClick={() => onStart(duration)}
          className="px-5 py-2 text-sm font-semibold tracking-wide text-white/90 bg-zinc-800 border border-zinc-700 rounded-md transition-all duration-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          Start
        </button>
      </div>
    </>
    );
  }

  const renderProgressView = () => {
    if (!progress) return null;
    const currentTimeDisplay = formatTime(progress.startTime + progressTime);

    return (
        <>
            <div className="text-center my-8">
                 <p className="text-zinc-300 text-lg mt-4">Time Passing...</p>
                 <p className="text-5xl font-bold font-mono text-white mt-1">{currentTimeDisplay}</p>
                 <div className="mt-6">
                    <ProgressBar value={progressTime} max={progress.totalTime} colorClass="bg-zinc-600/70" variant="thick" showText={false}/>
                 </div>
            </div>
        </>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
    >
      <div 
        className="w-full max-w-md bg-zinc-950 rounded-xl border border-zinc-700 shadow-2xl p-6 transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
        style={{ animation: 'scaleIn 0.2s ease-out forwards' }}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                {progress ? 'Working...' : actionName}
            </h2>
            {!progress && <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors"><X size={24}/></button>}
        </div>
        
        <div className="transition-opacity duration-300">
            {progress ? renderProgressView() : renderSetupView()}
        </div>

       <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
        .range-thumb::-webkit-slider-thumb {
            -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: #a1a1aa; /* zinc-400 */ cursor: pointer; border-radius: 50%; border: 2px solid #3f3f46; /* zinc-700 */
        }
        .range-thumb::-moz-range-thumb {
            width: 20px; height: 20px; background: #a1a1aa; /* zinc-400 */ cursor: pointer; border-radius: 50%; border: 2px solid #3f3f46; /* zinc-700 */
        }
      `}</style>
      </div>
    </div>
  );
};

export default TimedActionModal;
import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
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
  onCancel?: () => void;
  onClose: () => void;
  progress?: {
    currentTime: number; // in-game seconds for animation progress
    totalTime: number; // total in-game seconds for animation
    startTime: number; // in-game seconds, passed from game state
  } | null;
  currentEnergy?: number;
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
  onCancel,
  onClose,
  progress,
  currentEnergy,
}) => {
  const [duration, setDuration] = useState(1);
  const preview = useMemo(() => {
      if (calculatePreview) return calculatePreview(duration);
      return null;
  }, [duration, calculatePreview]);

  const canAfford = useMemo(() => {
    if (currentEnergy === undefined || !preview || preview.energyCost === undefined) return true;
    return currentEnergy >= preview.energyCost;
  }, [currentEnergy, preview]);

  const [progressTime, setProgressTime] = useState(0);
  const progressTimerRef = useRef<number | null>(null);
  const hasClosedRef = useRef(false);

  const handleCancel = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (onCancel) onCancel();
    else onClose();
  };

  useEffect(() => {
    if (isOpen && !progress) {
      // Reset state when opening in setup view
      setDuration(1);
      setProgressTime(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
  }, [isOpen, progress]);

  useLayoutEffect(() => {
    if (progress && progress.totalTime > 0) {
      setProgressTime(0);
      hasClosedRef.current = false;
    }
  }, [progress]);

  useEffect(() => {
    if (progress && progress.totalTime > 0) {
      const totalSeconds = progress.totalTime;
      const stepDuration = 50;
      const timeStep = totalSeconds / (2000 / stepDuration);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      progressTimerRef.current = window.setInterval(() => {
        setProgressTime(prev => {
          const newTime = prev + timeStep;
          if (newTime >= totalSeconds) {
            if (progressTimerRef.current) clearInterval(progressTimerRef.current);
            if (!hasClosedRef.current) {
              hasClosedRef.current = true;
              setTimeout(() => { onClose(); }, 300);
            }
            return totalSeconds;
          }
          return newTime;
        });
      }, stepDuration);
      return () => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      };
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Select duration</p>
        <div className="text-6xl font-bold tracking-tighter text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
            {duration}<span className="text-2xl ml-2 text-zinc-500 tracking-normal uppercase">hr{duration > 1 ? 's' : ''}</span>
        </div>
        <div className="px-4 mt-8">
            <input
                type="range"
                min="1"
                max={maxDuration}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100 hover:accent-white transition-all"
            />
            <div className="flex justify-between mt-3 px-1">
                <span className="text-[10px] font-black text-zinc-700">1H</span>
                <span className="text-[10px] font-black text-zinc-700">{maxDuration}H</span>
            </div>
        </div>
      </div>

      <div className="my-8 p-6 bg-black/40 border border-zinc-800/50 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-3">
                <Clock size={12} className="text-zinc-600"/> Time Cost
            </span>
            <span className="text-xs font-bold text-white tracking-widest">{duration} HOUR{duration > 1 && 'S'}</span>
        </div>
        {preview.energyCost !== undefined && (
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-3">
                    <Zap size={12} className="text-blue-500/50"/> Energy Cost
                </span>
                <span className={`text-xs font-bold tracking-widest ${canAfford ? 'text-white' : 'text-red-500 animate-pulse'}`}>
                  {preview.energyCost} {!canAfford && '(TOO TIRED)'}
                </span>
            </div>
        )}
      </div>
      
      <div className="flex justify-end items-center gap-3">
        <button 
          onClick={handleCancel}
          className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all border border-transparent hover:border-zinc-800 rounded-lg hover:bg-white/5"
        >
          Cancel
        </button>
        <button 
          onClick={() => canAfford && onStart(duration)}
          disabled={!canAfford}
          className="px-8 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-zinc-800/50 border border-zinc-700/50 rounded-lg transition-all hover:bg-white/10 hover:border-zinc-400 hover:shadow-xl disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
        >
          Begin
        </button>
      </div>
    </>
    );
  };

  const renderProgressView = () => {
    if (!progress) return null;
    const { totalTime, startTime } = progress;
    const currentInGameSeconds = startTime + progressTime;
    const progressPercentage = (progressTime / totalTime) * 100;

    return (
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 animate-pulse">
                <Clock size={24} className="text-zinc-400" />
            </div>
            <div className="text-left">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Processing</h3>
                <p className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Cinzel, serif' }}>{actionName || 'Action'}</p>
            </div>
        </div>

        <div className="mb-8">
            <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">In-Game Time</span>
                <span className="text-xl font-bold font-mono tracking-tighter text-white">{formatTime(currentInGameSeconds)}</span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full border border-zinc-800/50 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-zinc-600 via-zinc-400 to-white transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>
        </div>
        
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 animate-pulse">
            Time is passing...
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-opacity duration-500">
      <div 
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-zinc-950/90 backdrop-blur-2xl rounded-2xl border border-zinc-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 overflow-hidden relative group animate-scale-in"
      >
        {/* Top glass accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />

        {actionName && !progress && (
          <h2 className="text-2xl font-bold text-white mb-6 tracking-[0.15em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
            {actionName}
          </h2>
        )}
        
        {progress ? renderProgressView() : renderSetupView()}
        
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

export default TimedActionModal;

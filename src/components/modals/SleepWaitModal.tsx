import React, { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { X, Bed, Clock, Zap, Sun } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { useCharacterStore } from '../../stores/useCharacterStore';

interface SleepWaitModalProps {
  isOpen: boolean;
  mode: 'sleep' | 'wait';
  sleepQuality?: number;
  canSleepOnGround?: boolean;
  onComplete: (hours: number, resolvedMode: 'sleep' | 'wait', resolvedSleepQuality: number) => void;
  onCancel: () => void;
  currentTimeInSeconds: number;
  fixedDuration?: number;
}

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return [hours, minutes]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
};

const SleepWaitModal: FC<SleepWaitModalProps> = ({
  isOpen,
  mode,
  sleepQuality = 1.0,
  canSleepOnGround = false,
  onComplete,
  onCancel,
  currentTimeInSeconds,
  fixedDuration,
}) => {
  const [duration, setDuration] = useState(1);
  const [selectedMode, setSelectedMode] = useState<'sleep' | 'wait'>(mode);
  const [isProgressing, setIsProgressing] = useState(false);
  const [progressTime, setProgressTime] = useState(0);
  const progressTimerRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const hunger = useCharacterStore((state) => state.hunger);
  const MOCK_ENERGY_RESTORE_PER_HOUR = 10;
  const HP_RESTORE_PER_HOUR_BASE = 5;
  const activeSleepQuality = selectedMode === 'sleep'
    ? (mode === 'sleep' ? sleepQuality : 0.5)
    : 1.0;

  const getEffectsText = () => {
    if (selectedMode !== 'sleep') return 'Time will pass.';

    const energyRestore = Math.floor(duration * MOCK_ENERGY_RESTORE_PER_HOUR * activeSleepQuality);
    const hpRestore = hunger > 0 ? Math.floor(HP_RESTORE_PER_HOUR_BASE * activeSleepQuality * duration) : 0;

    let text = `+${energyRestore} Energy`;
    if (hpRestore > 0) text += `, +${hpRestore} HP`;
    else if (hunger <= 0) text += ', 0 HP (Starving)';
    if (mode !== 'sleep') text += ' (Ground Sleep)';

    return text;
  };

  useEffect(() => {
    if (isOpen) {
      setDuration(fixedDuration ?? 1);
      setSelectedMode(mode);
      setIsProgressing(false);
      setProgressTime(0);
      completedRef.current = false;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
  }, [isOpen, fixedDuration, mode]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsProgressing(true);

    const totalSeconds = duration * 3600;
    const stepDuration = 50;
    const timeStep = totalSeconds / (2000 / stepDuration);

    progressTimerRef.current = window.setInterval(() => {
      setProgressTime((prev) => {
        const next = prev + timeStep;
        if (next >= totalSeconds) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          setTimeout(() => {
            if (!completedRef.current) {
              completedRef.current = true;
              onComplete(duration, selectedMode, activeSleepQuality);
            }
          }, 300);
          return totalSeconds;
        }
        return next;
      });
    }, stepDuration);
  };

  const handleCancelAction = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    onCancel();
  };

  const title = selectedMode === 'sleep' ? 'How long will you sleep?' : 'How long will you wait?';
  const Icon = selectedMode === 'sleep' ? Bed : Clock;

  const renderSetupView = () => (
    <div className="space-y-8">
      <div className="text-center">
        {mode === 'wait' && canSleepOnGround && (
          <div className="inline-flex items-center gap-2 mb-6 p-1 rounded-xl bg-black/40 border border-zinc-800/50">
            <button
              onClick={() => setSelectedMode('wait')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${
                selectedMode === 'wait'
                  ? 'bg-zinc-200 text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Wait
            </button>
            <button
              onClick={() => setSelectedMode('sleep')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${
                selectedMode === 'sleep'
                  ? 'bg-zinc-200 text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Sleep on Ground
            </button>
          </div>
        )}

        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Select duration</p>
        <div className="text-6xl font-bold tracking-tighter text-white mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          {duration}
          <span className="text-2xl ml-2 text-zinc-500 tracking-normal uppercase">hr{duration > 1 ? 's' : ''}</span>
        </div>
        <div className="max-w-xl mx-auto mt-8">
          <input
            type="range"
            min="1"
            max={selectedMode === 'wait' ? 24 : 12}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            disabled={!!fixedDuration}
            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100 hover:accent-white transition-all"
          />
          <div className="flex justify-between mt-3 px-1">
            <span className="text-[10px] font-black text-zinc-700">1H</span>
            <span className="text-[10px] font-black text-zinc-700">{selectedMode === 'wait' ? 24 : 12}H</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-black/30 border border-zinc-800/40 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-3 mb-3">
            <Sun size={12} className="text-zinc-600" /> End Time
          </p>
          <p className="text-lg font-bold text-white tracking-widest">
            {formatTime(currentTimeInSeconds + duration * 3600)}
          </p>
        </div>
        <div className="p-5 bg-black/30 border border-zinc-800/40 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-3 mb-3">
            {selectedMode === 'sleep'
              ? <Zap size={12} className="text-blue-500/50" />
              : <Clock size={12} className="text-zinc-600" />}
            Expected Effects
          </p>
          <p className="text-sm font-bold text-white tracking-tight leading-relaxed">
            {getEffectsText()}
          </p>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 pt-2">
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
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-opacity duration-500">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md lg:max-w-3xl bg-zinc-950/90 backdrop-blur-2xl rounded-2xl border border-zinc-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 lg:p-10 overflow-hidden relative group animate-scale-in"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <Icon size={24} className="text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-[0.1em] uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
              {selectedMode === 'sleep' ? 'Rest & Recovery' : 'Pass the Time'}
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
              {selectedMode === 'sleep' ? 'Dreaming...' : 'Waiting...'}
            </p>
          </div>
        ) : renderSetupView()}

        {isProgressing && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleCancelAction}
              className="px-6 py-2 text-sm font-semibold text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-2"
            >
              <X size={16} /> Cancel Rest
            </button>
          </div>
        )}

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

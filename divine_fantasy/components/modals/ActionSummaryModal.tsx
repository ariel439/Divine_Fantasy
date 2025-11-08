
import React, { ReactElement } from 'react';
import type { FC } from 'react';
import { Clock, Award, PackageMinus } from 'lucide-react';
import type { ActionSummary } from '../../types';
import Section from '../ui/Section';

interface ActionSummaryModalProps {
  isOpen: boolean;
  summary: ActionSummary;
  onClose: () => void;
}

const formatDuration = (totalMinutes: number): string => {
    if (totalMinutes < 1) return 'less than a minute';
    const roundedMinutes = Math.round(totalMinutes);
    if (roundedMinutes < 60) {
        return `${roundedMinutes} minute${roundedMinutes > 1 ? 's' : ''}`;
    }
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    
    return parts.join(' ');
}

const ActionSummaryModal: FC<ActionSummaryModalProps> = ({
  isOpen,
  summary,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
    >
      <div 
        role="dialog"
        className="w-full max-w-lg bg-zinc-950 rounded-xl border border-zinc-700 shadow-2xl p-6 transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
        style={{ animation: 'scaleIn 0.2s ease-out forwards' }}
      >
        <header className="text-center border-b border-zinc-700 pb-4 mb-6">
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                {summary.title}
            </h2>
            <div className="flex items-center justify-center gap-2 text-zinc-400 mt-2">
                <Clock size={16} />
                <span>{formatDuration(summary.durationInMinutes)} passed</span>
            </div>
        </header>

        <div className="space-y-6">
            {summary.vitalsChanges.length > 0 && (
                <Section title="Vitals">
                    <div className="space-y-2">
                        {summary.vitalsChanges.map((vital, index) => (
                             <div key={index} className="flex items-center justify-between bg-black/20 p-3 rounded-md border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    {vital.icon && (
                                        <div className="text-red-400">{vital.icon}</div>
                                    )}
                                    <span className="font-semibold text-white">{vital.vital}</span>
                                </div>
                                <span className={`font-bold text-lg ${vital.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {vital.change > 0 ? '+' : ''}{vital.change}
                                </span>
                            </div>
                        ))}
                    </div>
                </Section>
            )}
            
            {summary.expended && summary.expended.length > 0 && (
                 <Section title="Resources Used">
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                        {summary.expended.map((exp, index) => (
                             <div key={index} className="flex items-center justify-between bg-black/20 p-3 rounded-md border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        {exp.icon ? React.cloneElement(exp.icon as ReactElement<{ size: number }>, { size: 24 }) : <PackageMinus size={24} />}
                                    </div>
                                    <span className="font-semibold text-white">{exp.name}</span>
                                </div>
                                <span className="font-bold text-lg text-red-400">
                                    -{exp.quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {summary.rewards.length > 0 && (
                 <Section title="Rewards">
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {summary.rewards.map((reward, index) => (
                             <div key={index} className="flex items-center justify-between bg-black/20 p-3 rounded-md border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center text-yellow-300">
                                        {reward.icon ? React.cloneElement(reward.icon as ReactElement<{ size: number }>, { size: 24 }) : <Award size={24} />}
                                    </div>
                                    <span className="font-semibold text-white">{reward.name}</span>
                                </div>
                                <span className="font-bold text-lg text-green-400">
                                    +{reward.quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>

        <div className="flex justify-center mt-8">
          <button 
            onClick={onClose}
            className="px-8 py-3 w-full max-w-xs text-md font-semibold tracking-wide text-white/90 bg-zinc-800 border border-zinc-700 rounded-md transition-all duration-300 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            Continue
          </button>
        </div>
       <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  </div>
  );
};

export default ActionSummaryModal;

import React from 'react';
import type { FC, ReactNode } from 'react';
import type { Choice } from '../../types';

interface ChoiceEventScreenProps {
  title?: string;
  imageUrl?: string;
  eventText: ReactNode;
  choices: Choice[];
}

const ChoiceButton: FC<{ choice: Choice, index: number }> = ({ choice, index }) => {
    return (
        <button
            style={{ animationDelay: `${200 + index * 150}ms`}}
            onClick={choice.onSelect}
            disabled={choice.disabled}
            className="w-full text-left p-4 bg-zinc-900/80 border border-zinc-700 rounded-lg transition-all duration-300 hover:bg-zinc-800/80 hover:border-zinc-600 hover:shadow-lg hover:-translate-y-1 disabled:bg-zinc-800/50 disabled:border-zinc-700/50 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:transform-none animate-fade-in-up"
          >
            <span className="font-semibold text-white/90">
              {choice.skillCheck && (
                <span className={`mr-2 font-bold ${choice.disabled ? 'text-zinc-500' : 'text-yellow-400'}`}>
                  [{choice.skillCheck.skill}]
                </span>
              )}
              {choice.text}
            </span>
        </button>
    );
};


const ChoiceEventScreen: FC<ChoiceEventScreenProps> = ({ title, imageUrl, eventText, choices }) => {
  return (
    <div className="relative w-full h-full">
      {/* The background is handled by the App component, this provides extra dimming/blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Flex container for responsive layout */}
      <div className="relative w-full h-full flex flex-col lg:flex-row">
          {/* Image Panel */}
          <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex items-center justify-center p-4 sm:p-8 animate-fade-in-up">
               {imageUrl && (
                  <img 
                      src={imageUrl} 
                      alt={title || 'Event'} 
                      className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] max-h-[40vh] lg:max-h-[80vh]"
                  />
               )}
          </div>

          {/* Content & Choices Panel */}
          <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex items-center justify-center p-4 sm:p-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="w-full h-full max-w-3xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-2xl flex flex-col p-6">
                  {title && (
                      <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-wider mb-4 flex-shrink-0 text-center" style={{ fontFamily: 'Cinzel, serif' }}>
                          {title}
                      </h2>
                  )}
                  <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 mb-4">
                      <p className="text-zinc-300 leading-relaxed text-base lg:text-lg">{eventText}</p>
                  </div>
                  <div className="flex-shrink-0 mt-auto space-y-3">
                      {choices.map((choice, index) => (
                         <ChoiceButton key={index} choice={choice} index={index} />
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ChoiceEventScreen;

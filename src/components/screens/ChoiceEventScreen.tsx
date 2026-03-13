
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
            className="w-full text-left p-4 bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-xl transition-all duration-500 hover:bg-white/10 hover:border-zinc-400 hover:shadow-2xl hover:-translate-y-1 group disabled:bg-zinc-900/30 disabled:border-zinc-800/50 disabled:text-zinc-600 disabled:cursor-not-allowed disabled:transform-none animate-fade-in-up"
          >
            <div className="flex items-center justify-between">
                <span className="font-bold tracking-widest uppercase text-xs text-zinc-100 group-hover:text-white transition-colors">
                  {choice.skillCheck && (
                    <span className={`mr-3 font-black ${choice.disabled ? 'text-zinc-600' : 'text-yellow-500'}`}>
                      [{choice.skillCheck.skill}]
                    </span>
                  )}
                  {choice.text}
                </span>
                <div className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center group-hover:border-zinc-400 transition-colors">
                    <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full group-hover:bg-zinc-400 transition-colors" />
                </div>
            </div>
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
              <div className="w-full h-full max-w-3xl bg-zinc-950/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl flex flex-col p-8 lg:p-12">
                  {title && (
                      <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-[0.2em] mb-8 flex-shrink-0 text-center uppercase" style={{ fontFamily: 'Cinzel, serif' }}>
                          {title}
                      </h2>
                  )}
                  <div className="flex-grow overflow-y-auto custom-scrollbar pr-6 mb-8">
                      <p className="text-zinc-200 leading-relaxed text-lg lg:text-xl font-light italic text-center">
                          "{eventText}"
                      </p>
                  </div>
                  <div className="flex-shrink-0 mt-auto space-y-4">
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

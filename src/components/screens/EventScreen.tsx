
import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';
import type { Slide } from '../../types';

interface EventScreenProps {
  slides: Slide[];
  onComplete: () => void;
}

const EventScreen: FC<EventScreenProps> = ({ slides, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentSlide = slides[currentIndex];
    const isLastSlide = currentIndex === slides.length - 1;

    // Preload images to prevent flicker and reset index on slides change
    useEffect(() => {
        setCurrentIndex(0);
        slides.forEach(slide => {
            const img = new Image();
            img.src = slide.image;
        });
    }, [slides]);

    if (!currentSlide) return null;

    const handleNavigation = (direction: 'next' | 'prev') => {
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (isTransitioning || nextIndex < 0 || nextIndex >= slides.length) return;

        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(nextIndex);
            setIsTransitioning(false);
        }, 500); // Corresponds to animation duration
    };

    const goToNext = () => {
        if (!isLastSlide) {
            handleNavigation('next');
        } else {
            onComplete();
        }
    };
    
    return (
        <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div
                key={currentIndex}
                className={`absolute inset-0 bg-cover bg-center animate-kenburns ${isTransitioning ? 'animate-fade-out' : 'animate-fade-in-slow'}`}
                style={{ backgroundImage: `url(${currentSlide.image})` }}
            />
            
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
            
            <button onClick={onComplete} className="absolute top-8 right-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-all p-2 rounded-full hover:bg-white/5 border border-transparent hover:border-zinc-800 z-20">
                <span className="font-bold tracking-widest uppercase text-[10px] hidden sm:inline">Skip Sequence</span>
                <X size={18} />
            </button>
            
            {/* Text and Navigation */}
            <div className={`relative w-full h-full flex flex-col justify-end ${isTransitioning ? 'animate-fade-out' : 'animate-fade-in-slow'}`}>
                {/* Text Overlay - Modern Glassmorphism */}
                <div className="pb-32 pt-20 px-8 md:px-12 w-full bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent">
                    <div className="max-w-4xl mx-auto">
                        <p className="text-zinc-200 leading-relaxed text-lg md:text-xl text-center font-light italic" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                            "{currentSlide.text}"
                        </p>
                    </div>
                </div>

                {/* Navigation - Floating minimalist bar */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 py-3 px-8 bg-zinc-950/50 backdrop-blur-xl border border-zinc-800/50 rounded-full shadow-2xl">
                    <button 
                        onClick={() => handleNavigation('prev')} 
                        disabled={currentIndex === 0 || isTransitioning}
                        className="p-2 text-zinc-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex items-center gap-3">
                        {slides.map((_, index) => (
                            <div 
                                key={index}
                                className={`h-1 rounded-full transition-all duration-500 ${currentIndex === index ? 'w-8 bg-zinc-100' : 'w-2 bg-zinc-700'}`}
                            ></div>
                        ))}
                    </div>

                    <button 
                        onClick={goToNext}
                        disabled={isTransitioning}
                        className="p-2 text-zinc-100 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                        {isLastSlide ? <Play size={24} className="text-zinc-100 fill-zinc-100" /> : <ChevronRight size={24} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventScreen;

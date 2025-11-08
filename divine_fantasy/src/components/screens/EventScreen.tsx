
import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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

    // Preload images to prevent flicker
    useEffect(() => {
        slides.forEach(slide => {
            const img = new Image();
            img.src = slide.image;
        });
    }, [slides]);

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
        <div className="w-full h-full bg-black flex items-center justify-center">
            {/* Background Image */}
            <div
                key={currentIndex}
                className={`absolute inset-0 bg-cover bg-center animate-kenburns ${isTransitioning ? 'animate-fade-out' : 'animate-fade-in-slow'}`}
                style={{ backgroundImage: `url(${currentSlide.image})` }}
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/40"></div>
            
            <button onClick={onComplete} className="absolute top-6 right-6 flex items-center gap-2 text-zinc-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-20">
                <span className="font-semibold hidden sm:inline">Skip</span>
                <X size={20} />
            </button>
            
            {/* Text and Navigation */}
            <div className={`relative w-full h-full flex flex-col justify-end ${isTransitioning ? 'animate-fade-out' : 'animate-fade-in-slow'}`}>
                {/* Text Overlay */}
                <div className="pt-32 pb-24 px-8 md:px-12 w-full bg-gradient-to-t from-black via-black/80 to-transparent">
                    <div className="max-w-4xl mx-auto">
                        <p className="text-zinc-200 leading-relaxed text-base md:text-lg text-center shadow-text">
                            {currentSlide.text}
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between py-4 px-6 bg-black/30">
                    <button 
                        onClick={() => handleNavigation('prev')} 
                        disabled={currentIndex === 0 || isTransitioning}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white/90 bg-white/5 border border-white/20 rounded-md transition-all duration-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    <div className="flex items-center gap-2">
                        {slides.map((_, index) => (
                            <div 
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-zinc-300' : 'bg-zinc-600'}`}
                            ></div>
                        ))}
                    </div>

                    <button 
                        onClick={goToNext}
                        disabled={isTransitioning}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white/90 bg-zinc-700 border border-zinc-600 rounded-md transition-all duration-300 hover:bg-zinc-600 hover:shadow-[0_0_15px_rgba(161,161,170,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isLastSlide ? 'Continue' : 'Next'}
                        {!isLastSlide && <ChevronRight size={16} />}
                    </button>
                </div>
            </div>
             <style>{`
                .shadow-text { text-shadow: 0 1px 5px rgba(0,0,0,0.7); }
            `}</style>
        </div>
    );
};

export default EventScreen;

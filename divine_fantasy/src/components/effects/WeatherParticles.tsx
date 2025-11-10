
import React, { useState, useEffect, useMemo } from 'react';
import type { FC } from 'react';
import { useWorldTimeStore } from '../../stores/useWorldTimeStore';

type Weather = ReturnType<typeof useWorldTimeStore.getState>['weather'];

interface WeatherParticlesProps {
    weather: Weather;
}

const WeatherParticles: FC<WeatherParticlesProps> = ({ weather }) => {
    const [isHiding, setIsHiding] = useState(false);
    const [activeWeather, setActiveWeather] = useState(weather);

    useEffect(() => {
        // If the new weather has particles, update immediately and ensure it's visible.
        if (weather === 'Rainy' || weather === 'Snowy') {
            setIsHiding(false);
            setActiveWeather(weather);
        } 
        // If the new weather has NO particles, but we ARE showing particles...
        else if (activeWeather === 'Rainy' || activeWeather === 'Snowy') {
            setIsHiding(true);
            // After a delay to let existing particles fall, stop rendering them completely.
            const timer = setTimeout(() => {
                setActiveWeather(weather);
                setIsHiding(false); // Reset for next time
            }, 2000); // 2-second fade-out duration

            return () => clearTimeout(timer);
        } else {
            // This handles transitions between non-particle states (e.g., Sunny to Cloudy)
            setActiveWeather(weather);
        }
    }, [weather, activeWeather]);

    const particles = useMemo(() => {
        if (activeWeather !== 'Rainy' && activeWeather !== 'Snowy') {
            return null;
        }

        const particleCount = activeWeather === 'Rainy' ? 40 : 50;
        return Array.from({ length: particleCount }).map((_, i) => {
            const style: React.CSSProperties = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * (activeWeather === 'Rainy' ? 2 : 5) + (activeWeather === 'Rainy' ? 2 : 5)}s`, // Rain: 2-4s, Snow: 5-10s
                animationDelay: `${Math.random() * 5}s`,
            };

            if (activeWeather === 'Snowy') {
                const size = `${Math.random() * 4 + 2}px`;
                style.width = size;
                style.height = size;
                style.opacity = Math.random() * 0.5 + 0.3;
                // --sway is a custom property used in the CSS animation
                style['--sway' as any] = `${(Math.random() - 0.5) * 10}vw`;
            }

            return (
                <div 
                    key={i} 
                    className={activeWeather === 'Rainy' ? 'raindrop' : `snowflake`} 
                    style={style} 
                />
            );
        });
    }, [activeWeather]);


    if (!particles) {
        return null;
    }

    return <div className={`particle-container ${isHiding ? 'animate-fade-out-weather' : ''}`}>{particles}</div>;
};

export default React.memo(WeatherParticles);

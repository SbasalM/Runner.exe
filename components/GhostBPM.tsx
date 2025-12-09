import React, { useEffect, useState } from 'react';
import { AppMode } from '../types';
import { MODE_CONFIG } from '../constants';

interface GhostBPMProps {
  value: string | number;
  label: string;
  mode: AppMode;
  isSpotlight: boolean;
}

export const GhostBPM: React.FC<GhostBPMProps> = ({ value, label, mode, isSpotlight }) => {
  const config = MODE_CONFIG[mode];
  const [displayValue, setDisplayValue] = useState(value);
  const [prevValue, setPrevValue] = useState<string | number | null>(null);

  // Handle the "Ghost" value logic
  useEffect(() => {
    if (value !== displayValue) {
      setPrevValue(displayValue);
      setDisplayValue(value);
      
      // Clear the ghost (prev) value after animation completes
      const timer = setTimeout(() => {
        setPrevValue(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  // Adjust font size for longer time strings to prevent wrapping/overflow
  const isTime = typeof displayValue === 'string' && String(displayValue).includes(':');
  // Boosted font sizes
  const fontSize = isTime ? 'text-6xl md:text-8xl' : 'text-7xl md:text-8xl';

  return (
    <div 
      className={`absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-in-out flex flex-col items-center justify-center pointer-events-none
      ${isSpotlight 
        ? 'top-1/2 -translate-y-1/2 z-50 scale-150 h-auto pb-0' 
        : 'top-[78%] -translate-y-0 z-10 scale-100 h-20 pb-0'
      }`}
    >
      {/* Label only visible in Spotlight or specific design choice */}
      <div className={`text-xs font-bold tracking-[0.5em] uppercase mb-1 transition-opacity duration-500 ${isSpotlight ? 'text-white opacity-100' : 'text-gray-500 opacity-0'}`}>
        {label}
      </div>

      <div className="relative whitespace-nowrap">
        {/* Current Value */}
        <div 
          key={String(displayValue)} // Trigger animation on change
          className={`
            ${fontSize} font-black brand-font tracking-tighter leading-none
            animate-glitch-in transition-colors duration-1000
            ${isSpotlight ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : config.color}
          `}
          style={{ textShadow: isSpotlight ? 'none' : '0 0 10px currentColor' }}
        >
          {displayValue}
        </div>

        {/* The "Ghost" Value (Previous value fading out and floating up) */}
        {prevValue !== null && (
          <div 
            className={`
              absolute top-0 left-1/2 -translate-x-1/2 w-full text-center
              ${fontSize} font-black brand-font tracking-tighter leading-none
              opacity-50 blur-[2px]
              animate-ghost-float-up
              ${config.color}
            `}
          >
            {prevValue}
          </div>
        )}
      </div>

      <div className={`text-xs font-bold tracking-widest mt-0 transition-colors duration-500 ${isSpotlight ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </div>

      <style>{`
        @keyframes ghost-float-up {
          0% { transform: translate(-50%, 0) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -30px) scale(1.1); opacity: 0; }
        }
        @keyframes glitch-in {
          0% { opacity: 0; transform: scale(1.2); filter: blur(4px); }
          20% { opacity: 1; transform: scale(1); filter: blur(0); }
          40% { transform: translate(-2px, 0); }
          60% { transform: translate(2px, 0); }
          100% { transform: translate(0, 0); }
        }
        .animate-ghost-float-up {
          animation: ghost-float-up 0.6s ease-out forwards;
        }
        .animate-glitch-in {
          animation: glitch-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
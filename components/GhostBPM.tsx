
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
      
      const timer = setTimeout(() => {
        setPrevValue(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  // Adjust font size based on character length
  // SCALED DOWN SLIGHTLY
  const strValue = String(displayValue);
  const length = strValue.length;
  
  let fontSize = 'text-[24vw] md:text-[10rem]'; 
  
  if (length > 5) {
      fontSize = 'text-[14vw] md:text-[6rem]'; 
  } else if (length > 3 || strValue.includes(':') || strValue.includes('.')) {
      fontSize = 'text-[18vw] md:text-[8rem]';
  }

  return (
    <div 
      className={`relative w-full flex-1 flex flex-col items-center justify-end pointer-events-none transition-all duration-1000`}
    >
      {/* Top Label Removed as requested to avoid duplication in spotlight */}

      <div className="relative whitespace-nowrap flex justify-center w-full">
        {/* Current Value */}
        <div 
          key={String(displayValue)} 
          className={`
            ${fontSize} font-black brand-font tracking-tighter leading-none
            animate-glitch-in transition-colors duration-1000 text-center
            ${isSpotlight ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : config.color}
          `}
          style={{ 
            WebkitTextStroke: '2px black', 
            paintOrder: 'stroke fill',
            textShadow: isSpotlight ? 'none' : '0 0 20px currentColor',
            lineHeight: 0.8
          }}
        >
          {displayValue}
        </div>

        {/* Ghost Value */}
        {prevValue !== null && (
          <div 
            className={`
              absolute top-0 left-1/2 -translate-x-1/2 w-full text-center
              ${fontSize} font-black brand-font tracking-tighter leading-none
              opacity-50 blur-[2px]
              animate-ghost-float-up
              ${config.color}
            `}
            style={{ 
                WebkitTextStroke: '2px black', 
                paintOrder: 'stroke fill',
                lineHeight: 0.8
            }}
          >
            {prevValue}
          </div>
        )}
      </div>

      {/* Hero Label (Bottom) - Always visible, changes style in spotlight */}
      <div className={`text-sm md:text-xl font-bold tracking-[0.5em] mt-2 transition-colors duration-500 uppercase ${isSpotlight ? 'text-gray-400' : 'text-gray-500'}`}>
        {label}
      </div>

      <style>{`
        @keyframes ghost-float-up {
          0% { transform: translate(-50%, 0) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -40px) scale(1.1); opacity: 0; }
        }
        @keyframes glitch-in {
          0% { opacity: 0; transform: scale(1.1); filter: blur(4px); }
          20% { opacity: 1; transform: scale(1); filter: blur(0); }
          100% { transform: translate(0, 0); }
        }
        .animate-ghost-float-up {
          animation: ghost-float-up 0.5s ease-out forwards;
        }
        .animate-glitch-in {
          animation: glitch-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

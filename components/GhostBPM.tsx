
import React, { useEffect, useState } from 'react';
import { AppMode } from '../types';
import { MODE_CONFIG } from '../constants';

interface GhostBPMProps {
  bpm: number;
  mode: AppMode;
  isSpotlight: boolean;
}

export const GhostBPM: React.FC<GhostBPMProps> = ({ bpm, mode, isSpotlight }) => {
  const config = MODE_CONFIG[mode];
  const [displayBpm, setDisplayBpm] = useState(bpm);
  const [prevBpm, setPrevBpm] = useState<number | null>(null);

  // Handle the "Ghost" value logic
  useEffect(() => {
    if (bpm !== displayBpm) {
      setPrevBpm(displayBpm);
      setDisplayBpm(bpm);
      
      // Clear the ghost (prev) value after animation completes
      const timer = setTimeout(() => {
        setPrevBpm(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [bpm, displayBpm]);

  return (
    <div 
      className={`absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-in-out flex flex-col items-center justify-center pointer-events-none
      ${isSpotlight 
        ? 'top-1/2 -translate-y-1/2 z-50 scale-150 h-auto pb-0' 
        : 'top-[105%] -translate-y-0 z-10 scale-100 h-16 pb-4' // Added h-16 and pb-4 to reserve space and fix overlap
      }`}
    >
      {/* Label only visible in Spotlight or specific design choice */}
      <div className={`text-xs font-bold tracking-[0.5em] uppercase mb-2 transition-opacity duration-500 ${isSpotlight ? 'text-white opacity-100' : 'text-gray-500 opacity-0'}`}>
        Heart Rate
      </div>

      <div className="relative">
        {/* Current BPM */}
        <div 
          key={displayBpm} // Trigger animation on change
          className={`
            text-6xl font-black brand-font tracking-tighter leading-none
            animate-glitch-in transition-colors duration-1000
            ${isSpotlight ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : config.color}
          `}
          style={{ textShadow: isSpotlight ? 'none' : '0 0 10px currentColor' }}
        >
          {displayBpm}
        </div>

        {/* The "Ghost" Number (Previous value fading out and floating up) */}
        {prevBpm !== null && (
          <div 
            className={`
              absolute top-0 left-0 w-full text-center
              text-6xl font-black brand-font tracking-tighter leading-none
              opacity-50 blur-[2px]
              animate-ghost-float-up
              ${config.color}
            `}
          >
            {prevBpm}
          </div>
        )}
      </div>

      <div className={`text-xs font-bold tracking-widest mt-1 transition-colors duration-500 ${isSpotlight ? 'text-gray-400' : 'text-gray-600'}`}>
        BPM
      </div>

      <style>{`
        @keyframes ghost-float-up {
          0% { transform: translateY(0) scale(1); opacity: 0.5; }
          100% { transform: translateY(-30px) scale(1.1); opacity: 0; }
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

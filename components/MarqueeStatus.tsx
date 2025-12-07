
import React from 'react';
import { AppMode } from '../types';

interface MarqueeStatusProps {
  label: string;
  mode: AppMode;
  isIgnited: boolean;
  isPlaying: boolean;
  isStandby: boolean;
}

export const MarqueeStatus: React.FC<MarqueeStatusProps> = ({ label, mode, isIgnited, isPlaying, isStandby }) => {
  // Determine spacing/gap based on mode to reveal more/less of the avatar
  // Updated spacing and duration for larger text and slower scroll
  let gapClass = "mr-24"; // Motivation: Standard reading loop
  // Slowed down by ~25% (20s -> 25s)
  let duration = "25s";

  if (mode === AppMode.ZONE || mode === AppMode.COOLDOWN) {
      gapClass = "mr-96"; // Zone/Cooldown: Wide gap to show off the avatar
      // Slowed down (15s -> 20s)
      duration = "20s"; 
  } 
  if (mode === AppMode.OVERDRIVE) {
      gapClass = "mr-[80vw]"; // Overdrive: Huge gap, mostly just avatar
      // Slowed down (10s -> 12s)
      duration = "12s"; 
  }

  // If ignited (Manifest sequence), the parent container handles opacity fade out.
  // We strictly handle layout here.

  return (
    <div className="w-full overflow-hidden whitespace-nowrap mask-linear-fade relative z-10 py-4">
      <div 
        className="inline-block animate-marquee will-change-transform"
        style={{ 
            animationDuration: duration,
            animationPlayState: isPlaying || isStandby ? 'running' : 'paused'
        }}
      >
        {/* Repeat text multiple times to ensure seamless infinite scroll */}
        {[...Array(6)].map((_, i) => (
          <span key={i} className={`inline-block font-black brand-font text-4xl tracking-widest ${gapClass}`}>
            {label}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .mask-linear-fade {
            mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
      `}</style>
    </div>
  );
};

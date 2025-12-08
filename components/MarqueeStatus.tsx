
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
  let gapClass = "mr-24"; 
  let duration = "25s";

  if (mode === AppMode.ZONE || mode === AppMode.COOLDOWN) {
      gapClass = "mr-96"; 
      duration = "20s"; 
  } 
  if (mode === AppMode.OVERDRIVE) {
      gapClass = "mr-[80vw]"; 
      duration = "12s"; 
  }

  return (
    <div className="w-full overflow-hidden whitespace-nowrap mask-linear-fade relative z-10 py-2">
      <div 
        className="inline-block animate-marquee will-change-transform"
        style={{ 
            animationDuration: duration,
            animationPlayState: isPlaying || isStandby ? 'running' : 'paused'
        }}
      >
        {/* Repeat text multiple times to ensure seamless infinite scroll */}
        {[...Array(6)].map((_, i) => (
          <span key={i} className={`inline-block font-black brand-font text-4xl tracking-widest drop-shadow-md ${gapClass}`}>
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
            mask-image: linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);
        }
      `}</style>
    </div>
  );
};

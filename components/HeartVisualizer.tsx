
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { AppMode } from '../types';
import { MODE_CONFIG } from '../constants';
import { AvatarScene } from './AvatarScene';
import { MarqueeStatus } from './MarqueeStatus';

interface HeartVisualizerProps {
  bpm: number;
  mode: AppMode;
  label: string;
  showBpm: boolean;
  isPlaying: boolean;
  onClick: () => void;
  unlockedItems: string[];
  isStandby?: boolean;
}

export const HeartVisualizer: React.FC<HeartVisualizerProps> = ({ bpm, mode, label, showBpm, isPlaying, onClick, unlockedItems, isStandby = false }) => {
  const config = MODE_CONFIG[mode];
  const beatDuration = useMemo(() => 60 / bpm, [bpm]);

  const isOverdrive = mode === AppMode.OVERDRIVE;
  const isMotivation = mode === AppMode.MOTIVATION;

  // Visual State Logic based on isPlaying AND Mode
  // If in Standby, keep opacity low like Motivation mode
  const glowOpacity = isPlaying ? (isMotivation ? 'opacity-10' : 'opacity-30') : 'opacity-0';
  const ringOpacity = isPlaying 
    ? (isMotivation ? 'opacity-10' : 'opacity-40') 
    : (isStandby ? 'opacity-20' : 'opacity-10');

  const coreShadow = isPlaying && !isMotivation ? '0 0 30px currentColor' : 'none';

  // --- Manifestation Sequence Logic ---
  const [manifestState, setManifestState] = useState<'IDLE' | 'IGNITE' | 'FADE_IN'>('IDLE');
  const prevModeRef = useRef<AppMode>(mode);

  useEffect(() => {
    if (mode !== prevModeRef.current && isPlaying) {
        // 1. Ignite
        setManifestState('IGNITE');
        
        // 2. Wait 1.5s then Fade In Text
        const timer1 = setTimeout(() => {
            setManifestState('FADE_IN');
        }, 1500);

        // 3. Wait 0.5s then IDLE
        const timer2 = setTimeout(() => {
            setManifestState('IDLE');
        }, 2000); 

        prevModeRef.current = mode;
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }
  }, [mode, isPlaying]);

  const isIgnited = manifestState === 'IGNITE';
  const textOpacity = isIgnited ? 'opacity-0' : 'opacity-100';

  // --- Smooth Pulse Animation Logic ---
  const pulseRef = useRef<HTMLDivElement>(null);
  const bpmRef = useRef(bpm);

  // Keep ref synced with latest BPM without re-triggering the animation loop effect
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    const element = pulseRef.current;
    if (!element) return;

    // Reset if ignited (Manifesting)
    if (isIgnited) {
        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
        return;
    }

    // Freeze if paused (Do NOT reset scale/opacity, just stop loop)
    // UNLESS we are in Standby, where we want a gentle breathe
    if (!isPlaying && !isStandby) {
        return;
    }

    let animationFrameId: number;
    let lastTime = performance.now();
    let phase = 0; // Accumulated phase (0 to 1)

    const animate = (time: number) => {
        const dt = (time - lastTime) / 1000; // Delta time in seconds
        lastTime = time;

        let frequency;
        
        if (isStandby) {
            frequency = 0.2; // 0.2 Hz = 12 BPM (Gentle breathing)
        } else {
            // Calculate frequency (Hz) = Beats Per Minute / 60
            frequency = bpmRef.current / 60;
        }
        
        // Accumulate phase
        phase += dt * frequency;
        phase = phase % 1; // Wrap around

        // Calculate Pulse Wave (Cosine for smooth breathing)
        // Cosine goes 1 -> -1 -> 1. We map it to Scale 1.0 -> 0.95 -> 1.0
        // Formula: 0.975 + 0.025 * cos(2PI * phase)
        const wave = Math.cos(phase * Math.PI * 2);
        
        const scale = 0.975 + 0.025 * wave;
        const opacity = 0.95 + 0.05 * wave; // Opacity 0.9 to 1.0

        if (pulseRef.current) {
            pulseRef.current.style.transform = `scale(${scale})`;
            pulseRef.current.style.opacity = `${opacity}`;
        }

        animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isIgnited, isStandby]); // Restart loop if Play state changes

  return (
    <div 
      className="relative flex items-center justify-center w-64 h-64 my-4 cursor-default group overflow-visible"
    >
      {/* Outer Glow */}
      <div className={`absolute inset-0 rounded-full blur-3xl ${config.borderColor} bg-current transition-all duration-[3000ms] ${glowOpacity}`}></div>
      
      {/* Outer Ring */}
      <div className={`absolute inset-0 rounded-full border-2 ${config.borderColor} transition-all duration-[3000ms] ${ringOpacity}`}></div>

      {/* Pulsing Core Container */}
      <div 
        ref={pulseRef}
        className={`
            rounded-full transition-shadow duration-[3000ms] ease-out flex items-center justify-center relative ${config.shadowColor}
            ${!isPlaying && !isStandby ? 'glitch-pause' : ''} 
        `}
        style={{
          width: '70%', 
          height: '70%',
          backgroundColor: 'transparent', 
          color: 'transparent',
          boxShadow: coreShadow,
        }}
      >
         {/* 3D AVATAR LAYER - MASKED */}
         <div className="absolute inset-0 rounded-full overflow-hidden z-0">
            <AvatarScene 
                color={config.hex} 
                mode={mode}
                bpm={bpm}
                isIgnited={isIgnited} 
                unlockedItems={unlockedItems}
                isPlaying={isPlaying}
                isStandby={isStandby}
            />
         </div>

         {/* TEXT LAYER - MARQUEE */}
         {/* Container width restricted to circle width to mask the scrolling text properly */}
         <div 
           className={`
             absolute flex items-center justify-center z-10 w-full h-full rounded-full overflow-hidden
             transition-opacity duration-500
             ${config.color}
             ${textOpacity}
           `}
           style={{
             textShadow: '0 0 15px currentColor',
           }}
         >
           {showBpm ? (
             // Large BPM Display for 7s Overlay
             <div className="flex flex-col items-center animate-fade-in-up">
                <span className="text-6xl font-black tracking-tighter brand-font leading-none">{bpm}</span>
                <span className="text-xs font-bold tracking-[0.3em] mt-2 opacity-80">BPM</span>
             </div>
           ) : (
             // New Marquee Scrolling Text
             <MarqueeStatus label={label} mode={mode} isIgnited={isIgnited} isPlaying={isPlaying} isStandby={isStandby} />
           )}
         </div>
      </div>

      {/* Ping Ring */}
      <div 
        className={`absolute inset-0 rounded-full border ${config.borderColor} transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        style={{
          animation: isPlaying ? `ping ${beatDuration}s cubic-bezier(0, 0, 0.2, 1) infinite` : 'none'
        }}
      ></div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes fade-in-up {
           from { opacity: 0; transform: translateY(10px); }
           to { opacity: 1; transform: translateY(0); }
        }
        /* Secondary Glitch Effect on Pause */
        @keyframes glitch-skew {
            0% { transform: skew(0deg); opacity: 0.9; }
            20% { transform: skew(-2deg); opacity: 0.8; }
            40% { transform: skew(1deg); opacity: 0.9; }
            60% { transform: skew(-1deg); opacity: 0.8; }
            80% { transform: skew(2deg); opacity: 0.9; }
            100% { transform: skew(0deg); opacity: 1; }
        }
        .glitch-pause {
            animation: glitch-skew 0.3s infinite;
            filter: contrast(1.2) sepia(0.3);
        }
      `}</style>
    </div>
  );
};

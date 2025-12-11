
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { AppMode, InputSource } from '../types';
import { MODE_CONFIG } from '../constants';
import { AvatarScene } from './AvatarScene';
import { MarqueeStatus } from './MarqueeStatus';
import { GhostBPM } from './GhostBPM';

interface HeartVisualizerProps {
  bpm: number;
  mode: AppMode;
  label: string;
  showBpm: boolean;
  isPlaying: boolean;
  onClick: () => void;
  equippedItems: string[];
  isStandby?: boolean;
  avatarUrl: string;
  targetMin: number;
  targetMax: number;
  inputSource: InputSource;
  timerElapsed: number; // in seconds
}

type TransitionStage = 'IDLE' | 'AVATAR_SPOTLIGHT' | 'BPM_SPOTLIGHT';

export const HeartVisualizer: React.FC<HeartVisualizerProps> = ({ 
  bpm, 
  mode, 
  label, 
  showBpm, 
  isPlaying, 
  onClick, 
  equippedItems, 
  isStandby = false, 
  avatarUrl, 
  targetMin, 
  targetMax,
  inputSource,
  timerElapsed
}) => {
  const config = MODE_CONFIG[mode];
  const beatDuration = useMemo(() => 60 / bpm, [bpm]);

  const isOverdrive = mode === AppMode.OVERDRIVE;
  const isMotivation = mode === AppMode.MOTIVATION;

  // Visual State Logic based on isPlaying AND Mode
  const glowOpacity = isPlaying ? (isMotivation ? 'opacity-10' : 'opacity-30') : 'opacity-0';
  const ringOpacity = isPlaying 
    ? (isMotivation ? 'opacity-10' : 'opacity-40') 
    : (isStandby ? 'opacity-20' : 'opacity-10');

  const coreShadow = isPlaying && !isMotivation ? '0 0 30px currentColor' : 'none';

  // --- Cinematic Transition Sequencer ---
  const [transitionStage, setTransitionStage] = useState<TransitionStage>('IDLE');
  const prevModeRef = useRef<AppMode>(mode);

  useEffect(() => {
    // Trigger sequence only on Mode Change AND when playing
    if (mode !== prevModeRef.current && isPlaying) {
        prevModeRef.current = mode; // Commit the change
        
        // Step 1: Spotlight Avatar (Focus on visual change)
        setTransitionStage('AVATAR_SPOTLIGHT');

        // Step 2: Spotlight BPM (Focus on data change)
        const timer1 = setTimeout(() => {
            setTransitionStage('BPM_SPOTLIGHT');
        }, 2000); // 2s Avatar focus

        // Step 3: Return to Idle (Resting state)
        // Increased duration: 2000ms (Avatar) + 3000ms (BPM) = 5000ms Total
        const timer2 = setTimeout(() => {
            setTransitionStage('IDLE');
        }, 5000); 

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    } else if (!isPlaying) {
        // If stopped, sync immediately to prevent stale state
        prevModeRef.current = mode;
        setTransitionStage('IDLE');
    }
  }, [mode, isPlaying]);

  // Derived states for the visuals based on Stage
  const isAvatarSpotlight = transitionStage === 'AVATAR_SPOTLIGHT';
  const isBpmSpotlight = transitionStage === 'BPM_SPOTLIGHT';
  const isOverlayActive = transitionStage !== 'IDLE';

  // --- Smooth Pulse Animation Logic ---
  const pulseRef = useRef<HTMLDivElement>(null);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    const element = pulseRef.current;
    if (!element) return;

    // Reset scale if in Spotlight mode to prevent weird clipping during zoom
    if (isAvatarSpotlight) {
        element.style.transform = 'scale(1.1)'; // Slight boost
        element.style.opacity = '1';
        return;
    }

    if (!isPlaying && !isStandby) {
        return;
    }

    let animationFrameId: number;
    let lastTime = performance.now();
    let phase = 0; 

    const animate = (time: number) => {
        const dt = (time - lastTime) / 1000;
        lastTime = time;

        let frequency;
        if (isStandby) {
            frequency = 0.2; 
        } else {
            frequency = bpmRef.current / 60;
        }
        
        phase += dt * frequency;
        phase = phase % 1; 

        const wave = Math.cos(phase * Math.PI * 2);
        const scale = 0.975 + 0.025 * wave;
        const opacity = 0.95 + 0.05 * wave;

        if (pulseRef.current) {
            pulseRef.current.style.transform = `scale(${scale})`;
            pulseRef.current.style.opacity = `${opacity}`;
        }

        animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isStandby, isAvatarSpotlight]); 

  // --- Timer Display Logic ---
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timerElapsed / 60);
    const secs = timerElapsed % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [timerElapsed]);

  // Determine what to show in the center: Time (Timer Mode) or BPM (Heart Sync Mode)
  const displayValue = inputSource === InputSource.TIMER ? formattedTime : bpm;
  const displayLabel = inputSource === InputSource.TIMER ? "TIME" : "BPM";

  return (
    // Updated container dimensions to use Viewport Height (vh) instead of fixed pixels
    // This allows it to scale nicely on different screens within a flex-1 container
    <div className="relative flex items-center justify-center h-[35vh] max-h-[400px] aspect-square my-2 cursor-default group overflow-visible shrink-0">
      
      {/* CINEMATIC OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/80 transition-opacity duration-700 pointer-events-none z-40`}
        style={{ opacity: isOverlayActive ? 1 : 0 }}
      ></div>

      {/* Outer Glow */}
      <div className={`absolute inset-0 rounded-full blur-3xl pointer-events-none ${config.borderColor} bg-current transition-all duration-[3000ms] ${glowOpacity}`}></div>
      
      {/* Outer Ring */}
      <div className={`absolute inset-0 rounded-full border-2 pointer-events-none ${config.borderColor} transition-all duration-[3000ms] ${ringOpacity}`}></div>

      {/* Pulsing Core Container */}
      <div 
        ref={pulseRef}
        className={`
            rounded-full transition-shadow duration-[3000ms] ease-out flex items-center justify-center relative ${config.shadowColor}
            ${!isPlaying && !isStandby ? 'glitch-pause' : ''} 
            ${isOverlayActive ? 'z-50' : 'z-auto'}
        `}
        style={{
          width: '70%', 
          height: '70%',
          backgroundColor: 'transparent', 
          color: 'transparent',
          boxShadow: coreShadow,
        }}
      >
         {/* 3D AVATAR LAYER */}
         <div 
            className={`
                absolute top-1/2 left-1/2 w-[400%] h-[400%] overflow-visible pointer-events-none transition-all duration-1000
                ${isBpmSpotlight ? 'opacity-20 blur-sm' : 'opacity-100 blur-0'}
            `}
            style={{
                transform: `translate(-50%, -50%) ${isAvatarSpotlight ? 'scale(1.1)' : 'scale(1.0)'}`
            }}
         >
            <AvatarScene 
                color={config.hex} 
                mode={mode}
                bpm={bpm}
                isIgnited={isOverlayActive}
                equippedItems={equippedItems}
                isPlaying={isPlaying}
                isStandby={isStandby}
                avatarUrl={avatarUrl}
                targetMin={targetMin}
                targetMax={targetMax}
            />
         </div>

         {/* TEXT LAYER - MARQUEE */}
         {/* Increased width to 160% to ensure text fades out well before the edge (fix for "pop through" effect) */}
         <div 
           className={`
             absolute flex items-end justify-center z-10 
             w-[160%] h-full left-1/2 -translate-x-1/2 
             pb-3 overflow-hidden
             transition-opacity duration-500 pointer-events-none
             ${config.color}
             ${isOverlayActive ? 'opacity-0' : 'opacity-100'}
           `}
           style={{
             textShadow: '0 0 15px currentColor',
           }}
         >
             <MarqueeStatus label={label} mode={mode} isIgnited={isOverlayActive} isPlaying={isPlaying} isStandby={isStandby} />
         </div>
      </div>

      {/* GHOST VALUE DISPLAY (BPM OR TIME) */}
      <GhostBPM 
        value={displayValue} 
        label={displayLabel} 
        mode={mode} 
        isSpotlight={isBpmSpotlight} 
      />

      {/* Ping Ring */}
      <div 
        className={`absolute inset-0 rounded-full border pointer-events-none ${config.borderColor} transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        style={{
          animation: isPlaying ? `ping ${beatDuration}s cubic-bezier(0, 0, 0.2, 1) infinite` : 'none'
        }}
      ></div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
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

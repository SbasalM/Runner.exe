
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { AppMode, WorkoutMode } from '../types';
import { MODE_CONFIG } from '../constants';
import { AvatarScene } from './AvatarScene';
import { MarqueeStatus } from './MarqueeStatus';
import { GhostBPM } from './GhostBPM';

interface HeartVisualizerProps {
  bpm: number;
  displayValue: string | number | null; 
  displayLabel: string;          
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
  isCelebration?: boolean;
  
  // Cooldown / Hold Props
  holdProgress: number;
  onHoldStart: (e: any) => void;
  onHoldEnd: () => void;
  onHoldCancel: () => void;
  isCooldown: boolean;
  cooldownStage: 'IDLE' | 'TEXT' | 'BUTTONS';
  onResume: () => void;
  onStop: () => void;
  // NEW: Workout Mode to prevent UI flashes
  workoutMode?: WorkoutMode;
  showVisor?: boolean;
}

type TransitionStage = 'IDLE' | 'AVATAR_SPOTLIGHT' | 'BPM_SPOTLIGHT';

export const HeartVisualizer: React.FC<HeartVisualizerProps> = ({ 
  bpm, 
  displayValue,
  displayLabel,
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
  isCelebration = false,
  holdProgress,
  onHoldStart,
  onHoldEnd,
  onHoldCancel,
  isCooldown,
  cooldownStage,
  onResume,
  onStop,
  workoutMode,
  showVisor
}) => {
  const config = MODE_CONFIG[mode];
  const beatDuration = useMemo(() => 60 / bpm, [bpm]);

  const isMotivation = mode === AppMode.MOTIVATION;
  
  // Use explicit prop if available, fall back to displayValue check for legacy safety
  const isGymMode = workoutMode === WorkoutMode.GYM;

  // Visual State Logic
  const glowOpacity = isPlaying ? (isMotivation ? 'opacity-10' : 'opacity-20') : 'opacity-0'; 
  
  // REMOVED coreShadow to fix "White Eclipse" issue. 
  // We now rely on tailwind config.shadowColor for the colored glow.

  // --- Cinematic Transition Sequencer V2 ---
  const [transitionStage, setTransitionStage] = useState<TransitionStage>('IDLE');
  const prevModeRef = useRef<AppMode>(mode);
  const prevCelebRef = useRef<boolean>(false);

  useEffect(() => {
    // Priority 1: Celebration Trigger (ALWAYS spotlight on PR/Celebration)
    if (isCelebration && !prevCelebRef.current) {
        setTransitionStage('AVATAR_SPOTLIGHT');
    } else if (!isCelebration && prevCelebRef.current) {
        setTransitionStage('IDLE');
    }
    prevCelebRef.current = isCelebration;

    // Priority 2: Mode Change Trigger
    if (!isCelebration && mode !== prevModeRef.current && isPlaying) {
        prevModeRef.current = mode; 
        
        // CRITICAL FIX: In Gym Mode, we toggle phases (Rest <-> Active) often.
        // We do NOT want to trigger the "Spotlight" transition for these routine changes.
        // Only trigger spotlight if we are NOT in gym mode.
        if (!isGymMode) {
            setTransitionStage('AVATAR_SPOTLIGHT');

            const timer1 = setTimeout(() => {
                setTransitionStage('BPM_SPOTLIGHT');
            }, 2000); 

            const timer2 = setTimeout(() => {
                setTransitionStage('IDLE');
            }, 5000); 

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    } else if (!isPlaying && !isCelebration) {
        prevModeRef.current = mode;
        setTransitionStage('IDLE');
    }
  }, [mode, isPlaying, isCelebration, isGymMode]);

  // Derived states
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
    if (!pulseRef.current) return;
    
    // Disable pulse scale manipulation during spotlight
    if (isAvatarSpotlight) {
        pulseRef.current.style.transform = 'scale(1)'; 
        pulseRef.current.style.opacity = '1';
        return;
    }

    if (!isPlaying && !isStandby) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let phase = 0; 

    const animate = (time: number) => {
        const dt = (time - lastTime) / 1000;
        lastTime = time;

        const frequency = isStandby ? 0.2 : bpmRef.current / 60;
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

  // --- DYNAMIC LAYOUT LOGIC ---
  
  // Data Display Transform:
  // If Spotlight: Full Center & Scale.
  // If Playing (Footer Collapsed): Normal Position.
  // If Idle (Footer Expanded): Scale Down & Shift Up to make room for buttons.
  const metricTransform = isBpmSpotlight 
    ? 'translateY(50%) scale(1.05)' 
    : (isPlaying ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.9)');

  // Data Display Layering:
  // Celebration: Topmost (z-60)
  // Spotlight: High (z-50)
  // Normal: Standard (z-30)
  const metricZIndex = isCelebration ? 60 : (isBpmSpotlight ? 50 : 30);

  return (
    <div 
        className="relative w-full h-full cursor-pointer group overflow-hidden"
        onClick={onClick}
    >
      
      {/* CINEMATIC OVERLAY (z-40) */}
      <div 
        className={`fixed inset-0 bg-black/85 transition-opacity duration-700 pointer-events-none z-40`}
        style={{ opacity: isOverlayActive ? 1 : 0 }}
      ></div>

      {/* --- AVATAR CONTAINER (Top 55%) --- */}
      <div 
        className={`absolute left-0 w-full flex items-center justify-center transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${config.color}`}
        style={{
            height: '55%',
            top: isAvatarSpotlight ? '50%' : '0%', 
            // Reduced scale pop to 1.05
            transform: isAvatarSpotlight ? 'translateY(-50%) scale(1.05)' : 'translateY(0) scale(1)',
            zIndex: isAvatarSpotlight ? 50 : 30
        }}
      >
          {/* RESTORED Constrained Glow (Clean Color Pulse) */}
          <div 
            className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                rounded-full blur-3xl pointer-events-none 
                bg-current 
                transition-all duration-[3000ms] ${glowOpacity} 
            `}
            style={{
                width: '60vw',
                height: '60vw',
                maxWidth: '320px',
                maxHeight: '320px',
            }}
          ></div>

          {/* Pulsing Core Container */}
          <div 
            ref={pulseRef}
            className={`
                aspect-square h-[85%] rounded-full transition-shadow duration-[3000ms] ease-out flex items-center justify-center relative ${config.shadowColor}
                ${!isPlaying && !isStandby ? 'glitch-pause' : ''} 
            `}
            style={{
              // REMOVED boxShadow: coreShadow to eliminate white ring
              backgroundColor: 'transparent'
            }}
          >
             {/* 3D AVATAR LAYER */}
             <div 
                className={`
                    absolute top-1/2 left-1/2 w-[300%] h-[300%] overflow-visible pointer-events-none transition-all duration-1000
                    ${isBpmSpotlight ? 'opacity-20 blur-sm' : 'opacity-100 blur-0'}
                `}
                style={{
                    transform: 'translate(-50%, -50%)'
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
                    isCelebration={isCelebration}
                    showVisor={showVisor}
                />
             </div>
          </div>

          {/* Ping Ring */}
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vh] h-[30vh] rounded-full border pointer-events-none ${config.borderColor} transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
            style={{
              animation: isPlaying ? `ping ${beatDuration}s cubic-bezier(0, 0, 0.2, 1) infinite` : 'none'
            }}
          ></div>

          {/* MARQUEE - Shifted Up by padding-bottom */}
          <div 
            className={`
              absolute bottom-0 left-0 w-full flex items-center justify-center z-10 
              overflow-hidden transition-opacity duration-500 pointer-events-none pb-8
              ${config.color}
              ${isOverlayActive ? 'opacity-0' : 'opacity-100'}
            `}
            style={{ textShadow: '0 0 15px currentColor' }}
          >
              <MarqueeStatus label={label} mode={mode} isIgnited={isOverlayActive} isPlaying={isPlaying} isStandby={isStandby} />
          </div>
      </div>


      {/* --- HERO METRIC CONTAINER (Bottom 45%) --- */}
      {/* Hide completely if in Gym Mode to prevent flash of content */}
      {!isGymMode && (
          <div 
            className="absolute left-0 w-full flex flex-col items-center justify-end transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
                height: '45%',
                bottom: isBpmSpotlight ? '50%' : '0%', 
                transform: metricTransform, // Dynamic Scaling
                zIndex: metricZIndex, // Dynamic Layering
                // Increased padding to prevent Cooldown button overlap
                paddingBottom: '200px' 
            }}
          >
             {/* Metric Value - Only Render if Valid */}
             {displayValue !== "" && displayValue !== null && (
                <div className="relative w-full flex-1 flex flex-col justify-end">
                    <GhostBPM 
                        value={displayValue} 
                        label={displayLabel} 
                        mode={mode} 
                        isSpotlight={isBpmSpotlight} 
                    />
                </div>
             )}
          </div>
      )}

      {/* --- COOLDOWN BUTTON (Independent Absolute Layer) --- */}
      {/* HIDE IN GYM MODE: GymMetrics handles the Rep Recorder overlay which contains the Resume/Stop actions */}
      {!isGymMode && (
        <div 
            className="absolute left-0 w-full px-8 md:px-12 z-30 transition-all duration-500 pointer-events-auto"
            style={{ 
                // Shift Up/Down based on Footer State (isPlaying)
                bottom: isPlaying ? '100px' : '160px', 
                transform: 'translateY(0)' 
            }}
        >
            {!isCooldown ? (
                <button
                    onMouseDown={onHoldStart}
                    onMouseUp={onHoldEnd}
                    onMouseLeave={onHoldCancel}
                    onTouchStart={onHoldStart}
                    onTouchEnd={onHoldEnd}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full py-3 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 border flex items-center justify-center gap-2 bg-cyan-950/30 text-cyan-500 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] relative overflow-hidden select-none"
                >
                    <div 
                        className="absolute inset-0 bg-red-600 z-0 transition-all duration-75 ease-linear opacity-50"
                        style={{ width: `${holdProgress}%` }}
                    ></div>

                    <div className="relative z-10 flex items-center gap-2">
                        {holdProgress > 0 ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                </svg>
                                <span>HOLD TO STOP</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.0001 2.00024V4.00024M12.0001 20.0002V22.0002M4.92908 4.92917L6.34329 6.34338M17.6569 17.657L19.0712 19.0712M2.00012 12.0002H4.00012M20.0001 12.0002H22.0001M4.92908 19.0713L6.34329 17.6571M17.6569 6.34351L19.0712 4.9293" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                ACTIVATE COOLDOWN
                            </>
                        )}
                    </div>
                </button>
            ) : (
                <div 
                    className={`flex gap-4 transition-all duration-500 ${cooldownStage === 'BUTTONS' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); onResume(); }}
                        className="flex-1 py-3 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 border flex items-center justify-center gap-2 bg-green-900/40 text-green-400 border-green-500/50 hover:bg-green-500 hover:text-black"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        RESUME
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onStop(); }}
                        className="flex-1 py-3 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 border flex items-center justify-center gap-2 bg-red-900/40 text-red-400 border-red-500/50 hover:bg-red-500 hover:text-black"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" clipRule="evenodd" />
                        </svg>
                        STOP
                    </button>
                </div>
            )}
        </div>
      )}

      <style>{`
        @keyframes ping {
          75%, 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
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

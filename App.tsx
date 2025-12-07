
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppMode, SongMetadata, WorkoutMode, UnitSystem, Settings } from './types';
import { BPM_TARGET_LOW, BPM_TARGET_HIGH, MODE_CONFIG } from './constants';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useRunEngine } from './hooks/useRunEngine';
import { useGymEngine } from './hooks/useGymEngine';
import { useProgression } from './hooks/useProgression';
import { HeartVisualizer } from './components/HeartVisualizer';
import { RunMetrics } from './components/RunMetrics';
import { GymMetrics } from './components/GymMetrics';
import { MediaPlayer } from './components/MediaPlayer';
import { DebugPanel } from './components/DebugPanel';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';

const App: React.FC = () => {
  // --- Global State ---
  const [bpm, setBpm] = useState<number>(100);
  const [currentTrack, setCurrentTrack] = useState<SongMetadata | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Settings & Modes
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>(WorkoutMode.RUN);
  const [settings, setSettings] = useState<Settings>({
    units: UnitSystem.IMPERIAL,
    targetMin: BPM_TARGET_LOW,
    targetMax: BPM_TARGET_HIGH,
    enabledServices: ['spotify', 'apple', 'youtube', 'amazon']
  });

  const [isCooldown, setIsCooldown] = useState(false);

  // UI State
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBpmOverlay, setShowBpmOverlay] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  
  // Idle Mode State
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 10000); // 10s idle
  };

  useEffect(() => {
    resetIdleTimer();
    return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);
  
  // --- Audio Mode Logic (Dependent on Custom Settings) ---
  const currentMode = useMemo((): AppMode => {
    if (isCooldown) return AppMode.COOLDOWN;
    if (bpm < settings.targetMin) return AppMode.MOTIVATION;
    if (bpm > settings.targetMax) return AppMode.OVERDRIVE;
    return AppMode.ZONE;
  }, [bpm, settings, isCooldown]);

  // Track Mode Changes for 7s Overlay
  const prevModeRef = useRef<AppMode>(currentMode);
  useEffect(() => {
    if (currentMode !== prevModeRef.current) {
      setShowBpmOverlay(true);
      const timer = setTimeout(() => setShowBpmOverlay(false), 7000); 
      prevModeRef.current = currentMode;
      return () => clearTimeout(timer);
    }
  }, [currentMode]);

  // --- Engines ---
  const { isPlaying, togglePlay, loadTrack } = useAudioEngine(currentMode);
  
  // Pass isActive flag to ensure stats reset when switching modes
  const runStats = useRunEngine(bpm, isPlaying, settings.units, workoutMode === WorkoutMode.RUN);
  const gymStats = useGymEngine(isPlaying, currentMode, workoutMode === WorkoutMode.GYM);
  
  // Progression System
  const { unlockedItems, newUnlock, lifetimeDistanceMiles, toggleUnlock } = useProgression(runStats.rawDistanceKm);

  const modeConfig = MODE_CONFIG[currentMode];

  // Force Idle (dim controls) when Play starts
  useEffect(() => {
    if (isPlaying) {
      setIsIdle(true);
    }
  }, [isPlaying]);

  // Cinematic Intro Logic
  useEffect(() => {
    if (isPlaying && !introComplete) {
      // Hold "Ready" message for 4s after play starts
      const timer = setTimeout(() => {
        setIntroComplete(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, introComplete]);

  // Determine Visualizer Label
  const introLabel = workoutMode === WorkoutMode.RUN ? "READY TO RUN" : "SYSTEM READY";
  const visualizerLabel = introComplete ? modeConfig.label : introLabel;
  
  // Standby = Not playing AND Intro not yet complete (First load)
  const isStandby = !isPlaying && !introComplete;

  // --- Helpers ---
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleFileSelect = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setCurrentTrack({ 
      name: file.name.replace(/\.[^/.]+$/, ""), 
      artist: "Local Upload",
      album: "User Device",
      source: objectUrl 
    });
    loadTrack(objectUrl);
  };

  const handleTrackSelect = (track: SongMetadata) => {
    setCurrentTrack(track);
    loadTrack(track.source);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] flex items-center justify-center p-0 md:p-8 font-mono overflow-hidden relative">
      
      {/* External Debug Panel */}
      <DebugPanel 
        isOpen={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)}
        bpm={bpm}
        setBpm={setBpm}
        modeConfig={modeConfig}
        onFileSelect={handleFileSelect}
        unlockedItems={unlockedItems}
        toggleUnlock={toggleUnlock}
      />

      {/* Explicit Floating Judge Button - UNMISSABLE STYLE */}
      {/* Moved to top-right on mobile to avoid overlapping playbar */}
      <button 
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        className="fixed top-4 right-4 md:top-auto md:bottom-8 md:right-8 z-50 bg-black border-2 border-cyan-400 text-cyan-400 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-cyan-400 hover:text-black transition-all shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-pulse hover:scale-105 hover:animate-none"
      >
        🛠️ OPEN CONTROLS
      </button>

      {/* Mobile Device Container - with Idle interaction listeners */}
      <div 
        className="relative w-full max-w-[420px] h-[100dvh] md:h-[850px] bg-black md:rounded-[3rem] md:border-8 md:border-[#1a1a1a] shadow-2xl flex flex-col overflow-hidden"
        onMouseMove={resetIdleTimer}
        onClick={resetIdleTimer}
        onTouchStart={resetIdleTimer}
        onKeyDown={resetIdleTimer}
      >
        
        {/* Ambient Gradient Background */}
        <div className={`absolute inset-0 transition-colors duration-1000 opacity-20 bg-gradient-to-b ${modeConfig.bgGradient}`}></div>
        
        {/* Top Spacer (was Navigation) */}
        <div className="relative z-20 flex justify-end items-center px-6 py-4 min-h-[60px]">
           {/* Settings moved to bottom */}
        </div>

        {/* Top Section: Visualizer */}
        <div className="relative z-10 flex flex-col items-center justify-center mt-2 overflow-visible">
           <HeartVisualizer 
              bpm={bpm} 
              mode={currentMode} 
              label={visualizerLabel}
              showBpm={showBpmOverlay}
              isPlaying={isPlaying}
              onClick={() => {}} 
              unlockedItems={unlockedItems}
              isStandby={isStandby}
            />
        </div>

        {/* Middle Section: Metrics (Conditional) */}
        <div className="relative z-10 flex-1 flex flex-col px-6 pb-4">
           {workoutMode === WorkoutMode.RUN ? (
             <RunMetrics 
               distance={runStats.distance} 
               distanceUnit={runStats.distanceUnit}
               pace={runStats.pace} 
               paceUnit={runStats.paceUnit}
               calories={runStats.calories} 
               newUnlock={newUnlock}
             />
           ) : (
             <GymMetrics 
               formattedTime={gymStats.formattedTime}
               percentages={gymStats.percentages}
             />
           )}
        </div>

        {/* Bottom Section: Controls & Media */}
        <div className="relative z-20 mt-auto flex flex-col px-6 gap-2 pb-6">
            
            {/* COOLDOWN TOGGLE BUTTON */}
            <div className={`w-full transition-all duration-[3000ms] ${isIdle ? 'opacity-10' : 'opacity-100'}`}>
                <button
                    onClick={() => setIsCooldown(!isCooldown)}
                    className={`w-full py-3 mb-2 rounded-xl font-bold tracking-widest uppercase transition-all duration-500 border flex items-center justify-center gap-2 ${
                        isCooldown 
                        ? 'bg-blue-500 text-black border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
                        : 'bg-gray-900/50 text-blue-400 border-blue-900/30 hover:bg-blue-900/20'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.0001 2.00024V4.00024M12.0001 20.0002V22.0002M4.92908 4.92917L6.34329 6.34338M17.6569 17.657L19.0712 19.0712M2.00012 12.0002H4.00012M20.0001 12.0002H22.0001M4.92908 19.0713L6.34329 17.6571M17.6569 6.34351L19.0712 4.9293" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {isCooldown ? 'COOLING DOWN...' : 'ACTIVATE COOLDOWN'}
                </button>
            </div>

            {/* Workout Mode Toggle & Settings - Fades on Idle with 3s Transition */}
            <div className={`flex items-center justify-center gap-3 transition-all duration-[3000ms] ${isIdle ? 'opacity-10' : 'opacity-100'}`}>
                
                {/* Profile Icon - Left */}
                <button 
                    onClick={() => setShowProfileModal(true)}
                    className="h-full aspect-square flex items-center justify-center p-2.5 bg-gray-900/80 rounded-full border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                    aria-label="Profile"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </button>

                {/* Run/Gym Switch - Center */}
                <div className="flex bg-gray-900/80 rounded-full p-1 border border-gray-800">
                    <button 
                        onClick={() => setWorkoutMode(WorkoutMode.RUN)}
                        className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all ${workoutMode === WorkoutMode.RUN ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}
                    >
                        RUN
                    </button>
                    <button 
                        onClick={() => setWorkoutMode(WorkoutMode.GYM)}
                        className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all ${workoutMode === WorkoutMode.GYM ? 'bg-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/20' : 'text-gray-500 hover:text-white'}`}
                    >
                        GYM
                    </button>
                </div>

                {/* Settings Icon - Right */}
                <button 
                    onClick={() => setShowSettingsModal(true)}
                    className="h-full aspect-square flex items-center justify-center p-2.5 bg-gray-900/80 rounded-full border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                    aria-label="Settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
            
        </div>
        
        {/* Full width Media Player attached to bottom */}
        <div className="relative z-20">
             <MediaPlayer 
               isPlaying={isPlaying}
               onPlayPause={togglePlay}
               onPrev={() => triggerToast("Previous Track")}
               onNext={() => triggerToast("Next Track")}
               currentTrack={currentTrack}
               onTrackSelect={handleTrackSelect}
               enabledServices={settings.enabledServices}
            />
        </div>

        {/* Overlays */}
        <SettingsModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)}
          settings={settings}
          onUpdate={setSettings}
        />

        <ProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            lifetimeDistance={lifetimeDistanceMiles}
            unlockedItems={unlockedItems}
        />

        {showToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-xs z-50 animate-bounce">
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
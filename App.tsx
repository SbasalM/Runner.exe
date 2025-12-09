import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppMode, SongMetadata, WorkoutMode, UnitSystem, Settings, InputSource } from './types';
import { BPM_TARGET_LOW, BPM_TARGET_HIGH, MODE_CONFIG, SKULL_MODEL_URL, DEMO_PLAYLIST } from './constants';
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
import { SplashScreen } from './components/SplashScreen';

const App: React.FC = () => {
  // --- Global State ---
  const [hasStarted, setHasStarted] = useState(false);
  const [bpm, setBpm] = useState<number>(100);
  const [currentTrack, setCurrentTrack] = useState<SongMetadata | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Custom Avatar State
  const [avatarUrl, setAvatarUrl] = useState<string>(SKULL_MODEL_URL);
  const [equippedItems, setEquippedItems] = useState<string[]>([]);
  
  // Settings & Modes
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>(WorkoutMode.RUN);
  const [settings, setSettings] = useState<Settings>({
    units: UnitSystem.IMPERIAL,
    targetMin: BPM_TARGET_LOW,
    targetMax: BPM_TARGET_HIGH,
    enabledServices: ['spotify', 'apple', 'youtube', 'amazon'],
    inputSource: InputSource.HEART_RATE,
    sessionDuration: 30, // 30 minutes default
    slugStart: true,
    overdriveSpeedup: true,
    useGPS: false
  });

  const [isCooldown, setIsCooldown] = useState(false);

  // --- Timer Mode State ---
  // We need a separate timer to track the session progress if InputSource is TIMER
  const [timerElapsed, setTimerElapsed] = useState(0); // seconds

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

  // --- PLAYLIST AUTO-SKIP LOGIC ---
  const skipRef = useRef<((direction: 'next' | 'prev', forcePlay: boolean) => void) | null>(null);

  const onTrackEnd = () => {
    if (skipRef.current) {
        skipRef.current('next', true);
    }
  };
  
  // --- Audio Mode Logic ---
  // Derived based on BPM (if Heart Sync) OR Time (if Timer Mode)
  const currentMode = useMemo((): AppMode => {
    if (isCooldown) return AppMode.COOLDOWN;

    if (settings.inputSource === InputSource.TIMER) {
        // TIMER MODE LOGIC
        const durationSecs = settings.sessionDuration * 60;
        
        // 1. Slug Start (Warmup) - First 10 seconds
        if (settings.slugStart && timerElapsed < 10) {
            return AppMode.MOTIVATION;
        }

        // 2. Main Session - In The Zone
        if (timerElapsed < durationSecs) {
            return AppMode.ZONE;
        }

        // 3. Overtime - Overdrive
        return AppMode.OVERDRIVE;

    } else {
        // HEART RATE LOGIC
        if (bpm < settings.targetMin) return AppMode.MOTIVATION;
        if (bpm > settings.targetMax) return AppMode.OVERDRIVE;
        return AppMode.ZONE;
    }
  }, [bpm, settings, isCooldown, timerElapsed]);

  // --- Effective BPM for Visuals ---
  // If in Timer mode, we need to fake the BPM so the skull/pulse visuals match the mode
  const effectiveBpm = useMemo(() => {
    if (settings.inputSource === InputSource.TIMER) {
        if (currentMode === AppMode.MOTIVATION) return 90; // Slow pulse
        if (currentMode === AppMode.ZONE) return 140; // Target pulse
        if (currentMode === AppMode.OVERDRIVE) return 170; // Fast pulse
        if (currentMode === AppMode.COOLDOWN) return 70;
        return 60;
    }
    return bpm;
  }, [bpm, settings.inputSource, currentMode]);

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
  // Pass overdrive settings to audio engine
  const { isPlaying, togglePlay, loadTrack } = useAudioEngine(currentMode, onTrackEnd, settings.overdriveSpeedup);
  
  // Pass isActive flag to ensure stats reset when switching modes
  // If in Timer Mode, we fake the input BPM for the metrics too so the runner gets "credit" based on the mode intensity
  const runStats = useRunEngine(effectiveBpm, isPlaying, settings.units, workoutMode === WorkoutMode.RUN, settings.useGPS);
  const gymStats = useGymEngine(isPlaying, currentMode, workoutMode === WorkoutMode.GYM);
  
  // Progression System
  const { unlockedItems, newUnlock, lifetimeDistanceMiles, toggleUnlock } = useProgression(runStats.rawDistanceKm);

  const modeConfig = MODE_CONFIG[currentMode];

  // --- Timer Mode Counter ---
  useEffect(() => {
      // If we are playing AND in Timer Mode, increment the timer
      if (isPlaying && settings.inputSource === InputSource.TIMER && !isCooldown) {
          const interval = setInterval(() => {
              setTimerElapsed(prev => prev + 1);
          }, 1000);
          return () => clearInterval(interval);
      }
      
      // If we stop playing or switch to cooldown?
      // For now, let's keep the timer paused if paused.
      // Reset logic could be added if needed (e.g. stop button double tap)
  }, [isPlaying, settings.inputSource, isCooldown]);

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

  const handleAvatarSelect = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);
    triggerToast("Avatar System Updated");
  };

  const handleTrackSelect = (track: SongMetadata, forcePlay = false) => {
    setCurrentTrack(track);
    loadTrack(track.source, forcePlay);
  };

  const handleToggleEquip = (itemId: string) => {
    setEquippedItems(prev => {
        if (prev.includes(itemId)) {
            return prev.filter(i => i !== itemId);
        } else {
            return [...prev, itemId];
        }
    });
  };

  const handleSkip = (direction: 'next' | 'prev', forcePlay = false) => {
    if (!currentTrack) return;
    
    // Check if we are playing a demo track to enable playlist features
    const currentIndex = DEMO_PLAYLIST.findIndex(t => t.name === currentTrack.name);
    
    if (currentIndex !== -1) {
        // Calculate new index
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        
        // Loop playlist
        if (newIndex >= DEMO_PLAYLIST.length) newIndex = 0;
        if (newIndex < 0) newIndex = DEMO_PLAYLIST.length - 1;
        
        const nextTrack = DEMO_PLAYLIST[newIndex];
        
        // Use existing selection logic with optional forcePlay
        handleTrackSelect(nextTrack, forcePlay);
        
        // Notification removed as per request
    } else {
        triggerToast("Playlist unavailable for custom tracks");
    }
  };

  // Keep ref updated
  useEffect(() => {
    skipRef.current = handleSkip;
  }, [handleSkip]);

  return (
    <div className="h-[100dvh] w-full bg-[#050505] flex items-center justify-center p-0 md:p-8 font-mono overflow-hidden relative">
      
      {/* Splash Screen Overlay */}
      {!hasStarted && <SplashScreen onStart={() => setHasStarted(true)} />}

      {/* External Debug Panel */}
      {/* Only show BPM controls in debug panel if we are in Heart Rate mode */}
      <DebugPanel 
        isOpen={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)}
        bpm={settings.inputSource === InputSource.HEART_RATE ? bpm : effectiveBpm}
        setBpm={setBpm}
        modeConfig={modeConfig}
        onFileSelect={handleFileSelect}
        onAvatarSelect={handleAvatarSelect}
        unlockedItems={unlockedItems}
        toggleUnlock={toggleUnlock}
      />

      {/* Explicit Floating Judge Button */}
      {settings.inputSource === InputSource.HEART_RATE && hasStarted && (
        <button 
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="fixed top-20 right-4 z-[60] bg-black border border-cyan-400 text-cyan-400 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 hover:text-black transition-all shadow-[0_0_10px_rgba(34,211,238,0.4)] opacity-50 hover:opacity-100"
        >
            🛠️ DEBUG
        </button>
      )}

      {/* Mobile Device Container - with Idle interaction listeners */}
      <div 
        className="relative w-full max-w-[420px] h-[100dvh] md:h-[850px] bg-black md:rounded-[3rem] md:border-8 md:border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col"
        onMouseMove={resetIdleTimer}
        onClick={resetIdleTimer}
        onTouchStart={resetIdleTimer}
        onKeyDown={resetIdleTimer}
      >
        
        {/* Ambient Gradient Background */}
        <div className={`absolute inset-0 transition-colors duration-1000 opacity-20 bg-gradient-to-b ${modeConfig.bgGradient}`}></div>
        
        {/* Timer Mode Overlay Indicator */}
        {settings.inputSource === InputSource.TIMER && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-fuchsia-900/50 border border-fuchsia-500/30 px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-fuchsia-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className="text-[10px] font-bold text-fuchsia-200 tracking-wider">TIMER MODE</span>
                </div>
            </div>
        )}

        {/* --- HEADER SECTION: Navigation Controls --- */}
        {/* Dynamic Z-Index: Normal (z-40) allows interaction. Spotlight (z-20) allows Avatar (z-30) to cover it. Added bg-transparent explicitly. */}
        <div className={`relative ${showBpmOverlay ? 'z-20' : 'z-40'} flex items-center justify-between px-6 pt-4 pb-2 min-h-[60px] shrink-0 transition-all duration-[3000ms] bg-transparent ${isIdle ? 'opacity-30' : 'opacity-100'}`}>
             {/* Profile Icon - Left */}
             <button 
                onClick={() => setShowProfileModal(true)}
                className="w-10 h-10 flex items-center justify-center bg-transparent text-gray-400 hover:text-white transition-colors"
                aria-label="Profile"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </button>

            {/* Run/Gym Switch - Center */}
            <div className="flex bg-transparent rounded-full p-1">
                <button 
                    onClick={() => setWorkoutMode(WorkoutMode.RUN)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${workoutMode === WorkoutMode.RUN ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}
                >
                    RUN
                </button>
                <button 
                    onClick={() => setWorkoutMode(WorkoutMode.GYM)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${workoutMode === WorkoutMode.GYM ? 'bg-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/20' : 'text-gray-500 hover:text-white'}`}
                >
                    GYM
                </button>
            </div>

            {/* Settings Icon - Right */}
            <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-10 h-10 flex items-center justify-center bg-transparent text-gray-400 hover:text-white transition-colors"
                aria-label="Settings"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>

        {/* --- MAIN CONTENT SECTION: Visualizer + Metrics --- */}
        {/* Z-Index 30 is correct. Avatar covers header when header drops to z-20. */}
        <div className="relative z-30 flex-1 min-h-0 flex flex-col items-center justify-center w-full">
            
            {/* Visualizer - Scalable */}
            <div className="flex-none flex items-center justify-center w-full">
               <HeartVisualizer 
                  bpm={effectiveBpm} 
                  mode={currentMode} 
                  label={visualizerLabel}
                  showBpm={showBpmOverlay && settings.inputSource === InputSource.HEART_RATE}
                  isPlaying={isPlaying}
                  onClick={() => {}} 
                  equippedItems={equippedItems}
                  isStandby={isStandby}
                  avatarUrl={avatarUrl}
                  targetMin={settings.targetMin}
                  targetMax={settings.targetMax}
                  inputSource={settings.inputSource}
                  timerElapsed={timerElapsed}
                />
            </div>

            {/* Metrics - Flexible */}
            <div className="flex-1 min-h-0 w-full flex flex-col justify-start pb-2">
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
        </div>

        {/* --- FOOTER SECTION: Cooldown + Player --- */}
        <div className="relative z-20 flex-none w-full flex flex-col justify-end">
            
            {/* COOLDOWN BUTTON - Lower Z-Index so Player Tray can slide over it */}
            <div className={`relative z-10 px-6 pb-2 w-full transition-all duration-[3000ms] ${isIdle ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
                <button
                    onClick={() => setIsCooldown(!isCooldown)}
                    className={`w-full py-3 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 border flex items-center justify-center gap-2 ${
                        isCooldown 
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-[1.02]' 
                        : 'bg-cyan-950/30 text-cyan-500 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.0001 2.00024V4.00024M12.0001 20.0002V22.0002M4.92908 4.92917L6.34329 6.34338M17.6569 17.657L19.0712 19.0712M2.00012 12.0002H4.00012M20.0001 12.0002H22.0001M4.92908 19.0713L6.34329 17.6571M17.6569 6.34351L19.0712 4.9293" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {isCooldown ? 'COOLING DOWN...' : 'ACTIVATE COOLDOWN'}
                </button>
            </div>

            {/* Media Player - High Z-Index to allow Tray to overlap Cooldown */}
            <div className="w-full relative z-50">
                <MediaPlayer 
                    isPlaying={isPlaying}
                    onPlayPause={togglePlay}
                    onPrev={() => handleSkip('prev')}
                    onNext={() => handleSkip('next')}
                    currentTrack={currentTrack}
                    onTrackSelect={handleTrackSelect}
                    enabledServices={settings.enabledServices}
                />
            </div>
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
            equippedItems={equippedItems}
            onToggleEquip={handleToggleEquip}
        />

        {showToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-xs z-[70] animate-bounce whitespace-nowrap">
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
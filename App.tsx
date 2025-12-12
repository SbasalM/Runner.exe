
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppMode, SongMetadata, WorkoutMode, UnitSystem, Settings, InputSource, WorkoutSession, Playlist } from './types';
import { BPM_TARGET_LOW, BPM_TARGET_HIGH, MODE_CONFIG, SKULL_MODEL_URL, DEMO_PLAYLIST, DEMO_TRACKS } from './constants';
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
import { WorkoutSummary } from './components/WorkoutSummary';
import { GestureController } from './components/GestureController';
import { MusicLibrary } from './components/MusicLibrary';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  // --- Global State ---
  const [hasStarted, setHasStarted] = useState(false);
  const [bpm, setBpm] = useState<number>(60);
  
  const [currentTrack, setCurrentTrack] = useState<SongMetadata | null>(() => {
    try {
        const savedTrack = localStorage.getItem('cp_last_track');
        return savedTrack ? JSON.parse(savedTrack) : Object.values(DEMO_TRACKS)[0];
    } catch (e) {
        return null;
    }
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Playback State
  const [shuffle, setShuffle] = useState(false);
  const [shuffledTracks, setShuffledTracks] = useState<SongMetadata[]>([]);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  
  // Custom Avatar State
  const [avatarUrl, setAvatarUrl] = useState<string>(SKULL_MODEL_URL);
  const [equippedItems, setEquippedItems] = useState<string[]>([]);
  
  // Settings & Modes
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>(WorkoutMode.RUN);
  const [activeSessionMode, setActiveSessionMode] = useState<WorkoutMode | null>(null);

  const [settings, setSettings] = useState<Settings>({
    units: UnitSystem.IMPERIAL,
    targetMin: BPM_TARGET_LOW,
    targetMax: BPM_TARGET_HIGH,
    enabledServices: ['spotify', 'apple', 'youtube', 'amazon'], 
    inputSource: InputSource.HEART_RATE,
    sessionDuration: 30, 
    slugStart: true,
    overdriveSpeedup: true,
    useGPS: false,
    gestureControlEnabled: false,
    showJudgeControls: false
  });

  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownStage, setCooldownStage] = useState<'IDLE' | 'TEXT' | 'BUTTONS'>('IDLE');

  // --- GYM SPECIFIC STATE ---
  const [personalRecords, setPersonalRecords] = useState<Record<string, number>>({});
  const [exerciseHistory, setExerciseHistory] = useState<string[]>([]); // Unique list of titles

  // --- Timer Mode State ---
  const [timerElapsed, setTimerElapsed] = useState(0); 

  // --- Visualizer Data State ---
  const [vizDataMode, setVizDataMode] = useState<'BPM' | 'DIST' | 'PACE' | 'CAL'>('BPM');
  const [isCelebration, setIsCelebration] = useState(false);
  const lastMileInteger = useRef(0);
  const prevVizDataModeRef = useRef<'BPM' | 'DIST' | 'PACE' | 'CAL'>('BPM');

  // History & Summary State
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // UI State
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showBpmOverlay, setShowBpmOverlay] = useState(false); 
  const [introComplete, setIntroComplete] = useState(false);
  
  // Idle Mode State
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hold Button State
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStopTriggeredRef = useRef(false);

  // --- LIBRARY STATE ---
  const [libraryTracks, setLibraryTracks] = useState<SongMetadata[]>(Object.values(DEMO_TRACKS));
  const [libraryPlaylists, setLibraryPlaylists] = useState<Playlist[]>([
    {
        id: 'demo-playlist-1',
        name: 'CYBER_CORE_DEMO',
        tracks: DEMO_PLAYLIST,
        isSystem: true
    }
  ]);

  useEffect(() => {
    if (currentTrack) {
        localStorage.setItem('cp_last_track', JSON.stringify(currentTrack));
    }
  }, [currentTrack]);

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

  useEffect(() => {
    if (isCooldown) {
      setCooldownStage('TEXT');
      const timer = setTimeout(() => {
        setCooldownStage('BUTTONS');
      }, 5000); 
      return () => clearTimeout(timer);
    } else {
      setCooldownStage('IDLE');
    }
  }, [isCooldown]);

  const skipRef = useRef<((direction: 'next' | 'prev', forcePlay: boolean) => void) | null>(null);

  const onTrackEnd = () => {
    if (repeatMode === 'one' && currentTrack) {
        loadTrack(currentTrack.source, true);
    } else if (skipRef.current) {
        skipRef.current('next', true);
    }
  };
  
  // --- MODE CALCULATOR ---
  const currentMode = useMemo((): AppMode => {
    // 1. GYM MODE LOGIC OVERRIDE
    if (workoutMode === WorkoutMode.GYM) {
        // Cooldown = RESTING (Low Energy / Motivation)
        // Active = WORKING (High Energy / Zone)
        return isCooldown ? AppMode.MOTIVATION : AppMode.ZONE;
    }

    // 2. RUN MODE LOGIC (Standard)
    if (isCooldown) return AppMode.COOLDOWN;

    if (settings.inputSource === InputSource.TIMER) {
        const durationSecs = settings.sessionDuration * 60;
        if (settings.slugStart && timerElapsed < 10) return AppMode.MOTIVATION;
        if (timerElapsed < durationSecs) return AppMode.ZONE;
        return AppMode.OVERDRIVE;
    } else {
        if (bpm < settings.targetMin) return AppMode.MOTIVATION;
        if (bpm > settings.targetMax) return AppMode.OVERDRIVE;
        return AppMode.ZONE;
    }
  }, [bpm, settings, isCooldown, timerElapsed, workoutMode]);

  const effectiveBpm = useMemo(() => {
    if (settings.inputSource === InputSource.TIMER) {
        if (currentMode === AppMode.MOTIVATION) return 90;
        if (currentMode === AppMode.ZONE) return 140;
        if (currentMode === AppMode.OVERDRIVE) return 170;
        if (currentMode === AppMode.COOLDOWN) return 70;
        return 60;
    }
    return bpm;
  }, [bpm, settings.inputSource, currentMode]);

  // Track Mode Changes for Data Spotlight
  const prevModeRef = useRef<AppMode>(currentMode);
  useEffect(() => {
    if (currentMode !== prevModeRef.current) {
      // Only show BPM overlay in RUN mode to avoid clutter in GYM
      if (workoutMode === WorkoutMode.RUN) {
          setShowBpmOverlay(true);
          const timer = setTimeout(() => setShowBpmOverlay(false), 7000); 
          prevModeRef.current = currentMode;
          return () => clearTimeout(timer);
      }
      prevModeRef.current = currentMode;
    }
  }, [currentMode, workoutMode]);

  const { isPlaying, togglePlay, loadTrack, volume, setVolume } = useAudioEngine(currentMode, onTrackEnd, settings.overdriveSpeedup);
  
  useEffect(() => {
    if (currentTrack && !isPlaying) {
        loadTrack(currentTrack.source, false);
    }
  }, []); 

  const runStats = useRunEngine(effectiveBpm, isPlaying, settings.units, isPlaying && activeSessionMode === WorkoutMode.RUN && !isCooldown, settings.useGPS);
  const gymStats = useGymEngine(isPlaying, currentMode, isPlaying && activeSessionMode === WorkoutMode.GYM && !isCooldown);
  
  const { unlockedItems, newUnlock, lifetimeDistanceMiles, toggleUnlock } = useProgression(runStats.rawDistanceKm);

  // --- MILE MARKER / PR CELEBRATION LOGIC ---
  const triggerCelebration = (msg: string) => {
      // 1. Save current data mode
      prevVizDataModeRef.current = vizDataMode;
      // 2. Force Distance Mode (or any neutral text mode)
      setVizDataMode('DIST');
      // 3. Trigger effects
      setIsCelebration(true);
      triggerToast(msg);
      
      // 4. Reset after 5s
      setTimeout(() => {
          setIsCelebration(false);
          setVizDataMode(prevVizDataModeRef.current);
      }, 5000);
  };

  useEffect(() => {
      let dist = parseFloat(runStats.distance);
      if (isNaN(dist)) dist = 0;

      const currentInt = Math.floor(dist);
      
      if (currentInt > lastMileInteger.current && currentInt > 0) {
          triggerCelebration(`MILESTONE: ${currentInt} ${runStats.distanceUnit}`);
      }
      lastMileInteger.current = currentInt;
  }, [runStats.distance, runStats.distanceUnit]);

  // Handle Gym PR Logic & Logging
  const handleGymSetSave = (title: string, weight: number, reps: number) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
        setIsCooldown(false);
        return;
    }

    // 1. Update suggestions list
    if (!exerciseHistory.includes(cleanTitle)) {
        setExerciseHistory(prev => [...prev, cleanTitle]);
    }

    // 2. Check PR
    const currentMax = personalRecords[cleanTitle] || 0;
    if (weight > currentMax) {
        setPersonalRecords(prev => ({ ...prev, [cleanTitle]: weight }));
        triggerCelebration(`NEW PR: ${cleanTitle}`);
    } else {
        triggerToast("SET LOGGED");
    }

    // 3. Save to History (Mission Logs)
    const setLog: WorkoutSession = {
        id: uuidv4(),
        date: Date.now(),
        mode: WorkoutMode.GYM,
        title: cleanTitle,
        weight: weight.toString(),
        reps: reps.toString(),
        duration: 'SET', // Marker for a single set
        calories: 0 
    };
    setWorkoutHistory(prev => [setLog, ...prev]);

    // 4. Resume Session
    setIsCooldown(false);
  };

  // Manual Trigger for Judge Testing
  const handleManualMilestone = () => {
      triggerCelebration(`MANUAL MILESTONE TEST`);
  };

  const modeConfig = MODE_CONFIG[currentMode];

  useEffect(() => {
      if (isPlaying && settings.inputSource === InputSource.TIMER && !isCooldown) {
          const interval = setInterval(() => {
              setTimerElapsed(prev => prev + 1);
          }, 1000);
          return () => clearInterval(interval);
      }
  }, [isPlaying, settings.inputSource, isCooldown]);

  useEffect(() => {
    if (isPlaying) {
      setIsIdle(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying && !introComplete) {
      const timer = setTimeout(() => {
        setIntroComplete(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, introComplete]);

  const introLabel = workoutMode === WorkoutMode.RUN ? "READY TO RUN" : "SYSTEM READY";
  const visualizerLabel = introComplete ? modeConfig.label : introLabel;
  const isStandby = !isPlaying && !introComplete;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Logic to determine visualizer data
  let centerDisplayValue: string | number | null = effectiveBpm;
  let centerDisplayLabel = "BPM";

  if (showBpmOverlay && settings.inputSource === InputSource.HEART_RATE) {
      centerDisplayValue = effectiveBpm;
      centerDisplayLabel = "BPM";
  } else {
    if (settings.inputSource === InputSource.TIMER) {
        centerDisplayValue = formatTime(timerElapsed);
        centerDisplayLabel = "TIME";
    } else if (workoutMode === WorkoutMode.RUN) {
        if (vizDataMode === 'DIST') {
            centerDisplayValue = runStats.distance;
            centerDisplayLabel = runStats.distanceUnit;
        } else if (vizDataMode === 'PACE') {
            centerDisplayValue = runStats.pace;
            centerDisplayLabel = runStats.paceUnit;
        } else if (vizDataMode === 'CAL') {
            centerDisplayValue = runStats.calories;
            centerDisplayLabel = "KCAL";
        }
    } else if (workoutMode === WorkoutMode.GYM) {
        // In Gym Mode, we want GymMetrics to handle the Hero Timer
        centerDisplayValue = ""; 
    }
  }

  const handleVizClick = () => {
    if (settings.inputSource === InputSource.TIMER) return;
    if (workoutMode !== WorkoutMode.RUN) return;
    // Disable clicking during celebration to avoid mode desync
    if (isCelebration) return; 
    
    setVizDataMode(prev => {
        if (prev === 'BPM') {
            return 'DIST';
        }
        if (prev === 'DIST') {
            return 'PACE';
        }
        if (prev === 'PACE') {
            return 'CAL';
        }
        return 'BPM';
    });
  };

  const handleFileSelect = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setCurrentTrack({ 
      id: uuidv4(),
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

  const handleJudgeToggleUnlock = (item: string) => {
    const isUnlocked = unlockedItems.includes(item);
    toggleUnlock(item);
    
    if (isUnlocked) {
      setEquippedItems(prev => prev.filter(i => i !== item));
    } else {
      setEquippedItems(prev => {
          if (!prev.includes(item)) return [...prev, item];
          return prev;
      });
      triggerToast(`${item.replace('_', ' ')} UNLOCKED & EQUIPPED`);
    }
  };

  const handleToggleShuffle = () => {
    setShuffle(prev => {
        const nextState = !prev;
        if (nextState) {
            const newShuffled = [...libraryTracks];
            for (let i = newShuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newShuffled[i], newShuffled[j]] = [newShuffled[j], newShuffled[i]];
            }
            setShuffledTracks(newShuffled);
            triggerToast("Shuffle Enabled");
        } else {
            setShuffledTracks([]); 
            triggerToast("Shuffle Disabled");
        }
        return nextState;
    });
  };

  const handleSkip = (direction: 'next' | 'prev', forcePlay = false) => {
    const list = shuffle && shuffledTracks.length > 0 ? shuffledTracks : libraryTracks;
    
    if (!currentTrack || list.length === 0) return;
    
    if (repeatMode === 'one' && forcePlay) {
         loadTrack(currentTrack.source, true);
         return;
    }

    const currentIndex = list.findIndex(t => 
        (t.id && currentTrack.id && t.id === currentTrack.id) || t.name === currentTrack.name
    );
    
    let nextTrack: SongMetadata;

    if (currentIndex !== -1) {
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        
        if (newIndex >= list.length) newIndex = 0;
        if (newIndex < 0) newIndex = list.length - 1;
        
        nextTrack = list[newIndex];
    } else {
        nextTrack = list[0];
    }
    
    handleTrackSelect(nextTrack, forcePlay);
  };

  const handleToggleRepeat = () => {
      setRepeatMode(prev => {
          if (prev === 'off') return 'all';
          if (prev === 'all') return 'one';
          return 'off';
      });
  };

  useEffect(() => {
    skipRef.current = handleSkip;
  }, [handleSkip, libraryTracks, shuffledTracks, currentTrack, shuffle, repeatMode]);

  const handleTabSwitch = (newMode: WorkoutMode) => {
    if (newMode === workoutMode) return;
    if (isPlaying) {
        togglePlay(); 
        triggerToast("Session Paused");
    }
    setWorkoutMode(newMode);
  };

  const handleGlobalPlayPause = () => {
      if (isPlaying) {
          togglePlay();
          return;
      }
      if (activeSessionMode && activeSessionMode !== workoutMode) {
          handleFinishWorkout(activeSessionMode); 
          triggerToast(`${activeSessionMode} Session Logged`);
      }
      setActiveSessionMode(workoutMode);
      togglePlay();
  };

  const handleFinishWorkout = (modeToFinish?: WorkoutMode) => {
    const targetMode = modeToFinish || workoutMode;
    const isRun = targetMode === WorkoutMode.RUN;

    const sessionData: WorkoutSession = {
        id: Date.now().toString(),
        date: Date.now(),
        mode: targetMode,
        title: `${targetMode === WorkoutMode.RUN ? 'Run' : 'Gym'} Session`,
        calories: isRun ? runStats.calories : 0, 
        duration: isRun ? '00:00' : gymStats.formattedTime
    };

    if (isRun) {
        sessionData.distance = `${runStats.distance} ${runStats.distanceUnit}`;
        sessionData.avgPace = runStats.pace;
        sessionData.duration = "N/A"; 
    } 

    setWorkoutHistory(prev => [sessionData, ...prev]);
    setLastSession(sessionData);

    if (isRun) {
        runStats.reset();
    } else {
        gymStats.reset();
    }

    if (targetMode === activeSessionMode) {
        setTimerElapsed(0);
        setActiveSessionMode(null); 
        setIsCooldown(false);
        if (isPlaying) togglePlay(); 
        setShowSummaryModal(true);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
      setWorkoutHistory(prev => prev.filter(s => s.id !== sessionId));
      if (lastSession?.id === sessionId) {
          setLastSession(null);
      }
      triggerToast("Entry Deleted");
  };

  const handleUpdateSession = (updatedSession: WorkoutSession) => {
      setWorkoutHistory(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };
  
  const handleToggleCooldown = () => {
      setIsCooldown(prev => !prev);
  };

  const handleStopWorkout = () => {
      handleFinishWorkout();
  };

  const startHold = (e: React.SyntheticEvent) => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      setHoldProgress(0);
      isStopTriggeredRef.current = false;

      const startTime = Date.now();
      const duration = 1500; 

      holdTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / duration) * 100, 100);
          setHoldProgress(progress);

          if (progress >= 100) {
              if (holdTimerRef.current) clearInterval(holdTimerRef.current);
              isStopTriggeredRef.current = true;
              handleStopWorkout();
              triggerToast("Session Ended via Hold");
              setHoldProgress(0);
          }
      }, 16);
  };

  const endHold = () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      if (!isStopTriggeredRef.current) {
          setIsCooldown(true);
      }
      setHoldProgress(0);
      isStopTriggeredRef.current = false;
  };

  const cancelHold = () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      setHoldProgress(0);
      isStopTriggeredRef.current = false;
  };

  const handleAddTracks = (newTracks: SongMetadata[]) => {
    setLibraryTracks(prev => [...prev, ...newTracks]);
  };

  const handleDeleteTrack = (trackId: string) => {
      setLibraryTracks(prev => prev.filter(t => t.id !== trackId));
      setLibraryPlaylists(prev => prev.map(playlist => ({
          ...playlist,
          tracks: playlist.tracks.filter(t => t.id !== trackId)
      })));

      if (currentTrack?.id === trackId && isPlaying) {
          togglePlay();
      }
      triggerToast("Track Deleted");
  };

  const handleRemoveFromPlaylist = (playlistId: string, trackId: string) => {
    setLibraryPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { 
            ...p, 
            tracks: p.tracks.filter(t => t.id !== trackId) 
        };
      }
      return p;
    }));
    triggerToast("Track Removed from Playlist");
  };

  const handleCreatePlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: uuidv4(),
      name,
      tracks: []
    };
    setLibraryPlaylists(prev => [...prev, newPlaylist]);
  };

  const handleAddToPlaylist = (playlistId: string, track: SongMetadata) => {
    setLibraryPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: [...p.tracks, track] };
      }
      return p;
    }));
    triggerToast("Added to Playlist");
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] flex items-center justify-center p-0 md:p-8 font-mono overflow-hidden relative">
      
      {/* LANDSCAPE WARNING OVERLAY */}
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-center p-8 landscape-warning hidden">
          <div className="mb-4 text-cyan-500 animate-spin-slow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
          </div>
          <h2 className="text-xl font-bold text-white brand-font tracking-widest mb-2">SYSTEM LOCKED</h2>
          <p className="text-sm text-gray-500 font-mono">PLEASE ROTATE DEVICE TO PORTRAIT MODE</p>
      </div>
      <style>{`
        @media screen and (orientation: landscape) and (max-height: 600px) {
            .landscape-warning {
                display: flex !important;
            }
        }
      `}</style>

      {!hasStarted && <SplashScreen onStart={() => setHasStarted(true)} />}

      <GestureController 
          isEnabled={settings.gestureControlEnabled}
          onPlayPause={handleGlobalPlayPause}
          onNextTrack={() => handleSkip('next', true)}
          onPrevTrack={() => handleSkip('prev', true)}
          onCooldown={handleToggleCooldown}
          onStopWorkout={handleStopWorkout}
          isCooldown={isCooldown}
      />

      <DebugPanel 
        isOpen={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)}
        bpm={settings.inputSource === InputSource.HEART_RATE ? bpm : effectiveBpm}
        setBpm={setBpm}
        modeConfig={modeConfig}
        onFileSelect={handleFileSelect}
        onAvatarSelect={handleAvatarSelect}
        unlockedItems={unlockedItems}
        toggleUnlock={handleJudgeToggleUnlock}
        triggerManualMilestone={handleManualMilestone}
      />

      {/* JUDGE CONTROLS BUTTON - Now respects the toggle setting */}
      {settings.inputSource === InputSource.HEART_RATE && hasStarted && settings.showJudgeControls && (
        <button 
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="fixed top-20 right-4 z-[60] bg-black border border-cyan-400 text-cyan-400 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 hover:text-black transition-all shadow-[0_0_10px_rgba(34,211,238,0.4)] opacity-50 hover:opacity-100 flex items-center gap-1"
        >
            <span className="text-sm">⚖️</span> JUDGE CONTROLS
        </button>
      )}

      {/* MOBILE DEVICE CONTAINER */}
      <div 
        className="relative w-full max-w-[420px] h-[100dvh] md:h-[850px] bg-black md:rounded-[3rem] md:border-8 md:border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col"
        onMouseMove={resetIdleTimer}
        onClick={resetIdleTimer}
        onTouchStart={resetIdleTimer}
        onKeyDown={resetIdleTimer}
      >
        {/* === VISUALIZER LAYER (Z-0) - Absolute Inset for Rock Solid Positioning === */}
        <div className="absolute inset-0 z-0 overflow-hidden">
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-20 bg-gradient-to-b ${modeConfig.bgGradient}`}></div>
            
            <HeartVisualizer 
                bpm={effectiveBpm} 
                displayValue={centerDisplayValue}
                displayLabel={centerDisplayLabel}
                mode={currentMode} 
                label={visualizerLabel}
                showBpm={showBpmOverlay && settings.inputSource === InputSource.HEART_RATE}
                isPlaying={isPlaying}
                onClick={handleVizClick} 
                equippedItems={equippedItems}
                isStandby={isStandby}
                avatarUrl={avatarUrl}
                targetMin={settings.targetMin}
                targetMax={settings.targetMax}
                isCelebration={isCelebration}
                // Cooldown Props passed from App
                holdProgress={holdProgress}
                onHoldStart={startHold}
                onHoldEnd={endHold}
                onHoldCancel={cancelHold}
                isCooldown={isCooldown}
                cooldownStage={cooldownStage}
                onResume={() => setIsCooldown(false)}
                onStop={handleStopWorkout}
                // NEW: Pass explicit workout mode to avoid glitches
                workoutMode={workoutMode}
            />
            
            {workoutMode === WorkoutMode.RUN && (
                <RunMetrics newUnlock={newUnlock} />
            )}

            {workoutMode === WorkoutMode.GYM && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                    <GymMetrics 
                        formattedTime={gymStats.formattedTime}
                        isCooldown={isCooldown}
                        isPlaying={isPlaying}
                        onSaveSet={handleGymSetSave}
                        onStopSession={handleStopWorkout}
                        suggestions={exerciseHistory}
                        personalRecords={personalRecords}
                        onToggleCooldown={handleToggleCooldown}
                    />
                </div>
            )}
        </div>

        {/* TIMER MODE BADGE */}
        {settings.inputSource === InputSource.TIMER && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-fuchsia-900/50 border border-fuchsia-500/30 px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-fuchsia-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className="text-[10px] font-bold text-fuchsia-200 tracking-wider">TIMER MODE</span>
                </div>
            </div>
        )}

        {/* --- HEADER (Z-40) --- */}
        <div className={`relative z-40 flex items-center justify-between px-6 pt-4 pb-2 min-h-[60px] shrink-0 transition-all duration-[3000ms] bg-transparent ${isIdle ? 'opacity-30' : 'opacity-100'}`}>
             <button 
                onClick={() => setShowProfileModal(true)}
                className="w-10 h-10 flex items-center justify-center bg-transparent text-gray-400 hover:text-white transition-colors"
                aria-label="Profile"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </button>

            <div className="flex bg-transparent rounded-full p-1 backdrop-blur-sm bg-black/20">
                <button 
                    onClick={() => handleTabSwitch(WorkoutMode.RUN)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${workoutMode === WorkoutMode.RUN ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}
                >
                    RUN
                </button>
                <button 
                    onClick={() => handleTabSwitch(WorkoutMode.GYM)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${workoutMode === WorkoutMode.GYM ? 'bg-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/20' : 'text-gray-500 hover:text-white'}`}
                >
                    GYM
                </button>
            </div>

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

        {/* SPACER FOR ABSOLUTE VISUALIZER */}
        <div className="flex-1 min-h-0"></div>

        {/* --- FOOTER SECTION (Z-50) - PLAYER ONLY --- */}
        <div className="relative z-50 flex-none w-full flex flex-col justify-end">
            <div className="w-full relative z-50">
                <MediaPlayer 
                    isPlaying={isPlaying}
                    onPlayPause={handleGlobalPlayPause}
                    onPrev={() => handleSkip('prev')}
                    onNext={() => handleSkip('next')}
                    currentTrack={currentTrack}
                    onTrackSelect={handleTrackSelect}
                    onOpenLibrary={() => setShowLibraryModal(true)}
                    shuffle={shuffle}
                    onToggleShuffle={handleToggleShuffle}
                    repeatMode={repeatMode}
                    onToggleRepeat={handleToggleRepeat}
                />
            </div>
        </div>
        
        {/* Floating Text: Cooldown Status (Run Mode Only) */}
        {workoutMode === WorkoutMode.RUN && (
            <div 
                className={`
                    absolute bottom-[20%] left-0 w-full flex justify-center z-[60] pointer-events-none
                    transition-all duration-700 ease-out
                    ${cooldownStage === 'TEXT' 
                        ? 'opacity-100 translate-y-0' 
                        : cooldownStage === 'BUTTONS' 
                            ? 'opacity-0 translate-y-[-20px]' 
                            : 'opacity-0 translate-y-full' 
                    }
                `}
            >
                 <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 animate-spin-reverse" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.0001 2.00024V4.00024M12.0001 20.0002V22.0002M4.92908 4.92917L6.34329 6.34338M17.6569 17.657L19.0712 19.0712M2.00012 12.0002H4.00012M20.0001 12.0002H22.0001M4.92908 19.0713L6.34329 17.6571M17.6569 6.34351L19.0712 4.9293" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-cyan-400 font-bold brand-font tracking-widest text-sm animate-pulse">COOLING DOWN...</span>
                 </div>
                 <style>{`
                    @keyframes spin-reverse {
                        from { transform: rotate(360deg); }
                        to { transform: rotate(0deg); }
                    }
                    .animate-spin-reverse {
                        animation: spin-reverse 3s linear infinite;
                    }
                 `}</style>
            </div>
        )}

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
            history={workoutHistory}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
        />

        <WorkoutSummary 
            isOpen={showSummaryModal}
            onClose={() => setShowSummaryModal(false)}
            session={lastSession}
        />
        
        <MusicLibrary 
          isOpen={showLibraryModal}
          onClose={() => setShowLibraryModal(false)}
          onTrackSelect={handleTrackSelect}
          tracks={libraryTracks}
          playlists={libraryPlaylists}
          onAddTracks={handleAddTracks}
          onCreatePlaylist={handleCreatePlaylist}
          onAddToPlaylist={handleAddToPlaylist}
          onDeleteTrack={handleDeleteTrack}
          onRemoveFromPlaylist={handleRemoveFromPlaylist}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
        />

        {showToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-xs z-[100] animate-bounce whitespace-nowrap">
            {toastMessage}
          </div>
        )}

      </div>
    </div>
  );
};

export default App;

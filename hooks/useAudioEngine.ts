
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MODE_CONFIG } from '../constants';
import { AppMode, AudioStabilityMode } from '../types';

export const useAudioEngine = (
    mode: AppMode, 
    onEnded?: () => void, 
    overdriveSpeedup: boolean = true,
    stabilityMode: AudioStabilityMode = AudioStabilityMode.AUTO
) => {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [realtimeRate, setRealtimeRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0); // 0.0 to 1.0

  // Battery State
  const [isLowPower, setIsLowPower] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Track Loading State Refs
  const activeBlobUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Mobile Detection (Kept for reference or future heuristics)
  const IS_MOBILE = useRef<boolean>(
    typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  ).current;

  // Ref for onEnded callback to avoid stale closures/cycles
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Battery Listener (For Auto Mode)
  useEffect(() => {
    if (typeof (navigator as any).getBattery === 'function') {
        (navigator as any).getBattery().then((battery: any) => {
             const updateBattery = () => {
                 // Consider < 20% as low power
                 setIsLowPower(battery.level < 0.20 && !battery.charging);
             };
             updateBattery();
             battery.addEventListener('levelchange', updateBattery);
             battery.addEventListener('chargingchange', updateBattery);
        }).catch((e: any) => console.warn("Battery API error", e));
    }
  }, []);

  // Determine if we should enforce Stable Mode (1.0x speed)
  const isStableModeActive = useMemo(() => {
    if (stabilityMode === AudioStabilityMode.STABLE) return true;
    if (stabilityMode === AudioStabilityMode.DYNAMIC) return false;
    
    // AUTO Mode Logic:
    // If we detected low power via Battery API, enforce stable.
    if (isLowPower) return true;
    
    // Fallback: Default to DYNAMIC (False) as requested for iOS/Others
    // allowing user to manually toggle if needed.
    return false;
  }, [stabilityMode, isLowPower]);

  // Determine effective playback rate based on settings
  const getTargetPlaybackRate = useCallback((modeConfig: any) => {
    // 1. Force Stable Mode (Battery Saver / Stability Setting)
    if (isStableModeActive) {
        return 1.0;
    }

    // 2. Overdrive Config Check
    if (mode === AppMode.OVERDRIVE && !overdriveSpeedup) {
        return 1.0; 
    }

    // 3. Normal Dynamic Speed
    return modeConfig.playbackRate;
  }, [mode, overdriveSpeedup, isStableModeActive]);

  // Initialize Audio Context
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    
    // CRITICAL: Disable pitch preservation to allow performant "vinyl-like" speed changes
    audio.preservesPitch = false; 
    (audio as any).mozPreservesPitch = false;
    (audio as any).webkitPreservesPitch = false;

    audioElementRef.current = audio;

    // Create Nodes
    const source = ctx.createMediaElementSource(audio);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Configure Nodes based on INITIAL mode
    const config = MODE_CONFIG[mode];
    const initialRate = getTargetPlaybackRate(config);

    filter.type = 'lowpass';
    filter.frequency.value = config.filterFreq;
    
    // Connect Graph
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Store refs
    sourceNodeRef.current = source;
    filterNodeRef.current = filter;
    gainNodeRef.current = gain;

    // Event Listeners
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
        setIsPlaying(false);
        if (onEndedRef.current) {
            onEndedRef.current();
        }
    });
    
    // Initialize rate based on mode immediately
    audio.playbackRate = initialRate;
    setRealtimeRate(initialRate);

    setIsReady(true);
  }, [mode, getTargetPlaybackRate]);

  // Handle Volume Changes
  useEffect(() => {
      if (gainNodeRef.current) {
          // Smooth volume transition
          gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current?.currentTime || 0, 0.1);
      }
  }, [volume]);

  // Load Track with Blob Buffering
  const loadTrack = useCallback(async (url: string, forcePlay = false) => {
    if (!audioElementRef.current) initAudio();
    
    // Abort previous fetch if active
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);

    try {
        let srcToPlay = url;
        
        // If it's a remote URL, download it to Blob to ensure smooth streaming/seeking behavior
        if (url.startsWith('http') || url.startsWith('https')) {
            const response = await fetch(url, { signal });
            if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
            const blob = await response.blob();
            
            if (signal.aborted) return;

            const blobUrl = URL.createObjectURL(blob);
            
            // Clean up old blob to free memory
            if (activeBlobUrlRef.current) {
                URL.revokeObjectURL(activeBlobUrlRef.current);
            }
            activeBlobUrlRef.current = blobUrl;
            srcToPlay = blobUrl;
        }

        if (audioElementRef.current) {
            // Apply src
            audioElementRef.current.src = srcToPlay;
            
            // Re-apply correct rate immediately
            const config = MODE_CONFIG[mode];
            const rate = getTargetPlaybackRate(config);
            audioElementRef.current.playbackRate = rate;
            setRealtimeRate(rate);

            if (forcePlay) {
                // Resume context if needed
                if (audioContextRef.current?.state === 'suspended') {
                    await audioContextRef.current.resume();
                }
                
                try {
                    await audioElementRef.current.play();
                    setIsPlaying(true);
                } catch (e) {
                    if ((e as Error).name !== 'AbortError') console.error("Play failed", e);
                }
            } else {
                setIsPlaying(false);
            }
        }
    } catch (e: any) {
        if (e.name !== 'AbortError') {
            console.error("Track load error:", e);
        }
    } finally {
        if (!signal.aborted) {
            setIsLoading(false);
        }
    }
  }, [initAudio, mode, getTargetPlaybackRate]);

  // Cleanup Blob on unmount
  useEffect(() => {
      return () => {
          if (activeBlobUrlRef.current) {
              URL.revokeObjectURL(activeBlobUrlRef.current);
          }
          if (abortControllerRef.current) {
              abortControllerRef.current.abort();
          }
      };
  }, []);

  // Play/Pause
  const togglePlay = useCallback(async () => {
    if (!audioContextRef.current) initAudio();
    
    // Resume context if suspended
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (audioElementRef.current) {
      if (audioElementRef.current.paused) {
        await audioElementRef.current.play().catch(e => {
             if (e.name !== 'AbortError') console.error("Play failed", e);
        });
        setIsPlaying(true);
      } else {
        audioElementRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [initAudio]);

  // Apply Mode Effects (Filter & Speed)
  useEffect(() => {
    if (!audioElementRef.current || !filterNodeRef.current || !audioContextRef.current) return;

    const config = MODE_CONFIG[mode];
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const RAMP_DURATION = 3; // 3 seconds transition for filter

    // 1. FILTER: Smooth Exponential Ramp
    // This runs on BOTH Mobile and Desktop to ensure the "Muffled" effect in Phase 1 works
    const filter = filterNodeRef.current;
    filter.frequency.cancelScheduledValues(now);
    filter.frequency.setValueAtTime(filter.frequency.value, now);
    filter.frequency.setTargetAtTime(config.filterFreq, now, RAMP_DURATION / 4);

    // 2. PLAYBACK RATE: Instant Change
    const targetRate = getTargetPlaybackRate(config);
    
    // Safety check for pitch preservation flags
    if (audioElementRef.current.preservesPitch !== false) {
       audioElementRef.current.preservesPitch = false;
       (audioElementRef.current as any).webkitPreservesPitch = false;
    }

    audioElementRef.current.playbackRate = targetRate;
    setRealtimeRate(targetRate);

  }, [mode, getTargetPlaybackRate]);

  return {
    isReady,
    isPlaying,
    isLoading, 
    currentTime,
    duration,
    currentRate: realtimeRate, 
    volume,
    setVolume,
    togglePlay,
    loadTrack,
    isStableModeActive
  };
};

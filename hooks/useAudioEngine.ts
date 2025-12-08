
import { useState, useEffect, useRef, useCallback } from 'react';
import { MODE_CONFIG } from '../constants';
import { AppMode } from '../types';

export const useAudioEngine = (mode: AppMode, onEnded?: () => void) => {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [realtimeRate, setRealtimeRate] = useState(1.0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Ref for animation frame to handle playback rate interpolation
  const rafRef = useRef<number | null>(null);

  // Ref for onEnded callback to avoid stale closures/cycles
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Initialize Audio Context
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preservesPitch = false; // Key for the "slowing down" pitch effect
    audioElementRef.current = audio;

    // Create Nodes
    const source = ctx.createMediaElementSource(audio);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Configure Nodes based on INITIAL mode
    // This ensures no "ramp down" on first play if we start in Motivation mode
    const config = MODE_CONFIG[mode];

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
    audio.playbackRate = config.playbackRate;
    setRealtimeRate(config.playbackRate);

    setIsReady(true);
  }, [mode]);

  // Load Track
  const loadTrack = useCallback((url: string, forcePlay = false) => {
    if (!audioElementRef.current) initAudio();
    if (audioElementRef.current) {
      const wasPlaying = !audioElementRef.current.paused;
      const shouldPlay = forcePlay || wasPlaying;

      audioElementRef.current.src = url;
      audioElementRef.current.load();
      
      // Ensure the correct rate is applied after load, 
      // preventing browser from resetting to 1.0 default
      const config = MODE_CONFIG[mode];
      audioElementRef.current.playbackRate = config.playbackRate;
      setRealtimeRate(config.playbackRate);

      if (shouldPlay) {
        audioElementRef.current.play().catch(e => console.error("Play failed", e));
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  }, [initAudio, mode]);

  // Play/Pause
  const togglePlay = useCallback(async () => {
    if (!audioContextRef.current) initAudio();
    
    // Resume context if suspended (browser policy)
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (audioElementRef.current) {
      if (audioElementRef.current.paused) {
        await audioElementRef.current.play();
        setIsPlaying(true);
      } else {
        audioElementRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [initAudio]);

  // Apply Mode Effects (Filter & Speed) with Smooth Ramping
  useEffect(() => {
    if (!audioElementRef.current || !filterNodeRef.current || !audioContextRef.current) return;

    const config = MODE_CONFIG[mode];
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const RAMP_DURATION = 3; // 3 seconds transition

    // 1. Smoothly transition filter frequency (Linear Ramp)
    const filter = filterNodeRef.current;
    
    // Cancel any scheduled future changes to avoid conflicts
    filter.frequency.cancelScheduledValues(now);
    // Anchor the start point to the current value to prevent jumping
    filter.frequency.setValueAtTime(filter.frequency.value, now);
    // Ramp to target
    filter.frequency.linearRampToValueAtTime(config.filterFreq, now + RAMP_DURATION);

    // 2. Adjust Playback Rate with custom interpolation loop
    const audio = audioElementRef.current;
    const startRate = audio.playbackRate;
    const targetRate = config.playbackRate;
    
    // If we are already at target (within tolerance), just update state and return
    if (Math.abs(startRate - targetRate) < 0.001) {
        setRealtimeRate(targetRate);
        return;
    }

    const startTime = performance.now();
    
    // Cancel previous animation loop if exists
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const animateRate = (currentTimeMs: number) => {
      const elapsed = (currentTimeMs - startTime) / 1000; // seconds
      const progress = Math.min(elapsed / RAMP_DURATION, 1);
      
      // Linear interpolation
      const currentNewRate = startRate + (targetRate - startRate) * progress;
      
      if (audioElementRef.current) {
        audioElementRef.current.playbackRate = currentNewRate;
      }
      setRealtimeRate(currentNewRate);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animateRate);
      }
    };

    rafRef.current = requestAnimationFrame(animateRate);

    // Cleanup RAF on unmount or effect re-run
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };

  }, [mode]);

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    currentRate: realtimeRate, // Expose the animated value
    togglePlay,
    loadTrack
  };
};

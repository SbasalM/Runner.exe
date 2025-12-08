import React, { useState, useEffect } from 'react';
import { SongMetadata } from '../types';
import { DEMO_TRACKS } from '../constants';

interface MediaPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  currentTrack: SongMetadata | null;
  onTrackSelect: (track: SongMetadata) => void;
  enabledServices: string[];
}

// Reusable Source Icon Component
const SourceIcon = ({ id, className }: { id: string, className?: string }) => {
  if (id === 'spotify') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>;
  if (id === 'apple') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>;
  if (id === 'youtube') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/><polygon points="10,15 15,12 10,9"/></svg>;
  if (id === 'amazon') return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M13.596 11.583c-1.554-1.306-3.793-1.46-5.877-.69l-.658-2.261c1.921-.77 4.706-.576 6.549.972l.006.005c.877.727 1.488 1.956 1.455 3.568h2.365c.094-2.735-1.127-4.885-2.716-6.202l-1.124-3.874-2.311.67 1.056 3.654c-2.246-1.688-5.698-1.849-8.086-.889l.86 2.949c1.65-.589 3.424-.492 4.654.542.493.414.735 1.037.756 1.834H8.448c-3.134.094-4.832 2.228-4.708 4.755.088 1.782 1.355 3.237 3.326 3.313 1.98.077 3.398-1.042 4.103-2.128l-.058 1.996h2.248l.142-6.529c-.066-1.044-.572-1.741-1.46-2.479l1.555.794zm-2.793 4.887c-.504.808-1.42 1.439-2.52 1.396-1.114-.043-1.666-.826-1.716-1.848-.069-1.408 1.01-2.41 2.508-2.455h1.993l-.265 2.907z"/></svg>;
  return null;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  currentTrack,
  onTrackSelect,
  enabledServices
}) => {
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);

  // Sync internal active source state with the current track prop
  useEffect(() => {
    if (currentTrack) {
      const demoTrack = Object.values(DEMO_TRACKS).find(t => t.name === currentTrack.name);
      if (demoTrack) {
        setActiveSourceId(demoTrack.id);
      } else {
        setActiveSourceId(null);
      }
    } else {
      setActiveSourceId(null);
    }
  }, [currentTrack]);

  // Filter tracks based on settings
  const visibleTracks = Object.values(DEMO_TRACKS).filter(track => enabledServices.includes(track.id));

  // Auto-select if only one service is available
  useEffect(() => {
    if (visibleTracks.length === 1) {
      const soleTrack = visibleTracks[0];
      // Only set if not already selected/loaded to avoid infinite loops
      if (currentTrack?.name !== soleTrack.name) {
          setActiveSourceId(soleTrack.id);
          onTrackSelect({
            name: soleTrack.name,
            artist: soleTrack.artist,
            album: soleTrack.album,
            source: soleTrack.source
          });
      }
    }
  }, [visibleTracks, currentTrack, onTrackSelect]);

  const handleSourceClick = (trackConfig: any) => {
    // If it's the only one enabled, don't allow toggling off
    if (visibleTracks.length === 1 && activeSourceId === trackConfig.id) {
        return;
    }

    if (activeSourceId === trackConfig.id) {
        // Toggle off/collapse if clicking active
        setActiveSourceId(null);
    } else {
        // Select new
        setActiveSourceId(trackConfig.id);
        onTrackSelect({
          name: trackConfig.name,
          artist: trackConfig.artist,
          album: trackConfig.album,
          source: trackConfig.source
        });
    }
  };

  return (
    <div className="w-full bg-[#111] border-t border-gray-800 p-0 flex flex-col transition-all duration-300">
      
      {/* Smart Stack Source Selector - Auto Collapse Logic */}
      {/* Added Padding Wrapper to fix glow clipping */}
      <div 
        className="w-full overflow-hidden transition-all ease-in-out"
        style={{
            maxHeight: isPlaying ? '0px' : '100px', // Collapses to 0 when playing, expanded needs room for padding
            opacity: isPlaying ? 0 : 1,
            transitionDuration: '3000ms' // 3s Morph
        }}
      >
        <div className="p-6 pb-2 flex w-full gap-2">
            {visibleTracks.map((track) => {
            const isActive = activeSourceId === track.id;
            const isHidden = activeSourceId && !isActive; // Hide if another is active

            // Visual Logic
            // 1. Shadow: Shift shadow UP (-6px Y) to prevent bottom clipping
            // Only show Glow when Active AND Selecting (Not Playing)
            const showGlow = isActive && !isPlaying;
            const shadowClass = showGlow ? 'shadow-[0_-6px_20px_rgba(255,255,255,0.6)]' : 'shadow-none';

            // 2. Layout: Collapsed items are width-0 and hidden
            const layoutClass = isHidden ? 'w-0 opacity-0 p-0 m-0 border-0' : 'flex-1 opacity-100';

            return (
                <button
                key={track.id}
                onClick={() => handleSourceClick(track)}
                className={`
                    relative h-12 rounded-full flex items-center justify-center overflow-hidden
                    ${layoutClass}
                    ${isActive ? 'bg-white' : 'bg-zinc-300 hover:bg-zinc-200'}
                    ${shadowClass}
                `}
                style={{
                    // CRITICAL FIX: Decouple Fast Layout from Slow Visuals
                    // Layout (Width/Flex/Opacity-Visibility) -> 300ms Fast
                    // Handoff (Shadow) -> 3000ms Slow
                    transitionProperty: 'flex-grow, width, margin, padding, opacity, background-color, box-shadow',
                    transitionDuration: '300ms, 300ms, 300ms, 300ms, 300ms, 300ms, 3000ms',
                    transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
                }}
                title={track.platform}
                >
                {/* Dimmer Overlay for Energy Handoff */}
                {/* Simulates "Opacity 0.5" without affecting the parent layout container */}
                <div 
                    className={`
                    absolute inset-0 bg-black pointer-events-none transition-opacity duration-[3000ms] ease-linear
                    ${isActive && isPlaying ? 'opacity-50' : 'opacity-0'}
                    `}
                />

                {/* Icon Container - Always centered */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100'}`}>
                    <SourceIcon id={track.id} className="w-6 h-6 text-black" />
                </div>

                {/* Expanded Content - Centered */}
                <div className={`relative z-10 flex items-center justify-center gap-2 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-5 h-5 text-black flex items-center justify-center">
                        <SourceIcon id={track.id} className="w-full h-full" />
                    </div>
                    <span className="text-black font-bold uppercase tracking-widest text-xs whitespace-nowrap pt-[2px]">
                    {track.platform}
                    </span>
                </div>
                </button>
            )
            })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 pb-[calc(3.5rem+env(safe-area-inset-bottom))] pt-2">
        {/* Track Info */}
        <div className="flex-1 overflow-hidden">
          {currentTrack ? (
            <div className="flex flex-col justify-center leading-tight">
              {/* Title Row */}
              <div className="flex items-center gap-2 mb-0.5">
                 {/* Tiny Icon Logic when Collapsed/Playing */}
                 <div className={`text-cyan-400 transition-all duration-[3000ms] ${isPlaying ? 'w-4 h-4 opacity-100' : 'w-0 h-0 opacity-0 overflow-hidden'}`}>
                    {activeSourceId && <SourceIcon id={activeSourceId} className="w-full h-full" />}
                 </div>
                 <span className="text-cyan-400 font-bold text-sm truncate brand-font tracking-wide">
                   {currentTrack.name}
                 </span>
              </div>
              {/* 2-Line Mode: Combined Artist & Album */}
              <div className="text-zinc-400 text-xs truncate font-mono font-medium">
                {currentTrack.artist || 'Unknown Artist'}
                <span className="mx-1.5 opacity-50">•</span>
                {currentTrack.album || 'Unknown Album'}
              </div>
            </div>
          ) : (
             <div className="text-gray-600 text-xs font-mono animate-pulse">NO SOURCE DETECTED</div>
          )}
        </div>

        {/* Compact Controls - Vertical Padding Added */}
        <div className="flex items-center gap-3 py-1">
          <button onClick={onPrev} className="text-gray-500 hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          <button
            onClick={onPlayPause}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isPlaying ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-white/10 text-white border border-white/20'
            }`}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button onClick={onNext} className="text-gray-500 hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
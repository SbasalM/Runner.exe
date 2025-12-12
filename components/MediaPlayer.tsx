
import React from 'react';
import { SongMetadata } from '../types';

interface MediaPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  currentTrack: SongMetadata | null;
  onTrackSelect: (track: SongMetadata) => void;
  onOpenLibrary: () => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onToggleRepeat: () => void;
  isLoading?: boolean;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  currentTrack,
  onOpenLibrary,
  shuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  isLoading = false
}) => {
  
  return (
    <div className="relative w-full flex flex-col justify-end">
      
      {/* ACCESS NEURAL LIBRARY BUTTON */}
      <div 
        className={`
            w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden px-4
            ${isPlaying ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100 pb-2'}
        `}
      >
         <button
            onClick={onOpenLibrary}
            className="w-full h-12 md:h-14 bg-black/80 backdrop-blur border border-zinc-800 rounded-lg flex items-center justify-between px-4 group hover:border-fuchsia-500/50 hover:bg-fuchsia-900/10 transition-all shadow-lg"
         >
            <div className="flex items-center gap-3 overflow-hidden">
                 <div className="w-8 h-8 shrink-0 rounded bg-fuchsia-900/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 group-hover:animate-pulse shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                 </div>
                 <div className="flex flex-col items-start text-left truncate">
                    <span className="text-xs font-bold text-fuchsia-500 uppercase tracking-widest group-hover:text-fuchsia-400 font-orbitron truncate w-full">Access Neural Library</span>
                 </div>
            </div>
            
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
         </button>
      </div>

      {/* CONTROLS: DOCKED PANEL */}
      <div className="relative z-30 w-full bg-black/90 backdrop-blur-md border-t border-cyan-500/50 rounded-t-lg shadow-[0_-4px_20px_rgba(6,182,212,0.2)] flex items-center justify-between px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        
        {/* LEFT: INFO */}
        <div className="flex-1 overflow-hidden min-w-0 mr-4">
          {currentTrack ? (
            <div className="flex flex-col justify-center leading-tight">
              <div className="text-cyan-400 font-bold text-sm truncate brand-font tracking-wide">
                   {currentTrack.name}
              </div>
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest truncate">
                {currentTrack.artist || 'Unknown Artist'}
              </div>
            </div>
          ) : (
             <div className="text-gray-600 text-xs font-mono animate-pulse">NO SOURCE DETECTED</div>
          )}
        </div>

        {/* RIGHT: CONTROL CLUSTER */}
        <div className="flex items-center gap-4 shrink-0">
          
          {/* SHUFFLE */}
          <button 
            onClick={onToggleShuffle} 
            className={`transition-colors p-1 ${shuffle ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5" />
                <path d="M4 20L21 3" />
                <path d="M21 16v5h-5" />
                <path d="M15 15l-5 5-6-6" />
                <path d="M4 4l5 5" />
             </svg>
          </button>

          {/* PREV */}
          <button onClick={onPrev} className="text-zinc-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          {/* PLAY/PAUSE/LOADING */}
          <button
            onClick={onPlayPause}
            disabled={isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative overflow-hidden ${
              isPlaying 
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)] hover:scale-105' 
              : 'bg-zinc-800 text-white border border-zinc-700 hover:border-cyan-500/50'
            }`}
          >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          {/* NEXT */}
          <button onClick={onNext} className="text-zinc-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>

          {/* REPEAT */}
          <button 
            onClick={onToggleRepeat} 
            className={`transition-colors p-1 relative ${repeatMode !== 'off' ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 1l4 4-4 4" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="M7 23l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
             </svg>
             {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-black text-cyan-400 px-0.5 rounded border border-cyan-900 leading-none">1</span>
             )}
          </button>

        </div>
      </div>
    </div>
  );
};

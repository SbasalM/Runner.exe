
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { SongMetadata, Playlist } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface MusicLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackSelect: (track: SongMetadata, queue?: SongMetadata[]) => void;
  tracks: SongMetadata[];
  playlists: Playlist[];
  onAddTracks: (newTracks: SongMetadata[]) => void;
  onCreatePlaylist: (name: string) => void;
  onAddToPlaylist: (playlistId: string, track: SongMetadata) => void;
  onDeleteTrack: (trackId: string) => void;
  onRemoveFromPlaylist: (playlistId: string, trackId: string) => void;
  currentTrack: SongMetadata | null;
  isPlaying: boolean;
}

type LibraryTab = 'PLAYLISTS' | 'SONGS' | 'ARTISTS' | 'ALBUMS';

export const MusicLibrary: React.FC<MusicLibraryProps> = ({
  isOpen,
  onClose,
  onTrackSelect,
  tracks,
  playlists,
  onAddTracks,
  onCreatePlaylist,
  onAddToPlaylist,
  onDeleteTrack,
  onRemoveFromPlaylist,
  currentTrack,
  isPlaying
}) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('PLAYLISTS');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState<SongMetadata | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  
  // Hold-to-Load State
  const [holdingItemId, setHoldingItemId] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemsToPlayRef = useRef<SongMetadata[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Grouping logic
  const groupedData = useMemo(() => {
    const artists: Record<string, SongMetadata[]> = {};
    const albums: Record<string, SongMetadata[]> = {};

    tracks.forEach(track => {
      const art = track.artist || 'Unknown Artist';
      const alb = track.album || 'Unknown Album';
      if (!artists[art]) artists[art] = [];
      if (!albums[alb]) albums[alb] = [];
      artists[art].push(track);
      albums[alb].push(track);
    });

    return { artists, albums };
  }, [tracks]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessingFiles(true);
      const fileList = Array.from(e.target.files) as File[];
      const uniqueNewTracks: SongMetadata[] = [];
      
      for (const file of fileList) {
          const name = file.name.replace(/\.[^/.]+$/, "");
          
          const extractMetadata = (): Promise<{title?: string, artist?: string, album?: string}> => {
              return new Promise((resolve) => {
                  if ((window as any).jsmediatags) {
                      (window as any).jsmediatags.read(file, {
                          onSuccess: (tag: any) => {
                              resolve({
                                  title: tag.tags.title,
                                  artist: tag.tags.artist,
                                  album: tag.tags.album
                              });
                          },
                          onError: (error: any) => {
                              console.warn("Metadata read error:", error);
                              resolve({});
                          }
                      });
                  } else {
                      resolve({});
                  }
              });
          };

          const metadata = await extractMetadata();
          
          const newTrack: SongMetadata = {
              id: uuidv4(),
              name: metadata.title || name,
              artist: metadata.artist || 'Local Upload',
              album: metadata.album || 'Unknown Album',
              source: URL.createObjectURL(file)
          };

          uniqueNewTracks.push(newTrack);
      }

      if (uniqueNewTracks.length > 0) {
        onAddTracks(uniqueNewTracks);
      }
      setIsProcessingFiles(false);
    }
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName);
      setNewPlaylistName('');
      setIsCreatingPlaylist(false);
    }
  };

  const handleAddToSpecificPlaylist = (playlistId: string) => {
      if (trackToAdd) {
          onAddToPlaylist(playlistId, trackToAdd);
          setTrackToAdd(null);
      }
  };

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const isTrackPlaying = (trackId?: string) => {
      return currentTrack && currentTrack.id === trackId;
  };

  // --- GLOBAL HOLD TO LOAD LOGIC ---
  const handleHoldStart = (id: string, tracksToLoad: SongMetadata[]) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    
    setHoldingItemId(id);
    setIsHolding(true);
    itemsToPlayRef.current = tracksToLoad;

    holdTimerRef.current = setTimeout(() => {
        if (itemsToPlayRef.current && itemsToPlayRef.current.length > 0) {
            onTrackSelect(itemsToPlayRef.current[0], itemsToPlayRef.current);
            setTimeout(() => {
                onClose();
                handleHoldEnd(); 
            }, 200);
        }
    }, 1000);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setIsHolding(false);
    setHoldingItemId(null); 
  };

  // --- SMART MARQUEE COMPONENT ---
  const MarqueeTitle = ({ text, className, small = false }: { text: string, className?: string, small?: boolean }) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && measureRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const textWidth = measureRef.current.offsetWidth;
                setIsOverflowing(textWidth > containerWidth + 1);
            }
        };

        checkOverflow();
        const observer = new ResizeObserver(() => checkOverflow());
        if (containerRef.current) observer.observe(containerRef.current);
        const timer = setTimeout(checkOverflow, 200);

        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, [text]);

    return (
        <div ref={containerRef} className={`w-full relative ${className ?? ''}`}>
            <span ref={measureRef} className="absolute top-0 left-0 opacity-0 pointer-events-none whitespace-nowrap z-[-1]">
                {text}
            </span>

            {isOverflowing ? (
                <div className="overflow-hidden w-full mask-linear-fade">
                    <div className={`inline-block whitespace-nowrap ${small ? 'animate-scroll-text-fast' : 'animate-scroll-text'} will-change-transform`}>
                        <span className="mr-12">{text}</span>
                        <span className="mr-12">{text}</span>
                        <span className="mr-12">{text}</span>
                        <span className="mr-12">{text}</span>
                    </div>
                </div>
            ) : (
                <div className="truncate w-full">
                    {text}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-0 md:p-4 animate-fade-in-up">
      <style>{`
        @keyframes scroll-text {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-text {
          animation: scroll-text 15s linear infinite;
        }
        .animate-scroll-text-fast {
          animation: scroll-text 10s linear infinite;
        }
        .mask-linear-fade {
            mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>

      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-none md:rounded-xl shadow-2xl h-full md:h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-950 shrink-0 z-10">
          <div>
            <h2 className="text-white font-black brand-font tracking-widest text-xl md:text-2xl flex items-center gap-2">
              <span className="w-3 h-3 bg-fuchsia-500 rounded-sm animate-pulse"></span>
              NEURAL_LIBRARY // {activeTab === 'PLAYLISTS' ? 'PLAYLIST_DECK' : activeTab === 'ARTISTS' ? 'ARTIST_DECK' : activeTab === 'ALBUMS' ? 'ALBUM_DECK' : 'SONG_DECK'}
            </h2>
            <div className="text-[10px] text-gray-500 font-mono tracking-wide mt-1">LOCAL STORAGE ACCESS // READ-ONLY MODE</div>
          </div>

          <div className="flex items-center gap-4">
             <input 
                type="file" 
                accept="audio/*" 
                multiple
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
             />

             <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50">
           {['PLAYLISTS', 'SONGS', 'ARTISTS', 'ALBUMS'].map((tab) => (
             <button
               key={tab}
               onClick={() => { setActiveTab(tab as LibraryTab); setSelectedPlaylistId(null); }}
               className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase transition-all relative ${
                 activeTab === tab ? 'text-cyan-400 bg-cyan-900/10' : 'text-zinc-500 hover:text-zinc-300'
               }`}
             >
               {tab}
               {activeTab === tab && (
                 <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
               )}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-black/50">
          
             {/* PLAYLISTS TAB */}
             {activeTab === 'PLAYLISTS' && (
               <div className="w-full h-full relative overflow-hidden">
                   <div 
                      className="flex w-[200%] h-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      style={{ transform: selectedPlaylistId ? 'translateX(-50%)' : 'translateX(0)' }}
                   >
                        {/* Playlist List */}
                        <div className="w-1/2 h-full overflow-y-auto custom-scrollbar p-6">
                            <button 
                                onClick={() => setIsCreatingPlaylist(true)}
                                className="w-full py-4 mb-4 border border-dashed border-zinc-700 rounded-lg text-zinc-500 text-xs font-bold uppercase tracking-widest hover:border-cyan-500 hover:text-cyan-400 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span className="group-hover:scale-125 transition-transform duration-300">+</span> New Playlist
                            </button>
                            
                            {isCreatingPlaylist && (
                                <div className="flex gap-2 mb-6 animate-fade-in-down">
                                    <input 
                                    autoFocus
                                    type="text" 
                                    value={newPlaylistName}
                                    onChange={(e) => setNewPlaylistName(e.target.value)}
                                    className="flex-1 bg-black border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none font-mono"
                                    placeholder="ENTER_PLAYLIST_NAME"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                                    />
                                    <button onClick={handleCreatePlaylist} className="text-cyan-500 hover:text-white px-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {playlists.map(playlist => (
                                    <button
                                        key={playlist.id}
                                        className={`w-full relative overflow-hidden text-left p-4 rounded-xl border transition-all duration-300 bg-zinc-900 group ${holdingItemId === playlist.id ? 'border-cyan-500 scale-[0.98]' : 'border-zinc-800 hover:border-fuchsia-500/50 hover:bg-zinc-800'}`}
                                        onMouseDown={() => handleHoldStart(playlist.id, playlist.tracks)}
                                        onMouseUp={handleHoldEnd}
                                        onMouseLeave={handleHoldEnd}
                                        onTouchStart={() => handleHoldStart(playlist.id, playlist.tracks)}
                                        onTouchEnd={handleHoldEnd}
                                        onContextMenu={(e) => e.preventDefault()}
                                        onClick={() => setSelectedPlaylistId(playlist.id)}
                                    >
                                        <div 
                                            className={`absolute inset-0 bg-cyan-900/30 z-0 origin-left ${holdingItemId === playlist.id && isHolding ? 'transition-transform duration-[1000ms] ease-linear scale-x-100' : 'transition-none scale-x-0'}`}
                                        ></div>
                                        
                                        <div className="relative z-10 pointer-events-none">
                                            <div className="mb-1 text-white brand-font font-bold text-lg">
                                                <MarqueeTitle text={playlist.name} />
                                            </div>
                                            <div className="text-[10px] font-mono text-gray-500">{playlist.tracks.length} TRACKS // ID: {playlist.id.slice(0,4)}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Playlist Details */}
                        <div className="w-1/2 h-full flex flex-col bg-zinc-950/50">
                            {selectedPlaylist && (
                                <>
                                    <div className="p-6 border-b border-zinc-800 flex items-center gap-4 bg-zinc-900/30">
                                        <button 
                                            onClick={() => setSelectedPlaylistId(null)}
                                            className="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-2xl font-black text-white brand-font tracking-wide">
                                                <MarqueeTitle text={selectedPlaylist.name} />
                                            </div>
                                            <div className="text-xs text-fuchsia-500 font-mono">SYSTEM_PLAYLIST // {selectedPlaylist.tracks.length} FRAGMENTS</div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                        {selectedPlaylist.tracks.length === 0 ? (
                                            <div className="h-40 flex flex-col items-center justify-center text-zinc-600 font-mono text-sm border border-zinc-800 border-dashed rounded-xl">
                                                <span>NO DATA FRAGMENTS FOUND</span>
                                                <span className="text-xs mt-2 text-zinc-700">Go to "SONGS" tab to add tracks</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedPlaylist.tracks.map((track, idx) => {
                                                    const active = isTrackPlaying(track.id);
                                                    return (
                                                        <div 
                                                            key={`${track.id}-${idx}`}
                                                            onClick={() => { onTrackSelect(track, selectedPlaylist.tracks); onClose(); }}
                                                            className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                                                                active 
                                                                ? 'bg-fuchsia-900/20 border-fuchsia-500/50' 
                                                                : 'bg-zinc-900/30 hover:bg-zinc-800 border-transparent hover:border-zinc-700'
                                                            }`}
                                                        >
                                                            <div className={`text-zinc-600 font-mono text-xs w-6 text-center ${active ? 'text-fuchsia-400 animate-pulse' : 'group-hover:text-fuchsia-400'}`}>
                                                                {active ? '▶' : idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-sm font-bold truncate ${active ? 'text-fuchsia-400' : 'text-zinc-300 group-hover:text-white'}`}>{track.name}</div>
                                                                <div className="text-xs text-zinc-500 group-hover:text-zinc-400 truncate">{track.artist}</div>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (track.id) onRemoveFromPlaylist(selectedPlaylist.id, track.id);
                                                                }}
                                                                className="p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 bg-zinc-950 border-t border-zinc-800">
                                        <button
                                            disabled={selectedPlaylist.tracks.length === 0}
                                            onMouseDown={() => handleHoldStart(`detail-${selectedPlaylist.id}`, selectedPlaylist.tracks)}
                                            onMouseUp={handleHoldEnd}
                                            onMouseLeave={handleHoldEnd}
                                            onTouchStart={() => handleHoldStart(`detail-${selectedPlaylist.id}`, selectedPlaylist.tracks)}
                                            onTouchEnd={handleHoldEnd}
                                            onContextMenu={(e) => e.preventDefault()}
                                            className={`relative w-full h-16 rounded-xl overflow-hidden group border-2 transition-all duration-300 ${
                                                selectedPlaylist.tracks.length === 0 
                                                ? 'border-zinc-800 opacity-50 cursor-not-allowed' 
                                                : 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:border-cyan-400'
                                            }`}
                                        >
                                            <div 
                                                className={`absolute inset-0 bg-cyan-500 z-0 origin-left ${holdingItemId === `detail-${selectedPlaylist.id}` && isHolding ? 'transition-transform duration-[1000ms] ease-linear scale-x-100' : 'transition-none scale-x-0'}`}
                                            ></div>
                                            
                                            <div className="relative z-10 w-full h-full flex items-center justify-center gap-3 bg-transparent pointer-events-none">
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors ${holdingItemId === `detail-${selectedPlaylist.id}` && isHolding ? 'text-white delay-500' : 'text-cyan-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className={`font-black tracking-[0.2em] text-sm md:text-base transition-colors ${holdingItemId === `detail-${selectedPlaylist.id}` && isHolding ? 'text-white delay-500' : 'text-cyan-500'}`}>
                                                    HOLD TO LOAD PROGRAM
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                   </div>
               </div>
             )}

             {/* SONGS TAB */}
             {activeTab === 'SONGS' && (
                <div className="h-full relative w-full">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 pb-24">
                        <div className="flex justify-between items-end mb-4 border-b border-zinc-800 pb-2">
                            <h3 className="text-cyan-400 font-bold brand-font">ALL TRACKS</h3>
                            <span className="text-xs text-zinc-500 font-mono">{tracks.length} FILES</span>
                        </div>
                        {tracks.map((track, idx) => {
                            const active = isTrackPlaying(track.id);
                            return (
                                <div 
                                    key={track.id || idx}
                                    className={`group flex items-center gap-4 p-3 rounded-lg border transition-all mb-2 ${
                                        active
                                        ? 'bg-cyan-900/20 border-cyan-500/50' 
                                        : 'bg-zinc-900/30 border-transparent hover:border-cyan-500/30 hover:bg-zinc-800'
                                    }`}
                                >
                                    <div 
                                        onClick={() => { onTrackSelect(track, tracks); onClose(); }}
                                        className={`w-8 h-8 rounded flex items-center justify-center shrink-0 cursor-pointer ${
                                            active 
                                            ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                                            : 'bg-zinc-800 text-zinc-600 group-hover:text-cyan-400 group-hover:bg-cyan-900/20'
                                        }`}
                                    >
                                        {active && isPlaying ? (
                                            <div className="flex gap-[2px] h-3 items-end">
                                                <div className="w-[2px] bg-black animate-[bounce_1s_infinite] h-2"></div>
                                                <div className="w-[2px] bg-black animate-[bounce_1.2s_infinite] h-3"></div>
                                                <div className="w-[2px] bg-black animate-[bounce_0.8s_infinite] h-1.5"></div>
                                            </div>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" /></svg>
                                        )}
                                    </div>

                                    <div 
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => { onTrackSelect(track, tracks); onClose(); }}
                                    >
                                        <div className={`font-bold text-sm truncate ${active ? 'text-cyan-400' : 'text-white'}`}>
                                            <MarqueeTitle text={track.name} small />
                                        </div>
                                        <div className="text-xs text-zinc-500 truncate">{track.artist} • {track.album}</div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTrackToAdd(track);
                                            }}
                                            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-full transition-colors"
                                            title="Add to Playlist"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (track.id) onDeleteTrack(track.id);
                                            }}
                                            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-900/20 rounded-full transition-colors"
                                            title="Delete Track"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
             )}

             {/* ARTISTS / ALBUMS */}
             {(activeTab === 'ARTISTS' || activeTab === 'ALBUMS') && (
                <div className="p-6 overflow-y-auto custom-scrollbar h-full">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(activeTab === 'ARTISTS' ? groupedData.artists : groupedData.albums).map(([key, items]) => {
                            const typedItems = items as SongMetadata[];
                            return (
                                <button 
                                    key={key}
                                    className="relative group overflow-hidden bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer transition-all hover:border-cyan-500/50 text-left"
                                    onMouseDown={() => handleHoldStart(key, typedItems)}
                                    onMouseUp={handleHoldEnd}
                                    onMouseLeave={handleHoldEnd}
                                    onTouchStart={() => handleHoldStart(key, typedItems)}
                                    onTouchEnd={handleHoldEnd}
                                    onContextMenu={(e) => e.preventDefault()}
                                    onClick={() => {
                                        onTrackSelect(typedItems[0], typedItems);
                                        setTimeout(onClose, 200);
                                    }}
                                >
                                    <div 
                                        className={`absolute inset-0 bg-cyan-900/30 z-0 origin-left ${holdingItemId === key && isHolding ? 'transition-transform duration-[1000ms] ease-linear scale-x-100' : 'transition-none scale-x-0'}`}
                                    ></div>

                                    <div className="p-4 relative z-10 pointer-events-none">
                                        <div className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400">
                                            <MarqueeTitle text={key} />
                                        </div>
                                        <div className="text-xs text-zinc-500 font-mono">{(typedItems as SongMetadata[]).length} TRACKS</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
             )}
             
             {/* FAB: Floating Upload Button - Hoisted to Main Level for Visibility */}
             {activeTab === 'SONGS' && (
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`absolute bottom-8 right-6 w-14 h-14 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center justify-center transition-all duration-300 group z-[100] ${isProcessingFiles ? 'bg-zinc-800 cursor-wait' : 'bg-cyan-500 hover:scale-110 hover:bg-white text-black'}`}
                    title="Import Music"
                    disabled={isProcessingFiles}
                >
                        {isProcessingFiles ? (
                            <svg className="animate-spin h-6 w-6 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:rotate-90 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        )}
                </button>
             )}
          </div>

          {/* ADD TO PLAYLIST MODAL */}
          {trackToAdd && (
              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
                  <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
                      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                          <h4 className="text-white font-bold brand-font">ADD TO PLAYLIST</h4>
                          <button onClick={() => setTrackToAdd(null)} className="text-zinc-500 hover:text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                          </button>
                      </div>
                      <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                          {playlists.map(p => (
                              <button 
                                key={p.id}
                                onClick={() => handleAddToSpecificPlaylist(p.id)}
                                className="w-full text-left p-3 hover:bg-zinc-800 rounded flex items-center justify-between group"
                              >
                                  <span className="text-zinc-300 group-hover:text-white font-bold text-sm">{p.name}</span>
                                  <span className="text-xs text-zinc-600 group-hover:text-zinc-500">{p.tracks.length} tracks</span>
                              </button>
                          ))}
                          <button 
                            onClick={() => {
                                setTrackToAdd(null);
                                setActiveTab('PLAYLISTS');
                                setIsCreatingPlaylist(true);
                            }}
                            className="w-full text-left p-3 hover:bg-zinc-800 rounded text-cyan-500 font-bold text-sm border-t border-zinc-800 mt-2"
                          >
                              + Create New Playlist
                          </button>
                      </div>
                  </div>
              </div>
          )}

        {/* Footer Subtext */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 shrink-0 text-center relative z-10 flex flex-col gap-2">
             <div className="text-[10px] text-cyan-500/50 font-mono tracking-[0.3em] uppercase animate-pulse">
                [ TAP: INSPECT // HOLD: DIRECT LOAD ]
             </div>
             <p className="text-[9px] md:text-[10px] text-red-500/50 font-mono uppercase tracking-wider">
                ⚠ ALERT: EXTERNAL STREAMING FEEDS SEVERED. LOCAL PROTOCOLS ENGAGED.
             </p>
        </div>

      </div>
    </div>
  );
};

import React, { useRef } from 'react';
import { BPM_MAX, BPM_MIN, DEMO_TRACK_URL } from '../constants';
import { AppMode, SongMetadata } from '../types';

interface ControlPanelProps {
  bpm: number;
  setBpm: (val: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  onFileSelect: (file: File) => void;
  onDemoSelect: () => void;
  currentTrack: SongMetadata | null;
  mode: AppMode;
  modeConfig: any;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  bpm,
  setBpm,
  isPlaying,
  togglePlay,
  onFileSelect,
  onDemoSelect,
  currentTrack,
  mode,
  modeConfig
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpm(Number(e.target.value));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl">
      
      {/* Heart Rate Slider Section */}
      <div className="mb-10">
        <div className="flex justify-between items-end mb-4">
          <label className="text-gray-400 text-sm uppercase tracking-widest font-semibold">
            Simulated Heart Rate
          </label>
          <span className={`text-xl font-bold ${modeConfig.color}`}>
            {bpm} <span className="text-xs text-gray-500">BPM</span>
          </span>
        </div>
        
        <div className="relative h-12 flex items-center">
          <input
            type="range"
            min={BPM_MIN}
            max={BPM_MAX}
            value={bpm}
            onChange={handleSliderChange}
            className="w-full z-10 relative bg-transparent"
          />
          {/* Slider Background Track with Gradients for Zones */}
          <div className="absolute inset-x-0 h-1 bg-gray-700 rounded overflow-hidden flex top-1/2 -translate-y-1/2 pointer-events-none">
            {/* Motivation Zone (60-129) */}
            <div className="h-full bg-amber-900/50 w-[58%]"></div> 
            {/* Target Zone (130-150) */}
            <div className="h-full bg-cyan-900/50 w-[17%]"></div>
            {/* Overdrive Zone (151-180) */}
            <div className="h-full bg-fuchsia-900/50 w-[25%]"></div>
          </div>
          
          {/* Zone Markers */}
          <div className="absolute top-8 left-[58%] -translate-x-1/2 text-[10px] text-gray-500 font-mono">130</div>
          <div className="absolute top-8 left-[75%] -translate-x-1/2 text-[10px] text-gray-500 font-mono">150</div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-col md:flex-row items-center gap-6 justify-between border-t border-gray-800 pt-8">
        
        {/* Track Info & Upload */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 mb-3">
             <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
             <div className="truncate text-sm font-mono text-gray-300 max-w-[200px]">
               {currentTrack ? currentTrack.name : 'No Track Loaded'}
             </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-white uppercase tracking-wider rounded transition-colors"
            >
              Upload MP3
            </button>
            <input 
              type="file" 
              accept="audio/mp3,audio/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
            />
            <button 
              onClick={onDemoSelect}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-cyan-400 uppercase tracking-wider rounded transition-colors"
            >
              Load Demo
            </button>
          </div>
        </div>

        {/* Big Play Button */}
        <button 
          onClick={togglePlay}
          className={`w-16 h-16 flex items-center justify-center rounded-full border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            isPlaying 
              ? 'border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
              : 'border-cyan-500 text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
          }`}
        >
          {isPlaying ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      </div>

    </div>
  );
};
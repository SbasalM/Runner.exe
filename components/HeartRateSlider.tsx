
import React from 'react';
import { BPM_MAX, BPM_MIN } from '../constants';
import { AppMode } from '../types';

interface HeartRateSliderProps {
  bpm: number;
  setBpm: (val: number) => void;
  modeConfig: any;
}

export const HeartRateSlider: React.FC<HeartRateSliderProps> = ({ bpm, setBpm, modeConfig }) => {
  return (
    <div className="w-full px-6 py-4">
       <div className="flex justify-between items-end mb-2">
          <label className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
            Simulated BPM
          </label>
          <span className={`text-2xl font-bold ${modeConfig.color} transition-colors duration-300`}>
            {bpm}
          </span>
        </div>
        
        <div className="relative h-12 flex items-center group">
          <input
            type="range"
            min={BPM_MIN}
            max={BPM_MAX}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full z-10 relative bg-transparent focus:outline-none"
          />
          {/* Slider Background Track */}
          <div className="absolute inset-x-0 h-2 bg-gray-800 rounded-full overflow-hidden flex top-1/2 -translate-y-1/2 pointer-events-none shadow-inner">
            <div className="h-full bg-gradient-to-r from-amber-900/40 via-cyan-900/40 to-fuchsia-900/40 w-full"></div>
          </div>
          
          {/* Indicator Lines */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 pointer-events-none flex justify-between px-[2px] opacity-30">
             {[...Array(10)].map((_, i) => (
                <div key={i} className="w-[1px] h-full bg-gray-500"></div>
             ))}
          </div>
        </div>
    </div>
  );
};

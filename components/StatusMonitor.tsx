import React from 'react';
import { AppMode } from '../types';
import { MODE_CONFIG } from '../constants';

interface StatusMonitorProps {
  mode: AppMode;
  playbackRate: number;
}

export const StatusMonitor: React.FC<StatusMonitorProps> = ({ mode, playbackRate }) => {
  const config = MODE_CONFIG[mode];

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto mt-6">
      {/* Mode Status */}
      <div className={`p-4 rounded-xl border bg-gray-900/50 backdrop-blur ${config.borderColor} transition-colors duration-500`}>
        <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Current State</div>
        <div className={`text-xl md:text-2xl font-bold brand-font ${config.color} animate-pulse`}>
          {config.label}
        </div>
        <div className="text-sm text-gray-400 mt-1 font-mono">
          {config.message}
        </div>
      </div>

      {/* Playback Stats */}
      <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Engine Stats</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white font-mono">
            {Math.round(playbackRate * 100)}<span className="text-sm text-gray-500">%</span>
          </span>
        </div>
        <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${playbackRate < 1 ? 'bg-amber-500' : playbackRate > 1 ? 'bg-fuchsia-500' : 'bg-cyan-500'}`}
            style={{ width: `${(playbackRate / 1.5) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-mono">
           <span>SPD</span>
           <span>{playbackRate.toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
};
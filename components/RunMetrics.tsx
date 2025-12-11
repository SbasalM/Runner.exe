
import React from 'react';

interface RunMetricsProps {
  distance: string;
  distanceUnit: string;
  pace: string;
  paceUnit: string;
  calories: number;
  newUnlock?: string | null;
}

export const RunMetrics: React.FC<RunMetricsProps> = ({ distance, distanceUnit, pace, paceUnit, calories, newUnlock }) => {
  return (
    <div className="w-full flex-1 flex flex-col justify-center gap-2 md:gap-4 px-2 relative min-h-0">
      
      {/* UNLOCK NOTIFICATION TOAST */}
      {newUnlock && (
        <div className="absolute top-0 left-0 right-0 z-50 animate-fade-in-down">
          <div className="bg-cyan-900/90 border border-cyan-400 p-3 rounded-lg flex items-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
             <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-black font-bold text-lg animate-pulse">!</div>
             <div>
                <div className="text-[10px] text-cyan-200 uppercase tracking-widest font-bold">AVATAR UPGRADE</div>
                <div className="text-sm font-bold text-white brand-font tracking-wider">UNLOCKED: {newUnlock}</div>
             </div>
          </div>
        </div>
      )}

      {/* Primary Stat: Distance - Scaled Dynamically */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-2">
         <span className="text-gray-500 text-sm font-bold tracking-widest uppercase mb-4 md:mb-6">Distance</span>
         <div className="text-right">
             {/* 
                 Responsive Text Sizing:
                 - Base (Mobile): text-[18vw] -> Fits 375px width without overlapping other elements
                 - SM (Tablet+): text-[25vw] -> Original large impact
                 - MD (Desktop): text-[7rem] -> Fixed max size
             */}
             <span className="text-[18vw] sm:text-[25vw] md:text-[7rem] font-black text-white brand-font tracking-tighter leading-none block">{distance}</span>
             <span className="text-2xl md:text-3xl text-gray-400 font-bold block -mt-2">{distanceUnit}</span>
         </div>
      </div>

      {/* Secondary Stats Row - Scaled Up */}
      <div className="grid grid-cols-2 gap-4 md:gap-8 mt-4">
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-1">Pace</span>
          <div className="flex items-baseline">
             <span className="text-2xl sm:text-3xl md:text-5xl font-bold text-cyan-400 brand-font tracking-tight">{pace}</span>
             <span className="text-sm text-gray-500 ml-1">{paceUnit}</span>
          </div>
        </div>

        <div className="flex flex-col text-right">
          <span className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-1">Burn</span>
          <div className="flex items-baseline justify-end">
             <span className="text-2xl sm:text-3xl md:text-5xl font-bold text-amber-500 brand-font tracking-tight">{calories}</span>
             <span className="text-sm text-gray-500 ml-1">KCAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

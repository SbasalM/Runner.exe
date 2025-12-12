
import React from 'react';

interface RunMetricsProps {
  newUnlock?: string | null;
}

export const RunMetrics: React.FC<RunMetricsProps> = ({ newUnlock }) => {
  return (
    <div className="w-full absolute top-0 left-0 pointer-events-none z-50">
      {/* UNLOCK NOTIFICATION TOAST */}
      {newUnlock && (
        <div className="absolute top-2 left-0 right-0 animate-fade-in-down px-4 flex justify-center">
          <div className="bg-cyan-900/95 border border-cyan-400 p-3 rounded-lg flex items-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md max-w-sm w-full pointer-events-auto">
             <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-black font-bold text-lg animate-pulse shrink-0">!</div>
             <div className="min-w-0">
                <div className="text-[10px] text-cyan-200 uppercase tracking-widest font-bold truncate">AVATAR UPGRADE</div>
                <div className="text-sm font-bold text-white brand-font tracking-wider truncate">UNLOCKED: {newUnlock}</div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

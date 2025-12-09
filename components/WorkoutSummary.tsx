
import React from 'react';
import { WorkoutSession, WorkoutMode } from '../types';

interface WorkoutSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSession | null;
}

export const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({ isOpen, onClose, session }) => {
  if (!isOpen || !session) return null;

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-fade-in-up">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* Header Icon */}
        <div className="mb-6 relative">
             <div className="w-20 h-20 rounded-full bg-cyan-900/30 border border-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
             </div>
        </div>

        <h2 className="text-3xl font-black text-white brand-font tracking-tighter mb-1">SESSION COMPLETE</h2>
        <div className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-10">
            {new Date(session.date).toLocaleDateString()} • {new Date(session.date).toLocaleTimeString()}
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-4 mb-10">
            
            {/* Primary Stat */}
            <div className="col-span-2 bg-zinc-900 border border-zinc-700 p-4 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    {session.mode === WorkoutMode.RUN ? 'Distance' : 'Duration'}
                </span>
                <span className="text-3xl font-bold text-white brand-font">
                    {session.mode === WorkoutMode.RUN ? session.distance : session.duration}
                    <span className="text-sm text-gray-500 ml-1">
                        {session.mode === WorkoutMode.RUN ? 'MI' : 'MIN'}
                    </span>
                </span>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Calories</div>
                <div className="text-xl font-bold text-amber-500 brand-font">{session.calories}</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    {session.mode === WorkoutMode.RUN ? 'Avg Pace' : 'Duration'}
                </div>
                <div className="text-xl font-bold text-cyan-400 brand-font">
                    {session.mode === WorkoutMode.RUN ? session.avgPace : session.duration}
                </div>
            </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 hover:scale-[1.02] transition-all"
        >
          Close Summary
        </button>

      </div>
    </div>
  );
};

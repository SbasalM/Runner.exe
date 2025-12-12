
import React, { useState, useEffect, useRef } from 'react';

interface GymMetricsProps {
  formattedTime: string; 
  isCooldown: boolean;
  isPlaying: boolean;
  onSaveSet: (title: string, weight: number, reps: number) => void;
  onStopSession: () => void;
  suggestions: string[];
  personalRecords: Record<string, number>;
  onToggleCooldown: () => void;
}

export const GymMetrics: React.FC<GymMetricsProps> = ({ 
    formattedTime, 
    isCooldown, 
    isPlaying,
    onSaveSet,
    onStopSession,
    suggestions,
    personalRecords,
    onToggleCooldown
}) => {
  const [title, setTitle] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  
  // Auto-fill last title if available
  useEffect(() => {
    if (isCooldown && !title && suggestions.length > 0) {
        setTitle(suggestions[suggestions.length - 1]);
    }
  }, [isCooldown, suggestions]);

  const handleResume = (e: React.MouseEvent) => {
      e.stopPropagation();
      const w = parseFloat(weight) || 0;
      const r = parseFloat(reps) || 0;
      onSaveSet(title, w, r);
      // Reset numeric fields for next set, keep title
      setWeight('');
      setReps('');
  };

  const handleStop = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Auto-save the current set if data is entered before stopping
      if (title.trim() && (weight || reps)) {
           const w = parseFloat(weight) || 0;
           const r = parseFloat(reps) || 0;
           onSaveSet(title, w, r);
      }
      
      onStopSession();
  };

  const currentPR = personalRecords[title.trim()] || 0;

  return (
    <div 
        className={`
            w-full h-full flex flex-col items-center justify-end pointer-events-auto transition-all duration-700
        `}
        style={{
            // When playing: Shift down to fill space (Library hidden)
            // When paused: Shift down less to avoid marquee but clear button
            transform: isPlaying ? 'translateY(3rem)' : 'translateY(2rem)',
            
            // When playing: Standard padding
            // When paused: Padding to clear the "Access Library" button
            paddingBottom: isPlaying ? '140px' : '190px'
        }}
    >
       {!isCooldown ? (
           /* --- HERO TIMER (ACTIVE) --- */
           <div className="flex flex-col items-center w-full transition-all duration-500">
               <div className="text-xs md:text-sm font-bold tracking-[0.5em] uppercase mb-2 text-gray-500 animate-pulse">
                 SESSION TIME
               </div>
               
               <div 
                 className="font-black brand-font tracking-tighter leading-none transition-all duration-300 text-white text-center text-[20vw] md:text-[8rem]"
                 style={{ 
                    maxWidth: '100%',
                    WebkitTextStroke: '2px black', 
                    paintOrder: 'stroke fill',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
                 }}
               >
                 {formattedTime}
               </div>

               {/* LOG SET ACTION BUTTON (Replaces standard Cooldown button) */}
               <button
                  onClick={onToggleCooldown}
                  className="mt-6 px-12 py-3 rounded-full bg-cyan-900/50 border border-cyan-500/50 text-cyan-400 font-bold tracking-[0.2em] uppercase hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] animate-fade-in-up"
               >
                  LOG SET / REST
               </button>
           </div>
       ) : (
           /* --- REP RECORDER (REST) --- */
           <div className="w-full max-w-sm px-6 animate-fade-in-up z-50 mb-12">
               <div className="bg-black/90 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
                   <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-2">
                       <h3 className="text-cyan-400 font-bold brand-font tracking-widest text-lg">WORKOUT RECORDER</h3>
                       <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                           <span>PR:</span>
                           <span className="text-white font-bold">{currentPR} LBS</span>
                       </div>
                   </div>

                   <div className="space-y-4">
                       {/* Exercise Title */}
                       <div>
                           <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Exercise</label>
                           <input 
                             type="text" 
                             value={title}
                             onChange={(e) => setTitle(e.target.value)}
                             list="exercises"
                             className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white font-bold text-sm focus:border-cyan-500 outline-none transition-colors"
                             placeholder="BENCH PRESS..."
                           />
                           <datalist id="exercises">
                               {suggestions.map((s, i) => <option key={i} value={s} />)}
                           </datalist>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           {/* Weight */}
                           <div>
                               <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Weight (LBS)</label>
                               <input 
                                 type="number" 
                                 value={weight}
                                 onChange={(e) => setWeight(e.target.value)}
                                 className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white font-mono font-bold text-xl focus:border-fuchsia-500 outline-none transition-colors"
                                 placeholder="0"
                               />
                           </div>
                           {/* Reps */}
                           <div>
                               <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Reps</label>
                               <input 
                                 type="number" 
                                 value={reps}
                                 onChange={(e) => setReps(e.target.value)}
                                 className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white font-mono font-bold text-xl focus:border-fuchsia-500 outline-none transition-colors"
                                 placeholder="0"
                               />
                           </div>
                       </div>

                       {/* Controls */}
                       <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-800">
                            <button
                                onClick={handleResume}
                                className="flex-1 py-3 bg-cyan-900/30 border border-cyan-500/50 text-cyan-400 font-bold rounded-xl hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                LOG & RESUME
                            </button>
                            <button
                                onClick={handleStop}
                                className="px-4 py-3 bg-red-900/20 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-900/50 transition-all"
                            >
                                STOP
                            </button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

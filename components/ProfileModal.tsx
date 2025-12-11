
import React, { useState } from 'react';
import { WorkoutSession, WorkoutMode } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lifetimeDistance: number;
  unlockedItems: string[];
  equippedItems: string[];
  onToggleEquip: (item: string) => void;
  history?: WorkoutSession[];
  onUpdateSession?: (session: WorkoutSession) => void;
}

interface HistoryItemProps {
  session: WorkoutSession;
  onUpdate?: (s: WorkoutSession) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ session, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(session.title || (session.mode === WorkoutMode.RUN ? 'Run Session' : 'Gym Session'));
    const [weight, setWeight] = useState(session.weight || '');
    const [reps, setReps] = useState(session.reps || '');

    const handleSave = () => {
        if (onUpdate) {
            onUpdate({
                ...session,
                title,
                weight,
                reps
            });
        }
        setIsEditing(false);
    };

    return (
        <div className="group relative bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors">
            {/* Side Accent */}
            <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-lg transition-colors ${session.mode === WorkoutMode.RUN ? 'bg-cyan-900 group-hover:bg-cyan-500' : 'bg-fuchsia-900 group-hover:bg-fuchsia-500'}`}></div>
            
            <div className="pl-3 flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] text-gray-500 font-mono uppercase">
                             {new Date(session.date).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] text-zinc-600 font-mono">|</span>
                        <span className="text-[9px] text-gray-500 font-mono uppercase">
                             {new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-black border border-zinc-700 text-white font-bold brand-font text-xs w-full rounded px-2 py-1 mb-1 focus:outline-none focus:border-cyan-500"
                            placeholder="Session Title"
                            autoFocus
                        />
                    ) : (
                        <div className="text-sm text-white font-bold brand-font truncate max-w-[160px] leading-tight group-hover:text-cyan-100 transition-colors">
                            {title}
                        </div>
                    )}
                    
                    <div className="mt-1 flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${session.mode === WorkoutMode.RUN ? 'bg-cyan-900/30 text-cyan-400' : 'bg-fuchsia-900/30 text-fuchsia-400'}`}>
                            {session.mode}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                             {session.mode === WorkoutMode.RUN ? session.distance : session.duration}
                        </span>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end pl-2">
                    <div className="text-amber-500 font-bold text-sm brand-font mb-2">{session.calories} <span className="text-[9px] text-amber-700">KC</span></div>
                    <button 
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border transition-colors ${isEditing ? 'bg-green-900/20 text-green-400 border-green-500/50' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white hover:border-zinc-500'}`}
                    >
                        {isEditing ? 'SAVE' : 'EDIT'}
                    </button>
                </div>
            </div>

            {/* Gym Details / Editing Expansion */}
            {(session.mode === WorkoutMode.GYM || isEditing || session.weight || session.reps) && (
                <div className="mt-3 pt-2 border-t border-zinc-800/50 grid grid-cols-2 gap-3 pl-3">
                    <div>
                        <span className="text-[9px] text-zinc-600 uppercase font-bold block mb-0.5">Weight (LBS)</span>
                        {isEditing ? (
                            <input 
                                type="text"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full bg-black text-xs text-white p-1 rounded border border-zinc-700 font-mono"
                                placeholder="--"
                            />
                        ) : (
                            <span className="text-xs text-gray-300 font-mono">{weight || '-'}</span>
                        )}
                    </div>
                    <div>
                        <span className="text-[9px] text-zinc-600 uppercase font-bold block mb-0.5">Sets / Reps</span>
                        {isEditing ? (
                            <input 
                                type="text"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                className="w-full bg-black text-xs text-white p-1 rounded border border-zinc-700 font-mono"
                                placeholder="--"
                            />
                        ) : (
                            <span className="text-xs text-gray-300 font-mono">{reps || '-'}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  lifetimeDistance, 
  unlockedItems, 
  equippedItems, 
  onToggleEquip,
  history = [],
  onUpdateSession
}) => {
  if (!isOpen) return null;

  // Simple Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

  const items = [
    { id: 'jaw', name: 'Cyber Jaw', req: '10.0 Miles' },
    { id: 'neural_halo', name: 'Neural Halo', req: '20.0 Miles' },
    { id: 'cyber_visor', name: 'Cyber Visor', req: '30.0 Miles' }
  ];

  // Calculate Rank based on distance (Basic logic)
  const getRank = (dist: number) => {
      if (dist < 10) return { title: 'NEOPHYTE', color: 'text-gray-400' };
      if (dist < 30) return { title: 'RUNNER', color: 'text-cyan-400' };
      if (dist < 100) return { title: 'OPERATIVE', color: 'text-fuchsia-400' };
      return { title: 'CYBER LEGEND', color: 'text-amber-400' };
  };
  
  const rank = getRank(lifetimeDistance);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl p-0 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* TOP ID CARD SECTION */}
        <div className="p-6 pb-0 relative shrink-0">
             {/* Background Pattern */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
             
             <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)] relative overflow-hidden group">
                         {/* Scanline */}
                         <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50 animate-[scan_3s_linear_infinite]"></div>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                         </svg>
                    </div>
                    <div>
                        <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">UNIT_ID: CP-01</div>
                        <h2 className="text-white font-black brand-font tracking-wider text-2xl leading-none">PILOT</h2>
                        <div className={`text-xs font-bold font-mono mt-1 ${rank.color}`}>{rank.title}</div>
                    </div>
                </div>
                
                <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
             </div>

             {/* STATS STRIP */}
             <div className="grid grid-cols-2 gap-4 relative z-10 mb-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2">
                    <div className="text-[9px] text-zinc-500 uppercase font-bold">LIFETIME DIST</div>
                    <div className="text-xl font-mono font-bold text-white">{lifetimeDistance.toFixed(1)} <span className="text-[10px] text-zinc-600">MI</span></div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2">
                     <div className="text-[9px] text-zinc-500 uppercase font-bold">SESSIONS</div>
                     <div className="text-xl font-mono font-bold text-white">{history.length} <span className="text-[10px] text-zinc-600">LOGS</span></div>
                </div>
             </div>

             {/* TABS */}
             <div className="flex border-b border-zinc-800 relative z-10">
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'profile' ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Gear & Upgrades
                    {/* Neon Underline */}
                    <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-transform duration-300 ${activeTab === 'profile' ? 'scale-x-100' : 'scale-x-0'}`}></div>
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Mission Logs
                    <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-transform duration-300 ${activeTab === 'history' ? 'scale-x-100' : 'scale-x-0'}`}></div>
                </button>
             </div>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar bg-zinc-950/50">
            
            {activeTab === 'profile' ? (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Available Upgrades</span>
                        <span className="text-[10px] text-cyan-900 bg-cyan-900/10 px-2 py-0.5 rounded border border-cyan-900/30">{unlockedItems.length} / {items.length}</span>
                    </div>
                    
                    <div className="space-y-3">
                        {items.map(item => {
                            const isUnlocked = unlockedItems.includes(item.id);
                            const isEquipped = equippedItems.includes(item.id);
                            
                            return (
                                <div 
                                    key={item.id} 
                                    className={`relative p-3 rounded border transition-all duration-300 flex items-center justify-between group overflow-hidden ${
                                        isUnlocked 
                                        ? 'bg-zinc-900 border-zinc-700 hover:border-cyan-500/50' 
                                        : 'bg-zinc-950 border-zinc-800 opacity-60'
                                    }`}
                                >
                                    {/* Active Glow BG for Equipped */}
                                    {isEquipped && (
                                        <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none"></div>
                                    )}

                                    <div className="flex items-center gap-3 relative z-10">
                                        {/* Status Icon */}
                                        <div className={`w-8 h-8 rounded flex items-center justify-center border ${
                                            isUnlocked 
                                            ? (isEquipped ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-zinc-800 text-cyan-500 border-zinc-700')
                                            : 'bg-zinc-900 text-zinc-700 border-zinc-800'
                                        }`}>
                                            {isUnlocked ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>

                                        <div className="flex flex-col">
                                            <span className={`font-bold brand-font text-sm tracking-wide ${isUnlocked ? 'text-white' : 'text-zinc-600'}`}>
                                                {item.name}
                                            </span>
                                            <span className="text-[9px] text-zinc-500 font-mono">
                                                {isUnlocked ? 'AUGMENTATION READY' : `REQ: ${item.req}`}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {isUnlocked && (
                                        <button 
                                            onClick={() => onToggleEquip(item.id)}
                                            className={`relative z-10 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                                isEquipped 
                                                ? 'bg-cyan-900/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500'
                                            }`}
                                        >
                                            {isEquipped ? 'ACTIVE' : 'EQUIP'}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                /* HISTORY TAB */
                <div className="space-y-3 pb-4">
                    {history.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-12 text-zinc-600 space-y-2 opacity-50">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                             </svg>
                             <span className="text-xs font-mono">NO LOGS FOUND</span>
                         </div>
                    ) : (
                        history.map(session => (
                            <HistoryItem 
                                key={session.id} 
                                session={session} 
                                onUpdate={onUpdateSession} 
                            />
                        ))
                    )}
                </div>
            )}
            
        </div>
      </div>
    </div>
  );
};

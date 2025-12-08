
import React from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lifetimeDistance: number;
  unlockedItems: string[];
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, lifetimeDistance, unlockedItems }) => {
  if (!isOpen) return null;

  const items = [
    { id: 'jaw', name: 'Cyber Jaw', req: '0.5 Miles' },
    { id: 'neural_halo', name: 'Neural Halo', req: '1.0 Miles' }
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-cyan-900 border border-cyan-500 flex items-center justify-center text-cyan-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
             </div>
             <div>
                <h2 className="text-white font-bold brand-font tracking-wider text-xl leading-none">PILOT PROFILE</h2>
                <span className="text-xs text-zinc-500 font-mono">ID: RUNNER-01</span>
             </div>
          </div>
          
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lifetime Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Dist</div>
                <div className="text-2xl font-black text-white brand-font">{lifetimeDistance.toFixed(1)} <span className="text-xs text-gray-500 font-sans">MI</span></div>
            </div>
            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Rank</div>
                <div className="text-lg font-bold text-cyan-400 brand-font truncate">NEOPHYTE</div>
            </div>
        </div>

        {/* Inventory / Unlocks */}
        <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-4 flex justify-between items-center">
                <span>Augmentations</span>
                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-gray-500">{unlockedItems.length} / {items.length}</span>
            </div>
            
            <div className="space-y-3">
                {items.map(item => {
                    const isUnlocked = unlockedItems.includes(item.id);
                    return (
                        <div 
                            key={item.id} 
                            className={`relative p-4 rounded-xl border flex items-center justify-between transition-all ${
                                isUnlocked 
                                ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                : 'bg-zinc-800/50 border-zinc-700 opacity-60 grayscale'
                            }`}
                        >
                            <div className="flex flex-col">
                                <span className={`font-bold brand-font tracking-wide ${isUnlocked ? 'text-cyan-100' : 'text-gray-500'}`}>
                                    {item.name}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono mt-1">Unlock: {item.req}</span>
                            </div>
                            
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                                isUnlocked ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-transparent border-gray-600 text-gray-600'
                            }`}>
                                {isUnlocked ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

      </div>
    </div>
  );
};


import React from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lifetimeDistance: number;
  unlockedItems: string[];
  equippedItems: string[];
  onToggleEquip: (item: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  lifetimeDistance, 
  unlockedItems, 
  equippedItems,
  onToggleEquip 
}) => {
  if (!isOpen) return null;

  const items = [
    { id: 'jaw', name: 'Cyber Jaw', req: '10.0 Miles' },
    { id: 'neural_halo', name: 'Neural Halo', req: '20.0 Miles' }
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
                    const isEquipped = equippedItems.includes(item.id);
                    
                    return (
                        <div 
                            key={item.id} 
                            className={`relative p-4 rounded-xl border flex items-center justify-between transition-all ${
                                isUnlocked 
                                ? 'bg-cyan-900/10 border-cyan-500/30' 
                                : 'bg-zinc-800/50 border-zinc-700 opacity-60 grayscale'
                            }`}
                        >
                            <div className="flex flex-col">
                                <span className={`font-bold brand-font tracking-wide ${isUnlocked ? 'text-cyan-100' : 'text-gray-500'}`}>
                                    {item.name}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono mt-1">Unlock: {item.req}</span>
                            </div>
                            
                            {isUnlocked ? (
                                <button 
                                    onClick={() => onToggleEquip(item.id)}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                        isEquipped 
                                        ? 'bg-green-500/20 text-green-400 border-green-500 hover:bg-green-500/30' 
                                        : 'bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500/30'
                                    }`}
                                >
                                    {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                                </button>
                            ) : (
                                <div className="px-2 py-1 rounded bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-wider border border-zinc-700">
                                    LOCKED
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>

      </div>
    </div>
  );
};

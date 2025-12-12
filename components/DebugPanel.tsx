
import React, { useRef } from 'react';
import { HeartRateSlider } from './HeartRateSlider';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bpm: number;
  setBpm: (val: number) => void;
  modeConfig: any;
  onFileSelect: (file: File) => void;
  onAvatarSelect: (file: File) => void;
  unlockedItems: string[];
  toggleUnlock: (item: string) => void;
  triggerManualMilestone: () => void;
  showVisor?: boolean;
  setShowVisor?: (val: boolean) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isOpen,
  onClose,
  bpm,
  setBpm,
  modeConfig,
  unlockedItems = [],
  toggleUnlock,
  triggerManualMilestone,
  showVisor,
  setShowVisor
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-1/2 left-4 md:left-auto md:right-4 -translate-y-1/2 z-50 w-72 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-2xl animate-fade-in-right">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
        <h3 className="text-cyan-400 font-bold brand-font tracking-wider">JUDGE CONTROLS</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-8">
        {/* BPM Slider */}
        <div>
           <div className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Heart Rate Simulation</div>
           <HeartRateSlider bpm={bpm} setBpm={setBpm} modeConfig={modeConfig} />
        </div>

        {/* Progression Overrides */}
        <div>
           <div className="text-xs text-gray-400 mb-3 uppercase tracking-widest">Progression Overrides</div>
           <div className="space-y-2">
               {['jaw', 'neural_halo'].map(item => (
                   <label key={item} className="flex items-center gap-3 p-2 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:bg-gray-750">
                       <input 
                         type="checkbox" 
                         checked={unlockedItems.includes(item)}
                         onChange={() => toggleUnlock(item)}
                         className="rounded text-cyan-500 focus:ring-0 bg-gray-900 border-gray-600"
                       />
                       <span className="text-sm text-gray-300 font-mono capitalize">{item === 'jaw' ? 'Jaw Ventilator' : item.replace('_', ' ')}</span>
                   </label>
               ))}
               {/* Explicit Visor Toggle */}
               {setShowVisor && (
                 <label className="flex items-center gap-3 p-2 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:bg-gray-750">
                    <input 
                      type="checkbox" 
                      checked={showVisor || false}
                      onChange={(e) => setShowVisor(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-0 bg-gray-900 border-gray-600"
                    />
                    <span className="text-sm text-gray-300 font-mono capitalize">Tactical Visor</span>
                </label>
               )}
           </div>
        </div>

        {/* Manual Triggers */}
        <div>
          <div className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Event Simulators</div>
          <button 
            onClick={triggerManualMilestone}
            className="w-full py-3 bg-fuchsia-900/30 hover:bg-fuchsia-900/50 border border-fuchsia-500/50 text-xs text-fuchsia-300 uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            TRIGGER MILESTONE (TEST)
          </button>
        </div>
      </div>
    </div>
  );
};

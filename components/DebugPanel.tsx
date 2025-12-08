
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
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isOpen,
  onClose,
  bpm,
  setBpm,
  modeConfig,
  onFileSelect,
  onAvatarSelect,
  unlockedItems = [],
  toggleUnlock
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
                       <span className="text-sm text-gray-300 font-mono capitalize">{item.replace('_', ' ')}</span>
                   </label>
               ))}
           </div>
        </div>

        {/* Custom Avatar Upload */}
        <div>
          <div className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Avatar Override</div>
          <button 
            onClick={() => avatarInputRef.current?.click()}
            className="w-full py-3 bg-fuchsia-900/30 hover:bg-fuchsia-900/50 border border-fuchsia-500/50 text-xs text-fuchsia-300 uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            Upload Avatar (.GLB)
          </button>
          <input 
            type="file" 
            accept=".glb,.gltf" 
            className="hidden" 
            ref={avatarInputRef}
            onChange={(e) => e.target.files?.[0] && onAvatarSelect(e.target.files[0])}
          />
        </div>

        {/* File Upload */}
        <div>
          <div className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Custom Audio Source</div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-xs text-white uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Upload .MP3
          </button>
          <input 
            type="file" 
            accept="audio/mp3,audio/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          />
        </div>
      </div>
    </div>
  );
};

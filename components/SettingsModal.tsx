
import React, { useState, useEffect } from 'react';
import { Settings, UnitSystem } from '../types';
import { BPM_MIN, BPM_MAX, DEMO_TRACKS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdate: (newSettings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  // Sync local state with prop when modal opens to ensure fresh data
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleUnitToggle = (unit: UnitSystem) => {
    setLocalSettings(prev => ({ ...prev, units: unit }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setLocalSettings(prev => {
      const current = prev.enabledServices;
      if (current.includes(serviceId)) {
        // Prevent disabling all services - keep at least one
        if (current.length <= 1) return prev; 
        return { ...prev, enabledServices: current.filter(id => id !== serviceId) };
      } else {
        return { ...prev, enabledServices: [...current, serviceId] };
      }
    });
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    // Prevent crossing min/max
    if (val < localSettings.targetMax) {
      setLocalSettings(prev => ({ ...prev, targetMin: val }));
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    // Prevent crossing min/max
    if (val > localSettings.targetMin) {
      setLocalSettings(prev => ({ ...prev, targetMax: val }));
    }
  };

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-900 py-2 z-10 border-b border-zinc-800">
          <h2 className="text-white font-bold brand-font tracking-wider text-xl">SYSTEM SETTINGS</h2>
          {/* Close without saving */}
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Units Toggle */}
        <div className="mb-8">
          <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3 block">Display Units</label>
          <div className="flex bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => handleUnitToggle(UnitSystem.IMPERIAL)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                localSettings.units === UnitSystem.IMPERIAL ? 'bg-cyan-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              IMPERIAL (MI)
            </button>
            <button
              onClick={() => handleUnitToggle(UnitSystem.METRIC)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                localSettings.units === UnitSystem.METRIC ? 'bg-cyan-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              METRIC (KM)
            </button>
          </div>
        </div>

        {/* Connected Services */}
        <div className="mb-8">
          <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3 block">Connected Services</label>
          <div className="space-y-2">
            {Object.values(DEMO_TRACKS).map((track) => {
              const isEnabled = localSettings.enabledServices.includes(track.id);
              return (
                <button
                  key={track.id}
                  onClick={() => handleServiceToggle(track.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                     isEnabled ? 'bg-zinc-800 border-cyan-500/50' : 'bg-zinc-900 border-zinc-800 opacity-60'
                  }`}
                >
                  <span className={`text-sm font-bold ${isEnabled ? 'text-white' : 'text-gray-500'}`}>{track.platform}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isEnabled ? 'bg-cyan-500 border-cyan-500' : 'bg-transparent border-gray-600'
                  }`}>
                    {isEnabled && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Zone Config */}
        <div className="mb-6">
           <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-4 block">Target HR Zone</label>
           
           <div className="flex items-center justify-between text-white font-mono font-bold mb-2">
              <span className="text-amber-500">{localSettings.targetMin} BPM</span>
              <span className="text-fuchsia-500">{localSettings.targetMax} BPM</span>
           </div>

           <div className="relative h-12">
              {/* Visual Track */}
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                 <div 
                   className="absolute h-full bg-cyan-500/50"
                   style={{
                     left: `${((localSettings.targetMin - BPM_MIN) / (BPM_MAX - BPM_MIN)) * 100}%`,
                     right: `${100 - ((localSettings.targetMax - BPM_MIN) / (BPM_MAX - BPM_MIN)) * 100}%`
                   }}
                 ></div>
              </div>

              {/* Min Slider */}
              <input 
                type="range" 
                min={BPM_MIN} 
                max={BPM_MAX} 
                value={localSettings.targetMin} 
                onChange={handleMinChange}
                className="absolute w-full pointer-events-none appearance-none bg-transparent z-20 top-1/2 -translate-y-1/2 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-amber-500"
              />

              {/* Max Slider */}
              <input 
                type="range" 
                min={BPM_MIN} 
                max={BPM_MAX} 
                value={localSettings.targetMax} 
                onChange={handleMaxChange}
                className="absolute w-full pointer-events-none appearance-none bg-transparent z-20 top-1/2 -translate-y-1/2 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-fuchsia-500"
              />
           </div>
           <p className="text-[10px] text-gray-500 mt-2 text-center">
             Adjust the range to calibrate music transition points.
           </p>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors"
        >
          Save & Close
        </button>

      </div>
    </div>
  );
};

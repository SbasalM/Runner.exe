
import React, { useState, useEffect } from 'react';
import { Settings, UnitSystem, InputSource } from '../types';
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
  
  const handleInputSourceToggle = (source: InputSource) => {
      setLocalSettings(prev => ({ ...prev, inputSource: source }));
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

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalSettings(prev => ({ ...prev, sessionDuration: Number(e.target.value) }));
  };

  const handleToggle = (key: keyof Settings) => {
      setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-900 py-2 z-10 border-b border-zinc-800">
          <h2 className="text-white font-bold brand-font tracking-wider text-xl">SYSTEM SETTINGS</h2>
          {/* Close without saving */}
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* --- INPUT MODE SELECTOR --- */}
        <div className="mb-8">
            <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3 block">Operation Mode</label>
            <div className="flex bg-zinc-800 p-1 rounded-lg">
                <button
                    onClick={() => handleInputSourceToggle(InputSource.HEART_RATE)}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                        localSettings.inputSource === InputSource.HEART_RATE ? 'bg-cyan-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'
                    }`}
                >
                    HEART SYNC
                </button>
                <button
                    onClick={() => handleInputSourceToggle(InputSource.TIMER)}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                        localSettings.inputSource === InputSource.TIMER ? 'bg-fuchsia-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'
                    }`}
                >
                    TIMER MODE
                </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
                {localSettings.inputSource === InputSource.HEART_RATE 
                 ? "Adapts music to your simulated or real heart rate." 
                 : "Follows a set duration schedule. Useful if no heart monitor."}
            </p>
        </div>

        {/* --- EXPERIMENTAL: GESTURE CONTROL --- */}
        <div className="mb-8 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-green-400 uppercase tracking-widest font-bold">Hands-Free Gestures</label>
                <button 
                    onClick={() => handleToggle('gestureControlEnabled')}
                    className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.gestureControlEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${localSettings.gestureControlEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
                Control playback and volume using hand signs via webcam.
            </p>
            {localSettings.gestureControlEnabled && (
                <div className="bg-green-900/20 border border-green-900/50 p-2 rounded text-[9px] text-green-300/80">
                    <span className="font-bold">⚠️ DISCLAIMER:</span> Best results when phone is stationary (e.g. Treadmill/Bench). Moving armbands may be unreliable.
                </div>
            )}
        </div>

        {/* --- TIMER CONFIG (Conditional) --- */}
        {localSettings.inputSource === InputSource.TIMER && (
            <div className="mb-8 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
                 <label className="text-xs text-fuchsia-400 uppercase tracking-widest font-bold mb-2 block">Workout Duration</label>
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-mono text-xl">{localSettings.sessionDuration} MIN</span>
                 </div>
                 <input 
                    type="range" 
                    min={5} 
                    max={120} 
                    step={5}
                    value={localSettings.sessionDuration} 
                    onChange={handleDurationChange}
                    className="w-full appearance-none bg-zinc-700 h-2 rounded-full overflow-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-fuchsia-500 [&::-webkit-slider-thumb]:rounded-full"
                 />
                 
                 <div className="mt-4 flex items-center justify-between">
                     <span className="text-xs text-gray-400 font-bold uppercase">Slug Start (10s Warmup)</span>
                     <button 
                        onClick={() => handleToggle('slugStart')}
                        className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.slugStart ? 'bg-fuchsia-500' : 'bg-gray-700'}`}
                     >
                         <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${localSettings.slugStart ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </button>
                 </div>
                 <p className="text-[10px] text-gray-500 mt-1">Starts in Motivation mode for 10s before entering Zone.</p>
            </div>
        )}

        {/* --- GLOBAL AUDIO CONFIG --- */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-bold">Overdrive Music Speedup</label>
                <button 
                    onClick={() => handleToggle('overdriveSpeedup')}
                    className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.overdriveSpeedup ? 'bg-cyan-500' : 'bg-gray-700'}`}
                >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${localSettings.overdriveSpeedup ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
            </div>
            <p className="text-[10px] text-gray-500">
                If enabled, music speeds up (1.1x) when in Overdrive mode.
            </p>
        </div>

        {/* --- RUN SETTINGS --- */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-bold">GPS Tracking (Run Mode)</label>
                <button 
                    onClick={() => handleToggle('useGPS')}
                    className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.useGPS ? 'bg-cyan-500' : 'bg-gray-700'}`}
                >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${localSettings.useGPS ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
            </div>
            <p className="text-[10px] text-gray-500">
                Uses your device's location to calculate real distance and pace. Requires permission.
            </p>
        </div>

        {/* Units Toggle */}
        <div className="mb-8">
          <label className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3 block">Display Units</label>
          <div className="flex bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => handleUnitToggle(UnitSystem.IMPERIAL)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                localSettings.units === UnitSystem.IMPERIAL ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              IMPERIAL (MI)
            </button>
            <button
              onClick={() => handleUnitToggle(UnitSystem.METRIC)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                localSettings.units === UnitSystem.METRIC ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'
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

        {/* Target Zone Config - Only visible in Heart Rate Mode */}
        {localSettings.inputSource === InputSource.HEART_RATE && (
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
        )}

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
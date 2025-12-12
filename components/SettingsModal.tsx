
import React, { useState, useEffect } from 'react';
import { Settings, UnitSystem, InputSource } from '../types';
import { BPM_MIN, BPM_MAX, DEMO_TRACKS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdate: (newSettings: Settings) => void;
  isBleConnected: boolean;
  onConnectBle: () => void;
  onDisconnectBle: () => void;
  bleDeviceName?: string | null;
  bleError?: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    settings, 
    onUpdate,
    isBleConnected,
    onConnectBle,
    onDisconnectBle,
    bleDeviceName,
    bleError
}) => {
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

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val < localSettings.targetMax) {
      setLocalSettings(prev => ({ ...prev, targetMin: val }));
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in-up">
      {/* HUD Container with Cyberpunk Styling */}
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none z-0">
           <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-cyan-900/20 to-transparent"></div>
           <div className="absolute top-0 right-0 w-[1px] h-8 bg-cyan-500/50"></div>
           <div className="absolute top-0 right-0 h-[1px] w-8 bg-cyan-500/50"></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-900 bg-zinc-950/80 shrink-0 z-10 relative">
          <div>
            <h2 className="text-white font-black brand-font tracking-widest text-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-sm"></span>
              SYSTEM_CONFIG
            </h2>
            <div className="text-[10px] text-gray-500 font-mono tracking-wide mt-1">GLOBAL PARAMETERS</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar relative z-10">
          
          {/* --- INPUT MODE --- */}
          <section>
             <label className="text-[10px] text-cyan-500 uppercase tracking-[0.2em] font-bold mb-3 block flex items-center gap-2">
                <span className="w-8 h-[1px] bg-cyan-900"></span>
                Input Source
             </label>
             {/* Rocker Switch Style */}
             <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 relative mb-4">
                <div className={`absolute top-1 bottom-1 w-[48%] bg-zinc-800 rounded transition-all duration-300 ${localSettings.inputSource === InputSource.HEART_RATE ? 'left-1 border border-cyan-500/30' : 'left-[51%] border border-fuchsia-500/30'}`}></div>
                <button
                    onClick={() => handleInputSourceToggle(InputSource.HEART_RATE)}
                    className={`flex-1 py-3 text-xs font-bold rounded-md transition-all relative z-10 flex flex-col items-center justify-center gap-1 ${
                        localSettings.inputSource === InputSource.HEART_RATE ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    <span className="tracking-widest">HEART SYNC</span>
                </button>
                <button
                    onClick={() => handleInputSourceToggle(InputSource.TIMER)}
                    className={`flex-1 py-3 text-xs font-bold rounded-md transition-all relative z-10 flex flex-col items-center justify-center gap-1 ${
                        localSettings.inputSource === InputSource.TIMER ? 'text-fuchsia-400' : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    <span className="tracking-widest">TIMER MODE</span>
                </button>
             </div>

             {/* BLE CONNECT BUTTON */}
             {localSettings.inputSource === InputSource.HEART_RATE && (
                 <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Bluetooth Monitor</span>
                        <span className={`text-[10px] font-bold uppercase ${isBleConnected ? 'text-green-400' : 'text-gray-600'}`}>
                            {isBleConnected ? 'LINK ESTABLISHED' : 'DISCONNECTED'}
                        </span>
                     </div>
                     
                     {isBleConnected ? (
                         <div className="flex items-center gap-2">
                             <div className="flex-1 bg-green-900/20 border border-green-500/30 rounded px-3 py-2 text-xs text-green-400 font-mono truncate">
                                 {bleDeviceName || 'Unknown Device'}
                             </div>
                             <button 
                                onClick={onDisconnectBle}
                                className="px-4 py-2 bg-zinc-800 hover:bg-red-900/50 text-xs text-red-400 font-bold uppercase rounded border border-transparent hover:border-red-500/50 transition-colors"
                             >
                                Unlink
                             </button>
                         </div>
                     ) : (
                        <button 
                            onClick={onConnectBle}
                            className="w-full py-3 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black font-bold uppercase tracking-wider text-xs rounded transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                        >
                            Connect Bluetooth Device
                        </button>
                     )}
                     
                     {bleError && (
                         <div className="mt-2 text-[10px] text-red-500 font-mono">
                             ERROR: {bleError}
                         </div>
                     )}
                     
                     {!isBleConnected && (
                         <div className="mt-2 text-[9px] text-gray-600 font-mono leading-tight">
                             Compatible with Polar H10, Garmin, and standard BLE Heart Rate straps. Browser must support Web Bluetooth.
                         </div>
                     )}
                 </div>
             )}
          </section>

          {/* --- TARGET ZONES (Conditional) --- */}
          {localSettings.inputSource === InputSource.HEART_RATE && (
             <section className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-fuchsia-500"></div>
                
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-4 block">Target Heart Rate Zones</label>
                
                <div className="flex items-center justify-between text-white font-mono font-bold mb-4 text-xs">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-gray-500 uppercase">Min Threshold</span>
                        <span className="text-amber-500 text-lg">{localSettings.targetMin}</span>
                    </div>
                    <div className="h-[1px] flex-1 bg-zinc-800 mx-4"></div>
                    <div className="flex flex-col text-right">
                        <span className="text-[9px] text-gray-500 uppercase">Max Threshold</span>
                        <span className="text-fuchsia-500 text-lg">{localSettings.targetMax}</span>
                    </div>
                </div>

                <div className="relative h-14 select-none">
                    {/* Visual Track */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-3 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden">
                         {/* Active Range */}
                        <div 
                        className="absolute h-full bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-fuchsia-500/20"
                        style={{
                            left: `${((localSettings.targetMin - BPM_MIN) / (BPM_MAX - BPM_MIN)) * 100}%`,
                            right: `${100 - ((localSettings.targetMax - BPM_MIN) / (BPM_MAX - BPM_MIN)) * 100}%`
                        }}
                        >
                            <div className="w-full h-full border-x border-cyan-500/30"></div>
                        </div>
                    </div>

                    {/* Min Slider */}
                    <input 
                        type="range" 
                        min={BPM_MIN} 
                        max={BPM_MAX} 
                        value={localSettings.targetMin} 
                        onChange={handleMinChange}
                        className="absolute w-full pointer-events-none appearance-none bg-transparent z-20 top-1/2 -translate-y-1/2 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    />

                    {/* Max Slider */}
                    <input 
                        type="range" 
                        min={BPM_MIN} 
                        max={BPM_MAX} 
                        value={localSettings.targetMax} 
                        onChange={handleMaxChange}
                        className="absolute w-full pointer-events-none appearance-none bg-transparent z-20 top-1/2 -translate-y-1/2 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-fuchsia-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(217,70,239,0.5)]"
                    />
                </div>
             </section>
          )}

          {/* --- TIMER CONFIG (Conditional) --- */}
          {localSettings.inputSource === InputSource.TIMER && (
             <section className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50">
                 <div className="flex justify-between items-center mb-4">
                     <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Session Duration</label>
                     <span className="text-white font-mono text-xl font-bold">{localSettings.sessionDuration} <span className="text-xs text-gray-500">MIN</span></span>
                 </div>
                 
                 <input 
                    type="range" 
                    min={5} 
                    max={120} 
                    step={5}
                    value={localSettings.sessionDuration} 
                    onChange={handleDurationChange}
                    className="w-full appearance-none bg-zinc-800 h-2 rounded-full overflow-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-fuchsia-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(217,70,239,0.5)]"
                 />
                 <div className="flex justify-between mt-2 text-[9px] text-gray-600 font-mono">
                     <span>5m</span>
                     <span>60m</span>
                     <span>120m</span>
                 </div>
                 
                 <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                     <div>
                        <span className="text-xs text-gray-300 font-bold uppercase block">Slug Start</span>
                        <span className="text-[9px] text-gray-500">10s Warmup (Motivation Mode)</span>
                     </div>
                     <button 
                        onClick={() => handleToggle('slugStart')}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 border ${localSettings.slugStart ? 'bg-fuchsia-500/20 border-fuchsia-500' : 'bg-zinc-900 border-zinc-700'}`}
                     >
                         <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${localSettings.slugStart ? 'translate-x-6 bg-fuchsia-400' : 'translate-x-0 bg-gray-500'}`}></div>
                     </button>
                 </div>
             </section>
          )}
          
          {/* --- GESTURE CONTROL --- */}
          <section className="bg-green-900/10 rounded-xl p-4 border border-green-900/30">
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v5c0 5.25-4.375 8-7 8S3 15.75 3 11V6a1 1 0 112 0v2.5a.5.5 0 001 0V3z" clipRule="evenodd" /></svg>
                    <label className="text-xs text-green-400 uppercase tracking-widest font-bold">Gesture Control</label>
                </div>
                <button 
                    onClick={() => handleToggle('gestureControlEnabled')}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 border ${localSettings.gestureControlEnabled ? 'bg-green-500/20 border-green-500' : 'bg-zinc-900 border-zinc-700'}`}
                >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${localSettings.gestureControlEnabled ? 'translate-x-6 bg-green-400' : 'translate-x-0 bg-gray-500'}`}></div>
                </button>
             </div>
             {localSettings.gestureControlEnabled && (
                <div className="text-[9px] text-green-300/60 font-mono leading-relaxed pl-6 border-l border-green-900/50">
                    Control Playback, Volume, and Session State using hand signals via webcam. Ensure good lighting.
                </div>
             )}
          </section>

          {/* --- TOGGLES & OPTIONS --- */}
          <section className="space-y-4">
               <label className="text-[10px] text-cyan-500 uppercase tracking-[0.2em] font-bold mb-3 block flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-cyan-900"></span>
                    Parameters
               </label>
               
               {/* Overdrive Speedup */}
               <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div>
                        <span className="text-xs text-gray-300 font-bold uppercase block">Overdrive Accel</span>
                        <span className="text-[9px] text-gray-500">1.1x Playback Speed at Max HR</span>
                    </div>
                    <button 
                        onClick={() => handleToggle('overdriveSpeedup')}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 border ${localSettings.overdriveSpeedup ? 'bg-cyan-500/20 border-cyan-500' : 'bg-zinc-900 border-zinc-700'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 ${localSettings.overdriveSpeedup ? 'translate-x-6 bg-cyan-400' : 'translate-x-0 bg-gray-500'}`}></div>
                    </button>
               </div>

               {/* GPS */}
               <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div>
                        <span className="text-xs text-gray-300 font-bold uppercase block">GPS Tracking</span>
                        <span className="text-[9px] text-gray-500">Real-time geolocation for stats</span>
                    </div>
                    <button 
                        onClick={() => handleToggle('useGPS')}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 border ${localSettings.useGPS ? 'bg-cyan-500/20 border-cyan-500' : 'bg-zinc-900 border-zinc-700'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 ${localSettings.useGPS ? 'translate-x-6 bg-cyan-400' : 'translate-x-0 bg-gray-500'}`}></div>
                    </button>
               </div>

               {/* Judge Controls Toggle */}
               <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div>
                        <span className="text-xs text-gray-300 font-bold uppercase block">Judge Controls</span>
                        <span className="text-[9px] text-gray-500">Show Dev Tools on Mobile</span>
                    </div>
                    <button 
                        onClick={() => handleToggle('showJudgeControls')}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 border ${localSettings.showJudgeControls ? 'bg-cyan-500/20 border-cyan-500' : 'bg-zinc-900 border-zinc-700'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 ${localSettings.showJudgeControls ? 'translate-x-6 bg-cyan-400' : 'translate-x-0 bg-gray-500'}`}></div>
                    </button>
               </div>
          </section>
          
          {/* --- UNITS --- */}
          <section>
             <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3 block">Display Units</label>
             <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button
                    onClick={() => handleUnitToggle(UnitSystem.IMPERIAL)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                        localSettings.units === UnitSystem.IMPERIAL ? 'bg-zinc-700 text-white shadow' : 'text-gray-500 hover:text-white'
                    }`}
                >
                    Imperial
                </button>
                <button
                    onClick={() => handleUnitToggle(UnitSystem.METRIC)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                        localSettings.units === UnitSystem.METRIC ? 'bg-zinc-700 text-white shadow' : 'text-gray-500 hover:text-white'
                    }`}
                >
                    Metric
                </button>
             </div>
          </section>

          {/* DISCLAIMER FOOTER */}
          <div className="text-center mt-8 mb-4">
            <div className="text-xs text-gray-600 font-mono font-bold mb-1">CyberPump Bio-Engine v0.1</div>
            <div className="text-[10px] text-gray-700 font-mono leading-tight max-w-[80%] mx-auto">
              Heart rate data is being tested with compatible devices. Fallback simulation active for demonstration purposes. Not a medical device.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/90 backdrop-blur shrink-0 z-20">
             <button 
                onClick={handleSave}
                className="w-full py-3 bg-white text-black font-black uppercase tracking-[0.2em] rounded-lg hover:bg-cyan-400 hover:scale-[1.01] transition-all duration-200 shadow-lg"
             >
                Confirm Changes
             </button>
        </div>

      </div>
    </div>
  );
};

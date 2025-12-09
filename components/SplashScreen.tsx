import React, { useState } from 'react';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  const [isFading, setIsFading] = useState(false);

  const handleStart = () => {
    setIsFading(true);
    setTimeout(() => {
      onStart();
    }, 500); // Wait for fade out
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="relative mb-8">
         <div className="w-24 h-24 rounded-full bg-cyan-900/20 border border-cyan-500 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
         </div>
         <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-30"></div>
      </div>

      <h1 className="text-4xl md:text-6xl font-black text-white brand-font tracking-tighter mb-2">
        CYBER<span className="text-cyan-400">PUMP</span>
      </h1>
      <p className="text-cyan-500/70 font-mono text-xs md:text-sm tracking-[0.3em] uppercase mb-16">
        Biofeedback Music Engine
      </p>

      <button
        onClick={handleStart}
        className="group relative px-8 py-4 border border-cyan-500 bg-cyan-950/30 overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
      >
        <div className="absolute inset-0 w-0 bg-cyan-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-100"></div>
        <span className="relative z-10 font-mono font-bold text-cyan-400 group-hover:text-black tracking-widest text-sm transition-colors duration-200">
            INITIALIZE SYSTEM
        </span>
      </button>

      <div className="absolute bottom-8 text-[10px] text-gray-800 font-mono">
        v2.5.0 // SYSTEM_READY
      </div>
    </div>
  );
};
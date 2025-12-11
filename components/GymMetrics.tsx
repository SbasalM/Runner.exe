
import React from 'react';

interface GymMetricsProps {
  formattedTime: string;
  percentages: {
    motivation: number;
    zone: number;
    overdrive: number;
  };
}

export const GymMetrics: React.FC<GymMetricsProps> = ({ formattedTime, percentages }) => {
  return (
    <div className="w-full flex-1 flex flex-col justify-center gap-2 md:gap-4 px-2 min-h-0">
      {/* Session Timer */}
      <div className="flex flex-col items-center border-b border-gray-800 pb-2 md:pb-4">
         <span className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-1">Session Duration</span>
         {/* 
            Responsive Text Sizing:
            - Base (Mobile): text-[20vw] -> Prevents overflow on small screens
            - SM (Tablet+): text-[28vw] -> Large impact
            - MD (Desktop): text-[8rem] -> Fixed max
         */}
         <span className="text-[20vw] sm:text-[28vw] md:text-[8rem] font-black text-white brand-font tracking-tighter tabular-nums leading-none">
            {formattedTime}
         </span>
      </div>

      {/* Zone Distribution Chart */}
      <div className="w-full mt-4">
         <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
            <span>Low</span>
            <span>Target</span>
            <span>Peak</span>
         </div>
         
         <div className="h-8 w-full flex rounded-full overflow-hidden bg-gray-900">
           {/* Motivation Bar */}
           <div 
             className="h-full bg-amber-500 transition-all duration-500" 
             style={{ width: `${percentages.motivation}%` }}
           ></div>
           {/* Zone Bar */}
           <div 
             className="h-full bg-cyan-400 transition-all duration-500" 
             style={{ width: `${percentages.zone}%` }}
           ></div>
           {/* Overdrive Bar */}
           <div 
             className="h-full bg-fuchsia-500 transition-all duration-500" 
             style={{ width: `${percentages.overdrive}%` }}
           ></div>
         </div>

         <div className="flex justify-between text-xs text-gray-400 font-mono mt-2">
            <span>{Math.round(percentages.motivation)}%</span>
            <span>{Math.round(percentages.zone)}%</span>
            <span>{Math.round(percentages.overdrive)}%</span>
         </div>
      </div>
    </div>
  );
};

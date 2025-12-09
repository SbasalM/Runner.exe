
import { useState, useEffect, useRef } from 'react';
import { AppMode } from '../types';

export const useGymEngine = (isPlaying: boolean, currentMode: AppMode, isActive: boolean) => {
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [zoneStats, setZoneStats] = useState<Record<AppMode, number>>({
    [AppMode.MOTIVATION]: 0,
    [AppMode.ZONE]: 0,
    [AppMode.OVERDRIVE]: 0,
    [AppMode.COOLDOWN]: 0
  });

  const reset = () => {
      setElapsedTime(0);
      setZoneStats({
        [AppMode.MOTIVATION]: 0,
        [AppMode.ZONE]: 0,
        [AppMode.OVERDRIVE]: 0,
        [AppMode.COOLDOWN]: 0
      });
  };

  useEffect(() => {
    // Stop accumulating if inactive
    if (!isActive) return;

    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      
      setZoneStats(prev => ({
        ...prev,
        [currentMode]: prev[currentMode] + 1
      }));

    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentMode, isActive]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate percentages, preventing divide by zero
  const totalTime = Math.max(1, (Object.values(zoneStats) as number[]).reduce((a: number, b: number) => a + b, 0));
  
  const getPercentages = () => ({
    motivation: (zoneStats[AppMode.MOTIVATION] / totalTime) * 100,
    zone: (zoneStats[AppMode.ZONE] / totalTime) * 100,
    overdrive: (zoneStats[AppMode.OVERDRIVE] / totalTime) * 100,
  });

  return {
    formattedTime: formatTime(elapsedTime),
    percentages: getPercentages(),
    reset
  };
};

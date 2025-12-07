
import { useState, useEffect, useRef } from 'react';
import { UnitSystem } from '../types';

export const useRunEngine = (bpm: number, isPlaying: boolean, units: UnitSystem, isActive: boolean) => {
  const [distanceKm, setDistanceKm] = useState(0); 
  const [calories, setCalories] = useState(0);
  const [currentPaceMinPerKm, setCurrentPaceMinPerKm] = useState(0);

  const lastUpdateRef = useRef<number>(Date.now());

  // Reset stats when mode is inactive
  useEffect(() => {
    if (!isActive) {
      setDistanceKm(0);
      setCalories(0);
      setCurrentPaceMinPerKm(0);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    // Calculate simulated speed based on BPM
    // Base speed at 60 BPM = 5 km/h (Walking)
    // Max speed at 180 BPM = 18 km/h (Sprinting)
    const speedKmh = 5 + ((bpm - 60) / (180 - 60)) * (18 - 5);
    
    // Pace = 60 / speedKmh (min/km)
    const paceMinPerKm = speedKmh > 0 ? 60 / speedKmh : 0;
    setCurrentPaceMinPerKm(paceMinPerKm);

    if (!isPlaying) {
      lastUpdateRef.current = Date.now();
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      // Update Distance
      const distanceIncrement = (speedKmh / 3600) * deltaSeconds;
      setDistanceKm(prev => prev + distanceIncrement);

      // Update Calories
      // Rough estimate: METs * Weight(kg) * Time(hrs). Assuming 70kg person.
      // METs estimated from speed: Speed(kmh) * 0.9 roughly
      const mets = speedKmh * 0.95;
      const caloriesIncrement = (mets * 70 * (deltaSeconds / 3600));
      setCalories(prev => prev + caloriesIncrement);

    }, 100); // 10Hz update for smoothness

    return () => clearInterval(interval);
  }, [bpm, isPlaying, isActive]);

  // Formatting Helpers
  const formatPace = (val: number) => {
    if (!isFinite(val) || isNaN(val)) return "0:00";
    const mins = Math.floor(val);
    const secs = Math.round((val - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayValues = () => {
    if (units === UnitSystem.METRIC) {
      return {
        distance: distanceKm.toFixed(2),
        unit: 'KM',
        pace: formatPace(currentPaceMinPerKm),
        paceUnit: '/KM'
      };
    } else {
      // Imperial Conversion
      const distanceMiles = distanceKm * 0.621371;
      const paceMinPerMile = currentPaceMinPerKm * 1.60934;
      return {
        distance: distanceMiles.toFixed(2),
        unit: 'MI',
        pace: formatPace(paceMinPerMile),
        paceUnit: '/MI'
      };
    }
  };

  const display = getDisplayValues();

  return {
    rawDistanceKm: distanceKm, // Expose raw number for progression
    distance: display.distance,
    distanceUnit: display.unit,
    pace: display.pace,
    paceUnit: display.paceUnit,
    calories: Math.floor(calories),
  };
};

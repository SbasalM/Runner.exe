
import { useState, useEffect, useRef } from 'react';
import { UnitSystem } from '../types';

export const useRunEngine = (bpm: number, isPlaying: boolean, units: UnitSystem, isActive: boolean, useGPS: boolean = false) => {
  const [distanceKm, setDistanceKm] = useState(0); 
  const [calories, setCalories] = useState(0);
  const [currentPaceMinPerKm, setCurrentPaceMinPerKm] = useState(0);

  const lastUpdateRef = useRef<number>(Date.now());
  const prevPositionRef = useRef<{lat: number, lon: number} | null>(null);

  // Manual Reset Function
  const reset = () => {
    setDistanceKm(0);
    setCalories(0);
    setCurrentPaceMinPerKm(0);
    prevPositionRef.current = null;
  };

  // --- HELPER: Haversine Distance (in km) ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    // Only accumulate if Active AND Playing
    if (!isActive) return;

    if (!isPlaying) {
        lastUpdateRef.current = Date.now();
        // Even if paused, we might want to keep GPS lock, but generally tracking pauses on pause.
        // We won't accumulate distance while paused.
        return;
    }

    // --- MODE 1: GPS TRACKING ---
    if (useGPS && 'geolocation' in navigator) {
        let watchId: number;

        const handleSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, speed } = position.coords;
            const now = Date.now();
            // speed is in m/s

            // Calculate Distance
            if (prevPositionRef.current) {
                const dist = calculateDistance(
                    prevPositionRef.current.lat, 
                    prevPositionRef.current.lon, 
                    latitude, 
                    longitude
                );
                
                // Only count if accuracy is decent and we moved a bit to avoid jitter
                if (position.coords.accuracy < 50 && dist > 0.001) { // 1m threshold
                    setDistanceKm(prev => prev + dist);
                }
            }

            prevPositionRef.current = { lat: latitude, lon: longitude };

            // Calculate Speed / Pace
            let speedKmh = 0;
            if (speed !== null && speed >= 0) {
                 speedKmh = speed * 3.6; // m/s to km/h
            } else {
                 // Fallback: If device doesn't provide speed, could calculate from deltas
                 // But for this demo, let's trust the device or 0
            }

            const paceMinPerKm = speedKmh > 0 ? 60 / speedKmh : 0;
            setCurrentPaceMinPerKm(paceMinPerKm);

            // Calculate Calories (Rough approximation based on speed)
            // If GPS speed is 0 or null (standing still), we assume resting burn is minimal or handled elsewhere
            const deltaSeconds = (now - lastUpdateRef.current) / 1000;
            lastUpdateRef.current = now;

            const mets = speedKmh * 0.95;
            const caloriesIncrement = (mets * 70 * (deltaSeconds / 3600)); // 70kg weight assumption
            setCalories(prev => prev + caloriesIncrement);
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error("GPS Error:", error);
            // Fallback to simulation if GPS fails?
            // For now, just log.
        };

        watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });

        return () => navigator.geolocation.clearWatch(watchId);
    } 
    
    // --- MODE 2: SIMULATION (BPM BASED) ---
    else {
        // Calculate simulated speed based on BPM
        // Base speed at 60 BPM = 5 km/h (Walking)
        // Max speed at 180 BPM = 18 km/h (Sprinting)
        const speedKmh = 5 + ((bpm - 60) / (180 - 60)) * (18 - 5);
        
        // Pace = 60 / speedKmh (min/km)
        const paceMinPerKm = speedKmh > 0 ? 60 / speedKmh : 0;
        setCurrentPaceMinPerKm(paceMinPerKm);

        const interval = setInterval(() => {
            const now = Date.now();
            const deltaSeconds = (now - lastUpdateRef.current) / 1000;
            lastUpdateRef.current = now;

            // Update Distance
            const distanceIncrement = (speedKmh / 3600) * deltaSeconds;
            setDistanceKm(prev => prev + distanceIncrement);

            // Update Calories
            const mets = speedKmh * 0.95;
            const caloriesIncrement = (mets * 70 * (deltaSeconds / 3600));
            setCalories(prev => prev + caloriesIncrement);

        }, 100); // 10Hz update for smoothness

        return () => clearInterval(interval);
    }
  }, [bpm, isPlaying, isActive, useGPS]);

  // Formatting Helpers
  const formatPace = (val: number) => {
    if (!isFinite(val) || isNaN(val) || val === 0) return "0:00";
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
    reset
  };
};

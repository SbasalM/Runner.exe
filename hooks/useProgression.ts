
import { useState, useEffect, useRef } from 'react';

export const useProgression = (currentSessionDistanceKm: number) => {
  // Mock persistent storage for the demo
  const [lifetimeDistanceMiles, setLifetimeDistanceMiles] = useState(0);
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [newUnlock, setNewUnlock] = useState<string | null>(null);
  
  // Track previous session distance to handle resets/increments
  const lastSessionDistanceRef = useRef(0);

  useEffect(() => {
    // 1. Calculate Delta
    // If current session distance < last recorded, it means a reset happened (e.g. mode switch).
    // In that case, we treat the current distance as fresh accumulation.
    let deltaKm = 0;
    if (currentSessionDistanceKm < lastSessionDistanceRef.current) {
        deltaKm = currentSessionDistanceKm; 
    } else {
        deltaKm = currentSessionDistanceKm - lastSessionDistanceRef.current;
    }
    
    lastSessionDistanceRef.current = currentSessionDistanceKm;

    if (deltaKm <= 0) return;

    // 2. Convert to Miles and Accumulate
    const deltaMiles = deltaKm * 0.621371;
    
    setLifetimeDistanceMiles(prev => {
        const newTotal = prev + deltaMiles;
        checkUnlocks(newTotal);
        return newTotal;
    });

  }, [currentSessionDistanceKm]);

  const checkUnlocks = (totalMiles: number) => {
    const newItems = new Set(unlockedItems);
    let unlocked = false;
    let unlockedName = '';

    // Unlock Logic
    // Level 1: Cyber Jaw at 0.5 Miles
    if (totalMiles >= 0.5 && !newItems.has('jaw')) {
        newItems.add('jaw');
        unlockedName = 'CYBER JAW';
        unlocked = true;
    }

    // Level 2: Neural Halo at 1.0 Miles
    if (totalMiles >= 1.0 && !newItems.has('neural_halo')) {
        newItems.add('neural_halo');
        unlockedName = 'NEURAL HALO';
        unlocked = true;
    }

    if (unlocked) {
        setUnlockedItems(Array.from(newItems));
        setNewUnlock(unlockedName);
        
        // Clear notification after 5 seconds
        setTimeout(() => setNewUnlock(null), 5000);
    }
  };

  // Manual Toggle for Judge Panel
  const toggleUnlock = (item: string) => {
    setUnlockedItems(prev => {
        if (prev.includes(item)) {
            return prev.filter(i => i !== item);
        } else {
            return [...prev, item];
        }
    });
  };

  return {
    lifetimeDistanceMiles,
    unlockedItems,
    newUnlock,
    toggleUnlock
  };
};


import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Dodecahedron, Box, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { AppMode } from '../types';

interface AvatarSkullProps {
  color: string;
  mode: AppMode;
  bpm: number;
  unlockedItems: string[];
  isIgnited: boolean;
  isPlaying: boolean;
  isStandby: boolean;
}

export const AvatarSkull: React.FC<AvatarSkullProps> = ({ color, mode, bpm, unlockedItems, isIgnited, isPlaying, isStandby }) => {
  const haloRef = useRef<THREE.Mesh>(null);
  const craniumMatRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Shared Eye Material Instance
  const eyesMat = useMemo(() => new THREE.MeshStandardMaterial({
      toneMapped: false,
      color: new THREE.Color(0x000000)
  }), []);
  
  // Reusable color objects to avoid GC
  const colorGray = useMemo(() => new THREE.Color('#444444'), []);
  const colorOrange = useMemo(() => new THREE.Color('#FF4500'), []);
  const colorStandby = useMemo(() => new THREE.Color('#555555'), []);
  const targetColor = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    // Allow updates if playing OR in standby
    if (!isPlaying && !isStandby) return; 

    // 1. Halo Animation
    if (haloRef.current) {
        haloRef.current.rotation.z += delta * 0.5;
        haloRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }

    // 2. Reactive Material Logic
    if (craniumMatRef.current) {
        
        // --- STANDBY MODE ---
        if (isStandby) {
            craniumMatRef.current.color.copy(colorStandby);
            craniumMatRef.current.emissive.copy(colorStandby);
            craniumMatRef.current.emissiveIntensity = 0.2;
            craniumMatRef.current.opacity = 0.2;

            // Eyes OFF
            eyesMat.emissiveIntensity = 0;
            eyesMat.color.setHex(0x000000);
        }

        // --- COOLDOWN MODE ---
        else if (mode === AppMode.COOLDOWN) {
            targetColor.set(color); // Blue
            craniumMatRef.current.color.copy(targetColor);
            craniumMatRef.current.emissive.copy(targetColor);
            craniumMatRef.current.emissiveIntensity = isIgnited ? 3.0 : 0.8;
            
            // Eyes: Calm Blue
            eyesMat.color.copy(targetColor);
            eyesMat.emissive.copy(targetColor);
            eyesMat.emissiveIntensity = isIgnited ? 5.0 : 1.5;
        }

        // --- PHASE 1: MOTIVATION (<130 BPM) ---
        else if (bpm < 130) {
            // Interpolate Color: Gray -> Orange
            // Range 60 -> 129
            const t = Math.max(0, Math.min(1, (bpm - 60) / (129 - 60)));
            targetColor.lerpColors(colorGray, colorOrange, t);
            
            // Apply Color
            craniumMatRef.current.color.copy(targetColor);
            craniumMatRef.current.emissive.copy(targetColor);
            
            // Intensity: Low glow that builds up slightly
            const intensity = THREE.MathUtils.lerp(0.1, 0.15, t); // Toned down idle
            craniumMatRef.current.emissiveIntensity = isIgnited ? 3.0 : intensity;

            // Eyes: OFF
            eyesMat.emissiveIntensity = isIgnited ? 5.0 : 0;
            eyesMat.color.setHex(0x000000);
        } 
        
        // --- PHASE 2: ZONE (130-150 BPM) ---
        else if (bpm <= 150) {
            // Use Mode Color (Cyan)
            targetColor.set(color);
            craniumMatRef.current.color.copy(targetColor);
            craniumMatRef.current.emissive.copy(targetColor);

            // Intensity: Ramp 0 -> 50% relative strength (base 2.0)
            const t = (bpm - 130) / (150 - 130);
            const baseIntensity = THREE.MathUtils.lerp(0.5, 1.5, t);
            craniumMatRef.current.emissiveIntensity = isIgnited ? 3.0 : baseIntensity;

            // Eyes: ON
            eyesMat.color.copy(targetColor);
            eyesMat.emissive.copy(targetColor);
            eyesMat.emissiveIntensity = isIgnited ? 5.0 : 2.0;
        }

        // --- PHASE 3: OVERDRIVE (>150 BPM) ---
        else {
            // Use Mode Color (Fuchsia)
            targetColor.set(color);
            craniumMatRef.current.color.copy(targetColor);
            craniumMatRef.current.emissive.copy(targetColor);

            // Intensity: Ramp 50% -> 100% relative strength
            const t = Math.min(1, (bpm - 150) / (180 - 150));
            const baseIntensity = THREE.MathUtils.lerp(1.5, 3.0, t);
            craniumMatRef.current.emissiveIntensity = isIgnited ? 4.0 : baseIntensity;

            // Eyes: ON FIRE (Flickering)
            eyesMat.color.copy(targetColor);
            eyesMat.emissive.copy(targetColor);
            
            // Jitter calculation
            const jitter = Math.random() * 2.0;
            eyesMat.emissiveIntensity = isIgnited ? 8.0 : (3.0 + jitter);
        }

        // --- Global Opacity Override for Manifestation ---
        // If Ignited, go full opacity. If idle, stay ghosty (0.1) unless in high zones where we want more solidity
        // Cooldown gets moderate opacity
        // Standby dealt with above
        if (!isStandby) {
            const baseOpacity = mode === AppMode.COOLDOWN ? 0.4 : (bpm < 130 ? 0.1 : 0.6);
            craniumMatRef.current.opacity = isIgnited ? 1.0 : baseOpacity;
        }
    }
  });

  const hasVisor = unlockedItems.includes('cyber_visor');
  const hasHalo = unlockedItems.includes('neural_halo');

  return (
    <group>
      {/* CRANIUM */}
      <Dodecahedron args={[1, 0]}>
        <meshStandardMaterial 
            ref={craniumMatRef}
            roughness={0.3} 
            metalness={0.8} 
            wireframe={!isIgnited && !isStandby} 
            transparent={true}
        />
      </Dodecahedron>
      
      {/* INNER CRANIUM */}
      <Dodecahedron args={[0.95, 0]}>
        <meshStandardMaterial 
            color="#000" 
            roughness={0.9} 
            transparent={true}
            opacity={0.8}
        />
      </Dodecahedron>

      {/* JAW */}
      <Box args={[0.8, 0.6, 1]} position={[0, -0.9, 0.1]} scale={[0.8, 1, 0.8]}>
        <meshStandardMaterial 
            color="#1a1a1a" 
            roughness={0.2} 
            metalness={0.9}
            transparent={true}
            opacity={isIgnited ? 1.0 : 0.5} 
        />
      </Box>

      {/* EYES */}
      <group position={[0, 0, 0.7]}>
         <Sphere args={[0.15, 16, 16]} position={[-0.35, 0.1, 0]} material={eyesMat} />
         <Sphere args={[0.15, 16, 16]} position={[0.35, 0.1, 0]} material={eyesMat} />
      </group>

      {/* UNLOCKABLES */}
      {hasVisor && (
         <Box args={[1.2, 0.3, 0.1]} position={[0, 0.1, 0.85]}>
            <meshPhysicalMaterial 
                color={color} 
                transparent 
                opacity={isIgnited ? 0.8 : 0.4} 
                transmission={0.5} 
                roughness={0}
                metalness={0.5}
                emissive={color}
                emissiveIntensity={isIgnited ? 1.0 : 0.2}
            />
         </Box>
      )}

      {hasHalo && (
        <group position={[0, 0.8, 0]}>
             <Torus ref={haloRef} args={[0.8, 0.05, 8, 32]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial 
                    color={color} 
                    emissive={color} 
                    emissiveIntensity={isIgnited ? 2.0 : 0.5} 
                    wireframe={true}
                    transparent={true}
                    opacity={isIgnited ? 1.0 : 0.3}
                />
             </Torus>
        </group>
      )}
    </group>
  );
};

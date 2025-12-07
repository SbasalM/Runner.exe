
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicSkull } from './GraphicSkull';
import { AppMode } from '../types';

interface AvatarSceneProps {
  color: string;
  mode: AppMode;
  bpm: number;
  isIgnited: boolean;
  unlockedItems: string[];
  isPlaying: boolean;
  isStandby?: boolean;
}

const SceneContent: React.FC<{ color: string; mode: AppMode; bpm: number; isIgnited: boolean; unlockedItems: string[]; isPlaying: boolean; isStandby: boolean }> = ({ color, mode, bpm, isIgnited, unlockedItems, isPlaying, isStandby }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Calculate Light Direction (Sun Position)
  const lightPos = useMemo(() => new THREE.Vector3(5, 5, 5), []);
  const lightDir = useMemo(() => lightPos.clone().normalize(), [lightPos]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Freeze animation if paused and NOT in standby (Glitch pause)
    if (!isPlaying && !isStandby) return; 

    const t = state.clock.getElapsedTime();

    // 1. Snap-to-Zone Orientation Logic
    let targetRotY = 0;
    let targetRotX = 0;

    if (isStandby) {
        // Standby Mode: Gentle idle drift
        groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.2; // Slow look left/right
        groupRef.current.rotation.x = Math.cos(t * 0.3) * 0.05; // Very slight nod
        groupRef.current.position.y = Math.sin(t * 1.0) * 0.1; // Gentle bob
        
        // Pulse Scale for standby
        const targetScale = 0.8; 
        groupRef.current.scale.set(targetScale, targetScale, targetScale);
        return;
    }

    if (mode === AppMode.MOTIVATION) {
        targetRotY = -0.5;
        targetRotX = 0.1;
    } else if (mode === AppMode.ZONE) {
        targetRotY = 0;
        targetRotX = 0;
    } else if (mode === AppMode.COOLDOWN) {
        targetRotY = 0;
        targetRotX = 0.3; // Look down
    } else {
        // OVERDRIVE
        targetRotY = 0.5;
        targetRotX = -0.2;
    }

    const snapSpeed = 0.1;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, snapSpeed);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, snapSpeed);

    // 2. Gentle Float
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.1;

    // 3. Pulse Scale
    const baseScale = 0.85;
    const targetScale = isIgnited ? 1.2 : baseScale;
    const currentScale = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.1);
    groupRef.current.scale.set(currentScale, currentScale, currentScale);
  });

  return (
    <>
      <group ref={groupRef}>
         {/* Use new GraphicSkull with Sin City Shader */}
         <GraphicSkull lightDir={lightDir} />
      </group>
      
      {/* Light source for shader logic */}
      <directionalLight position={lightPos} intensity={1} />
    </>
  );
};

export const AvatarScene: React.FC<AvatarSceneProps> = ({ color, mode, bpm, isIgnited, unlockedItems, isPlaying, isStandby = false }) => {
  return (
    <Canvas 
        camera={{ position: [0, 0, 3.5], fov: 45 }} 
        gl={{ alpha: true, antialias: true }}
        className="w-full h-full pointer-events-none"
    >
      <SceneContent color={color} mode={mode} bpm={bpm} isIgnited={isIgnited} unlockedItems={unlockedItems} isPlaying={isPlaying} isStandby={isStandby} />
    </Canvas>
  );
};

import React, { useRef, useMemo, ReactNode, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { GraphicSkull } from './GraphicSkull';
import { AppMode } from '../types';

interface AvatarSceneProps {
  color: string;
  mode: AppMode;
  bpm: number;
  isIgnited: boolean;
  equippedItems: string[];
  isPlaying: boolean;
  isStandby?: boolean;
  avatarUrl: string;
  targetMin: number;
  targetMax: number;
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error Boundary to catch 3D Loading Errors (e.g., fetch failed)
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: any): ErrorBoundaryState {
    return { hasError: true };
  }
  
  componentDidCatch(error: any) {
    console.error("Avatar 3D Load Failed:", error);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Fallback Mesh if model fails to load
const FallbackAvatar: React.FC<{ color: string }> = ({ color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 16, 16]} scale={1.5}>
      <meshStandardMaterial 
        color={color} 
        wireframe 
        emissive={color} 
        emissiveIntensity={2}
      />
    </Sphere>
  );
};

const SceneContent: React.FC<{ color: string; mode: AppMode; bpm: number; isIgnited: boolean; equippedItems: string[]; isPlaying: boolean; isStandby: boolean; avatarUrl: string; targetMin: number; targetMax: number }> = ({ color, mode, bpm, isIgnited, equippedItems, isPlaying, isStandby, avatarUrl, targetMin, targetMax }) => {
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
         <ErrorBoundary fallback={<FallbackAvatar color={color} />}>
            <GraphicSkull 
              lightDir={lightDir} 
              bpm={bpm} 
              mode={mode}
              avatarUrl={avatarUrl} 
              isStandby={isStandby} 
              equippedItems={equippedItems} 
              targetMin={targetMin}
              targetMax={targetMax}
            />
         </ErrorBoundary>
      </group>
      
      {/* Light source for shader logic */}
      <directionalLight position={lightPos} intensity={1} />
      {/* Ambient for standard materials (Jaw/Halo) */}
      <ambientLight intensity={0.5} />
    </>
  );
};

export const AvatarScene: React.FC<AvatarSceneProps> = ({ color, mode, bpm, isIgnited, equippedItems, isPlaying, isStandby = false, avatarUrl, targetMin, targetMax }) => {
  return (
    <Canvas 
        camera={{ position: [0, 0, 10], fov: 45 }} 
        gl={{ alpha: true, antialias: true }}
        className="w-full h-full pointer-events-none"
    >
      <SceneContent color={color} mode={mode} bpm={bpm} isIgnited={isIgnited} equippedItems={equippedItems} isPlaying={isPlaying} isStandby={isStandby} avatarUrl={avatarUrl} targetMin={targetMin} targetMax={targetMax} />
    </Canvas>
  );
};
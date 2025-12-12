
import React, { useRef, useMemo, ReactNode } from 'react';
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
  isCelebration?: boolean;
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error Boundary to catch 3D Loading Errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  readonly props!: Readonly<ErrorBoundaryProps>;
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

// Fallback Mesh
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

const SceneContent: React.FC<{ 
    color: string; 
    mode: AppMode; 
    bpm: number; 
    isIgnited: boolean; 
    equippedItems: string[]; 
    isPlaying: boolean; 
    isStandby: boolean; 
    avatarUrl: string; 
    targetMin: number; 
    targetMax: number;
    isCelebration?: boolean;
}> = ({ color, mode, bpm, isIgnited, equippedItems, isPlaying, isStandby, avatarUrl, targetMin, targetMax, isCelebration }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Ref to track current spin velocity for smooth deceleration
  const spinSpeedRef = useRef(0);
  
  const lightPos = useMemo(() => new THREE.Vector3(5, 5, 5), []);
  const lightDir = useMemo(() => lightPos.clone().normalize(), [lightPos]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (!isPlaying && !isStandby) return; 

    const t = state.clock.getElapsedTime();

    // 1. Orientation Logic
    let targetRotY = 0;
    let targetRotX = 0;

    if (isCelebration) {
        // Accelerate spin
        spinSpeedRef.current = THREE.MathUtils.lerp(spinSpeedRef.current, 5.0, 0.1); // Target 5.0 rad/s
        targetRotX = -0.2;
    } else {
        // Decelerate spin
        spinSpeedRef.current = THREE.MathUtils.lerp(spinSpeedRef.current, 0, 0.05);
        
        // Define normal mode targets
        if (isStandby) {
            targetRotY = Math.sin(t * 0.2) * 0.2; 
            targetRotX = Math.cos(t * 0.3) * 0.05; 
        } else if (mode === AppMode.MOTIVATION) {
            targetRotY = -0.5;
            targetRotX = 0.1;
        } else if (mode === AppMode.ZONE) {
            targetRotY = 0;
            targetRotX = 0;
        } else if (mode === AppMode.COOLDOWN) {
            targetRotY = 0;
            targetRotX = 0.3; 
        } else {
            // OVERDRIVE
            targetRotY = 0.5;
            targetRotX = -0.2;
        }
    }

    // --- ROTATION BLENDING LOGIC ---
    // Instead of switching modes, we blend the "Spin Velocity" with the "Alignment Force".
    
    // 1. Apply Spin Velocity
    groupRef.current.rotation.y += spinSpeedRef.current * delta;

    // 2. Calculate Shortest Path to Target
    const current = groupRef.current.rotation.y;
    let diff = (targetRotY - current) % (Math.PI * 2);
    // Normalize diff to -PI to +PI for shortest path
    if (diff !== diff % (Math.PI * 2)) diff = (diff + Math.PI * 2) % (Math.PI * 2); 
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;

    // 3. Apply Alignment Force based on Spin Speed
    // When speed is high, alignment force is near 0.
    // When speed drops, alignment force increases to 1.0 (full control).
    const blendThreshold = 2.0;
    const alignWeight = 1.0 - Math.min(1.0, Math.abs(spinSpeedRef.current) / blendThreshold);
    const smoothWeight = alignWeight * alignWeight; // Quadratic easing for smoother transition

    // Apply corrected rotation. 
    // This is effectively: newRot = current + velocity*dt + (target-current)*factor*blend
    groupRef.current.rotation.y += diff * 0.1 * smoothWeight;

    // X Rotation is always simple lerp
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.1);

    // 2. Gentle Float
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.1;

    // 3. Pulse Scale
    const baseScale = 0.65;
    const targetScale = (isIgnited || isCelebration) ? 0.75 : baseScale;
    const finalScale = isStandby ? 0.6 : targetScale;
    const currentScale = THREE.MathUtils.lerp(groupRef.current.scale.x, finalScale, 0.1);
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
              isCelebration={isCelebration}
            />
         </ErrorBoundary>
      </group>
      <directionalLight position={lightPos} intensity={1} />
      <ambientLight intensity={0.5} />
    </>
  );
};

export const AvatarScene: React.FC<AvatarSceneProps> = (props) => {
  return (
    <Canvas 
        camera={{ position: [0, 0, 10], fov: 45 }} 
        gl={{ alpha: true, antialias: true }}
        className="w-full h-full pointer-events-none"
    >
      <SceneContent {...props} />
    </Canvas>
  );
};

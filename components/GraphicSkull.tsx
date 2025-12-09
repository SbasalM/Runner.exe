import React, { useMemo, useEffect, useRef } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BPM_MIN, BPM_MAX, SKULL_MODEL_URL } from '../constants';
import { AppMode } from '../types';

interface GraphicSkullProps {
  lightDir: THREE.Vector3;
  bpm: number;
  mode: AppMode;
  avatarUrl: string;
  isStandby?: boolean;
  equippedItems: string[];
  targetMin: number;
  targetMax: number;
}

export const GraphicSkull: React.FC<GraphicSkullProps> = ({ lightDir, bpm, mode, avatarUrl, isStandby = false, equippedItems = [], targetMin, targetMax }) => {
  const { scene } = useGLTF(avatarUrl);
  
  // Clone scene to avoid mutating the cached GLTF if it's reused elsewhere
  const clone = useMemo(() => scene.clone(), [scene]);
  
  // Refs for specific parts to animate
  const eyesRef = useRef<THREE.Mesh[]>([]);
  const jawRef = useRef<THREE.Mesh | null>(null);
  const haloRef = useRef<THREE.Mesh | null>(null);
  
  // Flash Animation Ref (0.0 to 1.0) for eyes
  const flashLevel = useRef(0.0);
  
  // State tracking for transitions
  const prevPhaseRef = useRef<number>(0); // 0: Standby/Low, 1: Zone, 2: Overdrive

  // --- MATERIAL DEFINITIONS ---

  // 1. NEON SHADER (For Skull & Jaw) - "Sin City" Look
  const neonMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
        uniforms: {
            uLightDir: { value: new THREE.Vector3(0, 1, 0) },
            uColor: { value: new THREE.Color('#888888') },
            uIntensity: { value: 1.0 }
        },
        vertexShader: `
            varying vec3 vNormalWorld;
            void main() {
                vNormalWorld = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormalWorld;
            uniform vec3 uLightDir;
            uniform vec3 uColor;
            uniform float uIntensity;
            
            void main() {
                float NdotL = dot(normalize(vNormalWorld), normalize(uLightDir));
                float lightIntensity = step(0.5, NdotL);
                vec3 finalColor = uColor * lightIntensity * uIntensity;
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    });
  }, []);

  // 2. EYE MATERIAL (Unlit, Dynamic Color)
  const eyeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#000000'), // Start pure black
    toneMapped: false,
    side: THREE.DoubleSide
  }), []);

  // 3. NOSE MATERIAL (Blackout)
  const noseMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#000000'),
    side: THREE.DoubleSide
  }), []);

  // 4. HALO MATERIAL (Holographic/Glowing)
  const haloMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#00FFFF'), // Cyan Base
    emissive: new THREE.Color('#00FFFF'),
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.8,
    metalness: 0.5,
    roughness: 0.1
  }), []);

  // Update light direction uniform
  useEffect(() => {
    if (lightDir) {
        neonMaterial.uniforms.uLightDir.value.copy(lightDir);
    }
  }, [lightDir, neonMaterial]);

  // --- TRAVERSAL & SETUP ---
  useEffect(() => {
    eyesRef.current = [];
    jawRef.current = null;
    haloRef.current = null;

    console.log("--- TRAVERSING MODEL ---");
    
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();
        
        // NOSE -> Blackout
        if (name.includes("nose")) {
            mesh.material = noseMaterial;
        }
        // JAW -> Neon Shader (Match Skull)
        else if (name.includes("jaw")) {
            mesh.material = neonMaterial;
            jawRef.current = mesh;
        }
        // NEURAL HALO -> Glowing
        else if (name.includes("neural") || name.includes("halo")) {
            mesh.material = haloMaterial;
            haloRef.current = mesh;
        }
        // EYES -> Dynamic Color
        else if (name.includes("eye")) {
            mesh.material = eyeMaterial;
            eyesRef.current.push(mesh);
        }
        // DEFAULT SKULL -> Neon Shader
        else {
            mesh.material = neonMaterial;
        }
      }
    });
  }, [clone, neonMaterial, eyeMaterial, noseMaterial, haloMaterial]);

  // Pre-define Colors
  const colorGray = useMemo(() => new THREE.Color('#888888'), []);
  const colorOrange = useMemo(() => new THREE.Color('#FF4500'), []);
  const colorCyan = useMemo(() => new THREE.Color('#00FFFF'), []);
  const colorPurple = useMemo(() => new THREE.Color('#FF00FF'), []);
  const colorBlack = useMemo(() => new THREE.Color('#000000'), []);
  const colorWhite = useMemo(() => new THREE.Color('#FFFFFF'), []);
  const colorRed = useMemo(() => new THREE.Color('#FF0000'), []);
  
  const targetColor = useMemo(() => new THREE.Color(), []);

  // --- ANIMATION LOOP ---
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    
    // 1. VISIBILITY MANAGEMENT (Based on Equipped)
    if (jawRef.current) {
        jawRef.current.visible = equippedItems.includes('jaw');
    }
    if (haloRef.current) {
        haloRef.current.visible = equippedItems.includes('neural_halo');
    }

    // 2. FLASH DECAY
    flashLevel.current = THREE.MathUtils.damp(flashLevel.current, 0, 8, delta);

    // 3. COLOR & INTENSITY LOGIC (Skull & Jaw)
    let targetIntensity = 1.0;
    
    // Determine Current Phase for Transitions
    // 0: Standby/Low (< Target Min)
    // 1: Zone (Min - Max)
    // 2: Overdrive (> Max)
    let currentPhase = 0;

    if (isStandby) {
        currentPhase = 0;
        targetColor.copy(colorGray);
        targetIntensity = 0.5;
    } else {
        if (bpm < targetMin) {
            // Motivation Phase
            currentPhase = 0;
            const range = targetMin - BPM_MIN;
            const progress = range > 0 ? Math.max(0, Math.min(1, (bpm - BPM_MIN) / range)) : 1;
            targetColor.lerpColors(colorGray, colorOrange, progress);
            targetIntensity = 1.0;
        } else if (bpm <= targetMax) {
            // Target Zone
            currentPhase = 1;
            targetColor.copy(colorCyan);
            const range = targetMax - targetMin;
            const progress = range > 0 ? Math.max(0, Math.min(1, (bpm - targetMin) / range)) : 1;
            targetIntensity = THREE.MathUtils.lerp(1.0, 2.0, progress);
        } else {
            // Overdrive
            currentPhase = 2;
            targetColor.copy(colorPurple);
            const range = BPM_MAX - targetMax;
            const progress = range > 0 ? Math.max(0, Math.min(1, (bpm - targetMax) / range)) : 1;
            targetIntensity = THREE.MathUtils.lerp(2.0, 5.0, progress);
        }
    }

    // Apply to Skull (Neon Shader)
    // Skull transitions smoothly, NO FLASH
    const smoothFactor = Math.min(1.0, delta * 2.0);
    neonMaterial.uniforms.uColor.value.lerp(targetColor, smoothFactor);
    neonMaterial.uniforms.uIntensity.value = THREE.MathUtils.lerp(neonMaterial.uniforms.uIntensity.value, targetIntensity, smoothFactor);

    // 4. JAW ANIMATION 
    if (jawRef.current && equippedItems.includes('jaw')) {
        let targetRot = 0;
        // Only open slightly on Cooldown
        if (mode === AppMode.COOLDOWN) {
            targetRot = 0.25; 
        }
        jawRef.current.rotation.x = THREE.MathUtils.lerp(jawRef.current.rotation.x, targetRot, 0.1);
    }

    // 5. HALO ANIMATION (Pulse Only, No Rotation)
    if (haloRef.current && equippedItems.includes('neural_halo')) {
        const pulse = 1.5 + Math.sin(t * 3.0) * 0.5;
        haloMaterial.emissiveIntensity = pulse;
        // Ensure no accidental rotation is accumulated
        haloRef.current.rotation.set(Math.PI / 2, 0, 0); 
    }

    // 6. EYE LOGIC (Black -> Red -> White)
    
    // TRANSITION DETECTION FOR FLASH
    // Trigger Flash on:
    // a) Ignition (Phase 0 -> 1)
    // b) Overdrive (Phase 1 -> 2)
    if (!isStandby) {
        if (prevPhaseRef.current < 1 && currentPhase >= 1) {
            // Ignition Flash
            flashLevel.current = 1.0;
        } else if (prevPhaseRef.current < 2 && currentPhase >= 2) {
            // Overdrive Flash
            flashLevel.current = 1.0;
        }
    }
    prevPhaseRef.current = currentPhase;

    let currentEyeColor = colorBlack.clone();

    if (isStandby) {
        // Initial / Standby: Always Black
        currentEyeColor.copy(colorBlack);
    } else if (bpm < targetMin) {
        // Phase 1: Black
        currentEyeColor.copy(colorBlack);
    } else if (bpm <= targetMax) {
        // Phase 2: Red
        // BOOSTED SCALAR to 10.0 to ensure emission is visible against dark skull
        currentEyeColor.copy(colorRed).multiplyScalar(10.0);
    } else {
        // Phase 3: White
        currentEyeColor.copy(colorWhite);
        // Slight flicker for intensity
        const flicker = 0.9 + Math.random() * 0.1;
        currentEyeColor.multiplyScalar(flicker);
    }

    // Apply Flash (Ignition/Transition Burst)
    if (flashLevel.current > 0.01) {
        currentEyeColor.lerp(colorWhite, flashLevel.current);
        const flashBoost = 1.0 + (flashLevel.current * 10.0);
        currentEyeColor.multiplyScalar(flashBoost);
    }

    eyeMaterial.color.copy(currentEyeColor);
  });

  return (
    <group scale={2.0}>
        <Center>
            <primitive object={clone} />
        </Center>
    </group>
  );
};

// Preload the v2 model
useGLTF.preload(SKULL_MODEL_URL);


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
  
  // Refs for specific parts to animate (Array based for multi-mesh support)
  const eyesRefs = useRef<THREE.Mesh[]>([]);
  // Use generic arrays to capture ALL parts of a feature (e.g. if Jaw is split into 2 meshes)
  const jawVRefs = useRef<THREE.Mesh[]>([]);    // Unlockable Jaw V (Ventilation)
  const halosRefs = useRef<THREE.Mesh[]>([]);   // Inner/Outer halos
  
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

  // 3. NOSE/BLOCKER MATERIAL (Pure Black Void)
  const noseMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x000000),
    side: THREE.DoubleSide,
    toneMapped: false,
    depthWrite: true // Important: must write to depth buffer to occlude objects behind it
  }), []);

  // 4. HALO MATERIAL (Unlit MeshBasic for pure Neon)
  const haloMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#00FFFF'), // Cyan Base
    side: THREE.DoubleSide,
    toneMapped: false, // Critical for "Glow" look
    transparent: true,
    opacity: 0.9,
  }), []);

  // Update light direction uniform
  useEffect(() => {
    if (lightDir) {
        neonMaterial.uniforms.uLightDir.value.copy(lightDir);
    }
  }, [lightDir, neonMaterial]);

  // --- TRAVERSAL & SETUP ---
  useEffect(() => {
    eyesRefs.current = [];
    jawVRefs.current = [];
    halosRefs.current = [];

    console.log("--- TRAVERSING MODEL v5 ---");
    
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        // Smart Identification: Check ancestry for group names
        // This ensures parts named "Mesh_01" inside a "Jaw_V" group are correctly identified
        let type = 'DEFAULT';
        let subType = 'outer'; // Default halo subtype
        let curr: THREE.Object3D | null = mesh;
        
        // Traverse up the tree to find meaningful group names
        while (curr && curr !== scene) {
            const n = curr.name.toLowerCase();
            
            // 1. Unlockable Jaw (Jaw_V)
            // Priority: Check this before generic identifiers
            if (n.includes("jaw_v") || n.includes("ventilator")) {
                type = 'JAW_V';
                break;
            }

            // 2. Halos
            if (n.includes("halo")) {
                type = 'HALO';
                if (n.includes("inner")) {
                    subType = 'inner';
                } else {
                    subType = 'outer'; // Default to outer
                }
                break;
            }
            
            // 3. Nose / Blocker (Blackout Mesh)
            if (n.includes("nose") || n.includes("socket") || n.includes("block") || n.includes("void") || n.includes("occlude")) {
                type = 'NOSE';
                break;
            }

            // 4. Eyes
            if (n.includes("eye")) {
                type = 'EYE';
                break;
            }
            
            curr = curr.parent;
        }

        // Apply Logic based on Identified Type
        switch (type) {
            case 'JAW_V':
                mesh.material = neonMaterial;
                mesh.visible = false; // Start hidden, controlled by useFrame logic
                jawVRefs.current.push(mesh);
                break;

            case 'HALO':
                mesh.material = haloMaterial;
                mesh.rotation.set(0, 0, 0); // Reset base rotation
                mesh.userData.haloType = subType; // Store type for animation loop
                halosRefs.current.push(mesh);
                break;
            
            case 'EYE':
                mesh.material = eyeMaterial;
                eyesRefs.current.push(mesh);
                break;
            
            case 'NOSE':
                mesh.material = noseMaterial;
                break;

            default:
                // Default Skull parts (Cranium, etc.)
                mesh.material = neonMaterial;
                break;
        }
      }
    });
  }, [clone, neonMaterial, eyeMaterial, noseMaterial, haloMaterial, scene]);

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
    
    // 1. VISIBILITY & EQUIPMENT LOGIC
    const isJawEquipped = equippedItems.includes('jaw'); // Matches ID 'jaw' in useProgression
    const isHaloEquipped = equippedItems.includes('neural_halo');

    // FORCE VISIBILITY UPDATE EVERY FRAME
    // Ensure "Jaw_V" is ONLY visible when equipped.
    jawVRefs.current.forEach(mesh => {
        mesh.visible = isJawEquipped;
    });
    
    // Manage Halos Visibility
    halosRefs.current.forEach(mesh => {
        mesh.visible = isHaloEquipped;
    });

    // 2. FLASH DECAY
    flashLevel.current = THREE.MathUtils.damp(flashLevel.current, 0, 8, delta);

    // 3. COLOR & INTENSITY LOGIC (Skull & Jaw)
    let targetIntensity = 1.0;
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
    const smoothFactor = Math.min(1.0, delta * 2.0);
    neonMaterial.uniforms.uColor.value.lerp(targetColor, smoothFactor);
    neonMaterial.uniforms.uIntensity.value = THREE.MathUtils.lerp(neonMaterial.uniforms.uIntensity.value, targetIntensity, smoothFactor);

    // 4. JAW ANIMATION
    let targetRot = 0;
    // Only open slightly on Cooldown
    if (mode === AppMode.COOLDOWN) {
        targetRot = 0.25; 
    }

    // Animate V Jaws
    jawVRefs.current.forEach(mesh => {
        if (mesh.visible) {
             mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRot, 0.1);
        }
    });

    // 5. HALO ANIMATION (Flat Spin)
    if (halosRefs.current.length > 0 && isHaloEquipped) {
        
        let rotSpeed = 0.5; // Base
        if (isStandby || currentPhase === 0) rotSpeed = 0.2; // Idle
        else if (currentPhase === 1) rotSpeed = 1.0; // Zone
        else if (currentPhase === 2) rotSpeed = 4.0; // Overdrive

        halosRefs.current.forEach((halo) => {
            const hType = halo.userData.haloType;
            
            // Lock X and Y to 0 each frame to prevent drift/wobble from accumulated math errors
            halo.rotation.x = 0;
            halo.rotation.y = 0;

            // Inner -> Clockwise (+)
            if (hType === 'inner') {
                halo.rotation.z += delta * rotSpeed;
            }
            // Outer -> Counter-Clockwise (-)
            else {
                halo.rotation.z -= delta * rotSpeed * 0.8;
            }
        });

        // Pulse Emission Color
        const pulse = 0.5 + Math.sin(t * (rotSpeed * 2.0)) * 0.5;
        haloMaterial.color.copy(targetColor).lerp(colorWhite, pulse * 0.5); 
    }

    // 6. EYE LOGIC (Black -> Red -> White)
    if (!isStandby) {
        if (prevPhaseRef.current < 1 && currentPhase >= 1) {
            flashLevel.current = 1.0;
        } else if (prevPhaseRef.current < 2 && currentPhase >= 2) {
            flashLevel.current = 1.0;
        }
    }
    prevPhaseRef.current = currentPhase;

    let currentEyeColor = colorBlack.clone();

    if (isStandby) {
        currentEyeColor.copy(colorBlack);
    } else if (bpm < targetMin) {
        currentEyeColor.copy(colorBlack);
    } else if (bpm <= targetMax) {
        currentEyeColor.copy(colorRed).multiplyScalar(10.0);
    } else {
        currentEyeColor.copy(colorWhite);
        const flicker = 0.9 + Math.random() * 0.1;
        currentEyeColor.multiplyScalar(flicker);
    }

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

// Preload the v5 model
useGLTF.preload(SKULL_MODEL_URL);
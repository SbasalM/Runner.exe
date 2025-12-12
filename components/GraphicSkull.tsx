
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
  isCelebration?: boolean;
  showVisor?: boolean;
}

export const GraphicSkull: React.FC<GraphicSkullProps> = ({ 
  lightDir, 
  bpm, 
  mode, 
  avatarUrl, 
  isStandby = false, 
  equippedItems = [], 
  targetMin, 
  targetMax,
  isCelebration = false,
  showVisor = false
}) => {
  const { scene } = useGLTF(avatarUrl);
  
  // Clone scene to avoid mutating the cached GLTF if it's reused elsewhere
  const clone = useMemo(() => scene.clone(), [scene]);
  
  // Refs for specific parts to animate
  const eyesRefs = useRef<THREE.Mesh[]>([]);
  const jawVRefs = useRef<THREE.Mesh[]>([]);    
  const halosRefs = useRef<THREE.Mesh[]>([]);   
  const visorFrameRefs = useRef<THREE.Mesh[]>([]);
  const visorLensRefs = useRef<THREE.Mesh[]>([]);
  
  const flashLevel = useRef(0.0);
  const prevPhaseRef = useRef<number>(0); 

  // --- MATERIAL DEFINITIONS ---
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

  const eyeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#000000'), 
    toneMapped: false,
    side: THREE.DoubleSide
  }), []);

  const noseMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x000000),
    side: THREE.DoubleSide,
    toneMapped: false,
    depthWrite: true 
  }), []);

  const haloMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#00FFFF'),
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
    opacity: 0.9,
  }), []);

  // --- VISOR MATERIALS ---
  // Phase 1: Cold Hardware (Sin City style)
  const hardwareMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x888888),
    roughness: 0.2,
    metalness: 0.9,
    toneMapped: false
  }), []);

  // Phase 2: Angry Red
  const redLensMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xFF0000),
    toneMapped: false,
    side: THREE.DoubleSide
  }), []);

  // Phase 3: Overheat White
  const whiteLensMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xFFFFFF),
    toneMapped: false,
    side: THREE.DoubleSide
  }), []);

  // Phase 4: Rainbow Celebration
  const rainbowLensMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xFFFFFF),
    toneMapped: false,
    side: THREE.DoubleSide
  }), []);

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
    visorFrameRefs.current = [];
    visorLensRefs.current = [];

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        let type = 'DEFAULT';
        let subType = 'outer';
        let curr: THREE.Object3D | null = mesh;
        
        while (curr && curr !== scene) {
            const n = curr.name.toLowerCase();
            // Order matters for matching
            if (n.includes("visor_frame")) {
                type = 'VISOR_FRAME';
                break;
            }
            if (n.includes("visor_lens")) {
                type = 'VISOR_LENS';
                break;
            }
            if (n.includes("jaw_v") || n.includes("ventilator")) {
                type = 'JAW_V';
                break;
            }
            if (n.includes("halo")) {
                type = 'HALO';
                if (n.includes("inner")) {
                    subType = 'inner';
                } else {
                    subType = 'outer';
                }
                break;
            }
            if (n.includes("nose") || n.includes("socket") || n.includes("block") || n.includes("void") || n.includes("occlude")) {
                type = 'NOSE';
                break;
            }
            if (n.includes("eye")) {
                type = 'EYE';
                break;
            }
            curr = curr.parent;
        }

        switch (type) {
            case 'VISOR_FRAME':
                mesh.material = neonMaterial;
                mesh.visible = false;
                visorFrameRefs.current.push(mesh);
                break;
            case 'VISOR_LENS':
                // Initial material, will be overridden by loop
                mesh.material = hardwareMaterial;
                mesh.visible = false;
                visorLensRefs.current.push(mesh);
                break;
            case 'JAW_V':
                mesh.material = neonMaterial;
                mesh.visible = false; 
                jawVRefs.current.push(mesh);
                break;
            case 'HALO':
                mesh.material = haloMaterial;
                mesh.rotation.set(0, 0, 0);
                mesh.userData.haloType = subType; 
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
                mesh.material = neonMaterial;
                break;
        }
      }
    });
  }, [clone, neonMaterial, eyeMaterial, noseMaterial, haloMaterial, hardwareMaterial, scene]);

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
    
    // 1. VISIBILITY & EQUIPMENT
    const isJawEquipped = equippedItems.includes('jaw');
    const isHaloEquipped = equippedItems.includes('neural_halo');

    jawVRefs.current.forEach(mesh => {
        mesh.visible = isJawEquipped;
    });
    halosRefs.current.forEach(mesh => {
        mesh.visible = isHaloEquipped;
    });
    visorFrameRefs.current.forEach(mesh => {
        mesh.visible = showVisor;
    });
    // Visor Lens visibility handled below with material update

    // 2. FLASH DECAY
    flashLevel.current = THREE.MathUtils.damp(flashLevel.current, 0, 8, delta);

    // 3. COLOR & INTENSITY LOGIC
    let targetIntensity = 1.0;
    let currentPhase = 0;

    if (isCelebration) {
        // CELEBRATION MODE: Rainbow Cycle
        const hue = (t * 2) % 1; // 2x speed cycle
        targetColor.setHSL(hue, 1.0, 0.5);
        targetIntensity = 3.0;
        currentPhase = 3; // Custom phase
    } else if (isStandby) {
        currentPhase = 0;
        targetColor.copy(colorGray);
        targetIntensity = 0.5;
    } else {
        // PRIORITY: Check explicit MODE first (For Gym/Overdrive overrides), then fall back to BPM thresholds
        
        if (mode === AppMode.ZONE) {
             // Force Zone Color (Cyan) for Gym Active Mode regardless of BPM
             currentPhase = 1;
             targetColor.copy(colorCyan);
             targetIntensity = 2.0;
        } else if (mode === AppMode.OVERDRIVE) {
             // Force Overdrive (Purple)
             currentPhase = 2;
             targetColor.copy(colorPurple);
             targetIntensity = 4.0;
        } else if (mode === AppMode.MOTIVATION) {
             // Force Motivation (Amber/Orange) - Gym Rest
             currentPhase = 0;
             targetColor.copy(colorOrange);
             targetIntensity = 1.0;
        } else if (bpm < targetMin) {
            // Standard Run Logic: Low BPM
            currentPhase = 0;
            const range = targetMin - BPM_MIN;
            const progress = range > 0 ? Math.max(0, Math.min(1, (bpm - BPM_MIN) / range)) : 1;
            targetColor.lerpColors(colorGray, colorOrange, progress);
            targetIntensity = 1.0;
        } else if (bpm <= targetMax) {
            // Standard Run Logic: Zone
            currentPhase = 1;
            targetColor.copy(colorCyan);
            const range = targetMax - targetMin;
            const progress = range > 0 ? Math.max(0, Math.min(1, (bpm - targetMin) / range)) : 1;
            targetIntensity = THREE.MathUtils.lerp(1.0, 2.0, progress);
        } else {
            // Standard Run Logic: Overdrive
            currentPhase = 2;
            targetColor.copy(colorPurple);
            const range = BPM_MAX - targetMax;
            const progress = range > 0 ? Math.max(0, Math.min(1, (bpm - targetMax) / range)) : 1;
            targetIntensity = THREE.MathUtils.lerp(2.0, 5.0, progress);
        }
    }

    // Apply to Skull
    const smoothFactor = Math.min(1.0, delta * 2.0);
    neonMaterial.uniforms.uColor.value.lerp(targetColor, smoothFactor);
    neonMaterial.uniforms.uIntensity.value = THREE.MathUtils.lerp(neonMaterial.uniforms.uIntensity.value, targetIntensity, smoothFactor);

    // 4. JAW ANIMATION
    let targetRot = 0;
    if (mode === AppMode.COOLDOWN) {
        targetRot = 0.25; 
    }
    jawVRefs.current.forEach(mesh => {
        if (mesh.visible) {
             mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRot, 0.1);
        }
    });

    // 5. VISOR LENS MATERIAL LOGIC (PHASE REACTIVE)
    // Phase 1 (Low): Hardware (Sin City)
    // Phase 2 (Zone): Red
    // Phase 3 (Overdrive): White
    // Phase 4 (Celebration): Rainbow
    let activeLensMat = hardwareMaterial;

    if (isCelebration) {
         // Apply Rainbow Color to Material
         rainbowLensMaterial.color.copy(targetColor);
         activeLensMat = rainbowLensMaterial;
    } else if (isStandby || currentPhase === 0) {
         activeLensMat = hardwareMaterial;
    } else if (currentPhase === 1) {
         activeLensMat = redLensMaterial;
    } else {
         activeLensMat = whiteLensMaterial;
    }

    visorLensRefs.current.forEach(mesh => {
        mesh.visible = showVisor;
        if (mesh.material.uuid !== activeLensMat.uuid) {
            mesh.material = activeLensMat;
        }
    });

    // 6. HALO ANIMATION
    if (halosRefs.current.length > 0 && isHaloEquipped) {
        let rotSpeed = 0.5;
        if (isCelebration) rotSpeed = 3.0; // Fast Spin
        else if (isStandby || currentPhase === 0) rotSpeed = 0.2;
        else if (currentPhase === 1) rotSpeed = 1.0;
        else if (currentPhase === 2) rotSpeed = 4.0;

        halosRefs.current.forEach((halo) => {
            const hType = halo.userData.haloType;
            halo.rotation.x = 0;
            halo.rotation.y = 0;
            if (hType === 'inner') {
                halo.rotation.z += delta * rotSpeed;
            } else {
                halo.rotation.z -= delta * rotSpeed * 0.8;
            }
        });

        const pulse = 0.5 + Math.sin(t * (rotSpeed * 2.0)) * 0.5;
        haloMaterial.color.copy(targetColor).lerp(colorWhite, pulse * 0.5); 
    }

    // 7. EYE LOGIC
    if (!isStandby && !isCelebration) {
        if (prevPhaseRef.current < 1 && currentPhase >= 1) flashLevel.current = 1.0;
        else if (prevPhaseRef.current < 2 && currentPhase >= 2) flashLevel.current = 1.0;
    }
    prevPhaseRef.current = currentPhase;

    let currentEyeColor = colorBlack.clone();

    if (isCelebration) {
        currentEyeColor.copy(targetColor).multiplyScalar(5.0); // Bright rainbow eyes
    } else if (isStandby) {
        currentEyeColor.copy(colorBlack);
    } else {
        // REVISED EYE LOGIC: Trust the phases derived above
        if (currentPhase === 0) {
            // Low Phase: Eyes Dark
            currentEyeColor.copy(colorBlack);
        } else if (currentPhase === 1) {
            // Zone Phase: Eyes White/Tinted
            currentEyeColor.copy(colorWhite);
            const flicker = 0.9 + Math.random() * 0.1;
            currentEyeColor.multiplyScalar(flicker);
        } else {
            // High Phase: Red/Intense
             currentEyeColor.copy(colorRed).multiplyScalar(10.0);
        }
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

useGLTF.preload(SKULL_MODEL_URL);

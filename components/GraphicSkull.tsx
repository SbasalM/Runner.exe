
import React, { useMemo, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material';

const MODEL_URL = "https://raw.githubusercontent.com/SbasalM/heart-sync-assets/main/GEMINI%20HACKATHON.glb";

interface GraphicSkullProps {
  lightDir: THREE.Vector3;
}

export const GraphicSkull: React.FC<GraphicSkullProps> = ({ lightDir }) => {
  const { scene } = useGLTF(MODEL_URL);
  
  // Clone scene to allow multiple instances or just safety
  const clone = useMemo(() => scene.clone(), [scene]);
  
  const [meshes, setMeshes] = useState<THREE.Mesh[]>([]);

  // Find meshes on load
  useEffect(() => {
    const found: THREE.Mesh[] = [];
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        found.push(child as THREE.Mesh);
      }
    });
    setMeshes(found);
  }, [clone]);

  // Uniforms for the shader
  const uniforms = useMemo(() => ({
    uLightDir: { value: new THREE.Vector3(0, 1, 0) }
  }), []);

  // Update uniform when lightDir prop changes
  useEffect(() => {
    if (lightDir) {
        uniforms.uLightDir.value.copy(lightDir);
    }
  }, [lightDir, uniforms]);

  return (
    <group dispose={null} scale={2.0}>
      {meshes.map((mesh, i) => (
         <mesh 
            key={i} 
            geometry={mesh.geometry} 
            position={mesh.position}
            rotation={mesh.rotation}
            scale={mesh.scale}
         >
            {/* Custom Shader Material using three-custom-shader-material */}
            <CustomShaderMaterial
               baseMaterial={THREE.MeshBasicMaterial}
               vertexShader={`
                 varying vec3 vNormalWorld;
                 void main() {
                   // Calculate world space normal for consistent lighting regardless of camera
                   vNormalWorld = normalize(mat3(modelMatrix) * normal);
                 }
               `}
               fragmentShader={`
                 varying vec3 vNormalWorld;
                 uniform vec3 uLightDir;
                 
                 void main() {
                   // Calculate Dot Product between World Normal and Light Direction
                   float NdotL = dot(normalize(vNormalWorld), normalize(uLightDir));
                   
                   // Step function for hard binary shadow (Sin City look)
                   // 0.0 threshold allows surfaces facing the light (90 deg) to be white
                   float lightIntensity = step(0.0, NdotL);
                   
                   // Output Black or White
                   csm_DiffuseColor = vec4(vec3(lightIntensity), 1.0);
                 }
               `}
               uniforms={uniforms}
            />
         </mesh>
      ))}
    </group>
  );
};

useGLTF.preload(MODEL_URL);

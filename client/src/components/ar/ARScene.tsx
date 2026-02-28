import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ModelObject } from './ModelObject';
import type { ARScene as ARSceneType } from '@shared/types';

interface ARSceneProps {
  scene: ARSceneType;
}

export function ARScene({ scene }: ARSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, _delta) => {
    // Animation loop - can be used for scene-level animations
  });

  return (
    <group ref={groupRef}>
      {/* Ground grid for non-AR mode */}
      <gridHelper args={[10, 10, '#334155', '#1e293b']} />

      {/* Render all models in the scene */}
      {scene.models.map((model) => (
        <ModelObject key={model.id} model={model} />
      ))}

      {/* Default demo object if no models */}
      {scene.models.length === 0 && <DemoObject />}
    </group>
  );
}

function DemoObject() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 1, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#6366f1"
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

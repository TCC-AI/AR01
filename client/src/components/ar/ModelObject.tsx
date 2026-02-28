import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useARStore } from '../../stores/arStore';
import type { ARModel } from '@shared/types';

interface ModelObjectProps {
  model: ARModel;
}

export function ModelObject({ model }: ModelObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { selectedModelId, selectModel } = useARStore();
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedModelId === model.id;

  useFrame((_state, delta) => {
    if (meshRef.current && isSelected) {
      // Subtle bounce animation for selected model
      meshRef.current.position.y =
        model.position.y + Math.sin(Date.now() * 0.003) * 0.05;
    }

    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  // For now, render a placeholder geometry based on model format
  // In production, this would use useGLTF/useLoader to load actual 3D models
  return (
    <mesh
      ref={meshRef}
      position={[model.position.x, model.position.y, model.position.z]}
      rotation={[model.rotation.x, model.rotation.y, model.rotation.z]}
      scale={[model.scale.x, model.scale.y, model.scale.z]}
      onClick={() => selectModel(isSelected ? null : model.id)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={isSelected ? '#818cf8' : hovered ? '#a5b4fc' : '#6366f1'}
        metalness={0.4}
        roughness={0.3}
        emissive={isSelected ? '#4f46e5' : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
      {/* Selection outline */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry
            args={[new THREE.BoxGeometry(1.05, 1.05, 1.05)]}
          />
          <lineBasicMaterial color="#c7d2fe" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
}

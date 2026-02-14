'use client';

import { useRef } from 'react';
import * as THREE from 'three';

interface PanelProps {
  w: number;
  h: number;
  d: number;
  position: [number, number, number];
  material: THREE.Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function Panel({
  w,
  h,
  d,
  position,
  material,
  castShadow = true,
  receiveShadow = true,
}: PanelProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <boxGeometry args={[w, h, d]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

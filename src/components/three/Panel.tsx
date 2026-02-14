'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { MaterialSet } from '@/lib/three/materials';
import { createFaceMaterials, DEFAULT_TEXTURE_ROTATION } from '@/lib/three/materials';
import type { MaterialType } from '@/types/shelf';

interface PanelProps {
  w: number;
  h: number;
  d: number;
  position: [number, number, number];
  matType: MaterialType;
  materials: MaterialSet;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function Panel({
  w,
  h,
  d,
  position,
  matType,
  materials,
  castShadow = true,
  receiveShadow = true,
}: PanelProps) {
  const isVertical = matType === 'verticalBase' || matType === 'verticalEdge';

  const faceMaterials = useMemo(() => {
    if (matType === 'backPanel') {
      return materials.backPanel;
    }

    const baseMat = isVertical ? materials.verticalBase : materials.horizontalBase;
    const edgeMat = isVertical ? materials.verticalEdge : materials.horizontalEdge;

    return createFaceMaterials(baseMat, edgeMat, isVertical, DEFAULT_TEXTURE_ROTATION);
  }, [matType, materials, isVertical]);

  return (
    <mesh
      position={position}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={faceMaterials}
    >
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}

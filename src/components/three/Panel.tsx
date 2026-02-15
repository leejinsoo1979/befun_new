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
  const isVertical = matType === 'verticalBase' || matType === 'verticalEdge' || matType === 'supportPanel';

  const faceMaterials = useMemo(() => {
    if (matType === 'backPanel') {
      return materials.backPanel;
    }

    if (matType === 'supportPanel') {
      // V1: addBox(..., materials.verticalEdge, materials.verticalBase, true)
      // 보강대: 넓은 면(left/right)에 verticalEdge, 얇은 면(front/back/top/bottom)에 verticalBase
      return createFaceMaterials(materials.verticalEdge, materials.verticalBase, true, DEFAULT_TEXTURE_ROTATION);
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

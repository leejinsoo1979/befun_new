'use client';

import { useEffect, useMemo } from 'react';
import { useBoredBoxGeometry } from '@/lib/three/blum/useBoredBox';
import type { Bore } from '@/lib/three/blum/boring';
import type { MaterialSet } from '@/lib/three/materials';
import { createFaceMaterials, DEFAULT_TEXTURE_ROTATION } from '@/lib/three/materials';
import type { MaterialType } from '@/types/shelf';

import { panelEdgeRadius } from '@/lib/three/panel-edge';

const NO_HOLES: readonly Bore[] = [];

interface PanelProps {
  holes?: readonly Bore[];
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
  holes,
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

  useEffect(() => () => {
    if (!Array.isArray(faceMaterials)) return;
    const shared = new Set(Object.values(materials));
    for (const material of new Set(faceMaterials)) {
      if (shared.has(material)) continue;
      material.map?.dispose();
      material.dispose();
    }
  }, [faceMaterials, materials]);
  const geometry = useBoredBoxGeometry(w,h,d,holes ?? NO_HOLES, undefined, 220, panelEdgeRadius(materials));

  return (
    <mesh
      position={position}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={faceMaterials}
      geometry={geometry}
    >

    </mesh>
  );
}

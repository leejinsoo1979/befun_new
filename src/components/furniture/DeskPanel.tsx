'use client';

import { useEffect, useMemo } from 'react';
import type { Bore } from '@/lib/three/blum/boring';
import { createFaceMaterials, DEFAULT_TEXTURE_ROTATION, type MaterialSet } from '@/lib/three/materials';
import { createDeskPanelGeometry } from '@/lib/furniture/desk-cable-geometry';
import type { DeskCableOpening } from '@/lib/furniture/desk';
import type { PanelData } from '@/types/shelf';

interface DeskPanelProps {
  panel: PanelData;
  bores: readonly Bore[];
  openings: readonly DeskCableOpening[];
  materials: MaterialSet;
}

/** Existing hinge pockets and cable through-holes share one physical mesh. */
export function DeskPanel({ panel, bores, openings, materials }: DeskPanelProps) {
  const faceMaterials = useMemo(() => {
    if (panel.matType === 'backPanel') return materials.backPanel;
    const vertical = ['verticalBase', 'verticalEdge', 'supportPanel'].includes(panel.matType);
    const support = panel.matType === 'supportPanel';
    return createFaceMaterials(
      support ? materials.verticalEdge : vertical ? materials.verticalBase : materials.horizontalBase,
      support ? materials.verticalBase : vertical ? materials.verticalEdge : materials.horizontalEdge,
      vertical, DEFAULT_TEXTURE_ROTATION,
    );
  }, [panel.matType, materials]);
  useEffect(() => () => {
    if (!Array.isArray(faceMaterials)) return;
    const shared = new Set(Object.values(materials));
    for (const material of new Set(faceMaterials)) {
      if (shared.has(material)) continue;
      // createFaceMaterials owns only its cloned base material and cloned map.
      material.map?.dispose();
      material.dispose();
    }
  }, [faceMaterials, materials]);
  const geometry = useMemo(() => createDeskPanelGeometry(panel, bores, openings), [panel, bores, openings]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={[panel.x, panel.y, panel.z]} geometry={geometry} material={faceMaterials}
    castShadow={panel.castShadow ?? true} receiveShadow={panel.receiveShadow ?? true}
    userData={{ cableOpeningCount: openings.length, hingeBoreCount: bores.length }} />;
}

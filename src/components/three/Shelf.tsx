'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { calculateGridPanels } from '@/lib/three/styles/grid';
import type { MaterialType } from '@/types/shelf';

// 기본 Solid 색상 재질 생성 (Phase 2에서 colorSelect.js 재질 시스템 이식)
function createDefaultMaterials(): Record<MaterialType, THREE.Material> {
  const baseColor = new THREE.Color('#2c3e6b'); // Midnight Blue

  return {
    verticalBase: new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.5,
      metalness: 0.0,
    }),
    verticalEdge: new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.5,
      metalness: 0.0,
    }),
    horizontalBase: new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.5,
      metalness: 0.0,
    }),
    horizontalEdge: new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.5,
      metalness: 0.0,
    }),
    backPanel: new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f0f0f0'),
      roughness: 0.7,
      metalness: 0.0,
    }),
  };
}

export function Shelf() {
  const width = useShelfStore((s) => s.width);
  const height = useShelfStore((s) => s.height);
  const depth = useShelfStore((s) => s.depth);
  const thickness = useShelfStore((s) => s.thickness);
  const style = useShelfStore((s) => s.style);
  const density = useShelfStore((s) => s.density);
  const rowHeights = useShelfStore((s) => s.rowHeights);
  const numRows = useShelfStore((s) => s.numRows);
  const hasBackPanel = useShelfStore((s) => s.hasBackPanel);
  const currentColor = useMaterialStore((s) => s.currentColor);

  const materials = useMemo(() => createDefaultMaterials(), [currentColor]);

  const panels = useMemo(() => {
    // 현재는 Grid만 구현, 나머지 스타일은 Phase 2에서 추가
    const result = calculateGridPanels({
      width,
      height,
      depth,
      thickness,
      density,
      rowHeights,
      numRows,
      hasBackPanel,
    });
    return result.panels;
  }, [width, height, depth, thickness, style, density, rowHeights, numRows, hasBackPanel]);

  return (
    <group>
      {panels.map((p, i) => (
        <mesh
          key={`panel-${i}`}
          position={[p.x, p.y, p.z]}
          castShadow={p.castShadow}
          receiveShadow={p.receiveShadow}
        >
          <boxGeometry args={[p.w, p.h, p.d]} />
          <primitive object={materials[p.matType]} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

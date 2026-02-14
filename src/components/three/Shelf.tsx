'use client';

import { useMemo, useState, useEffect } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { Panel } from './Panel';
import {
  createMaterialsForColor,
  createColorMaterials,
  disposeMaterialSet,
  type MaterialSet,
} from '@/lib/three/materials';
import { calculateGridPanels } from '@/lib/three/styles/grid';
import { calculateSlantPanels } from '@/lib/three/styles/slant';
import { calculatePixelPanels } from '@/lib/three/styles/pixel';
import { calculateGradientPanels } from '@/lib/three/styles/gradient';
import { calculateMosaicPanels } from '@/lib/three/styles/mosaic';
import type { PanelData } from '@/types/shelf';

// 기본 머티리얼 (동기적 폴백)
const DEFAULT_MATERIALS = createColorMaterials('#283A57', '#283A57');

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

  // 머티리얼 (비동기 로딩 지원)
  const [materials, setMaterials] = useState<MaterialSet>(DEFAULT_MATERIALS);

  useEffect(() => {
    let disposed = false;

    createMaterialsForColor(currentColor).then((mats) => {
      if (!disposed) {
        setMaterials((prev) => {
          if (prev !== DEFAULT_MATERIALS) disposeMaterialSet(prev);
          return mats;
        });
      }
    });

    return () => {
      disposed = true;
    };
  }, [currentColor]);

  // 스타일별 패널 계산
  const panels: PanelData[] = useMemo(() => {
    const input = { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel };

    switch (style) {
      case 'grid':
        return calculateGridPanels(input).panels;
      case 'slant':
        return calculateSlantPanels(input).panels;
      case 'pixel':
        return calculatePixelPanels(input).panels;
      case 'gradient':
        return calculateGradientPanels(input).panels;
      case 'mosaic':
        return calculateMosaicPanels(input).panels;
      default:
        return calculateGridPanels(input).panels;
    }
  }, [width, height, depth, thickness, style, density, rowHeights, numRows, hasBackPanel]);

  return (
    <group>
      {panels.map((p, i) => (
        <Panel
          key={`${style}-${i}`}
          w={p.w}
          h={p.h}
          d={p.d}
          position={[p.x, p.y, p.z]}
          matType={p.matType}
          materials={materials}
          castShadow={p.castShadow}
          receiveShadow={p.receiveShadow}
        />
      ))}
    </group>
  );
}

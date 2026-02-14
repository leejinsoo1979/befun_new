'use client';

import { useMemo, useState, useEffect } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { Panel } from './Panel';
import { Door } from './Door';
import { Drawer } from './Drawer';
import { RowColliders } from './RowColliders';
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
import { calculatePatternPanels } from '@/lib/three/styles/pattern';
import { calculateMosaicPanels } from '@/lib/three/styles/mosaic';
import { calculateDoorPlacements, calculateDrawerPlacements } from '@/lib/three/hardware';
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

  // 하드웨어 상태
  const doorsCreatedLayers = useHardwareStore((s) => s.doorsCreatedLayers);
  const drawersCreatedLayers = useHardwareStore((s) => s.drawersCreatedLayers);
  const openDoors = useHardwareStore((s) => s.openDoors);
  const openDrawers = useHardwareStore((s) => s.openDrawers);

  // 머티리얼 (비동기 로딩 지원)
  const [materials, setMaterials] = useState<MaterialSet>(DEFAULT_MATERIALS);

  useEffect(() => {
    let disposed = false;

    createMaterialsForColor(currentColor)
      .then((mats) => {
        if (!disposed) {
          setMaterials((prev) => {
            if (prev !== DEFAULT_MATERIALS) disposeMaterialSet(prev);
            return mats;
          });
        }
      })
      .catch((err) => {
        console.error('[Befun] 머티리얼 생성 실패:', currentColor, err);
      });

    return () => {
      disposed = true;
    };
  }, [currentColor]);

  // 스타일별 패널 계산
  const styleResult = useMemo(() => {
    const input = { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel };

    switch (style) {
      case 'grid':
        return calculateGridPanels(input);
      case 'slant':
        return calculateSlantPanels(input);
      case 'pixel':
        return calculatePixelPanels(input);
      case 'gradient':
        return calculateGradientPanels(input);
      case 'pattern':
        return calculatePatternPanels(input);
      case 'mosaic':
        return calculateMosaicPanels(input);
      default:
        return calculateGridPanels(input);
    }
  }, [width, height, depth, thickness, style, density, rowHeights, numRows, hasBackPanel]);

  const panels: PanelData[] = styleResult.panels;
  const { panelCount, panelSpacing } = styleResult;

  // 도어 배치 계산
  const doorPlacements = useMemo(() => {
    return doorsCreatedLayers.flatMap((layerIndex) =>
      calculateDoorPlacements(
        style, layerIndex, width, depth, thickness,
        rowHeights, numRows, panelCount, panelSpacing,
      ),
    );
  }, [doorsCreatedLayers, style, width, depth, thickness, rowHeights, numRows, panelCount, panelSpacing]);

  // 서랍 배치 계산
  const drawerPlacements = useMemo(() => {
    return drawersCreatedLayers.flatMap((layerIndex) =>
      calculateDrawerPlacements(
        style, layerIndex, width, depth, thickness,
        rowHeights, numRows, panelCount, panelSpacing,
      ),
    );
  }, [drawersCreatedLayers, style, width, depth, thickness, rowHeights, numRows, panelCount, panelSpacing]);

  return (
    <group>
      {/* 선반 패널 */}
      {panels.map((p, i) => (
        <Panel
          key={`${style}-panel-${i}`}
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

      {/* 도어 */}
      {doorPlacements.map((dp, i) => (
        <Door
          key={`${style}-door-${dp.layerIndex}-${i}`}
          placement={dp}
          materials={materials}
          isOpen={openDoors[dp.layerIndex] ?? false}
          thickness={thickness}
        />
      ))}

      {/* 서랍 */}
      {drawerPlacements.map((dp, i) => (
        <Drawer
          key={`${style}-drawer-${dp.layerIndex}-${i}`}
          placement={dp}
          materials={materials}
          isOpen={openDrawers[dp.layerIndex] ?? false}
          thickness={thickness}
        />
      ))}

      {/* V1 행 콜라이더 (마우스 오버 감지) */}
      <RowColliders />
    </group>
  );
}

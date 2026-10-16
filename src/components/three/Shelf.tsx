'use client';

import { setPanelEdgeFinish } from '@/lib/three/panel-edge';
import { BIRCH_EDGE_MIX_COLOR } from '@/lib/three/finish';

import { applyReferenceAlbedo } from '@/lib/three/reference-materials';
import { calculateShelfGeometry } from '@/lib/three/shelf-geometry';

import { useMemo, useState, useEffect } from 'react';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { REFERENCE_COLORS, REFERENCE_CLASSIC_COLORS } from '@/lib/three/reference-colors';
import { Panel } from './Panel';
import { HorizontalPanelSeams } from './HorizontalPanelSeams';
import { horizontalSeams } from '@/lib/three/horizontal-seams';
import { ShelfDecor } from './decor/ShelfDecor';
import { createBlumShelfPlans } from '@/lib/three/blum/boring';
import { BlumPlate } from './blum/BlumHardware';
import { useDisplayStore } from './display/displayStore';
import { ExplodedPart } from './display/ExplodedPart';
import { AssemblySequence } from './display/AssemblySequence';
import { createAssemblyPlan } from './display/assemblyPlan';
import { Door } from './Door';
import { Drawer } from './Drawer';
import { RowColliders } from './RowColliders';
import { LevelingFeet } from './LevelingFeet';
import { FurnitureLegs } from './FurnitureLegs';
import { baseHeight } from '@/lib/three/furniture-base';
import { Suspense } from 'react';
import { DimensionOverlay } from './DimensionOverlay';
import {
  createColorMaterials,
  solidDisplayColor,
  disposeMaterialSet,
  type MaterialSet,
} from '@/lib/three/materials';
import { createNaturalMaterialsForColor } from '@/lib/three/natural-materials';
import type { ReferenceFront } from '@/lib/three/reference-hardware';
import { calculateDoorPlacements, calculateDrawerPlacements } from '@/lib/three/hardware';
import type { PanelData } from '@/types/shelf';

// 기본 머티리얼 (동기적 폴백)
const DEFAULT_MATERIALS = createColorMaterials('#101323', '#101323');

interface ShelfProps {
  showDimensions?: boolean;
  exploded?: boolean;
  presentation?: boolean;
}

export function Shelf({ showDimensions = false, exploded = false, presentation = false }: ShelfProps) {
  const boreView = useDisplayStore(s => s.showBores);
  const revealBores = presentation && boreView;
  const assembledRealistic = useDisplayStore(s => s.phase === 'assembled' && s.appearance === 'realistic');
  const catalogPreset = useShelfStore(s=>s.catalogPreset);
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
  const family = currentColor.startsWith('C_') || currentColor.startsWith('N_') ? 'type01' as const : 'type02' as const;

  // 하드웨어 상태
  const doorsCreatedLayers = useHardwareStore((s) => s.doorsCreatedLayers);
  const drawersCreatedLayers = useHardwareStore((s) => s.drawersCreatedLayers);
  const hardwareRowStyles = useHardwareStore((s) => s.rowStyles);
  const openDoors = useHardwareStore((s) => s.openDoors);
  const openDrawers = useHardwareStore((s) => s.openDrawers);

  // 머티리얼 (비동기 로딩 지원)
  const [materials, setMaterials] = useState<MaterialSet>(DEFAULT_MATERIALS);

  useEffect(() => {
    let disposed = false;

    const referenceColor = REFERENCE_COLORS[currentColor];
    const materialRequest = referenceColor
      ? Promise.resolve(createColorMaterials(referenceColor.base, referenceColor.edge))
      : createNaturalMaterialsForColor(REFERENCE_CLASSIC_COLORS[currentColor] && currentColor !== BIRCH_EDGE_MIX_COLOR ? 'C_White' : currentColor);
    materialRequest
      .then((mats) => {
        if (referenceColor) applyReferenceAlbedo(mats, referenceColor);
        const classicColor = REFERENCE_CLASSIC_COLORS[currentColor];
        if (classicColor) {
          for (const material of [mats.verticalBase, mats.horizontalBase, mats.backPanel]) {
            material.map?.dispose();
            material.map = null;
            // Match the existing Sand+Green edge, including its display correction.
            material.color.set(currentColor === 'C_Green' ? solidDisplayColor(classicColor) : classicColor);
            material.roughness = currentColor === 'C_Green' ? 0.5 : 0.7;
            material.envMapIntensity = currentColor === 'C_Green' ? 1 : 0.78;
            material.needsUpdate = true;
          }
          mats.verticalEdge.roughness = 0.5;
          mats.horizontalEdge.roughness = 0.5;
        }
        setPanelEdgeFinish(mats, currentColor);
        if (disposed) { disposeMaterialSet(mats); return; }
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
  const hardwareLayers = useMemo(() => {
    const layers = new Set<number>();
    doorsCreatedLayers.forEach((l) => layers.add(l));
    drawersCreatedLayers.forEach((l) => layers.add(l));
    return Array.from(layers);
  }, [doorsCreatedLayers, drawersCreatedLayers]);

  const styleResult = useMemo(() => {
    const input = { catalogPreset, width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel, hardwareLayers, hardwareRowStyles, family };

    return calculateShelfGeometry(style,input);
  }, [catalogPreset, width, height, depth, thickness, style, density, rowHeights, numRows, hasBackPanel, hardwareLayers, hardwareRowStyles, family]);

  const panels: PanelData[] = styleResult.panels;
  const { panelCount, panelSpacing } = styleResult;
  const seamByPanel = useMemo(() => new Map(horizontalSeams(panels).map(seam => [seam.panelIndex, seam])), [panels]);
  const fronts = useMemo(() => styleResult.fronts
    ? (styleResult.fronts as ReferenceFront[]).map(front => ({ ...front,
        family: (currentColor.startsWith('C_') || currentColor.startsWith('N_') ? 'type01' : 'type02') as 'type01' | 'type02',
      }))
    : undefined, [styleResult, currentColor]);

  // 도어 배치 계산
  const doorPlacements = useMemo(() => {
    return doorsCreatedLayers.flatMap((layerIndex) =>
      calculateDoorPlacements(
        style, layerIndex, width, depth, thickness,
        rowHeights, numRows, panelCount, panelSpacing, density, fronts,
      ),
    );
  }, [doorsCreatedLayers, style, width, depth, thickness, rowHeights, numRows, panelCount, panelSpacing, density, fronts]);

  // 서랍 배치 계산
  const drawerPlacements = useMemo(() => {
    return drawersCreatedLayers.flatMap((layerIndex) =>
      calculateDrawerPlacements(
        style, layerIndex, width, depth, thickness,
        rowHeights, numRows, panelCount, panelSpacing, density, fronts,
      ),
    );
  }, [drawersCreatedLayers, style, width, depth, thickness, rowHeights, numRows, panelCount, panelSpacing, density, fronts]);

  const blumPlans = useMemo(() => createBlumShelfPlans(doorPlacements, panels, thickness), [doorPlacements, panels, thickness]);
  useEffect(() => {
    if (!presentation) return;
    useDisplayStore.setState({ boringSummary: { doors: blumPlans.length,
      holes: blumPlans.reduce((sum,p) => sum + p.holes.length + p.mounts.reduce((s,m) => s + m.holes.length,0),0),
      issues: [...new Set(blumPlans.flatMap(p => p.issues))],
    } });
  }, [blumPlans, presentation]);
  const panelHardware = useMemo(() => panels.map((_,index) => {
    const mounts = blumPlans.flatMap(plan => plan.mounts.filter(m => m.panelIndex === index));
    return { mounts, holes: mounts.flatMap(m => m.holes) };
  }), [blumPlans, panels]);

  const assemblyPlan = useMemo(() => createAssemblyPlan(panels, doorPlacements, drawerPlacements, width, height, depth, thickness, panelHardware.map(p => p.mounts[0]?.inwardSign ?? 1)),
    [panels, doorPlacements, drawerPlacements, width, height, depth, thickness, panelHardware]);

  // 조절발 높이만큼 선반 전체를 올려서 조절발이 바닥 위에 보이게 함
  const baseType = useShelfStore(s=>s.baseType);
  const footHeight = baseHeight(baseType);

  return (
    <AssemblySequence plan={assemblyPlan} enabled={presentation}>
    <group position={[0, footHeight, 0]}>
      {/* 선반 패널 */}
      {panels.map((p, i) => (
        <ExplodedPart key={`${style}-panel-${i}`} part={assemblyPlan.parts[i]}>
        <Panel
          holes={panelHardware[i].holes}
          w={p.w}
          h={p.h}
          d={p.d}
          position={[p.x, p.y, p.z]}
          matType={p.matType}
          materials={materials}
          castShadow={p.castShadow}
          receiveShadow={p.receiveShadow}
        />
        {(!presentation || assembledRealistic) && seamByPanel.has(i) && <HorizontalPanelSeams seam={seamByPanel.get(i)!} />}
        <group visible={!revealBores} userData={{displayRestoreVisible:true}}>{panelHardware[i].mounts.map((mount,j) => <BlumPlate key={j} mount={mount}/>)}</group>
        {p.matType === 'horizontalBase' && (baseType === 'legs'
          ? <Suspense fallback={null}><FurnitureLegs panels={panels} panelIndex={i} depth={depth} style={style} material={materials.horizontalBase} /></Suspense>
          : <LevelingFeet panels={panels} panelIndex={i} />)}
        </ExplodedPart>
      ))}

      {/* 도어 */}
      {doorPlacements.map((dp, i) => (
        <ExplodedPart key={`${style}-door-${dp.layerIndex}-${i}`} part={assemblyPlan.parts[panels.length + i]}>
        <Door
          placement={dp}
          materials={materials}
          blum={blumPlans[i]}
          revealBores={revealBores}
          isOpen={!exploded && (revealBores || (openDoors[dp.layerIndex] ?? false))}
          thickness={thickness}
        />
        </ExplodedPart>
      ))}

      {/* 서랍 */}
      {drawerPlacements.map((dp, i) => (
        <ExplodedPart key={`${style}-drawer-${dp.layerIndex}-${i}`} part={assemblyPlan.parts[panels.length + doorPlacements.length + i]}>
        <Drawer
          placement={dp}
          materials={materials}
          isOpen={!exploded && (openDrawers[dp.layerIndex] ?? false)}
          thickness={thickness}
        />
        </ExplodedPart>
      ))}

      {presentation && <ShelfDecor panels={panels} doors={doorPlacements} drawers={drawerPlacements} />}

      {/* 치수 오버레이 — 선반 본체 좌표계 기준 (조절발 제외) */}
      {showDimensions && !exploded && <DimensionOverlay />}

      {/* V1 행 콜라이더 (마우스 오버 감지) */}
      {!exploded && <RowColliders />}
    </group>
    </AssemblySequence>
  );
}

import type { ReferenceFront } from '@/lib/three/reference-hardware';
import type { ColorCategory, PanelData, StyleType } from '@/types/shelf';
import { calculateGridPanels } from '@/lib/three/styles/grid';
import { calculateSlantPanels } from '@/lib/three/styles/slant';
import { calculatePixelPanels } from '@/lib/three/styles/pixel';
import { calculateGradientPanels } from '@/lib/three/styles/gradient';
import { calculatePatternPanels } from '@/lib/three/styles/pattern';
import { calculateMosaicPanels } from '@/lib/three/styles/mosaic';
import {
  calculateDoorPlacements,
  calculateDrawerPlacements,
  type DoorPlacement,
  type DrawerPlacement,
} from '@/lib/three/hardware';

/** 옵티마이저로 넘길 Befun 디자인 상태 (단위 cm, 스토어 값 그대로) */
export interface BefunDesign {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  style: StyleType;
  density: number;
  rowHeights: number[];
  numRows: number;
  hasBackPanel: boolean;
  doorsCreatedLayers: number[];
  drawersCreatedLayers: number[];
  hardwareRowStyles?: Record<number,number>;
  color: string;
  colorCategory: ColorCategory;
}

export interface BefunShelfModel {
  panels: PanelData[];
  doors: DoorPlacement[];
  drawers: DrawerPlacement[];
}

/**
 * Shelf.tsx와 같은 계산으로 패널·도어·서랍 배치를 만든다.
 * 스타일 디스패치는 Shelf.tsx / PriceDisplay.tsx / DimensionOverlay.tsx / configurator/page.tsx와 동일하게 유지할 것.
 */
export function buildBefunShelfModel(design: BefunDesign): BefunShelfModel {
  const { width, height, depth, thickness, style, density, rowHeights, numRows, hasBackPanel } = design;
  const hardwareLayers = Array.from(new Set([...design.doorsCreatedLayers, ...design.drawersCreatedLayers]));
  const input = { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel, hardwareLayers, hardwareRowStyles: design.hardwareRowStyles,
    family: design.colorCategory === 'classic' || design.colorCategory === 'natural' ? 'type01' as const : 'type02' as const };

  let result;
  switch (style) {
    case 'slant':
      result = calculateSlantPanels(input);
      break;
    case 'pixel':
      result = calculatePixelPanels(input);
      break;
    case 'gradient':
      result = calculateGradientPanels(input);
      break;
    case 'pattern':
      result = calculatePatternPanels(input);
      break;
    case 'mosaic':
      result = calculateMosaicPanels(input);
      break;
    case 'grid':
    default:
      result = calculateGridPanels(input);
  }

  const { panelCount, panelSpacing } = result;
  const fronts = result.fronts ? (result.fronts as ReferenceFront[]).map(front => ({ ...front,
    family: (design.colorCategory === 'classic' || design.colorCategory === 'natural' ? 'type01' : 'type02') as 'type01' | 'type02',
  })) : undefined;
  const doors = design.doorsCreatedLayers.flatMap((layer) =>
    calculateDoorPlacements(style, layer, width, depth, thickness, rowHeights, numRows, panelCount, panelSpacing, density, fronts),
  );
  const drawers = design.drawersCreatedLayers.flatMap((layer) =>
    calculateDrawerPlacements(style, layer, width, depth, thickness, rowHeights, numRows, panelCount, panelSpacing, density, fronts),
  );

  return { panels: result.panels, doors, drawers };
}

/** Drawer.tsx의 서랍 부재 치수 계산(v1 createDrawerGrid 이식)과 동일. 단위 cm. */
export function drawerPartSizes(drawer: DrawerPlacement, thickness: number) {
  if (drawer.reference) {
    const size = (name: string) => {
      const p = drawer.reference!.parts.find(part => part.name === name)!;
      return { w:p.w, h:p.h, d:p.d };
    };
    return { front:size('front'), back:size('back'), bottom:size('bottom'), side:size('side-left') };
  }
  const { compartmentWidth, rowHeight, drawerDepth } = drawer;
  const DRAWER_GAP = 0.3;
  return {
    bottom: { w: compartmentWidth - thickness - 4, h: thickness - 0.5, d: drawerDepth - 3.5 },
    back: { w: compartmentWidth - 6, h: rowHeight - 4.5, d: thickness - 0.5 },
    front: { w: compartmentWidth - 2 - DRAWER_GAP * 2, h: rowHeight - 2 - DRAWER_GAP * 2, d: thickness },
    side: { w: thickness - 0.5, h: rowHeight - 2.5, d: drawerDepth - 2 },
  };
}

import { calculateReferenceGrid } from '../reference-grid-slant-grid.ts';
import type { HardwareRowStyles } from '../hardware-state';
import type { ReferenceFront } from '../reference-hardware';
import type { PanelData } from '@/types/shelf';

export interface GridInput {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  density: number;
  rowHeights: number[];
  numRows: number;
  hasBackPanel: boolean;
  family?: 'type01' | 'type02';
  hardwareRowStyles?: HardwareRowStyles;
  hardwareLayers?: number[]; // 도어/서랍이 달린 행 인덱스
}

export interface GridResult {
  panels: PanelData[];
  panelCount: number;
  panelSpacing: number;
  fronts?: ReferenceFront[];
  openings?: ReferenceOpening[];
  bodyHeight?: number;
  boardThickness?: number;
}

export interface ReferenceOpening {
  rowIndex: number;
  rowSpan: number;
  x: number;
  y: number;
  width: number;
  height: number;
  openLeft: boolean;
  openRight: boolean;
}

// ── v1 calculateDensityGrid 완전 이식 ──

function calculateDensityGrid(width: number, density: number): { targetPanels: number; targetCompartments: number } {
  const scale = width / 450;

  let targetCompartments: number;

  // 450cm 기준 밀도별 칸 수 결정 (v1 특수 케이스)
  if (Math.abs(width - 450) < 5) {
    if (density <= 16) {
      targetCompartments = 6;
    } else if (density <= 35) {
      targetCompartments = 8;
    } else if (density <= 50) {
      targetCompartments = 10;
    } else if (density <= 66) {
      targetCompartments = 12;
    } else if (density <= 83) {
      targetCompartments = 14;
    } else {
      targetCompartments = 15;
    }
    return {
      targetPanels: targetCompartments + 1,
      targetCompartments,
    };
  }

  // 다른 크기는 선형 보간
  const densityFactor = density / 100;
  targetCompartments = Math.round(6 + (15 - 6) * densityFactor);

  const targetPanels = targetCompartments + 1;
  const scaledTargetPanels = Math.round(scale * targetPanels);

  return {
    targetPanels: scaledTargetPanels,
    targetCompartments,
  };
}

// ── v1 limitPanelSpacingGrid 완전 이식 ──

export function limitPanelSpacingGrid(
  width: number,
  thickness: number,
  density: number,
): { panelCount: number; panelSpacing: number } {
  const densityResult = calculateDensityGrid(width, density);
  let panelCount = Math.max(2, densityResult.targetPanels);
  let panelSpacing = (width - thickness) / (panelCount - 1);

  const minInnerWidth = 28;
  const maxInnerWidth = 72;
  const minPanelSpacing = minInnerWidth + thickness; // 30
  const maxPanelSpacing = maxInnerWidth + thickness; // 74

  // 450cm 특수 케이스는 제약 적용하지 않음
  const is450cmSpecialCase = Math.abs(width - 450) < 5;

  if (!is450cmSpecialCase) {
    if (panelSpacing < minPanelSpacing) {
      panelCount = Math.max(2, Math.floor((width - thickness) / minPanelSpacing) + 1);
      panelSpacing = (width - thickness) / (panelCount - 1);
    } else if (panelSpacing > maxPanelSpacing) {
      panelCount = Math.ceil((width - thickness) / maxPanelSpacing) + 1;
      panelSpacing = (width - thickness) / (panelCount - 1);
    }
  }

  return { panelCount, panelSpacing };
}

/** Both finish families share panel/front coordinates from their own Grid rules. */
export function calculateGridPanels(input: GridInput): GridResult {
  return calculateReferenceGrid(input);
}

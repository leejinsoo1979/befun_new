import type { PanelData } from '@/types/shelf';
import { calculateGridPanels, type GridInput, type GridResult } from './grid';

export interface GradientInput {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  density: number;
  rowHeights: number[];
  numRows: number;
  hasBackPanel: boolean;
  hardwareLayers?: number[];
}

export type GradientResult = GridResult & { internalWidths: number[] };

// ── v1 calculateInternalWidths 이식 ──

function calculateInternalWidths(columnCount: number, totalWidth: number, density: number, thickness: number): number[] {
  const minWidth = 25;
  const maxWidth = 66;
  let widths = new Array<number>(columnCount).fill(0);

  const availableWidth = totalWidth - columnCount * thickness;
  const baseWidth = availableWidth / columnCount;

  const centerIndex = Math.floor(columnCount / 2);
  const isOdd = columnCount % 2 === 1;

  if (density === 50) {
    const ratio = 1.12;
    for (let i = 0; i < columnCount; i++) {
      const distanceFromCenter = Math.abs(i - centerIndex);
      if (isOdd && i === centerIndex) {
        widths[i] = baseWidth;
      } else {
        widths[i] = baseWidth * Math.pow(ratio, distanceFromCenter);
      }
    }
  } else {
    const densityFactor = density / 100;
    for (let i = 0; i < columnCount; i++) {
      const positionFactor = (i / (columnCount - 1)) * 2 - 1;
      const widthAdjustment = baseWidth * 0.5 * (densityFactor - 0.5) * positionFactor;
      widths[i] = baseWidth + widthAdjustment;
    }
  }

  // 최소/최대 폭 제한
  widths = widths.map((w) => Math.max(minWidth, Math.min(maxWidth, w)));

  // 전체 폭 미세 조정
  const totalCalculatedWidth = widths.reduce((a, b) => a + b, 0);
  const diff = availableWidth - totalCalculatedWidth;
  const adjustmentPerColumn = diff / columnCount;
  widths = widths.map((w) => Math.max(minWidth, Math.min(maxWidth, w + adjustmentPerColumn)));

  return widths;
}

// ── 메인: Gradient 패널 배치 계산 ──

export function calculateGradientPanels(input: GradientInput): GradientResult {
  const { width, depth, thickness, density, rowHeights, numRows, hasBackPanel, hardwareLayers = [] } = input;
  const hardwareSet = new Set(hardwareLayers);

  if (width < 60) {
    const gridResult = calculateGridPanels(input as GridInput);
    return { ...gridResult, internalWidths: [] };
  }

  const panels: PanelData[] = [];
  const columnCount = Math.floor((width - thickness) / 40) + 1;
  const internalWidths = calculateInternalWidths(columnCount, width - 2 * thickness, density, thickness);

  // === 가로 패널 ===
  let currentY = 0;
  for (let i = 0; i <= numRows; i++) {
    panels.push({
      w: width, h: thickness, d: depth,
      x: 0, y: currentY + thickness / 2, z: depth / 2,
      matType: 'horizontalBase', castShadow: true, receiveShadow: true,
    });
    if (i < numRows && i < rowHeights.length) {
      currentY += rowHeights[i] + thickness;
    }
  }

  // === 세로 패널 (가변 폭) ===
  let x = -width / 2 + thickness / 2;

  for (let i = 0; i < internalWidths.length; i++) {
    currentY = 0;
    for (let j = 0; j < numRows; j++) {
      const rh = rowHeights[j] ?? 32;
      panels.push({
        w: thickness, h: rh, d: depth,
        x, y: currentY + rh / 2 + thickness, z: depth / 2,
        matType: 'verticalBase', castShadow: true, receiveShadow: true,
      });
      currentY += rh + thickness;
    }
    x += internalWidths[i] + thickness;
  }

  // 우측 끝 세로 패널
  currentY = 0;
  for (let j = 0; j < numRows; j++) {
    const rh = rowHeights[j] ?? 32;
    panels.push({
      w: thickness, h: rh, d: depth,
      x: width / 2 - thickness / 2, y: currentY + rh / 2 + thickness, z: depth / 2,
      matType: 'verticalBase', castShadow: true, receiveShadow: true,
    });
    currentY += rh + thickness;
  }

  // === 백패널 또는 서포트 패널 (행별 판단) ===
  const supPanelWidth = 12;
  currentY = 0;

  for (let j = 0; j < numRows; j++) {
    const rh = rowHeights[j] ?? 32;
    const rowNeedsBackPanel = hasBackPanel || hardwareSet.has(j);
    const yPosition = currentY + rh / 2 + thickness;

    if (rowNeedsBackPanel) {
      let bx = -width / 2 + thickness / 2;
      let totalUsedWidth = 0;
      for (let i = 0; i < internalWidths.length; i++) {
        let panelWidth = internalWidths[i];
        if (i === internalWidths.length - 1) {
          panelWidth = width - totalUsedWidth - thickness * 2;
        }
        totalUsedWidth += panelWidth + thickness;
        panels.push({
          w: panelWidth, h: rh, d: thickness,
          x: bx + panelWidth / 2 + thickness / 2,
          y: yPosition, z: 1,
          matType: 'backPanel', castShadow: false, receiveShadow: true,
        });
        bx += panelWidth + thickness;
      }
    } else {
      panels.push({
        w: supPanelWidth, h: rh, d: thickness,
        x: -width / 2 + supPanelWidth / 2 + 2, y: yPosition, z: 1,
        matType: 'supportPanel', castShadow: true, receiveShadow: true,
      });
      if (width >= 44) {
        panels.push({
          w: supPanelWidth, h: rh, d: thickness,
          x: width / 2 - supPanelWidth / 2 - 2, y: yPosition, z: 1,
          matType: 'supportPanel', castShadow: true, receiveShadow: true,
        });
      }
    }

    currentY += rh + thickness;
  }

  const panelCount = internalWidths.length + 1;
  return { panels, panelCount, panelSpacing: 0, internalWidths };
}

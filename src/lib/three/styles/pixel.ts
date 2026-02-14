import type { PanelData } from '@/types/shelf';
import { calculateGridPanels, type GridInput, type GridResult } from './grid';

export interface PixelInput {
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

export type PixelResult = GridResult;

// ── v1 calculateGaps 이식 ──

function calculateGaps(shelfWidth: number, density: number, thickness: number): number[] {
  let densityRatio: number;
  if (shelfWidth < 110) {
    densityRatio = 0;
  } else if (density >= 50) {
    densityRatio = -(density - 50) / 30;
  } else {
    densityRatio = -(density - 50) / 70;
  }

  if (shelfWidth < 110) {
    const availableSpace = shelfWidth - 4 * thickness;
    const centerGap = Math.min(50, availableSpace - 34) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap) / 2;
    return [sideGap, centerGap, sideGap];
  } else if (shelfWidth < 185) {
    const availableSpace = shelfWidth - 6 * thickness;
    const centerGap = Math.min(50, availableSpace - 68) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap) / 4;
    return [sideGap - 3, sideGap + 3, centerGap, sideGap + 3, sideGap - 3];
  } else if (shelfWidth < 241) {
    const availableSpace = shelfWidth - 8 * thickness;
    const centerGap = (Math.min(50, availableSpace - 85) - 12) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap * 2) / 5;
    return [sideGap - 3, sideGap + 3, centerGap, sideGap, centerGap, sideGap + 3, sideGap - 3];
  } else if (shelfWidth < 319) {
    const availableSpace = shelfWidth - 10 * thickness;
    const centerGap = (Math.min(50, availableSpace - 102) - 15) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap * 3) / 6;
    return [sideGap - 5, sideGap + 2, centerGap + 2, sideGap + 1, centerGap, sideGap + 1, centerGap + 2, sideGap + 2, sideGap - 5];
  } else if (shelfWidth < 396) {
    const availableSpace = shelfWidth - 12 * thickness;
    const centerGap = (Math.min(50, availableSpace - 119) - 10) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap * 4) / 7;
    return [sideGap - 5, sideGap + 3, centerGap + 2, sideGap, centerGap, sideGap, centerGap, sideGap, centerGap + 2, sideGap + 3, sideGap - 5];
  } else {
    const availableSpace = shelfWidth - 14 * thickness;
    const centerGap = (Math.min(50, availableSpace - 136) - 8) * (1 + densityRatio * 0.2);
    const sideGap = (availableSpace - centerGap * 5) / 8;
    return [sideGap - 4, sideGap + 4, centerGap, sideGap, centerGap, sideGap, centerGap, sideGap, centerGap, sideGap, centerGap, sideGap + 4, sideGap - 4];
  }
}

// ── 메인: Pixel 패널 배치 계산 ──

export function calculatePixelPanels(input: PixelInput): PixelResult {
  const { width, depth, thickness, density, rowHeights, numRows, hasBackPanel, hardwareLayers = [] } = input;

  if (numRows === 1 || width < 78) {
    return calculateGridPanels(input as GridInput);
  }

  const panels: PanelData[] = [];
  const hardwareSet = new Set(hardwareLayers);
  const gaps = calculateGaps(width, density, thickness);

  let currentY = 0;
  const isEvenTotalRows = numRows % 2 === 0;

  for (let row = 0; row <= numRows; row++) {
    // === 가로 패널 ===
    if (row === 0 || row === numRows) {
      if (row === numRows && isEvenTotalRows) {
        // 짝수 행: 최상단 가로 패널 하나로 생성
        panels.push({
          w: width, h: thickness, d: depth,
          x: -thickness / 2, y: currentY + thickness / 2, z: depth / 2,
          matType: 'horizontalBase', castShadow: true, receiveShadow: true,
        });
      } else {
        // 교대 패턴 가로 패널
        let x = -width / 2 + thickness / 2;
        for (let i = 0; i < gaps.length; i++) {
          if (i % 2 === 1) {
            const w = gaps[i] + thickness;
            panels.push({
              w: w + thickness, h: thickness, d: depth,
              x: x + w / 2 - thickness / 2, y: currentY + thickness / 2, z: depth / 2,
              matType: 'horizontalBase', castShadow: true, receiveShadow: true,
            });
          }
          x += gaps[i] + thickness;
        }
      }
    } else {
      panels.push({
        w: width, h: thickness, d: depth,
        x: -thickness / 2, y: currentY + thickness / 2, z: depth / 2,
        matType: 'horizontalBase', castShadow: true, receiveShadow: true,
      });
    }

    // === 세로 패널 ===
    if (row < numRows) {
      const rh = rowHeights[row] ?? 32;
      let x = -width / 2 + thickness / 2;

      for (let i = 0; i <= gaps.length; i++) {
        if (row % 2 === 0) {
          if (i === 0 || i === gaps.length) {
            x += (i < gaps.length) ? gaps[i] + thickness : 0;
            continue;
          }
        }

        panels.push({
          w: thickness, h: rh, d: depth,
          x: x - thickness / 2, y: currentY + rh / 2 + thickness, z: depth / 2,
          matType: 'verticalBase', castShadow: true, receiveShadow: true,
        });

        if (i < gaps.length) {
          x += gaps[i] + thickness;
        }
      }
    }

    if (row < rowHeights.length) {
      currentY += (rowHeights[row] ?? 32) + thickness;
    }
  }

  // === 백패널 또는 서포트 패널 (행별 판단) ===
  currentY = 0;
  for (let row = 0; row < numRows; row++) {
    const rh = rowHeights[row] ?? 32;
    const isEvenRow = row % 2 === 0;
    const rowNeedsBackPanel = hasBackPanel || hardwareSet.has(row);

    if (rowNeedsBackPanel) {
      if (isEvenRow) {
        let x = -width / 2 + thickness / 2 + gaps[0] + thickness;
        for (let i = 1; i < gaps.length - 1; i++) {
          const w = gaps[i];
          panels.push({
            w, h: rh, d: thickness,
            x: x + w / 2, y: currentY + rh / 2 + thickness, z: thickness / 2,
            matType: 'backPanel', castShadow: false, receiveShadow: true,
          });
          x += w + thickness;
        }
      } else {
        let x = -width / 2 + thickness / 2;
        for (let i = 0; i < gaps.length; i++) {
          const w = gaps[i] + thickness;
          panels.push({
            w: w - thickness, h: rh, d: thickness,
            x: x + w / 2 - thickness / 2, y: currentY + rh / 2 + thickness, z: thickness / 2,
            matType: 'backPanel', castShadow: false, receiveShadow: true,
          });
          x += w;
        }
      }
    } else {
      // 서포트 패널
      if (isEvenRow) {
        let x = -width / 2 + thickness / 2 + gaps[0] + thickness;
        let count = 0;
        for (let i = 1; i < gaps.length - 1; i++) {
          const w = gaps[i];
          count++;
          if (count % 2 !== 0) {
            panels.push({
              w, h: rh, d: thickness,
              x: x + w / 2, y: currentY + rh / 2 + thickness, z: thickness / 2,
              matType: 'backPanel', castShadow: false, receiveShadow: true,
            });
          }
          x += w + thickness;
        }
      } else {
        let x = -width / 2 + thickness / 2;
        let count = 0;
        for (let i = 0; i < gaps.length; i++) {
          const w = gaps[i] + thickness;
          count++;
          if (count % 2 !== 0) {
            panels.push({
              w: w - thickness, h: rh, d: thickness,
              x: x + w / 2 - thickness / 2, y: currentY + rh / 2 + thickness, z: thickness / 2,
              matType: 'backPanel', castShadow: false, receiveShadow: true,
            });
          }
          x += w;
        }
      }
    }
    currentY += rh + thickness;
  }

  return { panels, panelCount: gaps.length + 1, panelSpacing: 0 };
}

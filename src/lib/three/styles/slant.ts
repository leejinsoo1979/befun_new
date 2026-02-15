import type { PanelData } from '@/types/shelf';
import { calculateGridPanels, type GridInput, type GridResult } from './grid';

export interface SlantInput {
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

export type SlantResult = GridResult;

// ── Tylko 역설계 Slant 칸 분할 알고리즘 ──
// 경계 테이블: 해당 width(전체 너비)에서 칸 수가 N이 되는 최소 너비
// D0: 사용자가 Tylko에서 직접 수집 (1~4칸 확인, 5~8칸 외삽)
// D100: 450cm에서 unclamped 16칸 기준 역산
// 450cm 검증: D0=8칸, D50=12칸, D100=14칸(spacing 30cm 클램핑)

const SLANT_D0_BOUNDARIES = [30, 69, 136, 200, 264, 325, 383, 438];
const SLANT_D100_BOUNDARIES = [30, 57, 84, 111, 138, 165, 192, 219, 246, 273, 300, 327, 354, 381, 408, 435];
const MIN_SLANT_SPACING = 30;

function getSlantCompartments(width: number, boundaries: number[]): number {
  let count = 0;
  for (let i = 0; i < boundaries.length; i++) {
    if (width >= boundaries[i]) {
      count = i + 1;
    } else {
      break;
    }
  }
  return Math.max(1, count);
}

// density 보간 공식: Grid와 동일 — minCols + floor(density * (range + 1) / 101)
function calculateSlantCompartments(width: number, density: number): number {
  const minCols = getSlantCompartments(width, SLANT_D0_BOUNDARIES);
  const maxCols = getSlantCompartments(width, SLANT_D100_BOUNDARIES);
  const range = maxCols - minCols;

  if (range <= 0) return minCols;

  return minCols + Math.floor(density * (range + 1) / 101);
}

function calculateSlantSpacing(
  width: number,
  adjustedWidth: number,
  thickness: number,
  density: number,
): { panelCount: number; panelSpacing: number } {
  let compartments = calculateSlantCompartments(width, density);

  // 최소 spacing 제약: 칸 너비가 30cm 미만이면 칸 수 축소
  const maxCompartments = Math.floor((adjustedWidth - thickness) / MIN_SLANT_SPACING);
  if (maxCompartments > 0 && compartments > maxCompartments) {
    compartments = maxCompartments;
  }

  const panelCount = compartments + 1;
  const panelSpacing = (adjustedWidth - thickness) / compartments;

  return { panelCount, panelSpacing };
}

// ── 서포트 패널 위치 (v1 calculateSlantSupportPanelPositions 이식) ──

function calculateSlantSupportPanelPositions(
  adjustedWidth: number,
  thickness: number,
  panelCount: number,
  panelSpacing: number,
  isEvenRow: boolean,
): number[] {
  const positions: number[] = [];
  const supPanelWidth = 12;
  const slantOffset = adjustedWidth / panelCount / 4;
  const globalLeftOffset = -1;

  let leftPanelX = -adjustedWidth / 2 + thickness + supPanelWidth / 2 + globalLeftOffset;
  let rightPanelX = adjustedWidth / 2 - thickness - supPanelWidth / 2 + globalLeftOffset;

  if (isEvenRow) {
    leftPanelX -= slantOffset;
    rightPanelX -= slantOffset;
  } else {
    leftPanelX += slantOffset + 2;
    rightPanelX += slantOffset + 2;
  }

  if (adjustedWidth < 80) {
    positions.push(leftPanelX);
    return positions;
  }

  positions.push(leftPanelX);
  positions.push(rightPanelX);

  // 256cm+ 중간 패널 로직은 Grid와 유사하지만 슬랜트 오프셋 적용
  if (adjustedWidth >= 256) {
    const verticalPanelPositions: number[] = [];
    for (let i = 1; i < panelCount - 1; i++) {
      let panelX = -adjustedWidth / 2 + i * panelSpacing + thickness / 2;
      if (isEvenRow) {
        panelX -= slantOffset;
      } else {
        panelX += slantOffset + 2;
      }
      verticalPanelPositions.push(panelX);
    }

    if (verticalPanelPositions.length >= 2) {
      const totalWidth = adjustedWidth - thickness * 2;
      const sectionWidth = totalWidth / 3;

      let leftTargetX = -adjustedWidth / 2 + thickness + sectionWidth;
      let rightTargetX = -adjustedWidth / 2 + thickness + sectionWidth * 2;

      if (isEvenRow) {
        leftTargetX -= slantOffset;
        rightTargetX -= slantOffset;
      } else {
        leftTargetX += slantOffset + 2;
        rightTargetX += slantOffset + 2;
      }

      let leftClosestIndex = -1;
      let leftMinDistance = Infinity;
      let rightClosestIndex = -1;
      let rightMinDistance = Infinity;

      verticalPanelPositions.forEach((panelX, index) => {
        const ld = Math.abs(panelX - leftTargetX);
        const rd = Math.abs(panelX - rightTargetX);
        if (ld < leftMinDistance) { leftMinDistance = ld; leftClosestIndex = index; }
        if (rd < rightMinDistance) { rightMinDistance = rd; rightClosestIndex = index; }
      });

      if (leftClosestIndex >= 0) {
        const px = verticalPanelPositions[leftClosestIndex];
        positions.push(px - thickness / 2 - supPanelWidth / 2 + globalLeftOffset);
      }
      if (rightClosestIndex >= 0 && rightClosestIndex !== leftClosestIndex) {
        const px = verticalPanelPositions[rightClosestIndex];
        positions.push(px + thickness / 2 + supPanelWidth / 2 + globalLeftOffset);
      } else if (rightClosestIndex === leftClosestIndex) {
        const alt = rightClosestIndex + 1 < verticalPanelPositions.length
          ? rightClosestIndex + 1 : rightClosestIndex - 1;
        if (alt >= 0 && alt < verticalPanelPositions.length) {
          const px = verticalPanelPositions[alt];
          positions.push(px + thickness / 2 + supPanelWidth / 2 + globalLeftOffset);
        }
      }
    }
  }

  return positions;
}

// ── 메인: Slant 패널 배치 계산 ──

export function calculateSlantPanels(input: SlantInput): SlantResult {
  const { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel, hardwareLayers = [] } = input;

  // 행이 1이거나 width < 78이면 Grid로 폴백
  if (numRows <= 1 || width < 78) {
    return calculateGridPanels(input as GridInput);
  }

  const adjustedWidth = width - 24;
  const panels: PanelData[] = [];
  const hardwareSet = new Set(hardwareLayers);
  const { panelCount, panelSpacing } = calculateSlantSpacing(width, adjustedWidth, thickness, density);

  // DEBUG: 칸수 검증용 (추후 제거)
  console.log('[Slant]', { width, adjustedWidth, density, panelCount, compartments: panelCount - 1, panelSpacing: panelSpacing.toFixed(1) });

  // === 가로 패널 ===
  let currentY = 0;
  for (let i = 0; i <= numRows; i++) {
    panels.push({
      w: adjustedWidth + 24,
      h: thickness,
      d: depth,
      x: 0,
      y: currentY + thickness / 2,
      z: depth / 2,
      matType: 'horizontalBase',
      castShadow: true,
      receiveShadow: true,
    });
    if (i < numRows && i < rowHeights.length) {
      currentY += rowHeights[i] + thickness;
    }
  }

  // === 세로 패널 (지그재그) ===
  const slantOffset = adjustedWidth / panelCount / 4;
  const leftLimit = -adjustedWidth / 2 + thickness / 2;
  const rightLimit = adjustedWidth / 2 - thickness / 2;

  for (let i = 0; i < panelCount; i++) {
    const baseX = -adjustedWidth / 2 + i * panelSpacing;
    currentY = 1;

    for (let j = 0; j < numRows; j++) {
      const rh = rowHeights[j] ?? 32;
      let panelX: number;

      if (j % 2 === 0) {
        panelX = baseX - slantOffset;
      } else {
        panelX = baseX + slantOffset + 2;
      }

      // 프레임 범위 내로 클램핑
      panelX = Math.max(leftLimit, Math.min(rightLimit, panelX));

      panels.push({
        w: thickness,
        h: rh,
        d: depth,
        x: panelX,
        y: currentY + rh / 2 + thickness / 2,
        z: depth / 2,
        matType: 'verticalBase',
        castShadow: true,
        receiveShadow: true,
      });

      currentY += rh + thickness;
    }
  }

  // === 백패널 또는 서포트 패널 (행별 판단) ===
  const supPanelWidth = 12;
  let cy = 0;

  for (let j = 0; j < numRows; j++) {
    const rh = rowHeights[j] ?? 32;
    const rowNeedsBackPanel = hasBackPanel || hardwareSet.has(j);
    const isEvenRow = j % 2 === 0;

    if (rowNeedsBackPanel) {
      for (let i = 0; i < panelCount - 1; i++) {
        let x = -adjustedWidth / 2 + i * panelSpacing;

        if (isEvenRow) {
          x -= slantOffset;
        } else {
          x += slantOffset + 2;
        }

        // 프레임 범위 내로 클램핑
        const clampedX = Math.max(-adjustedWidth / 2 + thickness, x);
        const clampedRight = Math.min(adjustedWidth / 2 - thickness, x + panelSpacing);
        const clampedWidth = clampedRight - clampedX - thickness;

        if (clampedWidth > 0) {
          panels.push({
            w: clampedWidth,
            h: rh,
            d: thickness,
            x: clampedX + (clampedWidth + thickness) / 2,
            y: cy + rh / 2 + thickness,
            z: thickness / 2,
            matType: 'backPanel',
            castShadow: false,
            receiveShadow: true,
          });
        }
      }
    } else {
      const yPosition = cy + rh / 2 + thickness;
      const supportPositions = calculateSlantSupportPanelPositions(
        adjustedWidth, thickness, panelCount, panelSpacing, isEvenRow,
      );

      supportPositions.forEach((position) => {
        panels.push({
          w: supPanelWidth,
          h: rh,
          d: thickness,
          x: position,
          y: yPosition,
          z: thickness / 2,
          matType: 'supportPanel',
          castShadow: true,
          receiveShadow: true,
        });
      });
    }

    cy += rh + thickness;
  }

  return { panels, panelCount, panelSpacing };
}

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
// Slant는 adjustedWidth(= width - 24) 기준으로 칸 수를 결정
// D0: 사용자 수집 데이터 + 간격 감소 패턴(67, 64, 61, 58, 55, 52)으로 도출
// D100: Grid D100과 유사 (450cm에서 ~14-15칸)

const SLANT_D0_BOUNDARIES = [30, 69, 136, 200, 261, 319, 374, 426];
const SLANT_D100_BOUNDARIES = [30, 59, 87, 115, 143, 173, 200, 230, 256, 285, 312, 341, 369, 399, 425];

function getSlantCompartments(adjustedWidth: number, boundaries: number[]): number {
  let count = 0;
  for (let i = 0; i < boundaries.length; i++) {
    if (adjustedWidth >= boundaries[i]) {
      count = i + 1;
    } else {
      break;
    }
  }
  return Math.max(1, count);
}

function calculateSlantCompartments(adjustedWidth: number, density: number): number {
  const minCols = getSlantCompartments(adjustedWidth, SLANT_D0_BOUNDARIES);
  const maxCols = getSlantCompartments(adjustedWidth, SLANT_D100_BOUNDARIES);
  const range = maxCols - minCols;

  if (range <= 0) return minCols;

  return minCols + Math.floor(density * (range + 1) / 101);
}

function calculateSlantSpacing(
  adjustedWidth: number,
  thickness: number,
  density: number,
): { panelCount: number; panelSpacing: number } {
  const compartments = calculateSlantCompartments(adjustedWidth, density);
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
  const { panelCount, panelSpacing } = calculateSlantSpacing(adjustedWidth, thickness, density);

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
  for (let i = 0; i < panelCount; i++) {
    const baseX = -adjustedWidth / 2 + i * panelSpacing;
    currentY = 1;

    for (let j = 0; j < numRows; j++) {
      const rh = rowHeights[j] ?? 32;
      let panelX = baseX;

      if (j % 2 === 0) {
        panelX = baseX - (adjustedWidth / panelCount / 4);
      } else {
        panelX = baseX + (adjustedWidth / panelCount / 4) + 2;
      }

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
        const panelWidth = panelSpacing - thickness;

        if (isEvenRow) {
          x -= adjustedWidth / panelCount / 4;
        } else {
          x += (adjustedWidth / panelCount / 4) + 2;
        }

        panels.push({
          w: panelWidth,
          h: rh,
          d: thickness,
          x: x + (panelWidth + thickness) / 2,
          y: cy + rh / 2 + thickness,
          z: thickness / 2,
          matType: 'backPanel',
          castShadow: false,
          receiveShadow: true,
        });
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

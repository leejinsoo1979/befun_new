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
}

export type SlantResult = GridResult;

// ── v1 calculateDensitySlant 이식 ──

function calculateDensitySlant(density: number): number {
  if (density >= 85) return 5;
  if (density >= 68) return 4;
  if (density >= 51) return 3;
  if (density >= 34) return 2;
  if (density >= 17) return 1;
  return 0;
}

// ── v1 limitPanelSpacingSlant 이식 ──

function limitPanelSpacingSlant(
  adjustedWidth: number,
  thickness: number,
  density: number,
): { panelCount: number; panelSpacing: number } {
  const columns = Math.floor((adjustedWidth - thickness) / 40) + 1;
  let panelCount = columns + calculateDensitySlant(density);
  let panelSpacing = (adjustedWidth - thickness) / (panelCount - 1);

  if (panelSpacing < 26) {
    panelCount = Math.floor((adjustedWidth - thickness) / 26) + 1;
    panelSpacing = (adjustedWidth - thickness) / (panelCount - 1);
  } else if (panelSpacing > 54) {
    panelCount = Math.ceil((adjustedWidth - thickness) / 54) + 1;
    panelSpacing = (adjustedWidth - thickness) / (panelCount - 1);
  }

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
  const { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel } = input;

  // 행이 1이거나 width < 78이면 Grid로 폴백
  if (numRows <= 1 || width < 78) {
    return calculateGridPanels(input as GridInput);
  }

  const adjustedWidth = width - 24;
  const panels: PanelData[] = [];
  const { panelCount, panelSpacing } = limitPanelSpacingSlant(adjustedWidth, thickness, density);

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

  // === 백패널 또는 서포트 패널 ===
  if (hasBackPanel) {
    let cy = 0;
    for (let i = 0; i < panelCount - 1; i++) {
      cy = 0;
      for (let j = 0; j < numRows; j++) {
        const rh = rowHeights[j] ?? 32;
        let x = -adjustedWidth / 2 + i * panelSpacing;
        const panelWidth = panelSpacing - thickness;

        if (j % 2 === 0) {
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

        cy += rh + thickness;
      }
    }
  } else {
    // 서포트 패널
    const supPanelWidth = 12;
    let cy = 0;

    for (let i = 0; i < numRows; i++) {
      const rh = rowHeights[i] ?? 32;
      const yPosition = cy + rh / 2 + thickness;
      const isEvenRow = i % 2 === 0;

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
          matType: 'verticalEdge',
          castShadow: true,
          receiveShadow: true,
        });
      });

      cy += rh + thickness;
    }
  }

  return { panels, panelCount, panelSpacing };
}

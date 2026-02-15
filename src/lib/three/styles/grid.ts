import type { PanelData, MaterialType } from '@/types/shelf';

export interface GridInput {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  density: number;
  rowHeights: number[];
  numRows: number;
  hasBackPanel: boolean;
  hardwareLayers?: number[]; // 도어/서랍이 달린 행 인덱스
}

export interface GridResult {
  panels: PanelData[];
  panelCount: number;
  panelSpacing: number;
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

function limitPanelSpacingGrid(
  width: number,
  thickness: number,
  density: number,
): { panelCount: number; panelSpacing: number } {
  const densityResult = calculateDensityGrid(width, density);
  let panelCount = densityResult.targetPanels;
  let panelSpacing = (width - thickness) / (panelCount - 1);

  const minInnerWidth = 28;
  const maxInnerWidth = 72;
  const minPanelSpacing = minInnerWidth + thickness; // 30
  const maxPanelSpacing = maxInnerWidth + thickness; // 74

  // 450cm 특수 케이스는 제약 적용하지 않음
  const is450cmSpecialCase = Math.abs(width - 450) < 5;

  if (!is450cmSpecialCase) {
    if (panelSpacing < minPanelSpacing) {
      panelCount = Math.floor((width - thickness) / minPanelSpacing) + 1;
      panelSpacing = (width - thickness) / (panelCount - 1);
    } else if (panelSpacing > maxPanelSpacing) {
      panelCount = Math.ceil((width - thickness) / maxPanelSpacing) + 1;
      panelSpacing = (width - thickness) / (panelCount - 1);
    }
  }

  return { panelCount, panelSpacing };
}

// ── v1 calculateSupportPanelPositions 이식 ──

function calculateSupportPanelPositions(
  width: number,
  thickness: number,
  panelCount: number,
  panelSpacing: number,
  density: number,
): number[] {
  const positions: number[] = [];
  const supPanelWidth = 12;

  const leftPanelX = -width / 2 + thickness + supPanelWidth / 2;
  const rightPanelX = width / 2 - thickness - supPanelWidth / 2;

  if (width < 44) {
    positions.push(leftPanelX);
    return positions;
  }

  positions.push(leftPanelX);
  positions.push(rightPanelX);

  // 256cm 이상: 중간 서포트 패널 2개 추가
  if (width >= 256) {
    const verticalPanelPositions: number[] = [];
    for (let i = 1; i < panelCount - 1; i++) {
      const panelX = -width / 2 + i * panelSpacing + thickness / 2;
      verticalPanelPositions.push(panelX);
    }

    if (verticalPanelPositions.length >= 2) {
      const totalWidth = width - thickness * 2;
      const sectionWidth = totalWidth / 3;

      const leftTargetX = -width / 2 + thickness + sectionWidth;
      const rightTargetX = -width / 2 + thickness + sectionWidth * 2;

      let leftClosestIndex = -1;
      let leftMinDistance = Infinity;
      let rightClosestIndex = -1;
      let rightMinDistance = Infinity;

      verticalPanelPositions.forEach((panelX, index) => {
        const leftDistance = Math.abs(panelX - leftTargetX);
        const rightDistance = Math.abs(panelX - rightTargetX);

        if (leftDistance < leftMinDistance) {
          leftMinDistance = leftDistance;
          leftClosestIndex = index;
        }
        if (rightDistance < rightMinDistance) {
          rightMinDistance = rightDistance;
          rightClosestIndex = index;
        }
      });

      if (leftClosestIndex >= 0) {
        const leftTargetPanelX = verticalPanelPositions[leftClosestIndex];
        positions.push(leftTargetPanelX - thickness / 2 - supPanelWidth / 2);
      }

      if (rightClosestIndex >= 0 && rightClosestIndex !== leftClosestIndex) {
        const rightTargetPanelX = verticalPanelPositions[rightClosestIndex];
        positions.push(rightTargetPanelX + thickness / 2 + supPanelWidth / 2);
      } else if (rightClosestIndex === leftClosestIndex) {
        const alternativeIndex =
          rightClosestIndex + 1 < verticalPanelPositions.length
            ? rightClosestIndex + 1
            : rightClosestIndex - 1;
        if (alternativeIndex >= 0 && alternativeIndex < verticalPanelPositions.length) {
          const rightTargetPanelX = verticalPanelPositions[alternativeIndex];
          positions.push(rightTargetPanelX + thickness / 2 + supPanelWidth / 2);
        }
      }
    }
  }

  return positions;
}

// ── 메인: Grid 패널 배치 계산 ──

export function calculateGridPanels(input: GridInput): GridResult {
  const { width, depth, thickness, density, rowHeights, numRows, hasBackPanel, hardwareLayers = [] } = input;
  const panels: PanelData[] = [];
  const hardwareSet = new Set(hardwareLayers);

  // 세로 패널 수 계산 (v1 limitPanelSpacingGrid 완전 이식)
  const { panelCount, panelSpacing } = limitPanelSpacingGrid(width, thickness, density);

  // === 가로 패널 (상단/하단 + 각 행 경계) ===
  let currentY = 0;
  for (let i = 0; i <= numRows; i++) {
    panels.push({
      w: width,
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

  // === 세로 패널 ===
  for (let i = 0; i < panelCount; i++) {
    const x = -width / 2 + i * panelSpacing;
    currentY = 1;

    for (let j = 0; j < numRows; j++) {
      const rh = rowHeights[j] ?? 32;
      panels.push({
        w: thickness,
        h: rh,
        d: depth,
        x: x + 1,
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
  const supportPositions = calculateSupportPanelPositions(
    width, thickness, panelCount, panelSpacing, density,
  );

  let cy = 0;
  for (let j = 0; j < numRows; j++) {
    const rh = rowHeights[j] ?? 32;
    const rowNeedsBackPanel = hasBackPanel || hardwareSet.has(j);

    if (rowNeedsBackPanel) {
      // 이 행은 백패널
      for (let i = 0; i < panelCount - 1; i++) {
        const xPos = -width / 2 + i * panelSpacing;
        panels.push({
          w: panelSpacing - thickness,
          h: rh,
          d: thickness,
          x: xPos + panelSpacing / 2 + 1,
          y: cy + rh / 2 + thickness,
          z: 1,
          matType: 'backPanel',
          castShadow: false,
          receiveShadow: true,
        });
      }
    } else {
      // 이 행은 보강대
      const yPosition = cy + rh / 2 + 2;
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

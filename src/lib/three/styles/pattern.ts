import type { PanelData } from '@/types/shelf';
import type { GridInput, GridResult } from './grid';

/**
 * V1 Pattern 스타일 (stylepattern_simple.js 이식)
 * Tylko 스타일 — 행마다 세로 패널 위치가 다른 비정형 패턴
 * 폭이 43cm 이하면 grid 스타일로 폴백
 */

// V1: 행별 시드 기반 난수 생성
function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
}

// V1: Tylko shift 규칙 (행 번호에 따라 좌측/우측에 12cm 고정 칸)
function getTylkoShiftRule(rowNumber: number): { type: 'none' | 'left' | 'right'; shift: boolean } {
  if (rowNumber === 1 || rowNumber === 2 || rowNumber === 6) {
    return { type: 'none', shift: false };
  } else if (rowNumber === 3 || rowNumber === 5 || rowNumber === 8 || rowNumber === 10) {
    return { type: 'left', shift: true };
  } else if (rowNumber === 4 || rowNumber === 7 || rowNumber === 9) {
    return { type: 'right', shift: true };
  } else {
    const repeatedRow = ((rowNumber - 1) % 10) + 1;
    return getTylkoShiftRule(repeatedRow);
  }
}

// V1: 행별 패널 위치 생성 (다양한 칸 크기)
function generatePanelPositions(availableWidth: number, rowNumber: number, density: number): number[] {
  const positions: number[] = [];
  const minCompartmentWidth = 28;
  const seed = rowNumber * 1234567;
  let callIndex = 0;

  const compartmentSizes = {
    small: 28,
    medium: 45,
    large: 62,
    xlarge: 75,
    xxlarge: 95,
  };

  let currentX = 0;

  while (currentX < availableWidth - minCompartmentWidth) {
    let compartmentWidth: number;
    const remainingWidth = availableWidth - currentX;
    const random = seededRandom(seed, callIndex++);

    if (remainingWidth < 50) {
      compartmentWidth = Math.min(remainingWidth, compartmentSizes.small);
    } else if (remainingWidth < 80) {
      compartmentWidth = random < 0.6 ? compartmentSizes.small : compartmentSizes.medium;
    } else {
      if (random < 0.25) {
        compartmentWidth = compartmentSizes.small;
      } else if (random < 0.5) {
        compartmentWidth = compartmentSizes.medium;
      } else if (random < 0.7) {
        compartmentWidth = compartmentSizes.large;
      } else if (random < 0.9) {
        compartmentWidth = compartmentSizes.xlarge;
      } else {
        compartmentWidth = compartmentSizes.xxlarge;
      }
    }

    currentX += compartmentWidth;

    if (currentX < availableWidth - minCompartmentWidth) {
      positions.push(currentX);
      currentX += 2; // 패널 두께
    }
  }

  // 밀도에 따른 패널 위치 조정
  const densityFactor = density / 100;
  return positions.map((pos, index) => {
    const densityShift = (densityFactor - 0.5) * 8;
    const direction = index % 2 === 0 ? 1 : -1;
    let adjusted = pos + densityShift * direction;
    adjusted = Math.max(minCompartmentWidth, Math.min(availableWidth - minCompartmentWidth, adjusted));
    return adjusted;
  });
}

export function calculatePatternPanels(input: GridInput): GridResult {
  const { width, depth, thickness, density, rowHeights, numRows, hasBackPanel, hardwareLayers = [] } = input;
  const panels: PanelData[] = [];

  // 폭이 작으면 grid 폴백 (import 순환 방지를 위해 inline grid 계산)
  if (width <= 43) {
    // 간단한 grid: 좌우 패널만
    const panelCount = 2;
    const panelSpacing = width - thickness;

    let currentY = 0;
    for (let i = 0; i <= numRows; i++) {
      panels.push({
        w: width, h: thickness, d: depth,
        x: 0, y: currentY + thickness / 2, z: depth / 2,
        matType: 'horizontalBase', castShadow: true, receiveShadow: true,
      });
      if (i < numRows && i < rowHeights.length) currentY += rowHeights[i] + thickness;
    }
    for (let i = 0; i < panelCount; i++) {
      const x = -width / 2 + i * panelSpacing;
      currentY = 1;
      for (let j = 0; j < numRows; j++) {
        const rh = rowHeights[j] ?? 32;
        panels.push({
          w: thickness, h: rh, d: depth,
          x: x + 1, y: currentY + rh / 2 + thickness / 2, z: depth / 2,
          matType: 'verticalBase', castShadow: true, receiveShadow: true,
        });
        currentY += rh + thickness;
      }
    }
    return { panels, panelCount, panelSpacing };
  }

  // === 가로 패널 (행 경계) ===
  let currentY = 0;
  for (let i = 0; i <= numRows; i++) {
    panels.push({
      w: width, h: thickness, d: depth,
      x: 0, y: currentY + thickness / 2, z: depth / 2,
      matType: 'horizontalBase', castShadow: true, receiveShadow: true,
    });
    if (i < numRows && i < rowHeights.length) currentY += rowHeights[i] + thickness;
  }

  // === 각 행별 세로 패널 (패턴) ===
  const fixedWidth = 12;
  const fullWidth = width - thickness * 2; // 좌우 끝 패널 제외 내부 폭

  // 전체 panelCount/panelSpacing (도어/서랍 계산용 — 가장 많은 패널 수 기준)
  let maxPanelCount = 2;

  for (let row = 0; row < numRows; row++) {
    const rh = rowHeights[row] ?? 32;
    const rowNumber = row + 1;
    const shiftRule = getTylkoShiftRule(rowNumber);

    // Y 위치 계산
    let y = thickness;
    for (let r = 0; r < row; r++) {
      y += (rowHeights[r] ?? 32) + thickness;
    }
    const rowCenterY = y + rh / 2;

    // 좌우 끝 패널 (항상 존재)
    const leftX = -width / 2 + thickness / 2;
    const rightX = width / 2 - thickness / 2;

    panels.push({
      w: thickness, h: rh, d: depth,
      x: leftX, y: rowCenterY, z: depth / 2,
      matType: 'verticalBase', castShadow: true, receiveShadow: true,
    });
    panels.push({
      w: thickness, h: rh, d: depth,
      x: rightX, y: rowCenterY, z: depth / 2,
      matType: 'verticalBase', castShadow: true, receiveShadow: true,
    });

    let areaStart: number;
    let areaWidth: number;

    if (shiftRule.type === 'left') {
      // 좌측에 12cm 고정 칸 → 구분 패널
      const shiftPanelX = leftX + thickness / 2 + fixedWidth + thickness / 2;
      panels.push({
        w: thickness, h: rh, d: depth,
        x: shiftPanelX, y: rowCenterY, z: depth / 2,
        matType: 'verticalBase', castShadow: true, receiveShadow: true,
      });
      areaStart = shiftPanelX + thickness / 2;
      areaWidth = rightX - thickness / 2 - areaStart;
    } else if (shiftRule.type === 'right') {
      // 우측에 12cm 고정 칸 → 구분 패널
      const shiftPanelX = rightX - thickness / 2 - fixedWidth - thickness / 2;
      panels.push({
        w: thickness, h: rh, d: depth,
        x: shiftPanelX, y: rowCenterY, z: depth / 2,
        matType: 'verticalBase', castShadow: true, receiveShadow: true,
      });
      areaStart = leftX + thickness / 2;
      areaWidth = shiftPanelX - thickness / 2 - areaStart;
    } else {
      areaStart = leftX + thickness / 2;
      areaWidth = fullWidth;
    }

    // 내부 패턴 패널 생성
    const panelPositions = generatePanelPositions(areaWidth, rowNumber, density);
    panelPositions.forEach((pos) => {
      const absX = areaStart + pos;
      panels.push({
        w: thickness, h: rh, d: depth,
        x: absX, y: rowCenterY, z: depth / 2,
        matType: 'verticalBase', castShadow: true, receiveShadow: true,
      });
    });

    // 행별 총 패널 수 (좌+우+shift+내부)
    const rowPanelCount = 2 + (shiftRule.shift ? 1 : 0) + panelPositions.length;
    if (rowPanelCount > maxPanelCount) maxPanelCount = rowPanelCount;
  }

  // === 백패널 또는 서포트 패널 (행별 판단) ===
  const hardwareSet = new Set(hardwareLayers);
  const supPanelWidth = 12;
  let cy = 0;
  for (let row = 0; row < numRows; row++) {
    const rh = rowHeights[row] ?? 32;
    const rowNeedsBackPanel = hasBackPanel || hardwareSet.has(row);

    if (rowNeedsBackPanel) {
      panels.push({
        w: width - thickness * 2, h: rh, d: thickness,
        x: 0, y: cy + rh / 2 + thickness, z: 1,
        matType: 'backPanel', castShadow: false, receiveShadow: true,
      });
    } else {
      const yPosition = cy + rh / 2 + thickness;
      panels.push({
        w: supPanelWidth, h: rh, d: thickness,
        x: -width / 2 + supPanelWidth / 2 + thickness, y: yPosition, z: thickness / 2,
        matType: 'supportPanel', castShadow: true, receiveShadow: true,
      });
      if (width >= 44) {
        panels.push({
          w: supPanelWidth, h: rh, d: thickness,
          x: width / 2 - supPanelWidth / 2 - thickness, y: yPosition, z: thickness / 2,
          matType: 'supportPanel', castShadow: true, receiveShadow: true,
        });
      }
    }
    cy += rh + thickness;
  }

  // panelSpacing은 grid 방식처럼 등간격이 아니므로, 대략값 사용
  const approxPanelSpacing = width / maxPanelCount;

  return { panels, panelCount: maxPanelCount, panelSpacing: approxPanelSpacing };
}

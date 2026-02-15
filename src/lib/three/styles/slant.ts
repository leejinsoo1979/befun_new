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

const SLANT_D0_BOUNDARIES = [30, 69, 136, 200, 264, 325, 383, 438];
const SLANT_D100_BOUNDARIES = [30, 57, 84, 111, 138, 165, 192, 219, 246, 273, 300, 327, 354, 381, 408, 435];
const MIN_SLANT_SPACING = 30;

// ── 좌이격(slantGap) lookup table ──
// Tylko에서 실측: width → 좌이격 (프레임 좌측 ~ 내부 첫 패널 거리)
// w≥107부터 9cm 단위로 +1 안정 증가, 칸수 변경과 무관하게 연속
// gap=7 at w=69, 9cm step from w=107 onward, extrapolated to w=450
const SLANT_GAP_THRESHOLDS = [
  69, 72, 78, 83, 89, 94, 100, // gap 7~13 (smaller steps)
  107, 116, 125, 134, 143, 152, 161, 170, 179, 188, // gap 14~23 (9cm steps)
  197, 206, 215, 224, 233, 242, 251, 260, 269, 278, // gap 24~33
  287, 296, 305, 314, 323, 332, 341, 350, 359, 368, // gap 34~43
  377, 386, 395, 404, 413, 422, 431, 440, 449,       // gap 44~52
];
const SLANT_GAP_BASE = 7; // gap value at first threshold

function getSlantGap(width: number): number {
  if (width < SLANT_GAP_THRESHOLDS[0]) return SLANT_GAP_BASE;
  let gap = SLANT_GAP_BASE;
  for (let i = 0; i < SLANT_GAP_THRESHOLDS.length; i++) {
    if (width >= SLANT_GAP_THRESHOLDS[i]) {
      gap = SLANT_GAP_BASE + i;
    } else {
      break;
    }
  }
  return gap;
}

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
): { panelCount: number; panelSpacing: number; compartments: number } {
  let compartments = calculateSlantCompartments(width, density);

  // 최소 spacing 제약: 칸 너비가 30cm 미만이면 칸 수 축소
  const maxCompartments = Math.floor((adjustedWidth - thickness) / MIN_SLANT_SPACING);
  if (maxCompartments > 0 && compartments > maxCompartments) {
    compartments = maxCompartments;
  }

  const panelCount = compartments + 1;
  const panelSpacing = (adjustedWidth - thickness) / compartments;

  return { panelCount, panelSpacing, compartments };
}

// ── 서포트 패널 위치 ──

function calculateSlantSupportPanelPositions(
  adjustedWidth: number,
  thickness: number,
  panelCount: number,
  panelSpacing: number,
  slantOffset: number,
  isEvenRow: boolean,
): number[] {
  const positions: number[] = [];
  const supPanelWidth = 12;
  const halfAdj = adjustedWidth / 2;

  // 좌/우 서포트 패널: 프레임 안쪽에 배치
  let leftPanelX = -halfAdj + thickness + supPanelWidth / 2;
  let rightPanelX = halfAdj - thickness - supPanelWidth / 2;

  if (adjustedWidth < 80) {
    positions.push(rightPanelX);
    return positions;
  }

  positions.push(leftPanelX);
  positions.push(rightPanelX);

  // 256cm+ 중간 서포트 패널: 내부 세로 패널 근처 배치
  if (adjustedWidth >= 256 && panelCount > 2) {
    const internalPositions: number[] = [];
    for (let i = 1; i < panelCount - 1; i++) {
      const baseX = -halfAdj + i * panelSpacing;
      const panelX = isEvenRow
        ? baseX - slantOffset
        : baseX + slantOffset;
      internalPositions.push(panelX);
    }

    if (internalPositions.length >= 2) {
      const totalWidth = adjustedWidth - thickness * 2;
      const sectionWidth = totalWidth / 3;

      const leftTargetX = -halfAdj + thickness + sectionWidth;
      const rightTargetX = -halfAdj + thickness + sectionWidth * 2;

      let leftIdx = -1, leftDist = Infinity;
      let rightIdx = -1, rightDist = Infinity;

      internalPositions.forEach((px, idx) => {
        const ld = Math.abs(px - leftTargetX);
        const rd = Math.abs(px - rightTargetX);
        if (ld < leftDist) { leftDist = ld; leftIdx = idx; }
        if (rd < rightDist) { rightDist = rd; rightIdx = idx; }
      });

      if (leftIdx >= 0) {
        positions.push(internalPositions[leftIdx]);
      }
      if (rightIdx >= 0 && rightIdx !== leftIdx) {
        positions.push(internalPositions[rightIdx]);
      }
    }
  }

  return positions;
}

// ── 메인: Slant 패널 배치 계산 ──

export function calculateSlantPanels(input: SlantInput): SlantResult {
  const { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel, hardwareLayers = [] } = input;

  // 행이 1이거나 width < 69이면 Grid로 폴백
  if (numRows <= 1 || width < 69) {
    return calculateGridPanels(input as GridInput);
  }

  const adjustedWidth = width - 24;
  const panels: PanelData[] = [];
  const hardwareSet = new Set(hardwareLayers);
  const { panelCount, panelSpacing, compartments } = calculateSlantSpacing(width, adjustedWidth, thickness, density);

  // 좌이격 기반 slantOffset 계산
  const slantGap = getSlantGap(width);
  // slantOffset = panelSpacing - slantGap (내부 패널이 프레임으로부터 slantGap만큼 떨어지도록)
  const slantOffset = Math.max(0, panelSpacing - slantGap);
  const halfAdj = adjustedWidth / 2;

  // === 가로 패널 (수평 선반) ===
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
  // i=0 (좌 프레임), i=panelCount-1 (우 프레임): 고정 (지그재그 없음)
  // i=1 ~ panelCount-2 (내부 칸막이): 행별 지그재그

  for (let i = 0; i < panelCount; i++) {
    const isFrame = (i === 0 || i === panelCount - 1);
    const baseX = -halfAdj + i * panelSpacing;
    currentY = 1;

    for (let j = 0; j < numRows; j++) {
      const rh = rowHeights[j] ?? 32;
      let panelX: number;

      if (isFrame) {
        // 프레임 패널: 고정 위치
        panelX = baseX;
      } else {
        // 내부 패널: 짝수행 좌로, 홀수행 우로 이동
        if (j % 2 === 0) {
          panelX = baseX - slantOffset;
        } else {
          panelX = baseX + slantOffset;
        }
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

  // === 백패널 또는 서포트 패널 (행별) ===
  const supPanelWidth = 12;
  let cy = 0;

  for (let j = 0; j < numRows; j++) {
    const rh = rowHeights[j] ?? 32;
    const rowNeedsBackPanel = hasBackPanel || hardwareSet.has(j);
    const isEvenRow = j % 2 === 0;

    if (rowNeedsBackPanel) {
      // 백패널: 각 칸(compartment)의 실제 좌/우 세로 패널 위치 기반
      for (let i = 0; i < compartments; i++) {
        const leftPanelIdx = i;
        const rightPanelIdx = i + 1;
        const isLeftFrame = (leftPanelIdx === 0);
        const isRightFrame = (rightPanelIdx === panelCount - 1);

        const leftBaseX = -halfAdj + leftPanelIdx * panelSpacing;
        const rightBaseX = -halfAdj + rightPanelIdx * panelSpacing;

        let leftX: number, rightX: number;

        if (isLeftFrame) {
          leftX = leftBaseX;
        } else {
          leftX = isEvenRow ? leftBaseX - slantOffset : leftBaseX + slantOffset;
        }

        if (isRightFrame) {
          rightX = rightBaseX;
        } else {
          rightX = isEvenRow ? rightBaseX - slantOffset : rightBaseX + slantOffset;
        }

        const bpLeft = leftX + thickness / 2;
        const bpRight = rightX - thickness / 2;
        const bpWidth = bpRight - bpLeft;

        if (bpWidth > 0) {
          panels.push({
            w: bpWidth,
            h: rh,
            d: thickness,
            x: bpLeft + bpWidth / 2,
            y: cy + rh / 2 + thickness,
            z: thickness / 2,
            matType: 'backPanel',
            castShadow: false,
            receiveShadow: true,
          });
        }
      }
    } else {
      // 서포트(후면보강대) 패널
      const yPosition = cy + rh / 2 + thickness;
      const supportPositions = calculateSlantSupportPanelPositions(
        adjustedWidth, thickness, panelCount, panelSpacing, slantOffset, isEvenRow,
      );

      supportPositions.forEach((position) => {
        // 프레임 범위 내로 클램핑
        const clampedPos = Math.max(
          -halfAdj + thickness + supPanelWidth / 2,
          Math.min(halfAdj - thickness - supPanelWidth / 2, position),
        );
        panels.push({
          w: supPanelWidth,
          h: rh,
          d: thickness,
          x: clampedPos,
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

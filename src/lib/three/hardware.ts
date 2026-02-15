import type { StyleType } from '@/types/shelf';
import { calculateSlantSpacing } from './styles/slant';
import { calculateInternalWidths } from './styles/gradient';
import { calculateGaps } from './styles/pixel';

// ── 도어 데이터 ──

export interface DoorPlacement {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  pivotOffsetX: number; // geometry.translate for hinge pivot
  layerIndex: number;
}

// ── 서랍 데이터 ──

export interface DrawerPlacement {
  x: number;
  y: number;
  z: number;
  compartmentWidth: number;
  rowHeight: number;
  drawerDepth: number;
  layerIndex: number;
}

// ── 도어 배치 상수 ──

const DOOR_GAP = 0.6;
const DRAWER_GAP = 0.3;

// ── Grid 스타일 도어 배치 계산 ──

export function calculateGridDoors(
  layerIndex: number,
  width: number,
  depth: number,
  thickness: number,
  rowHeights: number[],
  panelCount: number,
  panelSpacing: number,
): DoorPlacement[] {
  const placements: DoorPlacement[] = [];

  let currentY = 0;
  for (let i = 0; i < layerIndex; i++) {
    currentY += rowHeights[i] + thickness;
  }

  const doorHeight = rowHeights[layerIndex] - DOOR_GAP;
  const totalCompartments = panelCount - 1;

  for (let i = 0; i < totalCompartments; i++) {
    const xPosition = -width / 2 + i * panelSpacing;
    const yPosition = currentY + rowHeights[layerIndex] / 2 + thickness;
    const doorWidth = panelSpacing - thickness - DOOR_GAP;

    placements.push({
      x: xPosition + panelSpacing - 1.2,
      y: yPosition,
      z: depth - 1,
      width: doorWidth,
      height: doorHeight,
      pivotOffsetX: -doorWidth / 2 + 1,
      layerIndex,
    });
  }

  return placements;
}

// ── Grid 스타일 서랍 배치 계산 ──

export function calculateGridDrawers(
  layerIndex: number,
  width: number,
  depth: number,
  thickness: number,
  rowHeights: number[],
  panelCount: number,
  panelSpacing: number,
): DrawerPlacement[] {
  const placements: DrawerPlacement[] = [];
  const drawerDepth = depth - thickness;

  let currentY = 0;
  for (let i = 0; i < layerIndex; i++) {
    currentY += rowHeights[i] + thickness;
  }

  const totalCompartments = panelCount - 1;

  for (let i = 0; i < totalCompartments; i++) {
    const xPosition = -width / 2 + i * panelSpacing;
    const yPosition = currentY + rowHeights[layerIndex] / 2 + thickness;

    placements.push({
      x: xPosition + panelSpacing / 2 + 1,
      y: yPosition,
      z: 0,
      compartmentWidth: panelSpacing,
      rowHeight: rowHeights[layerIndex],
      drawerDepth,
      layerIndex,
    });
  }

  return placements;
}

// ── Slant 스타일 도어/서랍 배치 (Grid fallback 포함) ──

// ── Slant 세로 패널 실제 x 좌표 배열 생성 (slant.ts와 동일 로직) ──

function getSlantVerticalPanelXPositions(
  width: number,
  thickness: number,
  panelCount: number,
  panelSpacing: number,
  rowIndex: number,
): number[] {
  const slantMargin = width >= 78 ? 24 : 14;
  const adjustedWidth = width - slantMargin;
  const baseMargin = (width - adjustedWidth) / 2;
  const maxSlantOffset = baseMargin - thickness;
  const slantOffset = Math.min(adjustedWidth / panelCount / 4, maxSlantOffset);
  const isEvenRow = rowIndex % 2 === 0;

  const positions: number[] = [];
  for (let i = 0; i < panelCount; i++) {
    const baseX = -adjustedWidth / 2 + i * panelSpacing;
    // slant.ts 세로 패널과 완전 동일
    if (isEvenRow) {
      positions.push(baseX - slantOffset);
    } else {
      positions.push(baseX + slantOffset + 2);
    }
  }
  return positions;
}

export function calculateSlantDoors(
  layerIndex: number,
  width: number,
  depth: number,
  thickness: number,
  rowHeights: number[],
  numRows: number,
  panelCount: number,
  panelSpacing: number,
): DoorPlacement[] {
  if (numRows <= 1 || width < 44) {
    return calculateGridDoors(layerIndex, width, depth, thickness, rowHeights, panelCount, panelSpacing);
  }

  const placements: DoorPlacement[] = [];
  const panelPositions = getSlantVerticalPanelXPositions(width, thickness, panelCount, panelSpacing, layerIndex);

  let currentY = 0;
  for (let i = 0; i < layerIndex; i++) {
    currentY += rowHeights[i] + thickness;
  }

  const doorHeight = rowHeights[layerIndex] - DOOR_GAP;

  for (let i = 0; i < panelCount - 1; i++) {
    const leftPanelX = panelPositions[i];   // 좌측 세로 패널 center
    const rightPanelX = panelPositions[i + 1]; // 우측 세로 패널 center

    // 좌측 패널 안쪽 면 = leftPanelX + thickness/2
    // 우측 패널 안쪽 면 = rightPanelX - thickness/2
    // 도어 너비 = 두 안쪽 면 사이 - DOOR_GAP
    const innerLeft = leftPanelX + thickness / 2;
    const innerRight = rightPanelX - thickness / 2;
    const doorWidth = (innerRight - innerLeft) - DOOR_GAP;

    // 도어 우측 끝 = placement.x + 1 (Door.tsx의 pivotOffsetX 로직)
    // 도어 우측 끝이 innerRight - DOOR_GAP/2 에 오도록
    const doorRightEdge = innerRight - DOOR_GAP / 2;
    const hingeX = doorRightEdge - 1;

    const yPosition = currentY + rowHeights[layerIndex] / 2 + thickness;

    placements.push({
      x: hingeX,
      y: yPosition,
      z: depth - 1,
      width: doorWidth,
      height: doorHeight,
      pivotOffsetX: -doorWidth / 2 + 1,
      layerIndex,
    });
  }

  return placements;
}

export function calculateSlantDrawers(
  layerIndex: number,
  width: number,
  depth: number,
  thickness: number,
  rowHeights: number[],
  numRows: number,
  panelCount: number,
  panelSpacing: number,
): DrawerPlacement[] {
  if (numRows <= 1 || width < 44) {
    return calculateGridDrawers(layerIndex, width, depth, thickness, rowHeights, panelCount, panelSpacing);
  }

  const placements: DrawerPlacement[] = [];
  const panelPositions = getSlantVerticalPanelXPositions(width, thickness, panelCount, panelSpacing, layerIndex);
  const drawerDepth = depth - thickness;

  let currentY = 0;
  for (let i = 0; i < layerIndex; i++) {
    currentY += rowHeights[i] + thickness;
  }

  for (let i = 0; i < panelCount - 1; i++) {
    const leftPanelX = panelPositions[i];
    const rightPanelX = panelPositions[i + 1];
    const centerX = (leftPanelX + rightPanelX) / 2;
    const compartmentW = rightPanelX - leftPanelX;
    const yPosition = currentY + rowHeights[layerIndex] / 2 + thickness;

    placements.push({
      x: centerX,
      y: yPosition,
      z: 0,
      compartmentWidth: compartmentW,
      rowHeight: rowHeights[layerIndex],
      drawerDepth,
      layerIndex,
    });
  }

  return placements;
}

// ── Gradient 세로 패널 x 좌표 배열 (gradient.ts와 동일) ──

function getGradientVerticalPanelXPositions(
  width: number,
  thickness: number,
  density: number,
): number[] {
  if (width < 60) return []; // Grid fallback이므로 빈 배열

  const columnCount = Math.floor((width - thickness) / 40) + 1;
  const internalWidths = calculateInternalWidths(columnCount, width - 2 * thickness, density, thickness);

  const positions: number[] = [];
  // gradient.ts: 좌측부터 x = -width/2 + thickness/2, 각 칸 폭만큼 누적
  let x = -width / 2 + thickness / 2;
  positions.push(x);
  for (let i = 0; i < internalWidths.length; i++) {
    x += internalWidths[i] + thickness;
    positions.push(x);
  }
  return positions;
}

// ── Gradient 도어 배치 ──

function calculateGradientDoors(
  layerIndex: number,
  width: number,
  depth: number,
  thickness: number,
  rowHeights: number[],
  density: number,
): DoorPlacement[] {
  const panelPositions = getGradientVerticalPanelXPositions(width, thickness, density);
  if (panelPositions.length < 2) return [];

  const placements: DoorPlacement[] = [];

  let currentY = 0;
  for (let i = 0; i < layerIndex; i++) {
    currentY += rowHeights[i] + thickness;
  }

  const doorHeight = rowHeights[layerIndex] - DOOR_GAP;

  for (let i = 0; i < panelPositions.length - 1; i++) {
    const leftPanelX = panelPositions[i];
    const rightPanelX = panelPositions[i + 1];
    const innerLeft = leftPanelX + thickness / 2;
    const innerRight = rightPanelX - thickness / 2;
    const doorWidth = (innerRight - innerLeft) - DOOR_GAP;

    const doorRightEdge = innerRight - DOOR_GAP / 2;
    const hingeX = doorRightEdge - 1;
    const yPosition = currentY + rowHeights[layerIndex] / 2 + thickness;

    placements.push({
      x: hingeX,
      y: yPosition,
      z: depth - 1,
      width: doorWidth,
      height: doorHeight,
      pivotOffsetX: -doorWidth / 2 + 1,
      layerIndex,
    });
  }

  return placements;
}

// ── Gradient 서랍 배치 ──

function calculateGradientDrawers(
  layerIndex: number,
  width: number,
  depth: number,
  thickness: number,
  rowHeights: number[],
  density: number,
): DrawerPlacement[] {
  const panelPositions = getGradientVerticalPanelXPositions(width, thickness, density);
  if (panelPositions.length < 2) return [];

  const placements: DrawerPlacement[] = [];
  const drawerDepth = depth - thickness;

  let currentY = 0;
  for (let i = 0; i < layerIndex; i++) {
    currentY += rowHeights[i] + thickness;
  }

  for (let i = 0; i < panelPositions.length - 1; i++) {
    const leftPanelX = panelPositions[i];
    const rightPanelX = panelPositions[i + 1];
    const centerX = (leftPanelX + rightPanelX) / 2;
    const compartmentW = rightPanelX - leftPanelX;
    const yPosition = currentY + rowHeights[layerIndex] / 2 + thickness;

    placements.push({
      x: centerX,
      y: yPosition,
      z: 0,
      compartmentWidth: compartmentW,
      rowHeight: rowHeights[layerIndex],
      drawerDepth,
      layerIndex,
    });
  }

  return placements;
}

// ── Pixel 세로 패널 x 좌표 배열 (pixel.ts와 동일 로직) ──

function getPixelVerticalPanelXPositions(
  width: number,
  thickness: number,
  density: number,
  rowIndex: number,
  numRows: number,
): number[] {
  if (numRows === 1 || width < 78) return [];

  const gaps = calculateGaps(width, density, thickness);
  const isEvenRow = rowIndex % 2 === 0;
  const positions: number[] = [];

  let x = -width / 2 + thickness / 2;

  for (let i = 0; i <= gaps.length; i++) {
    // pixel.ts: 짝수행은 양끝 세로 패널 스킵
    if (isEvenRow && (i === 0 || i === gaps.length)) {
      if (i < gaps.length) x += gaps[i] + thickness;
      continue;
    }
    positions.push(x - thickness / 2);
    if (i < gaps.length) x += gaps[i] + thickness;
  }

  return positions;
}

// ── Pixel 도어 배치 ──

function calculatePixelDoors(
  layerIndex: number,
  width: number,
  depth: number,
  thickness: number,
  rowHeights: number[],
  numRows: number,
  density: number,
): DoorPlacement[] {
  if (numRows === 1 || width < 78) return [];

  const gaps = calculateGaps(width, density, thickness);
  const placements: DoorPlacement[] = [];
  const isEvenRow = layerIndex % 2 === 0;
  const isFirstRow = layerIndex === 0;
  const isLastRow = layerIndex === numRows - 1;
  const isOddTotalRows = numRows % 2 !== 0;

  let currentY = 0;
  for (let i = 0; i < layerIndex; i++) {
    currentY += rowHeights[i] + thickness;
  }

  let x = -width / 2 + thickness / 2;

  for (let i = 0; i < gaps.length; i++) {
    const panelWidth = gaps[i];
    const yPosition = currentY + rowHeights[layerIndex] / 2 + thickness;

    // v1 skip logic: 짝수행 양끝 스킵
    let shouldCreate = true;
    if (isEvenRow && (i === 0 || i === gaps.length - 1)) {
      shouldCreate = false;
    }

    // v1 center gap skip logic
    let isCenterGap = false;
    if ((width < 110 && i === 1) ||
        (width < 185 && i === 2) ||
        (width < 241 && (i === 2 || i === 4)) ||
        (width < 319 && (i === 2 || i === 4 || i === 6)) ||
        (width < 396 && (i === 2 || i === 4 || i === 6 || i === 8)) ||
        (width <= 450 && (i === 2 || i === 4 || i === 6 || i === 8 || i === 10))) {
      isCenterGap = true;
    }
    if (width >= 110 && isCenterGap && (isFirstRow || (isLastRow && isOddTotalRows))) {
      shouldCreate = false;
    }

    if (shouldCreate) {
      const doorWidth = panelWidth - DOOR_GAP;
      const doorHeight = rowHeights[layerIndex] - DOOR_GAP;

      // v1 Pixel: position = x + panelWidth - 1, translate = -panelWidth/2 + 1
      // v1은 doorWidth가 아니라 panelWidth로 translate함 (Grid와 다름)
      placements.push({
        x: x + panelWidth - 1,
        y: yPosition,
        z: depth - 1,
        width: doorWidth,
        height: doorHeight,
        pivotOffsetX: -panelWidth / 2 + 1,
        layerIndex,
      });
    }

    x += panelWidth + thickness;
  }

  return placements;
}

// ── Pixel 서랍 배치 ──

function calculatePixelDrawers(
  layerIndex: number,
  width: number,
  depth: number,
  thickness: number,
  rowHeights: number[],
  numRows: number,
  density: number,
): DrawerPlacement[] {
  if (numRows === 1 || width < 78) return [];

  const gaps = calculateGaps(width, density, thickness);
  const placements: DrawerPlacement[] = [];
  const isEvenRow = layerIndex % 2 === 0;
  const isFirstRow = layerIndex === 0;
  const isLastRow = layerIndex === numRows - 1;
  const isOddTotalRows = numRows % 2 !== 0;
  const drawerDepth = depth - thickness;

  let currentY = 0;
  for (let i = 0; i < layerIndex; i++) {
    currentY += rowHeights[i] + thickness;
  }

  let x = -width / 2 + thickness / 2;

  for (let i = 0; i < gaps.length; i++) {
    const panelWidth = gaps[i];
    const yPosition = currentY + rowHeights[layerIndex] / 2 + thickness;

    let shouldCreate = true;
    if (isEvenRow && (i === 0 || i === gaps.length - 1)) {
      shouldCreate = false;
    }

    let isCenterGap = false;
    if ((width < 110 && i === 1) ||
        (width < 185 && i === 2) ||
        (width < 241 && (i === 2 || i === 4)) ||
        (width < 319 && (i === 2 || i === 4 || i === 6)) ||
        (width < 396 && (i === 2 || i === 4 || i === 6 || i === 8)) ||
        (width <= 450 && (i === 2 || i === 4 || i === 6 || i === 8 || i === 10))) {
      isCenterGap = true;
    }
    if (width >= 110 && isCenterGap && (isFirstRow || (isLastRow && isOddTotalRows))) {
      shouldCreate = false;
    }

    if (shouldCreate) {
      placements.push({
        x: x + panelWidth / 2,
        y: yPosition,
        z: 0,
        compartmentWidth: panelWidth,
        rowHeight: rowHeights[layerIndex],
        drawerDepth,
        layerIndex,
      });
    }

    x += panelWidth + thickness;
  }

  return placements;
}

// ── 스타일별 도어/서랍 배치 라우터 ──

export function calculateDoorPlacements(
  style: StyleType,
  layerIndex: number,
  width: number,
  depth: number,
  thickness: number,
  rowHeights: number[],
  numRows: number,
  panelCount: number,
  panelSpacing: number,
  density?: number,
): DoorPlacement[] {
  switch (style) {
    case 'slant':
      return calculateSlantDoors(layerIndex, width, depth, thickness, rowHeights, numRows, panelCount, panelSpacing);
    case 'gradient':
      return calculateGradientDoors(layerIndex, width, depth, thickness, rowHeights, density ?? 50);
    case 'pixel':
      return calculatePixelDoors(layerIndex, width, depth, thickness, rowHeights, numRows, density ?? 50);
    case 'mosaic':
      return []; // Mosaic은 불규칙 셀 구조 — 도어 미지원 (v1과 동일)
    case 'grid':
    default:
      return calculateGridDoors(layerIndex, width, depth, thickness, rowHeights, panelCount, panelSpacing);
  }
}

export function calculateDrawerPlacements(
  style: StyleType,
  layerIndex: number,
  width: number,
  depth: number,
  thickness: number,
  rowHeights: number[],
  numRows: number,
  panelCount: number,
  panelSpacing: number,
  density?: number,
): DrawerPlacement[] {
  switch (style) {
    case 'slant':
      return calculateSlantDrawers(layerIndex, width, depth, thickness, rowHeights, numRows, panelCount, panelSpacing);
    case 'gradient':
      return calculateGradientDrawers(layerIndex, width, depth, thickness, rowHeights, density ?? 50);
    case 'pixel':
      return calculatePixelDrawers(layerIndex, width, depth, thickness, rowHeights, numRows, density ?? 50);
    case 'mosaic':
      return []; // Mosaic은 불규칙 셀 구조 — 서랍 미지원 (v1과 동일)
    case 'grid':
    default:
      return calculateGridDrawers(layerIndex, width, depth, thickness, rowHeights, panelCount, panelSpacing);
  }
}

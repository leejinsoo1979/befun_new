import type { StyleType } from '@/types/shelf';

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
  // Slant은 rows <= 1 이거나 width < 78이면 Grid와 동일
  if (numRows <= 1 || width < 78) {
    return calculateGridDoors(layerIndex, width, depth, thickness, rowHeights, panelCount, panelSpacing);
  }

  const adjustedWidth = width - 24;
  const placements: DoorPlacement[] = [];
  const isEvenRow = layerIndex % 2 === 0;
  const offset = isEvenRow ? 0 : panelSpacing / 2;

  let currentY = 0;
  for (let i = 0; i < layerIndex; i++) {
    currentY += rowHeights[i] + thickness;
  }

  const doorHeight = rowHeights[layerIndex] - DOOR_GAP;
  const doorCount = isEvenRow ? panelCount - 1 : panelCount - 2;

  for (let i = 0; i < doorCount; i++) {
    const panelWidth = panelSpacing - thickness;
    const xPosition = -adjustedWidth / 2 + offset + i * panelSpacing + panelSpacing / 2;
    const yPosition = currentY + rowHeights[layerIndex] / 2 + thickness;

    placements.push({
      x: xPosition + panelWidth / 2 - 0.5,
      y: yPosition,
      z: depth - 1,
      width: panelWidth - DOOR_GAP,
      height: doorHeight,
      pivotOffsetX: -(panelWidth - DOOR_GAP) / 2 + 1,
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
  if (numRows <= 1 || width < 78) {
    return calculateGridDrawers(layerIndex, width, depth, thickness, rowHeights, panelCount, panelSpacing);
  }

  const adjustedWidth = width - 24;
  const placements: DrawerPlacement[] = [];
  const isEvenRow = layerIndex % 2 === 0;
  const offset = isEvenRow ? 0 : panelSpacing / 2;
  const drawerDepth = depth - thickness;
  const drawerCount = isEvenRow ? panelCount - 1 : panelCount - 2;

  let currentY = 0;
  for (let i = 0; i < layerIndex; i++) {
    currentY += rowHeights[i] + thickness;
  }

  for (let i = 0; i < drawerCount; i++) {
    const xPosition = -adjustedWidth / 2 + offset + i * panelSpacing + panelSpacing / 2;
    const yPosition = currentY + rowHeights[layerIndex] / 2 + thickness;

    placements.push({
      x: xPosition,
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
): DoorPlacement[] {
  switch (style) {
    case 'slant':
      return calculateSlantDoors(layerIndex, width, depth, thickness, rowHeights, numRows, panelCount, panelSpacing);
    case 'grid':
    case 'pixel':
    case 'gradient':
    case 'mosaic':
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
): DrawerPlacement[] {
  switch (style) {
    case 'slant':
      return calculateSlantDrawers(layerIndex, width, depth, thickness, rowHeights, numRows, panelCount, panelSpacing);
    case 'grid':
    case 'pixel':
    case 'gradient':
    case 'mosaic':
    default:
      return calculateGridDrawers(layerIndex, width, depth, thickness, rowHeights, panelCount, panelSpacing);
  }
}

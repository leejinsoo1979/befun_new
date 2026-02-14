import type { PanelData } from '@/types/shelf';
import { calculateGridPanels, type GridInput, type GridResult } from './grid';

export interface MosaicInput {
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

export type MosaicResult = GridResult & { cells: MosaicCell[] };

interface MosaicCell {
  x: number;
  y: number;
  width: number;
  height: number;
  colorIndex: number;
}

// ── v1 generateMosaicPattern 이식 ──

function generateMosaicPattern(
  gridColumns: number,
  gridRows: number,
  density: number,
): MosaicCell[] {
  const cells: MosaicCell[] = [];
  const occupied: boolean[][] = Array.from({ length: gridRows }, () =>
    new Array(gridColumns).fill(false),
  );

  const densityFactor = density / 100;
  const maxCellWidth = Math.max(2, Math.floor(gridColumns * 0.4 * densityFactor));
  const maxCellHeight = Math.max(2, Math.floor(gridRows * 0.4 * densityFactor));

  // 시드 기반 난수 (결정적 패턴)
  let seed = Math.floor(density * 1000 + gridColumns * 100 + gridRows);
  function seededRandom(): number {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridColumns; col++) {
      if (occupied[row][col]) continue;

      const cellWidth = Math.min(
        maxCellWidth,
        Math.floor(seededRandom() * 3) + 1,
        gridColumns - col,
      );
      const cellHeight = Math.min(
        maxCellHeight,
        Math.floor(seededRandom() * 3) + 1,
        gridRows - row,
      );

      // 점유 확인
      let canPlace = true;
      for (let r = row; r < row + cellHeight && canPlace; r++) {
        for (let c = col; c < col + cellWidth && canPlace; c++) {
          if (r >= gridRows || c >= gridColumns || occupied[r][c]) canPlace = false;
        }
      }

      const finalWidth = canPlace ? cellWidth : 1;
      const finalHeight = canPlace ? cellHeight : 1;

      cells.push({
        x: col,
        y: row,
        width: finalWidth,
        height: finalHeight,
        colorIndex: Math.floor(seededRandom() * 4),
      });

      for (let r = row; r < row + finalHeight; r++) {
        for (let c = col; c < col + finalWidth; c++) {
          if (r < gridRows && c < gridColumns) {
            occupied[r][c] = true;
          }
        }
      }
    }
  }

  return cells;
}

// ── 메인: Mosaic 패널 배치 계산 ──

export function calculateMosaicPanels(input: MosaicInput): MosaicResult {
  const { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel } = input;

  const baseUnit = 30;
  const gridColumns = Math.floor(width / baseUnit);
  const gridRows = Math.floor(height / (rowHeights[0] ?? 32));

  if (gridColumns < 2 || gridRows < 2) {
    const gridResult = calculateGridPanels(input as GridInput);
    return { ...gridResult, cells: [] };
  }

  const panels: PanelData[] = [];
  const cells = generateMosaicPattern(gridColumns, gridRows, density);

  const cellWidth = width / gridColumns;
  const cellHeight = height / gridRows;

  cells.forEach((cell) => {
    const w = cell.width * cellWidth;
    const h = cell.height * cellHeight;
    const x = cell.x * cellWidth - width / 2 + w / 2;
    const y = cell.y * cellHeight + h / 2 + thickness;

    // 모자이크 셀은 특수 matType — colorIndex로 색상 구별
    // 기본 matType 사용하되 Shelf에서 colorIndex 기반 분기
    panels.push({
      w: w - thickness,
      h: h - thickness,
      d: depth,
      x,
      y,
      z: depth / 2,
      matType: 'verticalBase', // Shelf 컴포넌트에서 colorIndex 기반 색상 처리
      castShadow: true,
      receiveShadow: true,
    });
  });

  // 백패널 또는 서포트 패널 (행별 판단)
  const hardwareSet = new Set(hardwareLayers);
  const supPanelWidth = 12;
  let cy = 0;
  for (let i = 0; i < numRows; i++) {
    const rh = rowHeights[i] ?? 32;
    const yPosition = cy + rh / 2 + thickness;
    const rowNeedsBackPanel = hasBackPanel || hardwareSet.has(i);

    if (rowNeedsBackPanel) {
      panels.push({
        w: width - thickness * 2,
        h: rh,
        d: thickness,
        x: 0,
        y: yPosition,
        z: thickness / 2,
        matType: 'backPanel',
        castShadow: false,
        receiveShadow: true,
      });
    } else {
      panels.push({
        w: supPanelWidth, h: rh, d: thickness,
        x: -width / 2 + supPanelWidth / 2 + thickness, y: yPosition, z: thickness / 2,
        matType: 'verticalEdge', castShadow: true, receiveShadow: true,
      });

      if (width >= 44) {
        panels.push({
          w: supPanelWidth, h: rh, d: thickness,
          x: width / 2 - supPanelWidth / 2 - thickness, y: yPosition, z: thickness / 2,
          matType: 'verticalEdge', castShadow: true, receiveShadow: true,
        });
      }
    }

    cy += rh + thickness;
  }

  return { panels, panelCount: cells.length, panelSpacing: 0, cells };
}

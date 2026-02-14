import type { PanelData, MaterialType } from '@/types/shelf';

interface GridInput {
  width: number;
  height: number;
  depth: number;
  thickness: number;
  density: number;
  rowHeights: number[];
  numRows: number;
  hasBackPanel: boolean;
}

export interface GridResult {
  panels: PanelData[];
  panelCount: number;
  panelSpacing: number;
}

/**
 * Grid 스타일 패널 배치 계산 — v1 styleGrid.js 이식
 * 전역 변수/scene.add() 대신 순수 데이터 배열 반환
 */
export function calculateGridPanels(input: GridInput): GridResult {
  const { width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel } = input;
  const panels: PanelData[] = [];

  // 세로 패널 수 계산 (v1: limitPanelSpacingGrid)
  const baseColumns = Math.ceil((width / 450) * 7);
  const maxColumns = Math.ceil((width / 450) * 15);
  const panelCount = Math.round(baseColumns + ((maxColumns - baseColumns) * density) / 100);
  const panelSpacing = panelCount > 1 ? (width - thickness) / (panelCount - 1) : width;

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

  // === 백패널 또는 지지 패널 ===
  if (hasBackPanel) {
    let cy = 0;
    for (let i = 0; i < panelCount - 1; i++) {
      const xPos = -width / 2 + i * panelSpacing;
      cy = 0;
      for (let j = 0; j < numRows; j++) {
        const rh = rowHeights[j] ?? 32;
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
        cy += rh + thickness;
      }
    }
  } else {
    // 지지 패널 (supPanel) — 작은 수평 패널
    const supPanelWidth = 12;
    let cy = 0;
    for (let i = 0; i < panelCount - 1; i++) {
      const xPos = -width / 2 + i * panelSpacing;
      cy = 0;
      for (let j = 0; j < numRows; j++) {
        const rh = rowHeights[j] ?? 32;
        // 상단 지지
        panels.push({
          w: panelSpacing - thickness,
          h: thickness,
          d: supPanelWidth,
          x: xPos + panelSpacing / 2 + 1,
          y: cy + rh + thickness / 2,
          z: 1,
          matType: 'horizontalBase',
          castShadow: false,
          receiveShadow: false,
        });
        // 하단 지지
        panels.push({
          w: panelSpacing - thickness,
          h: thickness,
          d: supPanelWidth,
          x: xPos + panelSpacing / 2 + 1,
          y: cy + thickness + thickness / 2,
          z: 1,
          matType: 'horizontalBase',
          castShadow: false,
          receiveShadow: false,
        });
        cy += rh + thickness;
      }
    }
  }

  return { panels, panelCount, panelSpacing };
}

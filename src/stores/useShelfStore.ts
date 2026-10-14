import { create } from 'zustand';
import { supportsLongLegs, type FurnitureBaseType, type FurnitureLegFinish } from '@/lib/three/furniture-base';
import type { StyleType, RowHeight } from '@/types/shelf';
import { effectiveHardwareStyle, resolveHardwareRows } from '@/lib/three/hardware-state';
import { useHardwareStore } from './useHardwareStore';

interface ShelfState {
  // 치수
  width: number;
  height: number;
  depth: number;
  thickness: number;

  // 스타일 & 밀도
  style: StyleType;
  density: number;
  hasBackPanel: boolean;
  baseType: FurnitureBaseType;
  legFinish: FurnitureLegFinish;
  setLegFinish: (value: FurnitureLegFinish) => void;
  setBaseType: (value: FurnitureBaseType) => void;

  // 행 관리
  rowHeights: number[];
  numRows: number;

  // 패널 카운트
  panelCount: number;
  panelSpacing: number;

  // Actions
  setWidth: (w: number) => void;
  setHeight: (h: number) => void;
  setDepth: (d: number) => void;
  setStyle: (s: StyleType) => void;
  setDensity: (d: number) => void;
  setHasBackPanel: (v: boolean) => void;
  setRowHeight: (index: number, height: RowHeight) => void;
  setRowHeights: (heights: number[]) => void;
  setPanelCount: (count: number) => void;
  setPanelSpacing: (spacing: number) => void;

  // 행 수 계산 (높이 기반)
  recalculateRows: () => void;
  reconcileHardware: () => void;
}

const DEFAULT_ROW_HEIGHT = 28;

function calculateNumRows(totalHeight: number, rowHeights: number[], thickness: number): number {
  let usedHeight = thickness; // 바닥 패널
  let count = 0;
  for (let i = 0; i < rowHeights.length; i++) {
    usedHeight += rowHeights[i] + thickness;
    if (usedHeight > totalHeight) break;
    count++;
  }
  return count;
}

function correctHardware(rowHeights: number[], depth: number, numRows: number) {
  const hw = useHardwareStore.getState();
  const validRow = (row: number) => Number.isInteger(row) && row >= 0 && row < numRows;
  const doors = hw.doorsCreatedLayers.filter(validRow);
  const drawers = hw.drawersCreatedLayers.filter(validRow);
  const rows = resolveHardwareRows(doors, drawers, hw.rowStyles);
  for (const row of Object.keys(rows)) {
    const index = Number(row);
    rows[index] = effectiveHardwareStyle(rows[index], index, rowHeights, depth);
  }
  hw.restore(doors, drawers, rows);
}

export const useShelfStore = create<ShelfState>((set, get) => ({
  width: 90,
  height: 112, // 28 * 4행
  depth: 32,
  thickness: 2,
  style: 'grid',
  density: 50,
  hasBackPanel: false,
  baseType: 'standard',
  legFinish: 'silver',
  setLegFinish: value => { if (value === 'silver' || value === 'black' || value === 'panel') set({ legFinish: value }); },
  setBaseType: value => set({ baseType: value === 'legs' && supportsLongLegs(get().depth,get().style) ? 'legs' : 'standard' }),
  rowHeights: [28, 28, 28, 28],
  numRows: 4,
  panelCount: 0,
  panelSpacing: 0,

  setWidth: (w) => set({ width: Math.max(30, Math.min(450, w)) }),

  setHeight: (h) => {
    set({ height: Math.max(38, Math.min(228, h)) });
    get().recalculateRows();
  },

  setDepth: (d) => {
    const depth=Math.max(24,Math.min(40,d));
    set({depth, ...(depth<=24 ? {baseType:'standard' as const}: {})});
    get().reconcileHardware();
  },

  setStyle: (s) => set({ style: s, ...(s==='pixel' ? {baseType:'standard' as const}: {}) }),

  setDensity: (d) => set({ density: Math.max(0, Math.min(100, d)) }),

  setHasBackPanel: (v) => set({ hasBackPanel: v }),

  setRowHeight: (index, newHeight) => {
    const { numRows, rowHeights, thickness } = get();
    const newRowHeights = [...rowHeights];
    newRowHeights[index] = newHeight;

    // 행 수 유지, height만 재계산
    let totalHeight = thickness;
    for (let i = 0; i < numRows; i++) {
      totalHeight += (newRowHeights[i] ?? DEFAULT_ROW_HEIGHT) + thickness;
    }

    set({ rowHeights: newRowHeights, height: totalHeight });
    get().reconcileHardware();
  },

  setRowHeights: (heights) => {
    set({ rowHeights: heights });
    get().recalculateRows();
  },

  setPanelCount: (count) => set({ panelCount: count }),
  setPanelSpacing: (spacing) => set({ panelSpacing: spacing }),

  recalculateRows: () => {
    const { height, rowHeights, thickness } = get();
    const numRows = calculateNumRows(height, rowHeights, thickness);

    // 행이 부족하면 기본 높이로 추가
    const newRowHeights = [...rowHeights];
    while (newRowHeights.length < 12) {
      newRowHeights.push(DEFAULT_ROW_HEIGHT);
    }

    set({ numRows, rowHeights: newRowHeights });

    get().reconcileHardware();
  },

  reconcileHardware: () => {
    const { rowHeights, depth, numRows } = get();
    correctHardware(rowHeights, depth, numRows);
  },
}));

import { create } from 'zustand';
import type { StyleType, RowHeight } from '@/types/shelf';

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
}

const DEFAULT_ROW_HEIGHT = 32;

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

export const useShelfStore = create<ShelfState>((set, get) => ({
  width: 90,
  height: 128, // 32 * 4행
  depth: 30,
  thickness: 2,
  style: 'grid',
  density: 50,
  hasBackPanel: false,
  rowHeights: [32, 32, 32, 32],
  numRows: 4,
  panelCount: 0,
  panelSpacing: 0,

  setWidth: (w) => set({ width: Math.max(30, Math.min(450, w)) }),

  setHeight: (h) => {
    set({ height: Math.max(38, Math.min(228, h)) });
    get().recalculateRows();
  },

  setDepth: (d) => set({ depth: Math.max(24, Math.min(42, d)) }),

  setStyle: (s) => set({ style: s }),

  setDensity: (d) => set({ density: Math.max(0, Math.min(100, d)) }),

  setHasBackPanel: (v) => set({ hasBackPanel: v }),

  setRowHeight: (index, height) => {
    const rowHeights = [...get().rowHeights];
    rowHeights[index] = height;
    set({ rowHeights });
    get().recalculateRows();
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
  },
}));

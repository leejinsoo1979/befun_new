import { create } from 'zustand';

/** 측정 모드(그리드 판재 + hover 치수) 표시 상태 — 화면 전용, 설계 데이터 아님 */
interface MeasureState {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (value: boolean) => void;
}

export const useMeasureStore = create<MeasureState>((set) => ({
  enabled: false,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
  setEnabled: (enabled) => set({ enabled }),
}));

/** Panel mesh의 userData 키. 값은 판재 박스 치수(cm, 로컬 X·Y·Z). */
export const PANEL_DIMENSIONS_KEY = 'befunPanel';
export interface PanelDimensions { w: number; h: number; d: number }

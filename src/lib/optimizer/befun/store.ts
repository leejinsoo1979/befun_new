import { create } from 'zustand';
import type { Panel } from '@/lib/optimizer/upstream/editor/CNCOptimizer/types';
import type { BefunDesign } from './model';
import type { CncPanelBox } from './toCncPanels';

/** /optimizer 진입 시점의 Befun 디자인 스냅샷. upstream useCncPanelData가 이 패널을 읽는다. */
interface BefunCncState {
  design: BefunDesign | null;
  panels: Panel[];
  boxes: CncPanelBox[];
  setSnapshot: (design: BefunDesign, panels: Panel[], boxes: CncPanelBox[]) => void;
}

export const useBefunCncStore = create<BefunCncState>((set) => ({
  design: null,
  panels: [],
  boxes: [],
  setSnapshot: (design, panels, boxes) => set({ design, panels, boxes }),
}));

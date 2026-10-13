// [Befun shim] Befun에는 스케치 컨버팅이 없으므로 항상 cnc=null(가구 패널 사용)이다.
import { create } from 'zustand';
import type { Panel } from '../../CNCOptimizer/types';

export interface SketchConversion {
  parts: unknown[];
  panels: Panel[];
  unitIds: string[];
  unfinished: number;
  workspace?: string;
  editMode?: 'planning' | 'sketch';
}

export const useConversionStore = create<{ sketchActive: boolean; cnc: SketchConversion | null }>(() => ({
  sketchActive: false,
  cnc: null,
}));

export async function restoreCncConversion(): Promise<void> {}

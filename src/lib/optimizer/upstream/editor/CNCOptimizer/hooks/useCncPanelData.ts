// [Befun shim] 250709in은 배치 가구(useLivePanelData)·스케치 컨버팅에서 판재를 뽑는다.
// Befun에서는 /optimizer 진입 때 만든 Befun 디자인 스냅샷의 판재를 쓴다(src/lib/optimizer/befun).
import { useBefunCncStore } from '@/lib/optimizer/befun/store';
import type { Panel } from '../types';

const EMPTY_PANELS: Panel[] = [];

export function useCncPanelData(enabled = true) {
  const panels = useBefunCncStore((s) => s.panels);
  return { panels: enabled ? panels : EMPTY_PANELS };
}

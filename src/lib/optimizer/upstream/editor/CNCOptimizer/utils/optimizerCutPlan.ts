import { buildSheetCutPlan, type SheetCutPlan } from '@/lib/optimizer/upstream/utils/cut/guillotine';
import { buildSequenceForPanel } from '@/lib/optimizer/upstream/utils/cut/simulate';
import type { CutStep } from '@/lib/optimizer/upstream/types/cutlist';
import { panelBounds } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/geometry';
import type { OptimizedResult } from '../types';
import { placedBoardPanel } from './sheetDrawing';

export interface OptimizerCutSettings {
  kerf: number;
  optimizationType?: string;
  trimLeft?: number; trimRight?: number; trimTop?: number; trimBottom?: number;
}
export type ListedCut = CutStep & { sheetNumber: number; globalOrder: number };

/** 옵티마이저가 한 번 생성한 원장별 트리와 순서. 목록과 재생에 같은 객체를 전달한다. */
export function buildOptimizerCutPlans(results: OptimizedResult[], settings: OptimizerCutSettings) {
  const plans: Array<SheetCutPlan | null> = [], errors: Array<string | null> = [], cuts: ListedCut[] = [];
  results.forEach((result, index) => {
    const sheetId = String(index + 1);
    const panels = result.panels.map(p => ({ ...p, ...panelBounds(placedBoardPanel(p)) }));
    if (settings.optimizationType === 'OPTIMAL_CNC') {
      // 네스팅 라우터 윤곽은 컷쏘 트리로 대체하지 않는다.
      plans.push(null); errors.push('네스팅 윤곽은 컷쏘 재단 순서가 아닙니다.');
      for (const panel of panels) for (const [n, cut] of buildSequenceForPanel({ mode: 'free', sheetW: result.stockPanel.width,
        sheetH: result.stockPanel.height, kerf: settings.kerf, placement: panel, sheetId, panelId: panel.id }).entries()) {
        cuts.push({ ...cut, id: `${sheetId}:panel:${panel.id}:cut:${n + 1}`, sheetNumber: index + 1, globalOrder: cuts.length + 1 });
      }
      return;
    }
    try {
      const plan = buildSheetCutPlan({ sheetId, rootId: result.stockPanel.id, width: result.stockPanel.width, height: result.stockPanel.height, kerf: settings.kerf, panels,
        primaryAxis: ['OPTIMAL_W', 'BY_WIDTH'].includes(settings.optimizationType ?? '') ? 'y' : 'x',
        // 기존 옵티마이저 원장 좌표는 작은 Y 쪽에 trimBottom을 더한다.
        trim: { left: settings.trimLeft, right: settings.trimRight, top: settings.trimBottom, bottom: settings.trimTop } });
      plans.push(plan); errors.push(null);
      for (const cut of plan.operations) cuts.push({ ...cut, sheetNumber: index + 1, globalOrder: cuts.length + 1 });
    } catch (error) { plans.push(null); errors.push(error instanceof Error ? error.message : String(error)); }
  });
  return { plans, cuts, errors };
}

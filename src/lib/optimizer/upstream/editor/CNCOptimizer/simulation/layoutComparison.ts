import type { OptimizedResult } from '../types';
import { placedBoardPanel } from '../utils/sheetDrawing';
import { panelBounds } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/geometry';
import { cursorAt, interpolate, type MachiningProgram } from './program';
import { bandingAt, focusedBanding } from './edgeBandingProcess';

/** 원장 도면과 같은 회전 계약. 저장된 원본은 수정하지 않는다. */
export function placedLayoutPanels(result: OptimizedResult) {
  return result.panels.map(panel => ({ ...panel, ...panelBounds(placedBoardPanel(panel)) }));
}

/** 반송 위치가 아닌 원장 기준으로, 실제 재생 시계의 절단 위치를 대조한다. */
export function layoutComparisonAt(program: MachiningProgram, elapsedMs: number) {
  const cursor = cursorAt(program, elapsedMs);
  const current = program.steps[cursor.index];
  const activeStock = current?.kind === 'band' ? focusedBanding(bandingAt(program, elapsedMs))?.stock
    : current && program.stocks.find(s => s.id === current.stockId);
  const done = new Set(program.steps.slice(0, cursor.index).map(s => s.id));
  const finished = new Set(program.stocks.filter(s => s.panel && (!s.availableAfter || done.has(s.availableAfter))).map(s => s.panel!.id));
  const cuts = program.steps.flatMap((step, index) => {
    if ((step.kind !== 'saw' && step.kind !== 'mill') || index > cursor.index || (index === cursor.index && cursor.progress === 0)) return [];
    const stock = program.stocks.find(s => s.id === step.stockId)!;
    const origin = stock.sourceOrigin ?? [0, 0, 0];
    const tool = program.tools.find(t => t.id === step.toolId);
    if (!tool) return [];
    const tip = interpolate(step.from, step.to, index === cursor.index ? cursor.progress : 1);
    if(step.kind==='mill') return [{id:step.id,active:index===cursor.index,kerf:tool.diameter,
      x1:origin[0]+step.from[0],y1:origin[1]+step.from[1],x2:origin[0]+tip[0],y2:origin[1]+tip[1]}];
    if (tool.kind !== 'saw') return [];
    const axis = step.from[0] === step.to[0] ? 1 : 0;
    const bounded = (v: number) => Math.max(0, Math.min(stock.size[axis], v));
    const a = bounded(step.from[axis]), b = bounded(tip[axis]);
    if (Math.abs(a - b) < 1e-6) return [];
    return [{ id: step.id, active: index === cursor.index, kerf: tool.kerf,
      x1: origin[0] + (axis === 0 ? a : step.from[0]), y1: origin[1] + (axis === 1 ? a : step.from[1]),
      x2: origin[0] + (axis === 0 ? b : tip[0]), y2: origin[1] + (axis === 1 ? b : tip[1]) }];
  });
  return { cursor, current, activeStock, finished, cuts };
}

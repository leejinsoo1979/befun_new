import type { SheetCutPlan, CutTreeNode } from '@/lib/optimizer/upstream/utils/cut/guillotine';
import type { OptimizedResult } from '../types';
import type { MachiningProgram, Point3, ReplayStock, ReplayTool } from './program';
import { placedLayoutPanels } from './layoutComparison';
import { panelSawProcess } from './panelSawProcess';
import type { RoutingOptions } from './routingPaths';
import { appendEdgeBanding, type BandingOptions } from './edgeBandingProcess';

export type LayoutSawOptions = {
  kerf: number;
  /** 공구 규격과 화면 재생 이송속도. 실제 NC 운전 조건을 추정하지 않는다. */
  saw: Extract<ReplayTool, { kind: 'saw' }>;
  feedMmPerSecond: number;
  routing?: RoutingOptions;
  banding?: BandingOptions;
};

/** 확정 배치를 조각별 전폭 재단/반송으로 재생한다. 원본 배치와 제조 데이터는 변경하지 않는다. */
export function programFromLayout(result: OptimizedResult, plan: SheetCutPlan, options: LayoutSawOptions): MachiningProgram {
  const { kerf, saw, feedMmPerSecond } = options;
  const { stockPanel } = result;
  const panels = placedLayoutPanels(result);
  if (![kerf, stockPanel.thickness, stockPanel.width, stockPanel.height, feedMmPerSecond].every(v => typeof v === 'number' && Number.isFinite(v) && v > 0)) {
    throw new Error('원장 크기·두께·톱날 절단폭·재생 속도를 확인해 주십시오.');
  }
  if (!panels.length) throw new Error('재단할 패널이 없습니다.');
  if (result.isOversized) throw new Error('비규격 묶음은 실제 원장 배치가 아니므로 재생할 수 없습니다.');
  const thickness = stockPanel.thickness!, radius = saw.diameter / 2, eps = 1e-6;
  if (!Number.isFinite(radius) || radius <= thickness * 2) throw new Error('입력한 톱 지름으로 현재 원장 두께를 관통할 수 없습니다.');
  if (!plan || Math.abs(plan.kerf - kerf) > eps) throw new Error('톱날 절단폭이 재단 목록 생성 이후 바뀌었습니다. 현재 설정으로 재계산해 주십시오.');
  const same = (a: number, b: number) => Math.abs(a - b) <= eps;
  if (!same(plan.root.rect.width, stockPanel.width) || !same(plan.root.rect.height, stockPanel.height)
    || plan.panels.length !== panels.length || panels.some(p => {
      const original = plan.panels.find(q => q.id === p.id);
      return !original || (['x', 'y', 'width', 'height'] as const).some(k => !same(original[k], p[k]));
    })) throw new Error('원본 배치가 재단 트리 생성 이후 바뀌었습니다. 현재 설정으로 재계산해 주십시오.');
  const root = plan.root;
  const byId = new Map(panels.map(p => [p.id, p]));
  const stocks: ReplayStock[] = [], steps: MachiningProgram['steps'] = [];
  const sourceSize: Point3 = [stockPanel.width, stockPanel.height, thickness];
  const panelPieces: string[] = [];
  const nodes = new Map<string, CutTreeNode>();
  const register = (node: CutTreeNode, availableAfter?: string) => {
    const final = !node.split && node.panelIds.length === 1;
    const origin: Point3 = [node.rect.x, node.rect.y, 0];
    const stock: ReplayStock = { id: node.id, name: final ? byId.get(node.panelIds[0])!.name : node.panelIds.length ? '재단 조각' : '잔재',
      size: [node.rect.width, node.rect.height, thickness], position: origin, color: '#bdc9d2', availableAfter,
      sourceOrigin: origin, sourceSize, purpose: final ? 'panel' : node.panelIds.length ? 'workpiece' : 'offcut',
      panel: final ? { ...byId.get(node.panelIds[0])! } : undefined };
    stocks.push(stock);
    return stock;
  };
  // 구조는 읽기만 한다. 절단을 추가하거나 재정렬하지 않는다.
  const collect = (node: CutTreeNode, availableAfter?: string) => {
    nodes.set(node.id, node);
    const stock = register(node, availableAfter);
    if (node.split) {
      stock.retiredAfter = node.split.operationId;
      node.split.children.forEach(child => collect(child, node.split!.operationId));
    } else if (node.panelIds.length) panelPieces.push(node.id);
  };
  collect(root);
  stocks[0].name = '원장';
  stocks[0].layout = panels.map(p => ({ id: p.id, name: p.name, x: p.x, y: p.y, width: p.width, height: p.height, rotated: p.rotated }));
  for (const operation of plan.operations) {
    const node = nodes.get(operation.regionId)!;
    const { axis, pos } = operation, center = pos - node.rect[axis];
    const start: Point3 = axis === 'x' ? [center, -radius, -thickness] : [-radius, center, -thickness];
    const end: Point3 = axis === 'x' ? [center, node.rect.height + radius, -thickness] : [node.rect.width + radius, center, -thickness];
    steps.push({ id: operation.id, label: operation.label!, kind: 'saw', stockId: node.id, toolId: saw.id, from: start, to: end,
      durationMs: Math.hypot(...start.map((v, i) => v - end[i])) / feedMmPerSecond * 1000 });
  }
  if (panelPieces.length !== panels.length) throw new Error('최종 판재 수가 원본 배치와 일치하지 않습니다.');
  return panelSawProcess({ units: 'mm', source: { label: '현재 배치 · 조각별 전폭 재단', machineModel: '참조 기계', verifiedSequence: false },
    stocks, tools: [{ ...saw, kerf }], steps, layoutAudit: { uncutEdges: [], panelPieces, cutCount: plan.operations.length, addedCuts: 0 } }, result, feedMmPerSecond, options.routing,
    options.banding ? sawn => appendEdgeBanding(sawn, result, options.banding!) : undefined);
}

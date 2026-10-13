import type { CutAxis, CutStep } from '@/lib/optimizer/upstream/types/cutlist';

export interface CutRect { x: number; y: number; width: number; height: number }
/** 폭·높이는 회전이 이미 적용된 원장 좌표다. */
export interface CutPanel extends CutRect { id: string; name?: string }
export interface CutTreeNode {
  id: string;
  rect: CutRect;
  panelIds: string[];
  split?: { operationId: string; axis: CutAxis; center: number; kerfRect: CutRect; children: CutTreeNode[]; kind: 'trim' | 'part' };
}
export interface CutOperation extends CutStep {
  regionId: string;
  region: CutRect;
  childRegionIds: string[];
  kerfRect: CutRect;
  kind: 'trim' | 'part';
  completedPanelIds: string[];
}
export interface SheetCutPlan {
  sheetId: string;
  kerf: number;
  panels: CutPanel[];
  root: CutTreeNode;
  operations: CutOperation[];
  areas: { sheet: number; panels: number; kerf: number; offcut: number };
}
export interface GuillotineOptions {
  sheetId: string;
  rootId?: string;
  width: number;
  height: number;
  panels: CutPanel[];
  kerf: number;
  primaryAxis?: CutAxis;
  trim?: { left?: number; right?: number; top?: number; bottom?: number };
}
const EPS = 1e-6;
const area = (r: CutRect) => r.width * r.height;
const sameRect = (a: CutRect, b: CutRect) => (['x', 'y', 'width', 'height'] as const).every(k => Math.abs(a[k] - b[k]) <= EPS);

/**
 * 원장 → 띠 → 판재의 공통 재단 원본. 패널별 네 변 순회나 재생 전용 보정은 없다.
 * 각 절단은 현재 조각 전폭을 관통하고, 그 조각에서 톱폭을 한 번 뺀다.
 * 표시/비용/시뮬레이션은 이 operations 순서를 그대로 사용한다.
 */
export function buildSheetCutPlan(options: GuillotineOptions): SheetCutPlan {
  const { width, height, sheetId, kerf, primaryAxis = 'x', trim = {} } = options;
  const panels = options.panels.map(p => ({ ...p }));
  if (![width, height].every(v => Number.isFinite(v) && v > 0) || !Number.isFinite(kerf) || kerf < 0) throw new Error('원장 크기와 톱날 절단폭을 확인해 주십시오.');
  if (new Set(panels.map(p => p.id)).size !== panels.length) throw new Error('패널 ID가 중복되어 재단 트리를 만들 수 없습니다.');
  const margins = { left: trim.left ?? 0, right: trim.right ?? 0, top: trim.top ?? 0, bottom: trim.bottom ?? 0 };
  if (Object.values(margins).some(v => !Number.isFinite(v) || v < 0) || margins.left + margins.right >= width || margins.top + margins.bottom >= height) throw new Error('원장 외곽 Trim 설정을 확인해 주십시오.');
  for (const p of panels) {
    if (![p.x, p.y, p.width, p.height].every(Number.isFinite) || p.width <= 0 || p.height <= 0 || p.x < -EPS || p.y < -EPS || p.x + p.width > width + EPS || p.y + p.height > height + EPS) throw new Error(`${p.name ?? p.id}: 패널이 원장 범위를 벗어나 있습니다.`);
    if (p.x < margins.left - EPS || p.y < margins.top - EPS || p.x + p.width > width - margins.right + EPS || p.y + p.height > height - margins.bottom + EPS) throw new Error(`${p.name ?? p.id}: 현재 Trim 설정과 배치가 다릅니다. 재계산해 주십시오.`);
  }
  for (let i = 0; i < panels.length; i++) for (let j = i + 1; j < panels.length; j++) {
    const a = panels[i], b = panels[j];
    if (Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > EPS && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > EPS) throw new Error(`${a.name ?? a.id} / ${b.name ?? b.id}: 배치가 겹쳐 있습니다.`);
  }
  const byId = new Map(panels.map(p => [p.id, p]));
  let serial = 0;
  const make = (rect: CutRect, ids: string[]): CutTreeNode => {
    if (++serial > 10000) throw new Error('재단 조각이 너무 많아 현재 배치를 처리할 수 없습니다.');
    return { id: serial === 1 ? options.rootId ?? sheetId : `${sheetId}:region:${serial}`, rect, panelIds: ids };
  };
  const root = make({ x: 0, y: 0, width, height }, panels.map(p => p.id));
  const split = (node: CutTreeNode, axis: CutAxis, center: number, kind: 'trim' | 'part') => {
    const dim = axis === 'x' ? 'width' : 'height', r = node.rect, low = r[axis], high = low + r[dim];
    const a = Math.max(low, center - kerf / 2), b = Math.min(high, center + kerf / 2);
    const before = node.panelIds.filter(id => { const p = byId.get(id)!; return p[axis] + p[dim] <= a + EPS; });
    const after = node.panelIds.filter(id => byId.get(id)![axis] >= b - EPS);
    if (before.length + after.length !== node.panelIds.length) throw new Error('절단폭이 패널을 침범합니다.');
    const children: CutTreeNode[] = [];
    // Trim이 전부 톱밥이 되면 0폭 조각은 만들지 않는다.
    if (a > low + EPS) children.push(make({ ...r, [dim]: a - low }, before));
    if (b < high - EPS) children.push(make({ ...r, [axis]: b, [dim]: high - b }, after));
    node.split = { operationId: '', axis, center, kind, kerfRect: { ...r, [axis]: a, [dim]: b - a }, children };
  };
  // 설정된 외곽 Trim만 선행한다. 원장 모서리를 가상으로 다시 자르지 않는다.
  let core = root;
  if (panels.length) for (const [axis, amount, center] of [
    ['x', margins.left, margins.left - kerf / 2],
    ['x', margins.right, width - margins.right + kerf / 2],
    ['y', margins.top, margins.top - kerf / 2],
    ['y', margins.bottom, height - margins.bottom + kerf / 2],
  ] as const) {
    if (amount <= EPS) continue;
    split(core, axis, center, 'trim');
    core = core.split!.children.find(n => n.panelIds.length > 0)!;
  }
  const visit = (node: CutTreeNode, runAxis: CutAxis) => {
    if (!node.panelIds.length) return;
    if (node.panelIds.length === 1 && sameRect(node.rect, byId.get(node.panelIds[0])!)) {
      const { x, y, width: w, height: h } = byId.get(node.panelIds[0])!;
      node.rect = { x, y, width: w, height: h }; return;
    }
    const candidates: { axis: CutAxis; center: number }[] = [];
    for (const axis of [runAxis, runAxis === 'x' ? 'y' : 'x'] as const) {
      const dim = axis === 'x' ? 'width' : 'height', r = node.rect;
      const centers = [...new Set(node.panelIds.flatMap(id => { const p = byId.get(id)!; return [p[axis] - kerf / 2, p[axis] + p[dim] + kerf / 2]; }))].sort((a, b) => a - b);
      for (const center of centers) {
        const a = center - kerf / 2, b = center + kerf / 2;
        if (b <= r[axis] + EPS || a >= r[axis] + r[dim] - EPS) continue;
        if (node.panelIds.every(id => { const p = byId.get(id)!; return p[axis] + p[dim] <= a + EPS || p[axis] >= b - EPS; })) candidates.push({ axis, center });
      }
    }
    const cut = candidates[0];
    if (!cut) throw new Error(`${node.panelIds.map(id => byId.get(id)!.name ?? id).join(', ')}: 톱날 ${kerf}mm가 들어갈 전폭 직선이 없습니다. 배치를 유지한 컷쏘 재단이 불가능합니다.`);
    split(node, cut.axis, cut.center, 'part');
    node.split!.children.forEach(child => visit(child, cut.axis));
  };
  visit(core, primaryAxis);
  const ordered: CutTreeNode[] = [];
  // Trim은 전부 먼저, 같은 축의 뒤쪽 잔여 원장은 연속 이송, 분리한 띠는 이후 교차 재단한다.
  let first = root;
  while (first.split?.kind === 'trim') { ordered.push(first); first = first.split.children.find(n => n.panelIds.length > 0)!; }
  const queue = [first];
  while (queue.length) {
    let node: CutTreeNode | undefined = queue.shift();
    while (node?.split) {
      ordered.push(node);
      const { children, axis } = node.split, back = children[children.length - 1];
      const follow = back?.split?.axis === axis ? back : undefined;
      for (const child of children) if (child.split && child !== follow) queue.push(child);
      node = follow;
    }
  }
  const operations = ordered.map((node, order): CutOperation => {
    const s = node.split!, cross = s.axis === 'x' ? 'y' : 'x', dim = s.axis === 'x' ? 'height' : 'width';
    const id = `${sheetId}:cut:${order + 1}`; s.operationId = id;
    const completedPanelIds = s.children.filter(n => !n.split && n.panelIds.length === 1).flatMap(n => n.panelIds);
    const remaining = s.children.find(n => n.panelIds.length) ?? s.children[0];
    return { id, order, sheetId, axis: s.axis, pos: s.center, spanStart: node.rect[cross], spanEnd: node.rect[cross] + node.rect[dim],
      before: { width: node.rect.width, length: node.rect.height }, result: { width: remaining?.rect.width ?? 0, length: remaining?.rect.height ?? 0 },
      kerf, source: 'engine', label: `${s.kind === 'trim' ? '외곽 Trim' : s.axis === primaryAxis ? '띠 켜기' : '교차 재단'} ${order + 1}`,
      regionId: node.id, region: { ...node.rect }, childRegionIds: s.children.map(n => n.id), kerfRect: { ...s.kerfRect }, kind: s.kind,
      completedPanelIds, yieldsPanelId: completedPanelIds.length === 1 ? completedPanelIds[0] : undefined };
  });
  const leaves: CutTreeNode[] = [];
  const collect = (n: CutTreeNode) => { if (n.split) n.split.children.forEach(collect); else leaves.push(n); }; collect(root);
  return { sheetId, kerf, panels, root, operations, areas: { sheet: width * height, panels: panels.reduce((n, p) => n + area(p), 0),
    kerf: operations.reduce((n, c) => n + area(c.kerfRect), 0), offcut: leaves.filter(n => !n.panelIds.length).reduce((n, p) => n + area(p.rect), 0) } };
}

/** 실제 완료된 절단만 반영한 남은 조각. 미래 경계나 완료 판정을 미리 만들지 않는다. */
export function remainingCutRegions(plan: SheetCutPlan, count: number): CutTreeNode[] {
  const done = new Set(plan.operations.slice(0, count).map(c => c.id));
  const walk = (node: CutTreeNode): CutTreeNode[] => node.split && done.has(node.split.operationId) ? node.split.children.flatMap(walk) : [node];
  return walk(plan.root);
}

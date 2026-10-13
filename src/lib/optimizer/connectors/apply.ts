import type { Panel } from '@/lib/optimizer/upstream/editor/CNCOptimizer/types';
import type { Boring, BoringFace, ConnectorSlot, PanelBoringData, PanelType } from '@/lib/optimizer/upstream/domain/boring/types';
import type { Axis, CncPanelBox, CncPanelKind } from '@/lib/optimizer/befun/toCncPanels';
import { findConnector, type ConnectorOp, type ConnectorSpec } from './ovvo';

/** 관리자가 고른 커넥터 모델. body = 가로판·세로판 접합, back = 백패널·보강대 접합. 빈 값이면 해당 접합부 없음. */
export interface ConnectorSelection {
  body?: string;
  back?: string;
  /** 커넥터 모델별 공장 커터 공구 번호(MPR TNO) */
  toolNumbers?: Record<string, number>;
}

export interface ConnectorJoint {
  id: string;
  group: 'body' | 'back';
  endPanelId: string;
  facePanelId: string;
  endPanelName: string;
  facePanelName: string;
  lengthMm: number;
  connector: string;
  positionsMm: number[];
}

export interface ConnectorReport {
  joints: ConnectorJoint[];
  connectorCount: Record<string, number>;
  warnings: string[];
}

const TOL = 0.05; // cm
/** 마구리 쪽으로 열린 보링 표시. MPR 검증의 '구멍 외곽이 판재 밖' 예외에 쓴다. */
export const OPEN_EDGE_NOTE = '가장자리 개방';
const CM = 10;

interface Box3 {
  box: CncPanelBox;
  min: [number, number, number];
  max: [number, number, number];
}

const toBox3 = (box: CncPanelBox): Box3 => {
  const size = [box.w, box.h, box.d];
  const center = [box.x, box.y, box.z];
  return {
    box,
    min: [0, 1, 2].map((i) => center[i] - size[i] / 2) as [number, number, number],
    max: [0, 1, 2].map((i) => center[i] + size[i] / 2) as [number, number, number],
  };
};

const STRUCTURAL: CncPanelKind[] = ['horizontal', 'vertical', 'back', 'support'];
const groupOf = (a: CncPanelKind, b: CncPanelKind): 'body' | 'back' =>
  a === 'back' || a === 'support' || b === 'back' || b === 'support' ? 'back' : 'body';

/**
 * 커넥터 중심 위치(접합선 위, mm). OVVO 권장: 끝에서 edgeMin~edgeMax, 중심 간격 ccMin~ccMax.
 * 양 끝 커넥터를 끝에서 같은 거리에 두고, 사이 간격이 ccMax를 넘지 않게 개수를 늘린다.
 */
export function connectorPositions(lengthMm: number, spec: ConnectorSpec): number[] {
  const { edgeMin, edgeMax, ccMin, ccMax } = spec.spacing;
  if (lengthMm < 2 * edgeMin) return lengthMm >= edgeMin ? [lengthMm / 2] : [];
  const edge = Math.min(edgeMax ?? edgeMin, Math.max(edgeMin, lengthMm * 0.15));
  const span = lengthMm - 2 * edge;
  if (span < ccMin) return [lengthMm / 2];
  const gaps = Math.max(1, Math.ceil(span / ccMax));
  return Array.from({ length: gaps + 1 }, (_, i) => edge + (span * i) / gaps);
}

interface PanelOps {
  borings: Boring[];
  slots: ConnectorSlot[];
}

/**
 * Befun 판재 박스에서 "마구리가 다른 판재 면에 닿는" 접합부를 찾아, 선택한 커넥터의 가공을
 * 양쪽 판재의 manufacturingBoring(250709in MPR·시뮬레이션 원본)으로 넣는다.
 */
export function applyConnectors(panels: Panel[], boxes: CncPanelBox[], selection: ConnectorSelection): ConnectorReport {
  const report: ConnectorReport = { joints: [], connectorCount: {}, warnings: [] };
  const structural = boxes.filter((b) => STRUCTURAL.includes(b.kind)).map(toBox3);
  const panelById = new Map(panels.map((p) => [p.id, p]));
  const ops = new Map<string, PanelOps>();
  const opsOf = (id: string) => {
    let entry = ops.get(id);
    if (!entry) ops.set(id, (entry = { borings: [], slots: [] }));
    return entry;
  };

  for (const A of structural) {
    for (const B of structural) {
      if (A === B) continue;
      const k = B.box.frame.n;
      if (A.box.frame.n === k) continue; // 면-면 접합은 대상 아님
      const touchesBottom = Math.abs(A.max[k] - B.min[k]) < TOL; // A가 B 아래쪽(-n) 면에 닿음
      const touchesTop = Math.abs(A.min[k] - B.max[k]) < TOL; // A가 B 위쪽(+n) 면에 닿음
      if (!touchesBottom && !touchesTop) continue;
      const others = ([0, 1, 2] as Axis[]).filter((i) => i !== k);
      const overlap = others.map((i) => [Math.max(A.min[i], B.min[i]), Math.min(A.max[i], B.max[i])] as const);
      if (overlap.some(([lo, hi]) => hi - lo <= TOL)) continue;
      const thinA = A.box.frame.n;
      const J = others.find((i) => i !== thinA)!;
      const thicknessOverlap = overlap[others.indexOf(thinA)];
      const aThickness = A.max[thinA] - A.min[thinA];
      if (thicknessOverlap[1] - thicknessOverlap[0] < aThickness - TOL) {
        report.warnings.push(`${A.box.meshName} ↔ ${B.box.meshName}: 마구리가 상대 면에 일부만 걸쳐 커넥터를 넣지 않았습니다.`);
        continue;
      }
      const group = groupOf(A.box.kind, B.box.kind);
      const model = group === 'body' ? selection.body : selection.back;
      if (!model) continue;
      const spec = findConnector(model);
      if (!spec) { report.warnings.push(`알 수 없는 커넥터: ${model}`); continue; }
      if (!spec.autoApplicable) { report.warnings.push(`${spec.model}: ${spec.reason ?? '자동 배치 불가'}`); continue; }

      const panelA = panelById.get(A.box.panelId)!, panelB = panelById.get(B.box.panelId)!;
      const minThickness = Math.min(panelA.thickness ?? 0, panelB.thickness ?? 0);
      if (minThickness < spec.minThicknessMm) {
        report.warnings.push(`${A.box.meshName} ↔ ${B.box.meshName}: ${spec.model}는 판재 ${spec.minThicknessMm}mm 이상 필요(현재 ${minThickness}mm).`);
        continue;
      }

      const [j0, j1] = overlap[others.indexOf(J)];
      const lengthMm = (j1 - j0) * CM;
      const positions = connectorPositions(lengthMm, spec);
      if (!positions.length) { report.warnings.push(`${A.box.meshName} ↔ ${B.box.meshName}: 접합 길이 ${lengthMm}mm가 짧아 커넥터를 넣지 못했습니다.`); continue; }

      const jointId = `J${report.joints.length + 1}`;
      report.joints.push({
        id: jointId, group, endPanelId: panelA.id, facePanelId: panelB.id,
        endPanelName: panelA.name, facePanelName: panelB.name,
        lengthMm: Math.round(lengthMm * 10) / 10, connector: spec.model,
        positionsMm: positions.map((p) => Math.round(p * 10) / 10),
      });
      report.connectorCount[spec.model] = (report.connectorCount[spec.model] ?? 0) + positions.length;

      // 접합 평면: B면(k축 좌표), A가 B의 어느 쪽에 있는지
      const contactK = touchesTop ? B.max[k] : B.min[k];
      const aSide = touchesTop ? 1 : -1; // A는 B의 +n(top) 또는 -n(bottom) 쪽
      const aEdgeDir = -aSide; // A의 마구리 면이 향하는 k 방향(B 쪽)
      const aMid = (A.min[thinA] + A.max[thinA]) / 2;
      // 면 보링형(offset 있는 커넥터)은 상대 판재 안쪽으로 여유가 더 있는 쪽에 둔다(L자 끝 접합에서 판재 밖으로 나가지 않게).
      const side = B.max[thinA] - A.max[thinA] >= A.min[thinA] - B.min[thinA] ? 1 : -1;
      const aSurface = side > 0 ? A.max[thinA] : A.min[thinA];

      positions.forEach((posMm, ci) => {
        const s = j0 + posMm / CM; // 3D 접합선 좌표(cm)
        for (const [oi, base] of spec.ops.entries()) {
          const op = { ...base, model: spec.model, toolNumber: selection.toolNumbers?.[spec.model] };
          const id = `${jointId}-${ci + 1}-${oi + 1}`;
          if (op.on === 'end') addEndOp(opsOf(panelA.id), A, panelA, k, aEdgeDir, J, s, contactK, aMid, op, id);
          else if (op.on === 'face') addFaceOp(opsOf(panelB.id), B, panelB, aSide, J, s, thinA, aMid, aSurface, side, op, id);
          else addEndFaceOp(opsOf(panelA.id), A, panelA, k, aEdgeDir, J, s, contactK, side, op, id);
        }
      });
    }
  }

  for (const panel of panels) {
    const entry = ops.get(panel.id);
    if (!entry) continue;
    panel.manufacturingBoring = toBoringData(panel, boxes.find((b) => b.panelId === panel.id)!, entry);
  }
  return report;
}

// ── 좌표 변환 ──

/** 3D 점(cm) → 판재 좌표(mm). x=u, y=v, z=n(하면 0) */
function local(box: Box3, p: Record<Axis, number>): { x: number; y: number; z: number } {
  const { u, v, n } = box.box.frame;
  // 판재 치수는 0.1mm로 반올림된다(toCncPanels). 끝 좌표는 그 치수에 맞춘다.
  const snap = (value: number, axis: Axis) => {
    const size = Math.round((box.max[axis] - box.min[axis]) * CM * 10) / 10;
    return Math.abs(value - size) < 0.1 ? size : Math.abs(value) < 0.1 ? 0 : value;
  };
  return { x: snap((p[u] - box.min[u]) * CM, u), y: snap((p[v] - box.min[v]) * CM, v), z: (p[n] - box.min[n]) * CM };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** 접합선 방향(J)으로 커넥터 중심에서 offset(mm)만큼 떨어진 점들 */
function pattern(op: ConnectorOp): number[] {
  const count = op.count ?? 1, pitch = op.pitch ?? 0;
  return Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * pitch);
}

/** k축 마구리를 판재 좌표의 가공면 이름으로 */
function edgeFace(box: Box3, k: Axis, dir: number): BoringFace {
  const { u, v } = box.box.frame;
  if (k === u) return dir > 0 ? 'right' : 'left';
  if (k === v) return dir > 0 ? 'back' : 'front';
  throw new Error(`${box.box.meshName}: 마구리 축이 판재 평면에 없습니다.`);
}

function addEndOp(target: PanelOps, A: Box3, panel: Panel, k: Axis, dir: number, J: Axis, s: number, contactK: number,
  aMid: number, op: ConnectorOp & { model: string; toolNumber?: number }, id: string) {
  const face = edgeFace(A, k, dir);
  const thinA = A.box.frame.n;
  const point = (jOffsetMm: number) => {
    const p = { [k]: contactK, [J]: s + jOffsetMm / CM, [thinA]: aMid } as Record<Axis, number>;
    return local(A, p);
  };
  const z = (panel.thickness ?? 0) / 2;
  if (op.kind === 'hole') {
    for (const [hi, off] of pattern(op).entries()) {
      const c = point(off);
      target.borings.push({ id: `${id}-h${hi + 1}`, type: 'custom', face, x: r2(c.x), y: r2(c.y), z: r2(z), diameter: op.diameter, depth: op.depth, note: op.label });
    }
  } else {
    const shift = op.shift ?? 0, half = (op.travel ?? 0) / 2;
    const a = point(shift - half), b = point(shift + half);
    target.slots.push({ id, face, x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y), z: r2(z), width: op.diameter, depth: op.depth, connector: op.model, toolNumber: op.toolNumber, label: op.label });
  }
}

function addFaceOp(target: PanelOps, B: Box3, panel: Panel, aSide: number, J: Axis, s: number, thinA: Axis, aMid: number,
  aSurface: number, side: number, op: ConnectorOp & { model: string; toolNumber?: number }, id: string) {
  const face: BoringFace = aSide > 0 ? 'top' : 'bottom';
  const k = B.box.frame.n;
  // 기본은 마구리 판재 두께 중심선 위. offset이 있으면 마구리 판재 면(side 쪽)에서 offset만큼 바깥.
  const across = op.offset !== undefined ? aSurface + side * op.offset / CM : aMid;
  const point = (jOffsetMm: number) => {
    const p = { [k]: aSide > 0 ? B.max[k] : B.min[k], [J]: s + jOffsetMm / CM, [thinA]: across } as Record<Axis, number>;
    return local(B, p);
  };
  if (op.kind === 'hole') {
    for (const [hi, off] of pattern(op).entries()) {
      const c = point(off);
      target.borings.push({ id: `${id}-h${hi + 1}`, type: 'custom', face, x: r2(c.x), y: r2(c.y), diameter: op.diameter, depth: op.depth, note: op.label });
    }
  } else {
    const shift = op.shift ?? 0, half = (op.travel ?? 0) / 2;
    const a = point(shift - half), b = point(shift + half);
    target.slots.push({ id, face, x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y), width: op.diameter, depth: op.depth, connector: op.model, toolNumber: op.toolNumber, label: op.label });
  }
  void panel;
}

function addEndFaceOp(target: PanelOps, A: Box3, panel: Panel, k: Axis, dir: number, J: Axis, s: number, contactK: number,
  side: number, op: ConnectorOp & { model: string; toolNumber?: number }, id: string) {
  const thinA = A.box.frame.n;
  const face: BoringFace = side > 0 ? 'top' : 'bottom';
  // 마구리 끝(contactK)에서 판재 안쪽(−dir)으로 offset, A의 side 쪽 면
  const inK = contactK - dir * (op.offset ?? 0) / CM;
  const point = (jOffsetMm: number) => local(A, { [k]: inK, [J]: s + jOffsetMm / CM, [thinA]: side > 0 ? A.max[thinA] : A.min[thinA] } as Record<Axis, number>);
  // 지름이 offset의 두 배보다 크면 마구리 쪽으로 열린 보링(커넥터 팔이 마구리 밖으로 나온다)
  const openEdge = op.offset !== undefined && op.diameter / 2 > op.offset;
  if (op.kind === 'hole') {
    for (const [hi, off] of pattern(op).entries()) {
      const c = point(off);
      target.borings.push({ id: `${id}-h${hi + 1}`, type: 'custom', face, x: r2(c.x), y: r2(c.y), diameter: op.diameter, depth: op.depth, note: openEdge ? `${op.label} · ${OPEN_EDGE_NOTE}` : op.label });
    }
  } else {
    const half = (op.travel ?? 0) / 2;
    const a = point(-half), b = point(half);
    target.slots.push({ id, face, x1: r2(a.x), y1: r2(a.y), x2: r2(b.x), y2: r2(b.y), width: op.diameter, depth: op.depth, connector: op.model, toolNumber: op.toolNumber, label: op.label });
  }
  void panel;
}

const PANEL_TYPE: Record<CncPanelKind, PanelType> = {
  horizontal: 'shelf', vertical: 'partition', back: 'back-panel', support: 'back-panel', door: 'door', drawer: 'drawer-front',
};

function toBoringData(panel: Panel, box: CncPanelBox, entry: PanelOps): PanelBoringData {
  return {
    panelId: panel.id,
    furnitureId: 'befun',
    furnitureName: 'Befun',
    panelType: PANEL_TYPE[box.kind],
    panelName: panel.name,
    width: panel.width,
    height: panel.height,
    thickness: panel.thickness ?? 0,
    material: panel.material,
    grain: panel.grain === 'HORIZONTAL' ? 'H' : panel.grain === 'VERTICAL' ? 'V' : 'N',
    borings: entry.borings,
    connectorSlots: entry.slots,
  };
}

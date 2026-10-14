import type { PanelBoringData, BoringFace } from '@/lib/optimizer/upstream/domain/boring/types';

type Point = [number, number];
interface Cut { id: string; face: BoringFace; a: Point; b: Point; radius: number; depth: number }
const EPS = 0.0001;
const pointDistance = (p: Point, a: Point, b: Point) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / denominator)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
function segmentDistance(a: Cut, b: Cut) {
  const cross = (p: Point, q: Point, r: Point) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const intersects = cross(a.a, a.b, b.a) * cross(a.a, a.b, b.b) < 0
    && cross(b.a, b.b, a.a) * cross(b.a, b.b, a.b) < 0;
  return intersects ? 0 : Math.min(pointDistance(a.a, b.a, b.b), pointDistance(a.b, b.a, b.b),
    pointDistance(b.a, a.a, a.b), pointDistance(b.b, a.a, a.b));
}

/** Face cuts are swept capsules, not just endpoints. Opposite blind cuts must
 * not meet inside the board. Intentional overlapping housing holes belonging
 * to one connector are treated as one operation group. */
export function validateConnectorMachining(panel: PanelBoringData): string[] {
  const errors: string[] = [];
  const cuts: Cut[] = [
    ...panel.borings.map(b => ({ id: b.id, face: b.face, a: [b.x, b.y] as Point, b: [b.x, b.y] as Point, radius: b.diameter / 2, depth: b.depth })),
    ...(panel.connectorSlots ?? []).map(s => ({ id: s.id, face: s.face, a: [s.x1, s.y1] as Point, b: [s.x2, s.y2] as Point, radius: s.width / 2, depth: s.depth })),
  ];
  const generated = (id: string) => id.startsWith('connector:');
  for (const slot of panel.connectorSlots ?? []) {
    if (![slot.x1, slot.y1, slot.x2, slot.y2, slot.width, slot.depth, slot.z ?? panel.thickness / 2].every(Number.isFinite)
      || slot.width <= 0 || slot.depth <= 0) { errors.push(`${slot.id}: 유효하지 않은 슬롯 치수`); continue; }
    const r = slot.width / 2, z = slot.z ?? panel.thickness / 2;
    const inRange = (x: number, max: number) => x >= r - EPS && x <= max - r + EPS;
    if (slot.face === 'top' || slot.face === 'bottom') {
      if (![slot.x1, slot.x2].every(x => inRange(x, panel.width)) || ![slot.y1, slot.y2].every(y => inRange(y, panel.height)))
        errors.push(`${slot.id}: 슬롯 공구 반경이 판재 외곽을 벗어남`);
      if (slot.depth >= panel.thickness) errors.push(`${slot.id}: 슬롯 깊이가 판재 두께 이상`);
    } else {
      const leftRight = slot.face === 'left' || slot.face === 'right';
      const edge = slot.face === 'left' || slot.face === 'front' ? 0 : leftRight ? panel.width : panel.height;
      const onEdge = leftRight ? [slot.x1, slot.x2] : [slot.y1, slot.y2];
      const along = leftRight ? [slot.y1, slot.y2] : [slot.x1, slot.x2];
      if (onEdge.some(v => Math.abs(v - edge) > EPS) || !along.every(v => inRange(v, leftRight ? panel.height : panel.width))
        || !inRange(z, panel.thickness) || slot.depth >= (leftRight ? panel.width : panel.height))
        errors.push(`${slot.id}: 마구리 슬롯 면·범위·깊이 불일치`);
    }
  }
  const faceCuts = cuts.filter(c => c.face === 'top' || c.face === 'bottom');
  for (let i = 0; i < faceCuts.length; i++) for (let j = i + 1; j < faceCuts.length; j++) {
    const a = faceCuts[i], b = faceCuts[j];
    if (!generated(a.id) && !generated(b.id)) continue;
    const group = (id: string) => id.match(/^connector:J\d+-\d+-/)?.[0];
    if (a.face === b.face && group(a.id) && group(a.id) === group(b.id)) continue;
    if (a.face !== b.face && a.depth + b.depth < panel.thickness - EPS) continue;
    if (segmentDistance(a, b) < a.radius + b.radius - EPS)
      errors.push(`${a.id} ↔ ${b.id}: ${a.face === b.face ? '같은 면 가공 중첩' : '양면 가공이 판재 내부에서 만남'}`);
  }
  return errors;
}

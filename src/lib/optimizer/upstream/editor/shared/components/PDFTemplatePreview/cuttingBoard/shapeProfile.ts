import type { Point } from './model';

/** 원장/가공의 실제 외곽. 점은 경계 상자에 대한 0~1 좌표이므로 치수 편집에도 유지된다. */
export type ShapeProfile = { kind: 'circle' } | { kind: 'rounded'; radius: number }
  | { kind: 'polygon' | 'arc'; points: Point[] };
export const CURVE_TOLERANCE_MM = 0.05;
const steps = (r: number, angle: number) => Math.max(8, Math.min(2048, Math.ceil(Math.abs(angle) / (2 * Math.acos(Math.max(-1, 1 - CURVE_TOLERANCE_MM / Math.max(r, CURVE_TOLERANCE_MM)))))));
export function profilePoints(width: number, height: number, profile?: ShapeProfile): Point[] {
  if (profile?.kind === 'polygon' || profile?.kind === 'arc') return profile.points.map(p => ({ x: p.x * width, y: p.y * height }));
  if (profile?.kind === 'circle') {
    const n = Math.ceil(steps(Math.max(width, height) / 2, Math.PI * 2) / 4) * 4;
    return Array.from({ length: n }, (_, i) => ({ x: width / 2 * (1 + Math.cos(i * Math.PI * 2 / n)), y: height / 2 * (1 + Math.sin(i * Math.PI * 2 / n)) }));
  }
  const r = profile?.kind === 'rounded' ? Math.min(profile.radius, width / 2, height / 2) : 0;
  if (!r) return [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
  const n = steps(r, Math.PI / 2);
  return [{ x: width - r, y: r }, { x: width - r, y: height - r }, { x: r, y: height - r }, { x: r, y: r }].flatMap((p, corner) => Array.from({ length: n + 1 }, (_, i) => {
    const angle = (-1 + corner) * Math.PI / 2 + i * Math.PI / 2 / n;
    return { x: p.x + r * Math.cos(angle), y: p.y + r * Math.sin(angle) };
  }));
}
export function profilePolygon(width: number, height: number, profile?: ShapeProfile, x = 0, y = 0): [number, number][][] {
  const pts = profilePoints(width, height, profile).map(p => [x + p.x, y + p.y] as [number, number]);
  return [[...pts, pts[0]]];
}
export function validProfile(profile: ShapeProfile | undefined): boolean {
  if (!profile) return true;
  if (profile.kind === 'circle') return true;
  if (profile.kind === 'rounded') return Number.isFinite(profile.radius) && profile.radius >= 0;
  if (profile.kind !== 'polygon' && profile.kind !== 'arc') return false;
  const p = profile.points;
  if (!Array.isArray(p) || p.length < 3 || p.length > 2050 || p.some(v => !v || ![v.x, v.y].every(n => Number.isFinite(n) && n >= -1e-8 && n <= 1 + 1e-8))) return false;
  const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const area = p.reduce((sum, a, i) => { const b = p[(i + 1) % p.length]; return sum + a.x * b.y - b.x * a.y; }, 0);
  if (Math.abs(area) < 1e-8) return false;
  for (let i = 0; i < p.length; i++) for (let j = i + 2; j < p.length; j++) {
    if (i === 0 && j === p.length - 1) continue;
    const a = p[i], b = p[(i + 1) % p.length], c = p[j], d = p[(j + 1) % p.length];
    if (cross(a, b, c) * cross(a, b, d) < -1e-12 && cross(c, d, a) * cross(c, d, b) < -1e-12) return false;
  }
  return true;
}
export function rotateProfile(profile?: ShapeProfile): ShapeProfile | undefined {
  return profile && (profile.kind === 'polygon' || profile.kind === 'arc') ? { ...profile, points: profile.points.map(p => ({ x: 1 - p.y, y: p.x })) } : profile;
}
export function profileFromPoints(points: Point[], kind: 'polygon' | 'arc' = 'polygon') {
  const x = Math.min(...points.map(p => p.x)), y = Math.min(...points.map(p => p.y));
  const width = Math.max(...points.map(p => p.x)) - x, height = Math.max(...points.map(p => p.y)) - y;
  return { x, y, width, height, profile: { kind, points: points.map(p => ({ x: (p.x - x) / width, y: (p.y - y) / height })) } } as { x: number; y: number; width: number; height: number; profile: ShapeProfile };
}
/** 스케치업의 2점 아크: 시작점→끝점→부풀림 점. 닫힌 재단 면은 아크와 현으로 구성된다. */
export function arcPoints(a: Point, b: Point, through: Point): Point[] {
  const d = 2 * (a.x * (b.y - through.y) + b.x * (through.y - a.y) + through.x * (a.y - b.y));
  if (Math.abs(d) < 1e-7) return [];
  const aa = a.x * a.x + a.y * a.y, bb = b.x * b.x + b.y * b.y, cc = through.x * through.x + through.y * through.y;
  const center = { x: (aa * (b.y - through.y) + bb * (through.y - a.y) + cc * (a.y - b.y)) / d,
    y: (aa * (through.x - b.x) + bb * (a.x - through.x) + cc * (b.x - a.x)) / d };
  const mod = (n: number) => (n % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const start = Math.atan2(a.y - center.y, a.x - center.x), end = Math.atan2(b.y - center.y, b.x - center.x), mid = Math.atan2(through.y - center.y, through.x - center.x);
  const ccw = mod(end - start), sweep = mod(mid - start) <= ccw ? ccw : ccw - Math.PI * 2;
  const r = Math.hypot(a.x - center.x, a.y - center.y), n = steps(r, sweep);
  return Array.from({ length: n + 1 }, (_, i) => i === 0 ? a : i === n ? b : ({ x: center.x + r * Math.cos(start + sweep * i / n), y: center.y + r * Math.sin(start + sweep * i / n) }));
}

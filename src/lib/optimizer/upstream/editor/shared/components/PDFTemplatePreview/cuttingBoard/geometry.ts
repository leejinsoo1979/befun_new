import { profilePolygon, validProfile, type ShapeProfile } from './shapeProfile';
import polygonClipping from 'polygon-clipping';
import type { BoardPanel, Point } from './model';

// 가공은 패널 자체의 왼쪽 위 기준 mm. 배치 각도와 원장 보기 회전에서 독립적이다.
export type PanelCut = { id: string; groupId?: string; kind: 'circle'; x: number; y: number; diameter: number }
  | { id: string; groupId?: string; profile?: ShapeProfile; kind: 'rectangle' | 'notch'; x: number; y: number; width: number; height: number };
const round = (n: number) => Math.round(n * 10) / 10;
export const normalizeAngle = (n: number) => (round(n) % 360 + 360) % 360;
export function snapAngle(n: number): number {
  const nearest = Math.round(n / 90) * 90;
  return normalizeAngle(Math.abs(n - nearest) <= 5 ? nearest : n);
}
export function rotatePoint(p: Point, angle: number): Point {
  const radians = angle * Math.PI / 180;
  return { x: p.x * Math.cos(radians) - p.y * Math.sin(radians), y: p.x * Math.sin(radians) + p.y * Math.cos(radians) };
}
export function panelPoint(p: Point, panel: BoardPanel): Point {
  const v = rotatePoint({ x: p.x - panel.x - panel.width / 2, y: p.y - panel.y - panel.height / 2 }, -(panel.rotation || 0));
  return { x: v.x + panel.width / 2, y: v.y + panel.height / 2 };
}
export function worldPoint(p: Point, panel: BoardPanel): Point {
  const v = rotatePoint({ x: p.x - panel.width / 2, y: p.y - panel.height / 2 }, panel.rotation || 0);
  return { x: v.x + panel.x + panel.width / 2, y: v.y + panel.y + panel.height / 2 };
}
export function panelCorners(panel: BoardPanel): Point[] {
  return [{ x: 0, y: 0 }, { x: panel.width, y: 0 }, { x: panel.width, y: panel.height }, { x: 0, y: panel.height }].map(p => worldPoint(p, panel));
}
export function panelBounds(panel: BoardPanel) {
  const points = panelCorners(panel);
  const x = Math.min(...points.map(p => p.x)), y = Math.min(...points.map(p => p.y));
  return { x, y, width: Math.max(...points.map(p => p.x)) - x, height: Math.max(...points.map(p => p.y)) - y };
}
export function turnPanel(panel: BoardPanel, angle: number, board: { width: number; height: number }): BoardPanel | null {
  const next = { ...panel, rotation: normalizeAngle(angle) };
  const bounds = panelBounds(next);
  if (bounds.width > board.width + 1e-7 || bounds.height > board.height + 1e-7) return null;
  // 회전 중심은 유지하고, 경계를 넘는 경우에만 최소 거리로 안쪽에 둔다.
  next.x += Math.max(0, -bounds.x) + Math.min(0, board.width - bounds.x - bounds.width);
  next.y += Math.max(0, -bounds.y) + Math.min(0, board.height - bounds.y - bounds.height);
  return next;
}
export function resizePanel(panel: BoardPanel, anchor: Point, end: Point): BoardPanel {
  const local = panelPoint(end, panel);
  const x = Math.min(anchor.x, local.x), y = Math.min(anchor.y, local.y);
  const width = round(Math.abs(local.x - anchor.x)), height = round(Math.abs(local.y - anchor.y));
  const center = worldPoint({ x: x + width / 2, y: y + height / 2 }, panel);
  return { ...panel, x: center.x - width / 2, y: center.y - height / 2, width, height,
    // 잘라낸 형상의 원래 월드 위치를 유지한다. 잘라내기를 침범하는 축소는 검증에서 거부한다.
    cuts: panel.cuts?.map(c => ({ ...c, x: round(c.x - x), y: round(c.y - y) })) };
}
/** 요소 도형처럼 모서리는 비율 유지(Shift 해제), 변은 한 방향만 조절한다. */
export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';
export function resizeFromHandle(panel: BoardPanel, handle: ResizeHandle, start: Point, end: Point, free = false): BoardPanel {
  const a = panelPoint(start, panel), b = panelPoint(end, panel);
  const west = handle.includes('w'), north = handle.includes('n');
  const horizontal = west || handle.includes('e'), vertical = north || handle.includes('s');
  let width = horizontal ? Math.max(1, panel.width + (b.x - a.x) * (west ? -1 : 1)) : panel.width;
  let height = vertical ? Math.max(1, panel.height + (b.y - a.y) * (north ? -1 : 1)) : panel.height;
  if (horizontal && vertical && !free) {
    const factor = (width + height) / (panel.width + panel.height);
    width = panel.width * factor; height = panel.height * factor;
  }
  const anchor = { x: west ? panel.width : 0, y: north ? panel.height : 0 };
  return resizePanel(panel, anchor, worldPoint({ x: anchor.x + width * (west ? -1 : 1), y: anchor.y + height * (north ? -1 : 1) }, panel));
}

export function panelOutline(panel: Pick<BoardPanel, 'width' | 'height' | 'cuts' | 'profile'>) {
  const clips = (panel.cuts || []).filter(c => c.kind !== 'circle').map(c => profilePolygon(c.width, c.height, c.profile, c.x, c.y));
  return clips.length ? polygonClipping.difference(profilePolygon(panel.width, panel.height, panel.profile), ...clips) : [profilePolygon(panel.width, panel.height, panel.profile)];
}
export function cutPath(cut: PanelCut): string {
  if (cut.kind !== 'circle' && cut.profile) return `M${profilePolygon(cut.width, cut.height, cut.profile, cut.x, cut.y)[0].map(p => p.join(',')).join('L')}Z`;
  if (cut.kind !== 'circle') return `M${cut.x},${cut.y}h${cut.width}v${cut.height}h${-cut.width}Z`;
  const r = cut.diameter / 2;
  return `M${cut.x - r},${cut.y}a${r},${r} 0 1 0 ${cut.diameter},0a${r},${r} 0 1 0 ${-cut.diameter},0Z`;
}
export function panelPath(panel: Pick<BoardPanel, 'width' | 'height' | 'cuts' | 'profile'>): string {
  return panelOutline(panel).flatMap(poly => poly.map(ring => `M${ring.map(p => p.join(',')).join('L')}Z`)).join(' ')
    + ' ' + (panel.cuts || []).filter(c => c.kind === 'circle').map(cutPath).join(' ');
}
export function validCuts(panel: BoardPanel): boolean {
  if (!validProfile(panel.profile)) return false;
  if (panel.cuts === undefined) return true;
  if (!Array.isArray(panel.cuts) || panel.cuts.length > 500 || new Set(panel.cuts.map(c => c?.id)).size !== panel.cuts.length) return false;
  for (const c of panel.cuts) {
    if (!c || typeof c.id !== 'string' || !c.id || ![c.x, c.y].every(Number.isFinite)) return false;
    if (c.groupId !== undefined && (typeof c.groupId !== 'string' || !c.groupId)) return false;
    if (c.kind === 'circle') {
      const r = c.diameter / 2;
      if (!Number.isFinite(r) || r < 0.5 || c.x - r <= 0 || c.y - r <= 0 || c.x + r >= panel.width || c.y + r >= panel.height) return false;
    } else if (c.kind === 'rectangle' || c.kind === 'notch') {
      if (!validProfile(c.profile)) return false;
      if (![c.width, c.height].every(n => Number.isFinite(n) && n >= 1) || c.x < 0 || c.y < 0 || round(c.x + c.width) > panel.width || round(c.y + c.height) > panel.height) return false;
      const touches = c.x === 0 || c.y === 0 || round(c.x + c.width) === panel.width || round(c.y + c.height) === panel.height;
      if ((c.kind === 'notch') !== touches) return false;
      if (c.width >= panel.width || c.height >= panel.height) return false;
    } else return false;
  }
  if (panel.profile || panel.cuts.some(c => c.kind !== 'circle' && c.profile)) {
    const outer = profilePolygon(panel.width, panel.height, panel.profile);
    const polygons = panel.cuts.map(c => c.kind === 'circle' ? profilePolygon(c.diameter, c.diameter, { kind: 'circle' }, c.x - c.diameter / 2, c.y - c.diameter / 2) : profilePolygon(c.width, c.height, c.profile, c.x, c.y));
    if (polygons.some(p => polygonClipping.difference(p, outer).length)) return false;
    for (let i = 0; i < polygons.length; i++) for (let j = i + 1; j < polygons.length; j++) if (polygonClipping.intersection(polygons[i], polygons[j]).length) return false;
    return panelOutline(panel).length === 1;
  }
  // 원형 구멍이 다른 절삭과 겹치면 폐곡선이 깨지므로 적용하지 않는다.
  for (const [i, a] of panel.cuts.entries()) {
    for (const b of panel.cuts.slice(i + 1)) {
      if (a.kind !== 'circle' && b.kind !== 'circle') continue;
      const circle = a.kind === 'circle' ? a : b;
      if (circle.kind !== 'circle') continue;
      const other = circle === a ? b : a;
      const distance = other.kind === 'circle'
        ? Math.hypot(circle.x - other.x, circle.y - other.y) - other.diameter / 2
        : Math.hypot(circle.x - Math.max(other.x, Math.min(other.x + other.width, circle.x)), circle.y - Math.max(other.y, Math.min(other.y + other.height, circle.y)));
      if (distance <= circle.diameter / 2) return false;
    }
  }
  return panelOutline(panel).length === 1;
}
export function drawnCut(kind: PanelCut['kind'], id: string, start: Point, end: Point, panel: BoardPanel): PanelCut {
  if (kind === 'circle') return { id, kind, x: round(start.x), y: round(start.y), diameter: round(Math.hypot(end.x - start.x, end.y - start.y) * 2) };
  const a = { x: Math.max(0, Math.min(panel.width, start.x)), y: Math.max(0, Math.min(panel.height, start.y)) };
  const b = { x: Math.max(0, Math.min(panel.width, end.x)), y: Math.max(0, Math.min(panel.height, end.y)) };
  return { id, kind, x: round(Math.min(a.x, b.x)), y: round(Math.min(a.y, b.y)), width: round(Math.abs(a.x - b.x)), height: round(Math.abs(a.y - b.y)) };
}

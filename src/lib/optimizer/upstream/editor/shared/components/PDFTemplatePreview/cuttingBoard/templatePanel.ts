import { util } from 'fabric';
import { type ShapeDef } from '../canvasUx/shapeLibrary';
import { type BoardPanel, type Point } from './model';
import { profileFromPoints } from './shapeProfile';

const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distanceToSegment = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
};
/** 요소의 원본 SVG 경로를 재사용한다. 베지어 곡선은 제어점 오차를 제한하며 분할한다. */
function contours(def: ShapeDef): Point[][] {
  const rings: Point[][] = [];
  let points: Point[] = [], current = { x: 0, y: 0 };
  const flatten = (a: Point, b: Point, c: Point, d: Point, depth = 0) => {
    if (depth >= 16 || Math.max(distanceToSegment(b, a, d), distanceToSegment(c, a, d)) < 0.0001) { points.push(d); return; }
    const ab = midpoint(a, b), bc = midpoint(b, c), cd = midpoint(c, d), abc = midpoint(ab, bc), bcd = midpoint(bc, cd), mid = midpoint(abc, bcd);
    flatten(a, ab, abc, mid, depth + 1); flatten(mid, bcd, cd, d, depth + 1);
  };
  for (const command of util.makePathSimpler(util.parsePath(def.d))) {
    if (command[0] === 'M') { current = { x: command[1], y: command[2] }; points = [current]; }
    else if (command[0] === 'L') { current = { x: command[1], y: command[2] }; points.push(current); }
    else if (command[0] === 'C') {
      const end = { x: command[5], y: command[6] };
      flatten(current, { x: command[1], y: command[2] }, { x: command[3], y: command[4] }, end); current = end;
    } else if (command[0] === 'Q') {
      const control = { x: command[1], y: command[2] }, end = { x: command[3], y: command[4] };
      flatten(current, { x: (current.x + 2 * control.x) / 3, y: (current.y + 2 * control.y) / 3 }, { x: (end.x + 2 * control.x) / 3, y: (end.y + 2 * control.y) / 3 }, end); current = end;
    } else if (command[0] === 'Z') {
      if (Math.hypot(points[0].x - current.x, points[0].y - current.y) < 1e-8) points.pop();
      rings.push(points); current = points[0];
    }
  }
  return rings;
}

export function templatePanel(def: ShapeDef, size: number, id: string): BoardPanel {
  if (def.stroke) throw new Error('패널은 면이 있는 도형으로 만들어 주세요.');
  const panel: BoardPanel = { id, name: def.label, x: 0, y: 0, width: size, height: size };
  // 요소 메뉴의 네이티브 도형과 같은 비율 및 모서리 반경을 사용한다.
  if (def.id === 'rect') return panel;
  if (def.id === 'rounded-rect') return { ...panel, profile: { kind: 'rounded', radius: size * 0.16 } };
  if (def.id === 'circle' || def.id === 'ellipse' || def.id === 'ring') return {
    ...panel, height: def.id === 'ellipse' ? size * 0.64 : size, profile: { kind: 'circle' },
    ...(def.id === 'ring' ? { cuts: [{ id: `${id}-hole`, kind: 'circle' as const, x: size / 2, y: size / 2, diameter: size / 2 }] } : {}),
  };
  const rings = contours(def);
  if (rings.length !== 1) throw new Error('하나의 닫힌 외곽선을 가진 도형을 선택하세요.');
  const bounds = profileFromPoints(rings[0]);
  const ratio = size / Math.max(bounds.width, bounds.height);
  return { ...panel, width: bounds.width * ratio, height: bounds.height * ratio, profile: bounds.profile };
}

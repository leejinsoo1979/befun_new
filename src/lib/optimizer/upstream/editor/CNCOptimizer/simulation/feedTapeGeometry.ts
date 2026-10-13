import { BufferGeometry, Float32BufferAttribute } from 'three';
import { banderReference } from './edgeBandingProcess';

// 기존 참조 외형의 배치다. 제조사 CAD/설비 설정값으로 내보내지 않는다.
export const tapeFeed = {
  coil: { x: 330, y: -590, radius: 205 },
  guide: { x: 745, y: -145, radius: 30 },
  pressure: { x: banderReference.pressure, y: -59, radius: 59 },
};
type Circle = typeof tapeFeed.coil;
type XY = [number, number];
export interface TapeSection { point: XY; tangent: XY }

/** 코일→가이드 내접선, 가이드→압착 외접선. 접점에서 직선과 원호의 방향이 일치한다. */
export function feedTapeSections(thickness: number): TapeSection[] {
  const { coil, guide, pressure } = tapeFeed;
  const radius = (circle: Circle) => circle.radius + thickness / 2;
  const tangent = (a: Circle, b: Circle, opposite: boolean, side: number) => {
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    const dot = (radius(a) - (opposite ? -radius(b) : radius(b))) / length;
    const cross = side * Math.sqrt(1 - dot * dot);
    const normal: XY = [(dx * dot - dy * cross) / length, (dy * dot + dx * cross) / length];
    const other: XY = opposite ? [-normal[0], -normal[1]] : normal;
    return {
      from: [a.x + radius(a) * normal[0], a.y + radius(a) * normal[1]] as XY,
      to: [b.x + radius(b) * other[0], b.y + radius(b) * other[1]] as XY,
      angle: Math.atan2(other[1], other[0]),
    };
  };
  const entry = tangent(coil, guide, true, -1), exit = tangent(guide, pressure, false, 1);
  const result: TapeSection[] = [];
  const line = (a: XY, b: XY) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const direction: XY = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
    if (!result.length) result.push({ point: a, tangent: direction });
    result.push({ point: b, tangent: direction });
  };
  const clockwiseArc = (circle: Circle, from: number, to: number) => {
    const sweep = ((from - to) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    // 확대해도 다각형처럼 보이지 않도록 최대 1도 단위, 법선은 실제 원호에서 계산한다.
    const count = Math.max(1, Math.ceil(sweep / (Math.PI / 180)));
    for (let i = 1; i <= count; i++) {
      const angle = from - sweep * i / count;
      result.push({ point: [circle.x + radius(circle) * Math.cos(angle), circle.y + radius(circle) * Math.sin(angle)],
        tangent: [Math.sin(angle), -Math.cos(angle)] });
    }
  };
  line(entry.from, entry.to);
  clockwiseArc(guide, entry.angle, exit.angle);
  line(exit.from, exit.to);
  clockwiseArc(pressure, exit.angle, Math.PI / 2);
  return result;
}

/** 직사각 단면을 접선 경로로 스윕한다. 측면은 매끈하고 위아래 모서리는 분리된 법선을 갖는다. */
export function createFeedTapeGeometry(panelThickness: number, tapeThickness: number): BufferGeometry {
  const sections = feedTapeSections(tapeThickness), positions: number[] = [], normals: number[] = [], indices: number[] = [];
  const z = panelThickness / 2, halfHeight = (panelThickness + 6) / 2, halfThickness = tapeThickness / 2;
  const corners = (s: TapeSection) => {
    const nx = -s.tangent[1], ny = s.tangent[0];
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([side, up]) =>
      [s.point[0] + nx * side * halfThickness, s.point[1] + ny * side * halfThickness, z + up * halfHeight]);
  };
  sections.forEach((section, index) => {
    const points = corners(section), nx = -section.tangent[1], ny = section.tangent[0];
    const faceNormals = [[0, 0, -1], [nx, ny, 0], [0, 0, 1], [-nx, -ny, 0]];
    for (let face = 0; face < 4; face++) {
      positions.push(...points[face], ...points[(face + 1) % 4]);
      normals.push(...faceNormals[face], ...faceNormals[face]);
      if (index < sections.length - 1) {
        const a = index * 8 + face * 2;
        indices.push(a, a + 1, a + 9, a, a + 9, a + 8);
      }
    }
  });
  for (const [index, sign] of [[0, -1], [sections.length - 1, 1]]) {
    const start = positions.length / 3, section = sections[index];
    for (const point of corners(section)) {
      positions.push(...point); normals.push(section.tangent[0] * sign, section.tangent[1] * sign, 0);
    }
    const order = sign < 0 ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
    indices.push(...order.map(n => start + n));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

import { BufferGeometry, Float32BufferAttribute, Path, Shape, ShapeGeometry } from 'three';

/** Observed mouth/depth envelope only. The supplier's detailed undercut remains unknown. */
export function capsuleMouth(center: number, width: number, length: number) {
  const r = width / 2, travel = (length - width) / 2;
  const path = new Path();
  path.moveTo(-r, center - travel);
  path.lineTo(-r, center + travel);
  path.absarc(0, center + travel, r, Math.PI, 0, true);
  path.lineTo(r, center - travel);
  path.absarc(0, center - travel, r, 0, -Math.PI, true);
  path.closePath();
  return path;
}

export function createPocketInterior(centers: readonly number[], width: number, length: number, depth: number, direction: 1 | -1) {
  const positions: number[] = [], uv: number[] = [];
  const shapes: Shape[] = [];
  for (const center of centers) {
    const points = capsuleMouth(center, width, length).getPoints(32);
    shapes.push(new Shape(points));
    let distance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1], next = distance + a.distanceTo(b);
      positions.push(a.x, 0, a.y, a.x, direction * depth, a.y, b.x, 0, b.y,
        b.x, 0, b.y, a.x, direction * depth, a.y, b.x, direction * depth, b.y);
      uv.push(distance / 25, 0, distance / 25, depth / 25, next / 25, 0,
        next / 25, 0, distance / 25, depth / 25, next / 25, depth / 25);
      distance = next;
    }
  }
  const walls = new BufferGeometry();
  walls.setAttribute('position', new Float32BufferAttribute(positions, 3));
  walls.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  walls.computeVertexNormals();
  const floor = new ShapeGeometry(shapes, 32);
  const p = floor.getAttribute('position'), floorUv = floor.getAttribute('uv');
  for (let i = 0; i < p.count; i++) floorUv.setXY(i, p.getX(i) / 25, p.getY(i) / 25);
  floor.rotateX(Math.PI / 2); floor.translate(0, direction * depth, 0);
  return { walls, floor, profileStatus: 'observed-envelope' as const, undercutStatus: 'unknown' as const, manufacturingApproved: false as const };
}

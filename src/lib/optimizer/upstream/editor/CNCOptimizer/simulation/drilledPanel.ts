import * as THREE from 'three';
import type { Point3 } from './program';

export interface PanelHole { surface: Point3; direction: Point3; diameter: number; depth: number }
/** 직육면체의 서로 만나지 않는 평저 원형 보링. 반복 CSG의 공면 삼각형 폭증을 피한다. */
export function drilledPanel(size: Point3, holes: PanelHole[]): THREE.BufferGeometry | null {
  const eps = 1e-6, segments = 64;
  const entries = holes.filter(h => h.depth > eps).map(h => {
    const axis = h.direction.findIndex(v => Math.abs(v) > .999);
    if (axis < 0) return null;
    const sign = h.direction[axis];
    if (Math.abs(h.surface[axis] - (sign > 0 ? 0 : size[axis])) > eps) return null;
    if ([0, 1, 2].some(i => i !== axis && (h.surface[i] - h.diameter / 2 < -eps || h.surface[i] + h.diameter / 2 > size[i] + eps))) return null;
    return { ...h, axis, sign, depth: Math.min(h.depth, size[axis]) };
  });
  if (entries.some(h => !h)) return null;
  const valid = entries.filter((h): h is NonNullable<typeof h> => !!h);
  // 겹치는 가공은 일반 CSG로 넘긴다. 원형 두 개를 겹치지 않는 구멍으로 잘못 그리지 않는다.
  for (let i = 0; i < valid.length; i++) for (let j = i + 1; j < valid.length; j++) {
    const a = valid[i], b = valid[j];
    const bounds = (h: typeof a) => size.map((_, axis) => axis === h.axis
      ? [Math.min(h.surface[axis], h.surface[axis] + h.sign * h.depth), Math.max(h.surface[axis], h.surface[axis] + h.sign * h.depth)]
      : [h.surface[axis] - h.diameter / 2, h.surface[axis] + h.diameter / 2]);
    const aa = bounds(a), bb = bounds(b);
    if (aa.every((r, axis) => Math.min(r[1], bb[axis][1]) > Math.max(r[0], bb[axis][0]) + eps)) return null;
  }
  const positions: number[] = [], normals: number[] = [], uv: number[] = [];
  const v = (p: Point3) => new THREE.Vector3(...p);
  const triangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, n: THREE.Vector3, smoothCenter?: THREE.Vector3, axis?: number) => {
    if (b.clone().sub(a).cross(c.clone().sub(a)).dot(n) < 0) [b, c] = [c, b];
    for (const p of [a, b, c]) {
      positions.push(...p.toArray());
      const normal = smoothCenter ? smoothCenter.clone().sub(p).setComponent(axis!, 0).normalize() : n;
      normals.push(...normal.toArray()); uv.push(p.x / size[0], p.y / size[1]);
    }
  };
  for (let axis = 0; axis < 3; axis++) for (const side of [0, 1]) {
    const axes = [0, 1, 2].filter(i => i !== axis), [u, w] = axes;
    const outer = [new THREE.Vector2(0, 0), new THREE.Vector2(size[u], 0), new THREE.Vector2(size[u], size[w]), new THREE.Vector2(0, size[w])];
    const faceHoles = valid.filter(h => h.axis === axis && (Math.abs(h.surface[axis] - size[axis] * side) < eps || h.depth >= size[axis] - eps));
    const rings = faceHoles.map(h => Array.from({ length: segments }, (_, i) => {
      const a = -i / segments * Math.PI * 2;
      return new THREE.Vector2(h.surface[u] + Math.cos(a) * h.diameter / 2, h.surface[w] + Math.sin(a) * h.diameter / 2);
    }));
    const vertices = [...outer, ...rings.flat()], faces = THREE.ShapeUtils.triangulateShape(outer, rings);
    const normal = new THREE.Vector3().setComponent(axis, side ? 1 : -1);
    const point = (p: THREE.Vector2) => new THREE.Vector3().setComponent(axis, size[axis] * side).setComponent(u, p.x).setComponent(w, p.y);
    for (const ids of faces) triangle(point(vertices[ids[0]]), point(vertices[ids[1]]), point(vertices[ids[2]]), normal);
  }
  for (const h of valid) {
    const [u, w] = [0, 1, 2].filter(i => i !== h.axis), center = v(h.surface), bottom = center.clone().addScaledVector(v(h.direction), h.depth);
    const radial = (i: number) => new THREE.Vector3().setComponent(u, Math.cos(i / segments * Math.PI * 2) * h.diameter / 2).setComponent(w, Math.sin(i / segments * Math.PI * 2) * h.diameter / 2);
    for (let i = 0; i < segments; i++) {
      const a = radial(i), b = radial(i + 1), normal = a.clone().add(b).negate().normalize();
      triangle(center.clone().add(a), center.clone().add(b), bottom.clone().add(a), normal, center, h.axis);
      triangle(bottom.clone().add(a), center.clone().add(b), bottom.clone().add(b), normal, center, h.axis);
      if (h.depth < size[h.axis] - eps) triangle(bottom, bottom.clone().add(a), bottom.clone().add(b), v(h.direction).negate());
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

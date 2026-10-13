import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import polygonClipping, { type Ring } from 'polygon-clipping';
import type { Point3, ReplayStep, ReplayTool } from './program';

/** 직선 컷쏘의 swept 원판을 단면에서 차감한다. 범용 3D BVH 재구축 없이 같은 원호를 보존한다. */
export function sawnStock(size: Point3, step: Extract<ReplayStep, { kind: 'saw' }>, tool: Extract<ReplayTool, { kind: 'saw' }>, progress: number) {
  const dx = step.to[0] - step.from[0], dy = step.to[1] - step.from[1];
  if (Math.abs(step.to[2] - step.from[2]) > 1e-8 || (Math.abs(dx) > 1e-8 && Math.abs(dy) > 1e-8)) return null;
  const axis = Math.abs(dx) > 1e-8 ? 0 : 1, across = axis === 0 ? 1 : 0;
  const parts: THREE.BufferGeometry[] = [];
  const box = (lo: number, hi: number) => {
    if (hi <= lo) return;
    const dims: Point3 = [...size]; dims[across] = hi - lo;
    const at: Point3 = dims.map(v => v / 2) as Point3; at[across] += lo;
    const indexed = new THREE.BoxGeometry(...dims); indexed.translate(...at);
    parts.push(indexed.toNonIndexed()); indexed.dispose();
  };
  const lo = Math.max(0, step.from[across] - tool.kerf / 2), hi = Math.min(size[across], step.from[across] + tool.kerf / 2);
  if (progress <= 0 || hi <= lo) { box(0, size[across]); return parts[0]; }
  box(0, lo); box(hi, size[across]);
  const radius = tool.diameter / 2, distance = Math.hypot(dx, dy) * Math.min(1, progress), sign = Math.sign(axis === 0 ? dx : dy);
  // sweptTool와 같은 원호 해상도와 경로. 톱날 선단의 위·아래 곡률도 유지한다.
  const capsule = new THREE.Shape();
  capsule.moveTo(0, -radius); capsule.lineTo(distance, -radius);
  capsule.absarc(distance, 0, radius, -Math.PI / 2, Math.PI / 2, false);
  capsule.lineTo(0, radius); capsule.absarc(0, 0, radius, Math.PI / 2, Math.PI * 1.5, false); capsule.closePath();
  const cutter: Ring = capsule.getPoints(48).map(p => [step.from[axis] + sign * p.x, step.from[2] + p.y]);
  const rectangle: Ring = [[0, 0], [size[axis], 0], [size[axis], size[2]], [0, size[2]], [0, 0]];
  const remaining = polygonClipping.difference([rectangle], [cutter]);
  for (const [outer, ...holes] of remaining) {
    const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
    shape.holes = holes.map(ring => new THREE.Path(ring.map(([x, y]) => new THREE.Vector2(x, y))));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: hi - lo, bevelEnabled: false, steps: 1 });
    const matrix = axis === 0
      ? new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0)).setPosition(0, hi, 0)
      : new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)).setPosition(lo, 0, 0);
    geometry.applyMatrix4(matrix); parts.push(geometry);
  }
  const result = parts.length ? mergeGeometries(parts)! : new THREE.BufferGeometry();
  parts.forEach(g => g.dispose());
  if (!result.hasAttribute('position')) result.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
  result.computeBoundingBox(); result.computeBoundingSphere();
  return result;
}

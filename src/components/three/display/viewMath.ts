import { Vector3 } from 'three';
import type { ViewDirection } from './displayStore';

export const VIEW_DIRECTIONS: Record<ViewDirection, [number, number, number]> = {
  front: [0, 0, 1], back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0],
  top: [0, 1, 0], bottom: [0, -1, 0], standard: [1, 0.7, 1],
};

/** Fit every box corner, including depth, in either projection. Units: cm. */
export function fitView(width: number, height: number, depth: number, aspect: number, view: ViewDirection) {
  const direction = new Vector3(...VIEW_DIRECTIONS[view]).normalize();
  const up = new Vector3(0, view === 'top' || view === 'bottom' ? 0 : 1, view === 'top' ? -1 : view === 'bottom' ? 1 : 0);
  const right = new Vector3().crossVectors(up, direction).normalize();
  const vertical = new Vector3().crossVectors(direction, right).normalize();
  const tanV = Math.tan(20 * Math.PI / 180);
  const safeAspect = Math.max(0.1, aspect);
  let distance = 0, halfHeight = 0;
  for (const x of [-width / 2, width / 2]) for (const y of [-height / 2, height / 2]) for (const z of [-depth / 2, depth / 2]) {
    const corner = new Vector3(x, y, z);
    const px = Math.abs(corner.dot(right));
    const py = Math.abs(corner.dot(vertical));
    distance = Math.max(distance, corner.dot(direction) + Math.max(py / tanV, px / (tanV * safeAspect)));
    halfHeight = Math.max(halfHeight, py, px / safeAspect);
  }
  return { direction, up, distance: distance * 1.22 + 20, halfHeight: halfHeight * 1.22 + 10 };
}

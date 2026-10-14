import type { WardrobeFront } from './types';

export interface WardrobeDoorMotion {
  pivotX: number;
  pivotZ: number;
  openAngle: number;
  ajarAngle: number;
  limitedBy: string[];
}

type Point = readonly [number, number];

function corners(front: WardrobeFront, motion: WardrobeDoorMotion, angle: number): Point[] {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => {
    const x = front.x + sx * front.w / 2 - motion.pivotX;
    const z = front.z + sz * front.d / 2 - motion.pivotZ;
    return [motion.pivotX + x * c + z * s, motion.pivotZ - x * s + z * c];
  });
}

function overlaps(a: Point[], b: Point[]): boolean {
  for (const polygon of [a, b]) for (let i = 0; i < 2; i++) {
    const dx = polygon[i + 1][0] - polygon[i][0];
    const dz = polygon[i + 1][1] - polygon[i][1];
    const length = Math.hypot(dx, dz);
    if (!length) continue;
    const project = (p: Point) => (-dz * p[0] + dx * p[1]) / length;
    const pa = a.map(project), pb = b.map(project);
    if (Math.min(...pa) >= Math.max(...pb) - 1e-7 || Math.min(...pb) >= Math.max(...pa) - 1e-7) return false;
  }
  return true;
}

/** Display motion only, in cm/radians. Source panels and manufacturing hinges are
 * unchanged. A front-corner pivot + 90° cap stops opposing doors sharing a column
 * boundary from crossing. This is not a measured concealed-hinge linkage model.
 */
export function resolveWardrobeDoorMotions(fronts: readonly WardrobeFront[]): WardrobeDoorMotion[] {
  const motions = fronts.map(front => ({
    pivotX: front.pivotX, pivotZ: front.z, openAngle: front.openAngle,
    ajarAngle: Math.sign(front.openAngle) * Math.min(Math.abs(front.openAngle), (Math.abs(front.openAngle) > 100 * Math.PI / 180 ? 65 : 70) * Math.PI / 180),
    limitedBy: [] as string[],
  }));
  // Use the nominal poses for every pair, so detection is independent of order.
  for (let i = 0; i < fronts.length; i++) for (let j = i + 1; j < fronts.length; j++) {
    const a = fronts[i], b = fronts[j];
    if (Math.min(a.y + a.h / 2, b.y + b.h / 2) <= Math.max(a.y - a.h / 2, b.y - b.h / 2)) continue;
    const [left, right] = a.x < b.x ? [a, b] : [b, a];
    if (left.hingeSide !== 'right' || right.hingeSide !== 'left') continue;
    const steps = Math.ceil(Math.max(Math.abs(a.openAngle), Math.abs(b.openAngle)) * 360 / Math.PI);
    for (let step = 1; step <= steps; step++) {
      const progress = step / steps;
      if (overlaps(corners(a, motions[i], a.openAngle * progress), corners(b, motions[j], b.openAngle * progress))) {
        motions[i].limitedBy.push(b.id);
        motions[j].limitedBy.push(a.id);
        break;
      }
    }
  }
  return motions.map((motion, index) => {
    if (!motion.limitedBy.length) return motion;
    const front = fronts[index];
    return { ...motion,
      pivotX: front.x + (front.hingeSide === 'right' ? 1 : -1) * front.w / 2,
      pivotZ: front.z + front.d / 2,
      openAngle: Math.sign(front.openAngle) * Math.min(Math.abs(front.openAngle), Math.PI / 2),
    };
  });
}

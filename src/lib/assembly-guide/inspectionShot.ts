import type { Point3 } from './sequence';

export type JointInspection = 'auto' | 'front' | 'side' | 'section';

/** Fixed before/after views in the example's mm scene; no model scaling or geometry changes. */
export function inspectionShot(view: Exclude<JointInspection, 'auto'>, target: Point3, aspect: number) {
  const distance = 35 / Math.sin(Math.atan(Math.tan(Math.PI / 9) * Math.min(1, Math.max(.2, aspect))));
  const position: Point3 = view === 'front' ? [target[0], target[1] + distance, target[2]] : [target[0] + distance, target[1], target[2]];
  const up: Point3 = view === 'front' ? [0, 0, -1] : [0, 1, 0];
  return { target, position, up };
}

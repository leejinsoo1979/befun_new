import type { WardrobeSourceGeometry, WardrobeSourcePart } from './source-types';

type Point = [number, number, number];
export interface WardrobePanelSeam {
  id: string;
  /** Four visible edges of an actual shared cut face, in render cm. */
  points: Point[];
}

/** Find end-to-end pieces, not ordinary perpendicular shelf/wall joints.
 * No artificial per-column cuts: use only existing source panel boundaries.
 * The tiny surface offset prevents z-fighting; it is not a manufacturing gap.
 */
export function resolveWardrobePanelSeams(source: WardrobeSourceGeometry): WardrobePanelSeam[] {
  const seams: WardrobePanelSeam[] = [];
  const axes = ['x', 'y', 'z'] as const;
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  const bounds = (part: WardrobeSourcePart, axis: typeof axes[number]) =>
    [part[`${axis}1`], part[`${axis}2`]] as const;
  const groups = { slabs: source.slabs, walls: source.walls, backs: source.backs,
    frame: source.frame ?? [], masking: source.masking_bars ?? [] };
  for (const [group, parts] of Object.entries(groups)) {
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i], b = parts[j];
      if (a.subtype !== b.subtype && group === 'frame') continue;
      for (const axis of axes) {
        const [a1, a2] = bounds(a, axis), [b1, b2] = bounds(b, axis);
        const cut = near(a2, b1) ? a2 : near(b2, a1) ? a1 : null;
        if (cut === null) continue;
        const cross = axes.filter(value => value !== axis);
        if (!cross.every(value => bounds(a, value).every((v, k) => near(v, bounds(b, value)[k])))) continue;
        const [u, v] = cross;
        const [u1, u2] = bounds(a, u), [v1, v2] = bounds(a, v);
        const point = (up: number, vp: number): Point => {
          const values = { [axis]: cut, [u]: up, [v]: vp };
          return [values.x / 10, values.y / 10, values.z / 10];
        };
        // 0.05 mm visual offset on each exterior face, depth-tested normally.
        const offset = 0.05;
        seams.push({ id: `${group}-${i}-${j}-${axis}`, points: [
          point(u1 - offset, v1), point(u1 - offset, v2),
          point(u2 + offset, v1), point(u2 + offset, v2),
          point(u1, v1 - offset), point(u2, v1 - offset),
          point(u1, v2 + offset), point(u2, v2 + offset),
        ] });
      }
    }
  }
  return seams;
}

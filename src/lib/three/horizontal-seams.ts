import type { PanelData } from '@/types/shelf';

/** Presentation boundaries of actual touching parts; all coordinates remain cm.
 * No new cuts, gaps, dimensions or manufacturing operations are introduced. */
export interface HorizontalSeam {
  panelIndex: number;
  neighbourIndex: number;
  x: number;
  y: number;
  z: number;
  h: number;
  d: number;
}

export function horizontalSeams(panels: readonly PanelData[]): HorizontalSeam[] {
  const result: HorizontalSeam[] = [];
  const same = (a: number, b: number) => Math.abs(a - b) < 1e-5;
  panels.forEach((left, panelIndex) => {
    if (left.matType !== 'horizontalBase') return;
    const x = left.x + left.w / 2;
    const neighbourIndex = panels.findIndex((right, index) => index !== panelIndex
      && right.matType === 'horizontalBase'
      && same(x, right.x - right.w / 2)
      && same(left.y, right.y) && same(left.h, right.h)
      && same(left.z, right.z) && same(left.d, right.d));
    if (neighbourIndex < 0) return;
    result.push({ panelIndex, neighbourIndex, x, y: left.y, z: left.z, h: left.h, d: left.d });
  });
  return result;
}

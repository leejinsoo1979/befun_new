import type { PanelData } from '@/types/shelf';

/** Captured cabinet layouts have one bottom board per cabinet bay.
 * Four feet belong to that board; shelf span infill must not add centre feet.
 * The 25 mm setback retains Befun's existing visual offset, not a CNC dimension.
 */
export function calculateCabinetFeet(panels: PanelData[]): [number, number, number][] {
  const horizontals = panels.filter(p => p.matType === 'horizontalBase');
  if (!horizontals.length) return [];
  const bottomY = Math.min(...horizontals.map(p => p.y - p.h / 2));
  return horizontals.filter(p => Math.abs(p.y - p.h / 2 - bottomY) < 1e-7).flatMap(p => {
    const xInset = Math.min(2.5, p.w / 4);
    const zInset = Math.min(2.5, p.d / 4);
    const xs = [p.x - p.w / 2 + xInset, p.x + p.w / 2 - xInset];
    const zs = [p.z - p.d / 2 + zInset, p.z + p.d / 2 - zInset];
    return xs.flatMap(x => zs.map(z => [x, -1, z] as [number, number, number]));
  });
}

/** Type02 Mosaic short feet, measured in cm at the public API boundary.
 * Candidate supports follow bottom-row vertical centres. The 599 mm span
 * threshold and edge offsets come from mosaic-source-001, not a uniform grid.
 */
export function calculateShortFeet(panels: PanelData[], depth: number, mosaic = false): [number, number, number][] {
  const mm = (cm: number) => Math.round(cm * 1e7) / 1e6;
  const horizontals = panels.filter(p => p.matType === 'horizontalBase');
  if (!horizontals.length) return [];
  const bottomY = Math.min(...horizontals.map(p => p.y));
  const bases = horizontals.filter(p => Math.abs(p.y - bottomY) < 1e-7);
  const axes = panels.filter(p => p.matType === 'verticalBase' &&
    bases.some(base => Math.abs(p.y - p.h / 2 - (base.y + base.h / 2)) < 1e-7 &&
      // Recessed dividers sit inside a bay; they do not define an extra foot axis.
      p.z - p.d / 2 <= base.z - base.d / 2 + 1e-7 &&
      p.z + p.d / 2 >= base.z + base.d / 2 - 1e-7))
    .map(p => mm(p.x)).sort((a, b) => a - b);
  const inset = depth >= 32 ? 25 : 20;
  const edgeSpacing = 125 - inset + 9;
  const supports: number[] = [];
  for (const base of bases) {
    const left = mm(base.x - base.w / 2);
    const right = mm(base.x + base.w / 2);
    const add = (x: number) => { if (x >= left && x <= right) supports.push(x); };
    const candidates = axes.filter(x => x >= left + inset && x <= right - inset);
    if (!candidates.length) candidates.push(left + inset);
    candidates.forEach((x, index) => {
      if (index === 0 && x - left - inset >= edgeSpacing) add(left + inset);
      if (!supports.length) add(x);
      else {
        const gap = x - supports[supports.length - 1];
        if (gap > (mosaic ? 599 : 600)) add(Math.floor(x - gap / 2));
        if (gap >= (index === 0 ? edgeSpacing : 130)) add(x);
      }
      if (index === candidates.length - 1) {
        const gap = right - inset - supports[supports.length - 1];
        if (gap > (mosaic ? 599 : 600)) add(Math.floor(x + gap / 2));
        if (gap >= edgeSpacing) add(right - inset);
      }
    });
  }
  return supports.flatMap(x => [inset / 10, depth - inset / 10]
    .map(z => [x / 10, -1, z] as [number, number, number]));
}

export function calculateMosaicFeet(panels: PanelData[], _width: number, depth: number) {
  return calculateShortFeet(panels, depth, true);
}

import { BoxGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MaterialSet } from './materials';

// Native horizontal_sample.glb: outer 0.050m, flat face ends at 0.049m.
// All generated furniture uses centimetres: the same 1mm radius is 0.1cm.
export const BANDED_EDGE_RADIUS_CM = 0.1;

import { hasEdgeBanding } from './finish';

export function setPanelEdgeFinish(materials: MaterialSet, color: string): MaterialSet {
  for (const material of Object.values(materials)) {
    material.userData.edgeRadiusCm = hasEdgeBanding(color) ? BANDED_EDGE_RADIUS_CM : 0;
  }
  return materials;
}

export function panelEdgeRadius(materials: MaterialSet): number {
  return materials.verticalBase.userData.edgeRadiusCm ?? 0;
}

/** Keep the outside dimensions and six material slots; never scale a bevel. */
export function createPanelBox(w: number, h: number, d: number, radius = 0) {
  return radius > 0
    ? new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2))
    : new BoxGeometry(w, h, d);
}

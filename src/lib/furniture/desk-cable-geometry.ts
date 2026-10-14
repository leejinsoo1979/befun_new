import { BufferGeometry, CylinderGeometry, MeshBasicMaterial } from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { createBoredBox } from '../three/blum/geometry';
import type { Bore } from '../three/blum/boring';
import type { PanelData } from '@/types/shelf';
import type { DeskCableOpening } from './desk';

/** Retain the six BoxGeometry face slots after CSG. The cylindrical top bore
 * walls are edge faces; a back panel uses its single backPanel material. */
function restoreFaceGroups(geometry: BufferGeometry) {
  geometry.clearGroups();
  const normal = geometry.getAttribute('normal');
  const count = geometry.index?.count ?? normal.count;
  let previous = -1, start = 0;
  for (let i = 0; i < count; i += 3) {
    const j = geometry.index?.getX(i) ?? i;
    const x = normal.getX(j), y = normal.getY(j), z = normal.getZ(j);
    const face = Math.abs(x) > Math.abs(y) && Math.abs(x) > Math.abs(z)
      ? (x > 0 ? 0 : 1) : Math.abs(y) > Math.abs(z) ? (y > 0 ? 2 : 3) : (z > 0 ? 4 : 5);
    if (face !== previous) {
      if (previous >= 0) geometry.addGroup(start, i - start, previous);
      previous = face;
      start = i;
    }
  }
  if (previous >= 0) geometry.addGroup(start, count - start, previous);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

/** All panel and cable coordinates are cm. Bore values retain the existing
 * Blum mm contract. Caller owns and must dispose the returned geometry. */
export function createDeskPanelGeometry(panel: PanelData, bores: readonly Bore[], openings: readonly DeskCableOpening[]): BufferGeometry {
  const base = createBoredBox(panel.w, panel.h, panel.d, bores);
  if (!openings.length) return base;
  const material = new MeshBasicMaterial();
  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  let solid = new Brush(base, material);
  solid.updateMatrixWorld();
  try {
    for (const opening of openings) {
      const top = opening.surface === 'top';
      // Through both faces, independent of the reference marker's axial offset.
      const length = (top ? panel.h : panel.d) + 0.02;
      const cutter = new Brush(new CylinderGeometry(opening.radius, opening.radius, length, 96), material);
      if (!top) cutter.rotation.x = Math.PI / 2;
      cutter.position.set(opening.x - panel.x, top ? 0 : opening.y - panel.y, top ? opening.z - panel.z : 0);
      cutter.updateMatrixWorld();
      const next = new Brush(new BufferGeometry(), material);
      try {
        evaluator.evaluate(solid, cutter, SUBTRACTION, next);
      } catch (error) {
        next.disposeCacheData();
        next.geometry.dispose();
        throw error;
      } finally {
        cutter.disposeCacheData();
        cutter.geometry.dispose();
      }
      solid.disposeCacheData();
      solid.geometry.dispose();
      solid = next;
      solid.updateMatrixWorld();
    }
    restoreFaceGroups(solid.geometry);
    return solid.geometry;
  } catch (error) {
    solid.geometry.dispose();
    throw error;
  } finally {
    solid.disposeCacheData();
    material.dispose();
  }
}

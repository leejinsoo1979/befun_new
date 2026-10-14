import type { WardrobeFront, WardrobeModel } from './types';
import type { WardrobeSourcePart } from './source-types';

/** Resolve source millimetre envelopes into physical wardrobe door panels in cm.
 * Source references: renderer modules 1016 (Tone), 534/535 (Edge).
 * Edge round-handle geometry is intentionally unsupported here.
 */
export function resolveWardrobeDoor(
  source: WardrobeSourcePart,
  doors: WardrobeSourcePart[],
  model: WardrobeModel,
  sectionId: string,
  index: number,
): WardrobeFront | null {
  if (model === 'edge' && source.handle_type === 'round') return null;
  const right = source.direction === 2;
  const centerY = (source.y1 + source.y2) / 2;
  const centerZ = (source.z1 + source.z2) / 2;
  let x1 = source.x1, x2 = source.x2;
  let y1 = source.y1, y2 = source.y2;
  let handle: WardrobeFront['handle'] = null;
  let thicknessMm = 18;
  let pivotMm = right ? source.x2 - 20 : source.x1 + 20;
  let angleDeg = right ? 90 : -90;
  if (model === 'tone') {
    thicknessMm = 16;
    x1 += 1.5; x2 -= 1.5;
    y1 += 1.5; y2 -= 1.5;
    for (const edge of source.extremes ?? []) {
      if (edge === 'left') x1 -= 6;
      if (edge === 'right') x2 += 6;
      // Original renderer extends both top/bottom extremes towards +Y.
      if (edge === 'top' || edge === 'bottom') y2 += 6;
    }
    pivotMm = right ? source.x2 : source.x1;
    angleDeg = (right ? 1 : -1) * (source.subtype === 't' ? 105 : 95);
    if (source.handle === 1) handle = {
      asset: 'gripHandle', x: (right ? source.x1 + 39 : source.x2 - 39) / 10,
      y: 110.9, z: (centerZ + 10) / 10, height: null,
    };
  } else if (source.handle_type === 'line') {
    if (right) x1 += 30; else x2 -= 10;
    handle = {
      asset: source.handle === 0 ? 'fullHandleRight' : 'fullHandleLeft',
      x: (right ? source.x1 + 30 : source.x2 - 10) / 10,
      y: centerY / 10, z: centerZ / 10, height: (source.y2 - source.y1) / 10,
    };
  } else {
    const overlapsY = (other: WardrobeSourcePart) => other.y1 < source.y2 && other.y2 > source.y1;
    if (doors.some(other => other !== source && other.x2 === source.x1 && overlapsY(other))) x1 += 2;
    if (doors.some(other => other !== source && other.x1 === source.x2 && overlapsY(other))) x2 -= 2;
    if (source.handle_type === 'short' && source.handle === 0) {
      const low = source.y1 + 50 + 225 / 2;
      const high = source.y2 - 50 - 225 / 2;
      handle = {
        asset: right ? 'shortHandleRight' : 'shortHandleLeft',
        x: (right ? source.x1 : source.x2) / 10,
        y: (high < low ? centerY : Math.min(Math.max(970, low), high)) / 10,
        z: source.z2 / 10, height: 22.5,
      };
    }
  }
  if (model === 'edge' && doors.some(other => other.x1 === source.x1 && other.x2 === source.x2 && source.y1 - other.y2 === 4)) {
    angleDeg = right ? 95 : -95;
  }
  return {
    id: `door-${index}`, sectionId, type: 'door', hingeSide: right ? 'right' : 'left', external: true,
    x: (x1 + x2) / 20, y: (y1 + y2) / 20, z: centerZ / 10,
    w: (x2 - x1) / 10, h: (y2 - y1) / 10, d: thicknessMm / 10,
    matType: 'backPanel', castShadow: true, receiveShadow: true,
    pivotX: pivotMm / 10, openAngle: angleDeg * Math.PI / 180, handle,
  };
}

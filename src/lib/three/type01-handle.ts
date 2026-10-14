import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { extrudedHandleGeometry } from '../../components/three/furniture-hardware/handleGeometry.ts';
import { OBSERVED_FULL_HANDLE_30_SECTION } from '../../components/three/furniture-hardware/specs/observedHardware.ts';

/** Source anchor coordinates must survive: the 30/50mm profiles overlap the
 * panel edge. The 10/30mm front deductions are NOT handle bounding widths.
 * Profile observations: claude-2-hardware.md, 2026-10-13. The 50mm rear wing
 * uses observed bounds; its corner radii remain unmeasured, not source mesh parity.
 */
export function createType01Handle(kind: 'full-left' | 'full-right', heightCm: number) {
  const right = kind === 'full-right';
  const section: [number, number][] = OBSERVED_FULL_HANDLE_30_SECTION.map(([x,z]) => [right ? -x : x,z]);
  const profile = extrudedHandleGeometry(section, heightCm * 10);
  if (!right) return profile.scale(.1,.1,.1);
  const wing = extrudedHandleGeometry([[-29.2,-9.7],[-8.9,-9.7],[-8.9,-8.2],[-29.2,-8.2]], heightCm * 10);
  const combined = mergeGeometries([profile, wing]);
  profile.dispose();
  wing.dispose();
  return combined.scale(.1,.1,.1);
}

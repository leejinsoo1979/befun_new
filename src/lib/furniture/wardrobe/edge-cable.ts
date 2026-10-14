import type { WardrobeSectionInput } from './types';
import type { WardrobeSourcePart } from './source-types';

/** Rear cable openings are selectable levels, not a single global toggle.
 * Reject positions near back-panel joins or hidden inside a drawer box.
 */
export function resolveEdgeCableOpenings(section: WardrobeSectionInput, left: number, right: number, candidates: number[], backs: WardrobeSourcePart[], drawers: WardrobeSourcePart[], slabs: WardrobeSourcePart[]) {
  const nearEdge = (y: number) => backs.some(back => back.y1 > 0 && Math.abs(y - back.y1) < 65 || back.y2 > 0 && Math.abs(y - back.y2) < 65);
  const levels = candidates.filter(y => !nearEdge(y) && !drawers.some(d => y - 30 >= d.y1 && y + 30 <= d.y2));
  const requested = section.cableHeightsMm ?? [];
  // Older presets encoded these levels before the 9mm axis correction.
  const exact = requested.filter(y => levels.includes(y));
  const selected = new Set(exact.length ? exact : requested.map(y => y + 9).filter(y => levels.includes(y)));
  const x = Math.round(left + Math.round((right - left) / 2));
  const holes = levels.filter(y => selected.has(y)).flatMap(y => {
    const slab = slabs.filter(s => s.y2 <= y).sort((a,b) => b.y2 - a.y2)[0];
    const raised = slab && Math.abs(slab.y2 - (y - 29)) < 1 ? 22 : 0;
    const center = y + raised;
    if (raised && nearEdge(center)) return [];
    return [{ x1: x, x2: x, y1: center, y2: center, z1: 6, z2: 6, radius: 30, subtype: '', sectionId: section.id }];
  });
  return { levels, holes };
}

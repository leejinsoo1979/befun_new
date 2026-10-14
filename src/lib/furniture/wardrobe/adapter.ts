import type { PanelData } from '@/types/shelf';
import { resolveEdgeDrawer } from './drawers';
import { resolveToneDrawer } from './tone-drawers';
import { resolveWardrobeDoor } from './fronts';
import type { WardrobeResult } from './types';
import type { WardrobeSourceGeometry, WardrobeSourcePart } from './source-types';

/** Convert a verified wardrobe render result. Does not invent missing source parts.
 * Coordinates remain centered in X exactly as the source render geometry.
 */
export function adaptWardrobeRenderGeometry(source: WardrobeSourceGeometry, sectionIds: readonly string[] = []): WardrobeResult {
  const unsupported: string[] = [];
  const panel = (part: WardrobeSourcePart, matType: PanelData['matType']): PanelData => ({
    x: (part.x1 + part.x2) / 20, y: (part.y1 + part.y2) / 20, z: (part.z1 + part.z2) / 20,
    w: (part.x2 - part.x1) / 10, h: (part.y2 - part.y1) / 10, d: (part.z2 - part.z1) / 10,
    matType, castShadow: true, receiveShadow: true,
  });
  const sectionId = (part: WardrobeSourcePart): string => {
    const x = (part.x1 + part.x2) / 2, y = (part.y1 + part.y2) / 2;
    const index = source.components.findIndex(component =>
      x >= component.x1 && x <= component.x2 && y >= component.y1 && y <= component.y2);
    return sectionIds[index] ?? String(index + 1);
  };
  const panels = [
    ...source.slabs.map(part => panel(part, 'horizontalBase')),
    ...source.walls.map(part => panel(part, 'verticalBase')),
    ...source.backs.map(part => panel(part, 'backPanel')),
    ...(source.frame ?? []).map(part => panel(part, part.subtype === 't' ? 'horizontalBase' : 'verticalBase')),
    ...(source.masking_bars ?? []).map(part => panel(part, 'backPanel')),
  ];
  const fronts = source.doors.flatMap((door, index) => {
    const resolved = resolveWardrobeDoor(door, source.doors, source.model, sectionId(door), index);
    if (!resolved) unsupported.push(`door:${index}:round-handle`);
    return resolved ? [resolved] : [];
  });
  const drawers = source.drawers.flatMap((drawer, index) => {
    const resolved = source.model === 'edge'
      ? resolveEdgeDrawer(drawer, source.drawers, source.doors, sectionId(drawer), index)
      : resolveToneDrawer(drawer, source.drawers, source.drawer_fronts ?? [], sectionId(drawer), index);
    if (!resolved) unsupported.push(`drawer:${index}:unsupported-subtype`);
    return resolved ? [resolved] : [];
  });
  if (source.model === 'tone' && drawers.length) unsupported.push('tone-drawer-runner-travel-unmeasured');
  if (source.lighting?.length) unsupported.push('wardrobe-lighting-assets');
  if (source.bars.length) unsupported.push('wardrobe-bar-cross-section-assets');
  return {
    panels, fronts, drawers,
    bars: source.bars.map((part, index) => ({
      id: `bar-${index}`, sectionId: sectionId(part),
      ...panel(part, 'backPanel'),
      y: (part.subtype === 'z' ? part.y2 : (part.y1 + part.y2) / 2) / 10,
      axis: part.subtype === 'z' ? 'z' : 'x', radius: null,
    })),
    openings: source.components.flatMap((component, sectionIndex) => {
      const left = component.x1 + 9, right = component.x2 - 9;
      const levels = source.slabs.filter(slab => slab.x1 <= left && slab.x2 >= right)
        .sort((a, b) => a.y1 - b.y1);
      return levels.slice(0, -1).flatMap((bottom, index) => {
        const top = levels[index + 1];
        const backZ = Math.max(0, ...source.backs.filter(back => back.x1 <= left && back.x2 >= right && back.y1 < top.y1 && back.y2 > bottom.y2).map(back => back.z2));
        const frontZ = Math.min(bottom.z2, top.z2);
        if (top.y1 <= bottom.y2 || frontZ <= backZ) return [];
        return [{ sectionId: sectionIds[sectionIndex] ?? String(sectionIndex + 1), x: (left + right) / 20,
          y: (bottom.y2 + top.y1) / 20, z: (backZ + frontZ) / 20,
          width: (right - left) / 10, height: (top.y1 - bottom.y2) / 10, depth: (frontZ - backZ) / 10 }];
      });
    }),
    sections: source.components.map((part, index) => ({
      id: sectionIds[index] ?? String(index + 1), x: (part.x1 + part.x2) / 20,
      width: (part.x2 - part.x1) / 10, height: (part.y2 - part.y1) / 10, depth: (part.z2 - part.z1) / 10,
    })),
    unsupported,
  };
}

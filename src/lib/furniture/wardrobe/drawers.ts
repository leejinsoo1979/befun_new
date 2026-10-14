import type { PanelData } from '@/types/shelf';
import type { WardrobeDrawer, WardrobeFront } from './types';
import type { WardrobeSourcePart } from './source-types';

/** Edge inlay drawers: resolve the physical five-panel box and hinge clearance.
 * Dimensions are in mm until the final cm conversion. Overlay/Plane is separate.
 */
export function resolveEdgeDrawer(source: WardrobeSourcePart, drawers: WardrobeSourcePart[], doors: WardrobeSourcePart[], sectionId: string, index: number): WardrobeDrawer | null {
  if (!['d', 'e'].includes(source.subtype ?? '')) return null;
  const adjacent = doors.filter(door => source.y1 >= door.y1 && source.y2 <= door.y2);
  const left = adjacent.some(door => door.x1 === source.x1 && door.direction === 1);
  const right = adjacent.some(door => door.x2 === source.x2 && door.direction === 2);
  const spacer = (Number(left) + Number(right)) * 38;
  const external = source.subtype === 'e';
  const width = source.x2 - source.x1 - spacer, height = source.y2 - source.y1, depth = source.z2 - source.z1;
  const center = { x: (source.x1 + source.x2) / 2 + (left && !right ? spacer / 2 : right && !left ? -spacer / 2 : 0), y: (source.y1 + source.y2) / 2, z: (source.z1 + source.z2) / 2 };
  const panel = (x: number, y: number, z: number, w: number, h: number, d: number, matType: PanelData['matType']): PanelData => ({
    x: (center.x + x) / 10, y: (center.y + y) / 10, z: (center.z + z) / 10,
    w: w / 10, h: h / 10, d: d / 10, matType, castShadow: true, receiveShadow: true,
  });
  const leftExtension = !external && left ? 9 : 0, rightExtension = !external && right ? 9 : 0;
  const frontPanel = panel((rightExtension - leftExtension) / 2, 2, depth / 2 - 6, width + leftExtension + rightExtension, height + 16, 12, 'backPanel');
  const front: WardrobeFront = {
    ...frontPanel, id: `drawer-front-${index}`, sectionId, type: 'drawer', hingeSide: null, external,
    pivotX: frontPanel.x, openAngle: 0,
    handle: external ? { asset: 'fullHandleTop', x: frontPanel.x, y: frontPanel.y + frontPanel.h / 2, z: frontPanel.z, height: null } : null,
  };
  const parts = [
    panel(0, 0, -depth / 2 + 6, width, height, 12, 'backPanel'),
    panel(-width / 2 + 6, 0, 0, 12, height - 30, depth - 24, 'verticalBase'),
    panel(width / 2 - 6, 0, 0, 12, height - 30, depth - 24, 'verticalBase'),
    panel(0, -(height - 30) / 2 + 6, 0, width - 24, 12, depth - 24, 'horizontalBase'),
  ];
  const stack = drawers.filter(drawer => drawer.x1 === source.x1 || drawer.x2 === source.x2).sort((a, b) => b.y1 - a.y1);
  const rank = stack.findIndex(drawer => drawer.y1 === source.y1) + 1;
  return { id: `drawer-${index}`, sectionId, front, parts, travelCm: rank / stack.length * .95 * depth / 10 };
}

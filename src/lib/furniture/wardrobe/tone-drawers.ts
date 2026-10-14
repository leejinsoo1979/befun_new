import type { PanelData } from '@/types/shelf';
import type { WardrobeDrawer, WardrobeFront } from './types';
import type { WardrobeSourcePart } from './source-types';

/** Tone's physical 12mm box, validated against its actual getRender() output.
 * External front recipes are supplied separately: they are larger than the box.
 */
export function resolveToneDrawer(source: WardrobeSourcePart, drawers: WardrobeSourcePart[], faces: WardrobeSourcePart[], sectionId: string, index: number): WardrobeDrawer | null {
  if (!['i', 'b', 'e'].includes(source.subtype ?? '')) return null;
  const external = source.subtype === 'e';
  const stack = drawers.filter(part => part.m_config_id === source.m_config_id && part.subtype === 'e').sort((a, b) => a.y1 - b.y1);
  const face = external ? faces.filter(part => part.m_config_id === source.m_config_id).sort((a, b) => a.y1 - b.y1)[stack.indexOf(source)] : source;
  if (!face) return null;
  const rear = source.z1 + (external ? 18 : 0), frontBack = source.z2 - (external ? 0 : 12);
  const panel = (x1: number, x2: number, y1: number, y2: number, z1: number, z2: number, matType: PanelData['matType']): PanelData => ({
    x: (x1 + x2) / 20, y: (y1 + y2) / 20, z: (z1 + z2) / 20,
    w: (x2 - x1) / 10, h: (y2 - y1) / 10, d: (z2 - z1) / 10,
    matType, castShadow: true, receiveShadow: true,
  });
  const facePanel = panel(face.x1, face.x2, face.y1, face.y2, frontBack, frontBack + 12, 'backPanel');
  const front: WardrobeFront = { ...facePanel, id: `drawer-front-${index}`, sectionId, type: 'drawer',
    hingeSide: null, external, pivotX: facePanel.x, openAngle: 0, handle: null };
  const parts = [
    panel(source.x1, source.x2, source.y1, source.y2, rear, rear + 12, 'backPanel'),
    panel(source.x1, source.x1 + 12, source.y1, source.y2, rear + 12, frontBack, 'verticalBase'),
    panel(source.x2 - 12, source.x2, source.y1, source.y2, rear + 12, frontBack, 'verticalBase'),
    panel(source.x1 + 12, source.x2 - 12, source.y1, source.y1 + 12, rear + 12, frontBack, 'horizontalBase'),
  ];
  // This safe visual travel is not a measured runner specification.
  return { id: `drawer-${index}`, sectionId, front, parts, travelCm: (source.z2 - rear) * .8 / 10 };
}

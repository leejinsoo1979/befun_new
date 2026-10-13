import type { PanelCut } from './geometry';
import type { Point } from './model';

export function cutBounds(c: PanelCut) {
  const r = c.kind === 'circle' ? c.diameter / 2 : 0;
  return { x: c.x - r, y: c.y - r, width: c.kind === 'circle' ? c.diameter : c.width, height: c.kind === 'circle' ? c.diameter : c.height };
}
export function cutsCenter(cuts: PanelCut[]): Point {
  const bounds = cuts.map(cutBounds);
  return { x: (Math.min(...bounds.map(b => b.x)) + Math.max(...bounds.map(b => b.x + b.width))) / 2,
    y: (Math.min(...bounds.map(b => b.y)) + Math.max(...bounds.map(b => b.y + b.height))) / 2 };
}
export function groupMembers(cuts: { id: string; groupId?: string }[], ids: string[]): string[] {
  const groups = new Set(cuts.filter(c => ids.includes(c.id) && c.groupId).map(c => c.groupId));
  return cuts.filter(c => ids.includes(c.id) || (c.groupId && groups.has(c.groupId))).map(c => c.id);
}
export function cloneCuts(cuts: PanelCut[]): PanelCut[] {
  const groups = new Map<string, string>();
  return cuts.map(c => {
    if (c.groupId && !groups.has(c.groupId)) groups.set(c.groupId, crypto.randomUUID());
    return { ...c, id: crypto.randomUUID(), ...(c.groupId ? { groupId: groups.get(c.groupId) } : {}) };
  });
}

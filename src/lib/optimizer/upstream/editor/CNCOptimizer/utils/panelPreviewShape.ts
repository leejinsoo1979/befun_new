import type { PlacedPanel } from '../types';
import type { CuttingBoardShape } from './cuttingBoardShape';

/** Display-only outline. Never attach this derived shape to manufacturing/export data. */
export function resolvePanelPreviewShape(panel: Pick<PlacedPanel, 'name' | 'width' | 'height' | 'rotated' | 'cuttingBoardShape' | 'sideNotches' | 'cornerNotch'>):
  { shape: CuttingBoardShape; rotated: boolean } | undefined {
  if (panel.cuttingBoardShape) return { shape: panel.cuttingBoardShape, rotated: panel.rotated };
  if (!panel.sideNotches?.length && !panel.cornerNotch) return undefined;

  const width = panel.rotated ? panel.height : panel.width;
  const height = panel.rotated ? panel.width : panel.height;
  const right = panel.name.includes('우측');
  // Factory side-panel frame: width=depth, height=vertical height; right faces mirror
  // the left. Optimizer rotation transposes this frame (manual shapes rotate 90°).
  const cuts: CuttingBoardShape['cuts'] = (panel.sideNotches ?? []).flatMap((notch, index) => {
    if (![notch.y, notch.z, notch.fromBottom].every(Number.isFinite) || notch.y <= 0 || notch.z <= 0) return [];
    const depthStart = right ? panel.width - notch.z : 0;
    const heightStart = panel.height - notch.fromBottom - notch.y;
    return [{
      id: `side-notch-${index}`, kind: 'notch' as const,
      x: panel.rotated ? heightStart : depthStart,
      y: panel.rotated ? depthStart : heightStart,
      width: panel.rotated ? notch.y : notch.z,
      height: panel.rotated ? notch.z : notch.y,
    }];
  });
  const corner = cornerNotchPreview(panel);
  if (corner) cuts.push({ id: 'corner-notch', kind: 'notch', ...corner.rect });
  return cuts.length ? { shape: { width, height, cuts }, rotated: false } : undefined;
}

/** 3D 판재의 뒤쪽 코너를 원판 축·네스팅 전치와 함께 옮긴다. 제조 경로는 만들지 않는다. */
export function cornerNotchPreview(panel: Pick<PlacedPanel, 'width' | 'height' | 'rotated' | 'cornerNotch'>) {
  const notch = panel.cornerNotch;
  if (!notch || ![notch.width, notch.depth, panel.width, panel.height].every(n => Number.isFinite(n) && n > 0)) return undefined;
  const alongX = notch.acrossAxis === 'x';
  const width = alongX ? notch.width : notch.depth;
  const height = alongX ? notch.depth : notch.width;
  const x = alongX ? (notch.side === 'left' ? 0 : panel.width - width) : panel.width - width;
  const y = alongX ? 0 : (notch.side === 'left' ? 0 : panel.height - height);
  const edgeX = alongX && notch.side === 'left' ? x + width : x;
  const edgeY = alongX || notch.side === 'left' ? y + height : y;
  const outsideX = alongX && notch.side === 'left' ? x : x + width;
  const outsideY = alongX || notch.side === 'left' ? y : y + height;
  const point = (px: number, py: number) => panel.rotated ? { x: py, y: px } : { x: px, y: py };
  return {
    rect: panel.rotated ? { x: y, y: x, width: height, height: width } : { x, y, width, height },
    boundary: [point(outsideX, edgeY), point(edgeX, edgeY), point(edgeX, outsideY)],
  };
}

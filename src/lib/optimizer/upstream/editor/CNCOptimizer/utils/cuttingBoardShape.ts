import { rotateProfile, type ShapeProfile } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/shapeProfile';
import type { PanelCut } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/geometry';
import { panelOutline, panelBounds, rotatePoint } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/geometry';
import type { BoardPanel } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/model';

export interface CuttingBoardShape { width: number; height: number; cuts: PanelCut[]; placementAngle?: number; profile?: ShapeProfile }
/** 네스팅은 직사각 원판 기준. 가공 좌표도 짧은 변×긴 변 프레임으로 함께 회전한다. */
export function normalizedCuttingShape(panel: BoardPanel): CuttingBoardShape {
  if (panel.width <= panel.height) return { width: panel.width, height: panel.height, cuts: panel.cuts || [], ...(panel.profile ? { profile: panel.profile } : {}) };
  return { width: panel.height, height: panel.width, ...(panel.profile ? { profile: rotateProfile(panel.profile) } : {}), cuts: (panel.cuts || []).map(c => c.kind === 'circle'
    ? { ...c, x: panel.height - c.y, y: c.x }
    : { ...c, x: panel.height - c.y - c.height, y: c.x, width: c.height, height: c.width, ...(c.profile ? { profile: rotateProfile(c.profile) } : {}) }) };
}
export function cuttingShapePoint(shape: CuttingBoardShape, point: { x: number; y: number }, rotated: boolean) {
  if (shape.placementAngle !== undefined) {
    const bounds = panelBounds({ id: '', name: '', x: 0, y: 0, width: shape.width, height: shape.height, rotation: shape.placementAngle });
    const local = rotatePoint({ x: point.x - shape.width / 2, y: point.y - shape.height / 2 }, shape.placementAngle);
    return { x: local.x + shape.width / 2 - bounds.x, y: local.y + shape.height / 2 - bounds.y };
  }
  return rotated ? { x: shape.height - point.y, y: point.x } : point;
}
/** Canvas와 DXF가 같은 외곽선·회전식을 사용한다. */
export function placedCuttingShape(shape: CuttingBoardShape, rotated: boolean) {
  const point = (x: number, y: number) => cuttingShapePoint(shape, { x, y }, rotated);
  return {
    rings: panelOutline(shape).flatMap(poly => poly.map(ring => ring.map(([x, y]) => point(x, y)))),
    circles: shape.cuts.filter(c => c.kind === 'circle').map(c => ({ ...point(c.x, c.y), radius: c.diameter / 2 })),
  };
}
export function traceCuttingShape(ctx: CanvasRenderingContext2D, shape: CuttingBoardShape, rotated: boolean, x: number, y: number) {
  const geometry = placedCuttingShape(shape, rotated);
  ctx.beginPath();
  geometry.rings.forEach(ring => {
    ring.forEach((p, i) => { if (i === 0) ctx.moveTo(x + p.x, y + p.y); else ctx.lineTo(x + p.x, y + p.y); });
    ctx.closePath();
  });
  geometry.circles.forEach(c => {
    ctx.moveTo(x + c.x + c.radius, y + c.y);
    ctx.arc(x + c.x, y + c.y, c.radius, 0, Math.PI * 2); ctx.closePath();
  });
}

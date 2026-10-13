/** 편집 전용 가이드. 용지는 캔버스 px, 컷팅보드는 mm를 사용한다. */
export interface ManualGuides { vertical: number[]; horizontal: number[] }
export const EMPTY_GUIDES: ManualGuides = { vertical: [], horizontal: [] };
export function snapGuidePoint<T extends { x: number; y: number }>(point: T, guides: ManualGuides, threshold: number): T {
  const nearest = (value: number, lines: number[]) => lines.reduce((best, line) => Math.abs(line - value) <= threshold && Math.abs(line - value) < Math.abs(best - value) ? line : best, Infinity);
  const x = nearest(point.x, guides.vertical), y = nearest(point.y, guides.horizontal);
  return { ...point, x: Number.isFinite(x) ? x : point.x, y: Number.isFinite(y) ? y : point.y };
}
/** 이동할 때 양 끝과 중심을 각각 비교한다. 가로·세로가 동시에 맞으면 교차점 스냅이다. */
export function snapGuideBounds(bounds: { x: number; y: number; width: number; height: number }, guides: ManualGuides, threshold: number) {
  const delta = (values: number[], lines: number[]) => {
    let best = Infinity;
    for (const value of values) for (const line of lines) if (Math.abs(line - value) <= threshold && Math.abs(line - value) < Math.abs(best)) best = line - value;
    return Number.isFinite(best) ? best : 0;
  };
  return { x: delta([bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width], guides.vertical),
    y: delta([bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height], guides.horizontal) };
}

const canvasGuides = new WeakMap<object, () => ManualGuides>();
export function registerCanvasGuides(canvas: object, read: () => ManualGuides) {
  canvasGuides.set(canvas, read);
  return () => canvasGuides.delete(canvas);
}
export function readCanvasGuides(canvas: object): ManualGuides { return canvasGuides.get(canvas)?.() ?? EMPTY_GUIDES; }

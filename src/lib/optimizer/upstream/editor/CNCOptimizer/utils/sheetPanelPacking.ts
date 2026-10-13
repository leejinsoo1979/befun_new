import type { CutSettings } from '@/lib/optimizer/upstream/types/cutlist';
import type { BoardPanel, CuttingBoardDocument } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/model';
import { fitsBoard, roundMm } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/model';
import { panelBounds, validCuts } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/geometry';
import { MaxRectsPacker } from './binPacking';

export interface SheetPanelInput { width: number; height: number; quantity: number; name?: string }
const EPS = 1e-7;
const NO_SPACE = '현재 시트에 모든 패널을 배치할 공간을 찾지 못했습니다. 크기·수량을 줄이거나 다른 시트를 추가해 주세요.';

/** 현재 원장만 재배치한다. 가공·회전·결 방향은 유지하고 그룹 패널은 제자리에 둔다. */
export function arrangeSheetPanels(board: CuttingBoardDocument, obstacles: BoardPanel[], settings: CutSettings,
  additions: BoardPanel[] = []): CuttingBoardDocument {
  const values = [board.width, board.height, settings.kerf, settings.trimLeft ?? 0, settings.trimRight ?? 0, settings.trimTop ?? 0, settings.trimBottom ?? 0];
  if (values.some(n => !Number.isFinite(n) || n < 0)) throw new Error('원장 규격·톱날 간격·테두리 여백을 확인해 주세요.');
  const [width, height, gap, left, right, top, bottom] = values;
  const usableWidth = width - left - right, usableHeight = height - top - bottom;
  if (usableWidth <= 0 || usableHeight <= 0) throw new Error('원장 규격이 테두리 여백보다 커야 합니다.');
  const panels = [...board.panels, ...additions];
  if (panels.length > 2000) throw new Error('시트 한 장에는 패널을 최대 2000개까지 추가할 수 있습니다.');
  if (panels.some(p => ![p.x, p.y, p.width, p.height, p.rotation ?? 0].every(Number.isFinite) || p.width < 1 || p.height < 1 || !validCuts(p))) {
    throw new Error('패널 크기와 가공 형상을 확인해 주세요.');
  }
  const grouped = board.panels.filter(p => p.groupId);
  const fixed = [...obstacles, ...grouped];
  const movable = panels.filter(p => !grouped.includes(p));
  const bounds = new Map(panels.map(p => [p.id, panelBounds(p)]));
  const metric = (p: BoardPanel, sort: number) => {
    const b = bounds.get(p.id)!;
    return sort === 0 ? b.width * b.height : sort === 1 ? Math.max(b.width, b.height) : sort === 2 ? b.width : b.height;
  };
  const pack = (order: BoardPanel[], held: BoardPanel[]) => {
    // 오른쪽·아래쪽 가상 간격은 원장 경계에서 톱날 간격을 중복 차감하지 않게 한다.
    const packer = new MaxRectsPacker(usableWidth + gap + EPS, usableHeight + gap + EPS, false, 0);
    for (const p of held) {
      const b = panelBounds(p);
      const x = Math.max(0, b.x - left), y = Math.max(0, b.y - top);
      const x2 = Math.min(usableWidth + gap, b.x - left + b.width + gap);
      const y2 = Math.min(usableHeight + gap, b.y - top + b.height + gap);
      if (x2 > x && y2 > y) packer.reserve({ x, y, width: x2 - x, height: y2 - y });
    }
    const placed = new Map<string, BoardPanel>(grouped.map(p => [p.id, p]));
    for (const p of held) if (panels.includes(p)) placed.set(p.id, p);
    for (const p of order) {
      const b = bounds.get(p.id)!;
      const rect = packer.pack({ width: b.width + gap, height: b.height + gap });
      if (!rect) return null;
      placed.set(p.id, { ...p, x: p.x + rect.x! + left - b.x, y: p.y + rect.y! + top - b.y });
    }
    const next = panels.map(p => placed.get(p.id)!);
    // 적용할 때와 같은 외곽 사각형으로 검산한다. 회전·곡선의 빈 모서리에 끼워 넣지 않는다.
    const occupied = obstacles.map(panelBounds);
    for (const p of next) {
      const b = panelBounds(p);
      if (!fitsBoard(p, board) || b.x < left - EPS || b.y < top - EPS ||
        b.x + b.width > width - right + EPS || b.y + b.height > height - bottom + EPS ||
        occupied.some(o => b.x < o.x + o.width + gap - EPS && b.x + b.width + gap > o.x + EPS &&
          b.y < o.y + o.height + gap - EPS && b.y + b.height + gap > o.y + EPS)) return null;
      occupied.push(b);
    }
    return { ...board, panels: next };
  };
  let best: CuttingBoardDocument | null = null, bestArea = Infinity;
  const consider = (candidate: CuttingBoardDocument | null) => {
    if (!candidate) return;
    const boxes = candidate.panels.map(panelBounds);
    const area = Math.max(0, ...boxes.map(b => b.x + b.width - left)) * Math.max(0, ...boxes.map(b => b.y + b.height - top));
    if (area < bestArea) { best = candidate; bestArea = area; }
  };
  for (let sort = 0; sort < 4; sort += 1) {
    consider(pack([...movable].sort((a, b) => metric(b, sort) - metric(a, sort)), fixed));
  }
  // 기존의 좋은 배치를 놓치지 않도록 기존 위치를 고정한 추가 배치도 비교한다.
  consider(pack(additions, [...obstacles, ...board.panels]));
  if (!best) throw new Error(NO_SPACE);
  return best;
}

export function addSheetPanels(board: CuttingBoardDocument, obstacles: BoardPanel[], settings: CutSettings, input: SheetPanelInput) {
  if (![input.width, input.height].every(n => Number.isFinite(n) && n >= 1)) throw new Error('가로·세로를 1mm 이상으로 입력해 주세요.');
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 2000 - board.panels.length) {
    throw new Error(`수량은 1부터 ${Math.max(0, 2000 - board.panels.length)}까지의 정수로 입력해 주세요.`);
  }
  const name = input.name?.trim();
  const additions = Array.from({ length: input.quantity }, (_, i): BoardPanel => ({
    id: crypto.randomUUID(), name: name || `패널 ${board.panels.length + i + 1}`,
    x: 0, y: 0, width: roundMm(input.width), height: roundMm(input.height),
  }));
  return arrangeSheetPanels(board, obstacles, settings, additions);
}

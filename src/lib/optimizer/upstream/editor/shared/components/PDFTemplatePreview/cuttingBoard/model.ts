import type { ShapeProfile } from './shapeProfile';
import type { ManualGuides } from '../canvasUx/manualGuides';
import { panelBounds, panelCorners, turnPanel, validCuts, type PanelCut } from './geometry';
// 화면 배율과 무관하게 보드와 패널의 모든 치수는 mm로 보관한다.
export interface BoardPanel {
  id: string;
  name: string;
  groupId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  profile?: ShapeProfile;
  cuts?: PanelCut[];
}

export interface CuttingBoardDocument {
  guides?: ManualGuides;
  version: 1;
  width: number;
  height: number;
  thickness: number;
  material?: string;
  panels: BoardPanel[];
}

export interface Point { x: number; y: number }

/** 실치수와 가공 좌표를 유지한 채 배치 각도만 바꾼다. */
export function rotatedPanel(panel: BoardPanel, board: CuttingBoardDocument): BoardPanel | null {
  return turnPanel(panel, (panel.rotation || 0) + 90, board);
}

/** 보기 회전은 패널의 실제 좌표·치수를 변경하지 않는다. */
export function viewPoint(p: Point, board: Pick<CuttingBoardDocument, 'width' | 'height'>, turns: number): Point {
  switch ((turns % 4 + 4) % 4) {
    case 1: return { x: board.height - p.y, y: p.x };
    case 2: return { x: board.width - p.x, y: board.height - p.y };
    case 3: return { x: p.y, y: board.width - p.x };
    default: return p;
  }
}

export function modelPoint(p: Point, board: CuttingBoardDocument, turns: number): Point {
  const size = turns % 2 ? { width: board.height, height: board.width } : board;
  return viewPoint(p, size, -turns);
}

export function viewPanel(panel: BoardPanel, board: CuttingBoardDocument, turns: number): BoardPanel {
  const a = viewPoint(panel, board, turns);
  const b = viewPoint({ x: panel.x + panel.width, y: panel.y + panel.height }, board, turns);
  return { ...panel, x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
    width: roundMm(Math.abs(a.x - b.x)), height: roundMm(Math.abs(a.y - b.y)) };
}

// CNCOptimizer의 기본 원장 규격과 공통 판재 두께.
export const EMPTY_BOARD: CuttingBoardDocument = {
  version: 1, width: 1220, height: 2440, thickness: 18, panels: [],
};

export const roundMm = (value: number) => Math.round(value * 10) / 10;
const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

export function boardPoint(point: Point, board: CuttingBoardDocument): Point {
  return { x: roundMm(clamp(point.x, board.width)), y: roundMm(clamp(point.y, board.height)) };
}

export function drawnRect(start: Point, end: Point, board: CuttingBoardDocument) {
  const a = boardPoint(start, board);
  const b = boardPoint(end, board);
  return {
    x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
    width: roundMm(Math.abs(a.x - b.x)), height: roundMm(Math.abs(a.y - b.y)),
  };
}

export function movedPanel(panel: BoardPanel, delta: Point, board: CuttingBoardDocument): BoardPanel {
  const bounds = panelBounds(panel);
  return { ...panel,
    x: panel.x + Math.max(-bounds.x, Math.min(board.width - bounds.x - bounds.width, delta.x)),
    y: panel.y + Math.max(-bounds.y, Math.min(board.height - bounds.y - bounds.height, delta.y)) };
}

export function fitsBoard(panel: BoardPanel, board: Pick<CuttingBoardDocument, 'width' | 'height'>): boolean {
  return [panel.x, panel.y, panel.width, panel.height, panel.rotation ?? 0].every(Number.isFinite)
    && panel.width >= 1 && panel.height >= 1 && validCuts(panel)
    && panelCorners(panel).every(p => p.x >= -1e-7 && p.y >= -1e-7 && p.x <= board.width + 1e-7 && p.y <= board.height + 1e-7);
}

export function overlappingPanels(panels: BoardPanel[]): Set<string> {
  const ids = new Set<string>();
  // 회전 사각형의 분리축 검사: 대각선 배치의 빈 영역을 겹침으로 표시하지 않는다.
  const polygons = panels.map(panelCorners);
  panels.forEach((a, i) => panels.slice(i + 1).forEach((b, j) => {
    const pa = polygons[i], pb = polygons[i + j + 1];
    const separated = [pa, pb].some(poly => poly.some((p, k) => {
      const q = poly[(k + 1) % 4], axis = { x: -(q.y - p.y), y: q.x - p.x };
      const aa = pa.map(v => v.x * axis.x + v.y * axis.y), bb = pb.map(v => v.x * axis.x + v.y * axis.y);
      return Math.max(...aa) <= Math.min(...bb) + 1e-7 || Math.max(...bb) <= Math.min(...aa) + 1e-7;
    }));
    if (!separated) { ids.add(a.id); ids.add(b.id); }
  }));
  return ids;
}

export function parseBoard(json: string): CuttingBoardDocument {
  const value = JSON.parse(json) as CuttingBoardDocument;
  if (!value || value.version !== 1 || ![value.width, value.height, value.thickness].every(v => Number.isFinite(v) && v >= 1)
    || (value.material !== undefined && (typeof value.material !== 'string' || !value.material.trim()))
    || !Array.isArray(value.panels) || value.panels.length > 2000
    || value.panels.some(p => !p || typeof p.id !== 'string' || !p.id || typeof p.name !== 'string' || (p.groupId !== undefined && (typeof p.groupId !== 'string' || !p.groupId)) || !fitsBoard(p, value))
    || new Set(value.panels.map(p => p.id)).size !== value.panels.length) {
    throw new Error('올바른 컷팅보드 파일이 아닙니다.');
  }
  if (value.guides && (!Array.isArray(value.guides.vertical) || !Array.isArray(value.guides.horizontal)
    || value.guides.vertical.length > 100 || value.guides.horizontal.length > 100
    || value.guides.vertical.some(n => !Number.isFinite(n) || n < 0 || n > value.width)
    || value.guides.horizontal.some(n => !Number.isFinite(n) || n < 0 || n > value.height))) throw new Error('올바른 가이드 좌표가 아닙니다.');
  return value;
}

export function cuttingListCsv(board: CuttingBoardDocument): string {
  // 스프레드시트에서 패널 이름을 수식으로 실행하지 않도록 한다.
  const cell = (s: string) => `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  return '\uFEFF' + [
    '패널명,가로(mm),세로(mm),두께(mm),수량,X(mm),Y(mm),회전(도),가공정보(JSON)',
    ...board.panels.map(p => [cell(p.name), p.width, p.height, board.thickness, 1, roundMm(p.x), roundMm(p.y), p.rotation || 0, cell(JSON.stringify(p.cuts || []))].join(',')),
  ].join('\r\n');
}

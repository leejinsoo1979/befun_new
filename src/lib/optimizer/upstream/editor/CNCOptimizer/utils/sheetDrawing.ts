import type { CutSettings, Panel } from '@/lib/optimizer/upstream/types/cutlist';
import type { OptimizedResult, PlacedPanel } from '../types';
import { fitsBoard, parseBoard, type BoardPanel, type CuttingBoardDocument } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/model';
import { panelBounds } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/geometry';
import { normalizedCuttingShape } from './cuttingBoardShape';

const PREFIX = 'cnc-drawn:';
/** 입력이나 재단 설정이 달라지면 저장한 수동 배치를 재사용하지 않는다. */
export function readSheetDrawing(key: string, input: unknown): OptimizedResult[] | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    return saved?.signature === JSON.stringify(input) && Array.isArray(saved.results) && saved.results.length
      ? saved.results : null;
  } catch { return null; }
}
export function saveSheetDrawing(key: string, input: unknown, results: OptimizedResult[]) {
  try { localStorage.setItem(key, JSON.stringify({ signature: JSON.stringify(input), results })); }
  catch { throw new Error('저장 공간이 부족해 적용하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.'); }
}
export const isDrawnPanel = (id: string) => id.startsWith(PREFIX);
export function placedBoardPanel(panel: PlacedPanel): BoardPanel {
  const shape = panel.cuttingBoardShape;
  if (!shape) return { id: panel.id, name: panel.name, x: panel.x, y: panel.y, width: panel.rotated ? panel.height : panel.width, height: panel.rotated ? panel.width : panel.height };
  const rotation = shape.placementAngle ?? (panel.rotated ? 90 : 0);
  const bounds = panelBounds({ id: '', name: '', x: 0, y: 0, width: shape.width, height: shape.height, rotation });
  return { id: panel.id, name: panel.name, x: panel.x - bounds.x, y: panel.y - bounds.y, width: shape.width, height: shape.height, rotation, cuts: shape.cuts, profile: shape.profile };
}
export function sheetDrawing(result: OptimizedResult) {
  return {
    board: { version: 1, width: result.stockPanel.width, height: result.stockPanel.height,
      thickness: result.stockPanel.thickness ?? 18, material: result.stockPanel.material,
      panels: result.panels.filter(p => isDrawnPanel(p.id)).map(placedBoardPanel) } as CuttingBoardDocument,
    obstacles: result.panels.filter(p => !isDrawnPanel(p.id)).map(placedBoardPanel),
  };
}

/** 기존 가구 패널의 위치·보링 데이터는 그대로 두고 현재 원장의 직접 그린 패널만 교체한다. */
export function applySheetDrawing(result: OptimizedResult, input: Panel[], document: CuttingBoardDocument, settings: CutSettings) {
  const board = parseBoard(JSON.stringify(document));
  const original = sheetDrawing(result).board;
  if (board.width !== original.width || board.height !== original.height || board.thickness !== original.thickness || board.material !== original.material) throw new Error('선택한 원장의 규격과 재질을 유지해 주세요.');
  const fixed = result.panels.filter(p => !isDrawnPanel(p.id));
  const kerf = Math.max(0, settings.kerf || 0);
  const occupied = fixed.map(p => panelBounds(placedBoardPanel(p)));
  for (const panel of board.panels) {
    const bounds = panelBounds(panel);
    if (!fitsBoard(panel, board) || bounds.x < (settings.trimLeft || 0) - 1e-7 || bounds.y < (settings.trimTop || 0) - 1e-7 ||
      bounds.x + bounds.width > board.width - (settings.trimRight || 0) + 1e-7 || bounds.y + bounds.height > board.height - (settings.trimBottom || 0) + 1e-7) throw new Error(`${panel.name}: 원장 테두리 여백 안에 그려 주세요.`);
    if (occupied.some(other => bounds.x < other.x + other.width + kerf - 1e-7 && bounds.x + bounds.width + kerf > other.x + 1e-7 && bounds.y < other.y + other.height + kerf - 1e-7 && bounds.y + bounds.height + kerf > other.y + 1e-7)) throw new Error(`${panel.name}: 다른 패널과 겹치거나 톱날 간격(${kerf} mm)이 부족합니다.`);
    occupied.push(bounds);
  }
  const previous = result.panels.filter(p => isDrawnPanel(p.id));
  const sourceFor = (id: string) => input.find(p => p.id === id)
    ?? input.filter(p => id.startsWith(`${p.id}-`)).sort((a, b) => b.id.length - a.id.length)[0];
  const removedCounts = new Map<string, number>();
  previous.forEach(p => {
    const source = sourceFor(p.id);
    if (source) removedCounts.set(source.id, (removedCounts.get(source.id) ?? 0) + 1);
  });
  // 수량을 늘려 여러 원장에 배치한 패널은 현재 원장의 개수만 분리한다.
  const remaining = input.flatMap(p => {
    const removed = removedCounts.get(p.id) ?? 0;
    return !removed ? [p] : p.quantity > removed ? [{ ...p, quantity: p.quantity - removed }] : [];
  });
  const additions: Panel[] = [];
  const placements: PlacedPanel[] = board.panels.map(panel => {
    const existing = isDrawnPanel(panel.id) ? sourceFor(panel.id) : undefined;
    const id = `${PREFIX}${crypto.randomUUID()}`;
    additions.push({ id, label: panel.name, width: Math.min(panel.width, panel.height), length: Math.max(panel.width, panel.height), thickness: board.thickness,
      quantity: 1, material: board.material, grain: existing?.grain ?? 'NONE', canRotate: existing?.canRotate ?? true, cuttingBoardShape: normalizedCuttingShape(panel) });
    return { id, name: panel.name, ...panelBounds(panel), rotated: false, thickness: board.thickness, material: result.stockPanel.material, color: result.stockPanel.color, quantity: 1,
      cuttingBoardShape: { width: panel.width, height: panel.height, cuts: panel.cuts || [], ...(panel.profile ? { profile: panel.profile } : {}), placementAngle: panel.rotation || 0 } };
  });
  const usedArea = [...fixed, ...placements].reduce((sum, p) => sum + p.width * p.height, 0);
  const area = board.width * board.height;
  return { panels: [...remaining, ...additions], result: { ...result, panels: [...fixed, ...placements], usedArea, wasteArea: area - usedArea, efficiency: usedArea / area * 100 } };
}

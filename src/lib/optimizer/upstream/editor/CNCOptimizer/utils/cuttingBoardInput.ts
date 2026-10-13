import { getMaterialSheetPrice } from './manufacturingCost';
import { panelBounds } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/geometry';
import type { OptimizedResult } from '../types';
import { normalizedCuttingShape } from './cuttingBoardShape';
import type { Panel, StockSheet } from '@/lib/optimizer/upstream/types/cutlist';
import { parseBoard, overlappingPanels, viewPoint, type CuttingBoardDocument } from '@/lib/optimizer/upstream/editor/shared/components/PDFTemplatePreview/cuttingBoard/model';

export type CuttingBoardPlacementMode = 'preserve' | 'nest';
export interface CuttingBoardInput { panels: Panel[]; stock: StockSheet[] }

/** 임의의 패널 이름으로 보링·재질을 추정하지 않고 사용자가 그린 재단 치수를 전달한다. */
export function toCuttingBoardInput(board: CuttingBoardDocument): CuttingBoardInput {
  if (!board.panels.length) throw new Error('먼저 보드에 패널을 그려 주세요.');
  const material = board.material || 'PB';
  return {
    panels: board.panels.map(p => ({ id: p.id, label: p.name || '패널',
      cuttingBoardShape: normalizedCuttingShape(p),
      width: Math.min(p.width, p.height), length: Math.max(p.width, p.height),
      thickness: board.thickness, quantity: 1, material, grain: 'NONE', canRotate: true })),
    stock: [{ label: `${material}_${board.thickness}T_${board.width}x${board.height}`,
      width: Math.min(board.width, board.height), length: Math.max(board.width, board.height),
      thickness: board.thickness, quantity: 999, material }],
  };
}

export function sendCuttingBoard(board: CuttingBoardDocument, mode: CuttingBoardPlacementMode = 'nest', viewTurns = board.height > board.width ? 1 : 0): string {
  const validated = parseBoard(JSON.stringify(board));
  toCuttingBoardInput(validated);
  if (mode === 'preserve') preservedCuttingBoardResult(validated);
  const id = crypto.randomUUID();
  // 전송마다 별도 스냅샷을 만들어 기존 가구 및 다른 컷팅보드 작업을 덮어쓰지 않는다.
  sessionStorage.setItem(`cutting-board-transfer:${id}`, JSON.stringify({ board: validated, mode, viewTurns }));
  return `/cnc-optimizer?source=cutting-board&boardTransfer=${id}`;
}

export function readCuttingBoardInput(search: string): { id: string; input: CuttingBoardInput; preserved?: OptimizedResult; viewRotation?: number } | null {
  const params = new URLSearchParams(search);
  if (params.get('source') !== 'cutting-board') return null;
  const id = params.get('boardTransfer');
  if (!id) throw new Error('컷팅보드 전송 정보를 찾을 수 없습니다. 컷팅보드에서 다시 보내 주세요.');
  const raw = sessionStorage.getItem(`cutting-board-transfer:${id}`);
  if (!raw) throw new Error('컷팅보드 전송 정보를 찾을 수 없습니다. 컷팅보드에서 다시 보내 주세요.');
  const saved = JSON.parse(raw);
  const board = parseBoard(JSON.stringify(saved.board ?? saved));
  if (saved.mode !== undefined && saved.mode !== 'nest' && saved.mode !== 'preserve') throw new Error('올바른 배치 방식이 아닙니다.');
  return { id, input: toCuttingBoardInput(board), ...(saved.mode === 'preserve' ? { preserved: preservedCuttingBoardResult(board), viewRotation: ((Number.isInteger(saved.viewTurns) ? saved.viewTurns : board.height > board.width ? 1 : 0) - (board.width > board.height ? 1 : 0)) * 90 } : {}) };
}

/** 자유 각도를 포함한 원장 위 실제 위치를 보존한다. 입력 목록은 자동 네스팅용 원치수로 유지한다. */
export function preservedCuttingBoardResult(board: CuttingBoardDocument): OptimizedResult {
  if (overlappingPanels(board.panels).size) throw new Error('패널이 겹쳐 있습니다. 위치를 조정하거나 자동 네스팅을 선택해 주세요.');
  const turns = board.width > board.height ? 1 : 0;
  const width = Math.min(board.width, board.height), height = Math.max(board.width, board.height);
  const usedArea = board.panels.reduce((area, p) => area + p.width * p.height, 0);
  return {
    stockPanel: { id: 'cutting-board', width, height, thickness: board.thickness, material: board.material || 'PB', color: 'MW', price: getMaterialSheetPrice(board.material, board.thickness), stock: 1 },
    panels: board.panels.map(p => {
      const center = viewPoint({ x: p.x + p.width / 2, y: p.y + p.height / 2 }, board, turns);
      const positioned = { ...p, x: center.x - p.width / 2, y: center.y - p.height / 2, rotation: (p.rotation || 0) + turns * 90 };
      const bounds = panelBounds(positioned);
      return { id: p.id, name: p.name, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, rotated: false,
        thickness: board.thickness, material: board.material || 'PB', color: 'MW', quantity: 1,
        cuttingBoardShape: { width: p.width, height: p.height, cuts: p.cuts || [], ...(p.profile ? { profile: p.profile } : {}), placementAngle: positioned.rotation } };
    }),
    efficiency: usedArea / (width * height) * 100, usedArea, wasteArea: width * height - usedArea,
  };
}

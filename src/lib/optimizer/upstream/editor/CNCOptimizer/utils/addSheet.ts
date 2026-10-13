import { getMaterialSheetPrice } from './manufacturingCost';
import type { CutSettings, StockSheet } from '@/lib/optimizer/upstream/types/cutlist';
import type { OptimizedResult } from '../types';

export function sameSheet(sheet: OptimizedResult['stockPanel'], stock: StockSheet) {
  return sheet.width === Math.min(stock.width, stock.length) && sheet.height === Math.max(stock.width, stock.length)
    && (sheet.thickness ?? 18) === (stock.thickness ?? 18) && sheet.material === (stock.material || 'PB');
}

/** 현재 배치를 유지하며 원장 한 장을 추가한다. 부족한 등록 수량만 함께 늘린다. */
export function addSheet(results: OptimizedResult[], stock: StockSheet[], index: number, settings: CutSettings) {
  const source = stock[index];
  if (!source || ![source.width, source.length, source.thickness ?? 18].every(n => Number.isFinite(n) && n > 0)) {
    throw new Error('올바른 원장 규격을 선택해 주세요.');
  }
  const width = Math.min(source.width, source.length), height = Math.max(source.width, source.length);
  if (width <= (settings.trimLeft || 0) + (settings.trimRight || 0) || height <= (settings.trimTop || 0) + (settings.trimBottom || 0)) {
    throw new Error('원장 규격이 테두리 여백보다 커야 합니다.');
  }
  const used = results.filter(result => !result.isOversized && sameSheet(result.stockPanel, source));
  const quantity = Math.max(Number.isFinite(source.quantity) ? source.quantity : 0, used.length + 1);
  const nextStock = source.quantity === quantity ? stock : stock.map((item, i) => i === index ? { ...item, quantity } : item);
  const result: OptimizedResult = {
    stockPanel: { id: `manual-sheet:${crypto.randomUUID()}`, width, height, thickness: source.thickness ?? 18,
      material: source.material || 'PB', color: used[0]?.stockPanel.color ?? 'MW', price: used[0]?.stockPanel.price ?? getMaterialSheetPrice(source.material, source.thickness ?? 18), stock: quantity },
    panels: [], usedArea: 0, wasteArea: width * height, efficiency: 0,
  };
  return { results: [...results, result], stock: nextStock };
}

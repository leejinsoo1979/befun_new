import type { Panel, OptimizedResult } from '../types';
import type { PlacedModule } from '@/lib/optimizer/upstream/editor/shared/furniture/types';
import { hasPanelDimensions, panelQuantity } from '@/lib/optimizer/upstream/utils/cut/panelDimensions';
import { calculateGroupedManufacturingCost, calculateCuttingCost, getMaterialSheetPrice, type CabinetSize } from './manufacturingCost';

/** 결과 원장에 실제로 놓인 판재를 모든 비용 항목의 같은 기준으로 사용한다. */
export function manufacturingQuote(input: Panel[], results: OptimizedResult[], options: {
  preservingPlacement: boolean; cutCount: number; cutErrors: Array<string | null>; nesting: boolean;
}) {
  const issues = new Set<string>();
  const requested = input.filter(hasPanelDimensions);
  const byId = new Map(requested.map(p => [p.id, p]));
  const ordered = [...requested].sort((a, b) => b.id.length - a.id.length);
  const placedCounts = new Map<string, number>();
  const seen = new Set<string>();
  const groups = results.map(result => result.panels.filter(p => {
    if (seen.has(p.id)) { issues.add('동일 판재가 원장에 중복 배치되어 있습니다.'); return false; }
    seen.add(p.id);
    const source = byId.get(p.id) ?? ordered.find(s => p.id.startsWith(`${s.id}-`) && /^\d+$/.test(p.id.slice(s.id.length + 1)));
    if (!source || !panelQuantity(source.quantity)) {
      issues.add('입력 목록과 배치 결과가 다릅니다. 다시 배치해 주세요.');
      return false;
    }
    placedCounts.set(source.id, (placedCounts.get(source.id) ?? 0) + panelQuantity(p.quantity));
    return true;
  }));
  if (requested.some(p => !panelQuantity(p.quantity))) issues.add('판재 수량은 1 이상의 정수여야 합니다.');
  if (requested.some(p => panelQuantity(p.quantity) !== (placedCounts.get(p.id) ?? 0))) {
    issues.add('미배치 또는 수량이 다른 판재가 있습니다. 아래 금액은 배치분만 포함합니다.');
  }
  const materialCosts = results.map(result => {
    const s = result.stockPanel;
    const registered = getMaterialSheetPrice(s.material, s.thickness ?? 18);
    const standardSize = Math.min(s.width, s.height) === 1220 && Math.max(s.width, s.height) === 2440;
    if (!registered || !standardSize || result.isOversized || !Number.isFinite(s.price) || s.price <= 0) {
      issues.add('단가가 확인되지 않은 원장 재질·두께·규격이 있습니다.');
      return null;
    }
    if (result.panels.some(p => p.material !== s.material || Math.abs((p.thickness ?? 18) - (s.thickness ?? 18)) > 0.1)) {
      issues.add('원장과 판재의 재질·두께가 다릅니다.');
      return null;
    }
    return s.price;
  });
  const placed = groups.flat();
  if (placed.some(p => p.manufacturingReady === false || p.manufacturingBoring?.manufacturingReady === false)) {
    issues.add('제조 좌표가 미확정인 판재가 있습니다.');
  }
  if (placed.some(p => p.cuttingBoardShape?.cuts.length || p.cuttingBoardShape?.profile || p.sideNotches?.length || p.cornerNotch || p.rebate || p.manufacturingBoring?.sideNotches?.length)) {
    issues.add('따내기·이형 가공의 추가 단가는 확인이 필요합니다.');
  }
  let cuttingCost: number | null = calculateCuttingCost(options.cutCount);
  if (placed.length && (options.preservingPlacement || options.nesting || options.cutErrors.some(Boolean))) {
    cuttingCost = null;
    issues.add(options.nesting ? '네스팅 윤곽의 재단비는 가공 경로 확인이 필요합니다.' : '재단 경로가 미확정이므로 재단비를 산정하지 않았습니다.');
  }
  const costs = calculateGroupedManufacturingCost(groups);
  const furnitureIds = new Set(placed.flatMap(p => p.sourceFurnitureIds?.length ? p.sourceFurnitureIds : p.furnitureId ? [p.furnitureId] : []));
  return { ...costs, placed, furnitureIds, materialCosts, cuttingCost,
    materialCost: materialCosts.reduce<number>((sum, cost) => sum + (cost ?? 0), 0), issues: [...issues] };
}

type CabinetModule = Pick<PlacedModule, 'id' | 'moduleId' | 'isSurroundPanel' | 'customWidth' | 'adjustedWidth' | 'moduleWidth' |
  'customHeight' | 'customDepth' | 'freeWidth' | 'freeHeight' | 'freeDepth'> & { depth?: number };

/** 부속 판재·중복 ID·견적에서 제외된 가구를 캐비넷 한 통으로 세지 않는다. */
export function assemblyCabinets(modules: CabinetModule[], furnitureIds: Set<string>, resolve: (m: CabinetModule) => {
  category?: string; dimensions?: CabinetSize;
} | null | undefined): CabinetSize[] {
  const seen = new Set<string>();
  return modules.flatMap(m => {
    if (m.isSurroundPanel || !furnitureIds.has(m.id) || seen.has(m.id)) return [];
    seen.add(m.id);
    const data = resolve(m);
    const upper = data?.category === 'upper' || m.moduleId.includes('upper');
    return [{
      width: m.freeWidth ?? m.customWidth ?? m.adjustedWidth ?? m.moduleWidth ?? data?.dimensions?.width ?? 0,
      height: upper ? (m.customHeight ?? m.freeHeight ?? data?.dimensions?.height ?? 0)
        : (m.freeHeight ?? m.customHeight ?? data?.dimensions?.height ?? 0),
      depth: m.freeDepth ?? m.customDepth ?? m.depth ?? data?.dimensions?.depth ?? 0,
    }];
  });
}

import type { PlacedPanel } from '../types'
import { hasPanelDimensions } from '@/lib/optimizer/upstream/utils/cut/panelDimensions';

import { convertPlacedPanelToMprBoringData } from './mprPanelConversion';
import { resolveBackPanelGrooveLine, resolveDrawerBottomGrooveRect } from '@/lib/optimizer/upstream/domain/boring/exporters/mprExporter';
import { panelQuantity } from '@/lib/optimizer/upstream/utils/cut/panelDimensions';
import type { Boring } from '@/lib/optimizer/upstream/domain/boring/types';

export type ManufacturingCostPanel = Pick<PlacedPanel, 'name' | 'width' | 'height' | 'quantity'>
  & Omit<Partial<PlacedPanel>, 'grain'> & { grain?: PlacedPanel['grain'] | 'H' | 'V' };

export const MANUFACTURING_RATES = {
  edgePerMeter: 500,
  // 엣지 자재비는 임가공비와 별도로 청구된다 (우림 2026-08 회신).
  edgeMaterialPerMeter: 500,
  boringHole: 100,
  hingeBoring: 500,
  grooveUpTo1200: 3000,
  grooveAtLeast1500: 5000,
  // 재단비: 컷(재단선) 1개당. 런닝쏘/네스팅 방식에 따라 금액 편차가 커서
  // 추후 M당 단가로 전환될 수 있다 (우림 2026-08 회신).
  cutPerCut: 2000,
  // 조립/포장비: 캐비넷 1개당. 가로·세로 중 하나라도 1200mm 초과 또는
  // 깊이 600mm 초과면 큰통 (우림 2026-08 회신).
  assemblySmall: 6000,
  assemblyLarge: 10000,
} as const

/** 큰통 판정 임계치: 가로(폭)·세로(높이) 중 하나라도 이 값을 초과하면 큰통 */
export const ASSEMBLY_LARGE_THRESHOLD_MM = 1200

/** 작은거 판정 깊이 상한: 이 값을 초과하면 큰통 */
export const ASSEMBLY_SMALL_MAX_DEPTH_MM = 600

export const MATERIAL_SHEET_RATES = {
  PB: {
    15: 33000,
    18: 35000,
  },
  PET: {
    15: 36000,
    18: 38000,
  },
  MDF: {
    9: 34000,
  },
} as const

function normalizeMaterialThickness(thickness?: number): 9 | 15 | 18 | null {
  if (!thickness) return null
  if (Math.abs(thickness - 9) < 0.1) return 9
  if (Math.abs(thickness - 15) < 0.1 || Math.abs(thickness - 15.5) < 0.1) return 15
  if (Math.abs(thickness - 18) < 0.1 || Math.abs(thickness - 18.5) < 0.1) return 18
  return null
}

export function getMaterialSheetPrice(material?: string, thickness?: number): number {
  const normalizedMaterial = (material || 'PB').toUpperCase()
  const normalizedThickness = normalizeMaterialThickness(thickness)

  if (normalizedMaterial === 'PET' && (normalizedThickness === 15 || normalizedThickness === 18)) {
    return MATERIAL_SHEET_RATES.PET[normalizedThickness];
  }
  if (normalizedMaterial === 'MDF' && normalizedThickness === 9) return MATERIAL_SHEET_RATES.MDF[9];
  if (normalizedMaterial === 'PB' && (normalizedThickness === 15 || normalizedThickness === 18)) {
    return MATERIAL_SHEET_RATES.PB[normalizedThickness];
  }
  // 미등록 규격을 다른 재질의 확정 단가로 대체하지 않는다. 견적에서 별도로 미산정 표시한다.
  return 0;
}

export interface ManufacturingCostBreakdown {
  edgeLengthM: number
  edgeCost: number
  edgeMaterialCost: number
  boringHoleCount: number
  boringCost: number
  hingeBoringCount: number
  hingeBoringCost: number
  grooveLineCount: number
  grooveCost: number
  totalCost: number
}

export interface CabinetSize {
  width: number
  height: number
  depth: number
}

export interface AssemblyCostBreakdown {
  smallCount: number
  largeCount: number
  totalCost: number
}

/**
 * 조립/포장비 산출.
 * 작은거(6,000원)는 깊이 600mm 이하이면서 가로·세로가 모두 1200mm 이하인 경우.
 * 가로·세로 중 하나라도 1200mm를 넘거나 깊이가 600mm를 넘으면 큰통(10,000원).
 */
export function calculateAssemblyCost(cabinets: CabinetSize[]): AssemblyCostBreakdown {
  let smallCount = 0
  let largeCount = 0

  cabinets.forEach(({ width, height, depth }) => {
    if (![width, height, depth].every(n => Number.isFinite(n) && n > 0)) return;
    const isLarge = width > ASSEMBLY_LARGE_THRESHOLD_MM
      || height > ASSEMBLY_LARGE_THRESHOLD_MM
      || depth > ASSEMBLY_SMALL_MAX_DEPTH_MM

    if (isLarge) {
      largeCount += 1
    } else {
      smallCount += 1
    }
  })

  return {
    smallCount,
    largeCount,
    totalCost: smallCount * MANUFACTURING_RATES.assemblySmall
      + largeCount * MANUFACTURING_RATES.assemblyLarge,
  }
}

/** 재단비 산출: 컷(재단선) 1개당 정액 */
export function calculateCuttingCost(cutCount: number): number {
  return Math.max(0, Math.floor(cutCount)) * MANUFACTURING_RATES.cutPerCut
}

function isDoorPanel(panel: ManufacturingCostPanel): boolean {
  const name = panel.name.toLowerCase()
  return panel.isDoor === true
    || name.includes('도어')
    || name.includes('door')
    || name.includes('마이다')
}




function roundEdgeCostUp(value: number): number {
  return Math.ceil(value / 1000) * 1000
}

/**
 * 부재별 엣지 길이 (mm).
 *
 * 산정 기준 — 공장 확인 (2026-08):
 *   기준은 '판재 둘레'다. 절단길이가 아니다.
 *
 *   - 백패널(우라)·보강대: 엣지 없음(0).
 *     홈에 끼워지거나 가려져 단면이 노출되지 않는다.
 *   - 그 외 전부: 4면. 천판·지판도 4면이다.
 *
 *   종전에는 천지판 1면, 고정선반 1면, 서랍 상자 2면으로 잡아
 *   실물량보다 크게 적게 나왔다(이 기준으로 149M -> 384M).
 */
function getEdgeLengthMm(panel: ManufacturingCostPanel): number {
  const name = panel.name.replace(/\s+/g, '')

  // 엣지가 들어가지 않는 부재 — 홈에 끼워지거나 완전히 가려진다
  if (
    name.includes('백패널')
    || name.includes('우라')
    || name.includes('보강대')
  ) {
    return 0
  }

  // 나머지는 전부 4면
  const size = panel.cuttingBoardShape ?? panel;
  return (size.width + size.height) * 2
}

/** 표시용 행×열 배열이 아니라 생산 파일과 같은 가공 좌표를 사용한다. */
function machining(panel: ManufacturingCostPanel) {
  return convertPlacedPanelToMprBoringData({
    id: '', material: 'PB', color: '', x: 0, y: 0, rotated: false,
    ...panel,
    grain: panel.grain === 'H' ? 'HORIZONTAL' : panel.grain === 'V' ? 'VERTICAL' : panel.grain,
    isDoor: isDoorPanel(panel),
    // 윤곽 가공 지원 여부는 견적의 미산정 사유로 표시한다. 보링 계수는 별도다.
    cuttingBoardShape: undefined,
  });
}

function boringKey(b: Boring, thickness: number): string {
  // ID·주석만 다른 동일 작업은 한 번. 같은 중심의 다른 직경/깊이 가공은 보존한다.
  return JSON.stringify([b.type, b.face, b.x, b.y, b.z ?? thickness / 2,
    b.diameter, b.depth, b.slotWidth ?? 0, b.slotHeight ?? 0, b.angle ?? 90]);
}

export function calculateManufacturingCost(panels: ManufacturingCostPanel[]): ManufacturingCostBreakdown {
  let edgeLengthMm = 0, boringHoleCount = 0, hingeBoringCount = 0, grooveLineCount = 0, grooveCost = 0;
  for (const panel of panels.filter(hasPanelDimensions)) {
    const quantity = panelQuantity(panel.quantity);
    if (!quantity) continue;
    edgeLengthMm += getEdgeLengthMm(panel) * quantity;
    const data = machining(panel);
    const borings = [...new Map(data.borings.map(b => [boringKey(b, data.thickness), b])).values()];
    hingeBoringCount += borings.filter(b => b.type === 'hinge-cup').length * quantity;
    // 기존 경첩 세트 단가는 유지: 도어 나사홀을 일반 보링으로 다시 청구하지 않는다.
    boringHoleCount += borings.filter(b => b.type !== 'hinge-cup'
      && !((isDoorPanel(panel) || data.panelType === 'door') && b.type === 'hinge-screw')).length * quantity;
    const lengths: number[] = [];
    const back = resolveBackPanelGrooveLine(data);
    if (back && back.width > 0 && back.depth > 0) lengths.push(Math.hypot(back.x2 - back.x1, back.y2 - back.y1));
    const seen = new Set<string>();
    for (const groove of data.groovePositions ?? []) {
      const rect = resolveDrawerBottomGrooveRect(data, groove);
      if (!rect) continue;
      const key = JSON.stringify(rect);
      if (seen.has(key)) continue;
      seen.add(key);
      lengths.push(rect.width);
    }
    grooveLineCount += lengths.length * quantity;
    grooveCost += lengths.reduce((sum, length) => sum + (length >= 1500
      ? MANUFACTURING_RATES.grooveAtLeast1500 : MANUFACTURING_RATES.grooveUpTo1200), 0) * quantity;
  }
  const edgeLengthM = edgeLengthMm / 1000;
  const edgeCost = roundEdgeCostUp(edgeLengthM * MANUFACTURING_RATES.edgePerMeter);
  const edgeMaterialCost = roundEdgeCostUp(edgeLengthM * MANUFACTURING_RATES.edgeMaterialPerMeter);
  const boringCost = boringHoleCount * MANUFACTURING_RATES.boringHole;
  const hingeBoringCost = hingeBoringCount * MANUFACTURING_RATES.hingeBoring;
  return { edgeLengthM, edgeCost, edgeMaterialCost, boringHoleCount, boringCost,
    hingeBoringCount, hingeBoringCost, grooveLineCount, grooveCost,
    totalCost: edgeCost + edgeMaterialCost + boringCost + hingeBoringCost + grooveCost };
}

/** 주문 전체에서 한 번 올린 엣지비를 길이 비례로 원 단위 배분한다. 시트별 재올림 금지. */
export function calculateGroupedManufacturingCost(groups: ManufacturingCostPanel[][]) {
  const total = calculateManufacturingCost(groups.flat());
  const costs = groups.map(calculateManufacturingCost);
  for (const field of ['edgeCost', 'edgeMaterialCost'] as const) {
    const portions = costs.map(c => total.edgeLengthM ? total[field] * c.edgeLengthM / total.edgeLengthM : 0);
    const amounts = portions.map(Math.floor);
    const order = portions.map((v, i) => ({ i, fraction: v - amounts[i] }))
      .sort((a, b) => b.fraction - a.fraction || a.i - b.i);
    for (let n = total[field] - amounts.reduce((sum, v) => sum + v, 0), i = 0; i < n; i++) amounts[order[i].i]++;
    costs.forEach((c, i) => { c[field] = amounts[i]; });
  }
  costs.forEach(c => { c.totalCost = c.edgeCost + c.edgeMaterialCost + c.boringCost + c.hingeBoringCost + c.grooveCost; });
  return { total, groups: costs };
}

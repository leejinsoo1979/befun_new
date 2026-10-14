/**
 * 주문용 선반 사양 검증 · 서버 가격 · 공장 제작 지시서.
 * 브라우저가 보낸 가격을 믿지 않고, 저장된 디자인 config로 운영 화면과 같은 패널 생성기·가격 공식을 다시 실행한다.
 * 단위: 생성기 좌표는 cm, 지시서 치수는 mm(정수).
 */
import { parseSavedDesign } from '@/components/storefront/savedDesign';
import { calculatePrice } from '@/lib/pricing';
import { calculateGridPanels, type GridInput, type GridResult } from '@/lib/three/styles/grid';
import { calculateSlantPanels } from '@/lib/three/styles/slant';
import { calculatePixelPanels } from '@/lib/three/styles/pixel';
import { calculateGradientPanels } from '@/lib/three/styles/gradient';
import { calculatePatternPanels } from '@/lib/three/styles/pattern';
import { calculateMosaicPanels } from '@/lib/three/styles/mosaic';
import type { ColorCategory, MaterialType } from '@/types/shelf';

export type ShelfOrderConfig = NonNullable<ReturnType<typeof parseSavedDesign>>['config'];
const THICKNESS = 2;

/** 장바구니 config(운영 컨피규레이터·상품 페이지 두 형식)를 검증된 사양으로. 잘못되면 null */
export function normalizeShelfConfig(raw: unknown): ShelfOrderConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const c = { ...(raw as Record<string, unknown>) };
  const numRows = Number(c.numRows);
  if (!Array.isArray(c.rowHeights) || !Number.isInteger(numRows)) return null;
  c.rowHeights = (c.rowHeights as unknown[]).slice(0, numRows);
  const parsed = parseSavedDesign(JSON.stringify({ version: 1, name: 'order', config: c }));
  return parsed?.config ?? null;
}

function generate(config: ShelfOrderConfig): GridResult {
  const hardwareLayers = [...new Set([...config.doorsCreatedLayers, ...config.drawersCreatedLayers])];
  const input: GridInput = {
    width: config.width, height: config.height, depth: config.depth, thickness: THICKNESS, density: config.density,
    rowHeights: config.rowHeights, numRows: config.numRows, hasBackPanel: config.hasBackPanel,
    hardwareLayers, hardwareRowStyles: config.hardwareRowStyles,
    family: config.colorCategory === 'classic' || config.colorCategory === 'natural' ? 'type01' : 'type02',
  };
  switch (config.style) {
    case 'slant': return calculateSlantPanels(input);
    case 'pixel': return calculatePixelPanels(input);
    case 'gradient': return calculateGradientPanels(input);
    case 'pattern': return calculatePatternPanels(input);
    case 'mosaic': return calculateMosaicPanels(input);
    default: return calculateGridPanels(input);
  }
}

/** 1개 가격(원) — 운영 PriceDisplay와 같은 공식 */
export function unitPrice(config: ShelfOrderConfig): number {
  const { panels } = generate(config);
  const totalPanelVolume = panels.reduce((sum, p) => sum + p.w * p.h * p.d, 0);
  return calculatePrice({ totalPanelVolume, colorCategory: config.colorCategory as ColorCategory }).finalPrice;
}

/** 국내 배송비 규칙(주문 화면과 동일): 10만원 이상 무료, 미만 5,000원 */
export const shippingFeeFor = (itemsTotal: number) => (itemsTotal >= 100000 ? 0 : 5000);

const PART: Record<MaterialType, string> = {
  horizontalBase: '가로판', horizontalEdge: '가로판', verticalBase: '세로판', verticalEdge: '세로판', backPanel: '뒷판', supportPanel: '보강대',
};

export interface CutPart { part: string; lengthMm: number; widthMm: number; thicknessMm: number; qty: number }
export interface FrontPart { type: '도어' | '서랍'; widthMm: number; heightMm: number; qty: number; hinge?: string }
export interface ProductionSheet {
  version: 1;
  createdAt: string;
  designShareCode: string;
  quantity: number;
  spec: { style: string; widthCm: number; heightCm: number; depthCm: number; rows: number[]; color: string; colorCategory: string; backPanel: boolean; base: string; legFinish: string | null };
  /** 1세트 기준 재단 목록(같은 치수끼리 묶음). 실제 수량 = qty × quantity */
  cutList: CutPart[];
  fronts: FrontPart[];
  totals: { panels: number; areaM2: number };
  notes: string[];
}

const mm = (cm: number) => Math.round(cm * 10);

/** 결제 승인 시점의 제작 지시서 스냅샷 */
export function buildProductionSheet(config: ShelfOrderConfig, quantity: number, shareCode: string): ProductionSheet {
  const result = generate(config);
  const groups = new Map<string, CutPart>();
  let area = 0;
  for (const p of result.panels) {
    const dims = [p.w, p.h, p.d].sort((a, b) => b - a);
    const [lengthMm, widthMm, thicknessMm] = dims.map(mm);
    area += (dims[0] * dims[1]) / 10000;
    const part = PART[p.matType] ?? p.matType;
    const key = `${part}|${lengthMm}|${widthMm}|${thicknessMm}`;
    const g = groups.get(key);
    if (g) g.qty++; else groups.set(key, { part, lengthMm, widthMm, thicknessMm, qty: 1 });
  }
  const fronts = new Map<string, FrontPart>();
  for (const f of result.fronts ?? []) {
    const type = f.type === 'door' ? '도어' : '서랍';
    const key = `${type}|${mm(f.width)}|${mm(f.height)}|${f.hingeSide ?? ''}`;
    const g = fronts.get(key);
    if (g) g.qty++; else fronts.set(key, { type, widthMm: mm(f.width), heightMm: mm(f.height), qty: 1, hinge: f.hingeSide === 'left' ? '좌측 경첩' : f.hingeSide === 'right' ? '우측 경첩' : undefined });
  }
  const order: Record<string, number> = { 세로판: 0, 가로판: 1, 보강대: 2, 뒷판: 3 };
  const cutList = [...groups.values()].sort((a, b) => (order[a.part] ?? 9) - (order[b.part] ?? 9) || b.lengthMm - a.lengthMm);
  const notes: string[] = [];
  if (!result.fronts?.length && (config.doorsCreatedLayers.length || config.drawersCreatedLayers.length)) notes.push('도어·서랍 전면 치수는 생성기 결과가 없어 3D 디자인에서 확인 필요');
  return {
    version: 1, createdAt: new Date().toISOString(), designShareCode: shareCode, quantity,
    spec: {
      style: config.style, widthCm: config.width, heightCm: config.height, depthCm: config.depth, rows: config.rowHeights,
      color: config.color, colorCategory: config.colorCategory, backPanel: config.hasBackPanel,
      base: config.baseType === 'legs' ? '다리(+10cm)' : '기본 받침', legFinish: config.baseType === 'legs' ? config.legFinish ?? null : null,
    },
    cutList, fronts: [...fronts.values()],
    totals: { panels: result.panels.length, areaM2: Math.round(area * 100) / 100 },
    notes,
  };
}

export type SheetItem = ProductionSheet | { error: string; designShareCode: string; quantity: number };
export interface OrderProductionSheet { version: 1; createdAt: string; items: SheetItem[] }

/** 저장된 지시서가 있으면 그대로, 없으면(관리자가 수동 결제 처리한 주문 등) 현재 규칙으로 미리보기 생성 */
export function productionSheetFor(
  saved: unknown,
  items: { quantity: number; design: { shareCode: string; config: unknown } }[],
): { sheet: OrderProductionSheet; snapshot: boolean } {
  const s = saved as OrderProductionSheet | null;
  if (s && s.version === 1 && Array.isArray(s.items)) return { sheet: s, snapshot: true };
  const sheetItems: SheetItem[] = items.map((item) => {
    const config = normalizeShelfConfig(item.design.config);
    return config
      ? buildProductionSheet(config, item.quantity, item.design.shareCode)
      : { error: '사양 해석 실패 — 디자인 확인 필요', designShareCode: item.design.shareCode, quantity: item.quantity };
  });
  return { sheet: { version: 1, createdAt: new Date().toISOString(), items: sheetItems }, snapshot: false };
}

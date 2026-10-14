/**
 * R2.1-UI 기존 선반 편집 동작 — 운영 UI(DimensionPanel/StyleSelector)와 FurniturePanel이 같은 함수를 호출한다.
 * 기존 handler를 옮긴 것이며 동작을 바꾸지 않는다. 값 단위는 legacy cm 그대로다(새 mm 저장 구조 없음).
 */
import { useShelfStore } from '@/stores/useShelfStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import type { StyleType } from '@/types/shelf';
import type { FurnitureEditIntent } from '../types';

/** StyleSelector 표시 순서 */
export const LEGACY_STYLES: readonly StyleType[] = ['pattern', 'grid', 'slant', 'mosaic', 'pixel', 'gradient'];
/** DimensionPanel DEPTH_OPTIONS */
export const LEGACY_DEPTHS = [24, 32, 40] as const;
export const LEGACY_MAX_ROWS = 10;
/** DimensionPanel이 부족한 행을 채우는 높이(store의 recalculateRows 기본 28과 다름 — 기존 동작 유지) */
export const LEGACY_NEW_ROW_HEIGHT = 32;
export const LEGACY_WIDTH = { min: 30, max: 450 } as const;
export const LEGACY_DENSITY = { min: 0, max: 100 } as const;

const isRowCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= LEGACY_MAX_ROWS;
export const isLegacyStyle = (s: unknown): s is StyleType => typeof s === 'string' && (LEGACY_STYLES as readonly string[]).includes(s);

/** 행 수 n의 본체 높이(cm) = 두께 + Σ(행 높이 + 두께). 부족한 행은 32cm. */
export function legacyBodyHeight(rowHeights: readonly number[], count: number, thickness: number) {
  let total = thickness;
  for (let i = 0; i < count; i++) total += (rowHeights[i] ?? LEGACY_NEW_ROW_HEIGHT) + thickness;
  return total;
}

/**
 * DimensionPanel 행 수 handler. 기존 rowHeights를 복사해 부족할 때만 32cm를 추가하고(줄였다 늘려도 보관 행 유지),
 * rowHeights·numRows·height 세 필드만 한 번에 기록한 뒤 기존 reconcileHardware로 삭제 행·높이 제한을 정리한다.
 * setHeight(38–228 clamp + 별도 행 계산)는 쓰지 않는다. 1–10 정수가 아니면 아무것도 하지 않는다.
 */
export function setLegacyRowCount(count: number): void {
  if (!isRowCount(count)) return;
  const { rowHeights, thickness } = useShelfStore.getState();
  const newRowHeights = [...rowHeights];
  while (newRowHeights.length < count) newRowHeights.push(LEGACY_NEW_ROW_HEIGHT);
  useShelfStore.setState({ rowHeights: newRowHeights, numRows: count, height: legacyBodyHeight(newRowHeights, count, thickness) });
  useShelfStore.getState().reconcileHardware();
}

/**
 * 스타일 handler: 다른 스타일이면 setStyle 후 하드웨어(문·서랍) 초기화(기존 StyleSelector 효과 유지).
 * 같은 스타일 재선택은 현재 선택 유지·no-op(R3 통일 — 이전 운영 버튼은 재클릭에도 초기화했음).
 */
export function setLegacyStyle(style: StyleType): void {
  if (!isLegacyStyle(style)) return;
  if (useShelfStore.getState().style === style) return;
  useShelfStore.getState().setStyle(style);
  useHardwareStore.getState().reset();
}

export const LEGACY_CONTROL_IDS = ['legacy.style', 'legacy.density', 'legacy.width', 'legacy.rowCount', 'legacy.depth', 'legacy.backPanel'] as const;
export type LegacyControlId = (typeof LEGACY_CONTROL_IDS)[number];

/** 운영 마운트 묶음 — FeetSelector를 Depth와 Back panels 사이에 두기 위해 나눈다(Style→…→Depth→Feet→Back panels). */
export const LEGACY_BEFORE_FEET: readonly LegacyControlId[] = ['legacy.style', 'legacy.density', 'legacy.width', 'legacy.rowCount', 'legacy.depth'];
export const LEGACY_AFTER_FEET: readonly LegacyControlId[] = ['legacy.backPanel'];
/** 모바일 탭 분할(MobileConfiguratorPanel의 style/size/option 탭) */
export const LEGACY_MOBILE_TABS = {
  style: ['legacy.style', 'legacy.density'],
  size: ['legacy.width', 'legacy.rowCount', 'legacy.depth'],
  option: ['legacy.backPanel'],
} as const satisfies Record<string, readonly LegacyControlId[]>;

export type LegacyIntentResult = { applied: boolean; reason?: string };
const no = (reason: string): LegacyIntentResult => ({ applied: false, reason });
const finiteIn = (v: unknown, r: { min: number; max: number }): v is number => typeof v === 'number' && Number.isFinite(v) && v >= r.min && v <= r.max;

/** FurniturePanel intent → 위 공유 handler 또는 store 공개 setter 하나. 검증 실패·미지원은 상태 무변경. */
export function applyLegacyShelfIntent(intent: FurnitureEditIntent): LegacyIntentResult {
  if (intent.type !== 'set') return no(`미지원 intent: ${intent.type}`);
  if (intent.target.scope !== 'global') return no('기존 선반은 구획 대상 변경을 지원하지 않음');
  const v = intent.value;
  const shelf = useShelfStore.getState();
  switch (intent.controlId) {
    case 'legacy.style':
      if (!isLegacyStyle(v)) return no('지원하지 않는 스타일');
      setLegacyStyle(v);
      return { applied: true };
    case 'legacy.density':
      if (!finiteIn(v, LEGACY_DENSITY)) return no('밀도는 0–100 숫자');
      shelf.setDensity(v);
      return { applied: true };
    case 'legacy.width':
      if (!finiteIn(v, LEGACY_WIDTH)) return no('너비는 30–450cm 숫자');
      shelf.setWidth(v);
      return { applied: true };
    case 'legacy.rowCount':
      if (!isRowCount(v)) return no(`행 수는 1–${LEGACY_MAX_ROWS} 정수`);
      setLegacyRowCount(v);
      return { applied: true };
    case 'legacy.depth': {
      const d = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
      if (!LEGACY_DEPTHS.some((x) => x === d)) return no(`깊이는 ${LEGACY_DEPTHS.join('/')}cm`);
      shelf.setDepth(d as number);
      return { applied: true };
    }
    case 'legacy.backPanel':
      if (v !== 'on' && v !== 'off') return no('뒷판은 on/off');
      shelf.setHasBackPanel(v === 'on');
      return { applied: true };
    default:
      return no(`미지원 컨트롤: ${intent.controlId}`);
  }
}

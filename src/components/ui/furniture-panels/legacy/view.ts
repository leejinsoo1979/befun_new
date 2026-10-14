/**
 * R3-UI 기존 선반 view — 현재 store 값만 받아 FurniturePanelView를 만드는 순수 함수.
 * 높이 표시 = 본체 높이 + baseHeight(baseType) (furniture-base.ts 재사용: Standard 조절발 1cm, Legs 11cm).
 * Tylko 실제 노출 높이의 확정값이 아니다. 라벨·도움말 유무는 현재 운영 패널과 같다.
 */
import type { StyleType } from '@/types/shelf';
import { baseHeight, type FurnitureBaseType } from '@/lib/three/furniture-base';
import type { FurnitureControl, FurniturePanelView } from '../types';
import { LEGACY_DEPTHS, LEGACY_DENSITY, LEGACY_MAX_ROWS, LEGACY_STYLES, LEGACY_WIDTH, legacyBodyHeight } from './actions';

export interface LegacyShelfViewInput {
  width: number;
  depth: number;
  thickness: number;
  style: StyleType;
  density: number;
  hasBackPanel: boolean;
  rowHeights: readonly number[];
  numRows: number;
  baseType: FurnitureBaseType;
}

const STYLE_LABEL: Record<StyleType, string> = { pattern: 'Pattern', grid: 'Grid', slant: 'Slant', mosaic: 'Mosaic', pixel: 'Pixel', gradient: 'Gradient' };

const G = { scope: 'global' } as const;
const on = { target: G, visible: true, enabled: true } as const;

export function legacyDisplayHeight(s: Pick<LegacyShelfViewInput, 'rowHeights' | 'numRows' | 'thickness' | 'baseType'>) {
  return Math.round(legacyBodyHeight(s.rowHeights, s.numRows, s.thickness) + baseHeight(s.baseType));
}

export function buildLegacyShelfView(s: LegacyShelfViewInput): FurniturePanelView {
  const controls: FurnitureControl[] = [
    {
      kind: 'choice', variant: 'tile', id: 'legacy.style', label: 'Style', ...on, value: s.style,
      options: LEGACY_STYLES.map((id) => ({ id, label: STYLE_LABEL[id], imageUrl: `/imgs/icon/icon_${id}_black.svg`, activeImageUrl: `/imgs/icon/icon_${id}.svg` })),
    },
    {
      kind: 'slider', id: 'legacy.density', label: 'Density', ...on, value: s.density, ...LEGACY_DENSITY, step: 1, unit: '%',
      displayValue: `${s.density}%`, help: '칸을 나누는 세로판의 촘촘한 정도',
    },
    { kind: 'slider', id: 'legacy.width', label: 'Width', ...on, value: s.width, ...LEGACY_WIDTH, step: 1, unit: 'cm', displayValue: `${Math.round(s.width)}cm` },
    {
      kind: 'slider', id: 'legacy.rowCount', label: 'Height', ...on, value: s.numRows, min: 1, max: LEGACY_MAX_ROWS, step: 1, unit: '행',
      markers: Array.from({ length: LEGACY_MAX_ROWS }, (_, i) => i + 1), displayValue: `${legacyDisplayHeight(s)}cm`,
    },
    {
      kind: 'choice', variant: 'pill', id: 'legacy.depth', label: 'Depth', ...on,
      value: LEGACY_DEPTHS.find((d) => Math.abs(s.depth - d) < 0.5)?.toString() ?? null,
      options: LEGACY_DEPTHS.map((d) => ({ id: String(d), label: `${d}cm` })), help: '가구의 앞뒤 깊이',
    },
    {
      kind: 'choice', variant: 'pill', id: 'legacy.backPanel', label: 'Back panels', ...on, value: s.hasBackPanel ? 'on' : 'off',
      options: [{ id: 'off', label: 'OFF' }, { id: 'on', label: 'ON' }], help: '모든 칸 뒤에 뒷판을 넣습니다',
    },
  ];
  return { panelProfileId: 'befun-legacy-shelf', layout: 'single', sections: [], selectedSectionId: null, tabs: [{ id: 'main', label: '옵션', controls }] };
}

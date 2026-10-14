import type { FurnitureControl, FurnitureEditIntent, FurniturePanelView, SwatchOption } from '@/types/furniture';
import { MODERN_DESK_COLORS, normalizeDeskDesign, type FurnitureDesign } from './design';
import { availableStorageColumns, calculateDeskGeometry, DESK_CHANNEL_OPTIONS, type DeskChannelKind } from './desk';
import { REFERENCE_COLORS, REFERENCE_CLASSIC_COLORS } from '../three/reference-colors';

type DeskDesign = Extract<FurnitureDesign, { kind: 'desk' }>;
const globalTarget = { scope: 'global' } as const;
const active = { visible: true, enabled: true } as const;
const COLOR_NAMES: Record<string, string> = {
  S_White: '화이트', 'S_Matte Black': '매트 블랙', S_Cotton: '코튼', 'S_Stone Gray': '스톤 그레이',
  'S_Butter Yellow': '버터 옐로', 'S_Sage Green': '세이지 그린', 'S_Reisinger Pink': '핑크',
  S_Lilac: '라일락', 'S_Dark Brown': '다크 브라운', S_Black: '블랙', 'S_Midnight Blue': '미드나잇 블루',
  S_Burgundy: '버건디', S_Teracotta: '테라코타', S_Gray: '그레이', 'S_Olive Green': '올리브 그린', 'S_Sky Blue': '스카이 블루',
  'Sand+Midnight Blue': '샌드 · 미드나잇 블루',
  C_White: '화이트', C_Black: '블랙', C_Gray: '그레이', C_Pink: '핑크', C_Yellow: '옐로', C_Blue: '블루',
  'C_Moss Green': '모스 그린', C_Cashmere: '캐시미어', 'C_Clay Brown': '클레이 브라운',
};
function deskSwatches(design: DeskDesign): SwatchOption[] {
  if (design.family === 'desk-classic') return Object.entries(REFERENCE_CLASSIC_COLORS)
    .map(([id, color]) => ({ id, label: COLOR_NAMES[id] ?? id, color }));
  return MODERN_DESK_COLORS.map(id => ({ id, label: COLOR_NAMES[id], color: REFERENCE_COLORS[id].base }));
}
function hasOpenStorage(design: DeskDesign): boolean {
  return (design.config.channels ?? []).some(c => DESK_CHANNEL_OPTIONS.find(o => o.id === c.kind)?.fills.some(fill => fill === 'O'));
}

export function deskPanelView(design: DeskDesign, selectedSectionId: string | null): FurniturePanelView {
  const current = normalizeDeskDesign(design);
  const { config, sectionIds } = current;
  const selected = selectedSectionId && sectionIds.includes(selectedSectionId) ? selectedSectionId : sectionIds[0] ?? null;
  const index = selected === null ? -1 : sectionIds.indexOf(selected);
  const channel = config.channels?.[index];
  const option = DESK_CHANNEL_OPTIONS.find(o => o.id === channel?.kind) ?? DESK_CHANNEL_OPTIONS[3];
  const choices = availableStorageColumns(config.widthMm);
  const openStorage = hasOpenStorage(current);
  const appearance: FurnitureControl[] = [
    { kind: 'slider', id: 'width', label: '너비', target: globalTarget, ...active, value: config.widthMm / 10,
      min: 90, max: 240, step: null, unit: 'cm' },
    { kind: 'notice', id: 'height', label: '높이', target: globalTarget, ...active, text: '모든 책상은 높이 73cm입니다.' },
    { kind: 'choice', variant: 'pill', id: 'depth', label: '깊이', target: globalTarget, ...active, value: String(config.depthMm / 10),
      options: [40, 50, 60].map(depth => ({ id: String(depth), label: `${depth}cm` })) },
    { kind: 'stepper', id: 'storageSections', label: '수납 구획', target: globalTarget, ...active, value: config.storageColumns,
      canDecrement: choices.some(n => n < config.storageColumns), canIncrement: choices.some(n => n > config.storageColumns) },
    { kind: 'slider', id: 'legSpace', label: '다리 공간', target: globalTarget, ...active, value: config.legroomPosition,
      min: 0, max: config.storageColumns, step: 1, unit: '', displayValue: null,
      markers: Array.from({ length: config.storageColumns + 1 }, (_, position) => position) },
    current.family === 'desk-classic'
      ? { kind: 'notice', id: 'backPanel', label: '뒷판', target: globalTarget, ...active,
        text: '서랍·도어·다리 공간 뒤에는 기본으로 뒷판이 들어갑니다.' }
      : { kind: 'choice', variant: 'pill', id: 'backPanel', label: '뒷판', target: globalTarget, ...active,
        value: config.hasBackPanel || !openStorage ? 'on' : 'off',
        options: [{ id: 'off', label: '없음', enabled: openStorage }, { id: 'on', label: '있음' }],
        help: '서랍·도어·다리 공간 뒤에는 기본으로 뒷판이 들어갑니다.' },
    { kind: 'choice', variant: 'pill', id: 'cableManagement', label: '다리 공간 케이블', target: globalTarget, ...active,
      value: config.cableManagement ?? 'off',
      options: [{ id: 'off', label: '없음' }, { id: 'left', label: '왼쪽' }, { id: 'right', label: '오른쪽' }] },
    { kind: 'swatch', id: 'color', label: '색상', target: globalTarget, ...active, value: current.color, options: deskSwatches(current) },
  ];
  const target = { scope: 'section', sectionId: selected ?? '' } as const;
  const geometry = calculateDeskGeometry(config);
  const storage = geometry.columns.find(c => c.storageIndex === index);
  const isDouble = !!storage && storage.width * 10 - 18 > 570;
  const hasDoor = option.fills.some(fill => fill === 'D');
  const interior: FurnitureControl[] = [
    { kind: 'choice', variant: 'pill', id: 'storageKind', label: '수납 구성', target, visible: selected !== null, enabled: selected !== null,
      value: option.id, options: DESK_CHANNEL_OPTIONS.map(o => ({ id: o.id, label: o.label })) },
    { kind: 'choice', variant: 'tile', id: 'doorDirection', label: '도어 방향', target, visible: selected !== null && hasDoor,
      enabled: !isDouble, disabledReason: isDouble ? '양개형 도어는 양쪽으로 열립니다.' : undefined,
      value: channel?.doorDirection ?? (config.legroomPosition > index ? 'left' : 'right'),
      options: [{ id: 'left', label: '왼쪽 경첩', icon: 'door-left' }, { id: 'right', label: '오른쪽 경첩', icon: 'door-right' }] },
    { kind: 'choice', variant: 'pill', id: 'cableOpenings', label: '케이블 구멍', target,
      visible: selected !== null && geometry.cableOpeningAvailability[index], enabled: true,
      value: channel?.cableOpenings ? 'on' : 'off',
      options: [{ id: 'off', label: '없음' }, { id: 'on', label: '있음' }] },
  ];
  return {
    panelProfileId: current.family, layout: 'tabs', selectedSectionId: selected,
    sections: sectionIds.map((id, i) => ({ id, label: `수납 ${i + 1}` })),
    tabs: [{ id: 'appearance', label: '외형', controls: appearance },
      { id: 'interior', label: '내부 구성', usesSections: true, controls: interior }],
  };
}

/** Stale section IDs and unsupported options are ignored without changing the design. */
export function applyDeskIntent(design: DeskDesign, intent: FurnitureEditIntent): DeskDesign {
  if (intent.type !== 'set') return design;
  const current = normalizeDeskDesign(design);
  const view = deskPanelView(current, intent.target.scope === 'section' ? intent.target.sectionId : null);
  const control = view.tabs.flatMap(tab => tab.controls).find(c => c.id === intent.controlId && c.target.scope === intent.target.scope &&
    (c.target.scope !== 'section' || (intent.target.scope === 'section' && c.target.sectionId === intent.target.sectionId)));
  if (!control || !control.visible || !control.enabled) return design;
  const next = structuredClone(current);
  if (intent.target.scope === 'section') {
    const index = next.sectionIds.indexOf(intent.target.sectionId);
    if (index < 0 || !next.config.channels?.[index]) return design;
    if (intent.controlId === 'storageKind' && DESK_CHANNEL_OPTIONS.some(o => o.id === intent.value)) {
      next.config.channels[index].kind = intent.value as DeskChannelKind;
    } else if (intent.controlId === 'doorDirection' && (intent.value === 'left' || intent.value === 'right')) {
      next.config.channels[index].doorDirection = intent.value;
    } else if (intent.controlId === 'cableOpenings' && (intent.value === 'on' || intent.value === 'off')) {
      next.config.channels[index].cableOpenings = intent.value === 'on';
    } else return design;
    return normalizeDeskDesign(next);
  }
  const numeric = typeof intent.value === 'number' ? intent.value : Number(intent.value);
  switch (intent.controlId) {
    case 'width':
      if (!Number.isFinite(numeric)) return design;
      next.config.widthMm = Math.round(numeric * 10);
      break;
    case 'depth':
      if (![40, 50, 60].includes(numeric)) return design;
      next.config.depthMm = numeric * 10 as 400 | 500 | 600;
      break;
    case 'storageSections':
      if (!availableStorageColumns(next.config.widthMm).includes(numeric)) return design;
      next.config.storageColumns = numeric;
      break;
    case 'legSpace':
      if (!Number.isInteger(numeric) || numeric < 0 || numeric > next.config.storageColumns) return design;
      next.config.legroomPosition = numeric;
      break;
    case 'backPanel':
      if (intent.value !== 'on' && intent.value !== 'off') return design;
      if (intent.value === 'off' && !hasOpenStorage(next)) return design;
      next.config.hasBackPanel = intent.value === 'on';
      break;
    case 'cableManagement':
      if (!['off', 'left', 'right'].includes(String(intent.value))) return design;
      next.config.cableManagement = intent.value as 'off' | 'left' | 'right';
      break;
    case 'color':
      if (!deskSwatches(next).some(c => c.id === intent.value)) return design;
      next.color = String(intent.value);
      break;
    default: return design;
  }
  return normalizeDeskDesign(next);
}

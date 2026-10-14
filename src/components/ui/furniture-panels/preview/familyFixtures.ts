/**
 * PREVIEW 데이터 — 옷장 외 제품군의 우측 패널 profile.
 * 근거: docs/tylko-reference/category-inventory.md, cases/category-<slug>-001.json의 optionUiSnapshot(항목 순서)·sliders(aria 범위).
 *
 * - 값은 각 사례의 관찰 초기값. 상태 전이·조건부 노출 규칙은 리더 소유이며 여기서는 단순 값 반영만 한다(preview 하네스).
 * - step: 미확인 → null.
 * - Original/Edge 색상 목록: 사례 스냅샷에 색 이름이 없어(목록 항목 무라벨) Befun 기존 팔레트를 표시. 원본 색 목록·개수 미확인.
 * - Tone 색 이름은 관찰(Cremeweiß 등), 색값은 이름 기반 근사(미측정).
 */
import type { FurnitureControl, FurniturePanelView, PanelTab } from '../types';
import { REFERENCE_COLORS } from '@/lib/three/reference-colors';

export type Values = Record<string, string | number>;

const G = { scope: 'global' } as const;
const on = { visible: true, enabled: true } as const;

const BEFUN_SOLID = [
  ['S_White', '화이트'], ['S_Cotton', '코튼'], ['S_Stone Gray', '스톤 그레이'], ['S_Sky Blue', '스카이 블루'], ['S_Teracotta', '테라코타'],
  ['S_Midnight Blue', '미드나잇 블루'], ['S_Burgundy', '버건디'], ['S_Matte Black', '매트 블랙'], ['S_Reisinger Pink', '핑크'],
  ['S_Sage Green', '세이지 그린'], ['S_Olive Green', '올리브 그린'], ['S_Butter Yellow', '버터 옐로'],
] as const;
const befunSwatches = (value: string | number, id = 'color', label = '색상'): FurnitureControl => ({
  kind: 'swatch', id, label, target: G, ...on, value: String(value),
  options: BEFUN_SOLID.map(([cid, name]) => ({ id: cid, label: name, color: REFERENCE_COLORS[cid]?.base ?? '#ccc' })),
  notice: '색상 목록은 Befun 팔레트(원본 목록 미관찰)',
});

const STYLE_ICON = (s: string) => ({ imageUrl: `/imgs/icon/icon_${s}_black.svg`, activeImageUrl: `/imgs/icon/icon_${s}.svg` });
const styleChoice = (ids: string[], value: string | number): FurnitureControl => ({
  kind: 'choice', variant: 'tile', id: 'style', label: '스타일', target: G, ...on, value: String(value),
  options: ids.map((id) => ({ id, label: id === 'frame' ? 'Frame' : id[0].toUpperCase() + id.slice(1), ...(id !== 'frame' && STYLE_ICON(id)) })),
});
const depthChoice = (depths: number[], value: string | number, disabled: number[] = []): FurnitureControl => ({
  kind: 'choice', variant: 'pill', id: 'depth', label: '깊이', target: G, ...on, value: String(value),
  options: depths.map((d) => ({ id: String(d), label: `${d}cm`, enabled: !disabled.includes(d) })),
});
const finish = (third: string, value: string | number): FurnitureControl => ({
  kind: 'choice', variant: 'pill', id: 'finish', label: '마감', target: G, ...on, value: String(value),
  options: [{ id: 'paint', label: '도장' }, { id: 'plywood', label: '합판' }, { id: third, label: third === 'veneer' ? '무늬목' : '우드룩' }],
});
const backPanel = (value: string | number, offLabel = '없음', offEnabled = true): FurnitureControl => ({
  kind: 'choice', variant: 'pill', id: 'backPanel', label: '뒷판', target: G, ...on, value: String(value),
  options: [{ id: 'off', label: offLabel, enabled: offEnabled }, { id: 'on', label: '있음' }],
});
const slider = (id: string, label: string, value: number, min: number, max: number, extra: Partial<Extract<FurnitureControl, { kind: 'slider' }>> = {}): FurnitureControl =>
  ({ kind: 'slider', id, label, target: G, ...on, value, min, max, step: null, unit: 'cm', ...extra });
const single = (id: string, caseId: string, note: string, controls: FurnitureControl[]): FurniturePanelView =>
  ({ panelProfileId: `preview:${id}`, layout: 'single', sections: [], selectedSectionId: null, preview: { caseIds: [caseId], note }, tabs: [{ id: 'main', label: '옵션', controls }] });

/** Original 행 높이: 인덱스 0–9 슬라이더, 표시값은 리더가 행 조합으로 계산(관찰: index 4 → 163cm). */
const ROW_HEIGHT_OBSERVED: Record<number, string> = { 4: '163cm' };

export interface FamilyPreset { id: string; title: string; initial: Values; view: (v: Values) => FurniturePanelView }

export const FAMILY_PRESETS: FamilyPreset[] = [
  {
    id: 'original-row', title: 'Original 행 선반 (책장·벽수납·신발장)',
    initial: { style: 'pattern', density: 48, width: 102, height: 4, depth: 32, backPanel: 'off', finish: 'plywood', color: 'S_White' },
    view: (v) => single('original-row', 'category-bookcase-001 / Original Classic 7197274', '스냅샷에 Slant 포함 6개 스타일 관찰(인벤토리 문서는 5개) — 리더 확인 필요. 높이는 행 인덱스', [
      styleChoice(['slant', 'pattern', 'grid', 'mosaic', 'gradient', 'pixel'], v.style),
      slider('density', '밀도', Number(v.density), 0, 100, { unit: '%' }),
      slider('width', '너비', Number(v.width), 30, 450),
      slider('height', '높이', Number(v.height), 0, 9, { unit: '', displayValue: ROW_HEIGHT_OBSERVED[Number(v.height)] ?? '리더 계산값' }),
      depthChoice([24, 32, 40], v.depth),
      backPanel(v.backPanel),
      finish('veneer', v.finish),
      befunSwatches(v.color),
    ]),
  },
  {
    id: 'original-column', title: 'Original 열 수납 (사이드보드·TV·서랍장·협탁)',
    initial: { style: 'frame', width: 200, height: 63, depth: 40, base: 'feet', backPanel: 'off', finish: 'plywood', color: 'S_White' },
    view: (v) => single('original-column', 'category-sideboard-001 / Original Classic 4665612', 'Classic 받침 발/소켈. Modern은 발/다리, TV Modern은 구획 스테퍼 관찰. 밀도는 일부 스타일만(조건 미확인)', [
      styleChoice(['frame', 'grid', 'gradient', 'mosaic', 'pattern', 'pixel'], v.style),
      slider('width', '너비', Number(v.width), 30, 450),
      slider('height', '높이', Number(v.height), 33, 123),
      depthChoice([24, 32, 40, 50], v.depth),
      { kind: 'choice', variant: 'pill', id: 'base', label: '받침', target: G, ...on, value: String(v.base), options: [{ id: 'feet', label: '발' }, { id: 'plinth', label: '소켈' }] },
      backPanel(v.backPanel),
      finish('veneer', v.finish),
      befunSwatches(v.color),
    ]),
  },
  {
    id: 'original-column-tv-modern', title: 'Original Modern TV 스탠드',
    initial: { style: 'grid', width: 140, height: 33, depth: 40, sections: 3, base: 'feet', finish: 'paint', color: 'S_White' },
    view: (v) => single('original-column-tv-modern', 'category-tv-stand-001 / Original Modern 4665821', '구획 −(비활성) 3 관찰, + 상태 미확인. 뒷판은 안내문만', [
      styleChoice(['grid', 'gradient', 'mosaic', 'frame', 'pattern', 'pixel'], v.style),
      slider('width', '너비', Number(v.width), 30, 450),
      slider('height', '높이', Number(v.height), 33, 123),
      depthChoice([24, 32, 40, 50], v.depth),
      { kind: 'stepper', id: 'sections', label: '구획', target: G, ...on, value: Number(v.sections), canDecrement: false, canIncrement: true },
      { kind: 'choice', variant: 'pill', id: 'base', label: '받침', target: G, ...on, value: String(v.base), options: [{ id: 'feet', label: '발' }, { id: 'legs', label: '다리' }] },
      { kind: 'notice', id: 'backPanel', label: '뒷판', target: G, ...on, text: '서랍과 도어가 있는 칸에는 항상 뒷판이 있습니다.' },
      finish('veneer', v.finish),
      befunSwatches(v.color),
    ]),
  },
  {
    id: 'desk', title: 'Original 책상·화장대',
    initial: { width: 102, depth: 50, storage: 1, legSpace: 68, color: 'S_Butter Yellow' },
    view: (v) => single('desk', 'category-desk-001 / Original Classic 3760569', '높이 73cm 고정 안내. 수납 구획 −/+ 모두 비활성 관찰. 다리 공간 슬라이더 값 표시 없음(34–68)', [
      slider('width', '너비', Number(v.width), 90, 240),
      { kind: 'notice', id: 'height', label: '높이', target: G, ...on, text: '모든 책상은 높이 73cm입니다.' },
      depthChoice([40, 50, 60], v.depth),
      { kind: 'stepper', id: 'storageSections', label: '수납 구획', target: G, ...on, value: Number(v.storage), canDecrement: false, canIncrement: false },
      slider('legSpace', '다리 공간', Number(v.legSpace), 34, 68, { displayValue: null, unit: '' }),
      { kind: 'notice', id: 'backPanel', label: '뒷판', target: G, ...on, text: '서랍·도어·다리 공간 뒤에는 기본으로 뒷판이 들어갑니다.' },
      befunSwatches(v.color),
    ]),
  },
  {
    id: 'vinyl', title: '레코드 수납',
    initial: { style: 'pattern', width: 168, height: 1, depth: 40, backPanel: 'on', color: 'S_White' },
    view: (v) => single('vinyl', 'category-vinyl_storage-001 / 3763292', '24/32cm·뒷판 없음 비활성 관찰(영구 규칙 여부 미확인). 밀도 없음', [
      { kind: 'choice', variant: 'tile', id: 'style', label: '스타일', target: G, ...on, value: String(v.style),
        options: [{ id: 'pattern', label: 'Pattern', ...STYLE_ICON('pattern') }, { id: 'standard-grid', label: 'Standard Grid', ...STYLE_ICON('grid') }, { id: 'dense-grid', label: 'Dense Grid', ...STYLE_ICON('grid') }] },
      slider('width', '너비', Number(v.width), 30, 450),
      slider('height', '높이', Number(v.height), 0, 9, { unit: '', displayValue: Number(v.height) === 1 ? '83cm' : '리더 계산값' }),
      depthChoice([24, 32, 40], v.depth, [24, 32]),
      backPanel(v.backPanel, '없음', false),
      befunSwatches(v.color),
    ]),
  },
  {
    id: 'edge-low', title: 'Edge 낮은 수납 (사이드보드·TV·서랍장·협탁·신발장)',
    initial: { width: 94, height: 108, depth: 36, columns: 1, topEdge: 'with', finish: 'paint', color: 'S_White' },
    view: (v) => {
      const tabs: PanelTab[] = [
        { id: 'appearance', label: '외형', controls: [
          slider('width', '너비', Number(v.width), 40, 600),
          slider('height', '높이', Number(v.height), 48, 158),
          { ...depthChoice([36, 45, 60], v.depth), help: '낮은 수납군 깊이 36/45/60' },
          // 관찰: 너비 94cm → 156cm 안내, 신발장 173cm → 3구획 스테퍼(+ 비활성). 실제 경계·증감 가능 여부는 리더가 계산.
          Number(v.width) >= 156
            ? { kind: 'stepper', id: 'columns', label: '구획', target: G, ...on, value: Number(v.columns), canDecrement: true, canIncrement: false, notice: '신발장 173cm: 3구획, + 비활성 관찰' }
            : { kind: 'notice', id: 'columns', label: '구획', target: G, ...on, text: '구획은 너비 156cm 이상부터 추가할 수 있습니다.' },
          { kind: 'choice', variant: 'pill', id: 'topEdge', label: '상단 테두리', target: G, ...on, value: String(v.topEdge), options: [{ id: 'with', label: '있음' }, { id: 'without', label: '없음' }] },
          finish('woodlook', v.finish),
          befunSwatches(v.color),
        ] },
        { id: 'interior', label: '내부 구성', controls: [
          { kind: 'notice', id: 'interiorTodo', label: '', target: G, ...on, text: 'Edge 낮은 수납의 내부 구성 항목은 아직 관찰되지 않았습니다(인벤토리 문서). 사례 확보 후 추가.' },
        ] },
      ];
      return { panelProfileId: 'preview:edge-low', layout: 'tabs', sections: [], selectedSectionId: null, tabs,
        preview: { caseIds: ['category-sideboard-001 / Edge 1430061', 'category-shoerack-001 / Edge 1614538'], note: '외형 탭만 관찰. 내부 구성 미관찰' } };
    },
  },
  {
    id: 'tone-low', title: 'Tone 낮은 수납 (사이드보드·TV·서랍장·협탁)',
    initial: { styleTone: 'legs', width: 80, height: 52, depth: 36, color: 'pistachio', sectionsCount: '1', drawerDensity: 'low' },
    view: (v) => ({
      panelProfileId: 'preview:tone-low', layout: 'steps', sections: [], selectedSectionId: null,
      preview: { caseIds: ['category-sideboard-001 / Tone 907980', 'category-tv-stand-001 / Tone 657770'], note: '단계형. 서랍 밀도는 sideboard만 관찰(TV 없음). 외부/내부 색 선택 방식 미확인' },
      tabs: [
        { id: 'style', label: '스타일', heading: '스타일 선택', controls: [
          { kind: 'choice', variant: 'tile', id: 'styleTone', label: '스타일', target: G, ...on, value: String(v.styleTone),
            options: [{ id: 'minimal', label: '미니멀', icon: 'style-minimal' }, { id: 'hanging', label: '벽걸이', icon: 'style-hanging' }, { id: 'legs', label: '다리형', icon: 'style-legs' }] },
        ] },
        { id: 'size', label: '크기', heading: '크기 조정', controls: [
          slider('width', '너비', Number(v.width), 40, 240, { numberInput: true }),
          slider('height', '높이', Number(v.height), 32, 132, { numberInput: true }),
          { ...depthChoice([36, 46, 56], v.depth) },
        ] },
        { id: 'color', label: '색상', heading: '색상 선택', controls: [
          { kind: 'swatch', id: 'color', label: '색상', target: G, ...on, value: String(v.color), notice: '관찰 초기값: 외부 피스타치오 그린 / 내부 캐시미어 베이지',
            options: [['cream', '크림 화이트', '#efe9dc'], ['cashmere', '캐시미어 베이지', '#d6c7b2'], ['pistachio', '피스타치오 그린', '#b8c3a0'], ['ink', '잉크 블랙', '#2a2a2a'], ['blush', '블러시 핑크', '#e2c4c0']].map(([id, label, color]) => ({ id, label, color })) },
        ] },
        { id: 'layout', label: '배치', heading: '배치', controls: [
          { kind: 'choice', variant: 'pill', id: 'sectionsCount', label: '구획 수', target: G, ...on, value: String(v.sectionsCount), options: [{ id: '1', label: '1' }] },
          { kind: 'choice', variant: 'pill', id: 'drawerDensity', label: '서랍 밀도', target: G, ...on, value: String(v.drawerDensity), options: [{ id: 'high', label: '높음' }, { id: 'low', label: '낮음' }] },
        ] },
        { id: 'summary', label: '요약', heading: '요약', controls: [
          { kind: 'notice', id: 'summary', label: '치수', target: G, ...on, text: `${v.width}cm × ${v.height}cm` },
        ] },
      ],
    }),
  },
  {
    id: 'tone-14', title: 'Tone 책장·벽수납',
    initial: { width: 244, height: 164, depth: 45, finishTone: 'standard', color: 'cream', sections: 3, handle: 'grip' },
    view: (v) => ({
      panelProfileId: 'preview:tone-14', layout: 'steps', sections: [], selectedSectionId: null,
      preview: { caseIds: ['category-wallstorage-001 / Tone 1964452'], note: '단계형, 스타일 단계 없음. 깊이는 슬라이더(27–65). 구획 − 비활성 관찰. 손잡이 방식은 도어에만 적용' },
      tabs: [
        { id: 'size', label: '크기', heading: '크기 조정', controls: [
          slider('width', '너비', Number(v.width), 40, 600, { numberInput: true }),
          slider('height', '높이', Number(v.height), 44, 296, { numberInput: true }),
          slider('depth', '깊이', Number(v.depth), 27, 65, { numberInput: true }),
        ] },
        { id: 'color', label: '색상', heading: '마감과 색상 선택', controls: [
          { kind: 'choice', variant: 'pill', id: 'finishTone', label: '마감', target: G, ...on, value: String(v.finishTone), options: [{ id: 'standard', label: '스탠다드' }, { id: 'premium-matt', label: '프리미엄 매트' }] },
          { kind: 'swatch', id: 'color', label: '색상', target: G, ...on, value: String(v.color),
            options: [['cream', '크림 화이트', '#efe9dc'], ['cashmere', '캐시미어 베이지', '#d6c7b2'], ['pistachio', '피스타치오 그린', '#b8c3a0'], ['ash', '애시 그레이', '#9a9a96'], ['midnight', '미드나잇 블루', '#28324a'], ['mist', '미스트 블루', '#a9b6c4']].map(([id, label, color]) => ({ id, label, color })) },
        ] },
        { id: 'columns', label: '구획', heading: '구획 수', controls: [
          { kind: 'stepper', id: 'sections', label: '구획 수', target: G, ...on, value: Number(v.sections), canDecrement: false, canIncrement: true, notice: '사용 가능한 구획 수는 너비에 따라 달라집니다.' },
        ] },
        { id: 'handle', label: '손잡이', heading: '여는 방식', controls: [
          { kind: 'choice', variant: 'tile', id: 'handle', label: '손잡이', target: G, ...on, value: String(v.handle), notice: '도어에만 적용됩니다.',
            options: [{ id: 'grip', label: '손잡이', icon: 'handle-grip' }, { id: 'push', label: '푸시', icon: 'handle-push' }] },
        ] },
        { id: 'summary', label: '요약', heading: '요약', controls: [
          { kind: 'notice', id: 'summary', label: '치수', target: G, ...on, text: `${v.width}cm × ${v.height}cm × ${v.depth}cm` },
        ] },
      ],
    }),
  },
];

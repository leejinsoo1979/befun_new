/**
 * PREVIEW 데이터 — Tylko 옷장 관찰 사례(docs/tylko-reference/wardrobe.md, cases/category-wardrobe-*.json)를 패널 view로 옮긴 것.
 * 리더의 상태 전이/생성기가 아니다. 실제 서비스에서는 리더가 FurniturePanelView를 계산해 내려준다.
 *
 * 관찰 / 미확인 구분
 * - 항목·순서·초기값·aria 범위·선택지: 관찰(사례 ID 표기).
 * - step: 미확인 → null.
 * - 스와치 색: 사례 PNG 화면 픽셀 샘플(색명·재질값 미측정).
 * - 내부 배치 썸네일 도식: 화면 근사. 실제 구성 목록·치수는 미확인(edge-004→005에서 2번째만 확인).
 * - 높이 슬라이더 점 위치: 화면 근사(행 경계 의미 미확인).
 */
import type { FurniturePanelView, LayoutOption } from '../types';

const G = { scope: 'global' } as const;
const sec = (sectionId: string) => ({ scope: 'section', sectionId }) as const;

// ── Edge 옷장 (Cabinet/type4) ──

export interface EdgePreviewState {
  widthCm: number;
  heightCm: number;
  depthCm: 27 | 36 | 45 | 60;
  topEdge: 'with' | 'without';
  finish: 'paint' | 'plywood' | 'woodlook';
  color: string;
  sections: { id: string; layout: string; facade: 'open' | 'middle-open' | 'bottom-open' | 'closed'; door: 'left' | 'right'; heightCm: number; depthCm: 27 | 36 | 45 | 60 }[];
}

export const EDGE_INITIAL: EdgePreviewState = {
  widthCm: 118, heightCm: 198, depthCm: 60, topEdge: 'with', finish: 'paint', color: 'edge-green',
  sections: [
    { id: 's1', layout: 'edge-l1', facade: 'closed', door: 'right', heightCm: 198, depthCm: 60 },
    { id: 's2', layout: 'edge-l1', facade: 'closed', door: 'right', heightCm: 198, depthCm: 60 },
  ],
};

const EDGE_COLORS = [
  ['edge-white', '화이트', '#ffffff'], ['edge-light-gray', '라이트 그레이', '#c2c1bf'], ['edge-taupe', '토프', '#b0a7a3'],
  ['edge-black', '블랙', '#1b1b1b'], ['edge-beige', '베이지', '#dbd2c9'], ['edge-clay', '클레이', '#b98f6f'],
  ['edge-cream', '크림', '#fcf5d4'], ['edge-green', '그린', '#727b57'], ['edge-blue-gray', '블루 그레이', '#697a8a'],
  ['edge-navy', '네이비', '#2d3953'], ['edge-burgundy', '버건디', '#692c3c'],
] as const;

const EDGE_LAYOUTS: LayoutOption[] = [
  { id: 'edge-l1', label: '배치 1 · 옷봉', glyph: { rails: [0.85] } },
  { id: 'edge-l2', label: '배치 2 · 상하 옷봉', glyph: { rails: [0.88, 0.45] } },
  { id: 'edge-l3', label: '배치 3 · 옷봉 + 하부 선반', glyph: { rails: [0.85], shelves: [0.3] } },
  { id: 'edge-l4', label: '배치 4 · 옷봉 + 선반 2', glyph: { rails: [0.85], shelves: [0.3, 0.15] } },
  { id: 'edge-l5', label: '배치 5 · 옷봉 + 서랍', glyph: { rails: [0.85], drawers: [{ from: 0.02, to: 0.3, count: 2 }] } },
  { id: 'edge-l6', label: '배치 6 · 선반형', glyph: { shelves: [0.8, 0.6, 0.4, 0.2] } },
  { id: 'edge-l7', label: '배치 7 · 상부 선반 + 옷봉', glyph: { shelves: [0.8], rails: [0.7] } },
];

/** 관찰된 천장 높이 안내값만 표시(198→208, 238→248). 다른 값의 공식은 미확인 → 리더 계산값을 받아야 함. */
const CEILING_OBSERVED: Record<number, number> = { 198: 208, 238: 248 };
const ceiling = (h: number) => CEILING_OBSERVED[h] !== undefined ? `천장 높이 ${CEILING_OBSERVED[h]}cm 이상이 필요합니다.` : '천장 높이 안내: 리더 계산값 필요(미확인)';

const DEPTHS = [27, 36, 45, 60].map((d) => ({ id: String(d), label: `${d}cm` }));

export function edgeView(state: EdgePreviewState, selectedSectionId: string): FurniturePanelView {
  const s = state.sections.find((x) => x.id === selectedSectionId) ?? state.sections[0];
  const canAddSection = state.widthCm >= 156;
  return {
    panelProfileId: 'preview:wardrobe-edge',
    preview: { caseIds: ['category-wardrobe-edge-001…005'], note: '관찰 항목·순서. 구획 추가 경계·전체 배치 목록·step 미확인' },
    selectedSectionId: s.id,
    sections: state.sections.map((x, i) => ({ id: x.id, label: x.id === s.id ? `구획 ${i + 1}` : String(i + 1) })),
    tabs: [
      {
        id: 'appearance', label: '외형',
        controls: [
          { kind: 'slider', id: 'width', label: '너비', target: G, visible: true, enabled: true, value: state.widthCm, min: 40, max: 600, step: null, unit: 'cm' },
          { kind: 'slider', id: 'height', label: '높이', target: G, visible: true, enabled: true, value: state.heightCm, min: 138, max: 300, step: null, unit: 'cm',
            markers: [150, 175, 225, 275], notice: `이 가구는 ${ceiling(state.heightCm)}` },
          { kind: 'choice', variant: 'pill', id: 'depth', label: '깊이', help: '옷장 몸체 깊이', target: G, visible: true, enabled: true, options: DEPTHS, value: String(state.depthCm) },
          { kind: 'notice', id: 'sections', label: '구획', target: G, visible: true, enabled: true,
            text: canAddSection ? '구획을 추가할 수 있습니다.' : '구획은 너비 156cm 이상부터 추가할 수 있습니다.' },
          { kind: 'choice', variant: 'pill', id: 'topEdge', label: '상단 테두리', help: '상판 가장자리 돌출 테두리', target: G, visible: true, enabled: true,
            options: [{ id: 'with', label: '있음' }, { id: 'without', label: '없음' }], value: state.topEdge },
          { kind: 'choice', variant: 'pill', id: 'finish', label: '마감', help: '표면 마감 종류', target: G, visible: true, enabled: true,
            options: [{ id: 'paint', label: '도장' }, { id: 'plywood', label: '합판' }, { id: 'woodlook', label: '우드룩' }], value: state.finish },
          { kind: 'swatch', id: 'color', label: '색상', target: G, visible: true, enabled: true,
            options: EDGE_COLORS.map(([id, label, color]) => ({ id, label, color })), value: state.color },
        ],
      },
      {
        id: 'interior', label: '내부 구성', usesSections: true,
        controls: [
          { kind: 'layout', id: 'layout', label: '내부 배치', target: sec(s.id), visible: true, enabled: true, options: EDGE_LAYOUTS, value: s.layout },
          { kind: 'choice', variant: 'tile', id: 'facade', label: '전면', target: sec(s.id), visible: true, enabled: true, value: s.facade,
            options: [
              { id: 'open', label: '오픈', icon: 'facade-open' }, { id: 'middle-open', label: '중간 오픈', icon: 'facade-middle-open' },
              { id: 'bottom-open', label: '하단 오픈', icon: 'facade-bottom-open' }, { id: 'closed', label: '닫힘', icon: 'facade-closed' },
            ] },
          { kind: 'action', id: 'cableChannel', label: '케이블 통로', help: '후면 케이블 통로', target: sec(s.id), visible: true, enabled: true, actionLabel: '추가' },
          // edge-002→003/004: 전면이 오픈이면 문 방향 UI 숨김(값 유지/삭제는 미확인 — 리더 결정)
          { kind: 'choice', variant: 'pill', id: 'doorDirection', label: '문 방향', target: sec(s.id), visible: s.facade !== 'open', enabled: true, value: s.door,
            options: [{ id: 'left', label: '왼쪽', icon: 'door-left' }, { id: 'right', label: '오른쪽', icon: 'door-right' }] },
          { kind: 'slider', id: 'sectionHeight', label: '기둥 높이', target: sec(s.id), visible: true, enabled: true, value: s.heightCm, min: 138, max: 300, step: null, unit: 'cm',
            markers: [150, 175, 225, 275], notice: `이 기둥은 ${ceiling(s.heightCm)}` },
          { kind: 'choice', variant: 'pill', id: 'sectionDepth', label: '구획 깊이', help: '선택한 구획만의 깊이', target: sec(s.id), visible: true, enabled: true, options: DEPTHS, value: String(s.depthCm) },
        ],
      },
    ],
  };
}

// ── Tone 옷장 (Wardrobe/type3) ──

export interface TonePreviewState {
  widthCm: number;
  heightMode: 'presets' | 'extended';
  heightPreset: '200' | '237' | null;
  heightCm: number;
  depthCm: number;
  lighting: 'none' | 'inside';
  outer: string;
  inner: string;
  layout: string;
  drawers: 'internal' | 'external';
}

export const TONE_INITIAL: TonePreviewState = {
  widthCm: 100, heightMode: 'presets', heightPreset: '200', heightCm: 200, depthCm: 53,
  lighting: 'none', outer: 'tone-out-white', inner: 'tone-in-white', layout: 'tone-l4', drawers: 'internal',
};

const TONE_OUTER = [['tone-out-white', '화이트', '#fbfffc'], ['tone-out-beige', '베이지', '#cdc8c3'], ['tone-out-graphite', '그래파이트', '#4c4d47']] as const;
const TONE_INNER = [['tone-in-pink', '핑크', '#c9afae'], ['tone-in-taupe', '토프', '#a0968c'], ['tone-in-mint', '민트', '#b8c9bb'], ['tone-in-blue', '블루', '#9fa9b5'], ['tone-in-white', '화이트', '#ffffff']] as const;

const TONE_LAYOUTS: LayoutOption[] = [
  { id: 'tone-l1', label: '배치 1 · 옷봉 + 서랍', glyph: { rails: [0.85], drawers: [{ from: 0.02, to: 0.3, count: 3 }] } },
  { id: 'tone-l2', label: '배치 2 · 선반 + 서랍', glyph: { shelves: [0.8, 0.6, 0.45], drawers: [{ from: 0.02, to: 0.3, count: 3 }] } },
  { id: 'tone-l3', label: '배치 3 · 옷봉 + 선반 + 서랍', glyph: { rails: [0.85], shelves: [0.45], drawers: [{ from: 0.02, to: 0.3, count: 3 }] } },
  { id: 'tone-l4', label: '배치 4 · 옷봉 + 서랍 4', glyph: { rails: [0.85], shelves: [0.5], drawers: [{ from: 0.02, to: 0.4, count: 4 }] } },
  { id: 'tone-l5', label: '배치 5 · 선반형', glyph: { shelves: [0.8, 0.6, 0.4, 0.2] } },
  { id: 'tone-l6', label: '배치 6 · 상하 옷봉', glyph: { rails: [0.88, 0.45] } },
];

export function toneView(state: TonePreviewState): FurniturePanelView {
  return {
    panelProfileId: 'preview:wardrobe-tone',
    preview: { caseIds: ['category-wardrobe-tone-001…009'], note: '관찰 항목·순서. 높이+ 범위 238–360, 조명 4cm 안내, 내외부 서랍 전환 반영. step·전체 배치 미확인' },
    selectedSectionId: null,
    sections: [],
    tabs: [
      {
        id: 'appearance', label: '외형',
        controls: [
          { kind: 'slider', id: 'width', label: '너비', target: G, visible: true, enabled: true, value: state.widthCm, min: 40, max: 600, step: null, unit: 'cm' },
          { kind: 'heightMode', id: 'height', label: '높이', target: G, visible: true, enabled: true, mode: state.heightMode,
            presets: [{ id: '200', label: '200cm' }, { id: '237', label: '237cm' }], selectedPresetId: state.heightPreset,
            extendLabel: '높이+', standardLabel: '기본',
            range: state.heightMode === 'extended' ? { value: state.heightCm, min: 238, max: 360, step: null, unit: 'cm' } : null,
            notice: state.heightMode === 'extended' ? ceiling(state.heightCm) : undefined },
          { kind: 'slider', id: 'depth', label: '깊이', target: G, visible: true, enabled: true, value: state.depthCm, min: 40, max: 80, step: null, unit: 'cm' },
          { kind: 'notice', id: 'measureGuide', label: '', target: G, visible: true, enabled: true,
            text: '공간 치수를 재 보셨나요?', link: { label: '측정 방법 보기', href: '#measure-guide' } },
          { kind: 'choice', variant: 'pill', id: 'lighting', label: '조명', target: G, visible: true, enabled: true,
            options: [{ id: 'none', label: '없음' }, { id: 'inside', label: '내부' }], value: state.lighting,
            notice: state.lighting === 'inside' ? '조명 플러그를 위해 벽과 옷장 뒤쪽 사이에 4cm 여유가 필요합니다.' : undefined },
          { kind: 'swatch', id: 'outerColor', label: '외부 색상', target: G, visible: true, enabled: true,
            options: TONE_OUTER.map(([id, label, color]) => ({ id, label, color })), value: state.outer },
          { kind: 'swatch', id: 'innerColor', label: '내부 색상', target: G, visible: true, enabled: true,
            options: TONE_INNER.map(([id, label, color]) => ({ id, label, color })), value: state.inner },
        ],
      },
      {
        id: 'interior', label: '내부 구성',
        // tone-004: 너비 100cm일 때 구획 94cm 관찰. 다른 너비의 구획 너비 공식은 미확인.
        sectionSummary: { title: '구획 너비', value: state.widthCm === 100 ? '94cm' : '리더 계산값 필요', caption: `옷장 전체 너비 ${state.widthCm}cm` },
        controls: [
          { kind: 'layout', id: 'layout', label: '내부 배치', target: G, visible: true, enabled: true, options: TONE_LAYOUTS, value: state.layout },
          { kind: 'choice', variant: 'tile', id: 'drawers', label: '서랍', help: '서랍 위치에 따라 전면 구성이 달라집니다.', target: G, visible: true, enabled: true,
            options: [{ id: 'internal', label: '내부', icon: 'drawer-internal' }, { id: 'external', label: '외부', icon: 'drawer-external' }], value: state.drawers,
            notice: '옷장 레이아웃이 바뀝니다.' },
        ],
      },
    ],
  };
}

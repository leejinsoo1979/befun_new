/**
 * 도면 편집기 도형 라이브러리 — 좌측 '요소 › 도형' 판의 원본(Canva 도형 판 구성을 따른다).
 * 미리보기(SVG path, 24×24)와 캔버스 객체 생성(make)을 한 곳에 둔다.
 */
import * as fabric from 'fabric';

export type ShapeGroup = '라인' | '기본 도형' | '다각형' | '별' | '화살표' | '플로차트';

export interface ShapeDef {
  id: string;
  label: string;
  group: ShapeGroup;
  /** 24×24 viewBox 기준 path (미리보기·드래그 프리뷰·기본 생성에 공통) */
  d: string;
  /** 선 계열: 채우지 않고 획으로 그린다 */
  stroke?: boolean;
  /** 선 계열 점선 패턴(px, 24 기준) */
  dash?: number[];
  fillRule?: 'nonzero' | 'evenodd';
  /** 네이티브 Fabric 도형이 더 나은 것(사각형 rx·원 radius 편집)은 따로 만든다 */
  make?: (size: number, color: string) => fabric.FabricObject;
}

export const SHAPE_FILL = '#c7ced7'; // Canva 기본 도형과 같은 연한 회청색
export const LINE_COLOR = '#4b5563';
export const SHAPE_GROUPS: ShapeGroup[] = ['라인', '기본 도형', '다각형', '별', '화살표', '플로차트'];

const S = (size: number) => size / 24;
const f1 = (n: number) => Math.round(n * 100) / 100;

/** 정다각형 path — 꼭짓점 하나가 위를 향한다 */
function polygon(n: number, r = 10, cx = 12, cy = 12): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push(`${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}`);
  }
  return `M${pts.join('L')}z`;
}

/** 별 path — 바깥 r, 안쪽 ri */
function star(n: number, r = 10, ri = 4.5, cx = 12, cy = 12): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 === 0 ? r : ri;
    pts.push(`${f1(cx + rr * Math.cos(a))} ${f1(cy + rr * Math.sin(a))}`);
  }
  return `M${pts.join('L')}z`;
}

function line(size: number, color: string, dash?: number[]): fabric.FabricObject {
  return new fabric.Line([0, 0, size, 0], {
    stroke: color === SHAPE_FILL ? LINE_COLOR : color, strokeWidth: 2, strokeDashArray: dash?.map(v => v * 2), strokeLineCap: 'round',
  });
}

function arrowLine(size: number, color: string, double: boolean): fabric.FabricObject {
  const h = 10; // 화살촉 길이
  const parts = [`M${double ? h : 0} 0H${size - h}`, `M${size - h} -6L${size} 0L${size - h} 6`];
  if (double) parts.push(`M${h} -6L0 0L${h} 6`);
  return new fabric.Path(parts.join(' '), {
    fill: '', stroke: color === SHAPE_FILL ? LINE_COLOR : color, strokeWidth: 2, strokeLineCap: 'round', strokeLineJoin: 'round',
  });
}

export const SHAPE_LIBRARY: ShapeDef[] = [
  // 라인
  { id: 'line', label: '실선', group: '라인', stroke: true, d: 'M2 12h20', make: (s, c) => line(s, c) },
  { id: 'line-dashed', label: '파선', group: '라인', stroke: true, dash: [4, 3], d: 'M2 12h20', make: (s, c) => line(s, c, [6, 4]) },
  { id: 'line-dotted', label: '점선', group: '라인', stroke: true, dash: [1, 3], d: 'M2 12h20', make: (s, c) => line(s, c, [1, 4]) },
  { id: 'line-arrow', label: '화살표 선', group: '라인', stroke: true, d: 'M2 12h18m-4-4 4 4-4 4', make: (s, c) => arrowLine(s, c, false) },
  { id: 'line-arrow-double', label: '양방향 선', group: '라인', stroke: true, d: 'M4 12h16m-4-4 4 4-4 4M8 8l-4 4 4 4', make: (s, c) => arrowLine(s, c, true) },

  // 기본 도형
  { id: 'rect', label: '사각형', group: '기본 도형', d: 'M2 2h20v20H2z', make: (s, c) => new fabric.Rect({ width: s, height: s, fill: c }) },
  {
    id: 'rounded-rect', label: '둥근 사각형', group: '기본 도형',
    d: 'M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z',
    make: (s, c) => new fabric.Rect({ width: s, height: s, rx: s * 0.16, ry: s * 0.16, fill: c }),
  },
  { id: 'circle', label: '원', group: '기본 도형', d: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z', make: (s, c) => new fabric.Circle({ radius: s / 2, fill: c }) },
  { id: 'ellipse', label: '타원', group: '기본 도형', d: 'M12 5c6.1 0 10 3.1 10 7s-3.9 7-10 7S2 15.9 2 12s3.9-7 10-7z', make: (s, c) => new fabric.Ellipse({ rx: s / 2, ry: s * 0.32, fill: c }) },
  { id: 'triangle', label: '삼각형', group: '기본 도형', d: 'M12 2l10 20H2z', make: (s, c) => new fabric.Triangle({ width: s, height: s, fill: c }) },
  { id: 'triangle-down', label: '역삼각형', group: '기본 도형', d: 'M2 2h20L12 22z' },
  { id: 'right-triangle', label: '직각삼각형', group: '기본 도형', d: 'M2 2v20h20z' },
  { id: 'diamond', label: '마름모', group: '기본 도형', d: 'M12 2l10 10-10 10L2 12z' },
  { id: 'parallelogram', label: '평행사변형', group: '기본 도형', d: 'M7 3h15l-5 18H2z' },
  { id: 'trapezoid', label: '사다리꼴', group: '기본 도형', d: 'M6 4h12l4 16H2z' },
  { id: 'half-circle', label: '반원', group: '기본 도형', d: 'M2 17a10 10 0 0 1 20 0z' },
  { id: 'quarter-circle', label: '사분원', group: '기본 도형', d: 'M2 22V2a20 20 0 0 1 20 20z' },
  { id: 'ring', label: '고리', group: '기본 도형', fillRule: 'evenodd', d: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20zm0 5a5 5 0 1 1 0 10 5 5 0 1 1 0-10z' },
  { id: 'cross', label: '십자', group: '기본 도형', d: 'M9 2h6v7h7v6h-7v7H9v-7H2V9h7z' },

  // 다각형
  { id: 'pentagon', label: '오각형', group: '다각형', d: polygon(5) },
  { id: 'hexagon', label: '육각형', group: '다각형', d: polygon(6) },
  { id: 'heptagon', label: '칠각형', group: '다각형', d: polygon(7) },
  { id: 'octagon', label: '팔각형', group: '다각형', d: polygon(8) },
  { id: 'decagon', label: '십각형', group: '다각형', d: polygon(10) },

  // 별
  { id: 'star-4', label: '별 4', group: '별', d: star(4, 10, 3.5) },
  { id: 'star-5', label: '별 5', group: '별', d: star(5, 10, 4.2) },
  { id: 'star-6', label: '별 6', group: '별', d: star(6, 10, 6) },
  { id: 'star-8', label: '별 8', group: '별', d: star(8, 10, 7.2) },
  { id: 'star-12', label: '별 12', group: '별', d: star(12, 10, 8.3) },

  // 화살표
  { id: 'arrow-right', label: '화살표 →', group: '화살표', d: 'M2 9h12V4l8 8-8 8v-5H2z' },
  { id: 'arrow-left', label: '화살표 ←', group: '화살표', d: 'M22 9H10V4l-8 8 8 8v-5h12z' },
  { id: 'arrow-up', label: '화살표 ↑', group: '화살표', d: 'M9 22V10H4l8-8 8 8h-5v12z' },
  { id: 'arrow-down', label: '화살표 ↓', group: '화살표', d: 'M9 2v12H4l8 8 8-8h-5V2z' },
  { id: 'arrow-double', label: '양방향 ↔', group: '화살표', d: 'M7 4l-6 8 6 8v-5h10v5l6-8-6-8v5H7z' },
  { id: 'arrow-double-v', label: '양방향 ↕', group: '화살표', d: 'M4 7l8-6 8 6h-5v10h5l-8 6-8-6h5V7z' },
  { id: 'chevron', label: '꺾쇠', group: '화살표', d: 'M4 2h8l8 10-8 10H4l8-10z' },
  { id: 'arrow-bent', label: '꺾인 화살표', group: '화살표', d: 'M3 21V9a4 4 0 0 1 4-4h8V2l7 5.5L15 13v-3H8v11z' },

  // 플로차트
  { id: 'flow-process', label: '프로세스', group: '플로차트', d: 'M2 5h20v14H2z' },
  { id: 'flow-decision', label: '판단', group: '플로차트', d: 'M12 2l10 10-10 10L2 12z' },
  { id: 'flow-terminator', label: '시작/끝', group: '플로차트', d: 'M8 5h8a7 7 0 0 1 0 14H8A7 7 0 0 1 8 5z' },
  { id: 'flow-data', label: '데이터', group: '플로차트', d: 'M7 5h15l-5 14H2z' },
  { id: 'flow-document', label: '문서', group: '플로차트', d: 'M2 3h20v15c-3-2-6-2-10 0s-7 2-10 0z' },
  { id: 'flow-database', label: '데이터베이스', group: '플로차트', d: 'M2 5a10 3 0 0 1 20 0v14a10 3 0 0 1-20 0z' },
  { id: 'flow-manual-input', label: '수동 입력', group: '플로차트', d: 'M2 9l20-5v16H2z' },
  { id: 'flow-delay', label: '지연', group: '플로차트', d: 'M2 5h12a7 7 0 0 1 0 14H2z' },
];

export function findShape(id: string): ShapeDef | undefined {
  return SHAPE_LIBRARY.find(s => s.id === id);
}

/** 캔버스에 넣을 객체 — 폭이 size(px)가 되도록. 위치는 호출자가 정한다. */
export function makeLibraryShape(id: string, size: number, color = SHAPE_FILL): fabric.FabricObject | null {
  const def = findShape(id);
  if (!def) return null;
  const obj = def.make
    ? def.make(size, color)
    : new fabric.Path(def.d, { fill: color, stroke: undefined, strokeWidth: 0, fillRule: def.fillRule ?? 'nonzero', scaleX: S(size), scaleY: S(size) });
  obj.set({ originX: 'left', originY: 'top' });
  return obj;
}

/** 드래그 프리뷰용 안쪽 SVG 마크업 */
export function shapeSvgInner(def: ShapeDef): string {
  if (def.stroke) {
    return `<path d="${def.d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${def.dash ? ` stroke-dasharray="${def.dash.join(' ')}"` : ''} />`;
  }
  return `<path d="${def.d}" fill="currentColor"${def.fillRule ? ` fill-rule="${def.fillRule}"` : ''} />`;
}

// ---------- 최근 사용 ----------
const RECENT_KEY = 'drawing-editor-recent-shapes';
const RECENT_MAX = 8;

export function loadRecentShapes(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string' && !!findShape(x)) : [];
  } catch {
    return [];
  }
}

export function pushRecentShape(id: string): string[] {
  const next = [id, ...loadRecentShapes().filter(x => x !== id)].slice(0, RECENT_MAX);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* 저장 못 해도 동작에는 지장 없음 */ }
  return next;
}

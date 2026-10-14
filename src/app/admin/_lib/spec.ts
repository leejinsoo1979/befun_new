import { REFERENCE_COLORS, REFERENCE_CLASSIC_COLORS } from '@/lib/three/reference-colors';

const STYLE: Record<string, string> = { grid: 'Grid', slant: 'Slant', pixel: 'Pixel', gradient: 'Gradient', pattern: 'Pattern', mosaic: 'Mosaic' };
const CATEGORY: Record<string, string> = { classic: '클래식', natural: '내추럴', solid: '솔리드', edgeMix: '믹스' };

export interface DesignSpec {
  style: string; width: number; height: number; depth: number; rows: number[];
  color: string; colorName: string; colorHex: string; category: string;
  doors: number[]; drawers: number[]; backPanel: boolean; legs: boolean; summary: string;
}

/** 저장된 디자인 config(JSON)를 사람이 읽는 사양으로. 형식이 다르면 null */
export function designSpec(config: unknown): DesignSpec | null {
  if (!config || typeof config !== 'object') return null;
  const c = config as Record<string, unknown>;
  const all = Array.isArray(c.rowHeights) ? (c.rowHeights as number[]) : [];
  const rows = all.slice(0, Number(c.numRows) || all.length);
  const width = Number(c.width), depth = Number(c.depth);
  if (!Number.isFinite(width) || !Number.isFinite(depth) || !rows.length) return null;
  const legs = c.baseType === 'legs';
  const height = Math.round(2 + rows.reduce((t, r) => t + r + 2, 0) + (legs ? 11 : 1));
  const color = String(c.color ?? '');
  const colorHex = REFERENCE_COLORS[color]?.base ?? REFERENCE_CLASSIC_COLORS[color] ?? '#c9c4bb';
  const doors = Array.isArray(c.doorsCreatedLayers) ? (c.doorsCreatedLayers as number[]) : [];
  const drawers = Array.isArray(c.drawersCreatedLayers) ? (c.drawersCreatedLayers as number[]) : [];
  const style = STYLE[String(c.style)] ?? String(c.style ?? '-');
  const colorName = color.replace(/^[SCNE]_/, '') || '-';
  const spec: DesignSpec = {
    style, width: Math.round(width), height, depth, rows, color, colorName, colorHex,
    category: CATEGORY[String(c.colorCategory)] ?? '', doors, drawers, backPanel: c.hasBackPanel === true, legs, summary: '',
  };
  spec.summary = `${style} · ${spec.width}×${height}×${depth}cm · ${colorName}`;
  return spec;
}

/**
 * 디자인 공유 URL 인코딩/디코딩
 * v1 designSharer.js 이식 — URL 파라미터 기반에서 shareCode 기반으로 변경
 */

import { nanoid } from 'nanoid';
import { parseSavedDesign, type SavedDesign } from '@/components/storefront/savedDesign';

export interface DesignConfig {
  baseType?: 'standard' | 'legs';
  legFinish?: 'silver' | 'black' | 'panel';
  style: string;
  density: number;
  width: number;
  height: number;
  depth: number;
  hasBackPanel: boolean;
  color: string;
  colorCategory: string;
  rowHeights: number[];
  numRows: number;
  doorsCreatedLayers: number[];
  drawersCreatedLayers: number[];
  hardwareRowStyles?: Record<number,number>;
}

/**
 * 고유 공유 코드 생성 (8자)
 */
export function generateShareCode(): string {
  return nanoid(8);
}

/**
 * 현재 설정을 DesignConfig로 직렬화
 */
export function serializeDesignConfig(config: DesignConfig): string {
  return JSON.stringify(deserializeDesignConfig(JSON.stringify(config)));
}

/**
 * JSON 문자열에서 DesignConfig 역직렬화
 */
export function deserializeDesignConfig(json: string): SavedDesign['config'] {
  const design = parseSavedDesign(JSON.stringify({ version: 1, name: '', config: JSON.parse(json) }));
  if (!design) throw new Error('유효하지 않은 디자인 구성입니다.');
  return design.config;
}

/**
 * v1 호환: URL query string 기반 인코딩 (레거시 공유 링크 지원)
 */
export function encodeDesignToURL(config: DesignConfig, baseUrl: string): string {
  const saved = deserializeDesignConfig(JSON.stringify(config));
  const url = new URL(baseUrl);
  url.searchParams.set('state', JSON.stringify({
    baseType: saved.baseType,
    legFinish: saved.legFinish,
    variantURL: saved.style,
    densityURL: saved.density,
    widthURL: saved.width,
    heightURL: saved.height,
    rowsURL: saved.numRows,
    depthURL: saved.depth,
    backPanelURL: saved.hasBackPanel,
    colorURL: saved.color,
    colorCategoryURL: saved.colorCategory,
    rowHeightsURL: saved.rowHeights,
    doorsURL: saved.doorsCreatedLayers,
    drawersURL: saved.drawersCreatedLayers,
    hardwareRowStyles: saved.hardwareRowStyles,
  }));
  return url.href;
}

/**
 * v1 호환: URL query string에서 디코딩
 */
export function decodeDesignFromURL(url: string): SavedDesign['config'] | null {
  try {
    const params = new URL(url).searchParams;
    const state = params.get('state');
    if (!state) return null;

    // URLSearchParams already decodes state; older double-encoded links are also accepted.
    let data;
    try { data = JSON.parse(state); } catch { data = JSON.parse(decodeURIComponent(state)); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const color = data.colorURL;
    const colorCategory = data.colorCategoryURL ?? (typeof color === 'string' ? (
      color.startsWith('C_') ? 'classic' : color.startsWith('N_') ? 'natural' : color.startsWith('S_') ? 'solid' : color.includes('+') ? 'edgeMix' : 'solid'
    ) : undefined);
    const design = parseSavedDesign(JSON.stringify({ version: 1, name: '', config: {
      baseType: data.baseType,
      legFinish: data.legFinish,
      style: data.variantURL,
      density: data.densityURL,
      width: data.widthURL,
      height: data.heightURL,
      depth: data.depthURL,
      hasBackPanel: data.backPanelURL,
      color,
      colorCategory,
      rowHeights: data.rowHeightsURL,
      numRows: data.rowsURL,
      doorsCreatedLayers: data.doorsURL ?? [],
      drawersCreatedLayers: data.drawersURL ?? [],
      hardwareRowStyles: data.hardwareRowStyles,
    } }));
    return design?.config ?? null;
  } catch {
    return null;
  }
}

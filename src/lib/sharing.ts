/**
 * 디자인 공유 URL 인코딩/디코딩
 * v1 designSharer.js 이식 — URL 파라미터 기반에서 shareCode 기반으로 변경
 */

import { nanoid } from 'nanoid';

export interface DesignConfig {
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
  return JSON.stringify(config);
}

/**
 * JSON 문자열에서 DesignConfig 역직렬화
 */
export function deserializeDesignConfig(json: string): DesignConfig {
  return JSON.parse(json) as DesignConfig;
}

/**
 * v1 호환: URL query string 기반 인코딩 (레거시 공유 링크 지원)
 */
export function encodeDesignToURL(config: DesignConfig, baseUrl: string): string {
  const encoded = encodeURIComponent(JSON.stringify({
    variantURL: config.style,
    densityURL: config.density,
    widthURL: config.width,
    rowsURL: config.numRows,
    depthURL: config.depth,
    backPanelURL: config.hasBackPanel,
    colorURL: config.color,
    rowHeightsURL: config.rowHeights,
    doorsURL: config.doorsCreatedLayers,
    drawersURL: config.drawersCreatedLayers,
  }));
  return `${baseUrl}?state=${encoded}`;
}

/**
 * v1 호환: URL query string에서 디코딩
 */
export function decodeDesignFromURL(url: string): DesignConfig | null {
  try {
    const params = new URL(url).searchParams;
    const state = params.get('state');
    if (!state) return null;

    const data = JSON.parse(decodeURIComponent(state));
    return {
      style: data.variantURL,
      density: data.densityURL,
      width: data.widthURL,
      height: 0, // v1에는 height가 없고 rows로 계산
      depth: data.depthURL,
      hasBackPanel: data.backPanelURL,
      color: data.colorURL,
      colorCategory: '', // v1에서는 color로부터 추론
      rowHeights: data.rowHeightsURL,
      numRows: data.rowsURL,
      doorsCreatedLayers: data.doorsURL ?? [],
      drawersCreatedLayers: data.drawersURL ?? [],
    };
  } catch {
    return null;
  }
}

import type { PanelData } from '@/types/shelf';

/** Wardrobes use their own physical fronts; shelf ReferenceFront offsets do not apply. */
export type WardrobeModel = 'edge' | 'tone';
export type WardrobeFacade = 'open' | 'middle-open' | 'bottom-open' | 'closed';
export interface WardrobeSectionInput {
  id: string;
  seriesId: string | number;
  facade?: WardrobeFacade;
  doorDirection?: 'left' | 'right';
  localHeightMm?: number | null;
  localDepthMm?: number | null;
  widthMm?: number | null;
}
export interface WardrobeInput {
  model: WardrobeModel;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  sections: WardrobeSectionInput[];
  topEdge?: boolean;
  toneWidthPattern?: string;
  drawerStyle?: 'internal' | 'external';
  lighting?: boolean;
}
export interface WardrobeBoundsMm {
  x1: number; x2: number;
  y1: number; y2: number;
  z1: number; z2: number;
}
export interface WardrobeFront extends PanelData {
  id: string;
  sectionId: string;
  type: 'door' | 'drawer';
  hingeSide: 'left' | 'right' | null;
  external: boolean;
  pivotX: number;
  openAngle: number;
  /** Renderer asset name and anchor; actual asset geometry is independently supplied. */
  handle: { asset: string; x: number; y: number; z: number; height: number | null } | null;
}
export interface WardrobeBar {
  id: string;
  sectionId: string;
  /** All display coordinates and dimensions in cm. */
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  axis: 'x' | 'z';
  /** Cross section cannot be inferred from the enclosing box. */
  radius: number | null;
}
export interface WardrobeOpening {
  sectionId: string;
  x: number; y: number; z: number;
  width: number; height: number; depth: number;
}
export interface WardrobeDrawer {
  id: string; sectionId: string; front: WardrobeFront; parts: PanelData[]; travelCm: number;
}
export interface WardrobeResult {
  drawers?: WardrobeDrawer[];
  sourceGeometryMm?: import('./source-types').WardrobeSourceGeometry;
  panels: PanelData[];
  fronts: WardrobeFront[];
  bars: WardrobeBar[];
  openings: WardrobeOpening[];
  sections: { id: string; x: number; width: number; height: number; depth: number }[];
  unsupported: string[];
}

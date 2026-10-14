import type { WardrobeBoundsMm, WardrobeModel } from './types';

/** Source geometry is already measured in millimetres, before renderer clearances. */
export interface WardrobeSourcePart extends WardrobeBoundsMm {
  subtype?: string;
  direction?: number;
  handle?: number;
  handle_type?: string;
  extremes?: string[];
  radius?: number;
  sectionId?: string;
  m_config_id?: number | string;
}
export interface WardrobeSourceGeometry {
  width: number;
  height: number;
  depth: number;
  model: WardrobeModel;
  slabs: WardrobeSourcePart[];
  walls: WardrobeSourcePart[];
  backs: WardrobeSourcePart[];
  doors: WardrobeSourcePart[];
  drawers: WardrobeSourcePart[];
  hinges?: import('../wardrobe-hinges').WardrobeHingeEnvelope[];
  cable_management?: WardrobeSourcePart[];
  cable_options?: { sectionId: string; heightsMm: number[] }[];
  drawer_fronts?: WardrobeSourcePart[];
  bars: WardrobeSourcePart[];
  components: WardrobeSourcePart[];
  frame?: WardrobeSourcePart[];
  masking_bars?: WardrobeSourcePart[];
  lighting?: WardrobeSourcePart[];
}

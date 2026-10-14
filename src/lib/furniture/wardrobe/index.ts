import { edgeWardrobeLayoutOptions, generateEdgeWardrobe, getEdgeColumnCounts, normalizeEdgeWardrobe } from './edge';
import { generateToneWardrobe, normalizeToneWardrobe, toneWardrobeLayoutOptions } from './tone';
import type { WardrobeInput, WardrobeModel, WardrobeResult } from './types';
export { createWardrobeInput, validateWardrobeInput } from './initial';
export { EDGE_STANDARD_HEIGHTS_MM, EDGE_DEPTHS_MM, getEdgeColumnCounts } from './edge';
export type * from './types';
export function normalizeWardrobeInput(input: WardrobeInput): WardrobeInput {
  return input.model === 'edge' ? normalizeEdgeWardrobe(input) : normalizeToneWardrobe(input);
}
export function generateWardrobe(input: WardrobeInput): WardrobeResult {
  return input.model === 'edge' ? generateEdgeWardrobe(input) : generateToneWardrobe(input);
}
export function getWardrobeLayoutOptions(model: WardrobeModel, input?: WardrobeInput, sectionId?: string) {
  return model === 'edge' ? edgeWardrobeLayoutOptions(input, sectionId) : toneWardrobeLayoutOptions(input, sectionId);
}
export function getWardrobeDimensionOptions(model: WardrobeModel, widthMm = 1180) {
  return model === 'edge' ? {
    width: { min: 400, max: 6000, step: 10 },
    height: { values: [1380, 1680, 1980, 2280], min: 2290, max: 3000, step: 10 },
    depth: { values: [270, 360, 450, 600] }, columnCounts: getEdgeColumnCounts(widthMm),
  } : {
    width: { min: 400, max: 6000, step: 10 },
    height: { values: [2000, 2370], min: 2380, max: 3600, step: 10 },
    depth: { min: 400, max: 800, step: 10 }, columnCounts: null,
  };
}

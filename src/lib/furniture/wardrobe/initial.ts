import edgeCatalog from './edge-catalog.json';
import toneCatalog from './tone-rules.json';
import type { WardrobeInput, WardrobeModel } from './types';

/** Initial states recorded in category-wardrobe-edge-001 / tone-001.
 * These preserve the recorded state; they do not infer extra layout options.
 */
export function createWardrobeInput(model: WardrobeModel): WardrobeInput {
  if (model === 'edge') return {
    model, widthMm: 1180, heightMm: 1980, depthMm: 600, topEdge: true,
    sections: [
      { id: '1', seriesId: 'Half_Rail_Rail_L_1drawers', doorDirection: 'left' },
      { id: '2', seriesId: 'Full_Rail_Rail_XL' },
    ],
  };
  return {
    model, widthMm: 1000, heightMm: 2000, depthMm: 530,
    drawerStyle: 'internal', lighting: false,
    sections: [{ id: '1', seriesId: 3739 }],
  };
}

/** Validate persisted input before normalization. Unknown model/layout data must
 * never silently turn into a different saved design. UI changes normalize later.
 */
export function validateWardrobeInput(input: WardrobeInput): string[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return ['input'];
  const errors: string[] = [];
  const inRange = (value: number, low: number, high: number) => Number.isFinite(value) && value >= low && value <= high;
  const step10 = (value: number) => Number.isFinite(value) && value % 10 === 0;
  if (!['edge', 'tone'].includes(input.model)) return ['model'];
  if (!inRange(input.widthMm, 400, 6000) || !step10(input.widthMm)) errors.push('widthMm');
  const validHeight = (height: number) => step10(height) && (input.model === 'edge'
    ? [1380, 1680, 1980, 2280].includes(height) || inRange(height, 2290, 3000)
    : [2000, 2370].includes(height) || inRange(height, 2380, 3600));
  const validDepth = (depth: number) => input.model === 'edge' ? [270, 360, 450, 600].includes(depth) : inRange(depth, 400, 800) && step10(depth);
  if (!validHeight(input.heightMm)) errors.push('heightMm');
  if (!validDepth(input.depthMm)) errors.push('depthMm');
  for (const name of ['topEdge', 'lighting', 'edgeVeneer'] as const) if (input[name] !== undefined && typeof input[name] !== 'boolean') errors.push(name);
  if (input.drawerStyle !== undefined && !['internal', 'external'].includes(input.drawerStyle)) errors.push('drawerStyle');
  if (input.toneWidthPattern !== undefined && (input.model !== 'tone' || typeof input.toneWidthPattern !== 'string' || !/^[12]{1,12}$/.test(input.toneWidthPattern))) errors.push('toneWidthPattern');
  if (!Array.isArray(input.sections) || input.sections.length === 0 || input.sections.length > 32) return [...errors, 'sections'];
  const ids = new Set<string>();
  const layouts: Record<string, unknown> = input.model === 'edge' ? edgeCatalog.layouts : toneCatalog.layouts;
  for (const section of input.sections) {
    if (!section || typeof section !== 'object' || Array.isArray(section)) { errors.push('section'); continue; }
    if (typeof section.id !== 'string' || !section.id.trim() || section.id.length > 128 || ids.has(section.id)) errors.push('sectionId');
    ids.add(section.id);
    if (!['string', 'number'].includes(typeof section.seriesId) || !Object.hasOwn(layouts, String(section.seriesId))) errors.push(`section:${section.id}:seriesId`);
    if (section.facade !== undefined && !['open', 'middle-open', 'bottom-open', 'closed'].includes(section.facade)) errors.push(`section:${section.id}:facade`);
    if (section.doorDirection !== undefined && !['left', 'right'].includes(section.doorDirection)) errors.push(`section:${section.id}:doorDirection`);
    if (section.localHeightMm != null && (input.model !== 'edge' || !validHeight(section.localHeightMm))) errors.push(`section:${section.id}:height`);
    if (section.localDepthMm != null && (input.model !== 'edge' || !validDepth(section.localDepthMm))) errors.push(`section:${section.id}:depth`);
    if (section.cableHeightsMm !== undefined && (input.model !== 'edge' || !Array.isArray(section.cableHeightsMm) || section.cableHeightsMm.length > 32 || section.cableHeightsMm.some(value => !Number.isInteger(value) || value < 0 || value > 3600))) errors.push(`section:${section.id}:cables`);
    if (section.widthMm != null && !inRange(section.widthMm, 1, 6000)) errors.push(`section:${section.id}:width`);
  }
  return errors;
}

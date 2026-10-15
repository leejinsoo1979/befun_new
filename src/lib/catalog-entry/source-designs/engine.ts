import { calculateLegacy } from '../legacy-designs/engine';
import Furniture from '@/lib/bookcase/upstream/3UiAd3-B2.js';
import Bedside from '@/lib/bookcase/upstream/g9uRfoWh2.js';
import Wardrobe from './upstream/wardrobe.js';
import Sofa, { resetSourceDNA } from './upstream/sofa.js';
import { renderSource } from './upstream/renderer.js';
import type { Geometry, Thumbnail } from '@/lib/bookcase/types';
import type { SourceConfiguration, SourceDefinition, SourceSnapshot, SourceState } from './types';

const baselines = new WeakMap<SourceDefinition, string>();
function externalPreset(source: SourceDefinition, preset: Record<string, unknown>) {
  if (source.shelfType === 8) return { ...preset, width: Number(preset.width) + 60 };
  return preset;
}
function createEngine(source: SourceDefinition) {
  const type = source.shelfType;
  const isSofa = type === 10 || type === 12;
  if (isSofa) resetSourceDNA(source.dna);
  const Engine = isSofa ? Sofa : type === 3 ? Wardrobe : type >= 6 && type <= 8 ? Bedside : Furniture;
  return new Engine().withDNA(source.dna);
}

export function sourceInitialState(source: SourceDefinition): SourceState {
  const preset = structuredClone(source.preset);
  if (source.shelfType === 0 || source.shelfType === 1) return { version: 1, key: source.key, preset };
  // TYPE25's API preset stores the inner span. Its engine accepts the outside
  // width, including both 30 mm end pieces; verified against all eight sources.
  if (source.shelfType === 8) preset.width = source.width;
  if (source.detached) return { version: 1, key: source.key, preset };
  const engine = createEngine(source);
  engine.loadPreset(preset);
  const canonical = externalPreset(source, engine.getPreset());
  baselines.set(source, JSON.stringify(canonical));
  return { version: 1, key: source.key, preset: canonical };
}

function detachedSnapshot(source: SourceDefinition, state: SourceState, patch?: Record<string, unknown>): SourceSnapshot {
  const preset = structuredClone(state.preset);
  if (patch) {
    if (Object.keys(patch).some(key => !['material', 'replaceableCovers'].includes(key))) throw new Error('이 단품의 크기는 고정되어 있습니다.');
    if (patch.material !== undefined) preset.material = patch.material;
    if (patch.replaceableCovers !== undefined) preset.replaceable_covers = patch.replaceableCovers;
  }
  const material = preset.material as { material: number; material_backrest: number; material_cushion: number };
  if (!material || !Number.isInteger(material.material) || material.material < 0 || material.material > (source.shelfType === 12 ? 14 : 27)) throw new Error('잘못된 원단입니다.');
  const originalMaterial = source.preset.material as typeof material;
  const materialChanged = (['material', 'material_backrest', 'material_cushion'] as const).some(key => material[key] !== originalMaterial[key]);
  const geometry = structuredClone(source.geometry) as unknown as Geometry & Record<string, unknown>;
  if (!Array.isArray(geometry.components)) geometry.components = [];
  for (const [key, values] of Object.entries(geometry)) {
    if (!Array.isArray(values) || key === 'materials') continue;
    for (const part of values) if (part && typeof part === 'object' && 'material' in part) {
      if (materialChanged) Object.assign(part, material);
      if ('replaceable_covers' in part) part.replaceable_covers = preset.replaceable_covers;
    }
  }
  geometry.configurator_params = preset;
  return { preset, geometry, schema: renderSource(geometry, source.shelfType), thumbnails: [], configuration: {
    values: { material, replaceableCovers: preset.replaceable_covers, channels: {} },
    parameters: { material: { label: '재질·색상', type: 'custom', visible: true, enabled: true } },
  } };
}

/** A synchronous transaction resets source singletons before every calculation.
 * Only this product's DNA and preset are used; no family default is substituted. */
export function calculateSource(source: SourceDefinition, state: SourceState, patch?: Record<string, unknown>, selected = 0): SourceSnapshot {
  if (state.version !== 1 || state.key !== source.key) throw new Error('다른 상품의 디자인입니다.');
  if (source.shelfType === 0 || source.shelfType === 1) return calculateLegacy(source, state, patch, selected);
  if (source.detached) return detachedSnapshot(source, state, patch);
  if (!baselines.has(source)) sourceInitialState(source);
  const type = source.shelfType;
  const isSofa = type === 10 || type === 12;
  const engine = createEngine(source);
  engine.loadPreset(structuredClone(state.preset));
  if (patch) engine.changeConfiguration(structuredClone(patch));
  // Some older veneer presets have 9 mm offsets that the current source engine
  // normalizes. Preserve the captured photo's exact initial physical geometry;
  // edited designs use the current source generator.
  const currentPreset = externalPreset(source, engine.getPreset());
  const unchanged = JSON.stringify(currentPreset) === baselines.get(source);
  const geometry = { lighting: [], masking_bars: [], ...(unchanged && source.geometry ? structuredClone(source.geometry) : engine.getGeometry()) } as Geometry;
  const configuration = engine.getConfiguration() as unknown as SourceConfiguration;
  const schema = renderSource(geometry, type);
  let thumbnails: Thumbnail[] = [];
  if (!isSofa && geometry.components.length) {
    const index = Math.max(0, Math.min(selected, geometry.components.length - 1));
    const thumbnailEngine = engine as unknown as { getThumbnailsByIndex?: (index: number) => Thumbnail[]; getThumbnails?: (id: number) => Thumbnail[] };
    if (thumbnailEngine.getThumbnailsByIndex) thumbnails = thumbnailEngine.getThumbnailsByIndex(index) ?? [];
    else if (thumbnailEngine.getThumbnails) thumbnails = thumbnailEngine.getThumbnails((geometry.components[index] as unknown as { m_config_id: number }).m_config_id) ?? [];
  }
  if (![geometry.width, geometry.height, geometry.depth].every(value => Number.isFinite(value) && value > 0 && value <= 10000)) throw new Error('잘못된 가구 크기입니다.');
  return structuredClone({ preset: currentPreset, geometry, schema, configuration, thumbnails });
}

export function readSourceState(raw: string, source: SourceDefinition): SourceState {
  if (raw.length > 200000) throw new Error('디자인 링크가 너무 깁니다.');
  const value = JSON.parse(raw) as SourceState;
  if (value?.version !== 1 || value.key !== source.key || !value.preset || typeof value.preset !== 'object' || Array.isArray(value.preset)) throw new Error('지원하지 않는 디자인입니다.');
  const snapshot = calculateSource(source, value);
  return { version: 1, key: source.key, preset: snapshot.preset };
}

import Legacy from './upstream/engine.js';
import { renderLegacy } from './upstream/renderer.js';
import { PricingCore } from './upstream/pricing.js';
import rates from '@/lib/commerce/data/tylko-coefficients-20261014.json';
import type { SourceDefinition, SourceSnapshot, SourceState } from '../source-designs/types';
import type { Geometry, SourcePanel, Thumbnail } from '@/lib/bookcase/types';

type LegacyGeometry = Geometry & { horizontals: SourcePanel[]; verticals: SourcePanel[]; shelf_category?: string };
const pricing = new PricingCore(rates, { priceeee: 1, priceeel: '€', regionName: 'de' });
export function legacyEuro(geometry: Geometry, category: string): number {
  const euro = pricing.calculateJettyPrice({ ...geometry, shelf_category: category }, true);
  if (!Number.isFinite(euro) || euro <= 0) throw new Error('가격을 계산할 수 없습니다.');
  return euro;
}
export function calculateLegacy(source: SourceDefinition, state: SourceState, patch?: Record<string, unknown>, selected = 0): SourceSnapshot {
  if (state.version !== 1 || state.key !== source.key) throw new Error('다른 상품의 디자인입니다.');
  const engine = new Legacy().withDNA(source.dna);
  engine.loadPreset(structuredClone(state.preset));
  if (patch) engine.changeConfiguration(structuredClone(patch));
  const geometry = engine.getGeometry() as LegacyGeometry;
  if (![geometry.width, geometry.height, geometry.depth].every(n => Number.isFinite(n) && n > 0 && n <= 10000)) throw new Error('잘못된 가구 크기입니다.');
  // Aliases are only for the shared view's joint and thumbnail overlays.
  geometry.walls = geometry.verticals;
  geometry.slabs = geometry.horizontals;
  const schema = renderLegacy(geometry, source.shelfType);
  schema.find(group => group.key === 'hovers')?.children.forEach((segment, index) => { segment.segmentTag.channelId = String(index + 1); });
  const component = geometry.components[Math.max(0, Math.min(selected, geometry.components.length - 1))] as unknown as { m_config_id?: number };
  const thumbnails = source.category === 'dressing_table' && component?.m_config_id !== undefined ? engine.getThumbnails(component.m_config_id) ?? [] : [];
  for (const thumbnail of thumbnails) {
    const format = thumbnail.format as Thumbnail['format'] & { verticals: SourcePanel[]; horizontals: SourcePanel[] };
    format.walls = format.verticals ?? []; format.slabs = format.horizontals ?? [];
  }
  return structuredClone({ geometry, schema, thumbnails, preset: engine.getPreset(), configuration: engine.getConfiguration() });
}

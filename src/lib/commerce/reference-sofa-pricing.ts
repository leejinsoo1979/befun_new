import coefficients from './data/tylko-coefficients-20261014.json';
import { EUR_QUOTE_VERSION } from './eur-quote';

export interface SofaPricePart { id: string; material: number }
export type SofaQuote = { status: 'available'; regularEur: number; version: string }
  | { status: 'unavailable'; reason: string };

/** DE Smooth/Uff pricing captured 2026-10-14. Never treat a missing component as free. */
export function quoteSofa(parts: readonly SofaPricePart[], replaceableCovers = false): SofaQuote {
  if (!parts.length || parts.length > 30) return { status: 'unavailable', reason: 'invalid-components' };
  const rates: Record<string, number> = coefficients;
  let subtotal = 0;
  const family = parts[0]?.id.startsWith('S02_') ? 's02' : 's01';
  for (const { id, material } of parts) {
    if (!Number.isInteger(material) || material < 0 || material > (family === 's02' ? 14 : 27) || !id.startsWith(family.toUpperCase() + '_'))
      return { status: 'unavailable', reason: 'unsupported-component' };
    const suffix = family === 's02' ? (material <= 8 ? 'GLORY' : 'COLORMAX') : material <= 6 ? 'REWOOL' : material <= 14 ? 'CORDUROY'
      : material <= 18 ? 'LEATHER' : material <= 23 ? 'PLAIN' : 'BOUCLE';
    const key = `${id}_${suffix}${family === 's02' && replaceableCovers ? '_EXCHANGEABLE_COVERS' : ''}`;
    if (!Object.hasOwn(rates, key) || !Number.isFinite(rates[key]))
      return { status: 'unavailable', reason: `missing-coefficient:${key}` };
    subtotal += rates[key];
  }
  const increased = subtotal * (1 + rates[`${family}_additional_increase`]);
  const regularEur = Math.trunc(increased * (1 + rates[`${family}_regional_increase_factor`]));
  return Number.isSafeInteger(regularEur) && regularEur > 0
    ? { status: 'available', regularEur, version: EUR_QUOTE_VERSION }
    : { status: 'unavailable', reason: 'invalid-result' };
}

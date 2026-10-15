import fx from './fx-snapshot.json';
import { MARKETS, type Market } from './markets';

/** Canonical EUR amount. Convert once, then round to the destination minor unit. */
export function eurToMarket(eur: number, market: Market): number {
  if (!Number.isFinite(eur) || eur < 0) throw new Error('Invalid EUR quote');
  const { currency, fractionDigits } = MARKETS[market];
  const factor = 10 ** fractionDigits;
  return Math.round((eur * fx.rates[currency] + Number.EPSILON) * factor) / factor;
}
export const EUR_QUOTE_VERSION = 'tylko-de-2026-10-14';
export const EUR_FX_DATE = fx.date;

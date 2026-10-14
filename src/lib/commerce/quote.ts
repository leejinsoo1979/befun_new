import { MARKETS, type Market } from './markets';
import fx from './fx-snapshot.json';

export const FX_SNAPSHOT = fx;
export function convertedUnitPrice(baseKrw: number, market: Market): number {
  if (!Number.isFinite(baseKrw) || baseKrw < 0) throw new RangeError('Invalid KRW amount');
  const config = MARKETS[market];
  const scale = 10 ** config.fractionDigits;
  return Math.round(baseKrw / fx.rates.KRW * fx.rates[config.currency] * scale) / scale;
}
/** Round unit prices before quantity multiplication so totals equal displayed line items. */
export function convertedCartTotal(items: readonly {price:number;quantity:number}[], market: Market) {
  const scale = 10 ** MARKETS[market].fractionDigits;
  return items.reduce((sum,item)=> {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) throw new RangeError('Invalid quantity');
    return sum + Math.round(convertedUnitPrice(item.price,market)*scale)*item.quantity;
  },0)/scale;
}
export function marketCheckoutAvailable(market: string, currency: string) {
  return market === 'KR' && currency === 'KRW';
}

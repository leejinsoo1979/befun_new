export const MARKETS = {
  KR: { language:'ko',locale:'ko-KR',currency:'KRW',name:'대한민국',fractionDigits:0 },
  US: { language:'en',locale:'en-US',currency:'USD',name:'United States',fractionDigits:2 },
  JP: { language:'ja',locale:'ja-JP',currency:'JPY',name:'日本',fractionDigits:0 },
  EU: { language:'en',locale:'en-IE',currency:'EUR',name:'Europe',fractionDigits:2 },
} as const;
export type Market = keyof typeof MARKETS;
export type Language = typeof MARKETS[Market]['language'];
export const EUROPEAN_COUNTRIES = { DE:'Germany',FR:'France',NL:'Netherlands',ES:'Spain',IT:'Italy',IE:'Ireland',AT:'Austria',BE:'Belgium',FI:'Finland',PT:'Portugal' } as const;
export type EuropeanCountry = keyof typeof EUROPEAN_COUNTRIES;
export function isMarket(value: unknown): value is Market { return typeof value === 'string' && Object.hasOwn(MARKETS,value); }
export function isEuropeanCountry(value: unknown): value is EuropeanCountry { return typeof value === 'string' && Object.hasOwn(EUROPEAN_COUNTRIES,value); }
export function formatMoney(amount: number, market: Market) {
  const {locale,currency,fractionDigits} = MARKETS[market];
  return new Intl.NumberFormat(locale,{style:'currency',currency,minimumFractionDigits:fractionDigits,maximumFractionDigits:fractionDigits}).format(amount);
}

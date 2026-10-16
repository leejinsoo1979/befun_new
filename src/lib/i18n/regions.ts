/** 국가(지역) → 화면 언어. 통화·가격 표시는 리더 R5(lib/commerce) 소유. */
export type RegionId = 'kr' | 'us' | 'jp' | 'eu';
export type Locale = 'ko' | 'en' | 'ja';

export interface Region { id: RegionId; locale: Locale; htmlLang: string; country: string; language: string; flag: string }

export const REGIONS: readonly Region[] = [
  { id: 'kr', locale: 'ko', htmlLang: 'ko', country: '대한민국', language: '한국어', flag: '🇰🇷' },
  { id: 'us', locale: 'en', htmlLang: 'en-US', country: 'United States', language: 'English', flag: '🇺🇸' },
  { id: 'jp', locale: 'ja', htmlLang: 'ja', country: '日本', language: '日本語', flag: '🇯🇵' },
  { id: 'eu', locale: 'en', htmlLang: 'en', country: 'Europe', language: 'English', flag: '🇪🇺' },
];

export const REGION_COOKIE = 'befun_region';
export const DEFAULT_REGION: RegionId = 'kr';

export const isRegionId = (id: unknown): id is RegionId =>
  typeof id === 'string' && REGIONS.some(region => region.id === id);

export const regionById = (id: string | undefined | null): Region =>
  REGIONS.find(region => region.id === id) ?? REGIONS.find(region => region.id === DEFAULT_REGION)!;

/** 쿠키가 없을 때 Accept-Language로 첫 국가를 정한다 */
export function regionFromAcceptLanguage(header: string | null | undefined): RegionId {
  const first = (header ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  if (first.startsWith('ko')) return 'kr';
  if (first.startsWith('ja')) return 'jp';
  if (first === 'en-us' || first === 'en') return 'us';
  if (/^(en|de|fr|es|it|nl|pl|pt|sv|da|fi|cs|el|hu|ro|sk|sl|bg|hr|et|lv|lt|ga|mt)/.test(first)) return 'eu';
  return DEFAULT_REGION;
}

import { cookies, headers } from 'next/headers';
import { REGION_COOKIE, regionById, regionFromAcceptLanguage, type Region } from './regions';

/** 서버에서 현재 국가: 쿠키 → 없으면 브라우저 Accept-Language */
export async function currentRegion(): Promise<Region> {
  const saved = (await cookies()).get(REGION_COOKIE)?.value;
  if (saved) return regionById(saved);
  return regionById(regionFromAcceptLanguage((await headers()).get('accept-language')));
}

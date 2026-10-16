import { DEFAULT_REGION, REGION_COOKIE, isRegionId, regionById, type RegionId } from './regions';

// localStorage is scoped to the origin; cookies are shared across localhost ports.
export const REGION_STORAGE_KEY = 'befun_region_preference';
const REGION_EVENT = 'befun-region-change';
let sessionRegion: RegionId | undefined;

export function resolveRegionPreference(saved: unknown, cookie: unknown): RegionId {
  if (isRegionId(saved)) return saved;
  return isRegionId(cookie) ? cookie : DEFAULT_REGION;
}

export function regionCookieValue(cookieHeader: string): string | undefined {
  return cookieHeader.split(';').map(part => part.trim())
    .find(part => part.startsWith(`${REGION_COOKIE}=`))?.slice(REGION_COOKIE.length + 1);
}

export function readRegionPreference(): RegionId {
  if (typeof window === 'undefined') return DEFAULT_REGION;
  let saved: string | null = null;
  try { saved = window.localStorage.getItem(REGION_STORAGE_KEY); } catch { /* Cookie/session fallback. */ }
  if (sessionRegion) return sessionRegion;
  let cookie: string | undefined;
  try { cookie = regionCookieValue(document.cookie); } catch { /* Storage/session fallback. */ }
  return resolveRegionPreference(saved, cookie);
}

/** Save both the browser preference and the SSR cookie, without changing market data. */
export function persistRegionPreference(id: RegionId): void {
  if (!isRegionId(id)) return;
  sessionRegion = id;
  try { window.localStorage.setItem(REGION_STORAGE_KEY, id); } catch { /* Cookie/session fallback. */ }
  try {
    document.cookie = `${REGION_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  } catch { /* The selection still works for this document. */ }
  document.documentElement.lang = regionById(id).htmlLang;
}

export function selectRegion(id: RegionId): void {
  if (!isRegionId(id)) return;
  persistRegionPreference(id);
  window.dispatchEvent(new Event(REGION_EVENT));
}

export function subscribeRegionPreference(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === REGION_STORAGE_KEY || event.key === null) {
      sessionRegion = isRegionId(event.newValue) ? event.newValue : undefined;
      onChange();
    }
  };
  window.addEventListener(REGION_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(REGION_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

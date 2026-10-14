'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { REGION_COOKIE, regionById, type Region, type RegionId } from './regions';
import { translate } from './messages';

interface I18nValue {
  region: Region;
  /** 한국어 원문 → 현재 언어(보조 사전). 리더 ui-dictionary와의 결합은 lib/commerce/useLocale */
  t: (source: string) => string;
  setRegion: (id: RegionId) => void;
}

const I18nContext = createContext<I18nValue>({ region: regionById('kr'), t: source => source, setRegion: () => {} });

export function I18nProvider({ initialRegion, children }: { initialRegion: RegionId; children: ReactNode }) {
  const router = useRouter();
  const [regionId, setRegionId] = useState<RegionId>(initialRegion);
  const region = regionById(regionId);
  const setRegion = useCallback((id: RegionId) => {
    document.cookie = `${REGION_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.documentElement.lang = regionById(id).htmlLang;
    setRegionId(id);
    router.refresh();
  }, [router]);
  const t = useCallback((source: string) => translate(region.locale, source), [region.locale]);
  const value = useMemo(() => ({ region, t, setRegion }), [region, t, setRegion]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

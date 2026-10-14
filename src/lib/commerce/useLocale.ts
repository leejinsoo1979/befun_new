'use client';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { RegionId } from '@/lib/i18n/regions';
import { useMarketStore } from '@/stores/useMarketStore';
import { MARKETS, type Market } from './markets';
import { translate } from './ui-dictionary';
export function useLocale() {
  const {region,setRegion,t:existingTranslate} = useI18n();
  const market = region.id.toUpperCase() as Market;
  const europeanCountry=useMarketStore(state=>state.europeanCountry);
  const setEuropeanCountry=useMarketStore(state=>state.setEuropeanCountry);
  return { market, ...MARKETS[market], europeanCountry,setEuropeanCountry,
    setMarket:(next:Market)=>setRegion(next.toLowerCase() as RegionId),
    t:(source:string)=>{const translated=existingTranslate(source);return translated===source?translate(source,MARKETS[market].language):translated;},
  };
}

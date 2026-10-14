'use client';

import { useEffect, useId } from 'react';
import { useMarketStore } from '@/stores/useMarketStore';
import { useLocale } from '@/lib/commerce/useLocale';
import styles from './market-selector.module.css';

const markets = [
  { id: 'KR', name: '대한민국', language: '한국어', currency: 'KRW' },
  { id: 'US', name: '미국', language: 'English', currency: 'USD' },
  { id: 'JP', name: '일본', language: '日本語', currency: 'JPY' },
  { id: 'EU', name: '유럽', language: 'English', currency: 'EUR' },
] as const;
const countries = [
  ['DE', '독일'], ['FR', '프랑스'], ['NL', '네덜란드'], ['ES', '스페인'], ['IT', '이탈리아'],
  ['IE', '아일랜드'], ['AT', '오스트리아'], ['BE', '벨기에'], ['FI', '핀란드'], ['PT', '포르투갈'],
] as const;

export function MarketLabel() {
  const { market, t, europeanCountry: country } = useLocale();
  const selected = markets.find(option => option.id === market)!;
  const region = market === 'EU' ? countries.find(option => option[0] === country)![1] : selected.name;
  return <>{t(region)} · {selected.language} · {selected.currency}</>;
}

export function MarketSettings() {
  useEffect(() => { void useMarketStore.persist.rehydrate(); }, []);
  const { market, t, europeanCountry: country, setMarket, setEuropeanCountry: setCountry } = useLocale();
  const id = useId();
  const selected = markets.find(option => option.id === market)!;
  return <div className={styles.settings}>
    <label htmlFor={`${id}-market`}>{t('배송 지역')}</label>
    <select id={`${id}-market`} value={market} onChange={event => {
      const option = markets.find(item => item.id === event.target.value);
      if (option) setMarket(option.id);
    }}>{markets.map(option => <option key={option.id} value={option.id}>{t(option.name)} · {option.language} · {option.currency}</option>)}</select>
    {market === 'EU' && <><label htmlFor={`${id}-country`}>{t('배송 국가')}</label><select id={`${id}-country`} value={country} onChange={event => {
      const option = countries.find(item => item[0] === event.target.value);
      if (option) setCountry(option[0]);
    }}>{countries.map(([value, name]) => <option key={value} value={value}>{t(name)}</option>)}</select></>}
    <dl className={styles.summary}><div><dt>{t('언어')}</dt><dd>{selected.language}</dd></div><div><dt>{t('통화')}</dt><dd>{selected.currency}</dd></div></dl>
    <p className={styles.note}>{t('변경 사항은 즉시 저장됩니다. 현재 디자인과 장바구니는 유지됩니다.')}</p>
  </div>;
}

/** Native details keeps switching in the current route, so the in-progress design remains mounted. */
export function MarketSelector() {
  const { market, t } = useLocale();
  return <details className={styles.selector} onKeyDown={event => {
    if (event.key === 'Escape') {
      event.currentTarget.open = false;
      event.currentTarget.querySelector('summary')?.focus();
      event.stopPropagation();
    }
  }}>
    <summary aria-label={t('언어와 지역')} title={t('언어와 지역')}>{market}<span aria-hidden="true">⌄</span></summary>
    <div className={styles.panel}><h2>{t('언어와 지역')}</h2><MarketSettings /></div>
  </details>;
}

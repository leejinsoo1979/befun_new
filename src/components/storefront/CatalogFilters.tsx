'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { Dialog } from './StorefrontUI';
import { palette } from './catalog';
import styles from './storefront.module.css';

export const filterColors = [
  ['white', '화이트', '#fafafa'], ['black', '블랙', '#1d1e1f'],
  ['grey', '그레이', '#b5b6b2'], ['blue', '블루', '#91b2ce'],
  ['pink', '핑크', '#e4bdce'], ['purple', '퍼플', '#d5c7d8'],
  ['wooden', '우드', '#bca276'], ['yellow', '옐로', '#e3c783'],
  ['red', '레드', '#c82c25'], ['beige', '베이지', '#e6e0d7'],
  ['burgundy', '버건디', '#692b32'], ['graphite', '그래파이트', '#474943'],
  ['brown', '브라운', '#796952'], ['green', '그린', '#99a78b'],
  ['mix', '믹스', 'conic-gradient(#283a57,#e4bdce,#692b32,#91b2ce,#283a57)'],
] as const;

export function CatalogFilters({ query, count, apply, close }: {
  query: Record<string, string>; count: (query: Record<string, string>) => number;
  apply: (query: Record<string, string>) => void; close: () => void;
}) {
  const [draft, setDraft] = useState(query);
  const change = (key: string, value: string) => setDraft(current => {
    const next = { ...current };
    if (value) next[key] = value; else delete next[key];
    return next;
  });
  const toggle = (key: string, value: string) => {
    const selected = new Set(draft[key]?.split(',').filter(Boolean));
    if (selected.has(value)) selected.delete(value); else selected.add(value);
    change(key, [...selected].join(','));
  };
  return <Dialog title="필터" close={close} drawer>
    <div className={styles.filterSections}>
      <details open><summary>컬러 <FiChevronDown /></summary><div className={styles.filterColorGrid}>{filterColors.map(([value, name, hex]) => <button key={value} aria-pressed={draft.colors?.split(',').includes(value) ?? false} onClick={() => { change('color', ''); toggle('colors', value); }}><i style={{ background: hex }} /><span>{name}</span></button>)}</div></details>
      <details><summary>컬렉션 <FiChevronDown /></summary><div className={styles.filterChoices}>{[['3', 'Original Classic'], ['6', 'Original Modern'], ['7', 'Edge'], ['8', 'Tone'], ['9', 'Smooth']].map(([value, label]) => <label key={value}><input type="checkbox" checked={draft.productLines?.split(',').includes(value) ?? false} onChange={() => toggle('productLines', value)} />{label}</label>)}</div></details>
      <details><summary>마감과 소재 <FiChevronDown /></summary><div className={styles.filterChoices}>{[['natural', 'Natural'], ['solid', 'Solid']].map(([value, label]) => <label key={value}><input type="checkbox" checked={draft.material?.split(',').includes(value) ?? false} onChange={() => toggle('material', value)} />{label}</label>)}</div></details>
      <details><summary>수납 구성 <FiChevronDown /></summary><div className={styles.filterChoices}>{[['fullyOpen', '오픈 선반'], ['partiallyOpen', '일부 도어 포함'], ['fullyClosed', '전체 도어 포함']].map(([value, label]) => <label key={value}><input type="checkbox" checked={draft.types?.split(',').includes(value) ?? false} onChange={() => toggle('types', value)} />{label}</label>)}</div></details>
      <details><summary>개별 컬러 <FiChevronDown /></summary><div className={styles.filterChoices}>{palette.map(color => <label key={color.color}><input type="radio" name="specific-color" checked={draft.color === color.color} onChange={() => { change('colors', ''); change('color', color.color); }} />{color.name}</label>)}</div></details>
      <div className={styles.filterBadges}>{[['newArrival', '새로운 디자인'], ['sale', '할인'], ['topSeller', '베스트셀러']].map(([value, label]) => <button key={value} aria-pressed={draft.additional === value} onClick={() => change('additional', draft.additional === value ? '' : value)}>{label}</button>)}</div>
      <label className={styles.filterSort}>정렬<select value={draft.sort ?? 'recommended'} onChange={event => change('sort', event.target.value)}><option value="recommended">추천순</option><option value="price-asc">낮은 가격순</option><option value="price-desc">높은 가격순</option></select></label>
      <button className={styles.filterReset} onClick={() => setDraft({})}>필터 초기화</button>
    </div>
    <div className={styles.drawerAction}><button className={styles.darkButton} onClick={() => { apply(draft); close(); }}>결과 보기 · {count(draft)}</button></div>
  </Dialog>;
}

'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import { baseHeight } from '@/lib/three/furniture-base';

import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';
import type { CatalogProduct } from './catalog';
import { ProductConfigurator, ProductSpecifications } from './ProductConfigurator';
import { localDesignEvent, localDesignKey, parseSavedDesign } from './savedDesign';
import styles from './storefront.module.css';

export function SharedDesignPage({ serialized }: { serialized: string }) {
  const { t } = useLocale();
  const design = useMemo(() => parseSavedDesign(serialized), [serialized]);
  const product = useMemo<CatalogProduct | null>(() => design ? {
    id: 'saved-design', name: design.name || '저장한 디자인', collection: 'Befun', category: '맞춤 수납장',
    image: 'storage.avif', alternate: 'storage.avif', width: design.config.width,
    rows: design.config.rowHeights, depth: design.config.depth,
    color: design.config.color, colorCategory: design.config.colorCategory, doors: design.config.doorsCreatedLayers,
  } : null, [design]);
  if (!design || !product) return <section className={styles.pageSection}><h1>{t("디자인을 열 수 없습니다")}</h1><p>{t("링크에 유효한 디자인 구성이 없습니다. 저장한 링크 전체를 다시 확인해 주세요.")}</p><Link href="/saved-designs" className={styles.darkButton}>{t("저장한 디자인 보기")}</Link></section>;
  return <><ProductConfigurator product={product} configuration={design.config} /><section className={`${styles.section} ${styles.productIntroduction}`}><h2>{t(design.name)}</h2><p>{t("공유 링크의 구성을 불러왔습니다. 3D 화면에서 변경하고 장바구니에 담을 수 있습니다.")}</p></section><ProductSpecifications /></>;
}

const empty: string[] = [];
let cachedRaw: string | null = null;
let cachedDesigns = empty;
function snapshot() {
  try {
    const raw = localStorage.getItem(localDesignKey);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const data = JSON.parse(raw ?? '[]');
      cachedDesigns = Array.isArray(data) ? data.filter((value): value is string => typeof value === 'string' && parseSavedDesign(value) !== null) : empty;
    }
  } catch { cachedRaw = null; cachedDesigns = empty; }
  return cachedDesigns;
}
function subscribe(update: () => void) {
  window.addEventListener('storage', update);
  window.addEventListener(localDesignEvent, update);
  return () => { window.removeEventListener('storage', update); window.removeEventListener(localDesignEvent, update); };
}
export function SavedDesignsPage() {
  const { t } = useLocale();
  const designs = useSyncExternalStore(subscribe, snapshot, () => empty);
  return <section className={styles.pageSection}><h1>{t("저장한 디자인")}</h1><p className={styles.pageLead}>{t("이 브라우저에 보관한 구성을 다시 열어보세요. 공유 링크를 보관하면 다른 브라우저에서도 같은 구성을 불러올 수 있습니다.")}</p>{designs.length ? <div className={styles.savedDesignList}>{designs.map(serialized => {
    const design = parseSavedDesign(serialized)!;
    return <article key={serialized}><div><h2>{t(design.name)}</h2><p>{design.config.width} × {design.config.height + baseHeight(design.config.baseType)} × {design.config.depth} cm · {design.config.style} · {design.config.color.replace(/^[SCN]_/, '')}</p></div><Link href={`/design-preview?${new URLSearchParams({ design: serialized })}`} className={styles.outlineButton}>{t("디자인 열기")}</Link><button onClick={() => { localStorage.setItem(localDesignKey, JSON.stringify(snapshot().filter(value => value !== serialized))); window.dispatchEvent(new Event(localDesignEvent)); }} aria-label={`${design.name} ${t('저장 삭제')}`}>{t("삭제")}</button></article>;
  })}</div> : <div className={styles.empty}><p>{t("이 브라우저에 저장한 디자인이 없습니다.")}</p><Link href="/configurator-intro" className={styles.darkButton}>{t("새 디자인 시작하기")}</Link></div>}</section>;
}

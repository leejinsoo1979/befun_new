'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { ProductCardImage } from './ProductCardImage';
import { PriceNotice } from '@/components/commerce/PriceNotice';
import { useLocale } from '@/lib/commerce/useLocale';
import { localizedProductName, localizedProductType, type NameLanguage } from '@/lib/catalog-expansion/names';
import { downloadedCategoryByKey } from '@/lib/catalog-expansion/categories';
import type { DownloadedItem } from '@/lib/catalog-expansion/server';
import { catalogCategories, catalogHref } from './navigation';
import styles from './storefront.module.css';

const PAGE = 24;
export const downloadedItemHref = (item: Pick<DownloadedItem, 'categoryKey' | 'sequence'>) => `/catalog-item/${item.categoryKey}/${item.sequence}`;

const PROMO: Record<NameLanguage, { eyebrow: string; title: string; cta: string }> = {
  ko: { eyebrow: '당신이 디자인해요', title: '직접 만들기', cta: '시작하기' },
  en: { eyebrow: 'You design it', title: 'Configure yours', cta: 'Start now' },
  ja: { eyebrow: 'あなたがデザイン', title: '自分でつくる', cta: 'はじめる' },
};

const COPY: Record<NameLanguage, { notice: string; count: (n: number) => string; more: string; label: string; view: string }> = {
  ko: { notice: '디자인 레퍼런스입니다. 가격·치수·주문 정보는 포함되지 않으며, 마음에 드는 디자인은 3D 커스터마이저에서 직접 만들 수 있어요.', count: n => `${n}개의 디자인`, more: '더 보기', label: '디자인 레퍼런스', view: '디자인 살펴보기' },
  en: { notice: 'Design references. Prices, sizes and ordering are not included — recreate any design you like in the 3D configurator.', count: n => `${n} designs`, more: 'Show more items', label: 'Design reference', view: 'View design' },
  ja: { notice: 'デザインリファレンスです。価格・サイズ・注文情報は含まれません。気に入ったデザインは3Dカスタマイザーでつくれます。', count: n => `${n}件のデザイン`, more: 'もっと見る', label: 'デザインリファレンス', view: 'デザインを見る' },
};

/**
 * 카테고리 상품 목록 (Tylko PLP처럼 하나의 그리드). lead = 앞에 둘 비펀 상품/편집 가능한 디자인 카드,
 * 이어서 R6 다운로드 레퍼런스(CSV 순서). 이미지 연결은 ProductCardImage 계약 그대로.
 */
export function DownloadedCatalog({ items, lead = [], promo = true }: { items: DownloadedItem[]; lead?: ReactNode[]; promo?: boolean }) {
  const { language } = useLocale();
  const lang = (language ?? 'ko') as NameLanguage;
  const copy = COPY[lang];
  const [shown, setShown] = useState(PAGE);
  const total = lead.length + items.length;
  if (!total) return null;
  const visibleItems = items.slice(0, Math.max(0, shown - lead.length));
  return <section className={styles.downloadedCatalog} aria-label={copy.label}>
    <p className={styles.resultCount}>{copy.count(total)}</p>
    <PriceNotice />
    <div className={styles.productGrid}>{promo ? <Link href="/configurator" className={styles.plpPromo}><Image src="/imgs/storefront/storage.avif" alt="" fill sizes="(max-width:700px) 45vw, 24vw" /><span>{PROMO[lang].eyebrow}</span><strong>{PROMO[lang].title}</strong><em>{PROMO[lang].cta}</em></Link> : null}{lead}{visibleItems.map(item => {
      const name = localizedProductName(item.name, lang);
      return <article key={`${item.categoryKey}-${item.sequence}`} className={styles.productCard}>
        <Link href={downloadedItemHref(item)} className={styles.productVisual}>
          <ProductCardImage key={item.thumbnail} thumbnail={item.thumbnail} studio={item.studio} alt={name} sizes="(max-width:700px) 45vw, 24vw" />
        </Link>
        <div className={`${styles.productText} ${styles.plpText}`}>
          <p className={styles.plpLine}>{localizedProductType(item.name, lang)}</p>
          <h3 className={styles.plpName}><Link href={downloadedItemHref(item)}>{name}</Link></h3>
          <p className={styles.plpTag}>{copy.label}</p>
        </div>
      </article>;
    })}</div>
    {shown < total ? <div className={styles.loadMore}><button type="button" className={styles.outlineButton} onClick={() => setShown(value => value + PAGE)}>{copy.more}</button></div> : null}
    <p className={styles.caption}>{copy.notice}</p>
  </section>;
}

const DETAIL: Record<NameLanguage, { home: string; notice: string; make: string; back: string; studio: string }> = {
  ko: { home: '홈', notice: '이 디자인은 레퍼런스 이미지입니다. 가격·치수·구성 정보가 없어 바로 주문할 수 없습니다. 비슷한 크기와 색으로 직접 만들어 보세요.', make: '3D로 직접 디자인하기', back: '목록으로', studio: '스튜디오 컷' },
  en: { home: 'Home', notice: 'This is a reference image. It has no price, size or configuration data, so it cannot be ordered directly. Create a similar design yourself.', make: 'Design it in 3D', back: 'Back to list', studio: 'Studio shot' },
  ja: { home: 'ホーム', notice: 'これはリファレンス画像です。価格・サイズ・構成情報がないため、そのままでは注文できません。似たデザインを自分でつくってみましょう。', make: '3Dでデザインする', back: '一覧へ戻る', studio: 'スタジオカット' },
};

export function DownloadedItemPage({ item }: { item: DownloadedItem }) {
  const { language, t } = useLocale();
  const lang = (language ?? 'ko') as NameLanguage;
  const copy = DETAIL[lang];
  const category = downloadedCategoryByKey(item.categoryKey);
  const listHref = category ? `${catalogHref(category.slug)}${category.query ? `?${new URLSearchParams(category.query)}` : ''}` : '/furniture-c';
  const categoryTitle = category ? t(category.slug ? catalogCategories[category.slug] ?? category.csv : '모든 제품') : '';
  const name = localizedProductName(item.name, lang);
  const designHref = item.categoryKey === 'desk' ? '/furniture-design/desk-classic' : item.categoryKey.startsWith('wardrobe') ? '/furniture-design/wardrobe-edge' : '/configurator';
  return <section className={styles.pageSection}>
    <nav className={styles.breadcrumbs} aria-label="breadcrumb"><Link href="/">{copy.home}</Link><span>/</span><Link href={listHref}>{categoryTitle}</Link><span>/</span><span>{name}</span></nav>
    <div className={styles.detailLayout}>
      <div className={styles.detailGallery}>
        {[item.thumbnail, item.studio].map((src, index) => <div key={src} className={styles.detailImage}><Image src={src} alt={index ? `${name} · ${copy.studio}` : name} fill sizes="(max-width:700px) 90vw, 45vw" /></div>)}
      </div>
      <div className={styles.downloadedDetailInfo}>
        <h1>{name}</h1>
        <p className={styles.referenceNotice}>{copy.notice}</p>
        <Link href={designHref} className={styles.darkButton}>{copy.make}</Link>
        <Link href={listHref} className={styles.outlineButton}>{copy.back}</Link>
      </div>
    </div>
  </section>;
}

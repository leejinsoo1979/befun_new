'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useLocale } from '@/lib/commerce/useLocale';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { JoinSection } from './JoinSection';
import { catalogCategories, catalogHref } from './navigation';
import styles from './storefront.module.css';
import { introVariants } from './introVariants';
import { catalogThumbnailStart } from '@/lib/catalog-entry/starts';

const categories = [
  ['sideboard', 'sideboard', 'sideboard-terra'], ['bookcase', 'bookcase', 'bookcase-brown'],
  ['wallstorage', 'wallstorage', 'wall-green'], ['wallunits', 'wallunit', 'wall-green'],
  ['wardrobe', 'wardrobe', ''], ['desk', 'desk', ''], ['dressing_table', 'dressingtable', ''],
  ['tv-stand', 'tvstand', 'tv-brown'], ['chest-of-drawers', 'chest', ''],
  ['shoerack', 'shoerack', ''], ['bedside_table', 'bedsidetable', ''],
  ['vinyl_storage', 'vinylstorage', ''], ['sofas', 'sofa-uff', ''],
] as const;
/** 분류 대표 이미지: R6 다운로드 원본 썸네일(각 CSV 카테고리 1번째), 우리 서버 파일 */
const categoryThumbnails: Record<string, string> = {
  sideboard: '/imgs/product-cards/62fff045754e99f8a37d990f4c32b66149734ac51d1dc2eae68b39f2d655beb6.webp',
  bookcase: '/imgs/product-cards/1ed3be94bde027f1073c43a4ed3e77ebf0aa0e05b634b057a27ba99178bf127f.webp',
  wallstorage: '/imgs/product-cards/17abb14138b18b9a8d17b6e62aee16218bcadcb39e6b69848e6fbd8ce92dd89d.webp',
  wallunits: '/imgs/product-cards/11625dc657f4f55c4d420f19347bca41cb141c0c26cedb009b6370271fbdd1d9.webp',
  wardrobe: '/imgs/product-cards/48e0a08bbba2d38b730d60211ec1845ae21497d12a835a026e8cd29238c896cb.webp',
  desk: '/imgs/product-cards/c7bda8b9570345d25d987717a045dc11d2ba6e2065099c83014c4cfee0b3c92a.webp',
  dressing_table: '/imgs/product-cards/1d68970736c39d2befb4636ab3a47dc3aea38b9b53de0c1d667ec124cf41d946.webp',
  'tv-stand': '/imgs/product-cards/ef2c475e4e05b85146f118f1a9ef6834c8d9d435aedc2b04fc52e56919a82ada.webp',
  'chest-of-drawers': '/imgs/product-cards/1b209e4c1ef137f50f4a47aeb9cf929a61b1316b46e6c3534beaba58d6da330b.webp',
  shoerack: '/imgs/product-cards/1364470ccf96ada19ddf86df368630ceb91e445b7f0f2ac09c1b19b7169f7595.webp',
  bedside_table: '/imgs/product-cards/c8cf63fe3b5195737fe986173d0ceb592807dc525a7c7f0285390c7d5164d84f.webp',
  vinyl_storage: '/imgs/product-cards/45c098df0e42a70a2fa96dace6f71f7389ea682ea1b523b12508a240aeedbdcc.webp',
  sofas: '/imgs/product-cards/f12ec0dc977e4624c938691273dcfe7afdbb85556c606203b71985599bfc5270.webp',
};
// Stable pseudo-random choices keep SSR and hydration identical. Prefer unused
// swatches so neighboring categories do not all start in clay brown.
function initialVariants(options = introVariants): Record<string, number> {
  const chosen: Record<string, number> = {};
  const usage = new Map<string, number>();
  for (const [slug] of categories) {
    const variants = options[slug];
    if (!variants?.length) continue;
    const seed = Array.from(slug).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 17);
    const start = seed % variants.length;
    let best = start;
    for (let offset = 1; offset < variants.length; offset++) {
      const candidate = (start + offset) % variants.length;
      if ((usage.get(variants[candidate].swatch) ?? 0) < (usage.get(variants[best].swatch) ?? 0)) best = candidate;
    }
    // The requested source-backed bedside design is the category's initial card.
    if (slug === 'bedside_table') best = variants.findIndex(v => v.sourceProductKey === '657092,w');
    best = Math.max(0, best);
    chosen[slug] = best;
    const swatch = variants[best].swatch;
    usage.set(swatch, (usage.get(swatch) ?? 0) + 1);
  }
  return chosen;
}

export function ConfiguratorIntro({ productLine = '', category = '', allowedProductKeys }: { productLine?: string; category?: string; allowedProductKeys?: string[] }) {
  const collectionNames: Record<string, string> = { classic: 'Original Classic', modern: 'Original Modern', edge: 'Edge', tone: 'Tone' };
  const collectionName = collectionNames[productLine];
  const allowed = allowedProductKeys ? new Set(allowedProductKeys) : null;
  const variants = allowed ? Object.fromEntries(Object.entries(introVariants).map(([slug, entries]) => [slug, entries.filter(entry => allowed.has(entry.sourceProductKey))])) : introVariants;
  const availableCategories = categories.filter(([slug]) => !allowed || variants[slug]?.length);
  const orderedCategories = [...availableCategories].sort(([a], [b]) => Number(b === category) - Number(a === category));
  const [variantBy, setVariantBy] = useState<Record<string, number>>(() => initialVariants(variants));
  const variantOf = (slug: string) => variants[slug]?.[variantBy[slug] ?? 0];
  const router = useRouter();
  const { t } = useLocale();
  const choose = (slug: string) => {
    const variant = variantOf(slug);
    const start = variant && catalogThumbnailStart(variant.sourceProductKey);
    router.push(start?.href ?? variant?.referenceHref ?? catalogHref(slug));
  };
  return <><section className={`${styles.pageSection} ${styles.configuratorIntro}`}>
    <h1>{collectionName ? `${collectionName} · ${t('가구 종류를 선택하세요')}` : t('가구 종류를 선택하세요')}</h1>
    <p>{t("사진을 선택해 해당 디자인을 살펴보세요. 구성 정보가 준비된 디자인은 같은 설정의 3D 편집기로 열립니다.")}</p>
    <div className={styles.introCategories}>{orderedCategories.map(([slug]) => <div key={slug} className={styles.introCard}><button onClick={() => choose(slug)}><div><Image src={variantOf(slug)?.thumbnail ?? categoryThumbnails[slug]} alt={t(catalogCategories[slug])} fill sizes="(max-width:700px) 42vw, 20vw" /></div><span>{t(catalogCategories[slug])}</span></button>{variants[slug]?.length > 1 && <div className={styles.introSwatches} role="group" aria-label={`${t(catalogCategories[slug])} ${t('컬러')}`}>{variants[slug].map((variant, vi) => <button key={variant.thumbnail} aria-label={t(variant.name)} title={t(variant.name)} aria-pressed={(variantBy[slug] ?? 0) === vi} style={{ background: variant.swatch }} onClick={() => setVariantBy(current => ({ ...current, [slug]: vi }))} />)}</div>}</div>)}</div>
    <div className={styles.introNavigation}><Link href="/furniture-c" className={styles.outlineButton}><FiArrowLeft />  {t("돌아가기")}</Link></div>
  </section><JoinSection /></>;
}

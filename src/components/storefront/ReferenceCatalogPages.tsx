'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { categoryReferences, referenceCatalog } from './referenceCatalog';
import { ReferenceImage, isExternalImage } from './StorefrontUI';
import { catalogCategories, catalogHref } from './navigation';
import { JoinSection } from './JoinSection';
import { catalogFurnitureDesign } from '@/lib/furniture/catalog-design';
import styles from './storefront.module.css';
import { ProductCardImage } from './ProductCardImage';
import matches from '@/lib/catalog-images/existing-matches.json';
import { sourceProductKey } from '@/lib/catalog-images/identity';

function WardrobeReferenceImage({ source, alt, sizes }: { source: string; alt: string; sizes: string }) {
  const [failed, setFailed] = useState(false);
  // Keep the local-only policy without substituting another wardrobe family.
  return failed || isExternalImage(source) ? <span role="img" aria-label={`${alt} 원본 이미지 미표시`} style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 16, textAlign: 'center' }}>원본 이미지를 불러오지 못했습니다.</span>
    : <Image src={source} alt={alt} fill sizes={sizes} unoptimized onError={() => setFailed(true)} />;
}

export function ReferenceCatalogCards({ category }: { category: string }) {
  const samples = categoryReferences(category);
  const editableCount = samples.filter(product => catalogFurnitureDesign(product.id)).length;
  return <>
    <p className={styles.referenceNotice}>{editableCount
      ? `${catalogCategories[category]} 디자인을 선택하고 크기와 수납 구성을 3D로 편집해 보세요. 이 브라우저에 저장하고 링크로 공유할 수 있습니다. 구매 기능은 제공되지 않습니다.`
      : `${catalogCategories[category]} 디자인 예시입니다. Befun 판매 상품으로 등록된 제품은 아닙니다.`}</p>
    <p className={styles.resultCount}>{samples.length}개의 {editableCount === samples.length && editableCount ? '편집 가능한 디자인' : '디자인 레퍼런스'}</p>
    <div className={styles.productGrid}>{samples.map(product => {
      const editable = Boolean(catalogFurnitureDesign(product.id));
      const matched = (matches as Record<string, {productKey:string;thumbnail:string;studio:string}>)[product.id];
      const pair = matched?.productKey === sourceProductKey(product.source) ? matched : undefined;
      return <article key={product.id} className={styles.productCard}>
        <Link href={`/reference-product/${product.id}`} className={styles.productVisual}>
          {pair ? <ProductCardImage key={pair.thumbnail} thumbnail={pair.thumbnail} studio={pair.studio} alt={product.name} sizes="(max-width:700px) 45vw, 24vw" /> : product.category === 'wardrobe'
            ? <WardrobeReferenceImage source={product.image} alt={product.name} sizes="(max-width:700px) 45vw, 24vw" />
            : <ReferenceImage source={product.image} fallback={['blankets', 'bookends'].includes(category) ? 'creator-3.avif' : category.includes('seater') || ['chaise_longues', 'corner_sofas', 'armchairs', 'ottomans_and_modules', 'covers'].includes(category) ? 'sofa.avif' : 'storage.avif'} alt={product.name} sizes="(max-width:700px) 45vw, 24vw" />}
        </Link>
        <div className={styles.productText}>
          <p>{editable ? 'Befun · 3D 커스터마이저' : 'Tylko · 디자인 레퍼런스'}</p>
          <h3><Link href={`/reference-product/${product.id}`}>{product.name}</Link></h3>
          <Link href={`/reference-product/${product.id}`} className={styles.referenceCardLink}>{editable ? '3D 디자인 편집' : '디자인 살펴보기'} <FiArrowRight /></Link>
        </div>
      </article>;
    })}</div>
  </>;
}

export function SourceProductPage({ id }: { id: string }) {
  const product = referenceCatalog.find(item => item.id === id)!;
  const accessories = ['blankets', 'bookends', 'covers'].includes(product.category);
  const sofa = product.source.includes('/sofa/');
  const designHref = sofa ? '/furniture-c/sofas'
    : ['desk', 'dressing_table'].includes(product.category) ? '/furniture-design/desk-classic'
      : product.category === 'wardrobe' ? '/furniture-design/wardrobe-edge' : '/configurator';
  return <><section className={styles.pageSection}><nav className={styles.breadcrumbs} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href={catalogHref(product.category)}>{catalogCategories[product.category]}</Link><span>/</span><span>{product.name}</span></nav><div className={styles.detailLayout}><div className={styles.sourceProductImage}>{product.category === 'wardrobe' ? <WardrobeReferenceImage source={product.image} alt={product.name} sizes="(max-width:700px) 90vw, 58vw" /> : <ReferenceImage source={product.image} fallback="storage.avif" alt={product.name} sizes="(max-width:700px) 90vw, 58vw" />}</div><div className={styles.detailInfo}><p>Tylko · 디자인 레퍼런스</p><h1>{product.name}</h1><p className={styles.referenceNotice}>이 사진은 디자인 참고용입니다. 사진과 동일한 구성의 편집 정보는 아직 연결되지 않았습니다. Befun에서 새 디자인을 만들어 보세요.</p><Link className={styles.darkButton} href={accessories ? '/furniture-c' : designHref}>{accessories ? 'Befun 가구 둘러보기' : sofa ? '소파 디자인 둘러보기' : 'Befun 새 디자인 만들기'} <FiArrowRight /></Link><Link href={catalogHref(product.category)} className={styles.outlineButton}>다른 디자인 보기</Link><div className={styles.specificationRows}><details><summary>카테고리</summary><p>{catalogCategories[product.category]}</p></details><details><summary>맞춤 수납 가구 만들기</summary><p>Befun에서 주문 가능한 선반은 3D 커스터마이저에서 크기와 스타일, 색상을 바꿔 디자인할 수 있습니다.</p><Link href="/configurator-intro">디자인 시작하기 <FiArrowRight /></Link></details></div></div></div></section><section className={styles.section}><h2>같은 컬렉션 둘러보기</h2><ReferenceCatalogCards category={product.category} /></section><JoinSection /></>;
}

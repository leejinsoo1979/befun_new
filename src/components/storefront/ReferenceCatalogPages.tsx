'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { categoryReferences, referenceCatalog } from './referenceCatalog';
import { ReferenceImage } from './StorefrontUI';
import { catalogCategories, catalogHref } from './navigation';
import { JoinSection } from './JoinSection';
import styles from './storefront.module.css';

export function ReferenceCatalogCards({ category }: { category: string }) {
  const samples = categoryReferences(category);
  return <><p className={styles.referenceNotice}>{catalogCategories[category]} 디자인 예시입니다. Befun 판매 상품으로 등록된 제품은 아닙니다.</p><p className={styles.resultCount}>{samples.length}개의 디자인 레퍼런스</p><div className={styles.productGrid}>{samples.map(product => <article key={product.id} className={styles.productCard}><Link href={`/reference-product/${product.id}`} className={styles.productVisual}><ReferenceImage source={product.image} fallback={['blankets', 'bookends'].includes(category) ? 'creator-3.avif' : category.includes('seater') || ['chaise_longues', 'corner_sofas', 'armchairs', 'ottomans_and_modules', 'covers'].includes(category) ? 'sofa.avif' : 'storage.avif'} alt={product.name} sizes="(max-width:700px) 45vw, 24vw" /></Link><div className={styles.productText}><p>Tylko · 디자인 레퍼런스</p><h3><Link href={`/reference-product/${product.id}`}>{product.name}</Link></h3><Link href={`/reference-product/${product.id}`} className={styles.referenceCardLink}>디자인 살펴보기 <FiArrowRight /></Link></div></article>)}</div></>;
}

export function SourceProductPage({ id }: { id: string }) {
  const product = referenceCatalog.find(item => item.id === id)!;
  return <><section className={styles.pageSection}><nav className={styles.breadcrumbs} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href={catalogHref(product.category)}>{catalogCategories[product.category]}</Link><span>/</span><span>{product.name}</span></nav><div className={styles.detailLayout}><div className={styles.sourceProductImage}><ReferenceImage source={product.image} fallback="storage.avif" alt={product.name} sizes="(max-width:700px) 90vw, 58vw" /></div><div className={styles.detailInfo}><p>Tylko · 디자인 레퍼런스</p><h1>{product.name}</h1><p className={styles.referenceNotice}>이 제품은 Befun의 판매 상품이 아닙니다. 원본 디자인의 정확한 치수, 소재와 구매 옵션은 Tylko 상품 페이지에서 확인할 수 있습니다.</p><a className={styles.darkButton} href={product.source} target="_blank" rel="noreferrer">원본 제품 살펴보기 <FiArrowRight /></a><Link href={catalogHref(product.category)} className={styles.outlineButton}>다른 디자인 보기</Link><div className={styles.specificationRows}><details><summary>카테고리</summary><p>{catalogCategories[product.category]}</p></details><details><summary>맞춤 수납 가구 만들기</summary><p>Befun에서 주문 가능한 선반은 3D 커스터마이저에서 크기와 스타일, 색상을 바꿔 디자인할 수 있습니다.</p><Link href="/configurator-intro">디자인 시작하기 <FiArrowRight /></Link></details></div></div></div></section><section className={styles.section}><h2>같은 컬렉션 둘러보기</h2><ReferenceCatalogCards category={product.category} /></section><JoinSection /></>;
}

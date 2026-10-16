'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiHeart, FiSearch } from 'react-icons/fi';
import { asset, products, referenceProducts, type CatalogProduct } from './catalog';
import { ProductCard, productHref } from './StorefrontUI';
import { useSavedProducts } from './useSavedProducts';
import { ProductConfigurator } from './ProductConfigurator';
import { ProductDetails } from './ProductDetails';
import { useLocale } from '@/lib/commerce/useLocale';
import styles from './storefront.module.css';
import ShoppingCatalog, { ShoppingCard, shoppingSavedId } from './ShoppingCatalog';
import type { ShoppingItem } from '@/lib/shopping-catalog/types';
import shopStyles from './all-sofas.module.css';
import AllSofas, { SavedSofas, savedSofaCount } from './AllSofas';

const BookcaseConfigurator = dynamic(() => import('@/components/bookcase/BookcaseConfigurator'), { ssr: false });

export function Breadcrumbs({ title }: { title: string }) { const { t } = useLocale(); return <nav className={styles.breadcrumbs} aria-label={t('현재 위치')}><Link href="/">{t('홈')}</Link><span>/</span><Link href="/furniture-c">{t('모든 제품')}</Link><span>/</span><span>{t(title)}</span></nav>; }

export function CatalogPage({ slug = '', query, items = [], recommendations = [] }: { slug?: string; query: Record<string, string>; items?: ShoppingItem[]; recommendations?: ShoppingItem[] }) {
  return slug === 'sofas' ? <AllSofas /> : <ShoppingCatalog key={`${slug}:${query.types || ''}:${query.features || ''}`} slug={slug} query={query} items={items} recommendations={recommendations} />;
}
export function ProductPage({ product }: { product: CatalogProduct }) {
  return <><div id="configuration">{product.id === "wall-green" ? <BookcaseConfigurator start="tone-wall" embedded /> : <ProductConfigurator product={product} />}</div><ProductDetails product={product} /></>;
}
export function ReferenceProductPage({ id }: { id: string }) {
  const { t } = useLocale();
  const product = referenceProducts.find(item=>item.id===id)!;
  return <section className={styles.pageSection}><Breadcrumbs title={t(product.name)} /><div className={styles.detailLayout}><div className={styles.detailGallery}>{[product.image,product.alternate].map(image=><div className={styles.detailImage} key={image}><Image src={asset(image)} alt={t(product.name)} fill sizes="60vw" /></div>)}</div><div className={styles.detailInfo}><p>{t("Tylko Smooth · 레퍼런스 컬렉션")}</p><h1>{t(product.name)}</h1><p>{t(product.description)}</p><p className={styles.referenceNotice}>{t("참고 이미지입니다. Smooth 3D 컨피규레이터에서 새로운 소파를 디자인하세요.")}</p><Link href="/sofa-configurator?model=smooth" className={styles.darkButton}>{t("Smooth 소파 디자인하기")} <FiArrowRight /></Link><Link href="/furniture-c/sofas" className={styles.outlineButton}>{t("소파 목록 보기")}</Link></div></div></section>;
}
export function SearchPage({ initialQuery = '', wishlist = false, shoppingItems = [] }: { initialQuery?: string; wishlist?: boolean; shoppingItems?: ShoppingItem[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const {saved,toggleSaved} = useSavedProducts();
  const [search,setSearch] = useState(initialQuery);
  const savedShopping = shoppingItems.filter(item => saved.includes(shoppingSavedId(item.productKey)));
  const matches=products.filter(product=> wishlist ? saved.includes(product.id) : `${t(product.name)} ${t(product.category)} ${product.collection}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className={styles.pageSection}><Breadcrumbs title={t(wishlist?'즐겨찾기':'제품 검색')} /><h1>{t(wishlist?'좋아하는 디자인을 한곳에':'어떤 가구를 찾으세요?')}</h1>{!wishlist ? <form onSubmit={e=>{e.preventDefault();router.replace(`/search?q=${encodeURIComponent(search)}`,{scroll:false});}}><label className={styles.searchField}><FiSearch /><input type="search" name="q" aria-label={t("제품 검색어")} placeholder={t("책장, 수납장, 컬러로 검색하세요")} value={search} onChange={e=>setSearch(e.target.value)} /><button type="submit" aria-label={t("검색")}><FiArrowRight /></button></label></form> : null}<p className={styles.resultCount}>{matches.length + (wishlist ? savedSofaCount(saved) + savedShopping.length : 0)}{t("개의 디자인")}</p><div className={styles.productGrid}>{matches.map(product=><ProductCard key={product.id} product={product} saved={saved.includes(product.id)} toggleSaved={()=>toggleSaved(product.id)} open={()=>router.push(productHref(product))} />)}</div>{wishlist && <><SavedSofas /><div className={shopStyles.grid}>{savedShopping.map(item => <ShoppingCard key={item.productKey} item={item} />)}</div></>}{!matches.length && (!wishlist || (!savedSofaCount(saved) && !savedShopping.length)) ? <div className={styles.empty}><FiHeart /><p>{t(wishlist?'마음에 드는 디자인의 하트를 눌러 저장하세요.':'검색 조건에 맞는 디자인이 없습니다.')}</p><Link href="/furniture-c" className={styles.darkButton}>{t("모든 디자인 보기")}</Link></div>:null}</section>;
}

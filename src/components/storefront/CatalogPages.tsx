'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiHeart, FiSearch, FiSliders } from 'react-icons/fi';
import { asset, products, referenceProducts, productPrice, type CatalogProduct } from './catalog';
import { catalogCategories, catalogHref } from './navigation';
import { ProductCard, ReferenceImage, productHref } from './StorefrontUI';
import { useSavedProducts } from './useSavedProducts';
import { ProductConfigurator } from './ProductConfigurator';
import { ProductDetails } from './ProductDetails';
import { CatalogFilters, filterColors } from './CatalogFilters';
import { ReferenceCatalogCards } from './ReferenceCatalogPages';
import { DownloadedCatalog } from './DownloadedCatalog';
import { useLocale } from '@/lib/commerce/useLocale';
import { catalogFurnitureDesign } from '@/lib/furniture/catalog-design';
import type { DownloadedItem } from '@/lib/catalog-expansion/server';
import { categoryReferences } from './referenceCatalog';
import styles from './storefront.module.css';
import { ProductCardImage } from './ProductCardImage';
import matches from '@/lib/catalog-images/existing-matches.json';

const lines = ['ORIGINAL CLASIC', 'ORIGINAL MODERN', 'EDGE', 'TONE', 'SMOOTH'];
const lineNames = ['Original Classic', 'Original Modern', 'Edge', 'Tone', 'Smooth'];
const lineIds = ['3', '6', '7', '8', '9'];
/** 제품 라인 카드 배경: R6 다운로드 스튜디오 컷(우리 서버) — 라인 대표 상품 */
const lineCoverImages = [
  '/imgs/product-cards/177300d2b780e7f20f48b18ee8907257b466de936b5f625ce4428f39d8b8a9ef.webp',
  '/imgs/product-cards/f5efaea94a75c46f94714bdfe23cd3a0cd7bdbd7ce755281d158d3be00902f55.jpg',
  '/imgs/product-cards/25d56f205a9569dc8a0e45103d5c13dab8431c592a2c6bf793f0fac7028b45fd.webp',
  '/imgs/product-cards/0d42da310252bd1604c1b9e385941c627f78864ac57997c045f0730dd14b72c7.jpg',
  '/imgs/product-cards/0199a4ef716199eab93076d7ad76adf761473f9614263a3158a869be69982641.webp',
];
const sofaSlugs = ['sofas', 'two_seater', 'three_seater', 'four_plus_seater', 'chaise_longues', 'corner_sofas', 'armchairs', 'ottomans_and_modules', 'covers'];
const directCategories: Record<string, string[]> = { sideboard: ['수납장'], bookcase: ['책장'], wallstorage: ['월 수납장'], 'tv-stand': ['TV 스탠드'], storage: ['수납장', '월 수납장', '책장', 'TV 스탠드'], wardrobe: ['월 수납장'], wallunits: ['월 수납장'], 'chest-of-drawers': ['수납장'], bedside_table: ['수납장'], desk: ['수납장'], dressing_table: ['수납장'], shoerack: ['수납장'], vinyl_storage: ['수납장', '책장'] };
export function Breadcrumbs({ title }: { title: string }) { const { t } = useLocale(); return <nav className={styles.breadcrumbs} aria-label={t('현재 위치')}><Link href="/">{t('홈')}</Link><span>/</span><Link href="/furniture-c">{t('모든 제품')}</Link><span>/</span><span>{t(title)}</span></nav>; }

/** Tylko PLP 경로 표시: 모든 제품 • 상위 분류 • 현재 분류 */
const CATALOG_PARENT: Record<string, string> = {
  sideboard: 'storage', bookcase: 'storage', wallstorage: 'storage', wallunits: 'storage', desk: 'storage', 'tv-stand': 'storage', 'chest-of-drawers': 'storage',
  dressing_table: 'storage', shoerack: 'storage', bedside_table: 'storage', vinyl_storage: 'storage',
  two_seater: 'sofas', three_seater: 'sofas', four_plus_seater: 'sofas', corner_sofas: 'sofas', modular_sofas: 'sofas', chaise_longues: 'sofas', armchairs: 'sofas', ottomans_and_modules: 'sofas', covers: 'sofas',
  blankets: 'accessories', bookends: 'accessories',
};
function CatalogBreadcrumbs({ slug }: { slug: string }) {
  const { t } = useLocale();
  const trail = slug ? [['', '모든 제품'], ...(CATALOG_PARENT[slug] ? [[CATALOG_PARENT[slug], catalogCategories[CATALOG_PARENT[slug]]]] : []), [slug, catalogCategories[slug]]] : [['', '모든 제품']];
  return <nav className={`${styles.breadcrumbs} ${styles.plpBreadcrumbs}`} aria-label={t('현재 위치')}>{trail.map(([key, name], index) => index < trail.length - 1
    ? <Link key={key || 'all'} href={catalogHref(key)}>{t(name)}</Link>
    : <span key={key || 'all'} aria-current="page">{t(name)}</span>)}</nav>;
}
/** 상위 분류 페이지의 세부 종류 아이콘 (Tylko Storage/Sofas/Accessories 페이지와 같은 구성) */
const SUBCATEGORY_ICONS: Record<string, readonly (readonly [href: string, name: string, icon: string])[]> = {
  storage: ['sideboard', 'bookcase', 'wallstorage', 'wallunits', 'desk', 'tv-stand', 'chest-of-drawers', 'dressing_table', 'shoerack', 'bedside_table', 'vinyl_storage'].map(key => [catalogHref(key), catalogCategories[key], key] as const),
  sofas: ['two_seater', 'three_seater', 'four_plus_seater', 'chaise_longues', 'corner_sofas', 'armchairs', 'ottomans_and_modules', 'covers'].map(key => [catalogHref(key), catalogCategories[key], key] as const),
  accessories: ['blankets', 'bookends'].map(key => [catalogHref(key), catalogCategories[key], key] as const),
};
/** 옷장 Type 칩 (Tylko Wardrobes 페이지) */
const WARDROBE_TYPES = [['fullyClosed', '닫힌 형태'], ['partiallyOpen', '부분 오픈 형태'], ['fullyOpen', '오픈 형태']] as const;
/** 분류별로 보여 줄 제품 라인 카드 (Tylko: 수납=4라인, 옷장=Edge·Tone, 소파=Uff·Smooth) */
const LINE_GROUPS: Record<string, number[]> = { storage: [0, 1, 2, 3], wardrobe: [2, 3], sofas: [4] };
export function CatalogPage({ slug = '', query, downloaded = [] }: { slug?: string; query: Record<string, string>; downloaded?: DownloadedItem[] }) {
  const router = useRouter();
  const { t } = useLocale();
  const { saved, toggleSaved } = useSavedProducts();
  const [filterOpen, setFilterOpen] = useState(false);
  const [limit, setLimit] = useState(12);
  const title = catalogCategories[slug] ?? '모든 제품';
  const isSofa = sofaSlugs.includes(slug);
  const hasReferences = categoryReferences(slug).length > 0;
  const accessories = ['blankets', 'bookends', 'accessories'].includes(slug);
  const filterProducts = (filters: Record<string, string>) => {
    const colorGroups: Record<string, string[]> = { brown: ['N_Walnut'], wooden: ['N_Walnut'], green: ['S_Green'], red: ['S_Teracotta Orange'], burgundy: ['S_Burgundy'], purple: ['S_Burgundy'] };
    let result = products.filter(product => !slug || directCategories[slug]?.includes(product.category));
    if (filters.color) result = result.filter(product => product.color === filters.color);
    if (filters.colors) result = result.filter(product => filters.colors.split(',').some(group => colorGroups[group]?.includes(product.color)));
    if (filters.types) result = result.filter(product => filters.types.split(',').some(type => type === 'fullyOpen' ? product.doors.length === 0 : type === 'fullyClosed' ? product.doors.length === product.rows.length : product.doors.length > 0 && product.doors.length < product.rows.length));
    if (filters.features === 'hanging' || filters.features === 'internalDrawers') result = [];
    if (filters.material) result = result.filter(product => filters.material.split(',').includes(product.colorCategory));
    if (filters.productLines) result = result.filter(product => filters.productLines.split(',').some(line => line === '3' ? product.colorCategory === 'natural' : line === '6' ? product.colorCategory === 'solid' : line === '7' ? ['책장', '월 수납장'].includes(product.category) : line === '8' ? ['수납장', 'TV 스탠드'].includes(product.category) : false));
    if (filters.sort && filters.sort !== 'recommended') result = [...result].sort((a, b) => (productPrice(a).finalPrice - productPrice(b).finalPrice) * (filters.sort === 'price-asc' ? 1 : -1));
    return result;
  };
  const filtered = filterProducts(query);
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(query);
    if (key === 'colors') params.delete('color');
    if (value) params.set(key, value); else params.delete(key);
    router.push(`${catalogHref(slug)}${params.size ? `?${params}` : ''}`, { scroll: false });
  };
  return <section className={styles.pageSection}><CatalogBreadcrumbs slug={slug} /><h1>{t(query.additional === 'topSeller' ? '베스트셀러' : query.additional === 'newArrival' ? '새로운 디자인' : title)}</h1>
    {(() => { const group = CATALOG_PARENT[slug] ?? slug; const showUff = !slug || group === 'sofas'; const indices = !slug ? [0, 1, 2, 3, 4] : LINE_GROUPS[group] ?? []; return showUff || indices.length ? <div className={`${styles.lineCovers} ${(showUff ? 1 : 0) + indices.length <= 2 ? styles.lineCoversWide : ''}`}>{showUff ? <Link className={styles.lineCover} href={catalogHref('sofas')}><Image src="/imgs/product-cards/38e450244e64d7552be48462d45356f1d427c34661c1b68132f5225ff7b16d55.webp" alt="Uff" fill sizes="368px" /><div><h2>Uff</h2><p>{t('둥근 형태, 모듈 구성')}</p><span><FiArrowRight /></span></div></Link> : null}{indices.map(index => <Link key={lines[index]} className={styles.lineCover} href={`/furniture-c?productLines=${lineIds[index]}`}><Image src={lineCoverImages[index]} alt={lineNames[index]} fill sizes="368px" /><div><h2>{lineNames[index]}</h2><p>{t(['자연스러운 합판의 대비', '대담한 컬러와 현대적인 형태', '수직선으로 만드는 리듬', '차분하고 간결한 디자인', '곡선과 모듈의 편안함'][index])}</p><span><FiArrowRight /></span></div></Link>)}</div> : null; })()}
    {SUBCATEGORY_ICONS[slug] ? <nav className={`${styles.illustratedCategories} ${styles.subcategoryIcons}`} aria-label={t('제품 종류')}>{SUBCATEGORY_ICONS[slug].map(([href, name, icon]) => <Link key={href} href={href}><div className={styles.categoryIcon}><Image src={`/imgs/storefront/category-icons/${icon}.png`} alt="" fill sizes="104px" /></div><span>{t(name)}</span></Link>)}</nav> : null}
    {!slug ? <nav className={styles.illustratedCategories} aria-label={t('컬렉션 종류')}>{([
      ['수납 가구', 'storage', '/imgs/storefront/category-icons/storage.png'],
      ['옷장', 'wardrobe', '/imgs/storefront/category-icons/wardrobe.png'],
      ['소파', 'sofas', '/imgs/storefront/category-icons/sofas.png'],
      ['액세서리', 'accessories', '/imgs/storefront/category-icons/accessories.png'],
    ] as const).map(([name, key, image]) => <Link key={key} href={catalogHref(key)} aria-current={slug === key ? 'page' : undefined}><div className={styles.categoryIcon}><Image src={image} alt="" fill sizes="112px" /></div><span>{t(name)}</span></Link>)}</nav> : null}
    {!hasReferences || downloaded.length ? <div className={styles.filterBar}><div className={styles.colorFilterStrip}><span>{t('컬러 필터 라벨')}</span><div className={styles.swatches} role="group" aria-label={t('컬러 필터')}>{filterColors.slice(0, 6).map(([value, name, hex]) => <button key={value} title={t(name)} aria-label={`${t(name)} ${t('필터')}`} aria-pressed={query.colors === value} className={query.colors === value ? styles.swatchSelected : ''} style={{ background: hex }} onClick={() => updateFilter('colors', query.colors === value ? '' : value)} />)}<button className={styles.moreColors} onClick={() => setFilterOpen(true)}>{t('더 보기')}</button></div></div>{slug === 'wardrobe' ? <div className={styles.typeChips}><span>{t('유형')}</span><div role="group" aria-label={t('유형')}>{WARDROBE_TYPES.map(([value, name]) => <button key={value} type="button" aria-pressed={query.types === value} onClick={() => updateFilter('types', query.types === value ? '' : value)}>{t(name)}</button>)}</div></div> : null}<button className={`${styles.outlineButton} ${styles.smallButton}`} onClick={() => setFilterOpen(true)}>{t('모든 필터')} <FiSliders /></button></div> : null}
    {query.color || query.colors || query.material || query.types || query.productLines ? <div className={styles.filterTabs}><button onClick={() => router.push(catalogHref(slug), {scroll: false})}>{t('필터 초기화')} ×</button></div> : null}
    {downloaded.length ? <DownloadedCatalog promo={!accessories} key={`${slug}?${query.types ?? ''}${query.features ?? ''}`} items={downloaded} lead={[
      ...categoryReferences(slug).filter(reference => catalogFurnitureDesign(reference.id)).map(reference => {
        const pair = (matches as Record<string, {thumbnail:string;studio:string}>)[reference.id];
        return <article key={reference.id} className={styles.productCard}><Link href={`/reference-product/${reference.id}`} className={styles.productVisual}>{pair ? <ProductCardImage thumbnail={pair.thumbnail} studio={pair.studio} alt={reference.name} sizes="(max-width:700px) 45vw, 24vw" /> : <ReferenceImage source={reference.image} fallback="storage.avif" alt={reference.name} sizes="(max-width:700px) 45vw, 24vw" />}</Link><div className={styles.productText}><p>{t('Befun · 3D 커스터마이저')}</p><h3><Link href={`/reference-product/${reference.id}`}>{reference.name}</Link></h3><Link href={`/reference-product/${reference.id}`} className={styles.referenceCardLink}>{t('3D 디자인 편집')} <FiArrowRight /></Link></div></article>;
      }),
      ...(isSofa || accessories ? [] : filtered).map(product => <ProductCard key={product.id} product={product} saved={saved.includes(product.id)} toggleSaved={() => toggleSaved(product.id)} open={() => router.push(productHref(product))} plp />),
    ]} /> : hasReferences ? <ReferenceCatalogCards category={slug} /> : isSofa || (!slug && query.productLines === '9') ? <><p className={styles.referenceNotice}>Tylko 소파 컬렉션 레퍼런스입니다. Befun의 주문 가능한 상품은 맞춤 수납 가구입니다.</p><div className={styles.editorialGrid}>{referenceProducts.filter(p => !['two_seater','three_seater'].includes(slug) || p.category === slug).map(p => <article key={p.id} className={styles.editorialCard}><Link href={`/sofa/${p.id}`} className={styles.lifeImage}><ProductCardImage key={p.id} thumbnail={(matches as Record<string, {thumbnail:string;studio:string}>)[p.id]?.thumbnail ?? asset(p.image)} studio={(matches as Record<string, {thumbnail:string;studio:string}>)[p.id]?.studio ?? asset(p.alternate)} alt={p.name} sizes="(max-width:700px) 90vw, 30vw" /></Link><h3>{p.name}</h3><p>{p.description}</p><Link className={`${styles.outlineButton} ${styles.smallButton}`} href={`/sofa/${p.id}`}>상세 보기 <FiArrowRight /></Link></article>)}</div></> : accessories ? <><p className={styles.pageLead}>가구와 함께 공간을 완성하는 텍스타일과 작은 오브제.</p><div className={styles.contentSplit}><div className={styles.editorialImage}><ReferenceImage source="https://media.tylko.com/cloudinary/homepage/lifeOfTylko/1/LD.webp" fallback="creator-3.avif" alt="컬러와 오브제가 어우러진 공간" sizes="50vw" /></div><div><h2>{title}</h2><p>원본 Tylko의 액세서리 컬렉션을 별도 페이지에서 확인할 수 있습니다. Befun 액세서리의 SKU와 판매 정보는 아직 등록되지 않았습니다.</p><a href={`https://tylko.com/en-uk/furniture-c/${slug}`} target="_blank" rel="noreferrer" className={styles.outlineButton}>원본 컬렉션 보기 <FiArrowRight /></a></div></div></> : <><p className={styles.resultCount}>{filtered.length}개의 수납 디자인</p><div className={styles.productGrid}>{filtered.slice(0,limit).map(product => <ProductCard key={product.id} product={product} saved={saved.includes(product.id)} toggleSaved={() => toggleSaved(product.id)} open={() => router.push(productHref(product))} />)}</div>{filtered.length === 0 ? <div className={styles.empty}><p>선택한 조건에 맞는 등록 디자인이 없습니다.</p><button className={styles.outlineButton} onClick={() => router.push(catalogHref(slug))}>필터 초기화</button><Link className={styles.darkButton} href="/configurator">직접 디자인하기</Link></div> : null}{filtered.length > limit ? <button className={`${styles.outlineButton} ${styles.smallButton}`} onClick={() => setLimit(limit + 12)}>더 보기</button> : null}<p className={styles.caption}>이미지는 디자인 레퍼런스입니다. 실제 주문 구성과 금액은 Befun 3D 커스터마이저에서 확인하세요.</p></>}
    <div className={styles.supportTiles}><Link className={styles.supportTile} href="/review-list"><h2>{t('공간을 위한 아이디어')}</h2><span>{t('커뮤니티 보기')} <FiArrowRight /></span></Link><Link className={styles.supportTile} href="/showrooms"><h2>{t('공간에서 만나보세요')}</h2><span>{t('쇼룸 보기')} <FiArrowRight /></span></Link><Link className={styles.supportTile} href="/material-samples"><h2>{t('소재와 색을 살펴보세요')}</h2><span>{t('소재 보기')} <FiArrowRight /></span></Link></div>
    {filterOpen ? <CatalogFilters query={query} count={draft => filterProducts(draft).length} close={() => setFilterOpen(false)} apply={draft => { const params = new URLSearchParams(draft); router.push(`${catalogHref(slug)}${params.size ? `?${params}` : ''}`, { scroll: false }); }} /> : null}
  </section>;
}
export function ProductPage({ product }: { product: CatalogProduct }) {
  return <><div id="configuration"><ProductConfigurator product={product} /></div><ProductDetails product={product} /></>;
}
export function ReferenceProductPage({ id }: { id: string }) {
  const product = referenceProducts.find(item=>item.id===id)!;
  return <section className={styles.pageSection}><Breadcrumbs title={product.name} /><div className={styles.detailLayout}><div className={styles.detailGallery}>{[product.image,product.alternate].map(image=><div className={styles.detailImage} key={image}><Image src={asset(image)} alt={product.name} fill sizes="60vw" /></div>)}</div><div className={styles.detailInfo}><p>Tylko Smooth · 레퍼런스 컬렉션</p><h1>{product.name}</h1><p>{product.description}</p><p className={styles.referenceNotice}>Befun에서 판매하는 상품이 아닙니다. 원본 상품의 소재·모듈·구매 옵션은 Tylko에서 확인하세요.</p><a href={product.source} target="_blank" rel="noreferrer" className={styles.darkButton}>원본 상품 보기 <FiArrowRight /></a><Link href="/furniture-c" className={styles.outlineButton}>Befun 수납 가구 보기</Link></div></div></section>;
}
export function SearchPage({ initialQuery = '', wishlist = false }: { initialQuery?: string; wishlist?: boolean }) {
  const router = useRouter();
  const {saved,toggleSaved} = useSavedProducts();
  const [search,setSearch] = useState(initialQuery);
  const matches=products.filter(product=> wishlist ? saved.includes(product.id) : `${product.name} ${product.category} ${product.collection}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className={styles.pageSection}><Breadcrumbs title={wishlist?'즐겨찾기':'제품 검색'} /><h1>{wishlist?'좋아하는 디자인을 한곳에':'어떤 가구를 찾으세요?'}</h1>{!wishlist ? <form onSubmit={e=>{e.preventDefault();router.replace(`/search?q=${encodeURIComponent(search)}`,{scroll:false});}}><label className={styles.searchField}><FiSearch /><input type="search" name="q" aria-label="제품 검색어" placeholder="책장, 수납장, 컬러로 검색하세요" value={search} onChange={e=>setSearch(e.target.value)} /><button type="submit" aria-label="검색"><FiArrowRight /></button></label></form> : null}<p className={styles.resultCount}>{matches.length}개의 디자인</p><div className={styles.productGrid}>{matches.map(product=><ProductCard key={product.id} product={product} saved={saved.includes(product.id)} toggleSaved={()=>toggleSaved(product.id)} open={()=>router.push(productHref(product))} />)}</div>{!matches.length ? <div className={styles.empty}><FiHeart /><p>{wishlist?'마음에 드는 디자인의 하트를 눌러 저장하세요.':'검색 조건에 맞는 디자인이 없습니다.'}</p><Link href="/furniture-c" className={styles.darkButton}>모든 디자인 보기</Link></div>:null}</section>;
}

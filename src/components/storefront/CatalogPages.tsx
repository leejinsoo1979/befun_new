'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiHeart, FiSearch, FiSliders, FiSave, FiLayers, FiGrid, FiDroplet } from 'react-icons/fi';
import { asset, products, referenceProducts, productPrice, type CatalogProduct } from './catalog';
import { catalogCategories, catalogHref, categoryLinks } from './navigation';
import { Carousel, Dialog, ProductCard, ReferenceImage, productHref } from './StorefrontUI';
import { useSavedProducts } from './useSavedProducts';
import { ProductConfigurator, ProductSpecifications } from './ProductConfigurator';
import { JoinSection } from './JoinSection';
import { CatalogFilters, filterColors } from './CatalogFilters';
import { productGalleries } from './productGalleries';
import { ReferenceCatalogCards } from './ReferenceCatalogPages';
import { categoryReferences } from './referenceCatalog';
import styles from './storefront.module.css';

const lines = ['ORIGINAL CLASIC', 'ORIGINAL MODERN', 'EDGE', 'TONE', 'SMOOTH'];
const lineNames = ['Original Classic', 'Original Modern', 'Edge', 'Tone', 'Smooth'];
const lineIds = ['3', '6', '7', '8', '9'];
const sofaSlugs = ['sofas', 'two_seater', 'three_seater', 'four_plus_seater', 'chaise_longues', 'corner_sofas', 'armchairs', 'ottomans_and_modules', 'covers'];
const directCategories: Record<string, string[]> = { sideboard: ['수납장'], bookcase: ['책장'], wallstorage: ['월 수납장'], 'tv-stand': ['TV 스탠드'], storage: ['수납장', '월 수납장', '책장', 'TV 스탠드'], wardrobe: ['월 수납장'], wallunits: ['월 수납장'], 'chest-of-drawers': ['수납장'], bedside_table: ['수납장'], desk: ['수납장'], dressing_table: ['수납장'], shoerack: ['수납장'], vinyl_storage: ['수납장', '책장'] };
export function Breadcrumbs({ title }: { title: string }) { return <nav className={styles.breadcrumbs} aria-label="현재 위치"><Link href="/">홈</Link><span>/</span><Link href="/furniture-c">모든 제품</Link><span>/</span><span>{title}</span></nav>; }
export function CatalogPage({ slug = '', query }: { slug?: string; query: Record<string, string> }) {
  const router = useRouter();
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
  return <section className={styles.pageSection}><Breadcrumbs title={title} /><h1>{query.additional === 'topSeller' ? '베스트셀러' : query.additional === 'newArrival' ? '새로운 디자인' : title}</h1>
    {!slug ? <div className={styles.lineCovers}>{lines.map((line, index) => <Link key={line} className={styles.lineCover} href={`/furniture-c?productLines=${lineIds[index]}`}><ReferenceImage source={`https://media.tylko.com/cloudinary/w_0.5/plp/category-product-lines-covers_new/ALL%20PRODUCTS/${encodeURIComponent(line)}/XLD.webp`} fallback={['storage.avif', 'wardrobe.avif', 'creator-9.avif', 'tone.avif', 'sofa.avif'][index]} alt={lineNames[index]} sizes="368px" /><div><h2>{lineNames[index]}</h2><p>{['자연스러운 합판의 대비', '대담한 컬러와 현대적인 형태', '수직선으로 만드는 리듬', '차분하고 간결한 디자인', '곡선과 모듈의 편안함'][index]}</p><span><FiArrowRight /></span></div></Link>)}</div> : null}
    <nav className={styles.illustratedCategories} aria-label="컬렉션 종류">{[['수납 가구', 'storage', 'storage', 'storage.avif'], ['옷장', 'wardrobe', 'wardrobe', 'wardrobe.avif'], ['소파', 'sofas', 'sofa', 'sofa.avif'], ['액세서리', 'accessories', 'accessories', 'creator-3.avif']].map(([name, key, image, fallback]) => <Link key={key} href={catalogHref(key)} aria-current={slug === key ? 'page' : undefined}><div><ReferenceImage source={`https://media.tylko.com/cloudinary/plp/category-icons/${image}/A.webp`} fallback={fallback} alt={name} sizes="112px" /></div><span>{name}</span></Link>)}</nav>
    {slug ? <nav className={styles.catalogTabs} aria-label="제품 종류">{categoryLinks.map(([name, key]) => <Link key={key} href={catalogHref(key)} aria-current={slug === key ? 'page' : undefined}>{name}</Link>)}</nav> : null}
    {!hasReferences ? <div className={styles.filterBar}><div className={styles.colorFilterStrip}><span>컬러</span><div className={styles.swatches} role="group" aria-label="컬러 필터">{filterColors.slice(0, 6).map(([value, name, hex]) => <button key={value} title={name} aria-label={`${name} 필터`} aria-pressed={query.colors === value} className={query.colors === value ? styles.swatchSelected : ''} style={{ background: hex }} onClick={() => updateFilter('colors', query.colors === value ? '' : value)} />)}<button className={styles.moreColors} onClick={() => setFilterOpen(true)}>더 보기</button></div></div><button className={`${styles.outlineButton} ${styles.smallButton}`} onClick={() => setFilterOpen(true)}>모든 필터 <FiSliders /></button></div> : null}
    {query.color || query.colors || query.material || query.types || query.productLines ? <div className={styles.filterTabs}><button onClick={() => router.push(catalogHref(slug), {scroll: false})}>필터 초기화 ×</button></div> : null}
    {hasReferences ? <ReferenceCatalogCards category={slug} /> : isSofa || (!slug && query.productLines === '9') ? <><p className={styles.referenceNotice}>Tylko 소파 컬렉션 레퍼런스입니다. Befun의 주문 가능한 상품은 맞춤 수납 가구입니다.</p><div className={styles.editorialGrid}>{referenceProducts.filter(p => !['two_seater','three_seater'].includes(slug) || p.category === slug).map(p => <article key={p.id} className={styles.editorialCard}><Link href={`/sofa/${p.id}`} className={styles.lifeImage}><Image src={asset(p.image)} alt={p.name} fill sizes="(max-width:700px) 90vw, 30vw" className={styles.productMainImage} /></Link><h3>{p.name}</h3><p>{p.description}</p><Link className={`${styles.outlineButton} ${styles.smallButton}`} href={`/sofa/${p.id}`}>상세 보기 <FiArrowRight /></Link></article>)}</div></> : accessories ? <><p className={styles.pageLead}>가구와 함께 공간을 완성하는 텍스타일과 작은 오브제.</p><div className={styles.contentSplit}><div className={styles.editorialImage}><ReferenceImage source="https://media.tylko.com/cloudinary/homepage/lifeOfTylko/1/LD.webp" fallback="creator-3.avif" alt="컬러와 오브제가 어우러진 공간" sizes="50vw" /></div><div><h2>{title}</h2><p>원본 Tylko의 액세서리 컬렉션을 별도 페이지에서 확인할 수 있습니다. Befun 액세서리의 SKU와 판매 정보는 아직 등록되지 않았습니다.</p><a href={`https://tylko.com/en-uk/furniture-c/${slug}`} target="_blank" rel="noreferrer" className={styles.outlineButton}>원본 컬렉션 보기 <FiArrowRight /></a></div></div></> : <><p className={styles.resultCount}>{filtered.length}개의 수납 디자인</p><div className={styles.productGrid}>{filtered.slice(0,limit).map(product => <ProductCard key={product.id} product={product} saved={saved.includes(product.id)} toggleSaved={() => toggleSaved(product.id)} open={() => router.push(productHref(product))} />)}</div>{filtered.length === 0 ? <div className={styles.empty}><p>선택한 조건에 맞는 등록 디자인이 없습니다.</p><button className={styles.outlineButton} onClick={() => router.push(catalogHref(slug))}>필터 초기화</button><Link className={styles.darkButton} href="/configurator">직접 디자인하기</Link></div> : null}{filtered.length > limit ? <button className={`${styles.outlineButton} ${styles.smallButton}`} onClick={() => setLimit(limit + 12)}>더 보기</button> : null}<p className={styles.caption}>이미지는 디자인 레퍼런스입니다. 실제 주문 구성과 금액은 Befun 3D 커스터마이저에서 확인하세요.</p></>}
    <div className={styles.supportTiles}><Link className={styles.supportTile} href="/review-list"><h2>공간을 위한 아이디어</h2><span>커뮤니티 보기 <FiArrowRight /></span></Link><Link className={styles.supportTile} href="/showrooms"><h2>공간에서 만나보세요</h2><span>쇼룸 보기 <FiArrowRight /></span></Link><Link className={styles.supportTile} href="/material-samples"><h2>소재와 색을 살펴보세요</h2><span>소재 보기 <FiArrowRight /></span></Link></div>
    {filterOpen ? <CatalogFilters query={query} count={draft => filterProducts(draft).length} close={() => setFilterOpen(false)} apply={draft => { const params = new URLSearchParams(draft); router.push(`${catalogHref(slug)}${params.size ? `?${params}` : ''}`, { scroll: false }); }} /> : null}
  </section>;
}
export function ProductPage({ product }: { product: CatalogProduct }) {
  const router = useRouter();
  const { saved, toggleSaved } = useSavedProducts();
  const [zoom, setZoom] = useState<string | null>(null);
  const gallery = productGalleries[product.id] ?? [asset(product.image), asset(product.alternate)];
  return <>
    <ProductConfigurator product={product} />
    <section className={`${styles.section} ${styles.productIntroduction}`}>
      <h2>{product.name}</h2><p>{product.collection} · 크기와 컬러, 수납 방식을 직접 바꿔보세요.</p>
      <div className={styles.productBenefits}>{[
        { title: '크기를 직접 조절', text: '공간에 맞는 너비와 높이', icon: FiSliders, href: '/configurator-intro' },
        { title: '컬러와 마감 선택', text: '취향에 맞는 색과 소재', icon: FiDroplet, href: '/material-samples' },
        { title: '다양한 선반 스타일', text: '여섯 가지 형태로 시작', icon: FiGrid, href: '/product-lines' },
        { title: '나만의 수납 구성', text: '오픈 선반과 도어·서랍', icon: FiLayers, href: '/faq' },
        { title: '디자인 저장과 공유', text: '완성한 구성을 링크로', icon: FiSave, href: '/faq' },
      ].map(({title, text, icon: Icon, href}) => <Link key={title} href={href}><Icon /><div><h3>{title}</h3><p>{text}</p><span>더 알아보기</span></div></Link>)}</div>
      <div className={styles.productPhotoGrid}>{gallery.map((image, index) => <button key={image} onClick={() => setZoom(image)} aria-label={`상품 이미지 ${index + 1} 크게 보기`}><ReferenceImage source={image} fallback={index % 2 ? product.alternate : product.image} alt={`${product.name} 디자인 레퍼런스 ${index + 1}`} sizes="(max-width:700px) 90vw, 45vw" /></button>)}</div>
      <p className={styles.caption}>사진은 Tylko 디자인 레퍼런스입니다. 선택한 Befun 구성은 위의 3D 화면에 표시됩니다.</p>
    </section>
    <ProductSpecifications />
    <section className={styles.section}><h2>공간에 맞게, 취향에 맞게</h2><Carousel label="디자인 특징">{[
      ['크기는 공간에 맞춰', '너비와 행 높이, 깊이를 조절해 원하는 크기를 만드세요.', '3/3AP/3AP', 'step-1.avif'],
      ['좋아하는 색으로', '컬러와 마감을 바꾸며 공간에 어울리는 조합을 찾아보세요.', '5/5AP/5AP', 'step-2.avif'],
      ['보여주거나, 담아두거나', '오픈 선반과 도어, 서랍으로 수납 방식을 조절하세요.', '6/6AP1/6AP1', 'step-3.avif'],
    ].map(([title, description, image, fallback]) => <article key={title} className={styles.productHighlight}><div><ReferenceImage source={`https://media.tylko.com/cloudinary/pdp/section-highlights-carousel/AP/${image}.webp`} fallback={fallback} alt={title} sizes="(max-width:700px) 85vw, 30vw" /></div><h3>{title}</h3><p>{description}</p></article>)}</Carousel></section>
    <section className={`${styles.section} ${styles.productConsultation}`}><h2>당신의 디자인을 완성하세요.</h2><p>선반의 크기와 구성을 정하기 어렵다면 함께 살펴보세요.</p><Link href="/contact" className={styles.darkButton}>상담하기 <FiArrowRight /></Link></section>
    <section className={styles.section}><h2>함께 둘러볼 디자인</h2><Carousel label="추천 디자인">{products.filter(item => item.id !== product.id).map(item => <ProductCard key={item.id} product={item} saved={saved.includes(item.id)} toggleSaved={() => toggleSaved(item.id)} open={() => router.push(productHref(item))} />)}</Carousel></section>
    <section className={styles.section}><div className={styles.supportTiles}><Link className={styles.supportTile} href="/showrooms"><h2>공간에서 만나보세요</h2><span>쇼룸 보기 <FiArrowRight /></span></Link><Link className={styles.supportTile} href="/material-samples"><h2>소재와 색을 살펴보세요</h2><span>소재 보기 <FiArrowRight /></span></Link><Link className={styles.supportTile} href="/inspirations"><h2>취향을 발견하세요</h2><span>커뮤니티 보기 <FiArrowRight /></span></Link></div></section>
    <JoinSection />
    {zoom ? <Dialog title={product.name} close={() => setZoom(null)}><div className={styles.detailImage}><ReferenceImage source={zoom} fallback={product.image} alt={product.name} sizes="800px" /></div></Dialog> : null}
  </>;
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

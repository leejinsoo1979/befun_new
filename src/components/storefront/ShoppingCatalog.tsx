'use client';

import Image from 'next/image';
import { CollectionDialog, collectionConfigureHref, type CollectionName } from './CollectionDialog';
import Link from 'next/link';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiArrowRight, FiHeart, FiSliders, FiX } from 'react-icons/fi';
import headers from '@/lib/shopping-catalog/headers.json';
import { filterShopping, lineCodes, shoppingColors } from '@/lib/shopping-catalog/filters';
import type { ShoppingItem, ShoppingVariant } from '@/lib/shopping-catalog/types';
import { localizedProductName, localizedProductType } from '@/lib/catalog-expansion/names';
import { sofaProductName } from '@/lib/sofa-catalog/names';
import { useLocale } from '@/lib/commerce/useLocale';
import { eurToMarket } from '@/lib/commerce/eur-quote';
import { formatMoney } from '@/lib/commerce/markets';
import { catalogCategories, catalogHref } from './navigation';
import { downloadedItemHref } from './DownloadedCatalog';
import { categoryConfiguratorHref } from '@/lib/catalog-entry/category-targets';
import { ProductCardImage } from './ProductCardImage';
import { useSavedProducts } from './useSavedProducts';
import { Carousel, Dialog } from './StorefrontUI';
import { JoinSection } from './JoinSection';
import base from './all-sofas.module.css';
import styles from './shopping-catalog.module.css';

const groups: Record<string, string[]> = {
  storage: ['sideboard', 'bookcase', 'wallstorage', 'wallunits', 'desk', 'tv-stand', 'chest-of-drawers', 'dressing_table', 'shoerack', 'bedside_table', 'vinyl_storage'],
  sofas: ['two_seater', 'three_seater', 'four_plus_seater', 'corner_sofas', 'modular_sofas', 'armchairs', 'ottomans_and_modules', 'covers'],
  accessories: ['blankets', 'bookends'],
};
const parentFor = (slug: string) => Object.entries(groups).find(([, children]) => children.includes(slug))?.[0] ?? (slug === 'chaise_longues' ? 'sofas' : '');
const wardrobeTypes = [['fullyClosed', '닫힌 형태'], ['partiallyOpen', '부분 오픈 형태'], ['fullyOpen', '오픈 형태']] as const;
const lineCopy: Record<string, string> = { 'Original Classic': '자연스러운 합판의 대비', 'Original Modern': '대담한 컬러와 현대적인 형태', Edge: '수직선으로 만드는 리듬', Tone: '차분하고 간결한 디자인', Uff: '둥근 형태, 모듈 구성', Smooth: '곡선과 모듈의 편안함' };
export const shoppingSavedId = (key: string) => `catalog:${key}`;
const productName = (item: ShoppingVariant, language: 'ko' | 'en' | 'ja') => /,(s|sotty)$/.test(item.productKey) ? sofaProductName(item.name, language) : localizedProductName(item.name, language);

export function ShoppingCard({ item }: { item: ShoppingItem }) {
  const { language, market, t } = useLocale();
  const [selected, setSelected] = useState<ShoppingVariant>(item);
  const { saved, toggleSaved } = useSavedProducts();
  const name = productName(selected, language);
  const d = selected.details;
  const liked = saved.includes(shoppingSavedId(selected.productKey));
  const href = downloadedItemHref(selected);
  const variants = [item, ...item.variants];
  return <article className={base.card} data-product-key={selected.productKey}>
    <div className={base.visual}>
      <Link href={href} className={base.photo} aria-label={name}><ProductCardImage key={selected.thumbnail} thumbnail={selected.thumbnail} studio={selected.studio} alt={name} sizes="(max-width:700px) 46vw, (max-width:1100px) 29vw, 22vw" /></Link>
      {d?.badges.some(b => b === 'new' || b === 'top_seller') && <span className={`${base.badge} ${d.badges.includes('new') ? '' : base.bestseller}`}>{t(d.badges.includes('new') ? '신제품' : '베스트셀러')}</span>}
      <button className={base.heart} aria-label={t('디자인 찜')} aria-pressed={liked} onClick={() => toggleSaved(shoppingSavedId(selected.productKey))}><FiHeart fill={liked ? 'currentColor' : 'none'} /></button>
    </div>
    {variants.length > 1 && <div className={base.swatches} role="group" aria-label={t('색상')}>
      {variants.map(v => <button key={v.productKey} onClick={() => setSelected(v)} aria-label={productName(v, language)} title={productName(v, language)} aria-pressed={v.productKey === selected.productKey}><Image src={v.thumbnail} alt="" width={64} height={54} sizes="64px" loading="lazy" /></button>)}
    </div>}
    <Link className={`${base.description} ${styles.description}`} href={href}><span className={base.model}>{d?.line || localizedProductType(selected.name, language)}</span><h3>{name}</h3></Link>
    <div className={base.cardBottom}><span>{d ? formatMoney(eurToMarket(d.eur, market), market) : t('디자인 레퍼런스')}</span><Link className={styles.customise} href={href}><span className={base.dots}>●</span>{t(selected.editorHref ? '3D 디자인 편집' : '상세 보기')}</Link></div>
  </article>;
}

function Filters({ items, query, close, apply, lines }: { items: ShoppingItem[]; query: Record<string, string>; close: () => void; apply: (q: Record<string, string>) => void; lines: string[] }) {
  const { t } = useLocale();
  const [draft, setDraft] = useState(query);
  const toggle = (key: string, value: string) => setDraft(current => {
    const values = (current[key] || '').split(',').filter(Boolean);
    const next = values.includes(value) ? values.filter(v => v !== value) : [...values, value];
    return { ...current, [key]: next.join(',') };
  });
  const availableStyles = Array.from(new Set(items.map(i => i.details?.style).filter((s): s is string => !!s && /^(grid|gradient|pattern|frame|mosaic|pixel|slant)$/i.test(s))));
  return <Dialog title={t('모든 필터')} close={close} drawer><div className={base.filterForm}>
    <label>{t('정렬')}<select value={draft.sort || 'recommended'} onChange={e => setDraft({ ...draft, sort: e.target.value })}><option value="recommended">{t('추천순')}</option><option value="price-asc">{t('낮은 가격순')}</option><option value="price-desc">{t('높은 가격순')}</option></select></label>
    {lines.length > 0 && <fieldset><legend>{t('컬렉션')}</legend>{lines.map(line => <button key={line} aria-pressed={(draft.productLines || '').split(',').includes(lineCodes[line])} onClick={() => toggle('productLines', lineCodes[line])}>{line}</button>)}</fieldset>}
    <fieldset><legend>{t('컬러')}</legend>{shoppingColors.map(([key, name, hex]) => <button key={key} aria-pressed={(draft.colors || '').split(',').includes(key)} onClick={() => toggle('colors', key)}><i style={{ background: hex }} />{t(name)}</button>)}</fieldset>
    {availableStyles.length > 0 && <fieldset><legend>{t('스타일')}</legend>{availableStyles.map(style => <button key={style} aria-pressed={(draft.styles || '').split(',').includes(style.toLowerCase())} onClick={() => toggle('styles', style.toLowerCase())}>{style}</button>)}</fieldset>}
    {(['width', 'height', 'depth'] as const).map((dimension, index) => {
      const max = Math.ceil(Math.max(...items.map(item => item.details?.[dimension] || 0)) / 10);
      return max > 0 ? <label key={dimension}>{t(['최대 너비', '최대 높이', '최대 깊이'][index])} · {draft[`${dimension}Max`] || max} cm<input type="range" min={1} max={max} value={draft[`${dimension}Max`] || max} onChange={e => setDraft({ ...draft, [`${dimension}Max`]: e.target.value })} /></label> : null;
    })}
    <div className={styles.filterActions}><button className={base.outline} onClick={() => setDraft(Object.fromEntries(Object.entries(query).filter(([k]) => ['types', 'features'].includes(k))))}>{t('초기화')}</button><button className={base.primary} onClick={() => { apply(draft); close(); }}>{filterShopping(items, draft).length}{t('개 디자인 보기')}</button></div>
  </div></Dialog>;
}

export default function ShoppingCatalog({ slug, query, items, recommendations = [] }: { slug: string; query: Record<string, string>; items: ShoppingItem[]; recommendations?: ShoppingItem[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [collection, setCollection] = useState<CollectionName | null>(null);
  const [shown, setShown] = useState(32);
  const coverRef = useRef<HTMLDivElement>(null);
  const [coverEdges, setCoverEdges] = useState({ previous: false, next: false });
  useEffect(() => {
    const track = coverRef.current;
    if (!track) return;
    const update = () => setCoverEdges({
      previous: track.scrollLeft > 2,
      next: track.scrollLeft + track.clientWidth < track.scrollWidth - 2,
    });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener('scroll', update, { passive: true });
    update();
    return () => { observer.disconnect(); track.removeEventListener('scroll', update); };
  }, [slug]);
  const moveCover = (direction: number) => {
    const track = coverRef.current;
    const first = track?.firstElementChild;
    if (!track || !first) return;
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || '0');
    track.scrollBy({ left: direction * step, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const parent = parentFor(slug);
  const isSofa = parent === 'sofas';
  const accessories = slug === 'accessories' || parent === 'accessories';
  const banners = (headers as Record<string, { name: string; image: string }[]>)[slug === 'chaise_longues' ? 'two_seater' : slug] || [];
  const filtered = filterShopping(items, query);
  const selectedFilters = Object.entries(query).filter(([key, value]) => !!value && !['types', 'features'].includes(key));
  const navigate = (next: Record<string, string>) => {
    const params = new URLSearchParams(Object.entries(next).filter(([, value]) => !!value));
    router.push(`${catalogHref(slug)}${params.size ? `?${params}` : ''}`, { scroll: false });
    setShown(32);
  };
  const toggle = (key: string, value: string) => navigate({ ...query, [key]: query[key] === value ? '' : value });
  const title = query.additional === 'topSeller' ? '베스트셀러' : query.additional === 'newArrival' ? '신제품' : catalogCategories[slug] || '모든 제품';
  const categories = slug === '' ? ['storage', 'wardrobe', 'sofas', 'accessories'] : groups[slug] || [];
  const video = slug === 'wardrobe' ? 'wardrobes' : isSofa ? 'sofas' : 'storage';
  const configureHref = isSofa ? '/sofa-configurator' : categoryConfiguratorHref(slug, query.productLines);
  const showConfigure = !selectedFilters.some(([key]) => key !== 'productLines');
  const quickColors = shoppingColors.filter(([key]) => ['white', 'black', 'grey', 'blue', 'pink', slug === 'wardrobe' ? 'wooden' : accessories || isSofa ? 'yellow' : 'purple'].includes(key));
  const styleNames = ['Grid', 'Gradient', 'Pattern', 'Frame', 'Mosaic', 'Pixel'];
  const showStyles = (parent === 'storage' || slug === 'storage') && !['desk', 'dressing_table'].includes(slug);
  const editorial = [
    { at: 6, title: '소재와 색을 살펴보세요', text: '공간에 어울리는 마감과 컬러를 찾아보세요.', cta: '소재 보기', href: '/material-samples', image: '/imgs/product-discovery/materials.avif' },
    { at: 15, title: '공간에서 만나보세요', text: '가구와 함께 완성되는 공간을 살펴보세요.', cta: '쇼룸 보기', href: '/showrooms', image: '/imgs/editorial-korea/storage-living-selected.webp', imagePosition: 'center top' },
  ];
  return <><section className={`${base.page} ${styles.page}`}>
    <nav className={base.breadcrumb} aria-label={t('현재 위치')}><Link href="/furniture-c">{t('모든 제품')}</Link>{parent && <><span>▪</span><Link href={catalogHref(parent)}>{t(catalogCategories[parent])}</Link></>}{slug && <><span>▪</span><span aria-current="page">{t(catalogCategories[slug])}</span></>}</nav>
    <h1>{t(title)}</h1>
    {!!banners.length && <div className={`${styles.coverWrap} ${banners.length > 4 ? styles.coverOverflow : ''}`}><div ref={coverRef} className={`${styles.covers} ${banners.length <= 2 ? styles.wide : ''}`}>
      {banners.map(b => <button key={b.name} className={styles.cover} aria-haspopup="dialog" onClick={() => setCollection(b.name as CollectionName)}><Image src={b.image} alt="" fill sizes={banners.length <= 2 ? '(max-width:700px) 85vw, 44vw' : '(max-width:700px) 75vw, 22vw'} /><div><h2>{b.name}</h2><p>{t(lineCopy[b.name] || '')}</p><span><FiArrowRight /></span></div></button>)}
    </div>{(coverEdges.previous || coverEdges.next) && <div className={styles.coverArrows}><button disabled={!coverEdges.previous} aria-label={t('이전 컬렉션')} onClick={() => moveCover(-1)}><FiArrowLeft /></button><button disabled={!coverEdges.next} aria-label={t('다음 컬렉션')} onClick={() => moveCover(1)}><FiArrowRight /></button></div>}</div>}
    {!!categories.length && <nav className={base.categories} aria-label={t('제품 종류')}>{categories.map(key => <Link key={key} href={catalogHref(key)}><Image src={`/imgs/storefront/category-icons/${key}.png`} alt="" width={100} height={64} sizes="100px" /><span>{t(catalogCategories[key])}</span></Link>)}</nav>}
    <div className={`${base.filterbar} ${styles.filterbar}`}>
      <div><span>{t('컬러')}</span><div className={base.colors}>{quickColors.map(([key, name, hex]) => <button key={key} style={{ background: hex }} title={t(name)} aria-label={`${t(name)} ${t('필터')}`} aria-pressed={query.colors === key} onClick={() => toggle('colors', key)} />)}<button className={base.moreColors} onClick={() => setFilterOpen(true)}>{t('더 보기')}</button></div></div>
      {showStyles && <div className={styles.quickFilter}><span>{t('스타일')}</span><div>{styleNames.map((style) => <button key={style} aria-pressed={query.styles === style.toLowerCase()} onClick={() => toggle('styles', style.toLowerCase())}>{style === 'Frame' ? <svg width="19" height="14" viewBox="0 0 24 16" aria-hidden="true"><path d="M1 1h22v14H1zM8 1v14M16 1v14M1 8h22" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg> : <Image src={`/imgs/icon/icon_${style.toLowerCase()}_black.svg`} alt="" width={19} height={14} />}{style}</button>)}</div></div>}
      {slug === 'wardrobe' && <div className={styles.quickFilter}><span>{t('유형')}</span><div>{wardrobeTypes.map(([key, name]) => <button key={key} aria-pressed={query.types === key} onClick={() => toggle('types', key)}>{t(name)}</button>)}</div></div>}
      <button className={base.outline} onClick={() => setFilterOpen(true)}>{t('모든 필터')}<FiSliders /></button>
    </div>
    {selectedFilters.length > 0 && <div className={styles.activeFilters}>{selectedFilters.map(([key, value]) => <button key={key} onClick={() => navigate({ ...query, [key]: '' })}>{key === 'colors' ? value.split(',').map(v => t(shoppingColors.find(c => c[0] === v)?.[1] || v)).join(', ') : key === 'productLines' ? value.split(',').map(v => Object.keys(lineCodes).find(k => lineCodes[k] === v)).join(', ') : key === 'sort' ? t(value === 'price-asc' ? '낮은 가격순' : value === 'price-desc' ? '높은 가격순' : '추천순') : key.endsWith('Max') ? `${t(key === 'widthMax' ? '최대 너비' : key === 'heightMax' ? '최대 높이' : '최대 깊이')} ${value} cm` : key === 'additional' ? t(value === 'newArrival' ? '신제품' : '베스트셀러') : value}<FiX /></button>)}<button onClick={() => navigate(Object.fromEntries(Object.entries(query).filter(([key]) => ['types', 'features'].includes(key))))}>{t('필터 초기화')}</button></div>}
    <p className={styles.count} aria-live="polite">{filtered.length}{t('개의 디자인')}</p>
    <div className={base.grid}>
      {!accessories && showConfigure && <Link href={configureHref} className={base.configure}><Image src={`/videos/configure-yours-${video}-poster.webp`} alt="" fill sizes="(max-width:700px) 46vw, 22vw" /><video src={`/videos/configure-yours-${video}.mp4`} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" /><div><span>{t('당신이 디자인해요')}</span><strong>{t('직접 만들기')}</strong></div><em>{t('시작하기')}</em></Link>}
      {filtered.slice(0, shown).map((item, index) => <Fragment key={`${item.productKey}:${JSON.stringify(query)}`}><ShoppingCard item={item} />{!accessories && !selectedFilters.length && editorial.filter(e => e.at === index).map(e => <Link className={base.editorial} key={e.href} href={e.href}><div><h2>{t(e.title)}</h2><p>{t(e.text)}</p><span>{t(e.cta)} ›</span></div><Image src={e.image} alt="" fill sizes="(max-width:700px) 46vw, 22vw" style={{ objectPosition: e.imagePosition }} /></Link>)}</Fragment>)}
    </div>
    {!filtered.length && <div className={base.empty}><p>{t('선택한 조건에 맞는 등록 디자인이 없습니다.')}</p><button className={base.outline} onClick={() => navigate({})}>{t('필터 초기화')}</button></div>}
    <div className={base.pagination}>{shown < filtered.length && <button className={base.outline} onClick={() => setShown(n => n + 32)}>{t('더 보기')}</button>}<small>{Math.min(shown, filtered.length)} / {filtered.length}</small></div>
    <p className={styles.notice}>{t('표시 가격은 동일 상품의 유로 기준 참고 금액입니다. 주문 구성과 최종 금액은 커스터마이저에서 확인하세요.')}</p>
    {filterOpen && <Filters items={items} query={query} close={() => setFilterOpen(false)} apply={navigate} lines={banners.map(b => b.name)} />}
  </section>
    {!!recommendations.length && <section className={`${base.recommend} ${styles.recommend}`}><h2>{t('함께 살펴보세요')}</h2><Carousel label={t('추천 디자인')}>{recommendations.map(item => <ShoppingCard key={item.productKey} item={item} />)}</Carousel></section>}
    {collection && <CollectionDialog key={collection} name={collection} close={() => setCollection(null)} configureHref={collectionConfigureHref(collection, slug)} browse={() => { navigate({ ...query, productLines: lineCodes[collection] }); setCollection(null); }} />}
    <JoinSection />
  </>;
}

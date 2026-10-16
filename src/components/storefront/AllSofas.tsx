'use client';

import Image from 'next/image';
import { CollectionDialog, collectionConfigureHref } from './CollectionDialog';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import { FiArrowRight, FiHeart, FiSliders, FiX, FiGrid } from 'react-icons/fi';
import catalogue from '@/lib/sofa-catalog/catalog.json';
import editorialImages from '@/lib/sofa-catalog/editorial.json';
import { useLocale } from '@/lib/commerce/useLocale';
import { eurToMarket } from '@/lib/commerce/eur-quote';
import { formatMoney } from '@/lib/commerce/markets';
import { sofaProductName } from '@/lib/sofa-catalog/names';
import { catalogThumbnailStart } from '@/lib/catalog-entry/starts';
import { sofaFabric } from '@/lib/sofa/materials';
import { ProductCardImage } from './ProductCardImage';
import { useSavedProducts } from './useSavedProducts';
import { Dialog, Carousel, ProductCard, productHref } from './StorefrontUI';
import { products } from './catalog';
import { JoinSection } from './JoinSection';
import styles from './all-sofas.module.css';

type Sofa = typeof catalogue[number];
type Variant = Sofa['variants'][number];
const primaryIds = new Set(catalogue.map(p => p.id));
const additional: Sofa[] = [];
const included = new Set(primaryIds);
for (const p of catalogue) for (const v of p.variants) if (!included.has(v.id)) {
  included.add(v.id);
  additional.push({ ...p, id: v.id, lifestyleFirst: false });
}
const allDesigns = [...catalogue, ...additional];
const baseVariant = (p: Sofa) => p.variants.find(v => v.id === p.id)!;
const savedId = (id: number) => `sofa:${id}`;
const categories = [
  ['two_seater', '2인 소파', '2-seater sofas', '2人掛けソファ'],
  ['three_seater', '3인 소파', '3-seater sofas', '3人掛けソファ'],
  ['four_plus_seater', '대형 소파', 'Large sofas', '大型ソファ'],
  ['corner_sofas', '코너 소파', 'Corner sofas', 'コーナーソファ'],
  ['modular_sofas', '모듈형 소파', 'Modular sofas', 'モジュールソファ'],
  ['armchairs', '암체어', 'Armchairs', 'アームチェア'],
  ['ottomans_and_modules', '오토만·모듈', 'Ottomans & modules', 'オットマン・モジュール'],
  ['covers', '커버·쿠션', 'Covers & cushions', 'カバー・クッション'],
] as const;
const colors = [
  ['white', '#f6f4ef', '화이트', 'White', 'ホワイト', /weiß|weiss|perl|creme|salz|white|pearl|cream|salt/i],
  ['black', '#252525', '블랙', 'Black', 'ブラック', /kohle|graphit|basalt|tiefbraun|charcoal|anthracite|deep brown/i],
  ['grey', '#b1b2af', '그레이', 'Grey', 'グレー', /grau|austern|taupe|grey/i],
  ['brown', '#bd9f82', '베이지·브라운', 'Beige & brown', 'ベージュ・ブラウン', /beige|braun|mandel|brown|almond|walnut|cognac/i],
  ['pink', '#d1a6a6', '핑크', 'Pink', 'ピンク', /rosen|rosa|pflaume|rosewood|plum/i],
  ['yellow', '#d1b66b', '옐로', 'Yellow', 'イエロー', /gelb|zitron|yellow|lemon|mustard/i],
  ['green', '#7b8570', '그린', 'Green', 'グリーン', /grün|salbei|minze|green|sage|mint/i],
  ['blue', '#7f9cb8', '블루', 'Blue', 'ブルー', /blau|blue/i],
] as const;

export function savedSofaCount(saved: string[]) { return allDesigns.filter(p => saved.includes(savedId(p.id))).length; }

function SofaCard({ product, open }: { product: Sofa; open: (p: Sofa, v: Variant) => void }) {
  const { language, market } = useLocale();
  const [variant, setVariant] = useState(baseVariant(product));
  const { saved, toggleSaved } = useSavedProducts();
  const name = sofaProductName(variant.name, language);
  const selected = saved.includes(savedId(variant.id));
  const lifestyle = product.lifestyleFirst && variant.id === product.id;
  const text = (ko: string, en: string, ja: string) => language === 'ko' ? ko : language === 'ja' ? ja : en;
  return <article className={styles.card} data-sofa-id={variant.id}>
    <div className={styles.visual}>
      <button className={styles.photo} onClick={() => open(product, variant)} aria-label={`${name} ${text('상세 보기', 'View details', '詳細を見る')}`}>
        <ProductCardImage key={`${variant.id}-${lifestyle}`} thumbnail={lifestyle ? variant.studio : variant.image} studio={lifestyle ? variant.image : variant.studio} alt={name} sizes="(max-width:700px) 46vw, (max-width:1100px) 29vw, 22vw" />
      </button>
      {product.badge && <span className={`${styles.badge} ${product.badge === 'bestseller' ? styles.bestseller : ''}`}>{product.badge === 'bestseller' ? text('베스트셀러', 'Bestseller', 'ベストセラー') : text('신제품', 'New', '新商品')}</span>}
      <button className={styles.heart} aria-label={text('디자인 찜', 'Save design', 'お気に入り')} aria-pressed={selected} onClick={() => toggleSaved(savedId(variant.id))}><FiHeart fill={selected ? 'currentColor' : 'none'} /></button>
    </div>
    <div className={styles.swatches} role="group" aria-label={text('소파 색상', 'Sofa colours', 'ソファの色')}>
      {product.variants.map(v => <button key={v.id} onClick={() => setVariant(v)} aria-pressed={v.id === variant.id} title={sofaProductName(v.name, language)} aria-label={sofaProductName(v.name, language)}><Image src={v.thumbnail} alt="" width={64} height={54} sizes="64px" loading="lazy" /></button>)}
    </div>
    <button className={styles.description} onClick={() => open(product, variant)}><span className={styles.model}>{product.model === 'uff' ? 'Uff' : 'Smooth'}</span><h3>{name}</h3></button>
    <div className={styles.cardBottom}><span>{formatMoney(eurToMarket(variant.eur, market), market)}</span><button onClick={() => open(product, variant)}><span className={styles.dots}>●</span>{text('커스터마이징', 'Customise', 'カスタマイズ')}</button></div>
  </article>;
}

function SofaDetails({ item, close }: { item: { product: Sofa; variant: Variant }; close: () => void }) {
  const { language, market } = useLocale();
  const { product, variant } = item;
  const text = (ko: string, en: string, ja: string) => language === 'ko' ? ko : language === 'ja' ? ja : en;
  const exactStart = catalogThumbnailStart(`${variant.id},s`);
  const name = sofaProductName(variant.name, language);
  return <Dialog title={name} close={close}>
    <div className={styles.detailImages}>{[variant.image, variant.studio].map((src, i) => <div key={`${src}-${i}`}><Image src={src} fill alt={name} sizes="(max-width:700px) 85vw, 400px" /></div>)}</div>
    <div className={styles.detailInfo}><b>{product.model === 'uff' ? 'Uff' : 'Smooth'} · {formatMoney(eurToMarket(variant.eur, market), market)}</b><p>{product.width} × {product.depth} × {product.height} cm</p><p>{text('표시 가격은 동일 디자인의 독일 유로 기준 금액을 환산한 참고 견적입니다.', 'The displayed reference quote is converted from this design’s German EUR price.', '表示価格は同じデザインのドイツ・ユーロ価格を換算した参考見積です。')}</p>
    {!exactStart && <p>{text('사진 속 구성의 자동 불러오기는 아직 지원하지 않습니다. 같은 라인에서 새 디자인을 시작할 수 있습니다.', 'This photographed configuration cannot yet be loaded automatically. Start a new design in the same collection.', '写真の構成の自動読み込みは未対応です。同じラインで新しいデザインを作成できます。')}</p>}
    <Link className={styles.primary} href={exactStart?.href ?? `/sofa-configurator?model=${product.model}`}>{exactStart ? text('이 디자인 편집', 'Edit this design', 'このデザインを編集') : text('같은 라인으로 새 디자인', 'Start a new design', '新しいデザインを作成')} <FiArrowRight /></Link></div>
  </Dialog>;
}

export function SavedSofas() {
  const { saved } = useSavedProducts();
  const [detail, setDetail] = useState<{ product: Sofa; variant: Variant } | null>(null);
  return <><div className={styles.grid}>{allDesigns.filter(p => saved.includes(savedId(p.id))).map(p => <SofaCard key={p.id} product={p} open={(product, variant) => setDetail({ product, variant })} />)}</div>{detail && <SofaDetails item={detail} close={() => setDetail(null)} />}</>;
}

export default function AllSofas() {
  const { language, t } = useLocale();
  const { saved, toggleSaved } = useSavedProducts();
  const [color, setColor] = useState('');
  const [line, setLine] = useState('');
  const [collection, setCollection] = useState<'Uff' | 'Smooth' | null>(null);
  const [fabric, setFabric] = useState('');
  const [sort, setSort] = useState('recommended');
  const [limit, setLimit] = useState(32);
  const [filters, setFilters] = useState(false);
  const [detail, setDetail] = useState<{ product: Sofa; variant: Variant } | null>(null);
  const text = (ko: string, en: string, ja: string) => language === 'ko' ? ko : language === 'ja' ? ja : en;
  const langIndex = language === 'ko' ? 1 : language === 'ja' ? 3 : 2;
  const colorIndex = language === 'ko' ? 2 : language === 'ja' ? 4 : 3;
  const active = Boolean(color || line || fabric || sort !== 'recommended');
  const filtered = allDesigns.filter(p => (!line || p.model === line) && (!color || colors.find(c => c[0] === color)![5].test(baseVariant(p).name)) && (!fabric || sofaFabric(baseVariant(p).material, p.model as 'uff' | 'smooth')?.id === fabric));
  if (sort !== 'recommended') filtered.sort((a, b) => (baseVariant(a).eur - baseVariant(b).eur) * (sort === 'ascending' ? 1 : -1));
  const reset = () => { setColor(''); setLine(''); setFabric(''); setSort('recommended'); setLimit(32); };
  const promos = [
    { at: 6, image: editorialImages[0], title: text('소파 원단을 만나보세요', 'Meet your sofa fabric', 'ソファ生地を体験'), body: text('집에서 색상과 촉감을 직접 확인하세요.', 'Explore colour and texture in your own home.', 'ご自宅で色と質感をご確認ください。'), href: '/material-samples' },
    { at: 10, image: editorialImages[1], title: 'Uff Sofa:', body: text('새롭게 만나는 편안함', 'Your new favourite feeling', '新しい心地よさ'), href: '/sofa-configurator?model=uff', full: true },
    { at: 20, image: editorialImages[2], title: text('나에게 맞는 소파 디자인', 'Design your perfect sofa', '理想のソファをデザイン'), body: text('공간과 취향에 맞게 직접 구성하세요.', 'Make it fit your room, your style, and you.', '空間と好みに合わせて。'), href: '/sofa-configurator?model=smooth' },
    { at: 24, image: editorialImages[3], title: text('편안함을 오래도록', 'Comfort that stays', 'ずっと続く心地よさ'), body: text('구매 전 배송·교환·반품 안내를 확인하세요.', 'Explore delivery, exchange and return information.', '配送・交換・返品についてご確認ください。'), href: '/faq' },
  ];
  return <>
    <section className={styles.page}>
      <nav className={styles.breadcrumb}><Link href="/furniture-c">{t('모든 제품')}</Link><span>·</span><span>{t('소파')}</span></nav>
      <h1>{t('소파')}</h1>
      <div className={styles.collections}>{(['uff', 'smooth'] as const).map(model => <button key={model} type="button" aria-haspopup="dialog" onClick={() => setCollection(model === 'uff' ? 'Uff' : 'Smooth')}><Image src={`/imgs/storefront/sofa-collections/${model}.webp`} alt="" fill sizes="(max-width:700px) 85vw, 44vw" priority /><div><h2>{model === 'uff' ? 'Uff' : 'Smooth'}</h2><p>{model === 'uff' ? text('둥근 형태, 자유로운 모듈 구성', 'Round shapes, modular fit', '丸いフォルム、自由なモジュール') : text('모듈로 완성하는 부드러운 편안함', 'Modular seating, rounded comfort', 'モジュールでつくる心地よさ')}</p><span><FiArrowRight /></span></div></button>)}</div>
      <nav className={styles.categories} aria-label={text('소파 종류', 'Sofa types', 'ソファの種類')}>{categories.map(c => <Link key={c[0]} href={`/furniture-c/${c[0]}`}><small>{text('신제품', 'New', '新商品')}</small><Image src={`/imgs/storefront/category-icons/${c[0]}.png`} alt="" width={100} height={64} /><span>{c[langIndex]}</span></Link>)}</nav>
      <div className={styles.filterbar}><div><span>{t('컬러')}</span><div className={styles.colors}>{colors.slice(0, 6).map(c => <button key={c[0]} style={{ background: c[1] }} title={c[colorIndex]} aria-label={c[colorIndex]} aria-pressed={color === c[0]} onClick={() => { setColor(color === c[0] ? '' : c[0]); setLimit(32); }} />)}<button className={styles.moreColors} onClick={() => setFilters(true)}>{t('더 보기')}</button></div></div><button className={styles.outline} onClick={() => setFilters(true)}>{t('모든 필터')} <FiSliders /></button></div>
      {active && <div className={styles.filterStatus}><span>{filtered.length} {text('개의 디자인', 'designs', 'デザイン')}</span><button onClick={reset}>{t('필터 초기화')} <FiX /></button></div>}
      <div className={styles.grid}>
        {!active && <Link href="/sofa-configurator" className={styles.configure}><Image src="/videos/configure-yours-sofas-poster.webp" alt="" fill sizes="(max-width:700px) 46vw, 22vw" /><video src="/videos/configure-yours-sofas.mp4" poster="/videos/configure-yours-sofas-poster.webp" autoPlay muted loop playsInline preload="metadata" /><div><span>{text('당신이 디자인해요', 'You design it', 'あなたがデザイン')}</span><strong>{text('지금\n디자인하기', 'Configure\nyours', '自分だけの\nソファを')}</strong></div><em>{text('시작하기', 'Get started', '始める')}</em></Link>}
        {filtered.slice(0, limit).map((p, index) => <Fragment key={p.id}>{!active && promos.filter(promo => promo.at === index).map(promo => <Link key={promo.at} href={promo.href} className={`${styles.editorial} ${promo.full ? styles.fullEditorial : ''}`}><div><h2>{promo.title}</h2><p>{promo.body}</p>{!promo.full && <span>{text('자세히 보기', 'Discover more', '詳しく見る')} ›</span>}</div><Image src={promo.image} alt="" fill sizes="(max-width:700px) 46vw, 22vw" /></Link>)}<SofaCard product={p} open={(product, variant) => setDetail({ product, variant })} /></Fragment>)}
      </div>
      {!filtered.length && <div className={styles.empty}>{text('선택한 조건에 맞는 디자인이 없습니다.', 'No designs match your filters.', '条件に合うデザインがありません。')}<button className={styles.outline} onClick={reset}>{t('필터 초기화')}</button></div>}
      <div className={styles.pagination}>{filtered.length > limit && <button className={styles.outline} onClick={() => setLimit(limit + 32)}>{text('더 많은 소파 보기', 'Show more sofas', 'もっと見る')}</button>}<small>{Math.min(limit, filtered.length)} / {filtered.length} {text('디자인', 'designs', 'デザイン')}</small></div>
    </section>
    <section className={styles.recommend}><h2>{text('함께 둘러보세요', 'Recommended for you', 'おすすめの家具')}</h2><Carousel label={text('추천 가구', 'Recommended furniture', 'おすすめの家具')}>{products.slice(0, 6).map(p => <ProductCard key={p.id} product={p} saved={saved.includes(p.id)} toggleSaved={() => toggleSaved(p.id)} open={() => { window.location.href = productHref(p); }} plp />)}</Carousel></section>
    <p className={styles.intro}>{text('혼자 편하게 쉬는 시간부터 함께 모이는 순간까지. 나의 생활과 공간에 맞는 모듈형 소파를 디자인하세요.', 'From quiet moments to a full house, design a modular sofa that fits your space and the way you live.', '一人でくつろぐ時間も、みんなで集まる瞬間も。暮らしと空間に合うモジュールソファを。')}</p>
    {collection && <CollectionDialog key={collection} name={collection} close={() => setCollection(null)} configureHref={collectionConfigureHref(collection)} browse={() => { setLine(collection.toLowerCase()); setLimit(32); setCollection(null); }} />}
    <JoinSection />
    {detail && <SofaDetails item={detail} close={() => setDetail(null)} />}
    {filters && <Dialog title={t('모든 필터')} close={() => setFilters(false)} drawer><div className={styles.filterForm}><fieldset><legend>{text('소파 라인', 'Collection', 'コレクション')}</legend>{['', 'uff', 'smooth'].map(v => <button key={v} aria-pressed={line === v} onClick={() => { setLine(v); setLimit(32); }}>{v === '' ? text('전체', 'All', 'すべて') : v === 'uff' ? 'Uff' : 'Smooth'}</button>)}</fieldset><fieldset><legend>{t('컬러')}</legend>{colors.map(c => <button key={c[0]} aria-pressed={color === c[0]} onClick={() => { setColor(color === c[0] ? '' : c[0]); setLimit(32); }}><i style={{ background: c[1] }} />{c[colorIndex]}</button>)}</fieldset><label>{text('원단', 'Fabric', '生地')}<select value={fabric} onChange={e => { setFabric(e.target.value); setLimit(32); }}><option value="">{text('전체', 'All', 'すべて')}</option>{Array.from(new Map(allDesigns.map(p => { const f = sofaFabric(baseVariant(p).material, p.model as 'uff' | 'smooth'); return [f.id, f]; })).values()).map(f => <option key={f.id} value={f.id}>{f.name[language === 'ko' ? 0 : language === 'ja' ? 2 : 1]}</option>)}</select></label><label>{text('정렬', 'Sort by', '並び順')}<select value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">{text('추천순', 'Recommended', 'おすすめ')}</option><option value="ascending">{text('낮은 가격순', 'Price: low to high', '価格の安い順')}</option><option value="descending">{text('높은 가격순', 'Price: high to low', '価格の高い順')}</option></select></label><button className={styles.outline} onClick={reset}>{t('필터 초기화')}</button><button className={styles.primary} onClick={() => setFilters(false)}><FiGrid />{filtered.length} {text('개 디자인 보기', 'designs', '件を表示')}</button></div></Dialog>}
  </>;
}

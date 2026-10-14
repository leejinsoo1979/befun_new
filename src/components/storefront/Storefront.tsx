'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { FiArrowRight, FiCheck, FiPause, FiPlay, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { asset, products, productHeight, stories, type CatalogProduct } from './catalog';
import { useSavedProducts } from './useSavedProducts';
import styles from './storefront.module.css';
import { StorefrontFrame } from './StorefrontFrame';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { CollectionChooser } from './CollectionChooser';
import { ProcessCards } from './ProcessCards';
import { JoinSection } from './JoinSection';
import { ReferenceImage, Carousel, ProductCard, productHref } from './StorefrontUI';
import { categoryLinks, catalogHref, journalArticles } from './navigation';

const categoryButtonWidths = [
  [105.5078125, 184.5546875, 213.78125, 224.640625],
  [149.59375, 237.6640625, 284.421875, 301.8046875],
  [176.0625, 269.3515625, 326.734375, 347.921875],
  [205.6953125, 305.0625, 374.2265625, 399.8046875],
  [170.625, 263.4296875, 318.34375, 339.046875],
  [154.765625, 243.2421875, 292.3828125, 310.203125],
  [175.15625, 269.203125, 325.7578125, 347.28125],
  [215.7734375, 315.890625, 389.7109375, 416.125],
  [256.953125, 366.3046875, 456.1015625, 489],
  [201.296875, 299.4609375, 367.0234375, 391.8046875],
];

/** 메인 랜딩 영상 (로컬, 1440×720) */
const heroVideo = '/videos/befun-hero-1440x720.mp4';
/** 영상 첫 프레임 — 로딩 중·정지·동작 줄이기에서 다른 사진이 비치지 않도록 */
const heroPoster = '/videos/befun-hero-poster.webp';
const journals = [
  { name: '성수 팝업 갤러리', image: 'befun/life-1.avif', title: '가구와 예술이 만나는 순간', text: '색과 형태가 공간의 분위기를 바꾸는 순간. 가구를 통해 나만의 작은 갤러리를 만들어 보세요.' },
  { name: '디자이너 인터뷰', image: 'befun/life-2.avif', title: '간결한 형태, 새로운 시선', text: '빛과 컬러, 소재가 만나는 디자인에서 새로운 공간의 아이디어를 찾아보세요.' },
  { name: '서울 디자인 워크숍', image: 'befun/life-3.avif', title: '함께 만드는 디자인의 즐거움', text: '서로의 취향을 나누고, 새로운 아이디어를 발견하는 창작의 순간입니다.' },
  { name: '핑크 룸 스토리', image: 'befun/life-4.avif', title: '상상 속 컬러를 일상으로', text: '부드러운 핑크와 조형적인 수납 가구. 좋아하는 컬러를 일상의 풍경으로 가져와 보세요.' },
].map((item) => ({ ...item, remoteSource: asset(item.image) }));

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function Hero() {
  const { t } = useI18n();
  const video = useRef<HTMLVideoElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => true);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const [poster, setPoster] = useState(heroPoster);
  const [manuallyStarted, setManuallyStarted] = useState(false);
  const shouldPlay = !reducedMotion || manuallyStarted;

  return (
    <section className={styles.hero} aria-label={t('새로운 컬러 컬렉션')}>
      <Image src={poster} alt={t('따뜻한 공간에 어우러진 새로운 가구 컬러')} fill priority unoptimized sizes="100vw" className={styles.cover} onError={() => setPoster(asset('befun/hero.avif'))} />
      {shouldPlay && !failed ? <div className={styles.videoCover}>
        <video ref={video} src={heroVideo} poster={heroPoster} autoPlay muted={muted} loop playsInline preload="auto" aria-hidden="true" tabIndex={-1}
          onCanPlay={() => setReady(true)} onError={() => setFailed(true)} />
      </div> : null}
      <div className={styles.heroShade} />
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>{t('새로운 계절, 새로운 컬러')}</p>
        <h1>{t('새로운 색으로.')}<br className={styles.mobileBreak} /> {t('오래도록 당신답게.')}</h1>
        <a href="#collections" className={styles.whiteButton}>{t('새로운 컬러 만나보기')}</a>
      </div>
      {!failed ? <div className={styles.videoControls}>
        <button aria-label={!shouldPlay || paused ? t('영상 재생') : t('영상 일시 정지')} disabled={shouldPlay && !ready} onClick={() => {
          if (!shouldPlay) { setManuallyStarted(true); return; }
          if (paused) { void video.current?.play(); } else { video.current?.pause(); }
          setPaused(!paused);
        }}>{!shouldPlay || paused ? <FiPlay /> : <FiPause />}</button>
        <button aria-label={muted ? t('영상 소리 켜기') : t('영상 소리 끄기')} disabled={!ready} onClick={() => setMuted(!muted)}>{muted ? <FiVolumeX /> : <FiVolume2 />}</button>
      </div> : null}
    </section>
  );
}

/** 중간 브랜드 섹션 영상 (2112×1080). 첫 프레임 포스터로 시작해 다른 사진이 비치지 않게 한다. */
function SceneVideo() {
  const { t } = useI18n();
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => true);
  const [failed, setFailed] = useState(false);
  return <>
    <Image src="/videos/befun-scene-poster.webp" alt={t('여러 컬러의 패널 샘플')} fill unoptimized sizes="100vw" className={styles.cover} />
    {!reducedMotion && !failed ? <div className={styles.videoCover}>
      <video src="/videos/befun-scene-2112x1080.mp4" poster="/videos/befun-scene-poster.webp" autoPlay muted loop playsInline preload="metadata"
        aria-hidden="true" tabIndex={-1} onError={() => setFailed(true)} />
    </div> : null}
  </>;
}

export function Storefront() {
  const { t } = useI18n();
  const router = useRouter();
  const { saved, toggleSaved } = useSavedProducts();
  const [category, setCategory] = useState('모든 제품');
  const displayedProducts = products.filter(product => {
    if (category === '모든 제품' || category === '모듈 가구') return true;
    if (category === '낮은 수납장') return productHeight(product) <= 80;
    if (category === '도어 수납장') return product.doors.length > 0;
    if (category === '컬러 가구') return product.colorCategory === 'solid';
    if (category === '오픈 선반') return product.doors.length === 0;
    return product.category === category;
  });
  const renderProduct = (product: CatalogProduct) => <ProductCard key={product.id} product={product} saved={saved.includes(product.id)} toggleSaved={() => toggleSaved(product.id)} open={() => router.push(productHref(product))} />;

  return <StorefrontFrame overlay>
      <Hero />
      <section className={styles.categorySection}>
        <p className={styles.eyebrow}>{t('가구의 새로운 가능성')}</p>
        <h2>{t('공간에 맞게. 오래 함께. 간편하게.')}<br />{t('나만의 가구를 만들어 보세요.')}</h2>
        <div className={styles.categoryPills}>{categoryLinks.map(([title, slug], index) => <Link key={slug} href={catalogHref(slug)} style={{ "--category-mobile-width": `${categoryButtonWidths[index][0]}px`, "--category-tablet-width": `${categoryButtonWidths[index][1]}px`, "--category-middle-width": `${categoryButtonWidths[index][2]}px`, "--category-desktop-width": `${categoryButtonWidths[index][3]}px` } as CSSProperties}>{t(title)}<FiArrowRight aria-hidden="true" /></Link>)}</div>
      </section>
      <section className={`${styles.section} ${styles.recentSection}`}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{t('당신의 다음 디자인')}</p><h2>{t('이런 가구는 어떠세요?')}</h2></div><Link href="/furniture-c" className={styles.outlineButton}>{t('모두 보기')}</Link></div>
        <Carousel label={t('추천 디자인')}>{products.slice(0, 4).map(renderProduct)}</Carousel>
      </section>
      <section className={styles.brandScene} aria-label={t('일상에 어우러지는 가구')}>
        <SceneVideo />
        <div className={styles.heroShade} /><div className={styles.brandCaption}><p className={styles.eyebrow}>{t('당신의 일상에 자연스럽게')}</p><h2>{t('집이 가장 나다운 곳이 되도록.')}</h2><Link href="/configurator" className={styles.whiteButton}>{t('디자인 시작하기')}</Link></div>
      </section>
      <section id="collections" className={styles.section}>
        <p className={styles.eyebrow}>{t('Befun을 만나는 시간')}</p><h2>{t('컬러를 고르세요.')}<br className={styles.mobileBreak} /> {t('나머지는 간단해요.')}</h2>
        <CollectionChooser />
      </section>
      <section className={styles.toneBanner}><div><p className={styles.eyebrow}>{t('우리 집을 위한 수납')}</p><h2>{t('차분한 디자인.')}<br />{t('선명한 취향.')}</h2><p>{t('원하는 크기와 컬러로, 당신에게 꼭 맞게.')}</p><Link href="/configurator" className={styles.darkButton}>{t('나만의 가구 만들기')}</Link></div><Image src={asset('tone.avif')} alt={t('차분한 컬러의 모듈 수납 가구')} fill sizes="100vw" /></section>
      <section id="products" className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{t('새로운 디자인을 발견하세요')}</p><h2>{category === '모든 제품' ? t('당신의 공간을 위한 가구') : t(category)}</h2></div><Link className={styles.outlineButton} href="/furniture-c">{t('모두 보기')}</Link></div>
        <div className={styles.filterTabs} role="group" aria-label={t('제품 필터')}>{['모든 제품', '수납장', '월 수납장', '책장', 'TV 스탠드'].map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{t(item)}</button>)}</div>
        <Carousel key={category} label={t('제품 디자인')}>{displayedProducts.map(renderProduct)}</Carousel>
        <p className={styles.caption}>{t('이미지는 공간 연출을 위한 디자인 예시입니다. 실제 크기·색상·도어 구성은 3D 커스터마이저에서 확인하세요.')}</p>
      </section>
      <section id="how-it-works" className={`${styles.section} ${styles.processSection}`}>
        <p className={styles.eyebrow}>{t('몇 번의 선택으로 완성하는 나만의 가구')}</p><h2>{t('한 번의 디자인.')}<br className={styles.mobileBreak} /> {t('오래도록 이어질 취향.')}</h2>
        <ProcessCards />
      </section>
      <section id="community" className={`${styles.section} ${styles.communitySection}`}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{t('실제 사람들, 저마다의 공간')}</p><h2>{t('모든 디자인의 중심에는 당신이 있어요.')}</h2></div><Link className={styles.outlineButton} href="/inspirations">{t('더 알아보기')} <FiArrowRight /></Link></div>
        <Carousel label={t('공간 이야기')}>{stories.map(item => <Link key={item.name} className={styles.storyCard} href={`/creators?influencer=${encodeURIComponent(item.name)}`}><Image src={asset(item.image)} alt={item.name} fill sizes="(max-width: 700px) 85vw, 33vw" /><div><span className={styles.eyebrow}>{t('공간 이야기')}</span><h3>{item.name}</h3><p>{t(item.title)}</p></div></Link>)}</Carousel>
      </section>
      <section className={styles.giftSection}><ReferenceImage source={asset('befun/gift-befun-logo.webp')} fallback="befun/gift.avif" alt={t('컬러와 취향을 선물하는 즐거움')} sizes="100vw" /><div><p className={styles.eyebrow}>{t('취향을 담는 즐거움')}</p><h2>{t('좋아하는 공간을,')}<br />{t('좋아하는 사람과.')}</h2><p>{t('함께 상상하고, 직접 디자인해 보세요.')}</p><Link href="/e-gift-card/1" className={styles.whiteButton}>{t('기프트카드 보기')}</Link></div></section>
      <section id="materials" className={styles.sustainability}>
        <div className={styles.sustainabilityImage}><ReferenceImage source={asset('befun/material.avif')} fallback="befun/material.avif" alt={t('가구 소재와 제작 과정')} sizes="(max-width: 700px) 100vw, 45vw" /></div>
        <div><p className={styles.eyebrow}>{t('공간에 필요한 만큼')}</p><h2>{t('필요한 가구를.')}<br />{t('당신에게 맞게.')}</h2><p>{t('작은 공간에도, 넓은 벽면에도. 정해진 사이즈를 넘어 나의 일상에 맞는 수납을 디자인하세요.')}</p><Link href="/material-samples" className={styles.outlineButton}>{t('소재와 컬러 살펴보기')} <FiArrowRight /></Link><div className={styles.values}>{[
          ['선택할 수 있는 소재', '자연스러운 나무의 질감부터 선명한 단색까지.'], ['오래 좋아할 디자인', '간결한 형태에 나만의 취향을 더해보세요.'], ['내가 정하는 구성', '선반과 도어, 수납할 물건에 맞춰 자유롭게.'], ['공간에 맞는 크기', '너비와 높이를 조절해 딱 맞는 가구를 완성하세요.'],
        ].map(([title, text]) => <div key={title}><FiCheck /><h3>{t(title)}</h3><p>{t(text)}</p></div>)}</div></div>
      </section>
      <section id="showroom" className={styles.showroom}><ReferenceImage source={asset('befun/showroom.avif')} fallback="befun/showroom.avif" alt={t('맞춤 수납 가구가 놓인 쇼룸')} sizes="90vw" /><div className={styles.heroShade} /><div><h2>{t('상상한 디자인이,')}<br />{t('우리 집의 풍경으로.')}</h2><p>{t('다양한 공간에서 다음 디자인의 영감을 찾아보세요.')}</p><Link href="/showrooms" className={styles.whiteButton}>{t('쇼룸 둘러보기')}</Link></div></section>
      <section className={styles.section}><p className={styles.eyebrow}>{t('다시 만나보세요')}</p><h2>{t('인기 디자인')}</h2><Carousel label={t('인기 디자인')}>{[products[3], products[0], products[5], products[1], products[4]].map(renderProduct)}</Carousel></section>
      <section id="life" className={`${styles.section} ${styles.lifeSection}`}><p className={styles.eyebrow}>{t('조금 더 알아보기')}</p><h2>Befun Life</h2><Carousel label={t('디자인 저널')}>{journals.map((item, index) => <article key={item.name} className={styles.lifeCard}><Link href={`/journal/${journalArticles[index].slug}`} className={styles.lifeImage}><ReferenceImage source={item.remoteSource} fallback={item.image} alt={t(item.name)} sizes="(max-width: 700px) 85vw, 33vw" /></Link><h3>{t(item.name)}</h3><p>{t(item.title)}</p><Link className={styles.outlineButton} href={`/journal/${journalArticles[index].slug}`}>{t('자세히 보기')} <FiArrowRight /></Link></article>)}</Carousel></section>
      <JoinSection />
  </StorefrontFrame>;
}

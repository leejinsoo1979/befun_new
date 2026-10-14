'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiDroplet, FiGrid, FiLayers, FiSave, FiSliders } from 'react-icons/fi';
import { useShelfStore } from '@/stores/useShelfStore';
import { baseHeight } from '@/lib/three/furniture-base';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { asset, products, productDisplayHeight, type CatalogProduct } from './catalog';
import { Carousel, ProductCard, ReferenceImage, productHref } from './StorefrontUI';
import { ProductSpecifications, useProductReady } from './ProductConfigurator';
import { productGalleries } from './productGalleries';
import { ProductMaterialGallery } from './ProductMaterialGallery';
import { defaultGalleryMaterial } from './galleryMaterials';
import { useSavedProducts } from './useSavedProducts';
import { JoinSection } from './JoinSection';
import shared from './storefront.module.css';
import styles from './product-details.module.css';

const referenceGallery = defaultGalleryMaterial.images;
const highlights = [
  ['선반에 담는 개성', '1/1AP/1AP', '/product-lines'],
  ['공간에 맞는 크기', '3/3AP/3AP', '#configuration'],
  ['넉넉한 수납', '4/4AP2/4AP2', '/furniture-c/storage'],
  ['취향에 맞는 컬러', '5/5AP/5AP', '/material-samples'],
  ['보여주고, 담아두고', '6/6AP2/6AP2', '#configuration'],
  ['조립의 디테일', '7/7AP/7AP', '/faq'],
  ['나만의 디자인', '8/8AP/8AP', '/saved-designs'],
];
const reviewReferences = [
  { name: '지민 · 서울 마포구', title: '스타일과 디테일을 담은 책장', image: asset('befun/story-2.avif'), color: '오크' },
  { name: '현우 · 경기 성남시', title: '자연스러운 그린이 머무는 공간', image: asset('befun/step-2.avif'), color: '올리브 그린' },
  { name: '수아 · 부산 해운대구', title: '일상의 물건으로 채운 선반', image: asset('befun/story-1.avif'), color: '핑크' },
];
const showrooms = [
  ['Befun 성수 쇼룸', 'befun/showroom.avif', '서울 성동구 성수동'],
  ['Befun 한남 스튜디오', 'befun/brand.avif', '서울 용산구 한남동'],
  ['Befun 판교 @ 파트너 스토어', 'befun/story-6.avif', '경기 성남시 분당구'],
  ['Befun 연남 @ 카페 파트너', 'befun/life-1.avif', '서울 마포구 연남동'],
];

export function ProductDetails({ product }: { product?: CatalogProduct }) {
  const router = useRouter();
  const { saved, toggleSaved } = useSavedProducts();
  const ready = useProductReady(product?.id);
  const currentColor = useMaterialStore(state => state.currentColor);
  const baseType = useShelfStore(s=>s.baseType);
  const width = useShelfStore(state => state.width);
  const depth = useShelfStore(state => state.depth);
  const rowHeights = useShelfStore(state => state.rowHeights);
  const numRows = useShelfStore(state => state.numRows);
  const thickness = useShelfStore(state => state.thickness);
  const gallery = product ? productGalleries[product.id] ?? referenceGallery : referenceGallery;
  const height = thickness + rowHeights.slice(0, numRows).reduce((total, row) => total + row + thickness, 0) + baseHeight(baseType);
  const fallback = product?.image ?? 'unreal_10075703.webp';
  const title = product?.name ?? '나만의 맞춤 수납 가구';


  return <div className={styles.details}>
    <section className={`${styles.section} ${styles.introduction}`}>
      <h2>{title}</h2><p>너비 {ready ? width : product?.width}cm · 높이 {ready ? Math.round(height * 10) / 10 : product && productDisplayHeight(product)}cm · 깊이 {ready ? depth : product?.depth}cm</p>
      <div className={styles.benefits}>{[
        { title: '크기를 직접 조절', text: '공간에 맞는 너비와 높이', icon: FiSliders, href: '/configurator-intro' },
        { title: '컬러와 마감 선택', text: '취향에 맞는 색과 소재', icon: FiDroplet, href: '/material-samples' },
        { title: '다양한 선반 스타일', text: '여섯 가지 형태로 시작', icon: FiGrid, href: '/product-lines' },
        { title: '나만의 수납 구성', text: '오픈 선반과 도어·서랍', icon: FiLayers, href: '/faq' },
        { title: '디자인 저장과 공유', text: '완성한 구성을 링크로', icon: FiSave, href: '/saved-designs' },
      ].map(({ title: name, text, icon: Icon, href }) => <Link key={name} href={href}><Icon /><div><h3>{name}</h3><p>{text}</p><span>더 알아보기</span></div></Link>)}</div>
    </section>

    <ProductMaterialGallery key={`${product?.id ?? 'configurator'}-${currentColor}`} images={gallery} title={title} fallback={fallback} />

    <div id="design-specifications"><ProductSpecifications ready={!product} /></div>
    <div className={styles.contactLine}>도움이 필요하세요? <Link href="/contact">디자인 상담</Link><span>·</span><Link href="/faq">자주 묻는 질문</Link></div>

    <section className={`${styles.section} ${styles.brandSection}`}><p className={styles.eyebrow}>Befun Original</p><h2>당신에게 꼭 맞는 가구,<br />당신의 취향을 담은 공간.</h2><Link href="/about-tylko" className={styles.brandMedia}><ReferenceImage source={gallery[0]} fallback={fallback} alt="공간에서 만나는 맞춤 수납 가구" sizes="100vw" /><span className={shared.whiteButton}>브랜드 이야기 <FiArrowRight /></span></Link></section>

    <section className={styles.section}><p className={styles.eyebrow}>수납 가구</p><h2>좋아하는 것은 보여주고,<br />일상의 물건은 담아두세요.</h2><Carousel label="디자인 특징">{highlights.map(([name, image, href], index) => { const HighlightLink = href.startsWith('#') ? 'a' : Link; return <HighlightLink href={href} key={image} className={styles.highlight}><ReferenceImage source={`https://media.tylko.com/cloudinary/pdp/section-highlights-carousel/AP/${image}.webp`} fallback={`step-${index % 4 + 1}.avif`} alt={name} sizes="(max-width:767px) 80vw, 30vw" /><div><p>{['디자인', '크기', '수납', '컬러', '구성', '조립', '공유'][index]}</p><h3>{name}</h3><span>더 보기 <FiArrowRight /></span></div></HighlightLink>; })}</Carousel></section>

    <section className={`${styles.section} ${styles.experience}`}><p className={styles.eyebrow}>공간 속 디자인</p><h2>실제 공간에서 발견하는<br />수납의 가능성.</h2><div className={styles.experienceGrid}><aside><h3>다양한 취향,<br />다양한 일상.</h3><p>Befun과 함께한 고객들의 공간 이야기입니다.</p><Link href="/review-list" className={shared.outlineButton}>리뷰 더 보기 <FiArrowRight /></Link></aside><div>{reviewReferences.map(item => <article key={item.name}><div className={styles.reviewImage}><ReferenceImage source={item.image} fallback="creator-3.avif" alt={item.title} sizes="200px" /></div><div><p>{item.name} · {item.color}</p><h3>{item.title}</h3><p>Tylko 공간 레퍼런스</p></div></article>)}<Link href="/gallery" className={`${shared.outlineButton} ${shared.smallButton}`}>공간 더 보기</Link></div></div></section>

    <section className={styles.soundBanner}><ReferenceImage source="https://media.tylko.com/cloudinary/lp/tylko-sound/pdp-banner/LD.webp" fallback="creator-9.avif" alt="선반에 어울리는 컬러 스피커" sizes="100vw" /><div><p className={styles.eyebrow}>선반에서 만나는 음악</p><h2>공간에 어울리는 소리.</h2><Link href="/tylko-sound" className={shared.whiteButton}>Sound 컬렉션 보기</Link></div></section>

    <section className={styles.section}><p className={styles.eyebrow}>당신에게 맞는 선택</p><h2>아직 고민 중이라면,<br />조금 더 살펴보세요.</h2><div className={styles.discoverGrid}>{[
      ['브랜드의 이야기가 궁금하다면', '1/about-tylko', '/about-tylko', '브랜드 알아보기'],
      ['소재와 컬러를 가까이에서', '2', '/material-samples', '소재와 컬러 보기'],
    ].map(([name, path, href, label]) => <Link key={href} href={href}><ReferenceImage source={`https://media.tylko.com/cloudinary/pdp/section-lobby/${path}/XLD.webp`} fallback="creator-3.avif" alt={name} sizes="(max-width:767px) 90vw, 60vw" /><div><h3>{name}</h3><span>{label} <FiArrowRight /></span></div></Link>)}</div></section>

    <section className={styles.giftBanner}><ReferenceImage source="/imgs/storefront/befun/gift-befun-logo.webp" fallback="befun/gift.avif" alt="취향을 선물하는 기프트카드" sizes="100vw" /><div><h2>취향을 선물하는 즐거움.</h2><p>좋아하는 공간을 직접 고르는 선물.</p><Link href="/e-gift-card/1" className={shared.outlineButton}>기프트카드 안내</Link></div></section>

    <section className={`${styles.section} ${styles.recommendations}`}><p className={styles.eyebrow}>함께 둘러보기</p><h2>이런 디자인은 어떠세요?</h2><Carousel label="추천 디자인">{products.filter(item => item.id !== product?.id).map(item => <ProductCard key={item.id} product={item} saved={saved.includes(item.id)} toggleSaved={() => toggleSaved(item.id)} open={() => router.push(productHref(item))} />)}</Carousel></section>

    <section className={styles.section}><p className={styles.eyebrow}>쇼룸</p><h2>공간과 소재를 직접 만나보세요.</h2><h3 className={styles.showroomHeading}>Befun 쇼룸 &amp; 파트너 공간</h3><Carousel label="쇼룸 레퍼런스">{showrooms.map(([name, image, address]) => <Link href="/showrooms" className={styles.showroom} key={name}><div><ReferenceImage source={asset(image)} fallback="creator-6.avif" alt={name} sizes="(max-width:767px) 75vw, 24vw" /><span>Showroom</span></div><h3>{name}</h3><p>{address}</p><span>원본 방문 안내 <FiArrowRight /></span></Link>)}</Carousel><p className={styles.caption}>Tylko 쇼룸 레퍼런스</p><Link href="/showrooms" className={shared.darkButton}>모두 보기</Link></section>
    <JoinSection />
  </div>;
}

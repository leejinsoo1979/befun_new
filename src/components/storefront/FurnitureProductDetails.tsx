'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useId, useState } from 'react';
import { FiArrowRight, FiDroplet, FiLayers, FiSave, FiSliders } from 'react-icons/fi';
import { type FurnitureDesign, FAMILY_NAMES } from '@/lib/furniture/design';
import { WARDROBE_COLORS } from '@/lib/furniture/wardrobe-colors';
import { useLocale } from '@/lib/commerce/useLocale';
import { ProductMaterialGallery } from './ProductMaterialGallery';
import { Carousel } from './StorefrontUI';
import { JoinSection } from './JoinSection';
import { furniturePhotoSets, furniturePhotosFor } from './furnitureProductPhotos';
import details from './product-details.module.css';
import shared from './storefront.module.css';
import galleryStyles from './material-gallery.module.css';
import styles from './furniture-product-details.module.css';

function colourName(colour: string) {
  return WARDROBE_COLORS[colour]?.label ?? colour.replace(/^[SCN]_/, '');
}

export function FurnitureProductDetails({ design, title, catalogId }: {
  design: FurnitureDesign; title?: string; catalogId?: string;
}) {
  const { t } = useLocale();
  const group = useId();
  const selectionKey = `${design.family}:${design.color}:${design.innerColor}`;
  const [selection, setSelection] = useState<{ key: string; id: string } | null>(null);
  const choices = furniturePhotoSets.filter(item => item.family === design.family);
  const photos = (selection?.key === selectionKey && choices.find(item => item.id === selection.id))
    || furniturePhotosFor(design, catalogId);
  const name = title ?? FAMILY_NAMES[design.family];
  const height = design.kind === 'desk' ? 730 : Math.max(design.config.heightMm, ...design.config.sections.map(section => section.localHeightMm ?? 0));
  const depth = design.kind === 'desk' ? design.config.depthMm : Math.max(design.config.depthMm, ...design.config.sections.map(section => section.localDepthMm ?? 0));
  const category = design.kind === 'desk' ? 'desk' : 'wardrobe';
  const related = furniturePhotoSets.filter(item => item.id.startsWith(`${category}-`) && item.id !== photos.id);
  const benefits = [
    { title: '크기를 직접 조절', text: '내 공간에 맞는 치수', icon: FiSliders, href: '#configuration' },
    { title: '컬러와 마감 선택', text: '취향에 맞는 색과 소재', icon: FiDroplet, href: '#design-gallery' },
    { title: '나만의 수납 구성', text: '오픈 선반과 도어·서랍', icon: FiLayers, href: '#configuration' },
    { title: '디자인 저장과 공유', text: '완성한 구성을 링크로', icon: FiSave, href: '#configuration' },
    { title: '디자인 상담', text: '궁금한 점을 함께 확인', icon: FiArrowRight, href: '/contact' },
  ];

  return <div className={details.details} data-furniture-details={design.family}>
    <nav className={details.detailNavigation} aria-label={t('제품 상세 메뉴')}>
      <a href="#configuration">{t('3D 디자인')}</a><a href="#design-gallery">{t('상세 이미지')}</a>
      <a href="#design-specifications">{t('제품 사양')}</a><a href="#related-designs">{t('함께 둘러보기')}</a>
    </nav>
    <section className={`${details.section} ${details.introduction}`}>
      <h2>{t(name)}</h2><p>{t('너비')} {design.config.widthMm / 10}cm · {t('높이')} {height / 10}cm · {t('깊이')} {depth / 10}cm</p>
      <div className={details.benefits}>{benefits.map(({ title: label, text, icon: Icon, href }) => <Link key={label} href={href}><Icon /><div><h3>{t(label)}</h3><p>{t(text)}</p><span>{t('더 알아보기')}</span></div></Link>)}</div>
    </section>

    <div className={styles.photoHeader}>
      <p>{t('상세 사진')} · {t(photos.label)}</p>
      <div className={galleryStyles.toolbar} role="radiogroup" aria-label={t('상세 사진 재질')}>
        {choices.map(item => <label key={item.id} className={galleryStyles.swatch} title={t(item.label)}>
          <input type="radio" name={group} checked={photos.id === item.id} aria-label={t(item.label)}
            onChange={() => setSelection({ key: selectionKey, id: item.id })} />
          <span className={galleryStyles.swatchCircle}><span className={styles.colour} style={{ background: item.swatch }} /></span>
        </label>)}
      </div>
    </div>
    <ProductMaterialGallery key={photos.id} images={photos.images} title={`${FAMILY_NAMES[design.family]} ${photos.label}`} fallback={photos.images[0]} />

    <section id="design-specifications" className={`${shared.section} ${shared.productSpecifications}`}>
      <h2>{t('제품 사양')}</h2><div className={shared.specificationRows}>
        <details><summary>{t('치수와 구성')}</summary><dl>
          <dt>{t('너비 × 높이 × 깊이')}</dt><dd>{design.config.widthMm / 10} × {height / 10} × {depth / 10} cm</dd>
          <dt>{t('컬렉션')}</dt><dd>{t(FAMILY_NAMES[design.family])}</dd>
          <dt>{t('수납 구획')}</dt><dd>{design.kind === 'desk' ? design.config.storageColumns : design.config.sections.length}</dd>
          {design.kind === 'wardrobe' && design.config.model === 'tone' && <><dt>{t('서랍')}</dt><dd>{t(design.config.drawerStyle === 'external' ? '외부 서랍' : '내부 서랍')}</dd></>}
        </dl></details>
        <details><summary>{t('소재와 컬러')}</summary><p>{t('외부')} · {t(colourName(design.color))}{design.kind === 'wardrobe' && <><br />{t('내부')} · {t(colourName(design.innerColor))}</>}</p><p>{t('상세 사진은 컬렉션의 디자인 예시입니다. 변경한 치수와 구성은 위의 3D 화면에서 확인하세요.')}</p><Link href="/material-samples">{t('소재와 컬러 살펴보기')} <FiArrowRight /></Link></details>
        <details><summary>{t('저장과 공유')}</summary><p>{t('현재 디자인을 이 브라우저에 저장하거나 링크로 공유할 수 있습니다. 계정 저장과 장바구니 주문은 제공되지 않습니다.')}</p><a href="#configuration">{t('디자인으로 돌아가기')} <FiArrowRight /></a></details>
        <details><summary>{t('조립과 관리')}</summary><p>{t('도어와 서랍 구성은 3D 화면에서 확인하세요. 소재와 조립 관련 문의는 상담 페이지에서 안내받을 수 있습니다.')}</p><Link href="/faq">{t('자주 묻는 질문')} <FiArrowRight /></Link></details>
        <details><summary>{t('제품 문의')}</summary><Link href="/contact">{t('이 디자인에 대해 상담하기')} <FiArrowRight /></Link></details>
      </div>
    </section>
    <div className={details.contactLine}>{t('도움이 필요하세요?')} <Link href="/contact">{t('디자인 상담')}</Link><span>·</span><Link href="/faq">{t('자주 묻는 질문')}</Link></div>

    <section className={`${details.section} ${details.brandSection}`}><p className={details.eyebrow}>{t(FAMILY_NAMES[design.family])}</p><h2>{t('당신에게 꼭 맞는 가구,')}<br />{t('당신의 취향을 담은 공간.')}</h2><Link href="/about-tylko" className={details.brandMedia}><Image src={photos.images[0]} alt={`${FAMILY_NAMES[design.family]} ${photos.label}`} fill sizes="100vw" /><span className={shared.whiteButton}>{t('브랜드 이야기')} <FiArrowRight /></span></Link></section>
    <section className={details.section}><p className={details.eyebrow}>{t('당신에게 맞는 선택')}</p><h2>{t('아직 고민 중이라면,')}<br />{t('조금 더 살펴보세요.')}</h2><div className={details.discoverGrid}>{[
      ['브랜드의 이야기가 궁금하다면', '/about-tylko', photos.images[1]],
      ['소재와 컬러를 가까이에서', '/material-samples', photos.images.at(-1)!],
    ].map(([label, href, image]) => <Link key={href} href={href}><Image src={image} alt={t(label)} fill sizes="(max-width:767px) 90vw, 60vw" /><div><h3>{t(label)}</h3><span>{t('더 알아보기')} <FiArrowRight /></span></div></Link>)}</div></section>
    <section className={details.giftBanner}><Image src="/imgs/storefront/befun/gift-befun-logo.webp" alt={t('취향을 선물하는 기프트카드')} fill sizes="100vw" /><div><h2>{t('취향을 선물하는 즐거움.')}</h2><p>{t('좋아하는 공간을 직접 고르는 선물.')}</p><Link href="/e-gift-card/1" className={shared.outlineButton}>{t('기프트카드 안내')}</Link></div></section>
    <section id="related-designs" className={`${details.section} ${details.recommendations}`}><p className={details.eyebrow}>{t('함께 둘러보기')}</p><h2>{t('이런 디자인은 어떠세요?')}</h2><Carousel label={t('추천 디자인')}>{related.map(item => <Link key={item.id} href={`/reference-product/${item.id}`} className={details.showroom}><div><Image src={item.images[0]} alt={t(item.label)} fill sizes="(max-width:767px) 75vw, 24vw" /></div><h3>{t(item.label)}</h3><p>{t(FAMILY_NAMES[item.family])}</p><span>{t('3D 디자인 편집')} <FiArrowRight /></span></Link>)}</Carousel></section>
    <JoinSection />
  </div>;
}

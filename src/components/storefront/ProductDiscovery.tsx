'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { useLocale } from '@/lib/commerce/useLocale';
import styles from './product-details.module.css';

const cards = [
  { title: '브랜드의 이야기가 궁금하다면', label: '브랜드 알아보기', href: '/about-tylko', image: '/imgs/product-discovery/brand-pastel-shelf.jpg', position: 'center 15%' },
  { title: '소재와 컬러를 가까이에서', label: '소재와 컬러 보기', href: '/material-samples', image: '/imgs/product-discovery/materials.avif', position: 'center' },
];

export function ProductDiscovery() {
  const { t } = useLocale();

  return <section className={styles.section} data-product-discovery>
    <p className={styles.eyebrow}>{t('당신에게 맞는 선택')}</p>
    <h2>{t('아직 고민 중이라면,')}<br />{t('조금 더 살펴보세요.')}</h2>
    <div className={styles.discoverGrid}>{cards.map(card => <Link key={card.href} href={card.href}>
      <Image src={card.image} alt={t(card.title)} fill sizes="(max-width:767px) 90vw, 60vw" style={{ objectPosition: card.position }} />
      <div><h3>{t(card.title)}</h3><span>{t(card.label)} <FiArrowRight /></span></div>
    </Link>)}</div>
  </section>;
}

'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import Image from 'next/image';
import { useState } from 'react';
import styles from './product-card-image.module.css';

/** Keep the base image visible until this product's studio cut has decoded. */
export function ProductCardImage({ thumbnail, studio, alt, sizes }: {
  thumbnail: string; studio: string; alt: string; sizes: string;
}) {
  const { t } = useLocale();
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [baseFailed, setBaseFailed] = useState(false);
  return <span className={styles.frame} data-card-image={thumbnail} data-studio-visible={hovered && ready} onPointerEnter={event => {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    setRequested(true);
    setHovered(true);
  }} onPointerLeave={() => setHovered(false)} onPointerCancel={() => setHovered(false)}>
    <Image src={thumbnail} alt={alt} fill sizes={sizes} loading="lazy" className={styles.base} onError={() => setBaseFailed(true)} />
    {baseFailed && <span className={styles.error} role="img" aria-label={alt}>{t('이미지를 불러오지 못했습니다.')}</span>}
    {requested && studio && <Image src={studio} alt="" aria-hidden="true" fill sizes={sizes} loading="eager" className={styles.studio} onLoad={() => setReady(true)} onError={() => setReady(false)} />}
  </span>;
}

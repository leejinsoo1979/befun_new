'use client';
import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FiArrowLeft, FiArrowRight, FiHeart, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useMoney } from '@/lib/commerce/useMoney';
import { PriceNotice } from '@/components/commerce/PriceNotice';
import { asset, palette, productDisplayHeight, productPrice, type CatalogProduct } from './catalog';
import styles from './storefront.module.css';
import { ProductCardImage } from './ProductCardImage';
import matches from '@/lib/catalog-images/existing-matches.json';
import { loadProductConfiguration } from './configuration';

/** 외부(원격) 이미지 URL 여부. 사이트 이미지는 우리 서버(/public)에서만 불러온다. */
export const isExternalImage = (src: string) => /^https?:\/\//.test(src);

export function ReferenceImage({ source, fallback, alt, sizes, className }: { source: string; fallback: string; alt: string; sizes: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  // 외부 원본(예: media.tylko.com)은 차단·지연되므로 요청하지 않고 우리 서버의 대체 이미지를 바로 쓴다
  const local = failed || isExternalImage(source);
  return <Image src={local ? asset(fallback) : source} alt={alt} fill sizes={sizes} unoptimized={!local} className={className} onError={() => setFailed(true)} />;
}


export function Dialog({ title, children, close, drawer = false }: { title: string; children: ReactNode; close: () => void; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog ref={ref} className={`${styles.dialog} ${drawer ? styles.drawer : ''}`} aria-labelledby="storefront-dialog-title" onCancel={close} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}>
      <div className={styles.dialogHeading}>
        <h2 id="storefront-dialog-title">{title}</h2>
        <button className={styles.iconButton} aria-label="닫기" onClick={close}><FiX /></button>
      </div>
      {children}
    </dialog>
  );
}


export function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const measure = () => {
    const element = ref.current;
    if (element) setEdges({ start: element.scrollLeft <= 2, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 });
  };
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const scroll = (direction: number) => {
    const element = ref.current;
    element?.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  return <div className={styles.carousel}>
    <div ref={ref} className={styles.track} onScroll={measure} role="region" aria-label={label} tabIndex={0}>{children}</div>
    <div className={styles.arrows}>
      <button aria-label={`${label} 이전`} disabled={edges.start} onClick={() => scroll(-1)}><FiArrowLeft /></button>
      <button aria-label={`${label} 다음`} disabled={edges.end} onClick={() => scroll(1)}><FiArrowRight /></button>
    </div>
  </div>;
}

export function ProductCard({ product, saved, toggleSaved, open }: { product: CatalogProduct; saved: boolean; toggleSaved: () => void; open: () => void }) {
  const { formatPrice } = useMoney();
  const price = productPrice(product);
  const matched = (matches as Record<string, {originalImage?:string;thumbnail:string;studio:string}>)[product.id];
  const pair = matched?.originalImage === product.image ? matched : undefined;
  return <article className={styles.productCard}>
    <div className={styles.productVisual}>
      <button className={styles.productImageButton} onClick={open} aria-label={`${product.name} 디자인 보기`}>
        <ProductCardImage key={pair?.thumbnail ?? product.image} thumbnail={pair?.thumbnail ?? asset(product.image)} studio={pair?.studio ?? asset(product.alternate)} alt={product.name} sizes="(max-width: 700px) 75vw, (max-width: 1100px) 45vw, 24vw" />
      </button>
      <span className={styles.discount}>−{price.discountRate}%</span>
      <button className={styles.saveButton} aria-label={`${product.name} ${saved ? '즐겨찾기 해제' : '즐겨찾기'}`} aria-pressed={saved} onClick={toggleSaved}><FiHeart fill={saved ? 'currentColor' : 'none'} /></button>
    </div>
    <div className={styles.productSwatches}><span>디자인 예시</span>{palette.slice(0, 5).map(color => <i key={color.name} style={{ background: color.hex }} />)}<span>+7</span></div>
    <button onClick={open} className={styles.productText}>
      <p>{product.collection}</p><h3>{product.name}</h3>
      <p>{product.width} × {productDisplayHeight(product)} cm</p>
      <div className={styles.price}>{formatPrice(price.finalPrice)} <del>{formatPrice(price.originalPrice)}</del><PriceNotice /></div>
    </button>
  </article>;
}


export function BrandLogo({ color = 'black' }: { color?: 'black' | 'white' }) {
  return <Image src={color === 'white' ? '/imgs/icon/befun_logo-white.svg' : '/imgs/icon/befun_logo.svg'} alt="Befun" width={120} height={28} unoptimized priority={color === 'black'} className={styles.brandLogo} />;
}
export function useConfigureProduct() {
  const router = useRouter();
  return (product: CatalogProduct, color = product.color) => {
    loadProductConfiguration(product, color);
    router.push('/configurator');
  };
}
export const productHref = (product: CatalogProduct) => `/furniture/${product.id}`;

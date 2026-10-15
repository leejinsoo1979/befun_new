'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import collections from '@/lib/shopping-catalog/collection-dialogs.json';
import { useLocale } from '@/lib/commerce/useLocale';
import styles from './collection-dialog.module.css';

export type CollectionName = keyof typeof collections;

export function collectionConfigureHref(name: string, category = '') {
  if (name === 'Uff' || name === 'Smooth') return `/sofa-configurator?model=${name.toLowerCase()}`;
  const productLine = name.replace('Original ', '').toLowerCase();
  return `/configurator-intro?${new URLSearchParams({ productLine, ...(category ? { category } : {}) })}`;
}

/** The collection introduction is separate from product detail/variant selection. */
export function CollectionDialog({ name, browse, configureHref, close }: {
  name: CollectionName; browse: () => void; configureHref: string; close: () => void;
}) {
  const { language } = useLocale();
  const collection = collections[name];
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const backdropStart = useRef(false);
  const titleId = useId();
  const text = (ko: string, en: string, ja: string) => language === 'ko' ? ko : language === 'ja' ? ja : en;
  const move = (step: number) => setIndex(current => Math.max(0, Math.min(collection.slides.length - 1, current + step)));

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }}
    onPointerDown={event => { backdropStart.current = event.target === event.currentTarget && outsideDialog(event.clientX, event.clientY, event.currentTarget); }}
    onClick={event => { if (backdropStart.current && event.target === event.currentTarget && outsideDialog(event.clientX, event.clientY, event.currentTarget)) close(); }}>
    <button type="button" className={styles.close} aria-label={text('닫기', 'Close', '閉じる')} onClick={close} autoFocus><FiX /></button>
    <header className={styles.heading}>
      <p>{language === 'ko' ? collection.strapKo : collection.strap}</p>
      <h2 id={titleId}>{collection.name}</h2>
    </header>
    <section className={styles.carousel} aria-label={text('컬렉션 소개', 'Collection introduction', 'コレクション紹介')}
      onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }}>
      <div className={styles.viewport}
        onTouchStart={event => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }}
        onTouchEnd={event => { const start = touchStart.current; const end = event.changedTouches[0]; if (start && Math.abs(end.clientX - start.x) > 45 && Math.abs(end.clientY - start.y) < Math.abs(end.clientX - start.x)) move(end.clientX < start.x ? 1 : -1); touchStart.current = null; }}>
        <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
          {collection.slides.map((slide, slideIndex) => <article className={styles.slide} key={slide.image} aria-hidden={slideIndex !== index}>
            <div className={styles.image}><Image src={slide.image} alt={`${name} — ${language === 'ko' ? slide.titleKo : slide.title.trim()}`} fill sizes="(max-width:767px) calc(100vw - 48px), 536px" /></div>
            <div className={styles.copy}><h3>{language === 'ko' ? slide.titleKo : slide.title.trim()}</h3><p>{language === 'ko' ? slide.bodyKo : slide.body.trim()}</p></div>
          </article>)}
        </div>
        <div className={styles.arrows}>
          <button type="button" aria-label={text('이전 이미지', 'Previous image', '前の画像')} disabled={index === 0} onClick={() => move(-1)}><FiChevronLeft /></button>
          <button type="button" aria-label={text('다음 이미지', 'Next image', '次の画像')} disabled={index === collection.slides.length - 1} onClick={() => move(1)}><FiChevronRight /></button>
        </div>
      </div>
      <div className={styles.dots} role="group" aria-label={text('슬라이드 선택', 'Choose slide', 'スライド選択')}>
        {collection.slides.map((slide, slideIndex) => <button type="button" key={slide.image} aria-label={`${slideIndex + 1} / ${collection.slides.length}`} aria-pressed={index === slideIndex} onClick={() => setIndex(slideIndex)}><span /></button>)}
      </div>
    </section>
    <footer className={styles.actions}>
      <button type="button" onClick={browse}>{text('둘러보기', 'Browse', '商品を見る')}</button>
      <Link href={configureHref} onClick={close}>{text('디자인하기', 'Configure', 'デザインする')}</Link>
    </footer>
  </dialog>;
}

function outsideDialog(x: number, y: number, dialog: HTMLDialogElement) {
  const bounds = dialog.getBoundingClientRect();
  return x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom;
}

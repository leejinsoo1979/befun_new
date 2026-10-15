'use client';

import { AvatarSelector } from '@/components/three/display/AvatarSelector';

import { useEffect, useId, useRef, useState } from 'react';
import { FiBox, FiColumns, FiMaximize, FiRotateCcw, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { useLocale } from '@/lib/commerce/useLocale';
import styles from '@/components/three/display/display.module.css';

type Props = {
  open: boolean;
  dimensions: boolean;
  front: boolean;
  onOpen: () => void;
  onDimensions: () => void;
  onFront: (front: boolean) => void;
  onReset: () => void;
  onZoom: (factor: number) => void;
};

/** Same presentation as the shelf toolbar; actions belong to this furniture scene. */
export function FurnitureViewToolbar(props: Props) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!expanded) return;
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !toolbarRef.current?.contains(event.target)) {
        setExpanded(false);
      }
    };
    // Capture also reaches canvas clicks handled by the 3D controls.
    document.addEventListener('pointerdown', dismissOutside, true);
    return () => document.removeEventListener('pointerdown', dismissOutside, true);
  }, [expanded]);
  const id = useId();
  return <div ref={toolbarRef} className={styles.toolbar} onKeyDown={event => {
    if (event.key === 'Escape') {
      event.preventDefault();event.stopPropagation();
      setExpanded(false);
      event.currentTarget.querySelector<HTMLButtonElement>('button[aria-controls]')?.focus();
    }
  }}>
    <button className={styles.menu} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>
      <svg width="24" height="24" viewBox="0 0 28 28" fill="var(--green)" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="m14 3 10 5-10 5L4 8Zm-10 5 10 5v12L4 20Zm20 0-10 5v12l10-5Z"/></svg>
      {t('보기')} <span className={styles.chevron} aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
    </button>
    <div id={id} role="group" aria-label={t('가구 보기')} className={`${styles.options} ${expanded ? styles.expanded : ''}`}>
      <AvatarSelector />
      <div className={styles.views}>
        <button aria-pressed={props.front} onClick={() => props.onFront(true)}><FiColumns size={24}/><span>{t('정면')}</span></button>
        <button aria-pressed={!props.front} onClick={() => props.onFront(false)}><FiBox size={24}/><span>{t('입체')}</span></button>
        <button onClick={props.onReset}><FiRotateCcw size={24}/><span>{t('시점 초기화')}</span></button>
        <button aria-pressed={props.dimensions} onClick={props.onDimensions}><FiMaximize size={24}/><span>{t('치수')}</span></button>
      </div>
      <div className={styles.actions}>
        <button aria-pressed={props.open} onClick={props.onOpen}><FiColumns size={24}/><span>{t(props.open ? '문·서랍 닫기' : '문·서랍 열기')}</span></button>
        <button onClick={() => props.onZoom(.8)}><FiZoomIn size={24}/><span>{t('확대')}</span></button>
        <button onClick={() => props.onZoom(1.25)}><FiZoomOut size={24}/><span>{t('축소')}</span></button>
      </div>
    </div>
  </div>;
}

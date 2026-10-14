'use client';
import { useMemo } from 'react';
import { calculateDeskGeometry, type DeskInput } from '@/lib/furniture/desk';
import { calculatePrice } from '@/lib/pricing';
import { useMoney } from '@/lib/commerce/useMoney';
import styles from './furniture.module.css';

/** Material-volume estimate, not a manufacturer quote or hardware-inclusive checkout price. */
export function DeskPrice({ config }: { config: DeskInput }) {
  const { formatPrice, language } = useMoney();
  const price = useMemo(() => {
    const g = calculateDeskGeometry(config);
    const volume = [...g.panels, ...g.beams].reduce((sum, p) => sum + p.w * p.h * p.d, 0)
      + g.fronts.reduce((sum, f) => sum + f.width * f.height * g.boardThickness, 0);
    return calculatePrice({ totalPanelVolume: volume, colorCategory: 'classic' }).originalPrice;
  }, [config]);
  const ko = language === 'ko';
  const ja = language === 'ja';
  return <div className={styles.deskPrice} data-desk-price={price}>
    <span>{ko ? '가격' : ja ? '価格' : 'Price'}</span>
    <strong>{formatPrice(price)}</strong>

  </div>;
}

'use client';

import { useLocale } from '@/lib/commerce/useLocale';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { saveDesignForOptimizer } from '@/lib/optimizer/befun/session';
import { StorefrontFrame } from './StorefrontFrame';
import { ProductDetails } from './ProductDetails';
import styles from './product-details.module.css';

export function ConfiguratorShell({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const router = useRouter();
  return <StorefrontFrame>
    <div id="configuration" className={styles.workspace}>
      {children}
    </div>
    <nav className={styles.detailNavigation} aria-label={t("디자인 상세")}>
      <a href="#design-gallery">{t("사진 보기")}</a>
      <a href="#design-specifications">{t("제품 사양")}</a>
      <Link href="/saved-designs">{t("저장한 디자인")}</Link>
      <button onClick={() => { saveDesignForOptimizer(); router.push('/optimizer'); }}>{t("CNC 옵티마이저")}</button>
    </nav>
    <ProductDetails />
  </StorefrontFrame>;
}

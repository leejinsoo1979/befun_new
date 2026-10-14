'use client';

import dynamic from 'next/dynamic';
import { ConfiguratorLoading } from '@/components/ui/ConfiguratorLoading';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { create } from 'zustand';
import { FiArrowRight, FiMaximize, FiShare2 } from 'react-icons/fi';
import { useShelfStore } from '@/stores/useShelfStore';
import { baseHeight } from '@/lib/three/furniture-base';
import { FeetSelector } from '@/components/ui/FeetSelector';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useCartStore } from '@/stores/useCartStore';
import { useDisplayStore } from '@/components/three/display/displayStore';
import { LegacyShelfPanel, LEGACY_BEFORE_FEET, LEGACY_AFTER_FEET } from '@/components/ui/furniture-panels';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { FloatingBox } from '@/components/ui/FloatingBox';
import { useMoney } from '@/lib/commerce/useMoney';
import { PriceNotice } from '@/components/commerce/PriceNotice';
import type { CatalogProduct } from './catalog';
import { configurationPrice, currentConfiguration, loadProductConfiguration, restoreSavedConfiguration } from './configuration';
import { parseSavedDesign, saveLocalDesign, type SavedDesign } from './savedDesign';
import { Dialog } from './StorefrontUI';
import styles from './storefront.module.css';

const Scene = dynamic(() => import('@/components/three/Scene'), {
  ssr: false, loading: () => <ConfiguratorLoading />,
});
const usePreparedProduct = create<{ id: string | null }>(() => ({ id: null }));

export function useProductReady(productId?: string) {
  return usePreparedProduct(state => !productId || state.id === productId);
}

export function useConfigurationPrice() {
  const { style, width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel } = useShelfStore();
  const { doorsCreatedLayers, drawersCreatedLayers, rowStyles } = useHardwareStore();
  const colorCategory = useMaterialStore(state => state.colorCategory);
  return useMemo(() => configurationPrice(style, {
    width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel,
    hardwareLayers: [...new Set([...doorsCreatedLayers, ...drawersCreatedLayers])],
    hardwareRowStyles: rowStyles,
  }, colorCategory), [style, width, height, depth, thickness, density, rowHeights, numRows, hasBackPanel, doorsCreatedLayers, drawersCreatedLayers, rowStyles, colorCategory]);
}

export function ProductConfigurator({ product, configuration }: { product: CatalogProduct; configuration?: SavedDesign['config'] }) {
  const { formatPrice, t } = useMoney();
  const router = useRouter();
  const price = useConfigurationPrice();
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [localSave, setLocalSave] = useState(false);
  const [localSaveReason, setLocalSaveReason] = useState('');
  const initialized = useRef<string | null>(null);
  const prepared = usePreparedProduct(state => state.id === product.id);
  useEffect(() => {
    // Locale router.refresh returns new prop objects; it must not reload the preset.
    const key = JSON.stringify({ product, configuration });
    if (initialized.current === key) { usePreparedProduct.setState({ id: product.id }); return; }
    initialized.current = key;
    if (configuration) restoreSavedConfiguration(configuration);
    else loadProductConfiguration(product);
    const display = useDisplayStore.getState();
    display.resetAssembly();
    display.setAppearance('realistic');
    display.selectView('front');
    usePreparedProduct.setState({ id: product.id });
  }, [product, configuration]);
  useEffect(() => () => { usePreparedProduct.setState({ id: null }); }, []);
  if (!prepared) return <section className={styles.productConfigurator} aria-label={`${product.name} 3D 커스터마이저`}><div className={styles.productViewer}><h1 className={styles.srOnly}>{product.name}</h1><ConfiguratorLoading /></div></section>;
  const addToCart = () => {
    useCartStore.getState().addItem({ designId: '', designConfig: currentConfiguration(), quantity: 1, price: price.finalPrice });
    router.push('/cart');
  };
  const saveDesign = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    setShareUrl('');
    setLocalSave(false);
    setLocalSaveReason('');
    setCopied(false);
    const config = currentConfiguration();
    const design: SavedDesign = { version: 1, name: product.name, config };
    const storeLocally = (reason: string) => {
      try {
        if (!parseSavedDesign(JSON.stringify(design))) {
          setError('현재 디자인을 로컬에 보관할 수 없습니다. 구성을 확인해 주세요.');
          return;
        }
        const url = saveLocalDesign(design);
        setLocalSave(true);
        setLocalSaveReason(reason);
        setShareUrl(url);
      } catch {
        setError(`${reason} 이 브라우저에도 디자인을 보관하지 못했습니다. 다시 시도해 주세요.`);
      }
    };
    try {
      let response: Response;
      try {
        response = await fetch('/api/designs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config }),
        });
      } catch {
        storeLocally('네트워크 연결 문제로 서버 저장을 확인하지 못했습니다.');
        return;
      }
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 400 || result?.code === 'INVALID_DESIGN') {
          setError('디자인 설정을 저장할 수 없습니다. 구성을 확인해 주세요.');
        } else if (response.status === 503 && result?.code === 'DESIGN_STORAGE_UNAVAILABLE') {
          storeLocally('서버 저장 서비스가 준비되지 않았습니다.');
        } else if (response.status === 500 && result?.code === 'DESIGN_STORAGE_FAILED') {
          storeLocally('서버 저장 중 오류가 발생했습니다.');
        } else {
          setError(response.status === 401 ? '로그인 상태를 확인한 후 다시 저장해 주세요.' : '서버 저장 결과를 확인하지 못했습니다. 다시 시도해 주세요.');
        }
        return;
      }
      if (typeof result?.id !== 'string' || !result.id || typeof result?.shareCode !== 'string' || !/^[A-Za-z0-9_-]{8}$/.test(result.shareCode)) {
        setError('서버 저장 결과를 확인하지 못했습니다. 다시 시도해 주세요.');
        return;
      }
      setShareUrl(`${window.location.origin}/share/${result.shareCode}`);
    } finally {
      setSaving(false);
    }
  };
  return <section className={styles.productConfigurator} aria-label={`${product.name} 3D 커스터마이저`}>
    <div className={styles.productViewer}>
      <h1 className={styles.srOnly}>{product.name}</h1>
      <div className={styles.productScene}><Scene /><FloatingBox /></div>
      <button className={styles.fullscreenButton} onClick={() => router.push('/configurator')}><FiMaximize /> {t('전체 화면')}</button>
    </div>
    <div className={styles.productOptions} onDragStartCapture={(event) => event.preventDefault()}>
      <div className={styles.configPrice} aria-live="polite"><div><del>{formatPrice(price.originalPrice)}</del><span>−{price.discountRate}%</span></div><strong>{formatPrice(price.finalPrice)}</strong><PriceNotice /></div>
      <LegacyShelfPanel controls={LEGACY_BEFORE_FEET} /><FeetSelector /><LegacyShelfPanel controls={LEGACY_AFTER_FEET} /><ColorPicker />
      <div className={styles.configActions}><button className={styles.darkButton} onClick={addToCart}>{t('장바구니에 담기')} <FiArrowRight /></button><button className={styles.outlineButton} disabled={saving} onClick={saveDesign}><FiShare2 /> {t(saving ? '디자인 저장 중…' : '디자인 저장·공유')}</button></div>
      {error ? <p className={styles.configError} role="alert">{error}</p> : null}
      <p className={styles.configHelp}>{t('선반의 칸을 선택해 행 높이와 도어·서랍을 변경하세요.')} <Link href="/contact">{t('도움받기')}</Link></p>
    </div>
    {shareUrl ? <Dialog title={localSave ? "디자인을 이 브라우저에 보관했습니다" : "디자인이 서버에 저장되었습니다"} close={() => setShareUrl('')}>{localSave ? <p className={styles.localSaveNotice}>{localSaveReason} 서버 저장 성공은 확인되지 않았으며 이 브라우저에 보관했습니다. 아래 링크에는 디자인 구성이 담겨 있어 다른 브라우저에서도 열 수 있습니다.</p> : null}<label className={styles.shareField}>디자인 공유 링크<input readOnly value={shareUrl} onFocus={event => event.target.select()} /></label><div className={styles.configActions}><button className={styles.darkButton} onClick={async () => { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); } catch { setError('링크를 선택해서 복사해 주세요.'); } }}>{copied ? '복사되었습니다' : '링크 복사'}</button><Link href={shareUrl} className={styles.outlineButton}>저장한 디자인 열기</Link></div>{error ? <p className={styles.configError} role="alert">{error}</p> : null}</Dialog> : null}
  </section>;
}

export function ProductSpecifications({ ready = false }: { ready?: boolean } = {}) {
  const { width, depth, numRows, rowHeights, thickness, style, density, hasBackPanel, baseType } = useShelfStore();
  const { currentColor, colorCategory } = useMaterialStore();
  const { doorsCreatedLayers, drawersCreatedLayers } = useHardwareStore();
  const initialized = useRef<string | null>(null);
  const prepared = usePreparedProduct(state => state.id !== null);
  const height = thickness + rowHeights.slice(0, numRows).reduce((total, row) => total + row + thickness, 0) + baseHeight(baseType);
  return <section className={`${styles.section} ${styles.productSpecifications}`}><h2>제품 사양</h2><div className={styles.specificationRows}>
    <details><summary>치수와 구성</summary>{prepared || ready ? <dl><dt>너비 × 높이 × 깊이</dt><dd>{Math.round(width)} × {Math.round(height)} × {depth} cm</dd><dt>스타일 · 밀도</dt><dd>{style} · {density}%</dd><dt>선반 행</dt><dd>{numRows}행</dd><dt>도어 · 서랍</dt><dd>{doorsCreatedLayers.length}행 · {drawersCreatedLayers.length}행</dd><dt>뒷판</dt><dd>{hasBackPanel ? '포함' : '없음'}</dd></dl> : <p>선택한 디자인을 불러오는 중…</p>}</details>
    <details><summary>소재와 컬러</summary><p>{colorCategory} · {currentColor.replace(/^[SCN]_/, '')}</p><Link href="/material-samples">소재와 컬러 살펴보기 <FiArrowRight /></Link></details>
    <details><summary>배송과 주문</summary><p>위에서 변경한 구성이 장바구니에 반영됩니다. 배송지와 주문 금액은 주문 화면에서 확인할 수 있습니다.</p><Link href="/shipping">배송 안내 <FiArrowRight /></Link></details>
    <details><summary>조립과 관리</summary><p>가구의 행 높이와 도어·서랍 구성은 3D 화면에서 확인하세요. 제작·조립 관련 문의는 상담 페이지에서 안내받을 수 있습니다.</p><Link href="/faq">자주 묻는 질문 <FiArrowRight /></Link></details>
    <details><summary>제품 문의</summary><Link href="/contact">이 디자인에 대해 상담하기 <FiArrowRight /></Link></details>
  </div></section>;
}

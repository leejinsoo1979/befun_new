'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { create } from 'zustand';
import { FiArrowRight, FiHeart, FiMaximize, FiShare2 } from 'react-icons/fi';
import { useShelfStore } from '@/stores/useShelfStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useCartStore } from '@/stores/useCartStore';
import { useDisplayStore } from '@/components/three/display/displayStore';
import { StyleSelector } from '@/components/ui/StyleSelector';
import { DimensionPanel } from '@/components/ui/DimensionPanel';
import { DensitySlider } from '@/components/ui/DensitySlider';
import { BackPanelToggle } from '@/components/ui/BackPanelToggle';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { FloatingBox } from '@/components/ui/FloatingBox';
import { formatPrice } from '@/lib/pricing';
import type { CatalogProduct } from './catalog';
import { configurationPrice, currentConfiguration, loadProductConfiguration, restoreSavedConfiguration } from './configuration';
import { saveLocalDesign, type SavedDesign } from './savedDesign';
import { Dialog, ReferenceImage } from './StorefrontUI';
import { productGalleries } from './productGalleries';
import { useSavedProducts } from './useSavedProducts';
import styles from './storefront.module.css';

const Scene = dynamic(() => import('@/components/three/Scene'), {
  ssr: false, loading: () => <div className={styles.viewerLoading} role="status">3D 디자인을 불러오는 중…</div>,
});
const usePreparedProduct = create<{ id: string | null }>(() => ({ id: null }));

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
  const router = useRouter();
  const price = useConfigurationPrice();
  const { saved, toggleSaved } = useSavedProducts();
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const [localSave, setLocalSave] = useState(false);
  const prepared = usePreparedProduct(state => state.id === product.id);
  const gallery = productGalleries[product.id] ?? [];
  useEffect(() => {
    if (configuration) restoreSavedConfiguration(configuration);
    else loadProductConfiguration(product);
    const display = useDisplayStore.getState();
    display.resetAssembly();
    display.setAppearance('realistic');
    display.selectView('front');
    usePreparedProduct.setState({ id: product.id });
    return () => { usePreparedProduct.setState({ id: null }); };
  }, [product, configuration]);
  if (!prepared) return <section className={styles.productConfigurator} aria-label={`${product.name} 3D 커스터마이저`}><div className={styles.productViewer}><div className={styles.viewerHeading}><h1>{product.name}</h1></div><div className={styles.viewerLoading} role="status">3D 디자인을 불러오는 중…</div></div></section>;
  const addToCart = () => {
    useCartStore.getState().addItem({ designId: '', designConfig: currentConfiguration(), quantity: 1, price: price.finalPrice });
    router.push('/cart');
  };
  const saveDesign = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    setLocalSave(false);
    const config = currentConfiguration();
    try {
      const response = await fetch('/api/designs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (!response.ok) throw new Error('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      const { shareCode } = await response.json();
      if (typeof shareCode !== 'string' || !shareCode) throw new Error('공유 링크를 만들지 못했습니다.');
      setCopied(false);
      setShareUrl(`${window.location.origin}/share/${shareCode}`);
    } catch (cause) {
      try {
        setShareUrl(saveLocalDesign({ version: 1, name: product.name, config }));
        setCopied(false);
        setLocalSave(true);
      } catch {
        setError(cause instanceof Error ? cause.message : '디자인을 저장하지 못했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };
  return <section className={styles.productConfigurator} aria-label={`${product.name} 3D 커스터마이저`}>
    <div className={styles.productViewer}>
      <div className={styles.viewerHeading}><h1>{product.name}</h1>{!configuration ? <button aria-label="즐겨찾기" aria-pressed={saved.includes(product.id)} onClick={() => toggleSaved(product.id)}><FiHeart fill={saved.includes(product.id) ? 'currentColor' : 'none'} /></button> : null}</div>
      <div className={styles.productScene}>{photo === null ? <><Scene /><FloatingBox /></> : <ReferenceImage source={gallery[photo]} fallback={product.image} alt={`${product.name} 디자인 레퍼런스 ${photo + 1}`} sizes="70vw" className={styles.viewerPhoto} />}</div>
      {photo === null ? <button className={styles.fullscreenButton} onClick={() => router.push('/configurator')}><FiMaximize /> 전체 화면</button> : null}
      <div className={styles.viewerThumbnails} role="group" aria-label="제품 보기"><button aria-pressed={photo === null} onClick={() => setPhoto(null)}>3D</button>{gallery.map((image, index) => <button key={image} aria-label={`레퍼런스 사진 ${index + 1}`} aria-pressed={photo === index} onClick={() => setPhoto(index)}><ReferenceImage source={image} fallback={product.image} alt="" sizes="75px" /></button>)}</div>
    </div>
    <div className={styles.productOptions}>
      <div className={styles.configPrice} aria-live="polite"><div><del>{formatPrice(price.originalPrice)}</del><span>−{price.discountRate}%</span></div><strong>{formatPrice(price.finalPrice)}</strong></div>
      <StyleSelector /><DensitySlider /><DimensionPanel /><BackPanelToggle /><ColorPicker />
      <div className={styles.configActions}><button className={styles.darkButton} onClick={addToCart}>장바구니에 담기 <FiArrowRight /></button><button className={styles.outlineButton} disabled={saving} onClick={saveDesign}><FiShare2 /> {saving ? '디자인 저장 중…' : '디자인 저장·공유'}</button></div>
      {error ? <p className={styles.configError} role="alert">{error}</p> : null}
      <p className={styles.configHelp}>선반의 칸을 선택해 행 높이와 도어·서랍을 변경하세요. <Link href="/contact">도움받기</Link></p>
    </div>
    {shareUrl ? <Dialog title={localSave ? "이 브라우저에 디자인이 저장되었습니다" : "디자인이 저장되었습니다"} close={() => setShareUrl('')}>{localSave ? <p className={styles.localSaveNotice}>서버 저장을 사용할 수 없어 이 브라우저에 보관했습니다. 아래 링크에는 디자인 구성이 담겨 있어 다른 브라우저에서도 열 수 있습니다.</p> : null}<label className={styles.shareField}>디자인 공유 링크<input readOnly value={shareUrl} onFocus={event => event.target.select()} /></label><div className={styles.configActions}><button className={styles.darkButton} onClick={async () => { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); } catch { setError('링크를 선택해서 복사해 주세요.'); } }}>{copied ? '복사되었습니다' : '링크 복사'}</button><Link href={shareUrl} className={styles.outlineButton}>저장한 디자인 열기</Link></div>{error ? <p className={styles.configError} role="alert">{error}</p> : null}</Dialog> : null}
  </section>;
}

export function ProductSpecifications() {
  const { width, depth, numRows, rowHeights, thickness, style, density, hasBackPanel } = useShelfStore();
  const { currentColor, colorCategory } = useMaterialStore();
  const { doorsCreatedLayers, drawersCreatedLayers } = useHardwareStore();
  const prepared = usePreparedProduct(state => state.id !== null);
  const height = thickness + rowHeights.slice(0, numRows).reduce((total, row) => total + row + thickness, 0) + 1;
  return <section className={`${styles.section} ${styles.productSpecifications}`}><h2>제품 사양</h2><div className={styles.specificationRows}>
    <details open><summary>치수와 구성</summary>{prepared ? <dl><dt>너비 × 높이 × 깊이</dt><dd>{Math.round(width)} × {Math.round(height)} × {depth} cm</dd><dt>스타일 · 밀도</dt><dd>{style} · {density}%</dd><dt>선반 행</dt><dd>{numRows}행</dd><dt>도어 · 서랍</dt><dd>{doorsCreatedLayers.length}행 · {drawersCreatedLayers.length}행</dd><dt>뒷판</dt><dd>{hasBackPanel ? '포함' : '없음'}</dd></dl> : <p>선택한 디자인을 불러오는 중…</p>}</details>
    <details><summary>소재와 컬러</summary><p>{colorCategory} · {currentColor.replace(/^[SCN]_/, '')}</p><Link href="/material-samples">소재와 컬러 살펴보기 <FiArrowRight /></Link></details>
    <details><summary>배송과 주문</summary><p>위에서 변경한 구성이 장바구니에 반영됩니다. 배송지와 주문 금액은 주문 화면에서 확인할 수 있습니다.</p><Link href="/shipping">배송 안내 <FiArrowRight /></Link></details>
    <details><summary>조립과 관리</summary><p>가구의 행 높이와 도어·서랍 구성은 3D 화면에서 확인하세요. 제작·조립 관련 문의는 상담 페이지에서 안내받을 수 있습니다.</p><Link href="/faq">자주 묻는 질문 <FiArrowRight /></Link></details>
    <details><summary>제품 문의</summary><Link href="/contact">이 디자인에 대해 상담하기 <FiArrowRight /></Link></details>
  </div></section>;
}

'use client';

import { useRef, useState } from 'react';
import { useLocale } from '@/lib/commerce/useLocale';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ConfiguratorLoading } from '@/components/ui/ConfiguratorLoading';
import Link from 'next/link';
import Image from 'next/image';
import { LegacyShelfPanel, LEGACY_BEFORE_FEET, LEGACY_AFTER_FEET } from '@/components/ui/furniture-panels';
import { FeetSelector } from '@/components/ui/FeetSelector';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { FloatingBox } from '@/components/ui/FloatingBox';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { ShareModal } from '@/components/ui/ShareModal';
import { ARModal } from '@/components/ui/ARModal';
import { MobileConfiguratorPanel } from '@/components/ui/MobileConfiguratorPanel';
import { AROverlay } from '@/components/ui/AROverlay';
import { QuickLookSheet } from '@/components/ui/QuickLookSheet';
import { detectARMode } from '@/components/three/ar/arSupport';
import { useARStore } from '@/components/three/ar/arStore';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useCartStore } from '@/stores/useCartStore';
import { calculatePrice } from '@/lib/pricing';
import { saveDesignForOptimizer } from '@/lib/optimizer/befun/session';
import { calculateGridPanels } from '@/lib/three/styles/grid';
import { calculateSlantPanels } from '@/lib/three/styles/slant';
import { calculatePixelPanels } from '@/lib/three/styles/pixel';
import { calculateGradientPanels } from '@/lib/three/styles/gradient';
import { calculatePatternPanels } from '@/lib/three/styles/pattern';
import { calculateMosaicPanels } from '@/lib/three/styles/mosaic';
import type { ColorCategory } from '@/types/shelf';

// R3F Canvas는 SSR 불가 → dynamic import
const Scene = dynamic(() => import('@/components/three/Scene'), {
  ssr: false,
  loading: () => <ConfiguratorLoading />,
});

export default function ConfiguratorPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showARModal, setShowARModal] = useState(false);
  const [showQuickLook, setShowQuickLook] = useState(false);
  const arOverlayRef = useRef<HTMLDivElement>(null);


  const addItem = useCartStore((s) => s.addItem);

  const getDesignConfig = () => {
    const shelf = useShelfStore.getState();
    const { currentColor, colorCategory } = useMaterialStore.getState();
    const { doorsCreatedLayers, drawersCreatedLayers, rowStyles: hardwareRowStyles } = useHardwareStore.getState();
    return {
      baseType: shelf.baseType,
      legFinish: shelf.legFinish,
      style: shelf.style,
      density: shelf.density,
      width: shelf.width,
      height: shelf.height,
      depth: shelf.depth,
      hasBackPanel: shelf.hasBackPanel,
      color: currentColor,
      colorCategory,
      rowHeights: shelf.rowHeights,
      numRows: shelf.numRows,
      doorsCreatedLayers,
      drawersCreatedLayers,
      hardwareRowStyles,
    };
  };

  const getPrice = () => {
    const shelf = useShelfStore.getState();
    const { colorCategory } = useMaterialStore.getState();
    const { doorsCreatedLayers, drawersCreatedLayers, rowStyles: hardwareRowStyles } = useHardwareStore.getState();
    const layers = new Set<number>();
    doorsCreatedLayers.forEach((l) => layers.add(l));
    drawersCreatedLayers.forEach((l) => layers.add(l));
    const hardwareLayers = Array.from(layers);
    const input = {
      width: shelf.width,
      height: shelf.height,
      depth: shelf.depth,
      thickness: shelf.thickness,
      density: shelf.density,
      rowHeights: shelf.rowHeights,
      numRows: shelf.numRows,
      hasBackPanel: shelf.hasBackPanel,
      hardwareLayers,
      hardwareRowStyles,
      family: colorCategory === 'classic' || colorCategory === 'natural' ? 'type01' as const : 'type02' as const,
    };
    let panels;
    switch (shelf.style) {
      case 'grid': panels = calculateGridPanels(input).panels; break;
      case 'slant': panels = calculateSlantPanels(input).panels; break;
      case 'pixel': panels = calculatePixelPanels(input).panels; break;
      case 'gradient': panels = calculateGradientPanels(input).panels; break;
      case 'pattern': panels = calculatePatternPanels(input).panels; break;
      case 'mosaic': panels = calculateMosaicPanels(input).panels; break;
      default: panels = calculateGridPanels(input).panels;
    }
    const totalPanelVolume = panels.reduce((sum, p) => sum + p.w * p.h * p.d, 0);
    const result = calculatePrice({
      totalPanelVolume,
      colorCategory: colorCategory as ColorCategory,
    });
    return result.finalPrice;
  };

  const handleAddToCart = () => {
    addItem({
      designId: '',
      designConfig: getDesignConfig(),
      quantity: 1,
      price: getPrice(),
    });
    router.push('/cart');
  };

  const handleOpenOptimizer = () => {
    saveDesignForOptimizer();
    router.push('/optimizer');
  };

  const handleSaveDesign = async (): Promise<string | null> => {
    setSaving(true);
    try {
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: getDesignConfig() }),
      });
      if (!res.ok) throw new Error();
      const { shareCode } = await res.json();
      const url = `${window.location.origin}/share/${shareCode}`;
      setShareUrl(url);
      return url;
    } catch {
      alert(t('디자인 저장에 실패했습니다'));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleShareClick = async () => {
    const url = await handleSaveDesign();
    if (url) setShowShareModal(true);
  };

  // AR: 안드로이드 → WebXR(놓은 채 실시간 수정), 아이폰 → Quick Look, 그 외(데스크톱) → 폰으로 열 QR
  const handleARClick = async () => {
    const mode = await detectARMode();
    if (mode === 'webxr') {
      const start = useARStore.getState().startWebXR;
      if (start && arOverlayRef.current) {
        try {
          await start(arOverlayRef.current);
          return;
        } catch (err) {
          console.error('[Befun] AR 시작 실패', err);
          alert(t('AR을 시작하지 못했어요. 카메라 권한을 확인해주세요.'));
          return;
        }
      }
    }
    if (mode === 'quicklook') {
      setShowQuickLook(true);
      return;
    }
    const url = await handleSaveDesign();
    if (url) setShowARModal(true);
  };

  return (
    // 모바일: 화면 높이(dvh)에 고정한 앱형 레이아웃 / 데스크톱: 기존 레이아웃
    <div onDragStartCapture={(event) => event.preventDefault()} className="flex h-[100dvh] select-none flex-col overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-visible [&_input]:select-text [&_textarea]:select-text">
      {/* Header */}
      <header className="shrink-0 border-b border-[#eee]">
        <div className="flex h-[56px] items-center justify-between px-4 lg:h-[80px] lg:px-5">
          <Link href="/">
            <Image
              src="/imgs/icon/befun_logo.svg"
              alt="Befun"
              width={120}
              height={28}
              unoptimized
              priority
              className="ml-2 lg:ml-5"
            />
          </Link>
          <ul className="flex list-none gap-[10px] pr-2 text-xs lg:pr-5">
            <li>
              <button type="button" onClick={handleOpenOptimizer} className="cursor-pointer">
                {t('CNC 옵티마이저')}
              </button>
            </li>
            <li><Link href="/myshop">{t('myshop')}</Link></li>
            <li><Link href="/cart">{t('장바구니')}</Link></li>
          </ul>
        </div>
      </header>

      {/* Configurator: canvas + gui */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-[#eee] lg:h-[calc(100vh-80px)] lg:flex-none lg:flex-row">
        {/* Canvas 영역: 모바일은 하단 시트를 뺀 나머지 전부, 데스크톱 flex-1 */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
          <Scene onShare={handleShareClick} onAR={handleARClick} actionsDisabled={saving} />

          {/* Floating box - 행 마우스 오버 시 표시 */}
          <FloatingBox />

        </div>

        {/* 공유 모달 */}
        {showShareModal && shareUrl && (
          <ShareModal shareUrl={shareUrl} onClose={() => setShowShareModal(false)} />
        )}

        {/* AR 모달 (데스크톱: 폰으로 열 QR) */}
        {showARModal && shareUrl && (
          <ARModal shareUrl={shareUrl} onClose={() => setShowARModal(false)} />
        )}

        {/* 아이폰 AR Quick Look */}
        {showQuickLook && <QuickLookSheet onClose={() => setShowQuickLook(false)} />}

        {/* 안드로이드 WebXR 오버레이 UI (세션 중에만 표시) */}
        <AROverlay rootRef={arOverlayRef} onPurchase={handleAddToCart} />

        {/* GUI 패널: 데스크톱 460px (모바일은 MobileConfiguratorPanel) */}
        <div className="hidden shrink-0 flex-col overflow-y-auto bg-white px-4 pt-4 pb-6 shadow-[inset_0_1px_0_#eee] sm:px-6 lg:flex lg:w-[460px] lg:px-8 lg:pt-5 lg:pb-8 lg:shadow-[inset_1px_0_0_#eee]">
          {/* Price header */}
          <div className="mb-1">
            <h2 className="text-[14px] font-normal text-[#333]">{t('다용도 수납장 기본형')}</h2>
            <PriceDisplay />
          </div>

          {/* Controls */}
          {/* Style→Density→Width→Height→Depth (기존 선반 store 연결 패널) → Feet → Back panels */}
          <LegacyShelfPanel controls={LEGACY_BEFORE_FEET} />
          <FeetSelector />
          <LegacyShelfPanel controls={LEGACY_AFTER_FEET} />
          <ColorPicker />

          {/* Purchase button */}
          <div className="mt-5">
            <button
              onClick={handleAddToCart}
              className="w-full cursor-pointer rounded-full bg-[var(--green)] py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[#2a7a1a] active:scale-[0.98]"
            >
              {t('구매하기')}
            </button>
            <p className="mt-3 text-center text-[11px] text-[#bbb]">
              {t('Made in KR · 제작 5-6주 소요')}
            </p>
          </div>
        </div>

        {/* 모바일 하단 시트 */}
        <MobileConfiguratorPanel onPurchase={handleAddToCart} />
      </div>
    </div>
  );
}

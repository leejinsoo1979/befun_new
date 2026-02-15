'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { TfiRulerAlt } from 'react-icons/tfi';
import { FiShare } from 'react-icons/fi';
import { TbAugmentedReality2 } from 'react-icons/tb';
import { StyleSelector } from '@/components/ui/StyleSelector';
import { DimensionPanel } from '@/components/ui/DimensionPanel';
import { DensitySlider } from '@/components/ui/DensitySlider';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { BackPanelToggle } from '@/components/ui/BackPanelToggle';
import { FloatingBox } from '@/components/ui/FloatingBox';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { ShareModal } from '@/components/ui/ShareModal';
import { ARModal } from '@/components/ui/ARModal';
import { useShelfStore } from '@/stores/useShelfStore';
import { useUIStore } from '@/stores/useUIStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useCartStore } from '@/stores/useCartStore';
import { calculatePrice } from '@/lib/pricing';
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
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <p className="text-gray-500">3D 뷰어 로딩 중...</p>
    </div>
  ),
});

export default function ConfiguratorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showARModal, setShowARModal] = useState(false);

  const showDimensions = useUIStore((s) => s.showDimensions);
  const setShowDimensions = useUIStore((s) => s.setShowDimensions);

  const addItem = useCartStore((s) => s.addItem);

  const getDesignConfig = () => {
    const shelf = useShelfStore.getState();
    const { currentColor, colorCategory } = useMaterialStore.getState();
    const { doorsCreatedLayers, drawersCreatedLayers } = useHardwareStore.getState();
    return {
      style: shelf.style,
      density: shelf.density,
      width: shelf.width,
      height: shelf.height,
      depth: shelf.depth,
      hasBackPanel: shelf.hasBackPanel,
      color: currentColor,
      colorCategory,
      rowHeights: shelf.rowHeights,
      numRows: shelf.rowHeights.length,
      doorsCreatedLayers,
      drawersCreatedLayers,
    };
  };

  const getPrice = () => {
    const shelf = useShelfStore.getState();
    const { colorCategory } = useMaterialStore.getState();
    const { doorsCreatedLayers, drawersCreatedLayers } = useHardwareStore.getState();
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
      alert('디자인 저장에 실패했습니다');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleShareClick = async () => {
    const url = await handleSaveDesign();
    if (url) setShowShareModal(true);
  };

  const handleARClick = async () => {
    const url = await handleSaveDesign();
    if (url) setShowARModal(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-[#eee]">
        <div className="flex h-[56px] items-center justify-between px-4 lg:h-[80px] lg:px-5">
          <Link href="/">
            <Image
              src="/imgs/icon/main_logo_new.png"
              alt="Befun"
              width={120}
              height={40}
              className="ml-2 lg:ml-5"
            />
          </Link>
          <ul className="flex list-none gap-[10px] pr-2 text-xs lg:pr-5">
            <li><Link href="/myshop">myshop</Link></li>
            <li><Link href="/cart">장바구니</Link></li>
          </ul>
        </div>
      </header>

      {/* Configurator: canvas + gui */}
      <div className="flex flex-1 flex-col overflow-hidden border-b border-[#eee] lg:flex-row" style={{ minHeight: '100vh' }}>
        {/* Canvas 영역: 모바일 50vh, 데스크톱 flex-1 */}
        <div className="relative h-[50vh] shrink-0 overflow-hidden bg-white lg:h-auto lg:flex-1">
          <Scene />

          {/* Control buttons (ruler/share/AR) */}
          <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { key: 'ruler', icon: <TfiRulerAlt size={18} color="#333" />, onClick: () => setShowDimensions(!showDimensions), isActive: showDimensions },
              { key: 'share', icon: <FiShare size={18} color="#333" />, onClick: handleShareClick, disabled: saving },
              { key: 'ar', icon: <TbAugmentedReality2 size={20} color="#333" />, onClick: handleARClick, disabled: saving },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={btn.onClick}
                disabled={btn.disabled}
                style={{
                  width: 36, height: 36, minWidth: 36, minHeight: 36,
                  borderRadius: '50%',
                  border: `1px solid ${btn.isActive ? 'var(--green)' : '#ccc'}`,
                  background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                  opacity: btn.disabled ? 0.5 : 1,
                }}
              >
                {btn.icon}
              </button>
            ))}
          </div>

          {/* Floating box - 행 마우스 오버 시 표시 */}
          <FloatingBox />

        </div>

        {/* 공유 모달 */}
        {showShareModal && shareUrl && (
          <ShareModal shareUrl={shareUrl} onClose={() => setShowShareModal(false)} />
        )}

        {/* AR 모달 */}
        {showARModal && shareUrl && (
          <ARModal shareUrl={shareUrl} onClose={() => setShowARModal(false)} />
        )}

        {/* GUI 패널: 모바일 전체폭, 데스크톱 460px */}
        <div className="flex shrink-0 flex-col overflow-y-auto bg-white px-4 pt-4 pb-6 shadow-[inset_0_1px_0_#eee] sm:px-6 lg:w-[460px] lg:px-8 lg:pt-5 lg:pb-8 lg:shadow-[inset_1px_0_0_#eee]">
          {/* Price header */}
          <div className="mb-1">
            <h2 className="text-[14px] font-normal text-[#333]">다용도 수납장 기본형</h2>
            <PriceDisplay />
          </div>

          {/* Controls */}
          <StyleSelector />
          <DensitySlider />
          <DimensionPanel />
          <BackPanelToggle />
          <ColorPicker />

          {/* Purchase button */}
          <div className="mt-5">
            <button
              onClick={handleAddToCart}
              className="w-full cursor-pointer rounded-full bg-[var(--green)] py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[#2a7a1a] active:scale-[0.98]"
            >
              구매하기
            </button>
            <p className="mt-3 text-center text-[11px] text-[#bbb]">
              Made in KR &middot; 제작 5-6주 소요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

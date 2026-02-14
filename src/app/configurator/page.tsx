'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
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
    const input = {
      width: shelf.width,
      height: shelf.height,
      depth: shelf.depth,
      thickness: shelf.thickness,
      density: shelf.density,
      rowHeights: shelf.rowHeights,
      numRows: shelf.numRows,
      hasBackPanel: shelf.hasBackPanel,
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
        <div className="flex h-[80px] items-center justify-between px-5">
          <Link href="/">
            <Image
              src="/imgs/icon/main_logo_new.png"
              alt="Befun"
              width={120}
              height={40}
              className="ml-5"
            />
          </Link>
          <ul className="flex list-none gap-[10px] pr-5 text-xs">
            <li><Link href="/myshop">myshop</Link></li>
            <li><Link href="/cart">장바구니</Link></li>
          </ul>
        </div>
      </header>

      {/* Configurator: canvas + gui */}
      <div className="flex flex-1 overflow-hidden border-b border-[#eee]" style={{ minHeight: '100vh' }}>
        {/* Canvas 영역 */}
        <div className="relative flex-1 overflow-hidden bg-white">
          <Scene />

          {/* Control buttons (ruler/share/AR) */}
          <div className="absolute right-3 top-20 z-10 flex w-[50px] flex-col items-end">
            <button
              onClick={() => setShowDimensions(!showDimensions)}
              className={`mb-[5px] flex h-10 w-10 items-center justify-center rounded-[20px] border bg-white cursor-pointer hover:border-[var(--green)] ${showDimensions ? 'border-[var(--green)]' : 'border-gray-400'}`}
            >
              <Image src="/imgs/icon/icon_ruler.svg" alt="ruler" width={20} height={20} />
            </button>
            <button
              onClick={handleShareClick}
              disabled={saving}
              className="mb-[5px] flex h-10 w-10 items-center justify-center rounded-[20px] border border-gray-400 bg-white cursor-pointer hover:border-[var(--green)] disabled:opacity-50"
            >
              <Image src="/imgs/icon/icon_share.svg" alt="share" width={20} height={20} />
            </button>
            <button
              onClick={handleARClick}
              disabled={saving}
              className="mb-[5px] flex h-10 w-10 items-center justify-center rounded-[20px] border border-gray-400 bg-white cursor-pointer hover:border-[var(--green)] disabled:opacity-50"
            >
              <Image src="/imgs/icon/icon_ar.svg" alt="ar" width={20} height={20} />
            </button>
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

        {/* GUI 패널 */}
        <div className="flex w-[460px] shrink-0 flex-col overflow-y-auto bg-white px-8 pt-5 pb-8 shadow-[inset_1px_0_0_#eee]">
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

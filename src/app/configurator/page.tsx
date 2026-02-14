'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { StyleSelector } from '@/components/ui/StyleSelector';
import { DimensionPanel } from '@/components/ui/DimensionPanel';
import { DensitySlider } from '@/components/ui/DensitySlider';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { BackPanelToggle } from '@/components/ui/BackPanelToggle';
import { RowControls } from '@/components/ui/RowControls';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { useCartStore } from '@/stores/useCartStore';
import { calculatePrice } from '@/lib/pricing';
import type { ColorCategory } from '@/types/shelf';

// R3F Canvas는 SSR 불가 → dynamic import
const Scene = dynamic(() => import('@/components/three/Scene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#e9eaea]">
      <p className="text-gray-500">3D 뷰어 로딩 중...</p>
    </div>
  ),
});

export default function ConfiguratorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

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
    const result = calculatePrice({
      width: shelf.width,
      height: shelf.height,
      depth: shelf.depth,
      colorCategory: colorCategory as ColorCategory,
      doorCount: doorsCreatedLayers.length,
      drawerCount: drawersCreatedLayers.length,
    });
    return result.finalPrice;
  };

  const handleAddToCart = () => {
    addItem({
      designId: '', // 저장 전이므로 빈 문자열
      designConfig: getDesignConfig(),
      quantity: 1,
      price: getPrice(),
    });
    router.push('/cart');
  };

  const handleSaveDesign = async () => {
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
      await navigator.clipboard.writeText(url);
    } catch {
      alert('디자인 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* 3D 뷰어 */}
      <div className="relative flex-1">
        <Scene />
        {/* 홈 링크 */}
        <Link
          href="/"
          className="absolute left-4 top-4 text-lg font-bold text-gray-700 hover:text-gray-900"
        >
          Befun
        </Link>
      </div>

      {/* 우측 컨트롤 패널 */}
      <aside className="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white">
        <div className="p-5">
          <h2 className="mb-1 text-base font-semibold">다용도 수납장 기본형</h2>
          <p className="mb-5 text-xs text-gray-400">맞춤 설정</p>

          <StyleSelector />
          <DensitySlider />
          <DimensionPanel />
          <BackPanelToggle />
          <ColorPicker />
          <RowControls />
          <PriceDisplay />

          {/* 장바구니 담기 */}
          <button
            onClick={handleAddToCart}
            className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            장바구니 담기
          </button>

          {/* 디자인 공유 */}
          <button
            onClick={handleSaveDesign}
            disabled={saving}
            className="mt-2 w-full rounded-lg border border-gray-300 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:text-gray-400"
          >
            {saving ? '저장 중...' : shareUrl ? '링크 복사됨!' : '디자인 공유하기'}
          </button>
        </div>
      </aside>
    </div>
  );
}

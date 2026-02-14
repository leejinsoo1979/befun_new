'use client';

import dynamic from 'next/dynamic';
import { StyleSelector } from '@/components/ui/StyleSelector';
import { DimensionPanel } from '@/components/ui/DimensionPanel';
import { DensitySlider } from '@/components/ui/DensitySlider';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { BackPanelToggle } from '@/components/ui/BackPanelToggle';
import { RowControls } from '@/components/ui/RowControls';
import { PriceDisplay } from '@/components/ui/PriceDisplay';

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
  return (
    <div className="flex h-screen w-full">
      {/* 3D 뷰어 */}
      <div className="relative flex-1">
        <Scene />
      </div>

      {/* 우측 컨트롤 패널 */}
      <aside className="w-80 shrink-0 overflow-y-auto border-l border-gray-200 bg-white">
        <div className="p-5">
          <h2 className="mb-1 text-base font-semibold">다용도 수납장 기본형</h2>
          <p className="mb-5 text-xs text-gray-400">맞춤 설정</p>

          {/* 스타일 선택 */}
          <StyleSelector />

          {/* 밀도 조절 */}
          <DensitySlider />

          {/* 치수 조절 (너비/높이/깊이) */}
          <DimensionPanel />

          {/* 백패널 토글 */}
          <BackPanelToggle />

          {/* 색상 선택 */}
          <ColorPicker />

          {/* 행별 설정 (높이/도어/서랍) */}
          <RowControls />

          {/* 가격 표시 */}
          <PriceDisplay />

          {/* 구매 버튼 */}
          <button className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
            구매하기
          </button>
        </div>
      </aside>
    </div>
  );
}

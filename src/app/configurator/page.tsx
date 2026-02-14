'use client';

import dynamic from 'next/dynamic';

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

      {/* 우측 컨트롤 패널 — Phase 3에서 구현 */}
      <aside className="w-80 overflow-y-auto border-l border-gray-200 bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold">설정</h2>
        <p className="text-sm text-gray-400">Phase 3에서 UI 컨트롤 구현 예정</p>
      </aside>
    </div>
  );
}

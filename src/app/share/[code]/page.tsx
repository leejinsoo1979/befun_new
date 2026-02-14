'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShopLayout } from '@/components/common/ShopLayout';
import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import type { DesignConfig } from '@/lib/sharing';

export default function SharePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [design, setDesign] = useState<{
    config: DesignConfig;
    thumbnailUrl?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchDesign() {
      try {
        const res = await fetch(`/api/designs/${code}`);
        if (!res.ok) throw new Error('디자인을 찾을 수 없습니다');
        const data = await res.json();
        setDesign(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류 발생');
      } finally {
        setLoading(false);
      }
    }
    fetchDesign();
  }, [code]);

  const handleLoadDesign = () => {
    if (!design?.config) return;
    const cfg = design.config;

    // Zustand 스토어에 디자인 설정 로드
    const shelf = useShelfStore.getState();
    shelf.setWidth(cfg.width);
    shelf.setDepth(cfg.depth);
    shelf.setStyle(cfg.style as 'grid' | 'slant' | 'pixel' | 'gradient' | 'mosaic');
    shelf.setDensity(cfg.density);
    shelf.setHasBackPanel(cfg.hasBackPanel);
    if (cfg.rowHeights) {
      shelf.setRowHeights(cfg.rowHeights);
    }

    const mat = useMaterialStore.getState();
    mat.setColor(cfg.color, cfg.colorCategory as 'classic' | 'natural' | 'solid' | 'edgeMix');

    const hw = useHardwareStore.getState();
    hw.reset();
    cfg.doorsCreatedLayers?.forEach((layer) => hw.toggleDoor(layer));
    cfg.drawersCreatedLayers?.forEach((layer) => hw.toggleDrawer(layer));

    router.push('/configurator');
  };

  if (loading) {
    return (
      <ShopLayout>
        <div className="py-20 text-center text-gray-500">디자인 로딩 중...</div>
      </ShopLayout>
    );
  }

  if (error || !design) {
    return (
      <ShopLayout>
        <div className="py-20 text-center">
          <p className="mb-4 text-gray-500">{error || '디자인을 찾을 수 없습니다'}</p>
          <Link href="/" className="text-sm text-gray-600 underline">
            홈으로 돌아가기
          </Link>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">공유된 디자인</h1>
        <p className="mb-8 text-sm text-gray-400">공유코드: {code}</p>

        {/* 디자인 미리보기 */}
        <div className="mb-8 aspect-video overflow-hidden rounded-xl bg-gray-100">
          {design.thumbnailUrl ? (
            <img
              src={design.thumbnailUrl}
              alt="가구 디자인"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              3D 미리보기
            </div>
          )}
        </div>

        {/* 디자인 정보 */}
        <div className="mb-8 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-gray-50 p-3">
            <span className="text-gray-500">스타일</span>
            <p className="font-medium">{design.config.style}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <span className="text-gray-500">크기</span>
            <p className="font-medium">
              {design.config.width} x {design.config.height} x {design.config.depth}cm
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <span className="text-gray-500">색상</span>
            <p className="font-medium">{design.config.color}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <span className="text-gray-500">행 수</span>
            <p className="font-medium">{design.config.numRows}행</p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleLoadDesign}
            className="flex-1 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            이 디자인으로 시작하기
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('링크가 복사되었습니다');
            }}
            className="rounded-lg border border-gray-300 px-5 py-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            링크 복사
          </button>
        </div>
      </div>
    </ShopLayout>
  );
}

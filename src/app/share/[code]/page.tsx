'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShopLayout } from '@/components/common/ShopLayout';
import { restoreSavedConfiguration } from '@/components/storefront/configuration';
import { parseSavedDesign, type SavedDesign } from '@/components/storefront/savedDesign';
import { baseHeight } from '@/lib/three/furniture-base';

export default function SharePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string; retryable: boolean } | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [design, setDesign] = useState<{
    config: SavedDesign['config'];
    thumbnailUrl?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function fetchDesign() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/designs/${encodeURIComponent(code)}`, { signal: controller.signal });
        const data = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok) {
          if (res.status === 404 && data?.code === 'DESIGN_NOT_FOUND') {
            setError({ title: '디자인을 찾을 수 없습니다', message: '공유 링크를 다시 확인해 주세요.', retryable: false });
          } else if (res.status === 503 && data?.code === 'DESIGN_STORAGE_UNAVAILABLE') {
            setError({ title: '저장 서비스가 준비되지 않았습니다', message: '지금은 서버에 보관한 디자인을 조회할 수 없습니다. 잠시 후 다시 시도해 주세요.', retryable: true });
          } else {
            setError({ title: '디자인을 불러오지 못했습니다', message: '서버 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', retryable: true });
          }
          return;
        }
        const saved = parseSavedDesign(JSON.stringify({ version: 1, name: '', config: data?.config }));
        if (!saved) {
          setError({ title: '디자인을 불러오지 못했습니다', message: '서버에서 유효한 디자인을 받지 못했습니다. 다시 시도해 주세요.', retryable: true });
          return;
        }
        setDesign({ config: saved.config, thumbnailUrl: typeof data.thumbnailUrl === 'string' ? data.thumbnailUrl : undefined });
      } catch {
        if (active) setError({ title: '네트워크 연결을 확인해 주세요', message: '공유 디자인을 조회하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.', retryable: true });
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchDesign();
    return () => { active = false; controller.abort(); };
  }, [code, retryAttempt]);

  const handleLoadDesign = () => {
    if (!design?.config) return;
    if (!restoreSavedConfiguration(design.config)) {
      setError({ title: '디자인을 불러오지 못했습니다', message: '유효하지 않은 디자인 구성입니다. 다시 조회해 주세요.', retryable: true });
      return;
    }
    router.push('/configurator');
  };

  if (loading) {
    return (
      <ShopLayout>
        <div className="py-20 text-center text-gray-500" role="status">디자인 로딩 중...</div>
      </ShopLayout>
    );
  }

  if (error || !design) {
    return (
      <ShopLayout>
        <div className="py-20 text-center">
          <div role="alert">
            <h1 className="mb-3 text-xl font-semibold">{error?.title ?? '디자인을 불러오지 못했습니다'}</h1>
            <p className="mb-4 text-gray-500">{error?.message ?? '공유 링크를 다시 확인해 주세요.'}</p>
          </div>
          {error?.retryable && <button type="button" onClick={() => setRetryAttempt(attempt => attempt + 1)} className="mb-5 rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white">다시 시도</button>}
          <br />
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
              {design.config.width} x {design.config.height + baseHeight(design.config.baseType)} x {design.config.depth}cm
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

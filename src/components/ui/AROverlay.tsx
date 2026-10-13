'use client';

import { useEffect, type RefObject } from 'react';
import { FiX, FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import { useARStore } from '@/components/three/ar/arStore';
import { MobileConfiguratorPanel } from './MobileConfiguratorPanel';

interface AROverlayProps {
  /** WebXR dom-overlay 루트 — 세션 요청 시 이 요소가 카메라 화면 위에 표시됨 */
  rootRef: RefObject<HTMLDivElement | null>;
  onPurchase: () => void;
}

const ROTATE_STEP = Math.PI / 8; // 22.5°

/**
 * 안드로이드 WebXR AR 화면의 HTML UI
 * - 빈 곳 탭 → 선반 배치/이동 (WebXR select)
 * - UI(data-ar-ui) 위 탭은 beforexrselect를 막아 선반이 움직이지 않게 함
 * - 하단 옵션 패널로 놓은 상태 그대로 실시간 수정
 */
export function AROverlay({ rootRef, onPurchase }: AROverlayProps) {
  const active = useARStore((s) => s.webxrActive);
  const placed = useARStore((s) => s.placed);
  const surfaceFound = useARStore((s) => s.surfaceFound);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onBeforeSelect = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('[data-ar-ui]')) e.preventDefault();
    };
    root.addEventListener('beforexrselect', onBeforeSelect);
    return () => root.removeEventListener('beforexrselect', onBeforeSelect);
  }, [rootRef]);

  const end = () => useARStore.getState().endWebXR?.();
  const rotate = (rad: number) => useARStore.getState().rotateShelf?.(rad);

  const hint = !surfaceFound
    ? '휴대폰을 천천히 움직여 바닥을 비춰주세요'
    : !placed
      ? '원하는 위치의 바닥을 탭해서 선반을 놓으세요'
      : '다른 곳을 탭하면 그 자리로 옮겨져요';

  return (
    <div ref={rootRef} className={active ? 'fixed inset-0 z-[100] flex flex-col justify-between' : 'hidden'}>
      {/* 상단: 종료 / 회전 */}
      <div className="flex items-start justify-between p-4 pt-[max(16px,env(safe-area-inset-top))]">
        <button
          type="button"
          data-ar-ui
          aria-label="AR 종료"
          onClick={end}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#222] shadow-md"
        >
          <FiX size={20} />
        </button>
        {placed && (
          <div data-ar-ui className="flex gap-2">
            <button
              type="button"
              aria-label="왼쪽으로 회전"
              onClick={() => rotate(ROTATE_STEP)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#222] shadow-md"
            >
              <FiRotateCcw size={18} />
            </button>
            <button
              type="button"
              aria-label="오른쪽으로 회전"
              onClick={() => rotate(-ROTATE_STEP)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#222] shadow-md"
            >
              <FiRotateCw size={18} />
            </button>
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="pointer-events-none flex justify-center px-6">
        <p className="rounded-full bg-black/55 px-4 py-2 text-center text-[13px] font-medium text-white">{hint}</p>
      </div>

      {/* 하단: 옵션 패널 (배치 후 표시) */}
      <div data-ar-ui className={placed ? '' : 'invisible'}>
        <MobileConfiguratorPanel
          inOverlay
          onPurchase={() => {
            end();
            onPurchase();
          }}
        />
      </div>
    </div>
  );
}

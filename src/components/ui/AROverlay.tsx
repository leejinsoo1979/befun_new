'use client';

import { useEffect, useState, type RefObject } from 'react';
import { FiChevronLeft, FiRotateCcw, FiRotateCw, FiShoppingCart, FiSliders, FiDroplet } from 'react-icons/fi';
import { useARStore } from '@/components/three/ar/arStore';
import { MobileConfiguratorPanel } from './MobileConfiguratorPanel';
import { ARDimensionSheet } from './ARDimensionSheet';
import { PriceDisplay } from './PriceDisplay';

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
 * - 레이아웃(Tylko 태블릿 AR 참고): 왼쪽 위 쇼룸(종료), 오른쪽 위 가격·장바구니,
 *   아래 '크기 조절'(너비·높이·깊이 자 슬라이더 + 취소/적용) / '스타일·색상'(전체 옵션 패널)
 */
export function AROverlay({ rootRef, onPurchase }: AROverlayProps) {
  const active = useARStore((s) => s.webxrActive);
  const placed = useARStore((s) => s.placed);
  const surfaceFound = useARStore((s) => s.surfaceFound);
  // 하단 시트: 없음 / 크기 조절 / 스타일·색상
  const [sheet, setSheet] = useState<'none' | 'size' | 'options'>('none');

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onBeforeSelect = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('[data-ar-ui]')) e.preventDefault();
    };
    root.addEventListener('beforexrselect', onBeforeSelect);
    return () => root.removeEventListener('beforexrselect', onBeforeSelect);
  }, [rootRef]);

  const end = () => {
    setSheet('none');
    useARStore.getState().endWebXR?.();
  };
  const rotate = (rad: number) => useARStore.getState().rotateShelf?.(rad);
  const purchase = () => {
    end();
    onPurchase();
  };

  const hint = !surfaceFound
    ? '휴대폰을 천천히 움직여 바닥을 비춰주세요'
    : !placed
      ? '원하는 위치의 바닥을 탭해서 선반을 놓으세요'
      : '다른 곳을 탭하면 그 자리로 옮겨져요';
  const pill = 'flex h-11 items-center gap-1.5 rounded-full bg-white/90 px-4 text-[14px] font-medium text-[#222] shadow-md';

  return (
    <div ref={rootRef} className={active ? 'fixed inset-0 z-[100] flex flex-col justify-between' : 'hidden'}>
      {/* 상단: 쇼룸(종료) / 가격·장바구니 */}
      <div className="flex items-start justify-between gap-3 p-4 pt-[max(16px,env(safe-area-inset-top))]">
        <button type="button" data-ar-ui onClick={end} className={`${pill} border border-[var(--green)] text-[var(--green)]`}>
          <FiChevronLeft size={18} /> 쇼룸
        </button>
        <button type="button" data-ar-ui onClick={purchase} aria-label="장바구니에 담기"
          className="flex items-center gap-3 rounded-xl bg-white/90 px-3 py-1.5 shadow-md">
          <PriceDisplay compact />
          <FiShoppingCart size={20} className="text-[var(--green)]" />
        </button>
      </div>

      {/* 안내 + 회전 */}
      <div className="flex flex-col items-center gap-3 px-6">
        {sheet === 'none' && (
          <p className="pointer-events-none rounded-full bg-black/55 px-4 py-2 text-center text-[13px] font-medium text-white">{hint}</p>
        )}
        {placed && sheet === 'none' && (
          <div data-ar-ui className="flex gap-2">
            <button type="button" aria-label="왼쪽으로 회전" onClick={() => rotate(ROTATE_STEP)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#222] shadow-md"><FiRotateCcw size={18} /></button>
            <button type="button" aria-label="오른쪽으로 회전" onClick={() => rotate(-ROTATE_STEP)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#222] shadow-md"><FiRotateCw size={18} /></button>
          </div>
        )}
      </div>

      {/* 하단: 시트 또는 시트 열기 버튼 (배치 후) */}
      <div data-ar-ui className={placed ? '' : 'invisible'}>
        {sheet === 'size' && <ARDimensionSheet onClose={() => setSheet('none')} />}
        {sheet === 'options' && (
          <div>
            <div className="flex justify-end px-4 pb-2">
              <button type="button" onClick={() => setSheet('none')} className={pill}>닫기</button>
            </div>
            <MobileConfiguratorPanel inOverlay onPurchase={purchase} />
          </div>
        )}
        {sheet === 'none' && (
          <div className="flex justify-center gap-3 p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <button type="button" onClick={() => setSheet('size')} className={pill}><FiSliders size={16} /> 크기 조절</button>
            <button type="button" onClick={() => setSheet('options')} className={pill}><FiDroplet size={16} /> 스타일·색상</button>
          </div>
        )}
      </div>
    </div>
  );
}

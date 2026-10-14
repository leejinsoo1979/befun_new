'use client';

import { useRef, useEffect, useSyncExternalStore } from 'react';
import { FiX } from 'react-icons/fi';
import { useUIStore } from '@/stores/useUIStore';
import { closeRowPopup } from '@/components/three/RowHotspots';
import { RowControls } from './RowControls';
import styles from './row-controls.module.css';

// lg(1024px) 미만은 모바일 레이아웃 — 행 옆 팝업 대신 뷰어 하단에 고정
const MOBILE_QUERY = '(max-width: 1023px)';
const subscribeMobile = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getMobile = () => window.matchMedia(MOBILE_QUERY).matches;

/**
 * V1 floating-box: 3D 뷰어 위에 행 컨트롤을 오버레이로 표시
 * 가구 우측 핫스팟을 클릭하면 해당 행 옆에 나타남 (모바일: 뷰어 하단에 고정 표시)
 * 닫기: 닫기 버튼, 같은 핫스팟 재클릭, 팝업 바깥 클릭(드래그 제외), Esc
 */
const CLICK_MAX_MOVE_PX = 6;
export function FloatingBox() {
  const selectedRow = useUIStore((s) => s.selectedRow);
  const floatingBoxX = useUIStore((s) => s.floatingBoxX);
  const floatingBoxY = useUIStore((s) => s.floatingBoxY);
  const boxRef = useRef<HTMLDivElement>(null);
  const isMobile = useSyncExternalStore(subscribeMobile, getMobile, () => false);

  // 화면 밖 넘침 방지
  useEffect(() => {
    if (!boxRef.current || selectedRow === null || isMobile) return;
    const el = boxRef.current;
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement?.getBoundingClientRect();
    if (!parent) return;

    // 오른쪽 넘침 → 왼쪽에 배치
    if (rect.right > parent.right - 20) {
      el.style.left = `${floatingBoxX - rect.width - 60}px`;
    }
    // 아래 넘침
    if (rect.bottom > parent.bottom - 20) {
      el.style.top = `${parent.height - rect.height - 20}px`;
    }
  }, [selectedRow, floatingBoxX, floatingBoxY, isMobile]);

  // 바깥 클릭·Esc로 닫기. 궤도 회전 드래그와 핫스팟 클릭(행 전환/토글)은 제외한다.
  useEffect(() => {
    if (selectedRow === null) return;
    let down: { x: number; y: number } | null = null;
    const isInside = (target: EventTarget | null) =>
      target instanceof Element && (boxRef.current?.contains(target) || target.closest('[data-row-hotspot]') !== null);
    const onDown = (e: PointerEvent) => { down = isInside(e.target) ? null : { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) <= CLICK_MAX_MOVE_PX && !isInside(e.target)) closeRowPopup();
      down = null;
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRowPopup(); };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointerup', onUp, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [selectedRow]);

  if (selectedRow === null) return null;

  const closeButton = (
    <button
      type="button"
      aria-label="칸 설정 닫기"
      onClick={closeRowPopup}
      className={styles.close}
    >
      <FiX size={16} />
    </button>
  );

  if (isMobile) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-7 z-10 flex justify-center px-3">
        <div ref={boxRef} className="pointer-events-auto relative">
          {closeButton}
          <RowControls />
        </div>
      </div>
    );
  }

  // floating box 높이의 절반만큼 위로 올려서 행 중앙에 맞춤
  const popupHeight = 303;
  const top = Math.max(20, floatingBoxY - popupHeight / 2);

  return (
    <div
      ref={boxRef}
      className="pointer-events-auto absolute z-10"
      style={{
        left: `${floatingBoxX}px`,
        top: `${top}px`,
      }}
      role="dialog"
      aria-label={`아래에서 ${selectedRow + 1}번째 칸 설정`}
    >
      {closeButton}
      <RowControls />
    </div>
  );
}

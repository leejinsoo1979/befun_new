'use client';

import { useRef, useEffect, useSyncExternalStore } from 'react';
import { FiX } from 'react-icons/fi';
import { useUIStore } from '@/stores/useUIStore';
import { useHardwareStore } from '@/stores/useHardwareStore';
import { RowControls } from './RowControls';

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
 * 가구 행에 마우스 오버하면 해당 행 옆에 나타남 (모바일: 행을 탭하면 뷰어 하단에 고정 표시)
 */
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

  if (selectedRow === null) return null;

  if (isMobile) {
    const close = () => {
      const { setDoorOpen, setDrawerOpen } = useHardwareStore.getState();
      setDoorOpen(selectedRow, false);
      setDrawerOpen(selectedRow, false);
      useUIStore.setState({ selectedRow: null, hoveredRow: null });
    };
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-7 z-10 flex justify-center px-3">
        <div className="pointer-events-auto relative">
          <button
            type="button"
            aria-label="칸 설정 닫기"
            onClick={close}
            className="absolute -top-3 -right-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-[#333] shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
          >
            <FiX size={16} />
          </button>
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
      className="pointer-events-auto absolute z-10 transition-opacity duration-200"
      style={{
        left: `${floatingBoxX}px`,
        top: `${top}px`,
      }}
      onMouseEnter={() => {
        useUIStore.getState().setFloatingBoxHovered(true);
      }}
      onMouseLeave={() => {
        useUIStore.getState().setFloatingBoxHovered(false);
        setTimeout(() => {
          const { isFloatingBoxHovered } = useUIStore.getState();
          if (!isFloatingBoxHovered && useUIStore.getState().selectedRow === selectedRow) {
            useUIStore.setState({ selectedRow: null, hoveredRow: null });
          }
        }, 600);
      }}
    >
      <RowControls />
    </div>
  );
}

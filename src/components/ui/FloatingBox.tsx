'use client';

import { useRef, useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { RowControls } from './RowControls';

/**
 * V1 floating-box: 3D 뷰어 위에 행 컨트롤을 오버레이로 표시
 * 가구 행에 마우스 오버하면 해당 행 옆에 나타남
 */
export function FloatingBox() {
  const selectedRow = useUIStore((s) => s.selectedRow);
  const floatingBoxX = useUIStore((s) => s.floatingBoxX);
  const floatingBoxY = useUIStore((s) => s.floatingBoxY);
  const boxRef = useRef<HTMLDivElement>(null);

  // 화면 밖 넘침 방지
  useEffect(() => {
    if (!boxRef.current || selectedRow === null) return;
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
  }, [selectedRow, floatingBoxX, floatingBoxY]);

  if (selectedRow === null) return null;

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
        // floating box 위에 마우스가 있으면 숨김 타이머 취소
        useUIStore.setState({ selectedRow: selectedRow });
      }}
      onMouseLeave={() => {
        // floating box에서 나가면 숨기기
        setTimeout(() => {
          useUIStore.setState({ selectedRow: null, hoveredRow: null });
        }, 600);
      }}
    >
      <RowControls />
    </div>
  );
}

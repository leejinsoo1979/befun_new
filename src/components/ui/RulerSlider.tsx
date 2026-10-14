'use client';

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

interface RulerSliderProps {
  label: string;
  /** 슬라이더 위치값 (min~max) */
  value: number;
  min: number;
  max: number;
  step?: number;
  /** 화면 표시 문자열 (예: "93 cm") */
  display: string;
  /** 눈금 간격 (위치값 단위). 없으면 step×10 */
  tickEvery?: number;
  onChange: (value: number) => void;
}

/**
 * 자처럼 눈금이 있는 터치 슬라이더 (AR 크기 조절용)
 * - 드래그 중 손가락 위에 값 말풍선 표시, 오른쪽 끝에 현재 값
 * - role=slider + 화살표/Home/End 키 지원
 */
export function RulerSlider({ label, value, min, max, step = 1, display, tickEvery, onChange }: RulerSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const ratio = max > min ? (value - min) / (max - min) : 0;
  const tick = tickEvery ?? step * 10;
  const tickCount = Math.min(80, Math.floor((max - min) / tick));

  const valueAt = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    const r = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = min + r * (max - min);
    return Math.min(max, Math.max(min, Math.round(raw / step) * step));
  }, [min, max, step, value]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(valueAt(e.clientX));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) onChange(valueAt(e.clientX));
  };
  const endDrag = () => setDragging(false);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step };
    if (e.key in keys) onChange(Math.min(max, Math.max(min, value + keys[e.key])));
    else if (e.key === 'Home') onChange(min);
    else if (e.key === 'End') onChange(max);
    else return;
    e.preventDefault();
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-12 shrink-0 text-[13px] font-medium text-[#333]">{label}</span>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className="relative h-9 flex-1 cursor-pointer touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)]/40"
      >
        {/* 눈금 */}
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
          {Array.from({ length: tickCount + 1 }, (_, i) => (
            <span key={i} className={`w-px bg-[#c8c8c8] ${i % 5 === 0 ? 'h-3' : 'h-1.5'}`} />
          ))}
        </div>
        {/* 트랙 + 채움 */}
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded bg-[#e2e2e2]" />
        <div className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded bg-[var(--green)]" style={{ width: `${ratio * 100}%` }} />
        {/* 손잡이 */}
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${ratio * 100}%` }}>
          <div className={`h-5 w-5 rounded-full border border-[#d0d0d0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition-transform ${dragging ? 'scale-125' : ''}`} />
          {dragging && (
            <div className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2.5 py-1 text-[13px] font-semibold text-[#222] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              {display}
            </div>
          )}
        </div>
      </div>
      <span className="w-14 shrink-0 text-right text-[13px] tabular-nums text-[#555]">{display}</span>
    </div>
  );
}

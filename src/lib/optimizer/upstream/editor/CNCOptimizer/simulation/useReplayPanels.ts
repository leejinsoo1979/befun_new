import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

const STORAGE_KEY = 'mmmcraft-replay-panels';
const DEFAULT_WIDTH = 42;
const DIVIDER = 8;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** 화면 배치만 저장한다. 원장·공정·재생 시계와는 독립적이다. */
export function useReplayPanels() {
  const [saved] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      return { open: value?.open !== false, width: typeof value?.width === 'number' && Number.isFinite(value.width) ? clamp(value.width, 20, 66) : DEFAULT_WIDTH };
    } catch { return { open: true, width: DEFAULT_WIDTH }; }
  });
  const [open, setOpen] = useState(saved.open);
  const [preferredWidth, setPreferredWidth] = useState(saved.width);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [dragging, setDragging] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const available = Math.max(1, containerWidth - DIVIDER);
  const min = Math.max(20, Math.min(300 / available * 100, 40));
  const max = Math.min(66, 100 - Math.min(360 / available * 100, 40));
  const width = clamp(preferredWidth, min, max);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const update = () => { const next = content.getBoundingClientRect().width; if (next > 0) setContainerWidth(next); };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dragging) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, width: preferredWidth })); } catch { /* 저장이 제한돼도 조작은 유지한다. */ }
  }, [open, preferredWidth, dragging]);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId) return;
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= DIVIDER) return;
    setPreferredWidth(clamp((rect.right - event.clientX - DIVIDER / 2) / (rect.width - DIVIDER) * 100, min, max));
  };
  const finish = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const change = event.shiftKey ? 10 : 2;
    const next = event.key === 'ArrowLeft' ? width + change : event.key === 'ArrowRight' ? width - change
      : event.key === 'Home' ? max : event.key === 'End' ? min : undefined;
    if (next === undefined) return;
    event.preventDefault();
    setPreferredWidth(clamp(next, min, max));
  };

  return {
    contentRef, open, width, min, max, dragging, toggle: () => setOpen(value => !value),
    dividerProps: {
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || pointer.current !== null) return;
        event.preventDefault();
        event.currentTarget.focus();
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      },
      onPointerMove: move, onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish,
      onDoubleClick: () => setPreferredWidth(DEFAULT_WIDTH), onKeyDown: keyDown,
    },
  };
}

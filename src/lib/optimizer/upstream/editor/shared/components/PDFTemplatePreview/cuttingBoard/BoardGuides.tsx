import React, { useEffect, useRef, useState } from 'react';
import { modelPoint, viewPoint, roundMm, type CuttingBoardDocument } from './model';
import { EMPTY_GUIDES, type ManualGuides } from '../canvasUx/manualGuides';

interface Props { interactive?: boolean; board: CuttingBoardDocument; scale: number; turns: number; onChange: (guides: ManualGuides) => void }
export function BoardGuides({ board, scale, turns, onChange, interactive = true }: Props) {
  const [focused, setFocused] = useState<string | null>(null);
  const stored = board.guides ?? EMPTY_GUIDES;
  const drag = useRef<{ axis: keyof ManualGuides; index: number | null; value: number; offset: number } | null>(null);
  const [preview, setPreview] = useState<typeof drag.current>(null);
  const width = turns % 2 ? board.height : board.width, height = turns % 2 ? board.width : board.height;
  const point = (e: React.PointerEvent<SVGGElement>) => {
    const svg = e.currentTarget.ownerSVGElement!;
    const rect = svg.getBoundingClientRect();
    const [x, y, width, height] = svg.getAttribute('viewBox')!.split(/\s+/).map(Number);
    const box = { x, y, width, height };
    return modelPoint({ x: box.x + (e.clientX - rect.left) * box.width / rect.width, y: box.y + (e.clientY - rect.top) * box.height / rect.height }, board, turns);
  };
  const cancel = () => { drag.current = null; setPreview(null); };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { drag.current = null; setPreview(null); } };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  const guides = { vertical: [...stored.vertical], horizontal: [...stored.horizontal] };
  if (preview) {
    if (preview.index === null) guides[preview.axis].push(preview.value);
    else guides[preview.axis][preview.index] = preview.value;
  }
  return <g data-board-guides onPointerDown={e => {
    const target = (e.target as Element).closest('[data-guide-axis]');
    if (!target || e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    (target as SVGElement).focus?.();
    const axis = target.getAttribute('data-guide-axis') as keyof ManualGuides;
    const index = target.hasAttribute('data-guide-index') ? Number(target.getAttribute('data-guide-index')) : null;
    if (index === null && stored[axis].length >= 100) return;
    const p = point(e);
    const raw = axis === 'vertical' ? p.x : p.y;
    const offset = index === null ? 0 : stored[axis][index] - raw;
    drag.current = { axis, index, value: raw + offset, offset };
    setPreview(drag.current); e.currentTarget.setPointerCapture(e.pointerId);
  }} onPointerMove={e => {
    if (!drag.current) return;
    e.stopPropagation(); const p = point(e);
    drag.current = { ...drag.current, value: roundMm((drag.current.axis === 'vertical' ? p.x : p.y) + drag.current.offset) };
    setPreview(drag.current);
  }} onPointerUp={e => {
    if (!drag.current) return;
    e.stopPropagation(); const p = point(e), { axis, index } = drag.current;
    const value = roundMm((axis === 'vertical' ? p.x : p.y) + drag.current.offset);
    const inside = value >= 0 && value <= (axis === 'vertical' ? board.width : board.height);
    const next = { vertical: [...stored.vertical], horizontal: [...stored.horizontal] };
    if (index === null) { if (inside) next[axis].push(value); }
    else if (inside) next[axis][index] = value;
    else next[axis].splice(index, 1);
    onChange(next); cancel();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }} onPointerCancel={cancel} onLostPointerCapture={cancel}>
    <rect data-guide-axis={turns % 2 ? 'vertical' : 'horizontal'} data-guide-ruler="horizontal" x={0} y={-20 / scale} width={width} height={20 / scale}
      fill="#edf1f5" style={{ cursor: 'ns-resize' }}><title>아래로 끌어서 가로 가이드 추가</title></rect>
    <rect data-guide-axis={turns % 2 ? 'horizontal' : 'vertical'} data-guide-ruler="vertical" x={-20 / scale} y={0} width={20 / scale} height={height}
      fill="#edf1f5" style={{ cursor: 'ew-resize' }}><title>오른쪽으로 끌어서 세로 가이드 추가</title></rect>
    {[true, false].map(horizontal => Array.from({ length: Math.floor((horizontal ? width : height) / 100) + 1 }, (_, i) => <g key={`${horizontal}-${i}`} pointerEvents="none" fill="#64748b" stroke="#94a3b8" strokeWidth={1 / scale}>
      <line x1={horizontal ? i * 100 : -5 / scale} x2={horizontal ? i * 100 : 0} y1={horizontal ? -5 / scale : i * 100} y2={horizontal ? 0 : i * 100} />
      <text x={horizontal ? i * 100 + 3 / scale : -12 / scale} y={horizontal ? -8 / scale : i * 100 + 3 / scale} stroke="none" fontSize={9 / scale}
        transform={horizontal ? undefined : `rotate(-90,${-12 / scale},${i * 100 + 3 / scale})`}>{i * 100}</text>
    </g>))}
    {(['vertical', 'horizontal'] as const).flatMap(axis => guides[axis].map((value, index) => {
      const a = viewPoint(axis === 'vertical' ? { x: value, y: 0 } : { x: 0, y: value }, board, turns);
      const b = viewPoint(axis === 'vertical' ? { x: value, y: board.height } : { x: board.width, y: value }, board, turns);
      return <g key={`${axis}-${index}`} data-guide-axis={axis} data-guide-index={index} data-guide-control tabIndex={0} role="button"
        aria-label={`${a.x === b.x ? '세로' : '가로'} 가이드 ${index + 1}`}
        onFocus={() => setFocused(`${axis}-${index}`)} onBlur={() => setFocused(null)}
        onKeyDown={e => {
          if (e.key !== 'Delete' && e.key !== 'Backspace') return;
          e.preventDefault(); e.stopPropagation(); cancel();
          onChange({ ...stored, [axis]: stored[axis].filter((_, i) => i !== index) });
        }} style={{ cursor: a.x === b.x ? 'ew-resize' : 'ns-resize' }} onDoubleClick={e => {
        e.stopPropagation(); onChange({ ...stored, [axis]: stored[axis].filter((_, i) => i !== index) });
      }}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={8 / scale} pointerEvents={interactive ? "stroke" : "none"} />
        <rect data-guide-handle x={a.x === b.x ? a.x - 5 / scale : -15 / scale} y={a.x === b.x ? -15 / scale : a.y - 5 / scale}
          width={10 / scale} height={10 / scale} rx={2 / scale} fill="#00a7d6"><title>가이드 선택/이동 · Delete 또는 더블클릭으로 삭제</title></rect>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={focused === `${axis}-${index}` ? "#635bff" : "#00a7d6"} strokeWidth={(focused === `${axis}-${index}` ? 2 : 1) / scale} pointerEvents="none" />
      </g>;
    }))}
  </g>;
}

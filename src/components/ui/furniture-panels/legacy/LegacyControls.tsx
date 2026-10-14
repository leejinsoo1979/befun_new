'use client';

/**
 * 기존 선반 전용 렌더러 — view의 컨트롤을 현재 운영 패널(StyleSelector/DensitySlider/DimensionPanel/BackPanelToggle)과
 * 같은 마크업·클래스(cfg-row, tylko-*)로 그린다. 공용 FurniturePanel(다른 제품 preview)은 건드리지 않는다.
 * 값·범위·표시값은 view에서만 읽고, 변경은 intent로만 내보낸다.
 */
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChoiceControl, FurnitureControl, FurnitureEditIntent, SliderControl } from '../types';

const THUMB_WIDTH = 72;
type Emit = (intent: FurnitureEditIntent) => void;

const thumbPos = (pct: number) => `calc(${pct * 100}% - ${pct * THUMB_WIDTH}px + ${THUMB_WIDTH / 2}px)`;
const fillPos = (pct: number) => `calc(${pct * 100}% - ${pct * THUMB_WIDTH}px + ${THUMB_WIDTH / 4}px)`;

function Help({ control }: { control: FurnitureControl }) {
  if (!control.help) return null;
  return <button type="button" className="tylko-help" title={control.help} aria-label={`${control.label} 도움말: ${control.help}`}>?</button>;
}

/** 드래그 표시 상태(pill ↔ 드래그 텍스트)만 로컬. 값은 항상 view. */
function useDragging() {
  const [dragging, setDragging] = useState(false);
  const stop = useCallback(() => setDragging(false), []);
  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [dragging, stop]);
  return [dragging, () => setDragging(true)] as const;
}

/** DensitySlider/TylkoSlider 형식(hover 시 −/+) 또는 HeightSlider 형식(markers 있으면 점 표시) */
function Slider({ control, emit }: { control: SliderControl; emit: Emit }) {
  const [dragging, startDrag] = useDragging();
  const [hovered, setHovered] = useState(false);
  const { value, min, max, label } = control;
  const step = control.step ?? 1;
  const pct = max > min ? (value - min) / (max - min) : 0;
  const atEdge = value <= min || value >= max;
  const showPill = !dragging || atEdge;
  const left = useMemo(() => thumbPos(pct), [pct]);
  const text = control.displayValue ?? `${value}${control.unit}`;
  const send = (v: number) => { if (control.enabled && v !== value) emit({ type: 'set', controlId: control.id, target: control.target, value: v }); };
  const rows = control.markers;

  return (
    <div className="cfg-row" data-control-id={control.id}>
      <span className="cfg-label">{label}</span>
      <div className="tylko-slider-wrap" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div className="tylko-slider-bg" />
        <div className="tylko-slider-track" style={{ width: fillPos(pct) }} />
        {rows && (
          <div className="tylko-height-markers">
            {rows.map((m) => {
              const p = (m - min) / (max - min);
              return <div key={m} className={`tylko-marker ${m === value ? 'current' : m < value ? 'active' : ''}`} style={{ left: thumbPos(p) }} />;
            })}
          </div>
        )}
        <input
          type="range" className="tylko-slider" min={min} max={max} step={step} value={value}
          aria-label={label} aria-valuetext={text} disabled={!control.enabled}
          onChange={(e) => send(rows ? Math.round(Number(e.target.value)) : Number(e.target.value))}
          onPointerDown={startDrag}
        />
        {rows ? (
          <span className={showPill ? 'tylko-pill tylko-pill--abs' : 'tylko-drag-text'} style={{ left }}>{text}</span>
        ) : showPill ? (
          <div className="tylko-thumb-group" style={{ left }}>
            <button type="button" tabIndex={-1} aria-hidden className={`tylko-step-btn ${hovered ? (value > min ? 'visible' : 'spacer') : ''}`}
              onClick={() => send(Math.max(min, value - step))}>−</button>
            <span className="tylko-pill">{text}</span>
            <button type="button" tabIndex={-1} aria-hidden className={`tylko-step-btn ${hovered ? (value < max ? 'visible' : 'spacer') : ''}`}
              onClick={() => send(Math.min(max, value + step))}>+</button>
          </div>
        ) : (
          <>
            <span className="tylko-drag-text" style={{ left }}>{text}</span>
            <span className="tylko-drag-dot" style={{ left }} />
          </>
        )}
      </div>
      <Help control={control} />
    </div>
  );
}

/** StyleSelector 형식 타일 */
function StyleTiles({ control, emit }: { control: ChoiceControl; emit: Emit }) {
  return (
    <div className="cfg-row" data-control-id={control.id}>
      <span className="cfg-label">{control.label}</span>
      <div role="group" aria-label={control.label}
        className="-mr-4 flex flex-1 snap-x gap-1.5 overflow-x-auto pr-4 [scrollbar-width:none] lg:mr-0 lg:pr-0 [&::-webkit-scrollbar]:hidden">
        {control.options.map((o) => {
          const active = control.value === o.id;
          return (
            <button key={o.id} type="button" aria-pressed={active} disabled={!control.enabled || o.enabled === false}
              onClick={() => { if (!active) emit({ type: 'set', controlId: control.id, target: control.target, value: o.id }); }}
              className={`flex shrink-0 snap-start flex-col items-center justify-center rounded-[10px] border-[1.5px] px-2.5 py-2 min-w-[56px] cursor-pointer transition-all ${
                active ? 'border-[var(--green)] bg-white' : 'border-transparent bg-[#f8f8f8] hover:border-[var(--green)]'
              }`}>
              {o.imageUrl && <Image src={(active && o.activeImageUrl) || o.imageUrl} alt="" width={20} height={20} />}
              <span className={`mt-1 text-[11px] font-medium ${active ? 'text-[var(--green)]' : 'text-[#666]'}`}>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Depth/Back panels 형식 pill 그룹 */
function Pills({ control, emit }: { control: ChoiceControl; emit: Emit }) {
  return (
    <div className="cfg-row" data-control-id={control.id}>
      <span className="cfg-label">{control.label}</span>
      <div className="flex items-center">
        <div className="tylko-pill-group" role="group" aria-label={control.label}>
          {control.options.map((o) => {
            const active = control.value === o.id;
            return (
              <button key={o.id} type="button" aria-pressed={active} disabled={!control.enabled || o.enabled === false}
                className={`tylko-pill-btn ${active ? 'active' : ''}`}
                onClick={() => { if (!active) emit({ type: 'set', controlId: control.id, target: control.target, value: o.id }); }}>
                {o.label}
              </button>
            );
          })}
        </div>
        <Help control={control} />
      </div>
    </div>
  );
}

export function LegacyControls({ controls, emit }: { controls: FurnitureControl[]; emit: Emit }) {
  return (
    <>
      {controls.filter((c) => c.visible).map((c) => {
        if (c.kind === 'slider') return <Slider key={c.id} control={c} emit={emit} />;
        if (c.kind === 'choice') return c.variant === 'tile'
          ? <StyleTiles key={c.id} control={c} emit={emit} />
          : <Pills key={c.id} control={c} emit={emit} />;
        return null;
      })}
    </>
  );
}

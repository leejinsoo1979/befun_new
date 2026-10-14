'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './panels.module.css';
import type {
  ActionControl, ChoiceControl, ChoiceIcon, FurnitureControl, FurnitureEditIntent, HeightModeControl,
  LayoutControl, LayoutGlyph, NoticeControl, SliderControl, StepperControl, SwatchControl,
} from './types';

type Emit = (intent: FurnitureEditIntent) => void;

/** 라디오 그룹 화살표 이동(roving tabindex). 비활성 항목은 건너뛴다. */
export function useRovingKeys(count: number, isEnabled: (index: number) => boolean, onMove: (index: number) => void) {
  return (event: KeyboardEvent<HTMLElement>, current: number) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    const home = event.key === 'Home', end = event.key === 'End';
    if (!forward && !backward && !home && !end) return;
    event.preventDefault();
    const order = home ? [...Array(count).keys()] : end ? [...Array(count).keys()].reverse()
      : Array.from({ length: count }, (_, k) => (current + (forward ? k + 1 : count - k - 1)) % count);
    const next = order.find(isEnabled);
    if (next !== undefined) onMove(next);
  };
}

/**
 * Tab으로 그룹에 들어갈 항목: 선택값이 활성이면 그것, 아니면 첫 활성 항목. 없으면 -1(전부 비활성).
 * 미선택(value=null)이어도 aria-checked는 바꾸지 않는다 — 진입점만 정한다.
 */
export function entryIndex(ids: string[], value: string | null, isEnabled: (index: number) => boolean) {
  const current = ids.indexOf(value as string);
  if (current >= 0 && isEnabled(current)) return current;
  return ids.findIndex((_, i) => isEnabled(i));
}

function focusItem(group: HTMLElement | null, index: number) {
  (group?.querySelectorAll<HTMLElement>('[role="radio"]')[index])?.focus();
}

export function Row({ control, children, full }: { control: FurnitureControl; children: ReactNode; full?: boolean }) {
  const labelId = useId();
  return (
    <div className={styles.row} data-disabled={!control.enabled} data-control-id={control.id}>
      {!full && (
        <span className={styles.label} id={labelId}>
          {control.label}
          {control.help && <button type="button" className={styles.help} title={control.help} aria-label={`${control.label} 도움말: ${control.help}`}>?</button>}
        </span>
      )}
      <div className={`${styles.control} ${full ? styles.full : ''}`} aria-labelledby={full ? undefined : labelId}>{children}</div>
      {control.notice && <p className={styles.notice} role="note">{control.notice}</p>}
      {!control.enabled && control.disabledReason && <p className={styles.reason}>{control.disabledReason}</p>}
    </div>
  );
}

const fmt = (value: number, unit: string) => `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;

function SliderInput({ value, min, max, step, unit, markers, label, disabled, onCommit, displayValue }: {
  value: number; min: number; max: number; step: number | null; unit: string; markers?: number[];
  label: string; disabled: boolean; onCommit: (value: number) => void; displayValue?: string | null;
}) {
  // 임시 값을 두지 않는다. 표시값은 항상 view(리더의 검증 결과)이며, 거절·보정·제품 교체·pointercancel 후에도
  // 다음 렌더에서 그대로 view를 따른다. 리더는 intent마다 같은 렌더 주기에 새 view를 내려줘야 thumb가 따라온다.
  const shown = value;
  const pct = max > min ? (shown - min) / (max - min) : 0;
  // 값 pill(64px)이 트랙 끝을 넘지 않도록 thumb 폭만큼 보정
  const left = `calc(${pct * 100}% + ${(0.5 - pct) * 64}px)`;
  return (
    <div className={styles.slider}>
      <span className={styles.track} />
      <span className={styles.fill} style={{ width: left }} />
      {markers?.map((m) => {
        const p = (m - min) / (max - min);
        return <span key={m} className={styles.marker} data-on={m <= shown} style={{ left: `calc(${p * 100}% + ${(0.5 - p) * 64}px)` }} />;
      })}
      <input
        type="range"
        className={styles.range}
        min={min}
        max={max}
        step={step ?? 'any'}
        value={shown}
        disabled={disabled}
        aria-label={label}
        aria-valuetext={displayValue ?? fmt(shown, unit)}
        onChange={(e) => onCommit(Number(e.target.value))}
      />
      {displayValue !== null && <span className={styles.valuePill} style={{ left }}>{displayValue ?? fmt(shown, unit)}</span>}
    </div>
  );
}

/** 숫자 직접 입력. Enter·포커스 해제 때만 intent를 보낸다(범위 보정은 리더). */
function NumberField({ value, unit, label, disabled, onCommit }: { value: number; unit: string; label: string; disabled: boolean; onCommit: (v: number) => void }) {
  const [text, setText] = useState<string | null>(null);
  // 입력 중 외부 값이 바뀌면(보정·다른 조작·되돌리기) 입력 중이던 글자는 버리고 view 값을 보인다.
  const [seen, setSeen] = useState(value);
  if (seen !== value) { setSeen(value); setText(null); }
  const commit = () => {
    if (text === null) return;
    const v = Number(text.replace(',', '.'));
    setText(null);
    if (text.trim() !== '' && Number.isFinite(v) && v !== value) onCommit(v);
  };
  return (
    <label className={styles.numberField}>
      <input type="number" inputMode="decimal" aria-label={`${label} 직접 입력`} disabled={disabled}
        value={text ?? String(value)} onChange={(e) => setText(e.target.value)}
        onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setText(null); }} />
      <span>{unit}</span>
    </label>
  );
}

function Slider({ control, emit }: { control: SliderControl; emit: Emit }) {
  const send = (value: number) => emit({ type: 'set', controlId: control.id, target: control.target, value });
  return (
    <Row control={control}>
      <div className={control.numberInput ? styles.sliderWithInput : undefined}>
        <SliderInput {...control} label={control.label} disabled={!control.enabled} onCommit={send} />
        {control.numberInput && <NumberField value={control.value} unit={control.unit} label={control.label} disabled={!control.enabled} onCommit={send} />}
      </div>
    </Row>
  );
}

function Stepper({ control, emit }: { control: StepperControl; emit: Emit }) {
  const send = (delta: number) => emit({ type: 'set', controlId: control.id, target: control.target, value: control.value + delta });
  return (
    <Row control={control}>
      <div className={styles.stepper} role="group" aria-label={control.label}>
        <button type="button" aria-label={`${control.label} 줄이기`} disabled={!control.enabled || !control.canDecrement} onClick={() => send(-1)}>−</button>
        <output aria-live="polite">{control.value}</output>
        <button type="button" aria-label={`${control.label} 늘리기`} disabled={!control.enabled || !control.canIncrement} onClick={() => send(1)}>+</button>
      </div>
    </Row>
  );
}

const ICONS: Record<ChoiceIcon, ReactNode> = {
  'facade-open': <><rect x="5" y="2" width="14" height="20" rx="1" /><line x1="5" y1="9" x2="19" y2="9" /><line x1="5" y1="15" x2="19" y2="15" /></>,
  'facade-middle-open': <><rect x="5" y="2" width="14" height="20" rx="1" /><rect x="5" y="2" width="14" height="6" fill="currentColor" opacity=".25" /><rect x="5" y="15" width="14" height="7" fill="currentColor" opacity=".25" /></>,
  'facade-bottom-open': <><rect x="5" y="2" width="14" height="20" rx="1" /><rect x="5" y="2" width="14" height="13" fill="currentColor" opacity=".25" /></>,
  'facade-closed': <><rect x="5" y="2" width="14" height="20" rx="1" fill="currentColor" opacity=".25" /><line x1="16" y1="10" x2="16" y2="14" /></>,
  'door-left': <><rect x="6" y="3" width="12" height="18" rx="1" /><line x1="8.5" y1="10" x2="8.5" y2="14" /></>,
  'door-right': <><rect x="6" y="3" width="12" height="18" rx="1" /><line x1="15.5" y1="10" x2="15.5" y2="14" /></>,
  'drawer-internal': <><rect x="3" y="5" width="18" height="14" rx="1" /><rect x="6" y="8" width="12" height="3" /><rect x="6" y="13" width="12" height="3" /></>,
  'drawer-external': <><rect x="3" y="5" width="18" height="14" rx="1" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="10" y1="8.5" x2="14" y2="8.5" /><line x1="10" y1="15.5" x2="14" y2="15.5" /></>,
  'style-minimal': <><rect x="2" y="9" width="20" height="9" rx="1" /><line x1="12" y1="9" x2="12" y2="18" /><line x1="3" y1="20" x2="21" y2="20" /></>,
  'style-hanging': <><line x1="2" y1="3" x2="22" y2="3" /><rect x="2" y="7" width="20" height="8" rx="1" /><line x1="12" y1="7" x2="12" y2="15" /></>,
  'style-legs': <><rect x="2" y="6" width="20" height="9" rx="1" /><line x1="12" y1="6" x2="12" y2="15" /><line x1="4" y1="15" x2="4" y2="21" /><line x1="20" y1="15" x2="20" y2="21" /></>,
  'handle-grip': <><rect x="6" y="3" width="12" height="18" rx="1" /><line x1="15" y1="9" x2="15" y2="15" strokeWidth="2" /></>,
  'handle-push': <><rect x="6" y="3" width="12" height="18" rx="1" /><circle cx="12" cy="12" r="1.6" /></>,
};

function Choice({ control, emit }: { control: ChoiceControl; emit: Emit }) {
  const group = useRef<HTMLDivElement>(null);
  const isEnabled = (i: number) => control.enabled && control.options[i].enabled !== false;
  const selected = entryIndex(control.options.map((o) => o.id), control.value, isEnabled);
  const select = (i: number) => {
    if (!isEnabled(i)) return;
    if (control.options[i].id !== control.value) emit({ type: 'set', controlId: control.id, target: control.target, value: control.options[i].id });
  };
  const keys = useRovingKeys(control.options.length, isEnabled, (i) => { select(i); focusItem(group.current, i); });
  return (
    <Row control={control}>
      <div ref={group} role="radiogroup" aria-label={control.label} aria-disabled={!control.enabled}
        className={control.variant === 'tile' ? styles.tiles : styles.pills}>
        {control.options.map((o, i) => (
          <button key={o.id} type="button" role="radio" aria-checked={o.id === control.value}
            tabIndex={i === selected ? 0 : -1} disabled={!isEnabled(i)}
            className={control.variant === 'tile' ? styles.tile : styles.pill}
            onClick={() => select(i)} onKeyDown={(e) => keys(e, i)}>
            {o.icon && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>{ICONS[o.icon]}</svg>}
            {!o.icon && o.imageUrl && <Image src={(o.id === control.value && o.activeImageUrl) || o.imageUrl} alt="" width={28} height={28} unoptimized aria-hidden />}
            {o.label}
          </button>
        ))}
      </div>
    </Row>
  );
}

function Swatches({ control, emit }: { control: SwatchControl; emit: Emit }) {
  const group = useRef<HTMLDivElement>(null);
  const isEnabled = () => control.enabled;
  const selected = entryIndex(control.options.map((o) => o.id), control.value, isEnabled);
  const select = (i: number) => {
    if (control.enabled && control.options[i].id !== control.value) emit({ type: 'set', controlId: control.id, target: control.target, value: control.options[i].id });
  };
  const keys = useRovingKeys(control.options.length, isEnabled, (i) => { select(i); focusItem(group.current, i); });
  const current = control.options.find((o) => o.id === control.value);
  return (
    <Row control={control}>
      <div ref={group} role="radiogroup" aria-label={control.label} className={styles.swatches}>
        {control.options.map((o, i) => (
          <button key={o.id} type="button" role="radio" aria-checked={o.id === control.value} aria-label={o.label} title={o.label}
            tabIndex={i === selected ? 0 : -1} disabled={!control.enabled} className={styles.swatch}
            style={{ background: o.imageUrl ? `url("${o.imageUrl}") center / cover` : o.color }}
            onClick={() => select(i)} onKeyDown={(e) => keys(e, i)} />
        ))}
      </div>
      {current && <p className={styles.swatchName} aria-live="polite">{current.label}</p>}
    </Row>
  );
}

function HeightMode({ control, emit }: { control: HeightModeControl; emit: Emit }) {
  const group = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  // 모드 전환 버튼은 전환 후 사라지므로, 전환이 실제로 반영되면 다음 조작 지점으로 포커스를 옮긴다(키보드 포커스 유실 방지).
  const pendingFocus = useRef<HeightModeControl['mode'] | null>(null);
  useEffect(() => {
    if (pendingFocus.current !== control.mode) return;
    pendingFocus.current = null;
    const target = control.mode === 'extended'
      ? root.current?.querySelector<HTMLElement>('input[type="range"]')
      : root.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]');
    target?.focus();
  }, [control.mode]);
  const switchMode = (to: 'extended' | 'standard') => {
    if (!control.enabled) return;
    pendingFocus.current = to === 'extended' ? 'extended' : 'presets';
    emit({ type: 'heightMode', controlId: control.id, target: control.target, to });
  };
  const items = control.presets;
  const isEnabled = () => control.enabled;
  const selected = entryIndex(items.map((p) => p.id), control.selectedPresetId, isEnabled);
  const select = (i: number) => {
    if (control.enabled && items[i].id !== control.selectedPresetId) emit({ type: 'set', controlId: control.id, target: control.target, value: items[i].id });
  };
  const keys = useRovingKeys(items.length, isEnabled, (i) => { select(i); focusItem(group.current, i); });
  if (control.mode === 'extended' && control.range) {
    const r = control.range;
    return (
      <Row control={control}>
        <div ref={root} className={styles.heightMode}>
          <div className={styles.pills}>
            <button type="button" className={styles.pill} disabled={!control.enabled} onClick={() => switchMode('standard')}>{control.standardLabel}</button>
          </div>
          <SliderInput value={r.value} min={r.min} max={r.max} step={r.step} unit={r.unit} label={`${control.label} (${control.extendLabel})`}
            disabled={!control.enabled} onCommit={(value) => emit({ type: 'set', controlId: control.id, target: control.target, value })} />
        </div>
      </Row>
    );
  }
  return (
    <Row control={control}>
      <div ref={root} className={styles.heightMode}>
        <div className={styles.pills}>
          {/* 프리셋만 radiogroup. '높이 +'는 모드 전환 버튼이라 그룹 밖(같은 줄)에 둔다 */}
          <div ref={group} role="radiogroup" aria-label={control.label} className={styles.presetGroup}>
            {items.map((p, i) => (
              <button key={p.id} type="button" role="radio" aria-checked={p.id === control.selectedPresetId} tabIndex={i === selected ? 0 : -1}
                disabled={!control.enabled} className={styles.pill} onClick={() => select(i)} onKeyDown={(e) => keys(e, i)}>{p.label}</button>
            ))}
          </div>
          <button type="button" className={styles.pill} disabled={!control.enabled} onClick={() => switchMode('extended')}>{control.extendLabel}</button>
        </div>
      </div>
    </Row>
  );
}

function Action({ control, emit }: { control: ActionControl; emit: Emit }) {
  return (
    <Row control={control}>
      <button type="button" className={styles.action} disabled={!control.enabled}
        onClick={() => emit({ type: 'action', controlId: control.id, target: control.target })}>+ {control.actionLabel}</button>
    </Row>
  );
}

function Notice({ control }: { control: NoticeControl }) {
  return (
    <Row control={control}>
      <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: '#555' }}>
        {control.text}
        {control.link && <a className={styles.link} href={control.link.href}>{control.link.label}</a>}
      </p>
    </Row>
  );
}

function Glyph({ glyph }: { glyph?: LayoutGlyph }) {
  const y = (v: number) => 4 + (1 - v) * 92;
  return (
    <svg viewBox="0 0 60 100" aria-hidden>
      <rect x="4" y="4" width="52" height="92" fill="#f4f4f2" stroke="#999" strokeWidth="1.5" />
      {glyph?.shelves?.map((s) => <line key={`s${s}`} x1="4" x2="56" y1={y(s)} y2={y(s)} stroke="#666" strokeWidth="2" />)}
      {glyph?.rails?.map((r) => (
        <g key={`r${r}`} stroke="#555" strokeWidth="1.5" fill="none">
          <line x1="10" x2="50" y1={y(r)} y2={y(r)} />
          <path d={`M30 ${y(r)} v-6 m0 0 a3 3 0 1 1 3 -3`} />
        </g>
      ))}
      {glyph?.drawers?.map((d, k) => Array.from({ length: d.count }, (_, i) => {
        const h = (d.to - d.from) / d.count;
        return <rect key={`d${k}-${i}`} x="8" width="44" y={y(d.from + h * (i + 1)) + 1} height={(h * 92) - 2} fill="#e2e2df" stroke="#777" strokeWidth="1" />;
      }))}
    </svg>
  );
}

function Layouts({ control, emit }: { control: LayoutControl; emit: Emit }) {
  const group = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const isEnabled = () => control.enabled;
  const selected = entryIndex(control.options.map((o) => o.id), control.value, isEnabled);
  const select = (i: number) => {
    if (control.enabled && control.options[i].id !== control.value) emit({ type: 'set', controlId: control.id, target: control.target, value: control.options[i].id });
  };
  const keys = useRovingKeys(control.options.length, isEnabled, (i) => {
    select(i); focusItem(group.current, i);
    group.current?.querySelectorAll<HTMLElement>('[role="radio"]')[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  const update = () => {
    const el = group.current; if (!el) return;
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  };
  useEffect(update, [control.options.length]);
  const scroll = (dir: number) => group.current?.scrollBy({ left: dir * group.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <Row control={control} full>
      <div className={styles.carousel}>
        <button type="button" className={styles.scrollBtn} aria-label="이전 배치" disabled={edges.start} onClick={() => scroll(-1)}>‹</button>
        <div ref={group} role="radiogroup" aria-label={control.label} className={styles.strip} onScroll={update}>
          {control.options.map((o, i) => (
            <button key={o.id} type="button" role="radio" aria-checked={o.id === control.value} aria-label={o.label} title={o.label}
              tabIndex={i === selected ? 0 : -1} disabled={!control.enabled} className={styles.layout}
              onClick={() => select(i)} onKeyDown={(e) => keys(e, i)}>
              {o.imageUrl ? <Image src={o.imageUrl} alt="" width={40} height={64} unoptimized /> : <Glyph glyph={o.glyph} />}
            </button>
          ))}
        </div>
        <button type="button" className={styles.scrollBtn} aria-label="다음 배치" disabled={edges.end} onClick={() => scroll(1)}>›</button>
      </div>
    </Row>
  );
}

export function ControlView({ control, emit }: { control: FurnitureControl; emit: Emit }) {
  if (!control.visible) return null;
  const guarded: Emit = (intent) => { if (control.enabled) emit(intent); };
  switch (control.kind) {
    case 'slider': return <Slider control={control} emit={guarded} />;
    case 'choice': return <Choice control={control} emit={guarded} />;
    case 'swatch': return <Swatches control={control} emit={guarded} />;
    case 'heightMode': return <HeightMode control={control} emit={guarded} />;
    case 'action': return <Action control={control} emit={guarded} />;
    case 'notice': return <Notice control={control} />;
    case 'layout': return <Layouts control={control} emit={guarded} />;
    case 'stepper': return <Stepper control={control} emit={guarded} />;
  }
}

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Scan, Focus } from 'lucide-react';
import type { OptimizedResult } from '../types';
import { resolvePanelPreviewShape } from '../utils/panelPreviewShape';
import { placedCuttingShape } from '../utils/cuttingBoardShape';
import { layoutComparisonAt } from './layoutComparison';
import { replayCameraCut } from './replayCamera';
import LayoutMachiningOverlay from './LayoutMachiningOverlay';
import LayoutBandingOverlay from './LayoutBandingOverlay';
import { bandingAt, bandingContact, focusedBanding } from './edgeBandingProcess';
import { fullLayoutFrame, layoutCameraAt, type LayoutFrame } from './layoutMachining';
import type { MachiningProgram, ReplayClock } from './program';
import styles from './ReplayLayout.module.css';

const number = (n: number) => Number(n.toFixed(3)).toLocaleString();

/** 정적 도면을 다시 그리지 않고 같은 재생 시계로 절단선/진행점만 갱신한다. */
const CutOverlay = React.memo(function CutOverlay({ program, clock, time, font }: {
  program: MachiningProgram; clock?: ReplayClock; time?: number; font: number;
}) {
  const groups = useRef(new Map<string, SVGGElement>());
  const steps = useMemo(() => program.steps.filter(step => step.kind === 'saw'), [program]);
  useLayoutEffect(() => {
    const draw = () => {
      const cuts = new Map(layoutComparisonAt(program, clock?.elapsedMs ?? time ?? 0).cuts.map(cut => [cut.id, cut]));
      groups.current.forEach((group, id) => {
        const cut = cuts.get(id), line = group.children[0], marker = group.children[1];
        group.style.display = cut ? '' : 'none';
        if (!cut) { group.removeAttribute('data-cut'); group.removeAttribute('data-cut-state'); marker.removeAttribute('data-tool-marker'); return; }
        group.setAttribute('data-cut', id); group.setAttribute('data-cut-state', cut.active ? 'active' : 'complete');
        for (const attr of ['x1', 'y1', 'x2', 'y2'] as const) line.setAttribute(attr, String(cut[attr]));
        line.setAttribute('stroke-width', String(cut.kerf)); line.setAttribute('stroke', cut.active ? '#ed7943' : 'var(--theme-text-muted)');
        marker.setAttribute('cx', String(cut.x2)); marker.setAttribute('cy', String(cut.y2));
        marker.setAttribute('display', cut.active ? '' : 'none');
        if (cut.active) marker.setAttribute('data-tool-marker', ''); else marker.removeAttribute('data-tool-marker');
      });
    };
    draw();
    return clock?.subscribe(draw);
  }, [program, clock, time]);
  return <g>{steps.map(step => <g key={step.id} style={{ display: 'none' }} ref={node => {
    if (node) groups.current.set(step.id, node); else groups.current.delete(step.id);
  }}><line /><circle r={font * .19} fill="#e65a2b" stroke="white" strokeWidth={1} vectorEffect="non-scaling-stroke" /></g>)}</g>;
});

/** 읽기 전용 원장. 재생 시각만 받고 원본 배치/선택 스토어에는 쓰지 않는다. */
export default function ReplayLayout({ program, time, result, clock }: { program: MachiningProgram; time: number; result?: OptimizedResult; clock?: ReplayClock }) {
  const root = program.stocks[0], panels = root.layout ?? [];
  const full = useMemo(() => fullLayoutFrame(program), [program]);
  const [following, setFollowing] = useState(true);
  const [manual, setManual] = useState<LayoutFrame>(full);
  const frame = following ? layoutCameraAt(program, time) : manual;
  const frameRef = useRef(frame), svgRef = useRef<SVGSVGElement>(null), zoomRef = useRef<HTMLOutputElement>(null);
  const zoom = Math.max(full.width / frame.width, full.height / frame.height);
  useLayoutEffect(() => {
    let lastFrame = performance.now();
    const draw = () => {
      const goal = following ? layoutCameraAt(program, clock?.elapsedMs ?? time) : manual;
      const now=performance.now(),alpha=1-Math.exp(-4*Math.min(.05,Math.max(0,(now-lastFrame)/1000)));
      lastFrame=now;
      const value=following&&clock?.playing
        ? Object.fromEntries((['x','y','width','height'] as const).map(k=>[k,frameRef.current[k]+(goal[k]-frameRef.current[k])*alpha])) as LayoutFrame
        : goal;
      frameRef.current = value;
      svgRef.current?.setAttribute('viewBox', `${value.x} ${value.y} ${value.width} ${value.height}`);
      if (zoomRef.current) zoomRef.current.textContent = `${Math.round(Math.max(full.width/value.width, full.height/value.height)*100)}%`;
    };
    draw(); return clock?.subscribe(draw);
  }, [program, clock, time, following, manual, full]);
  const drawingRef = useRef<HTMLDivElement>(null);
  const [drawingSize, setDrawingSize] = useState({ width: 360, height: 600 });
  useEffect(() => {
    if (!drawingRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDrawingSize({ width, height });
    });
    observer.observe(drawingRef.current);
    return () => observer.disconnect();
  }, []);
  const drag = useRef<{ x: number; y: number; frame: LayoutFrame } | undefined>(undefined);
  const id = useId().replace(/:/g, '');
  const state = layoutComparisonAt(program, time);
  const width = root.size[0], height = root.size[1], pad = Math.max(width, height) * .045;
  // 원장 맞춤 배율에서도 보통 판재의 치수는 11px을 유지한다. 확대하면 글자도 함께 커진다.
  const font = 11 * Math.max(frame.width / drawingSize.width, frame.height / drawingSize.height);
  const paths = useMemo(() => new Map(result?.panels.map(panel => {
    if (program.steps.some(s=>s.kind==='mill' && s.operation==='notch' && program.stocks.find(stock=>stock.id===s.stockId)?.panel?.id===panel.id)) return [panel.id, undefined];
    const preview = resolvePanelPreviewShape(panel);
    if (!preview) return [panel.id, undefined];
    const geometry = placedCuttingShape(preview.shape, preview.rotated);
    const rings = geometry.rings.map(r => r.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ') + ' Z').join(' ');
    const circles = geometry.circles.map(c => `M ${c.x - c.radius} ${c.y} a ${c.radius} ${c.radius} 0 1 0 ${c.radius * 2} 0 a ${c.radius} ${c.radius} 0 1 0 ${-c.radius * 2} 0`).join(' ');
    return [panel.id, rings + circles];
  })), [result, program]);
  const active = state.activeStock, origin = active?.sourceOrigin;
  const followCut = replayCameraCut(program, state.cursor.index);
  const band = focusedBanding(bandingAt(program,time));
  const followLabel = band ? bandingContact(band).label : time < 1800 || state.cursor.done || !followCut ? '원장 전체' : followCut.kind === 'saw' ? '재단 추적' : followCut.kind === 'mill' ? '홈·따내기 추적' : '보링 근접';
  const inside = (p: typeof panels[number]) => origin && active && p.x >= origin[0] - 1e-6 && p.y >= origin[1] - 1e-6
    && p.x + p.width <= origin[0] + active.size[0] + 1e-6 && p.y + p.height <= origin[1] + active.size[1] + 1e-6;
  const reset = () => { setFollowing(false); setManual(full); };
  const changeZoom = (factor: number) => {
    const f = frameRef.current, current = Math.max(full.width/f.width, full.height/f.height);
    const ratio = current / Math.max(1, Math.min(16, current*factor));
    setFollowing(false);setManual({x:f.x+f.width*(1-ratio)/2,y:f.y+f.height*(1-ratio)/2,width:f.width*ratio,height:f.height*ratio});
  };
  return <div className={styles.root} aria-label="원본 패널 배치 대조">
    <div className={styles.toolbar}>
      <div><strong>원본 패널 레이아웃</strong><span>{number(width)} × {number(height)} mm · {panels.length}개</span></div>
      <div className={styles.zoom}>
        <button aria-label="배치도 축소" disabled={zoom <= 1} onClick={() => changeZoom(1/1.25)}><Minus size={15} /></button>
        <output ref={zoomRef} aria-label="배치도 확대율">{Math.round(zoom * 100)}%</output>
        <button aria-label="배치도 확대" disabled={zoom >= 16} onClick={() => changeZoom(1.25)}><Plus size={15} /></button>
        <button aria-label="가공 따라가기" title="가공 따라가기" aria-pressed={following} onClick={() => setFollowing(true)}><Focus size={16} /></button>
        <button aria-label="배치도 맞춤" onClick={reset}><Scan size={16} /></button>
      </div>
    </div>
    <div className={styles.legend}><span><i />미완료</span><span><i className={styles.active} />현재 조각</span><span><i className={styles.done} />분리 완료</span><span><i className={styles.cut} />가공 진행</span><span><i className={styles.boring} />보링·상면 홈</span>{program.steps.some(s=>s.kind==='mill'&&s.face==='bottom')&&<span><i style={{background:'#83aab9',border:'1px dashed #477f94'}} />하면 홈·반턱</span>}</div>
    <div className={styles.followStatus} role="status" aria-label="배치도 추적 상태">{following ? `자동 · ${followLabel}` : '직접 보기 · 가공 따라가기로 복귀'}</div>
    <div ref={drawingRef} className={styles.drawing}>
      <svg ref={svgRef} role="img" aria-label="원장 위 패널 배치와 현재 절단 위치" viewBox={`${full.x} ${full.y} ${full.width} ${full.height}`}
        onDoubleClick={reset}
        onPointerDown={e => { if (e.button !== 0) return; drag.current = { x: e.clientX, y: e.clientY, frame: frameRef.current }; setFollowing(false); setManual(frameRef.current); e.currentTarget.setPointerCapture?.(e.pointerId); }}
        onPointerMove={e => {
          if (!drag.current) return;
          const f = drag.current.frame, rect = e.currentTarget.getBoundingClientRect(), scale = Math.min(rect.width / f.width, rect.height / f.height);
          if (!(scale > 0)) return;
          setManual({ ...f, x: f.x - (e.clientX - drag.current.x) / scale, y: f.y - (e.clientY - drag.current.y) / scale });
        }}
        onPointerUp={() => { drag.current = undefined; }} onPointerCancel={() => { drag.current = undefined; }} onLostPointerCapture={() => { drag.current = undefined; }}>
        <defs><clipPath id={id}><rect width={width} height={height} /></clipPath></defs>
        <rect width={width} height={height} fill="var(--theme-surface)" stroke="var(--theme-border-hover)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <text className={styles.dimension} x={width / 2} y={-pad * .38} textAnchor="middle" fontSize={font}>{number(width)} mm</text>
        <text className={styles.dimension} x={-pad * .4} y={height / 2} transform={`rotate(-90 ${-pad * .4} ${height / 2})`} textAnchor="middle" fontSize={font}>{number(height)} mm</text>
        <g clipPath={`url(#${id})`}>
          {panels.map((panel, index) => {
            const done = state.finished.has(panel.id), isActive = time > 0 && inside(panel), thin = panel.width < font * 3;
            const fill = isActive ? 'var(--theme-primary-light)' : done ? 'color-mix(in srgb,var(--theme-primary) 12%,var(--theme-surface))' : 'var(--theme-background-secondary)';
            const shape = paths.get(panel.id);
            const name = `${index + 1}. ${panel.name}`;
            const capacity = Math.max(3, Math.floor((thin ? panel.height : panel.width) / (font * .9)) - 2);
            const label = name.length > capacity ? `${name.slice(0, capacity - 1)}…` : name;
            return <g key={panel.id} data-layout-panel={panel.id} data-state={done ? 'complete' : isActive ? 'active' : 'pending'} transform={`translate(${panel.x} ${panel.y})`}>
              <title>{panel.name} · {number(panel.width)} × {number(panel.height)} mm · X {number(panel.x)} / Y {number(panel.y)} · {done ? '분리 완료' : '미완료'}</title>
              {shape ? <path d={shape} fill={fill} fillRule="evenodd" stroke="var(--theme-border-hover)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                : <rect data-panel-bounds width={panel.width} height={panel.height} fill={fill} stroke="var(--theme-border-hover)" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
              <text x={panel.width / 2} y={Math.min(font * 1.35, panel.height * .25)} textAnchor="middle" className={styles.dimension} fontSize={thin ? font * .75 : font}>{number(panel.width)}</text>
              {!thin && panel.height > font * 3 && <text x={font * .95} y={panel.height / 2} transform={`rotate(-90 ${font * .95} ${panel.height / 2})`} textAnchor="middle" className={styles.dimension} fontSize={font * .85}>{number(panel.height)}</text>}
              <text x={panel.width / 2} y={panel.height / 2 + font} textAnchor="middle" fill="var(--theme-text-muted)" fontSize={font * .9}
                transform={thin ? `rotate(-90 ${panel.width / 2} ${panel.height / 2 + font})` : undefined}>
                {panel.width > font * 3 || thin ? label : index + 1}
              </text>
            </g>;
          })}
          {time > 0 && origin && active && <rect data-active-piece x={origin[0]} y={origin[1]} width={active.size[0]} height={active.size[1]} fill="none" stroke="var(--theme-primary)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
          <LayoutBandingOverlay program={program} clock={clock} time={clock ? 0 : time} />
          <LayoutMachiningOverlay program={program} clock={clock} time={clock ? 0 : time} font={font} />
          <CutOverlay program={program} clock={clock} time={clock ? undefined : time} font={font} />
        </g>
      </svg>
    </div>
    <div className={styles.status}><strong>{result?.stockPanel.material ?? '원장'} {root.size[2]}T</strong><span>분리 완료 {state.finished.size} / {panels.length}</span>{result && <span>사용률 {number(result.efficiency)}%</span>}</div>
  </div>;
}

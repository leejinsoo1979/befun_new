'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiCheck, FiLayers, FiPause, FiPlay, FiRotateCcw, FiZoomIn } from 'react-icons/fi';
import { advanceCabinet, cabinetStepState, confirmCabinetPart, createCabinetPlan, initialCabinetState, placeCabinetPart, selectCabinetPart, type CabinetState } from '@/lib/assembly-guide/cabinet';
import type { CabinetView } from './CabinetScene';
import { cabinetActionCaption, cabinetFilmDuration, cabinetFilmElapsed, seekCabinetFilm } from '@/lib/assembly-guide/cabinetFilm';
import styles from './cabinet.module.css';

const CabinetScene = dynamic(() => import('./CabinetScene').then(module => module.CabinetScene), { ssr: false,
  loading: () => <div className={styles.loading} role="status">캐비넷 부품을 준비하고 있습니다…</div> });

type Mode = 'preview' | 'practice' | 'watch';

export function CabinetSimulator() {
  const plan = useMemo(() => createCabinetPlan(), []);
  const [mode, setMode] = useState<Mode>('preview');
  const [ui, setUi] = useState<CabinetState>(initialCabinetState);
  const live = useRef<CabinetState>(ui);
  const [view, setView] = useState<CabinetView>('overview');
  const [inside, setInside] = useState(false), [doorOpen, setDoorOpen] = useState(false);
  const [revision, setRevision] = useState(0), [message, setMessage] = useState('');
  const [cinematic, setCinematic] = useState(true), [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const [furthest, setFurthest] = useState(0), [speed, setSpeed] = useState(1);
  const rate = useRef(1), report = useRef(0);
  const active = plan.parts[ui.step], complete = ui.phase === 'complete';
  const publish = useCallback((state: CabinetState) => { live.current = state; setUi(state); }, []);
  const tick = useCallback((seconds: number) => {
    const previous = live.current;
    const state = advanceCabinet(previous, seconds * rate.current, plan);
    live.current = state;
    report.current += seconds;
    if (state.phase !== previous.phase || state.step !== previous.step || report.current >= .1 && state.playing) {
      report.current = 0; setUi({ ...state });
      if (state.step !== previous.step) setFurthest(value => Math.max(value, state.step));
      if (!state.automatic && previous.phase === 'hardware' && state.phase === 'ready') {
        setView('overview'); setInside(false); setRevision(value => value + 1);
      }
    }
  }, [plan]);
  const select = useCallback((id: string) => {
    const state = live.current;
    const next = selectCabinetPart(state, id, plan);
    if (next === state) {
      if (state.phase === 'choose') setMessage(`지금은 ${state.step + 1}번 ${plan.parts[state.step].label}를 선택하세요.`);
      return;
    }
    publish(next); setMessage(''); setView('part'); setInside(false); setRevision(value => value + 1);
  }, [plan, publish]);
  const place = useCallback(() => {
    const next = placeCabinetPart(live.current);
    publish(next); setView('overview'); setInside(false); setRevision(value => value + 1); setMessage('');
  }, [publish]);
  const lost = useCallback(() => { publish({ ...live.current, playing: false }); }, [publish]);
  const changeMode = (next: Mode) => {
    setMode(next); publish({ ...initialCabinetState(), automatic: next === 'watch', playing: next === 'watch' });
    setFurthest(0); setInside(false); setDoorOpen(false); setView('overview'); setMessage(''); setRevision(value => value + 1);
    setCinematic(true);
  };
  const prepare = () => {
    if (live.current.phase !== 'hardware') return;
    publish({ ...live.current, playing: true }); setView('joint'); setInside(true); setRevision(value => value + 1);
  };
  const confirm = () => {
    const next = confirmCabinetPart(live.current, plan.parts.length);
    publish(next); setFurthest(value => Math.max(value, next.step)); setView('overview'); setRevision(value => value + 1);
  };
  const inspect = (next: CabinetView) => { setView(next); setCinematic(false); if (next === 'joint') setInside(true); setRevision(value => value + 1); };
  const goToStep = (step: number) => {
    publish({ ...cabinetStepState(step, plan.parts.length), automatic: mode === 'watch' });
    setView('overview'); setRevision(value => value + 1);
  };
  const phaseAction = ui.phase === 'hardware' ? prepare : ui.phase === 'ready' ? place : confirm;
  const phaseLabel = ui.phase === 'hardware' ? '커넥터 끼우기' : ui.phase === 'ready' ? active.box.kind === 'horizontal' ? '판재 제자리에 놓기' : '판재 제자리에 끼우기' : complete ? '조립 완료' : '체결 확인';
  const finalAvailable = mode === 'preview' || complete;
  const height = Math.max(...plan.cnc.boxes.map(box => (box.y + box.h / 2) * 10)) + 10;
  const filmLength = cabinetFilmDuration(plan), filmElapsed = cabinetFilmElapsed(plan, ui);
  const springAction = ui.phase.startsWith('spring-');
  const openDoor = doorOpen || mode === 'watch' && (ui.phase === 'reveal' || complete);
  return <main className={styles.simulator}>
    <header className={styles.header}>
      <Link href="/" aria-label="Befun 홈" className={styles.brand}><Image src="/imgs/icon/befun_logo.svg" width={120} height={28} alt="Befun" unoptimized priority /></Link>
      <span className={styles.pageLabel}>캐비넷 모의 조립</span>
      <div className={styles.modes} role="group" aria-label="캐비넷 조립 방식">
        <button type="button" aria-pressed={mode === 'preview'} onClick={() => changeMode('preview')}>완성 모습</button>
        <button type="button" aria-pressed={mode === 'practice'} onClick={() => changeMode('practice')}>직접 조립</button>
        <button type="button" aria-pressed={mode === 'watch'} onClick={() => changeMode('watch')}>전체 영상</button>
      </div>
      <Link href="/assembly-guide?topic=connector" className={styles.back}><FiArrowLeft /> 접합부 안내</Link>
    </header>
    <div className={styles.content}>
      <section className={styles.scene} aria-label="Befun 캐비넷 모의 조립 장면">
        <CabinetScene plan={plan} state={live} preview={mode === 'preview'} inside={inside} doorOpen={openDoor} view={view} revision={revision}
          cinematic={mode === 'watch' && cinematic} reducedMotion={reducedMotion}
          step={ui.step} phase={ui.phase} onTick={tick} onSelect={select} onPlace={place} onLost={lost} />
        <div className={styles.heading}>
          <span className={styles.eyebrow}>BEFUN · TERRACOTTA</span>
          <h1>{mode === 'preview' ? '우리 캐비넷을 직접 조립해 보세요.' : complete ? '캐비넷을 완성했습니다.' : active.title}</h1>
          <p>{plan.design.width} × {Math.round(height / 10)} × {plan.design.depth} cm <span>1단 도어 캐비넷</span></p>
        </div>
        <div className={styles.viewTools} role="group" aria-label="캐비넷 보기">
          <button type="button" aria-pressed={view === 'overview'} onClick={() => inspect('overview')}><FiLayers /> 전체</button>
          <button type="button" aria-pressed={view === 'part'} onClick={() => inspect('part')}><FiZoomIn /> 부품</button>
          {mode !== 'preview' && <button type="button" aria-pressed={view === 'joint'} disabled={!active.hardware.length && !active.pinCenters.length} onClick={() => inspect('joint')}>연결부</button>}
          <button type="button" aria-pressed={inside} onClick={() => setInside(value => !value)}>내부</button>
          {mode === 'watch' && <button type="button" aria-pressed={cinematic} onClick={() => { setCinematic(value => !value); setRevision(value => value + 1); }}>자동 시점</button>}
        </div>
        <div className={styles.caption} aria-live="polite">{message || (mode === 'preview' ? '판재부터 커넥터와 도어까지, 한 부품씩 조립해 보세요.' : cabinetActionCaption(ui, active))}</div>
      </section>
      <aside className={styles.parts} aria-label="캐비넷 부품 목록">
        <div className={styles.partsHeading}><span>{mode === 'preview' ? '캐비넷 구성' : '이번 부품'}</span><strong>{mode === 'preview' || complete ? plan.parts.length : ui.step}/{plan.parts.length}</strong></div>
        <div className={styles.partList}>
          {plan.parts.map(part => <button type="button" key={part.id} disabled={mode !== 'practice' || complete}
            aria-pressed={ui.selectedId === part.id} aria-current={mode !== 'preview' && part.number - 1 === ui.step ? 'step' : undefined}
            onClick={() => select(part.id)} className={part.number - 1 < ui.step || complete ? styles.installed : ''}>
            <span className={styles.listNumber}>{part.number - 1 < ui.step || complete ? <FiCheck /> : String(part.number).padStart(2, '0')}</span>
            <span><strong>{part.label}</strong><small>{Math.round(part.panel.width)} × {Math.round(part.panel.height)} mm</small></span>
          </button>)}
        </div>
        <p className={styles.partHelp}>{mode === 'preview' ? '도어 포함 8개 부품' : active.connection}</p>
      </aside>
    </div>
    <footer className={styles.footer}>
      {mode === 'preview' ? <>
        <p>부품을 선택하고, 연결부를 준비한 다음 제자리에 체결합니다.</p>
        <div className={styles.controls}><button type="button" className={styles.primary} onClick={() => changeMode('watch')}><FiPlay /> 전체 영상 재생</button>
          <button type="button" className={styles.secondary} onClick={() => changeMode('practice')}>직접 조립 시작</button></div>
      </> : <>
        <div className={styles.timeline}>
          <button type="button" className={styles.icon} aria-label="이전 조립 단계" disabled={ui.step === 0} onClick={() => goToStep(ui.step - 1)}><FiArrowLeft /></button>
          <nav aria-label="캐비넷 조립 단계">{plan.parts.map((part, index) => <button type="button" key={part.id} aria-label={`${index + 1}단계 ${part.title}`}
            aria-current={ui.step === index ? 'step' : undefined} disabled={index > furthest} onClick={() => goToStep(index)}>{index + 1}</button>)}</nav>
          <button type="button" className={styles.icon} aria-label="캐비넷 처음부터" onClick={() => changeMode(mode)}><FiRotateCcw /></button>
        </div>
        <div className={styles.controls}>
          {mode === 'watch' || ui.playing || ui.phase === 'placing' || springAction ? <button type="button" className={styles.primary} onClick={() => { if (complete) changeMode('watch'); else { publish({ ...live.current, playing: !live.current.playing }); setRevision(value => value + 1); } }}>{ui.playing ? <FiPause /> : <FiPlay />}{complete ? '다시 전체 보기' : ui.playing ? '일시정지' : '재생'}</button> :
            <button type="button" className={styles.primary} disabled={ui.phase === 'choose' || complete} onClick={phaseAction}>{phaseLabel}{ui.phase === 'check' && <FiCheck />}</button>}
          <label className={styles.seek}>{mode === 'watch' ? `${Math.round(filmElapsed)} / ${Math.round(filmLength)}초` : '동작'} <input type="range" aria-label={mode === 'watch' ? '전체 영상 탐색' : '현재 부품 동작 탐색'} min="0" max="1000" value={Math.round((mode === 'watch' ? filmElapsed / filmLength : ui.progress) * 1000)} disabled={mode !== 'watch' && !['hardware', 'placing'].includes(ui.phase) && !springAction} onChange={event => {
            const p = Number(event.target.value) / 1000;
            const state = mode === 'watch' ? seekCabinetFilm(plan, p * filmLength) : { ...live.current, progress: p, playing: false };
            publish(state); if (mode === 'watch') setFurthest(value => Math.max(value, state.step));
          }} /></label>
          <label className={styles.speed}><span className={styles.srOnly}>캐비넷 재생 속도</span><select aria-label="캐비넷 재생 속도" value={speed} onChange={event => { const value = Number(event.target.value); setSpeed(value); rate.current = value; }}><option value=".5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label>
        </div>
      </>}
      {finalAvailable && mode !== 'watch' && <button type="button" className={styles.doorButton} aria-pressed={doorOpen} onClick={() => setDoorOpen(value => !value)}>{doorOpen ? '도어 닫기' : '도어 열어보기'}</button>}
      <details className={styles.scope}><summary>모델·조립 범위</summary><p>실제 Befun 생성기의 1단 도어 구성입니다. OVVO V-1230P 몸통 접합은 영구형이며, 단계 초기화는 화면 연습 기능입니다. 보강 패널과 백패널은 아래 고정 다보·위 스프링 다보로 체결합니다. 다보와 경첩은 설명용 모델이며 정밀 제조 치수는 확정하지 않았습니다.</p></details>
    </footer>
  </main>;
}

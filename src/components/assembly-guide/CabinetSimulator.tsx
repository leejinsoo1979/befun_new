'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiCheck, FiLayers, FiPause, FiPlay, FiRotateCcw, FiZoomIn } from 'react-icons/fi';
import { advanceCabinet, cabinetStepState, confirmCabinetPart, createCabinetPlan, initialCabinetState, placeCabinetPart, selectCabinetPart, type CabinetState } from '@/lib/assembly-guide/cabinet';
import type { CabinetView } from './CabinetScene';
import styles from './cabinet.module.css';

const CabinetScene = dynamic(() => import('./CabinetScene').then(module => module.CabinetScene), { ssr: false,
  loading: () => <div className={styles.loading} role="status">캐비넷 부품을 준비하고 있습니다…</div> });

type Mode = 'preview' | 'practice' | 'watch';
const captions = {
  choose: '번호가 표시된 부품을 선택하세요.', hardware: '가공된 홈에 하우징을 넣고 연결 커넥터를 끼웁니다.',
  ready: '점선으로 표시된 위치를 눌러 부품을 조립하세요.', placing: '부품의 방향과 맞물리는 위치를 함께 보세요.',
  check: '끝선과 부품이 맞닿은 모습을 확인하세요.', complete: '캐비넷을 완성했습니다. 돌려 보거나 도어를 열어 내부를 확인하세요.',
};

export function CabinetSimulator() {
  const plan = useMemo(() => createCabinetPlan(), []);
  const [mode, setMode] = useState<Mode>('preview');
  const [ui, setUi] = useState<CabinetState>(initialCabinetState);
  const live = useRef<CabinetState>(ui);
  const [view, setView] = useState<CabinetView>('overview');
  const [inside, setInside] = useState(false), [doorOpen, setDoorOpen] = useState(false);
  const [revision, setRevision] = useState(0), [message, setMessage] = useState('');
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
  };
  const prepare = () => {
    if (live.current.phase !== 'hardware') return;
    publish({ ...live.current, playing: true }); setView('joint'); setInside(true); setRevision(value => value + 1);
  };
  const confirm = () => {
    const next = confirmCabinetPart(live.current, plan.parts.length);
    publish(next); setFurthest(value => Math.max(value, next.step)); setView('overview'); setRevision(value => value + 1);
  };
  const inspect = (next: CabinetView) => { setView(next); if (next === 'joint') setInside(true); setRevision(value => value + 1); };
  const phaseAction = ui.phase === 'hardware' ? prepare : ui.phase === 'ready' ? place : confirm;
  const phaseLabel = ui.phase === 'hardware' ? '커넥터 끼우기' : ui.phase === 'ready' ? active.box.kind === 'horizontal' ? '판재 제자리에 놓기' : '판재 제자리에 끼우기' : complete ? '조립 완료' : '체결 확인';
  const finalAvailable = mode === 'preview' || complete;
  const height = Math.max(...plan.cnc.boxes.map(box => (box.y + box.h / 2) * 10)) + 10;
  return <main className={styles.simulator}>
    <header className={styles.header}>
      <Link href="/" aria-label="Befun 홈" className={styles.brand}><Image src="/imgs/icon/befun_logo.svg" width={120} height={28} alt="Befun" unoptimized priority /></Link>
      <span className={styles.pageLabel}>캐비넷 모의 조립</span>
      <div className={styles.modes} role="group" aria-label="캐비넷 조립 방식">
        <button type="button" aria-pressed={mode === 'preview'} onClick={() => changeMode('preview')}>완성 모습</button>
        <button type="button" aria-pressed={mode === 'practice'} onClick={() => changeMode('practice')}>직접 조립</button>
        <button type="button" aria-pressed={mode === 'watch'} onClick={() => changeMode('watch')}>자동 조립</button>
      </div>
      <Link href="/assembly-guide?topic=connector" className={styles.back}><FiArrowLeft /> 접합부 안내</Link>
    </header>
    <div className={styles.content}>
      <section className={styles.scene} aria-label="Befun 캐비넷 모의 조립 장면">
        <CabinetScene plan={plan} state={live} preview={mode === 'preview'} inside={inside} doorOpen={doorOpen} view={view} revision={revision}
          step={ui.step} phase={ui.phase} onTick={tick} onSelect={select} onPlace={place} onLost={lost} />
        <div className={styles.heading}>
          <span className={styles.eyebrow}>BEFUN · TERRACOTTA</span>
          <h1>{mode === 'preview' ? '우리 캐비넷을 직접 조립해 보세요.' : complete ? '캐비넷을 완성했습니다.' : active.title}</h1>
          <p>{plan.design.width} × {Math.round(height / 10)} × {plan.design.depth} cm <span>1단 도어 캐비넷</span></p>
        </div>
        <div className={styles.viewTools} role="group" aria-label="캐비넷 보기">
          <button type="button" aria-pressed={view === 'overview'} onClick={() => inspect('overview')}><FiLayers /> 전체</button>
          <button type="button" aria-pressed={view === 'part'} onClick={() => inspect('part')}><FiZoomIn /> 부품</button>
          {mode !== 'preview' && <button type="button" aria-pressed={view === 'joint'} disabled={!active.hardware.length} onClick={() => inspect('joint')}>연결부</button>}
          <button type="button" aria-pressed={inside} onClick={() => setInside(value => !value)}>내부</button>
        </div>
        <div className={styles.caption} aria-live="polite">{message || (mode === 'preview' ? '판재부터 커넥터와 도어까지, 한 부품씩 조립해 보세요.' : captions[ui.phase])}</div>
      </section>
      <aside className={styles.parts} aria-label="캐비넷 부품 목록">
        <div className={styles.partsHeading}><span>{mode === 'preview' ? '캐비넷 구성' : '이번 부품'}</span><strong>{mode === 'preview' || complete ? plan.parts.length : ui.step}/{plan.parts.length}</strong></div>
        <div className={styles.partList}>
          {plan.parts.map(part => <button type="button" key={part.id} disabled={mode === 'preview' || complete}
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
        <button type="button" className={styles.primary} onClick={() => changeMode('practice')}>직접 조립 시작 <FiPlay /></button>
      </> : <>
        <div className={styles.timeline}>
          <button type="button" className={styles.icon} aria-label="이전 조립 단계" disabled={ui.step === 0} onClick={() => { publish(cabinetStepState(ui.step - 1, plan.parts.length)); setView('overview'); setRevision(value => value + 1); }}><FiArrowLeft /></button>
          <nav aria-label="캐비넷 조립 단계">{plan.parts.map((part, index) => <button type="button" key={part.id} aria-label={`${index + 1}단계 ${part.title}`}
            aria-current={ui.step === index ? 'step' : undefined} disabled={index > furthest} onClick={() => { publish(cabinetStepState(index, plan.parts.length)); setView('overview'); setRevision(value => value + 1); }}>{index + 1}</button>)}</nav>
          <button type="button" className={styles.icon} aria-label="캐비넷 처음부터" onClick={() => changeMode(mode)}><FiRotateCcw /></button>
        </div>
        <div className={styles.controls}>
          {mode === 'watch' || ui.playing || ui.phase === 'placing' ? <button type="button" className={styles.primary} disabled={complete} onClick={() => publish({ ...live.current, playing: !live.current.playing })}>{ui.playing ? <FiPause /> : <FiPlay />}{ui.playing ? '일시정지' : '재생'}</button> :
            <button type="button" className={styles.primary} disabled={ui.phase === 'choose' || complete} onClick={phaseAction}>{phaseLabel}{ui.phase === 'check' && <FiCheck />}</button>}
          <label className={styles.seek}>동작 <input type="range" aria-label="현재 부품 동작 탐색" min="0" max="1000" value={Math.round(ui.progress * 1000)} disabled={!['hardware', 'placing'].includes(ui.phase)} onChange={event => publish({ ...live.current, progress: Number(event.target.value) / 1000, playing: false })} /></label>
          <label className={styles.speed}><span className={styles.srOnly}>캐비넷 재생 속도</span><select aria-label="캐비넷 재생 속도" value={speed} onChange={event => { const value = Number(event.target.value); setSpeed(value); rate.current = value; }}><option value=".5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label>
        </div>
      </>}
      {finalAvailable && <button type="button" className={styles.doorButton} aria-pressed={doorOpen} onClick={() => setDoorOpen(value => !value)}>{doorOpen ? '도어 닫기' : '도어 열어보기'}</button>}
      <details className={styles.scope}><summary>모델·조립 범위</summary><p>실제 Befun 생성기의 1단 도어 구성입니다. OVVO V-1230P 몸통 접합은 영구형이며, 단계 초기화는 화면 연습 기능입니다. 후면 부품은 배치 연습이고, 고정 순서는 <Link href="/assembly-guide?topic=back-panel">백패널 안내</Link>에서 확인하세요. 경첩은 공통 시연 모델을 사용합니다.</p></details>
    </footer>
  </main>;
}

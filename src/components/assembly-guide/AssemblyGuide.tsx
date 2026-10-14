'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiArrowRight, FiPlay, FiPause, FiRotateCcw, FiMaximize, FiLayers, FiVolume2, FiVolumeX, FiChevronDown } from 'react-icons/fi';
import { advanceTimeline, locateTimeline } from '@/lib/assembly-guide/playback';
import { useCallback, useEffect, useRef, useState } from 'react';
import { guideSources, guideSteps, type ConnectorModel, type GuideTopic } from '@/lib/assembly-guide/sequence';
import { releaseSteps, canConfirmRelease, type JointAction } from '@/lib/assembly-guide/disassembly';
import { backPanelSource, backPanelSteps } from '@/lib/assembly-guide/backPanel';
import { tylkoClipSource, tylkoClipSteps, type ClipColourVersion } from '@/lib/assembly-guide/tylkoClip';
import type { GuidePlayback } from './GuideScene';
import { ReferenceClipGuide } from './ReferenceClipGuide';
import { ReferenceLegGuide } from './ReferenceLegGuide';
import { legSteps, canConfirmLeg, legVideoSource, legManualSource, type LegAction } from '@/lib/assembly-guide/legs';
import type { JointInspection } from '@/lib/assembly-guide/inspectionShot';
import styles from './guide.module.css';

const GuideScene = dynamic(() => import('./GuideScene').then(module => module.GuideScene), {
  ssr: false,
  loading: () => <div className={styles.loading} role="status">조립 장면을 준비하고 있습니다…</div>,
});

const sequenceFor = (topic: GuideTopic, model: ConnectorModel, legAction: LegAction = 'disassemble', jointAction: JointAction = 'assemble') => topic === 'legs' ? legSteps(legAction) : topic === 'tylko-clip' ? tylkoClipSteps : topic === 'back-panel' ? backPanelSteps : jointAction === 'disassemble' && model === 'V-1230R' ? releaseSteps : guideSteps(model);

export function AssemblyGuide({ initialTopic = 'tylko-clip', initialJointAction = 'assemble' }: { initialTopic?: GuideTopic; initialJointAction?: JointAction }) {
  const [topic, setTopic] = useState<GuideTopic>(initialTopic);
  const [legAction, setLegAction] = useState<LegAction>('disassemble');
  const [legPresentation, setLegPresentation] = useState<'reference' | 'model'>('reference');
  const [jointAction, setJointAction] = useState<JointAction>(initialJointAction);
  const [model, setModel] = useState<ConnectorModel>('V-1230R');
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<'watch' | 'assemble'>('watch');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [freeCamera, setFreeCamera] = useState(false);
  const displayedStep = useRef(0);
  const [inside, setInside] = useState(initialTopic === 'tylko-clip');
  const [clipColourVersion, setClipColourVersion] = useState<ClipColourVersion>('black-orange');
  const [clipPresentation, setClipPresentation] = useState<'reference' | 'model'>('reference');
  const [inspection, setInspection] = useState<JointInspection>('auto');
  const [overview, setOverview] = useState(initialTopic !== 'legs');
  const [rear, setRear] = useState(false);
  const [narration, setNarration] = useState(false);
  const [narrationMessage, setNarrationMessage] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<ReadonlySet<number>>(new Set());
  const container = useRef<HTMLDivElement>(null);
  const stepNavigation = useRef<HTMLElement>(null);
  const playback = useRef<GuidePlayback>({ model: 'V-1230R', topic: initialTopic, step: 0, progress: 0, playing: false, speed: 1, overview: initialTopic !== 'legs', rear: false, manual: false, revision: 0, inspection: 'auto', continuous: true, reference: initialTopic === 'tylko-clip' || initialTopic === 'legs', legAction: 'disassemble', jointAction: initialJointAction });
  const steps = sequenceFor(topic, model, legAction, jointAction);
  const current = steps[step];
  const referenceOnly = topic === 'tylko-clip' && clipPresentation === 'reference' || topic === 'legs' && legPresentation === 'reference';
  const releaseFollow = topic === 'connector' && jointAction === 'disassemble';
  const done = releaseFollow && mode === 'assemble' ? canConfirmRelease(step, progress, completedSteps) : topic === 'legs' ? canConfirmLeg(legAction, step, progress, completedSteps) : referenceOnly || progress === 1;
  const firstMissing = steps.findIndex((_, index) => index !== step && !completedSteps.has(index));

  const autoInside = (value: GuideTopic, chapter: number) => value === 'legs' ? false : value === 'connector' ? jointAction === 'disassemble' ? chapter === 1 || chapter === 2 : chapter >= 3 && chapter <= 6 : value === 'tylko-clip' ? chapter < 4 : chapter >= 3 && chapter <= 5;
  const update = useCallback((value: number, active: boolean) => {
    const state = playback.current;
    setProgress(value); setPlaying(active);
    if (displayedStep.current !== state.step) {
      displayedStep.current = state.step;
      setStep(state.step); setOverview(state.overview); setRear(false);
      setConfirmed(false); setFinished(false); setInspection('auto'); setFreeCamera(false);
      setInside(state.topic === 'legs' ? false : state.topic === 'connector' ? state.jointAction === 'disassemble' ? state.step === 1 || state.step === 2 : state.step >= 3 && state.step <= 6 : state.topic === 'tylko-clip' ? state.step < 4 : state.step >= 3 && state.step <= 5);
    }
  }, []);
  const tick = useCallback((delta: number) => {
    const state = playback.current;
    const sequence = sequenceFor(state.topic, state.model, state.legAction, state.jointAction);
    const next = advanceTimeline(state, sequence.map(item => item.duration), delta);
    const changed = next.step !== state.step;
    Object.assign(state, next);
    if (changed) Object.assign(state, { overview: state.reference && state.topic !== 'legs' || sequence[state.step].view === 'overview' || sequence[state.step].view === 'clip-colour', rear: false, manual: false, revision: state.revision + 1, inspection: 'auto' });
    return state;
  }, []);
  const manual = useCallback(() => { playback.current.manual = true; playback.current.inspection = 'auto'; setInspection('auto'); setFreeCamera(true); }, []);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) { playback.current.playing = false; setPlaying(false); } };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);
  useEffect(() => {
    if (!referenceOnly || !playing) return;
    let frame = 0;
    let previous = 0;
    let report = 0;
    const animate = (time: number) => {
      const elapsed = previous ? (time - previous) / 1000 : 0;
      previous = time;
      const state = tick(elapsed);
      report += elapsed;
      if (report >= .08 || !state.playing) { update(state.progress, state.playing); report = 0; }
      if (state.playing) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [referenceOnly, playing, tick, update]);

  useEffect(() => {
    const nav = stepNavigation.current;
    const active = nav?.querySelector<HTMLButtonElement>('button[aria-current="step"]');
    if (!nav || !active) return;
    const centerActive = () => {
      if (nav.scrollWidth <= nav.clientWidth) return;
      const offset = active.getBoundingClientRect().left - nav.getBoundingClientRect().left;
      nav.scrollLeft += offset - nav.clientWidth / 2 + active.clientWidth / 2;
    };
    centerActive();
    const observer = new ResizeObserver(centerActive);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [step, topic]);

  useEffect(() => {
    if (!narration || !playing) return;
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(current.instruction);
    utterance.lang = 'ko-KR'; utterance.rate = .85;
    const voice = window.speechSynthesis.getVoices().find(value => value.lang.startsWith('ko'));
    if (voice) utterance.voice = voice;
    utterance.onerror = event => {
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      setNarrationMessage('한국어 음성을 사용할 수 없어 자막으로 안내합니다.');
      setNarration(false);
    };
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [current.instruction, narration, playing]);

  const selectStep = (index: number, nextModel = model, nextTopic = topic, autoPlay = false, nextLegAction = legAction, nextJointAction = jointAction) => {
    const action = nextModel === 'V-1230P' ? 'assemble' : nextJointAction;
    const sequence = sequenceFor(nextTopic, nextModel, nextLegAction, action);
    const next = Math.max(0, Math.min(sequence.length - 1, index));
    if (mode === 'assemble' && (nextTopic === 'legs' || nextTopic === 'connector' && action === 'disassemble') && nextTopic === topic && nextLegAction === legAction && index > 0 && Array.from({ length: index }, (_, i) => i).some(i => !completedSteps.has(i))) return;
    const wide = nextTopic === 'tylko-clip' && (clipPresentation === 'reference' || nextTopic !== topic) || sequence[next].view === 'overview' || sequence[next].view === 'clip-colour';
    Object.assign(playback.current, { model: nextModel, topic: nextTopic, step: next, progress: 0, playing: autoPlay, overview: wide, rear: false, manual: false, revision: playback.current.revision + 1, inspection: 'auto', continuous: mode === 'watch', reference: nextTopic === 'tylko-clip' && (nextTopic !== topic || clipPresentation === 'reference') || nextTopic === 'legs' && (nextTopic !== topic || legPresentation === 'reference'), legAction: nextLegAction, jointAction: action });
    displayedStep.current = next;
    setJointAction(action); setLegAction(nextLegAction); setModel(nextModel); setTopic(nextTopic); setStep(next); setProgress(0); setPlaying(autoPlay);
    setOverview(wide); setRear(false); setConfirmed(false); setFinished(false);
    setInspection('auto'); setFreeCamera(false);
    if (nextModel !== model || nextTopic !== topic || nextLegAction !== legAction || action !== jointAction) setCompletedSteps(new Set());
    if (nextTopic !== topic) { setClipPresentation('reference'); setLegPresentation('reference'); }
    setInside(nextTopic === 'connector' && action === 'disassemble' ? next === 1 || next === 2 : autoInside(nextTopic, next));
  };
  const play = (repeat = false) => {
    const ended = mode === 'watch' ? step === steps.length - 1 && progress === 1 : progress === 1;
    if (repeat || ended) {
      if (topic === 'legs' || releaseFollow) setCompletedSteps(previous => new Set([...previous].filter(index => index < (mode === 'watch' ? 0 : step))));
      const next = mode === 'watch' ? 0 : step;
      Object.assign(playback.current, { step: next, progress: 0, overview: topic === 'legs' ? steps[next].view === 'overview' : next === 0 || referenceOnly, revision: playback.current.revision + 1, inspection: 'auto' });
      displayedStep.current = next;
      setStep(next); setProgress(0); setInside(autoInside(topic, next)); setOverview(topic === 'legs' ? steps[next].view === 'overview' : next === 0 || referenceOnly);
      setConfirmed(false); setFinished(false); setInspection('auto'); setFreeCamera(false);
    }
    playback.current.playing = repeat || ended || !playing;
    if (playback.current.manual) playback.current.revision++;
    playback.current.manual = false; setFreeCamera(false);
    setPlaying(playback.current.playing);
  };
  const seek = (value: number) => {
    const next = mode === 'watch' ? locateTimeline(steps.map(item => item.duration), value) : { step, progress: value };
    const changed = next.step !== playback.current.step;
    Object.assign(playback.current, next, { playing: false, manual: false });
    if (changed) {
      Object.assign(playback.current, { overview: referenceOnly && topic !== 'legs' || steps[next.step].view === 'overview', inspection: 'auto', revision: playback.current.revision + 1 });
      setOverview(playback.current.overview); setInspection('auto'); setInside(autoInside(topic, next.step));
    }
    if (topic === 'legs' || releaseFollow) setCompletedSteps(previous => new Set([...previous].filter(index => index < next.step)));
    displayedStep.current = next.step; setFreeCamera(false);
    setStep(next.step); setProgress(next.progress); setPlaying(false); setConfirmed(false); setFinished(false);
  };
  const changeLegPresentation = (value: 'reference' | 'model') => {
    setLegPresentation(value); selectStep(step); playback.current.reference = value === 'reference';
    view(value === 'reference' || step === 4, false);
  };
  const changeMode = (value: 'watch' | 'assemble') => {
    if (topic === 'legs' || releaseFollow) { selectStep(0); setCompletedSteps(new Set()); }
    setMode(value); playback.current.continuous = value === 'watch'; playback.current.playing = false; setPlaying(false);
  };
  const view = (wide: boolean, back: boolean) => {
    Object.assign(playback.current, { overview: wide, rear: back, manual: false, revision: playback.current.revision + 1, inspection: 'auto' });
    setOverview(wide); setRear(back); setFreeCamera(false);
    setInspection('auto');
  };
  const inspect = (value: JointInspection) => {
    Object.assign(playback.current, { inspection: value, overview: false, manual: false, revision: playback.current.revision + 1 });
    setInspection(value); setOverview(false); setFreeCamera(false);
  };
  const confirm = (checked: boolean) => {
    if (checked && !done) return;
    setConfirmed(checked);
    setCompletedSteps(previous => {
      const next = new Set(previous);
      if (checked) next.add(step); else if (topic === 'legs' || releaseFollow) { for (const index of next) if (index >= step) next.delete(index); } else next.delete(step);
      return next;
    });
  };
  const changeClipPresentation = (value: 'reference' | 'model') => {
    setClipPresentation(value);
    selectStep(step);
    playback.current.reference = value === 'reference';
    setCompletedSteps(new Set());
    view(value === 'reference' || step === 0, false);
  };
  const toggleNarration = () => {
    if (!('speechSynthesis' in window)) { setNarrationMessage('이 브라우저에서는 자막으로 안내합니다.'); return; }
    setNarration(value => !value); setNarrationMessage('');
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await container.current?.requestFullscreen();
    } catch { setNarrationMessage('이 브라우저에서는 현재 화면 크기로 재생합니다.'); }
  };

  const totalDuration = steps.reduce((sum, item) => sum + item.duration, 0);
  const elapsed = steps.slice(0, step).reduce((sum, item) => sum + item.duration, 0) + current.duration * progress;
  const position = mode === 'watch' ? elapsed / totalDuration : progress;
  const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const source = topic === 'legs' ? legVideoSource : topic === 'tylko-clip' ? tylkoClipSource : topic === 'back-panel' ? backPanelSource : guideSources[model];

  return <main ref={container} className={styles.guide}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Befun 홈"><Image src="/imgs/icon/befun_logo.svg" alt="Befun" width={120} height={28} unoptimized priority /></Link>
      <span className={styles.pageLabel}>조립·분해 안내</span>
      <div className={styles.topics} role="group" aria-label="조립 안내 종류">
        <button type="button" aria-pressed={topic === 'tylko-clip'} onClick={() => selectStep(0, model, 'tylko-clip')}>Tylko 클립</button>
        <button type="button" aria-pressed={topic === 'connector'} onClick={() => selectStep(0, model, 'connector')}>OVVO</button>
        <button type="button" aria-pressed={topic === 'legs'} onClick={() => selectStep(0, model, 'legs')}>다리</button>
        <button type="button" aria-pressed={topic === 'back-panel'} onClick={() => selectStep(0, model, 'back-panel')}>백패널</button>
      </div>
      <Link href="/configurator" className={styles.back}><FiArrowLeft aria-hidden="true" /> 디자인으로</Link>
      <button type="button" className={styles.iconButton} onClick={fullscreen} aria-label="조립 안내 전체 화면" title="전체 화면"><FiMaximize aria-hidden="true" /></button>
    </header>
    <section className={`${styles.stage} ${referenceOnly ? styles.referenceStage : ''} ${mode === 'assemble' ? styles.followStage : ''} ${topic === 'legs' && !referenceOnly ? styles.legModelStage : ''}`} aria-label={referenceOnly ? '원본 조립 자료' : '3D 조립 장면'}>
      <div className={styles.canvas}>{referenceOnly ? topic === 'legs' ? <ReferenceLegGuide onPauseGuide={() => { playback.current.playing = false; setPlaying(false); }} action={legAction} step={step} progress={progress} detail={!overview} /> : <ReferenceClipGuide key={`${step}-${clipColourVersion}`} step={step} detail={!overview} colourVersion={clipColourVersion} /> : <GuideScene onTick={tick} onManual={manual} model={model} topic={topic} step={step} jointAction={jointAction} inside={inside} clipColourVersion={clipColourVersion} onUpdate={update} />}</div>
      <div className={styles.sceneHeading}>
        <span className={styles.stepPill}>{topic === 'connector' ? `OVVO ${model} · ${jointAction === 'disassemble' ? '분해' : '조립'}` : topic === 'tylko-clip' ? 'Tylko Original' : topic === 'legs' ? `다리 · ${legAction === 'disassemble' ? '분리' : '조립'}` : '백패널'} <span> / {String(step + 1).padStart(2, '0')} — {String(steps.length).padStart(2, '0')}</span></span>
        <h1>{current.title}</h1>
        {topic === 'connector' && <div className={styles.clipOptions}><label className={styles.model}><span className={styles.srOnly}>OVVO 예시</span><select aria-label="OVVO 예시" value={model} onChange={event => selectStep(0, event.target.value as ConnectorModel)}><option value="V-1230R">V-1230R · 밀어 결합</option><option value="V-1230P">V-1230P · 눌러 결합</option></select><FiChevronDown aria-hidden="true" /></label><div className={styles.presentation} role="group" aria-label="OVVO 조립 또는 분해"><button type="button" aria-pressed={jointAction === 'assemble'} onClick={() => selectStep(0, model, topic, false, legAction, 'assemble')}>조립</button><button type="button" disabled={model === 'V-1230P'} title={model === 'V-1230P' ? 'V-1230P는 영구 결합형입니다.' : '15mm 슬라이드 후 들어 분리'} aria-pressed={jointAction === 'disassemble'} onClick={() => selectStep(0, model, topic, false, legAction, 'disassemble')}>분해</button></div>{model === 'V-1230P' && <span className={styles.materialNote}>영구 결합형 · 분해 불가</span>}</div>}
        {topic === 'tylko-clip' && <div className={styles.clipOptions}><label className={styles.model}><span className={styles.srOnly}>색상 대응</span><select aria-label="색상 대응" value={clipColourVersion} onChange={event => { setClipColourVersion(event.target.value as ClipColourVersion); selectStep(0); setCompletedSteps(new Set()); }}><option value="black-orange">검정·주황</option><option value="black-silver">검정·은색</option></select><FiChevronDown aria-hidden="true" /></label><div className={styles.presentation} role="group" aria-label="Tylko 자료 보기 방식"><button type="button" aria-pressed={referenceOnly} onClick={() => changeClipPresentation('reference')}>원본 자료</button><button type="button" aria-pressed={!referenceOnly} onClick={() => changeClipPresentation('model')}>추정 3D</button></div></div>}
        {topic === 'legs' && <div className={`${styles.clipOptions} ${styles.legOptions}`}>
          <div className={styles.presentation} role="group" aria-label="다리 조립 또는 분리"><button type="button" aria-pressed={legAction === 'disassemble'} onClick={() => selectStep(0, model, topic, false, 'disassemble')}>분리 안내</button><button type="button" aria-pressed={legAction === 'assemble'} onClick={() => selectStep(0, model, topic, false, 'assemble')}>조립 안내</button></div>
          <div className={styles.presentation} role="group" aria-label="다리 자료 보기 방식"><button type="button" aria-pressed={referenceOnly} onClick={() => changeLegPresentation('reference')}>원본 자료</button><button type="button" aria-pressed={!referenceOnly} onClick={() => changeLegPresentation('model')}>원본 모델</button></div>
        </div>}
      </div>
      <div className={styles.viewMenu}>
        <button type="button" className={styles.viewTrigger} aria-expanded={toolsOpen} aria-controls="assembly-view-tools" onClick={() => setToolsOpen(value => !value)}><FiLayers aria-hidden="true" /> 보기 <FiChevronDown aria-hidden="true" /></button>
        {toolsOpen && <div id="assembly-view-tools" className={styles.viewTools} role="group" aria-label="결합부 보기">
          <button type="button" aria-pressed={!overview} onClick={() => view(false, rear)}>{referenceOnly ? '원본 영역 확대' : '결합부 확대'}</button>
          <button type="button" aria-pressed={overview} onClick={() => view(true, rear)}>{referenceOnly ? '전체 도해' : '전체 위치'}</button>
          {!referenceOnly && <>{topic !== 'legs' && <button type="button" aria-pressed={inside} onClick={() => setInside(value => !value)}>내부 보기</button>}<button type="button" aria-pressed={rear} onClick={() => view(overview, !rear)}>반대편</button></>}
          {topic === 'connector' && <div className={styles.inspectionTools}><button type="button" aria-pressed={inspection === 'front'} onClick={() => inspect('front')}>정면</button><button type="button" aria-pressed={inspection === 'side'} onClick={() => inspect('side')}>측면</button><button type="button" aria-pressed={inspection === 'section'} onClick={() => inspect('section')}>단면</button></div>}
        </div>}
      </div>
      <div className={styles.caption} aria-live="polite">{!referenceOnly && topic !== 'legs' && overview && <span className={styles.cutaway}>양면 라미네이트 · 자작나무 적층 엣지</span>}{topic === 'legs' && !referenceOnly && <span className={styles.cutaway}>원본 GLB 외형 보기 · 조립·분리 동작은 원본 자료에서 확인하세요.</span>}{mode === 'watch' && topic === 'connector' && model === 'V-1230R' && (jointAction === 'disassemble' ? step === 1 : step === 6) && inspection === 'auto' && !overview && !freeCamera && <span className={styles.cutaway}>체결부를 절개해 내부 동작을 보여드립니다.</span>}<p>{finished ? topic === 'legs' ? '이 다리의 안내를 확인했습니다.' : topic === 'tylko-clip' ? '자료 확인을 마쳤습니다.' : '이 접합부의 안내를 확인했습니다.' : current.instruction}</p></div>
      <footer className={styles.transport}>
        <div className={styles.chapterRow}>
          <div className={styles.mode} role="group" aria-label="재생 방식"><button type="button" aria-pressed={mode === 'watch'} onClick={() => changeMode('watch')}>전체 보기</button><button type="button" aria-pressed={mode === 'assemble'} onClick={() => changeMode('assemble')}>{topic === 'connector' && jointAction === 'disassemble' || topic === 'legs' && legAction === 'disassemble' ? '따라 분해' : '따라 조립'}</button></div>
          <nav ref={stepNavigation} className={styles.steps} aria-label="단계 선택">{steps.map((item, index) => <button type="button" key={item.title} disabled={(topic === 'legs' || releaseFollow) && mode === 'assemble' && Array.from({ length: index }, (_, i) => i).some(i => !completedSteps.has(i))} title={item.title} aria-label={`${String(index + 1).padStart(2, '0')} ${item.title}`} aria-current={step === index ? 'step' : undefined} onClick={() => selectStep(index, model, topic, mode === 'watch')}><span>{index + 1}</span>{completedSteps.has(index) && <i aria-label="확인됨" />}</button>)}</nav>
          <span className={styles.total}>{mode === 'watch' ? `전체 ${Math.round(totalDuration / speed)}초` : `${step + 1} / ${steps.length}`}</span>
        </div>
        <div className={styles.timeline}><span>{timeLabel((mode === 'watch' ? elapsed : current.duration * progress) / speed)}</span><input type="range" min="0" max="1000" value={Math.round(position * 1000)} onChange={event => seek(Number(event.target.value) / 1000)} aria-label={mode === 'watch' ? '전체 재생 위치' : '현재 단계 재생 위치'} /><span>{timeLabel((mode === 'watch' ? totalDuration : current.duration) / speed)}</span></div>
        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} disabled={step === 0} onClick={() => selectStep(step - 1, model, topic, mode === 'watch')} aria-label="이전 단계"><FiArrowLeft aria-hidden="true" /></button>
          <button type="button" className={styles.play} onClick={() => play()} aria-label={playing ? '일시정지' : mode === 'watch' ? '전체 재생' : '단계 재생'}>{playing ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />} {playing ? '일시정지' : mode === 'watch' ? step === steps.length - 1 && progress === 1 ? '다시 전체 보기' : '전체 재생' : done ? '다시 보기' : '단계 재생'}</button>
          <button type="button" className={styles.iconButton} onClick={() => play(true)} aria-label="처음부터 다시 재생" title="다시 재생"><FiRotateCcw aria-hidden="true" /></button>
          <button type="button" className={styles.iconButton} disabled={step === steps.length - 1 || mode === 'assemble' && !confirmed} onClick={() => selectStep(step + 1, model, topic, mode === 'watch')} aria-label={mode === 'watch' ? '다음 장면' : '다음 단계로 이동'}><FiArrowRight aria-hidden="true" /></button>
          <label className={styles.speed}><span className={styles.srOnly}>속도</span><select value={speed} aria-label="조립 재생 속도" onChange={event => { const value = Number(event.target.value); playback.current.speed = value; setSpeed(value); }}><option value={.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label>
          <button type="button" className={styles.iconButton} aria-label="음성 안내" aria-pressed={narration} onClick={toggleNarration} title="음성 안내">{narration ? <FiVolume2 aria-hidden="true" /> : <FiVolumeX aria-hidden="true" />}</button>
        </div>
        {mode === 'assemble' && <div className={styles.check}><label><input type="checkbox" checked={confirmed} disabled={!done} onChange={event => confirm(event.target.checked)} /><span>{topic === 'tylko-clip' ? referenceOnly ? '이 단계의 원본 자료를 확인했어요' : '이 단계의 추정 동작을 확인했어요' : current.check}</span></label><button type="button" disabled={!confirmed || finished} onClick={() => step < steps.length - 1 ? selectStep(step + 1) : firstMissing !== -1 ? selectStep(firstMissing) : setFinished(true)}>{finished ? '확인 완료' : step === steps.length - 1 ? firstMissing !== -1 ? '앞 단계 확인' : '확인 완료' : <>다음 단계 <FiArrowRight aria-hidden="true" /></>}</button></div>}
        <details className={styles.example}><summary>자료·모델 정보</summary><p>{topic === 'legs' ? '핀·나사 3개는 판재에 남고 장착판·몸통은 함께 분리됩니다. 원본 GLB에 핀·나사·키홀은 없으며 내부 구조·이동거리·타공치수는 미측정입니다. 원본 모델은 외형 확인용입니다.' : topic === 'tylko-clip' ? '원본 사진·공식 도해를 기본으로 보여줍니다. 추정 3D의 피스·클립 내부는 실물 재현이 아닙니다.' : topic === 'back-panel' ? '하단 고정핀·상단 스프링핀을 설명하는 예시입니다. 출고 규격·제품별 위치는 별도로 확인해야 합니다.' : '예제 접합 모델입니다. 내부 언더컷·탄성은 미확정입니다. 공식 R의 15mm는 해제 표기이며 조립 이동은 추정값입니다.'} <a href={source} target="_blank" rel="noreferrer">제조사 조립 자료 <FiArrowRight aria-hidden="true" /></a>{topic === 'legs' && <a href={legManualSource} target="_blank" rel="noreferrer">공식 분리 설명서 · 24쪽 <FiArrowRight aria-hidden="true" /></a>}</p></details>
        {narrationMessage && <p role="status" className={styles.message}>{narrationMessage}</p>}
      </footer>
    </section>
  </main>;
}

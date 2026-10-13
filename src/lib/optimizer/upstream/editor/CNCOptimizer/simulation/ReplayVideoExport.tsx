import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Download, Film, X } from 'lucide-react';
import { ReplayScene } from './MachiningReplay';
import { cursorAt, ReplayClock, type MachiningProgram } from './program';
import { RemovalReplay } from './removal';
import { useCncSfxStore } from './machiningSfx';
import { downloadReplayVideo, frameProcessTime, ReplayVideoEncoder, sheetVideoFrames, supportedVideoFormat, VIDEO_FPS, videoExtension } from './replayVideoEncoder';
import { loadVideoSoundBuffers, ReplayVideoAudio, type VideoSoundBuffers } from './replayVideoAudio';
import styles from './ReplayVideoExport.module.css';

type Job = { programs: MachiningProgram[]; encoder: ReplayVideoEncoder; sounds?: VideoSoundBuffers; height: 720 | 1080; speed: number; frames: number[] };
const cinematic = { kind: 'cinematic' as const, serial: 0 };
const ignoreManual = () => {};

/** rAF 재생 없이, 준비된 공정 프레임을 렌더→인코딩→다음 프레임 순으로 처리한다. */
export function VideoFrameWriter({ job, index, frame, clock, mixer, next, onError }: {
  job: Job; index: number; frame: number; clock: ReplayClock; mixer?: ReplayVideoAudio; next: () => void; onError: (error: Error) => void;
}) {
  const { gl, advance } = useThree();
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onError(new Error('3D 그래픽 연결이 끊겼습니다. 720p로 다시 생성해 주세요.')); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onError]);
  useLayoutEffect(() => {
    let alive = true;
    // 타이머는 사용자 입력·취소를 처리할 기회만 준다. 영상 시간만큼 기다리지 않는다.
    const timer = setTimeout(() => {
      try {
        advance((job.frames.slice(0, index).reduce((sum, count) => sum + count, 0) + frame) / VIDEO_FPS, false);
        const program = job.programs[index], cursor = cursorAt(program, clock.elapsedMs);
        const pcm = mixer?.frame(program, clock.elapsedMs);
        void job.encoder.frame(gl.domElement, { sheet: index + 1, sheets: job.programs.length, step: program.steps[cursor.index]?.label ?? '재생 완료', incomplete: !!(program.machiningAudit?.omitted.length || program.layoutAudit?.uncutEdges.length) }, pcm)
          .then(() => { if (alive) next(); }).catch(reason => { if (alive) onError(reason instanceof Error ? reason : new Error(String(reason))); });
      } catch (reason) { if (alive) onError(reason instanceof Error ? reason : new Error(String(reason))); }
    }, 0);
    return () => { alive = false; clearTimeout(timer); };
  }, [job, index, frame, clock, mixer, gl, advance, next, onError]);
  return null;
}

function VideoScene({ job, index, onProgress, onComplete, onError }: { job: Job; index: number; onProgress: (frame: number) => void; onComplete: () => void; onError: (error: Error) => void }) {
  const program = job.programs[index];
  const total = program.steps.reduce((sum, step) => sum + step.durationMs, 0);
  const clock = useMemo(() => new ReplayClock(total), [total]);
  const [replay, setReplay] = useState<RemovalReplay | null>(null), [frame, setFrame] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const onCameraReady = useCallback(() => setCameraReady(true), []);
  const mixer = useMemo(() => job.sounds ? new ReplayVideoAudio(job.sounds, job.speed) : undefined, [job.sounds, job.speed]);
  useEffect(() => { const resource = new RemovalReplay(program); setReplay(resource); return () => resource.dispose(); }, [program]);
  const time = frameProcessTime(frame, total, job.speed);
  clock.seek(time); clock.playing = time < total;
  const next = useCallback(() => {
    onProgress(frame + 1);
    if (frame + 1 >= job.frames[index]) onComplete(); else setFrame(frame + 1);
  }, [frame, index, job.frames, onProgress, onComplete]);
  if (!replay || replay.disposed) return null;
  return <>
    <ReplayScene onCameraReady={onCameraReady} program={program} clock={clock} seekTime={time} fixedFrame replay={replay} view={cinematic} machineVisible cutaway cameraSuspended={false} onManual={ignoreManual} />
    {cameraReady && <VideoFrameWriter job={job} index={index} frame={frame} clock={clock} mixer={mixer} next={next} onError={onError} />}
  </>;
}

class VideoBoundary extends React.Component<{ onError: (error: Error) => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onError(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function ReplayVideoExport({ makePrograms, onClose }: { makePrograms: () => MachiningProgram[]; onClose: () => void }) {
  const muted = useCncSfxStore(state => state.muted);
  const [height, setHeight] = useState<720 | 1080>(1080), [sound, setSound] = useState(!muted);
  // 빠르게 훑어보는 화면 배속을 저장 파일에 넘기지 않는다. 저장은 매번 1배속으로 시작한다.
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'rendering' | 'finishing' | 'done' | 'error'>('idle');
  const [error, setError] = useState(''), [index, setIndex] = useState(0), [framesDone, setFramesDone] = useState(0);
  const [job, setJob] = useState<Job | null>(null), [formatName, setFormatName] = useState('MP4 우선');
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const active = useRef<Job | null>(null), generation = useRef(0), abort = useRef<AbortController | null>(null);
  const lastFrame = useRef(0), dialog = useRef<HTMLDivElement>(null), preview = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(0);
  const working = status === 'preparing' || status === 'rendering' || status === 'finishing';
  const invalidateRun = useCallback(() => { generation.current++; }, []);
  const release = useCallback(() => { abort.current?.abort(); active.current?.encoder.cancel(); active.current = null; }, []);
  const close = useCallback(() => { invalidateRun(); release(); onClose(); }, [invalidateRun, release, onClose]);
  const fail = useCallback((reason: Error) => { invalidateRun(); release(); setJob(null); setError(reason.message); setStatus('error'); }, [invalidateRun, release]);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopImmediatePropagation(); event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const items = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]') ?? [])];
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => { invalidateRun(); release(); window.removeEventListener('keydown', onKey, true); before?.focus(); };
  }, [close, release, invalidateRun]);
  useEffect(() => {
    const node = preview.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setPreviewWidth(node.clientWidth));
    observer.observe(node); setPreviewWidth(node.clientWidth); return () => observer.disconnect();
  }, [job]);
  useEffect(() => {
    if (status !== 'rendering') return;
    const timer = setInterval(() => {
      if (document.hidden) { lastFrame.current = performance.now(); return; }
      if (performance.now() - lastFrame.current > 90_000) fail(new Error('영상 생성이 지연되어 중단했습니다. 720p로 다시 시도해 주세요.'));
    }, 1000);
    return () => clearInterval(timer);
  }, [status, fail]);
  const start = async () => {
    const request = ++generation.current;
    release(); abort.current = new AbortController();
    setResult(null); setError(''); setStatus('preparing'); setIndex(0); setFramesDone(0);
    let encoder: ReplayVideoEncoder | undefined;
    try {
      const programs = makePrograms();
      const format = await supportedVideoFormat(height, sound);
      if (!format) throw new Error('이 환경은 영상 파일 생성을 지원하지 않습니다. 최신 Chrome 또는 Edge에서 다시 시도해 주세요.');
      const sounds = sound ? await loadVideoSoundBuffers(abort.current.signal) : undefined;
      if (generation.current !== request) return;
      encoder = new ReplayVideoEncoder({ height, sound, format });
      const frames = programs.map(p => sheetVideoFrames(p.steps.reduce((sum, step) => sum + step.durationMs, 0), videoSpeed));
      const next = { programs, encoder, sounds, height, speed: videoSpeed, frames };
      active.current = next;
      await encoder.start();
      if (generation.current !== request) { encoder.cancel(); return; }
      lastFrame.current = performance.now(); setFormatName(videoExtension(format.mime).toUpperCase()); setJob(next); setStatus('rendering');
    } catch (reason) { encoder?.cancel(); if (generation.current === request) fail(reason instanceof Error ? reason : new Error(String(reason))); }
  };
  const progress = useCallback((frames: number) => { lastFrame.current = performance.now(); if (frames % 5 === 0) setFramesDone(frames); }, []);
  const complete = useCallback(() => {
    const current = active.current;
    if (!current) return;
    if (index + 1 < current.programs.length) { lastFrame.current = performance.now(); setFramesDone(0); setIndex(index + 1); return; }
    const request = generation.current;
    setStatus('finishing'); setJob(null);
    void current.encoder.finish().then(blob => {
      if (generation.current !== request) return;
      active.current = null;
      const name = `mmmcraft-가공시뮬레이션-${new Date().toISOString().replace(/[:.]/g, '-')}.${videoExtension(blob.type)}`;
      setResult({ blob, name }); setStatus('done'); downloadReplayVideo(blob, name);
    }).catch(reason => { if (generation.current === request) fail(reason instanceof Error ? reason : new Error(String(reason))); });
  }, [index, fail]);
  const total = job?.frames.reduce((sum, count) => sum + count, 0) ?? 0;
  const done = (job?.frames.slice(0, index).reduce((sum, count) => sum + count, 0) ?? 0) + framesDone;
  const percentage = total ? Math.min(99, Math.floor(done / total * 100)) : status === 'done' ? 100 : 0;
  return <div className={styles.backdrop}>
    <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="시뮬레이션 영상 저장" tabIndex={-1} ref={dialog}>
      <header><h2><Film size={20} /> 시뮬레이션 영상 저장</h2><button aria-label="영상 저장 창 닫기" onClick={close}><X size={20} /></button></header>
      <p>화면에서 재생하지 않아도 전체 원장의 가공 과정을 한 영상 파일로 만듭니다.</p>
      <div className={styles.settings}>
        <label>영상 크기 <select value={height} disabled={working} onChange={event => setHeight(Number(event.target.value) as 720 | 1080)}><option value={1080}>1080p · Full HD</option><option value={720}>720p · 가벼운 영상</option></select></label>
        <label><input type="checkbox" checked={sound} disabled={working} onChange={event => setSound(event.target.checked)} /> 가공 효과음 포함</label>
        <span>{formatName} · {videoSpeed}배속 · 30fps</span>
      </div>
      <fieldset className={styles.speed} disabled={working}>
        <legend>영상 재생 속도</legend>
        {[.5, 1, 2, 4].map(speed => <button key={speed} type="button" aria-pressed={videoSpeed === speed} onClick={() => {
          if (speed === videoSpeed) return;
          setVideoSpeed(speed);
          if (result) { setResult(null); setStatus('idle'); }
        }}>{speed === 1 ? '1배 (기본)' : `${speed}배`}</button>)}
      </fieldset>
      <p className={styles.hint}>저장한 영상의 재생 속도입니다. 화면 미리보기의 배속과 별도로 적용됩니다.</p>
      <p className={styles.hint}>공정에 따라 자동 촬영합니다. 생성 시간은 가공 복잡도와 PC 성능에 따라 달라집니다. 이 창은 완료될 때까지 열어 두세요.</p>
      {job && <div ref={preview} className={styles.preview} aria-label="생성 중인 영상 미리보기">
        <div style={{ width: job.height / 9 * 16, height: job.height, transform: `scale(${previewWidth / (job.height / 9 * 16)})` }}>
          <VideoBoundary onError={fail}><Canvas dpr={1} shadows frameloop="never" camera={{ position: [4000, -4000, 4000], up: [0, 0, 1], near: .5, far: 100000, fov: 40 }}><Suspense fallback={null}><VideoScene key={index} job={job} index={index} onProgress={progress} onComplete={complete} onError={fail} /></Suspense></Canvas></VideoBoundary>
        </div>
      </div>}
      {working && <div className={styles.progress} role="status"><progress aria-label="영상 생성 진행률" value={percentage} max={100} />
        <span>{status === 'preparing' ? '원장과 인코더 준비 중…' : status === 'finishing' ? '영상 파일 마무리 중…' : `원장 ${index + 1}/${job?.programs.length ?? 0} · ${percentage}%`}</span></div>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {status === 'done' && <p role="status">영상 생성이 완료되었습니다. 다운로드가 시작되지 않으면 아래 버튼을 눌러 주세요.</p>}
      <footer><button onClick={close}>{working ? '생성 취소' : '닫기'}</button>
        {result ? <button onClick={() => downloadReplayVideo(result.blob, result.name)}><Download size={17} /> 영상 다시 다운로드</button>
          : <button disabled={working} onClick={() => void start()}><Download size={17} /> {status === 'error' ? '다시 생성' : '전체 영상 다운로드'}</button>}
      </footer>
    </div>
  </div>;
}

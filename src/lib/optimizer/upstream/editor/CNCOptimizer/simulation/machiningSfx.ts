/**
 * 가공 재생 효과음(마마 지시 2026-09-28 「재단 가공 시뮬레이션에 재단 효과음」 → 가공 재생).
 * 소리는 실제 녹음(BigSoundBank CC0, public/sfx/cnc/SOURCES.txt)에서 잘라 이음매 없는 루프로 만든 것이다.
 * (합성 스핀들·보링음을 잠시 썼다가 「트로트 같다」는 마마 지적으로 실제 녹음에 되돌렸다, 2026-09-28)
 * - 패널쏘(station saw): 톱 공회전이 깔리고, 절단(saw) 단계에서 절삭음이 겹친다.
 * - 라우터(router): 스핀들이 돌고, 홈·목찬넬(mill)에서 더 크게·조금 낮게, 보링(drill)은 날이 판에 닿는 순간부터 깊이 끝까지 파는 소리.
 * - 엣지밴더: 이송(band) 동안 모터 소리를 낮게.
 * 재생 시계를 따라가므로 일시정지·되감기·배속에 맞춰 멎고 이어진다. 오디오를 못 쓰는 곳에서는 조용히 넘어간다.
 * 켜기/끄기는 재생 화면의 스피커 단추(기억한다).
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cursorAt, type MachiningProgram, type ReplayClock } from './program';

interface CncSfxState { muted: boolean; setMuted: (muted: boolean) => void }
export const useCncSfxStore = create<CncSfxState>()(persist(set => ({
  muted: false,
  setMuted: muted => set({ muted }),
}), { name: 'mmm-cnc-sfx' }));

type Layer = 'sawIdle' | 'sawCut' | 'spindle' | 'bander';
const LOOPS: Record<Layer, { src: string; rate: number }> = {
  sawIdle: { src: '/sfx/cnc/saw_idle.wav', rate: 1 },
  sawCut: { src: '/sfx/cnc/saw_cut.wav', rate: 1 },
  spindle: { src: '/sfx/cnc/spindle.wav', rate: 1.12 },
  // 밴더 이송 모터 — 톱 공회전 녹음을 낮춰 쓴다(별도 녹음 없음)
  bander: { src: '/sfx/cnc/saw_idle.wav', rate: .72 },
};
const DRILL_HIT = '/sfx/cnc/drill_hit.wav';
/**
 * 보링 녹음(s0791 손 드릴)의 앞 0.45 s 는 방아쇠를 당겨 모터가 도는 「위잉」(음이 2.4→3.8 kHz 로 오른다)이라 수공구처럼 들린다.
 * 라우터 스핀들은 이미 돌고 있으므로 그 뒤(날이 나무를 파는 구간)부터 튼다(마마 지적 2026-09-28 「구멍 뚫을 때 타이밍」).
 */
const DRILL_BITE_S = .45;
const MASTER = .5;

/** 지금 무엇이 소리를 내는지 — 단계·공정·공구만 본다(판재 위치 계산은 하지 않는다) */
export function machiningSoundAt(program: MachiningProgram, elapsedMs: number) {
  const cursor = cursorAt(program, elapsedMs), index = Math.min(cursor.index, program.steps.length - 1);
  const step = program.steps[index];
  let t = index;
  while (t >= 0 && !('toolId' in program.steps[t])) t--;
  const toolStep = program.steps[t];
  const tool = step && step.station !== 'edgebander' && toolStep && 'toolId' in toolStep ? program.tools.find(x => x.id === toolStep.toolId) : undefined;
  const station = step?.station ?? (tool?.kind === 'saw' ? 'saw' : 'router');
  const done = elapsedMs >= program.steps.reduce((s, x) => s + x.durationMs, 0);
  const gains: Record<Layer, number> = { sawIdle: 0, sawCut: 0, spindle: 0, bander: 0 };
  let rate = 1;
  if (!done && step) {
    if (station === 'edgebander') gains.bander = step.kind === 'band' ? .55 : .3;
    else if (tool?.kind === 'saw') { gains.sawIdle = .45; if (step.kind === 'saw') gains.sawCut = 1; }
    else if (tool?.kind === 'drill') {
      // 판을 파고드는 동안(보링·홈·목찬넬)은 부하가 걸려 소리가 커진다. 음 높이는 홈에서만 조금(3 %) 낮춘다 —
      // 보링마다 높이를 오르내리면 가락처럼 들렸다(마마 지적 2026-09-28 「무슨 트로트야」).
      const cutting = step.kind === 'mill' || step.kind === 'drill';
      gains.spindle = step.kind === 'mill' ? .8 : cutting ? .65 : .35; rate = step.kind === 'mill' ? .97 : 1;
    }
  }
  // 보링 단계는 날이 판에 닿는 순간(진행 0)부터 깊이 끝(진행 1)까지다(replayPose). 남은 시간만큼만 파는 소리를 낸다.
  const remainingMs = !done && step ? (1 - cursor.progress) * step.durationMs : 0;
  return { index, kind: step?.kind, station, gains, spindleRate: rate, drillStart: !done && step?.kind === 'drill', remainingMs };
}

let ctx: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
function audio(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = typeof window === 'undefined' ? undefined
    : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  try { ctx = new Ctor(); } catch { ctx = null; }
  return ctx;
}
function load(ac: AudioContext, src: string) {
  let p = buffers.get(src);
  if (!p) {
    p = fetch(src).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status))))
      .then(data => ac.decodeAudioData(data)).catch(() => null);
    buffers.set(src, p);
  }
  return p;
}

/** 영상 파일 생성기도 같은 효과음 원본·음량 규칙을 사용한다. */
export const machiningSoundSources = { loops: LOOPS, drillHit: DRILL_HIT, drillBiteSeconds: DRILL_BITE_S, master: MASTER };

/** 재생 중에만 소리를 낸다. 멈추면 0.1초 안에 잦아들고 소리 장치를 닫는다. */
export function useMachiningSfx(program: MachiningProgram, clock: ReplayClock, playing: boolean) {
  const muted = useCncSfxStore(s => s.muted);
  useEffect(() => {
    if (!playing || muted) return;
    const ac = audio();
    if (!ac) return;
    if (ac.state === 'suspended') void ac.resume().catch(() => undefined);
    let alive = true, frame = 0, lastIndex = -1, lastHit = -Infinity;
    const master = ac.createGain(); master.gain.value = MASTER; master.connect(ac.destination);
    const layers = new Map<Layer, { source: AudioBufferSourceNode; gain: GainNode }>();
    const hit = load(ac, DRILL_HIT);
    (Object.keys(LOOPS) as Layer[]).forEach(name => void load(ac, LOOPS[name].src).then(buffer => {
      if (!alive || !buffer) return;
      const source = ac.createBufferSource(), gain = ac.createGain();
      source.buffer = buffer; source.loop = true; source.playbackRate.value = LOOPS[name].rate;
      gain.gain.value = 0; source.connect(gain); gain.connect(master);
      // 루프마다 시작 위치를 달리해 같은 녹음을 두 겹 쓸 때 겹쳐 들리지 않게
      source.start(0, Math.random() * buffer.duration);
      layers.set(name, { source, gain });
    }));
    const tick = () => {
      if (!alive) return;
      const s = machiningSoundAt(program, clock.elapsedMs), now = ac.currentTime;
      for (const [name, layer] of layers) layer.gain.gain.setTargetAtTime(s.gains[name], now, .05);
      const spindle = layers.get('spindle');
      if (spindle) spindle.source.playbackRate.setTargetAtTime(LOOPS.spindle.rate * s.spindleRate, now, .08);
      // 보링은 날이 판에 닿는 순간(단계 시작) 파는 소리를 틀고, 깊이 끝(공구 후퇴 시작)에 멎는다 — 배속만큼 짧아진다.
      // 배속이 빨라 90 ms 안에 다시 오면 버린다. 높이는 매번 같다(흔들면 음계처럼 들렸다).
      if (s.index !== lastIndex) {
        lastIndex = s.index;
        const t = performance.now();
        if (s.drillStart && t - lastHit > 90) {
          lastHit = t;
          const seconds = Math.max(.05, s.remainingMs / 1000 / Math.max(clock.speed, .01));
          void hit.then(buffer => {
            if (!alive || !buffer) return;
            const source = ac.createBufferSource(), gain = ac.createGain(), at = ac.currentTime;
            source.buffer = buffer; gain.gain.setValueAtTime(.9, at);
            gain.gain.setTargetAtTime(0, at + Math.max(0, seconds - .04), .015);
            source.connect(gain); gain.connect(master);
            source.start(at, DRILL_BITE_S); source.stop(at + seconds + .1);
          });
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      alive = false; cancelAnimationFrame(frame);
      const now = ac.currentTime;
      master.gain.setTargetAtTime(0, now, .03);
      setTimeout(() => { layers.forEach(l => { try { l.source.stop(); } catch { /* 이미 멈춤 */ } }); master.disconnect(); }, 150);
    };
  }, [program, clock, playing, muted]);
}

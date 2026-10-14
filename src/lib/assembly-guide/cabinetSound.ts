import { cabinetPhaseDuration, initialCabinetState, isCabinetRear, type CabinetPhase, type CabinetPlan, type CabinetState } from './cabinet';
import { doorAssemblyPhases, isCabinetDoor } from './cabinetDoor';

export type CabinetSoundKind = 'wood' | 'connector' | 'spring' | 'hinge';
export interface CabinetSoundEvent { id: string; kind: CabinetSoundKind; at: number; level: number }
/** Edited contact samples; credits and modifications are in the adjacent public SOURCES.md. */
export const cabinetSoundAssets: Record<CabinetSoundKind, string> = {
  wood: '/assembly-guide/audio/wood-seat.wav',
  connector: '/assembly-guide/audio/connector-seat.wav',
  spring: '/assembly-guide/audio/spring-lock.wav',
  hinge: '/assembly-guide/audio/hinge-lock.wav',
};
function partPhases(plan: CabinetPlan, step: number): CabinetPhase[] {
  const part = plan.parts[step];
  return ['choose', ...(part.hardware.length ? ['hardware' as const] : []), 'placing', ...(isCabinetRear(part) ? ['spring-press', 'spring-seat', 'spring-lock'] as const : []), ...(isCabinetDoor(part) ? doorAssemblyPhases : []), 'check'];
}
export function cabinetSoundEvents(plan: CabinetPlan, automatic = true): CabinetSoundEvent[] {
  const events: CabinetSoundEvent[] = [];
  let elapsed = 0;
  for (let step = 0; step < plan.parts.length; step++) for (const phase of partPhases(plan, step)) {
    const part = plan.parts[step], duration = cabinetPhaseDuration({ ...initialCabinetState(), step, phase, automatic }, plan);
    const add = (kind: CabinetSoundKind, p: number, level = 1) => events.push({ id: `${part.id}-${phase}-${p}`, kind, at: elapsed + duration * p, level });
    if (phase === 'hardware') { add('connector', .55, .5); if (part.hardware.some(m => m.role === 'end')) add('connector', .94, .55); }
    // The seating sample already includes its contact body; do not stack a second impact.
    if (phase === 'placing' && !isCabinetDoor(part)) add(isCabinetRear(part) || part.feet ? 'wood' : 'connector', .98, .85);
    if (phase === 'spring-lock') add('spring', .7, .8);
    if (phase === 'hinge-top' || phase === 'hinge-bottom') add('hinge', .72, .9);
    if (phase === 'hinge-test') { add('wood', .4, .55); add('wood', .99, .55); }
    elapsed += duration;
  }
  return events;
}
function elapsedAt(plan: CabinetPlan, state: CabinetState) {
  let elapsed = 0;
  for (let step = 0; step < plan.parts.length; step++) for (const phase of partPhases(plan, step)) {
    const duration = cabinetPhaseDuration({ ...state, step, phase }, plan);
    if (step === state.step && state.phase === 'ready' && phase === 'placing') return elapsed;
    if (step === state.step && phase === state.phase) return elapsed + state.progress * duration;
    elapsed += duration;
  }
  return elapsed;
}
/** Only call from a playing clock tick. Seeking/resetting never emits a sound. */
export function cabinetSoundsBetween(plan: CabinetPlan, before: CabinetState, after: CabinetState) {
  if (!before.playing || before.automatic !== after.automatic) return [];
  const from = elapsedAt(plan, before), to = elapsedAt(plan, after);
  if (to < from) return [];
  return cabinetSoundEvents(plan, before.automatic).filter(event => event.at > from + 1e-8 && event.at <= to + 1e-8);
}

export interface CabinetAudioReport { state: string; count: number; last: string }
export function createCabinetAudio(report: (value: CabinetAudioReport) => void) {
  let context: AudioContext | undefined, muted = false, count = 0, last = '', closed = false, ready = false, unavailable = false;
  let prepared: Promise<void> | undefined;
  const buffers = new Map<CabinetSoundKind, AudioBuffer>(), nodes = new Map<AudioBufferSourceNode, GainNode>();
  const encoded = typeof window === 'undefined' ? Promise.resolve(null) : Promise.all(Object.entries(cabinetSoundAssets).map(async ([kind, url]) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Contact sample unavailable');
    return [kind as CabinetSoundKind, await response.arrayBuffer()] as const;
  })).catch(() => null);
  const status = () => {
    if (!closed) report({ state: muted ? 'muted' : unavailable ? 'unavailable' : context && !ready ? 'loading' : context?.state ?? 'idle', count, last });
  };
  const stop = () => { for (const [node, gain] of nodes) { try { node.stop(); } catch { /* Already ended. */ } node.disconnect(); gain.disconnect(); } nodes.clear(); };
  return {
    async unlock() {
      if (closed || muted || typeof window === 'undefined') return;
      try {
        context ??= new AudioContext({ latencyHint: 'interactive' });
        await context.resume(); status();
        const current = context;
        prepared ??= (async () => {
          const assets = await encoded;
          if (!assets) { unavailable = true; return; }
          const decoded = await Promise.all(assets.map(async ([kind, bytes]) => [kind, await current.decodeAudioData(bytes)] as const));
          if (closed) return;
          decoded.forEach(([kind, buffer]) => buffers.set(kind, buffer)); ready = true;
        })();
        await prepared; status();
      } catch { unavailable = true; status(); }
    },
    setMuted(value: boolean) { muted = value; if (muted) stop(); status(); },
    stop,
    play(events: CabinetSoundEvent[]) {
      if (!events.length || muted || closed || !ready || context?.state !== 'running') return;
      // Do not burst stale impacts after a background tab or a very long frame.
      for (const [index, event] of events.slice(-3).entries()) {
        const buffer = buffers.get(event.kind);
        if (!buffer) continue;
        const node = context.createBufferSource(), gain = context.createGain();
        gain.gain.value = event.level;
        node.buffer = buffer; node.connect(gain); gain.connect(context.destination); nodes.set(node, gain);
        node.onended = () => { node.disconnect(); gain.disconnect(); nodes.delete(node); };
        node.start(context.currentTime + index * .022); count++; last = event.kind;
      }
      status();
    },
    dispose() { closed = true; stop(); buffers.clear(); if (context) void context.close().catch(() => {}); },
  };
}

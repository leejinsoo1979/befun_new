import { cabinetPhaseDuration, initialCabinetState, isCabinetRear, type CabinetPhase, type CabinetPlan, type CabinetState } from './cabinet';
import { doorAssemblyPhases, isCabinetDoor } from './cabinetDoor';

export type CabinetSoundKind = 'wood' | 'connector' | 'spring' | 'hinge';
export interface CabinetSoundEvent { id: string; kind: CabinetSoundKind; at: number }
/** Short dry contact foley; original deterministic synthesis, no downloaded recording. */
export function cabinetSoundSamples(kind: CabinetSoundKind, sampleRate: number) {
  const profile = { wood: [.24, 140, .11, .16], connector: [.13, 790, .028, .21], spring: [.12, 1450, .023, .15], hinge: [.17, 2300, .032, .2] }[kind];
  const [duration, tone, decay, gain] = profile;
  const data = new Float32Array(Math.ceil(duration * sampleRate));
  let seed = 8531, low = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low += (noise - low) * (kind === 'wood' ? .07 : .6);
    const transient = (noise - low * .6) * Math.exp(-t / (kind === 'wood' ? .013 : .008));
    const body = (Math.sin(t * tone * Math.PI * 2) + .37 * Math.sin(t * tone * 2.73 * Math.PI * 2)) * Math.exp(-t / decay);
    const attack = Math.min(1, t / .0007), tail = Math.min(1, (duration - t) / .006);
    data[i] = gain * attack * tail * (.6 * body + .7 * transient);
  }
  return data;
}
function partPhases(plan: CabinetPlan, step: number): CabinetPhase[] {
  const part = plan.parts[step];
  return ['choose', ...(part.hardware.length ? ['hardware' as const] : []), 'placing', ...(isCabinetRear(part) ? ['spring-press', 'spring-seat', 'spring-lock'] as const : []), ...(isCabinetDoor(part) ? doorAssemblyPhases : []), 'check'];
}
export function cabinetSoundEvents(plan: CabinetPlan, automatic = true): CabinetSoundEvent[] {
  const events: CabinetSoundEvent[] = [];
  let elapsed = 0;
  for (let step = 0; step < plan.parts.length; step++) for (const phase of partPhases(plan, step)) {
    const part = plan.parts[step], duration = cabinetPhaseDuration({ ...initialCabinetState(), step, phase, automatic }, plan);
    const add = (kind: CabinetSoundKind, p: number) => events.push({ id: `${part.id}-${phase}-${p}`, kind, at: elapsed + duration * p });
    if (phase === 'hardware') { add('connector', .55); if (part.hardware.some(m => m.role === 'end')) add('connector', .94); }
    if (phase === 'placing' && !isCabinetDoor(part)) { add('wood', .98); if (!isCabinetRear(part) && !part.feet) add('connector', .995); }
    if (phase === 'spring-lock') add('spring', .7);
    if (phase === 'hinge-top' || phase === 'hinge-bottom') add('hinge', .72);
    if (phase === 'hinge-test') { add('wood', .4); add('wood', .99); }
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
  let context: AudioContext | undefined, muted = false, count = 0, last = '', closed = false;
  const buffers = new Map<CabinetSoundKind, AudioBuffer>(), nodes = new Set<AudioBufferSourceNode>();
  const status = () => report({ state: closed ? 'closed' : muted ? 'muted' : context?.state ?? 'idle', count, last });
  const stop = () => { for (const node of nodes) { try { node.stop(); } catch { /* Already ended. */ } node.disconnect(); } nodes.clear(); };
  return {
    async unlock() {
      if (closed || muted || typeof window === 'undefined') return;
      try {
        context ??= new AudioContext({ latencyHint: 'interactive' });
        await context.resume(); status();
      } catch { report({ state: 'unavailable', count, last }); }
    },
    setMuted(value: boolean) { muted = value; if (muted) stop(); status(); },
    stop,
    play(events: CabinetSoundEvent[]) {
      if (muted || closed || context?.state !== 'running') return;
      // Do not burst stale impacts after a background tab or a very long frame.
      for (const [index, event] of events.slice(-3).entries()) {
        let buffer = buffers.get(event.kind);
        if (!buffer) {
          const samples = cabinetSoundSamples(event.kind, context.sampleRate);
          buffer = context.createBuffer(1, samples.length, context.sampleRate); buffer.copyToChannel(samples, 0); buffers.set(event.kind, buffer);
        }
        const node = context.createBufferSource(); node.buffer = buffer; node.connect(context.destination); nodes.add(node);
        node.onended = () => { node.disconnect(); nodes.delete(node); };
        node.start(context.currentTime + index * .022); count++; last = event.kind;
      }
      status();
    },
    dispose() { closed = true; stop(); buffers.clear(); if (context) void context.close().catch(() => {}); },
  };
}

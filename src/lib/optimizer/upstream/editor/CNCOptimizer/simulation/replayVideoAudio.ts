import { machiningSoundAt, machiningSoundSources } from './machiningSfx';
import type { MachiningProgram } from './program';
import { VIDEO_FPS } from './replayVideoEncoder';

type Layer = keyof typeof machiningSoundSources.loops;
interface SoundBuffer { samples: Float32Array; rate: number }
export type VideoSoundBuffers = Record<Layer | 'hit', SoundBuffer>;

/** 스피커 재생·마이크 녹음 없이 기존 효과음 파일을 메모리에 해독한다. */
export async function loadVideoSoundBuffers(signal: AbortSignal): Promise<VideoSoundBuffers> {
  const context = new OfflineAudioContext(1, 1, 48000);
  const cache = new Map<string, Promise<SoundBuffer>>();
  const load = (src: string) => {
    if (!cache.has(src)) cache.set(src, fetch(src, { signal }).then(async response => {
      if (!response.ok) throw new Error('가공 효과음을 준비하지 못했습니다. 효과음 포함을 끄거나 다시 시도해 주세요.');
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      const samples = new Float32Array(buffer.length);
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < samples.length; i++) samples[i] += data[i] / buffer.numberOfChannels;
      }
      return { samples, rate: buffer.sampleRate };
    }));
    return cache.get(src)!;
  };
  const names = Object.keys(machiningSoundSources.loops) as Layer[];
  const entries = await Promise.all(names.map(async name => [name, await load(machiningSoundSources.loops[name].src)] as const));
  return { ...Object.fromEntries(entries), hit: await load(machiningSoundSources.drillHit) } as VideoSoundBuffers;
}

/** 공정 시각으로 소리 종류를 정하고 영상 시각으로 파형을 합성한다. 처리 속도와 음높이는 독립이다. */
export class ReplayVideoAudio {
  private positions: Record<Layer, number> = { sawIdle: 0, sawCut: 0, spindle: 0, bander: 0 };
  private gains: Record<Layer, number> = { sawIdle: 0, sawCut: 0, spindle: 0, bander: 0 };
  private hit = Infinity;
  private lastStep = -1;
  private lastHit = -Infinity;
  private hitRemaining = 0;
  private samples = 0;
  constructor(private buffers: VideoSoundBuffers, private speed = 1) {}
  frame(program: MachiningProgram, timeMs: number): Float32Array {
    const state = machiningSoundAt(program, timeMs), result = new Float32Array(48000 / VIDEO_FPS);
    if (state.index !== this.lastStep && state.drillStart && (this.samples - this.lastHit) / 48000 > .09) { this.hit = machiningSoundSources.drillBiteSeconds * this.buffers.hit.rate; this.lastHit = this.samples;
      this.hitRemaining = Math.max(1, Math.round(state.remainingMs / 1000 / this.speed * 48000)); }
    this.lastStep = state.index;
    const names = Object.keys(this.positions) as Layer[];
    const smoothing = 1 - Math.exp(-1 / (48000 * .05));
    const sampleAt = (buffer: SoundBuffer, position: number) => {
      const lo = Math.floor(position) % buffer.samples.length, blend = position - Math.floor(position);
      return buffer.samples[lo] * (1 - blend) + buffer.samples[(lo + 1) % buffer.samples.length] * blend;
    };
    for (let i = 0; i < result.length; i++) {
      let value = 0;
      for (const name of names) {
        const buffer = this.buffers[name];
        this.gains[name] += (state.gains[name] - this.gains[name]) * smoothing;
        value += sampleAt(buffer, this.positions[name]) * this.gains[name];
        this.positions[name] = (this.positions[name] + buffer.rate / 48000 * machiningSoundSources.loops[name].rate * (name === 'spindle' ? state.spindleRate : 1)) % buffer.samples.length;
      }
      if (this.hitRemaining > 0 && this.hit < this.buffers.hit.samples.length) {
        value += sampleAt(this.buffers.hit, this.hit) * .9 * Math.min(1, this.hitRemaining / (48000 * .04));
        this.hit += this.buffers.hit.rate / 48000; this.hitRemaining--;
      }
      result[i] = Math.max(-1, Math.min(1, value * machiningSoundSources.master));
    }
    this.samples += result.length;
    return result;
  }
}

import { AudioSample, AudioSampleSource, BufferTarget, CanvasSource, Mp4OutputFormat, Output, Quality, WebMOutputFormat, canEncodeAudio, canEncodeVideo, type AudioCodec, type VideoCodec } from 'mediabunny';

export const VIDEO_FPS = 30;
export const MAX_VIDEO_BYTES = 512 * 1024 * 1024;
export interface VideoFormat { mime: 'video/mp4' | 'video/webm'; video: VideoCodec; audio: AudioCodec }
export const videoFormats: VideoFormat[] = [{ mime: 'video/mp4', video: 'avc', audio: 'aac' }, { mime: 'video/webm', video: 'vp8', audio: 'opus' }];
export async function supportedVideoFormat(height: number, sound: boolean) {
  for (const format of videoFormats) {
    if (await canEncodeVideo(format.video, { width: height / 9 * 16, height, frameRate: VIDEO_FPS })
      && (!sound || await canEncodeAudio(format.audio, { numberOfChannels: 1, sampleRate: 48000 }))) return format;
  }
  return null;
}
export function videoExtension(type: string) { return type.split(';')[0] === 'video/mp4' ? 'mp4' : 'webm'; }
export function sheetVideoFrames(durationMs: number, speed: number) { return Math.ceil(durationMs / speed / 1000 * VIDEO_FPS) + 1 + VIDEO_FPS / 2; }
export function frameProcessTime(frame: number, durationMs: number, speed: number) { return Math.min(durationMs, frame * 1000 * speed / VIDEO_FPS); }
export interface VideoFrameLabel { sheet: number; sheets: number; step: string; incomplete: boolean }

/** 화면 재생·벽시계와 독립적으로 고정 타임스탬프를 가진 프레임을 인코딩한다. */
export class ReplayVideoEncoder {
  readonly canvas: HTMLCanvasElement;
  readonly mimeType: string;
  private context: CanvasRenderingContext2D;
  private output: Output<Mp4OutputFormat | WebMOutputFormat, BufferTarget>;
  private video: CanvasSource;
  private audio?: AudioSampleSource;
  private frames = 0;
  private bytes = 0;
  private canceled = false;
  private finalized = false;

  constructor({ height, sound, format }: { height: 720 | 1080; sound: boolean; format: VideoFormat }) {
    this.mimeType = format.mime;
    this.canvas = document.createElement('canvas');
    this.canvas.width = height / 9 * 16; this.canvas.height = height;
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('영상 화면을 준비할 수 없습니다.');
    this.context = context;
    this.output = new Output({ format: format.mime === 'video/mp4' ? new Mp4OutputFormat() : new WebMOutputFormat(), target: new BufferTarget() });
    const packet = (value: { data: Uint8Array }) => {
      this.bytes += value.data.byteLength;
      if (this.bytes > MAX_VIDEO_BYTES) throw new Error('영상이 512MB를 넘었습니다. 720p 또는 더 빠른 영상 속도로 다시 저장해 주세요.');
    };
    this.video = new CanvasSource(this.canvas, { codec: format.video, quality: new Quality({ bitrate: height === 1080 ? 8_000_000 : 5_000_000 }), latencyMode: 'quality', onEncodedPacket: packet });
    this.output.addVideoTrack(this.video, { frameRate: VIDEO_FPS });
    if (sound) { this.audio = new AudioSampleSource({ codec: format.audio, quality: new Quality({ bitrate: 128_000 }), onEncodedPacket: packet }); this.output.addAudioTrack(this.audio); }
    this.output.setMetadataTags({ title: 'mmmcraft 재단·가공 시뮬레이션', comment: '참조 공정 · 기계 NC 미대조' });
  }
  async start() { await this.output.start(); }

  /** gl.render 직후 같은 콜스택에서 복사해 빈 프레임을 막는다. 다음 프레임은 인코더가 준비된 후 생성한다. */
  async frame(source: HTMLCanvasElement, label: VideoFrameLabel, pcm?: Float32Array) {
    if (this.canceled || this.finalized) throw new Error('영상 생성이 종료되었습니다.');
    const { width, height } = this.canvas, ctx = this.context;
    ctx.drawImage(source, 0, 0, width, height);
    const font = height / 45, bar = height / 15;
    ctx.fillStyle = 'rgba(16,23,30,.78)'; ctx.fillRect(0, height - bar, width, bar);
    ctx.fillStyle = '#ffffff'; ctx.font = `500 ${font}px Pretendard, sans-serif`; ctx.textBaseline = 'middle';
    ctx.fillText(`mmmcraft  ·  원장 ${label.sheet}/${label.sheets}  ·  ${label.step}`, font, height - bar / 2, width * .65);
    ctx.textAlign = 'right'; ctx.fillStyle = label.incomplete ? '#ffd78b' : '#d8dfe6';
    ctx.fillText(label.incomplete ? '미재생 가공 있음 · 기계 NC 미대조' : '참조 공정 · 기계 NC 미대조', width - font, height - bar / 2, width * .32);
    ctx.textAlign = 'left';
    if (this.audio && (!pcm || pcm.length !== 48000 / VIDEO_FPS)) throw new Error('영상과 효과음의 프레임 길이가 일치하지 않습니다.');
    const timestamp = this.frames / VIDEO_FPS;
    const sample = this.audio && pcm ? new AudioSample({ data: pcm, format: 'f32-planar', sampleRate: 48000, numberOfChannels: 1, timestamp }) : null;
    try { await Promise.all([this.video.add(timestamp, 1 / VIDEO_FPS), sample ? this.audio!.add(sample) : undefined]); this.frames++; }
    finally { sample?.close(); }
  }
  async finish() {
    if (this.canceled || !this.frames) throw new Error('저장할 영상 프레임이 없습니다.');
    await this.output.finalize(); this.finalized = true;
    const buffer = this.output.target.buffer;
    if (!buffer?.byteLength) throw new Error('생성된 영상 파일이 비어 있습니다.');
    const blob = new Blob([buffer], { type: this.mimeType });
    this.canvas.width = 1; this.canvas.height = 1;
    return blob;
  }
  cancel() {
    if (this.canceled || this.finalized) return;
    this.canceled = true;
    void this.output.cancel().catch(() => undefined);
    this.canvas.width = 1; this.canvas.height = 1;
  }
}
export function downloadReplayVideo(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

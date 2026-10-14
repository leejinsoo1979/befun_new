import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
registerHooks({ resolve(s, c, next) {
  if (s.startsWith('@/')) return next(pathToFileURL(`${process.cwd()}/src/${s.slice(2)}${/\.[a-z]+$/i.test(s) ? '' : '.ts'}`).href, c);
  if (s.startsWith('.') && !/\.[a-z]+$/i.test(s)) return next(new URL(`${s}.ts`, c.parentURL).href, c);
  return next(s, c);
} });
const { createCabinetPlan, initialCabinetState, advanceCabinet } = await import('./cabinet.ts');
const { cabinetSoundAssets, cabinetSoundEvents, cabinetSoundsBetween, createCabinetAudio } = await import('./cabinetSound.ts');
function pcmWave(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF'); assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  let rate, channels, bits, pcm;
  for (let at = 12; at + 8 <= bytes.length;) {
    const kind = bytes.toString('ascii', at, at + 4), length = bytes.readUInt32LE(at + 4), start = at + 8;
    if (kind === 'fmt ') { assert.equal(bytes.readUInt16LE(start), 1); channels = bytes.readUInt16LE(start + 2); rate = bytes.readUInt32LE(start + 4); bits = bytes.readUInt16LE(start + 14); }
    if (kind === 'data') pcm = Array.from({ length: length / 2 }, (_, i) => bytes.readInt16LE(start + i * 2) / 32768);
    at = start + length + (length % 2);
  }
  return { rate, channels, bits, pcm };
}

test('published contact samples are short, distinct, audible PCM with no leading wait or clipped peaks', () => {
  const shapes = new Set();
  for (const url of Object.values(cabinetSoundAssets)) {
    const { pcm, rate, channels, bits } = pcmWave(readFileSync(`public${url}`));
    assert.equal(rate, 48000); assert.equal(channels, 1); assert.equal(bits, 16);
    assert.ok(pcm.length / rate > .025 && pcm.length / rate <= .25);
    assert.ok(pcm.every(Number.isFinite));
    const peak = Math.max(...pcm.map(Math.abs));
    const rms = Math.sqrt(pcm.reduce((sum, value) => sum + value * value, 0) / pcm.length);
    assert.ok(peak >= .19 && peak <= .3); assert.ok(rms > .012);
    assert.ok(pcm.findIndex(value => Math.abs(value) > .003) / rate < .012);
    assert.ok(Math.abs(pcm.at(-1)) < .001);
    shapes.add(pcm.slice(0, 100).join(','));
  }
  assert.equal(shapes.size, 4);
});
test('clock crossings emit the same contact events once at 60fps and one long interval; pauses/seeks emit none', () => {
  const plan = createCabinetPlan(), start = { ...initialCabinetState(), playing: true, automatic: true };
  let current = start, events = [];
  for (let i = 0; i < 60 * 65; i++) {
    const next = advanceCabinet(current, 1 / 60, plan); events.push(...cabinetSoundsBetween(plan, current, next)); current = next;
  }
  assert.deepEqual(events, cabinetSoundEvents(plan));
  assert.deepEqual(cabinetSoundsBetween(plan, start, advanceCabinet(start, 65, plan)), events);
  assert.equal(new Set(events.map(e => e.id)).size, events.length);
  assert.equal(events.filter(e => e.kind === 'hinge').length, 2);
  assert.equal(events.length, 21, 'one impact per body seating instead of stacked thud/click');
  assert.deepEqual(cabinetSoundsBetween(plan, { ...start, playing: false }, current), []);
  assert.deepEqual(cabinetSoundsBetween(plan, current, start), []);
});
test('audio is gesture-unlocked, routes real buffers to destination, cancels on mute and closes on teardown', async () => {
  const sources = []; let closed = false, decoded = 0;
  const originalWindow = globalThis.window, originalContext = globalThis.AudioContext;
  const originalFetch = globalThis.fetch;
  globalThis.window = {};
  globalThis.fetch = async url => ({ ok: true, async arrayBuffer() { const b = readFileSync(`public${url}`); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } });
  globalThis.AudioContext = class {
    state = 'suspended'; sampleRate = 48000; currentTime = 2; destination = {};
    async resume() { this.state = 'running'; }
    async decodeAudioData(bytes) { const wave = pcmWave(Buffer.from(bytes)); decoded++; return { length: wave.pcm.length, recorded: true }; }
    createGain() { return { gain: { value: 1 }, connect() { this.connected = true; }, disconnect() {} }; }
    createBufferSource() { const node = { connect() { this.connected = true; }, disconnect() {}, start() { assert.ok(this.buffer && this.connected); this.started = true; }, stop() { this.stopped = true; } }; sources.push(node); return node; }
    async close() { closed = true; }
  };
  try {
    let report; const audio = createCabinetAudio(value => { report = value; });
    const event = [{ id: 'top', kind: 'hinge', at: 1, level: .8 }];
    audio.play(event); assert.equal(sources.length, 0);
    await audio.unlock(); audio.play(event); assert.equal(sources.length, 1); assert.equal(report.state, 'running'); assert.equal(decoded, 4);
    assert.ok(sources[0].buffer.recorded);
    const before = report; audio.play([]); assert.equal(report, before, 'quiet frames must not publish state 60 times/sec');
    audio.setMuted(true); assert.equal(sources[0].stopped, true); audio.play(event); assert.equal(sources.length, 1);
    audio.setMuted(false); audio.play(event); audio.dispose(); assert.ok(closed && sources.at(-1).stopped);
  } finally { globalThis.window = originalWindow; globalThis.AudioContext = originalContext; globalThis.fetch = originalFetch; }
});

test('unmount during pending sample loads cannot start a stale sound or publish late status', async () => {
  const originalWindow = globalThis.window, originalContext = globalThis.AudioContext, originalFetch = globalThis.fetch;
  const pending = [], reports = [];
  globalThis.window = {};
  globalThis.fetch = url => new Promise(resolve => pending.push(() => resolve({ ok: true, async arrayBuffer() { const b = readFileSync(`public${url}`); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } })));
  globalThis.AudioContext = class {
    state = 'running'; async resume() {} async close() {}
    async decodeAudioData() { return {}; }
    createBufferSource() { assert.fail('closed engine must not create sound nodes'); }
  };
  try {
    const audio = createCabinetAudio(value => reports.push(value));
    const unlocking = audio.unlock(); await Promise.resolve();
    audio.dispose(); const count = reports.length;
    pending.forEach(resolve => resolve()); await unlocking;
    audio.play([{ id: 'late', kind: 'connector', at: 1, level: 1 }]);
    assert.equal(reports.length, count);
  } finally { globalThis.window = originalWindow; globalThis.AudioContext = originalContext; globalThis.fetch = originalFetch; }
});

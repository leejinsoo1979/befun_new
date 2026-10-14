import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
registerHooks({ resolve(s, c, next) {
  if (s.startsWith('@/')) return next(pathToFileURL(`${process.cwd()}/src/${s.slice(2)}${/\.[a-z]+$/i.test(s) ? '' : '.ts'}`).href, c);
  if (s.startsWith('.') && !/\.[a-z]+$/i.test(s)) return next(new URL(`${s}.ts`, c.parentURL).href, c);
  return next(s, c);
} });
const { createCabinetPlan, initialCabinetState, advanceCabinet } = await import('./cabinet.ts');
const { cabinetSoundSamples, cabinetSoundEvents, cabinetSoundsBetween, createCabinetAudio } = await import('./cabinetSound.ts');

test('wood, connector, spring and hinge foley have distinct audible, finite, unclipped PCM', () => {
  const kinds = ['wood', 'connector', 'spring', 'hinge'], shapes = new Set();
  for (const kind of kinds) {
    const pcm = cabinetSoundSamples(kind, 48000);
    assert.ok(pcm.every(Number.isFinite));
    const peak = Math.max(...pcm.map(Math.abs));
    const rms = Math.sqrt(pcm.reduce((sum, value) => sum + value * value, 0) / pcm.length);
    assert.ok(peak > .08 && peak < .9); assert.ok(rms > .015);
    assert.ok(Math.abs(pcm.at(-1)) < .001);
    assert.deepEqual(cabinetSoundSamples(kind, 48000), pcm);
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
  assert.deepEqual(cabinetSoundsBetween(plan, { ...start, playing: false }, current), []);
  assert.deepEqual(cabinetSoundsBetween(plan, current, start), []);
});
test('audio is gesture-unlocked, routes real buffers to destination, cancels on mute and closes on teardown', async () => {
  const sources = []; let closed = false;
  const originalWindow = globalThis.window, originalContext = globalThis.AudioContext;
  globalThis.window = {};
  globalThis.AudioContext = class {
    state = 'suspended'; sampleRate = 48000; currentTime = 2; destination = {};
    async resume() { this.state = 'running'; }
    createBuffer(_channels, length) { return { length, copyToChannel(pcm) { assert.equal(pcm.length, length); } }; }
    createBufferSource() { const node = { connect() { this.connected = true; }, disconnect() {}, start() { assert.ok(this.buffer && this.connected); this.started = true; }, stop() { this.stopped = true; } }; sources.push(node); return node; }
    async close() { closed = true; }
  };
  try {
    let report; const audio = createCabinetAudio(value => { report = value; });
    const event = [{ id: 'top', kind: 'hinge', at: 1 }];
    audio.play(event); assert.equal(sources.length, 0);
    await audio.unlock(); audio.play(event); assert.equal(sources.length, 1); assert.equal(report.state, 'running');
    audio.setMuted(true); assert.equal(sources[0].stopped, true); audio.play(event); assert.equal(sources.length, 1);
    audio.setMuted(false); audio.play(event); audio.dispose(); assert.ok(closed && sources.at(-1).stopped);
  } finally { globalThis.window = originalWindow; globalThis.AudioContext = originalContext; }
});

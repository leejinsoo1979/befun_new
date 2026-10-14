import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceTimeline, locateTimeline } from './playback.ts';

const durations = [2, 2.8, 3.2];
const initial = { step: 0, progress: 0, playing: true, speed: 1, continuous: true };

test('elapsed-time playback is equal at 60fps and at long browser frame intervals', () => {
  let frames = initial;
  for (let i = 0; i < 180; i++) frames = advanceTimeline(frames, durations, 1 / 60);
  const elapsed = advanceTimeline(initial, durations, 3);
  assert.equal(frames.step, elapsed.step);
  assert.ok(Math.abs(frames.progress - elapsed.progress) < 1e-12);
});
test('one long interval crosses chapters and stops precisely at the final frame', () => {
  assert.deepEqual(advanceTimeline(initial, durations, 8), { ...initial, step: 2, progress: 1, playing: false });
  assert.deepEqual(advanceTimeline(initial, durations, 18), { ...initial, step: 2, progress: 1, playing: false });
});
test('follow-assembly stops at one chapter; speed controls elapsed seconds', () => {
  assert.deepEqual(advanceTimeline({ ...initial, continuous: false }, durations, 8), { ...initial, continuous: false, progress: 1, playing: false });
  assert.deepEqual(advanceTimeline({ ...initial, speed: 2 }, durations, 1), { ...initial, speed: 2, step: 1, progress: 0 });
});
test('global seeking reaches the same chapter boundaries as continuous playback', () => {
  assert.deepEqual(locateTimeline(durations, 0), { step: 0, progress: 0 });
  assert.deepEqual(locateTimeline(durations, 1), { step: 2, progress: 1 });
  for (const seconds of [1, 2, 3.1, 4.8, 6]) {
    const played = advanceTimeline(initial, durations, seconds);
    const sought = locateTimeline(durations, seconds / 8);
    assert.equal(sought.step, played.step);
    assert.ok(Math.abs(sought.progress - played.progress) < 1e-12);
  }
});

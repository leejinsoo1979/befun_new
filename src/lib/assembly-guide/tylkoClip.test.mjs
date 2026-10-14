import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PerspectiveCamera, Vector3 } from 'three';

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) return next(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return next(new URL(`${specifier}.ts`, context.parentURL).href, context);
  return next(specifier, context);
} });
const { clipExample, clipColours, tylkoClipSteps, tylkoClipPose, tylkoClipShot, clipLocalToWorld } = await import('./tylkoClip.ts');
const { ILLUSTRATIVE_CLIP, ILLUSTRATIVE_PIN } = await import('../../components/three/furniture-hardware/connectors/illustrativeDimensions.ts');
const { pinPositionInClip, isManufacturingReady } = await import('../../components/three/furniture-hardware/connectors/clipContract.ts');

test('uses the hardware owner dimensions and colour pairs without assigning lock roles', () => {
  assert.equal(clipExample.clip, ILLUSTRATIVE_CLIP);
  assert.equal(clipExample.pin, ILLUSTRATIVE_PIN);
  assert.equal(isManufacturingReady(clipExample.clip, clipExample.pin), false);
  assert.deepEqual(clipColours('black-orange'), ['black', 'orange']);
  assert.deepEqual(clipColours('black-silver'), ['black', 'silver']);
  assert.equal(tylkoClipSteps.length, 5);
});

test('pins enter on the normal before any relative long-axis slide', () => {
  for (let step = 0; step < 3; step++) for (const p of [0, .1, .5, 1]) {
    assert.equal(tylkoClipPose(step, p).pinInClip[0], 0);
  }
  assert.deepEqual(tylkoClipPose(2, 1).pinInClip, pinPositionInClip(clipExample.clip, 'entered'));
  for (const p of [0, .25, .5, 1]) {
    const pose = tylkoClipPose(3, p);
    assert.equal(pose.pinInClip[2], 0);
    assert.equal(pose.pinInClip[1], 0);
    assert.equal(pose.entered, true);
  }
  assert.deepEqual(tylkoClipPose(3, 1).pinInClip, pinPositionInClip(clipExample.clip, 'locked'));
  assert.deepEqual(tylkoClipPose(4, 1).panelOffset, [0, 0, 0]);
});

test('all chapters are continuous, seeking deterministic, and motion transforms by the joint frame', () => {
  for (let step = 0; step < 4; step++) {
    const a = tylkoClipPose(step, 1), b = tylkoClipPose(step + 1, 0);
    assert.deepEqual(a.panelOffset, b.panelOffset);
    assert.deepEqual(a.pinInClip, b.pinInClip);
  }
  assert.deepEqual(tylkoClipPose(3, .45), tylkoClipPose(3, .45));
  assert.ok(tylkoClipPose(NaN, Infinity).panelOffset.every(Number.isFinite));
  assert.deepEqual(clipLocalToWorld([1, 2, 3]), [-2, 1, 3]);
  const start = clipLocalToWorld(tylkoClipPose(3, 0).panelOffset);
  const end = clipLocalToWorld(tylkoClipPose(3, 1).panelOffset);
  assert.equal(start[2], end[2]);
  assert.ok(end[1] < start[1]);
});

test('camera follows the joint and keeps both panels framed on mobile', () => {
  for (const aspect of [.42, 1, 2]) {
    const shot = tylkoClipShot(0, 0, aspect, true, false);
    const camera = new PerspectiveCamera(40, aspect, 1, 8000);
    camera.position.set(...shot.position); camera.lookAt(new Vector3(...shot.target)); camera.updateMatrixWorld();
    for (const x of [-90, 101]) for (const y of [-90, 90]) for (const z of [-220, 18]) {
      const p = new Vector3(...clipLocalToWorld([x, y, z])).project(camera);
      assert.ok(Math.abs(p.x) < 1 && Math.abs(p.y) < 1, `${aspect}: ${p.toArray()}`);
    }
    for (let step = 0; step < 5; step++) for (const progress of [0, .5, 1]) {
      const macro = tylkoClipShot(step, progress, aspect, false, false);
      assert.ok([...macro.target, ...macro.position].every(Number.isFinite));
    }
  }
});

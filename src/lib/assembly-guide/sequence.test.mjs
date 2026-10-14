import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) return next(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return next(new URL(`${specifier}.ts`, context.parentURL).href, context);
  return next(specifier, context);
} });
const { guideSteps, jointPose, guideShot, jointExample, exampleConnectorPlan } = await import('./sequence.ts');

test('example machining and connector locations consume the shared CNC planner', () => {
  for (const model of ['V-1230R', 'V-1230P']) {
    const { panels, report } = exampleConnectorPlan(model);
    assert.equal(report.joints.length, 1);
    assert.equal(report.warnings.length, 0);
    assert.equal(report.connectorCount[model], 2);
    assert.deepEqual(jointExample.centers, report.joints[0].positionsMm.map(value => value - 150));
    for (const panel of panels) assert.equal(panel.manufacturingBoring.connectorSlots.length, 2);
  }
});

test('releasable assembly inserts before sliding; permanent assembly never slides', () => {
  assert.equal(guideSteps('V-1230R').length, 8);
  assert.equal(guideSteps('V-1230P').length, 7);
  assert.equal(jointPose('V-1230R', 5, 1).panelGap, 0);
  assert.equal(jointPose('V-1230R', 5, 1).panelSlide, 15);
  assert.equal(jointPose('V-1230R', 6, 1).panelSlide, 0);
  for (let step = 0; step < 7; step++) for (const p of [0, .5, 1]) assert.equal(jointPose('V-1230P', step, p).panelSlide, 0);
});

test('every chapter preserves pose at its boundary and hardware installs before panel insertion', () => {
  for (const model of ['V-1230R', 'V-1230P']) {
    for (let step = 0; step < guideSteps(model).length - 1; step++) {
      const a = jointPose(model, step, 1), b = jointPose(model, step + 1, 0);
      for (const key of ['baseHousingOffset', 'endHousingOffset', 'connectorOffset', 'panelGap', 'panelSlide']) assert.equal(a[key], b[key]);
    }
    const pose = jointPose(model, 5, .5);
    assert.equal(pose.baseHousingOffset, 0);
    assert.equal(pose.endHousingOffset, 0);
    assert.equal(pose.connectorOffset, 0);
    assert.ok(pose.panelGap >= 0);
  }
});

test('seeking is deterministic, clamps invalid values, and keeps the complete part framed on mobile', () => {
  for (const model of ['V-1230R', 'V-1230P']) {
    assert.deepEqual(jointPose(model, 3, .4), jointPose(model, 3, .4));
    assert.ok(Object.values(jointPose(model, NaN, Infinity)).filter(v => typeof v === 'number').every(Number.isFinite));
    for (const aspect of [.42, 1, 2]) {
      const shot = guideShot(model, 0, 0, aspect, true, false);
      const camera = new PerspectiveCamera(40, aspect, 1, 10000);
      camera.position.set(...shot.position); camera.lookAt(new Vector3(...shot.target)); camera.updateMatrixWorld();
      for (const x of [-jointExample.width / 2, jointExample.width / 2]) for (const y of [-18, 200]) for (const z of [-150, 165]) {
        const p = new Vector3(x, y, z).project(camera);
        assert.ok(Math.abs(p.x) < 1 && Math.abs(p.y) < 1, `${aspect}: ${p.toArray()}`);
      }
    }
  }
});

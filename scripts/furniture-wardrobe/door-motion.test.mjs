import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { Matrix3, Matrix4, Vector3 } from 'three';
import { OBB } from 'three/examples/jsm/math/OBB.js';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({ mockServices: false });
registerHooks({ load(url, context, next) {
  if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true };
  return next(url, context);
} });
const { generateWardrobe } = await import('../../src/lib/furniture/wardrobe/index.ts');
const { resolveWardrobeDoorMotions } = await import('../../src/lib/furniture/wardrobe/door-motion.ts');
const { resolveWardrobeDoor } = await import('../../src/lib/furniture/wardrobe/fronts.ts');

test('closed Tone panels match final source renderer, including bottom extremes', () => {
  const fixtures = JSON.parse(fs.readFileSync(new URL('./tone-front-fixtures.json', import.meta.url)));
  let bottomCount = 0;
  for (const fixture of fixtures.cases) fixture.doors.forEach((door, index) => {
    if (door.extremes.includes('bottom')) bottomCount++;
    const actual = resolveWardrobeDoor(door, fixture.doors, 'tone', 'one', index);
    for (const [key, expected] of Object.entries(fixture.expected[index])) {
      assert.ok(Math.abs(actual[key] - expected) < 1e-8, `${fixture.id} ${index} ${key}: ${actual[key]} vs ${expected}`);
    }
  });
  assert.ok(bottomCount > 0);
});

// Independent Three.js OBB test includes actual panel thickness and height.
function box(front, motion, angle) {
  const rotation = new Matrix4().makeRotationY(angle);
  const center = new Vector3(front.x - motion.pivotX, front.y, front.z - motion.pivotZ)
    .applyMatrix4(rotation).add(new Vector3(motion.pivotX, 0, motion.pivotZ));
  return new OBB(center, new Vector3(front.w / 2, front.h / 2, front.d / 2), new Matrix3().setFromMatrix4(rotation));
}
function intersections(fronts, motions, angles) {
  const boxes = fronts.map((front, i) => box(front, motions[i], angles[i]));
  const hits = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    if (boxes[i].intersectsOBB(boxes[j])) hits.push(`${fronts[i].id}/${fronts[j].id}`);
  }
  return hits;
}
const input = { model: 'tone', widthMm: 2000, heightMm: 2760, depthMm: 630, sections: [{ id: 'one', seriesId: 3741 }] };
test('reproduce crossing doors at shared column boundary; source geometry stays unchanged', () => {
  const fronts = generateWardrobe(input).fronts;
  const before = structuredClone(fronts);
  const original = fronts.map(f => ({ pivotX: f.pivotX, pivotZ: f.z }));
  assert.ok(intersections(fronts, original, fronts.map(f => f.openAngle)).length > 0);
  const fixed = resolveWardrobeDoorMotions(fronts);
  assert.equal(fixed.filter(m => m.limitedBy.length).length, 4);
  assert.deepEqual(fronts, before);
  assert.deepEqual(intersections(fronts, fixed, fixed.map(m => m.openAngle)), []);
  for (const state of ['openAngle', 'ajarAngle']) for (let step = 0; step <= 360; step++) {
    assert.deepEqual(intersections(fronts, fixed, fixed.map(m => m[state] * step / 360)), [], `${state} ${step}`);
  }
  const reversed = resolveWardrobeDoorMotions([...fronts].reverse()).reverse();
  assert.deepEqual(reversed, fixed);
});
test('isolated pair retains source angles and original pivots', () => {
  const fronts = generateWardrobe({ ...input, widthMm: 950 }).fronts;
  const motions = resolveWardrobeDoorMotions(fronts);
  assert.ok(motions.every(m => m.limitedBy.length === 0));
  fronts.forEach((f, i) => {
    assert.equal(motions[i].openAngle, f.openAngle);
    assert.equal(motions[i].pivotX, f.pivotX);
    assert.equal(motions[i].pivotZ, f.z);
  });
});
test('155 independent Tone configurations: sampled simultaneous sweep after changing width/layout', () => {
  const fixtures = JSON.parse(fs.readFileSync(new URL('./tone-source-fixtures.json', import.meta.url)));
  for (const fixture of fixtures) {
    const fronts = generateWardrobe(fixture.input).fronts;
    const motions = resolveWardrobeDoorMotions(fronts);
    for (let step = 0; step <= 60; step++) {
      assert.deepEqual(intersections(fronts, motions, motions.map(m => m.openAngle * step / 60)), [], `${fixture.id} step ${step}`);
    }
  }
});
for (const model of ['tone', 'edge']) for (const widthMm of [950, 1060, 1500, 2000, 3000, 4150, 6000]) {
  for (const doorDirection of ['left', 'right']) test(`${model} ${widthMm}mm ${doorDirection}: open/close and partial/full transition`, () => {
    const config = { ...input, model, widthMm, sections: [{ id: 'one', seriesId: model === 'tone' ? 3741 : 0, doorDirection }] };
    const fronts = generateWardrobe(config).fronts;
    assert.ok(fronts.length);
    const motions = resolveWardrobeDoorMotions(fronts);
    for (const [start, end] of [[0, 'openAngle'], ['openAngle', 0], [0, 'ajarAngle'], ['ajarAngle', 'openAngle'], ['openAngle', 'ajarAngle']]) {
      for (let frame = 0; frame <= 120; frame++) {
        const t = frame / 120;
        const angles = motions.map(m => (start ? m[start] : 0) * (1 - t) + (end ? m[end] : 0) * t);
        assert.deepEqual(intersections(fronts, motions, angles), [], `${start} → ${end} frame ${frame}`);
      }
    }
  });
}

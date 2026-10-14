import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { Quaternion, Vector3 } from 'three';
registerHooks({ resolve(s, c, next) {
  if (s.startsWith('@/')) return next(pathToFileURL(`${process.cwd()}/src/${s.slice(2)}${/\.[a-z]+$/i.test(s) ? '' : '.ts'}`).href, c);
  if (s.startsWith('.') && !/\.[a-z]+$/i.test(s)) return next(new URL(`${s}.ts`, c.parentURL).href, c);
  return next(s, c);
} });
const { cabinetDesign, createCabinetPlan, createCabinetPanelGeometry, cabinetPartPose, cabinetPinExtension, initialCabinetState, selectCabinetPart, placeCabinetPart, advanceCabinet, confirmCabinetPart } = await import('./cabinet.ts');
const { buildBefunShelfModel } = await import('../optimizer/befun/model.ts');
const { isLaminateSkin } = await import('./panelMaterials.ts');

test('whole cabinet consumes the real shared Befun result and unique CNC panel IDs', () => {
  const plan = createCabinetPlan();
  assert.deepEqual(plan.model, buildBefunShelfModel(cabinetDesign));
  assert.equal(plan.parts.length, plan.model.panels.length + plan.model.doors.length);
  assert.equal(plan.parts.length, 8);
  assert.equal(new Set(plan.parts.map(p => p.id)).size, 8);
  assert.equal(plan.cnc.connectorReport.joints.length, 6);
  assert.deepEqual(plan.issues, []);
  for (const part of plan.parts) {
    const pose = cabinetPartPose(part, { ...initialCabinetState(), phase: 'complete' });
    assert.deepEqual(pose.position, [part.box.x, part.box.y, part.box.z]);
    assert.equal(pose.rotationProgress, 1);
  }
  assert.equal(plan.manufacturingApproved, false);
});

test('a two-sided mid-board pocket conflict is retained rather than falsely approved', () => {
  const plan = createCabinetPlan({ ...cabinetDesign, height: 62, rowHeights: [28, 28], numRows: 2 });
  assert.ok(plan.issues.some(x => x.includes('양면 가공')));
});

test('both halves use the same actual joint anchor with opposed housing normals', () => {
  const plan = createCabinetPlan();
  for (const joint of plan.cnc.connectorReport.joints) for (let i = 0; i < joint.positionsMm.length; i++) {
    const end = plan.parts.find(p => p.id === joint.endPanelId), face = plan.parts.find(p => p.id === joint.facePanelId);
    const e = end.hardware.find(m => m.id === `${joint.id}-${i}-end`), f = face.hardware.find(m => m.id === `${joint.id}-${i}-face`);
    const world = (part, mount) => mount.at.map((v, axis) => v + [part.box.x, part.box.y, part.box.z][axis] * 10);
    assert.deepEqual(world(end, e), world(face, f));
    const en = new Vector3(0, 0, 1).applyQuaternion(new Quaternion(...e.quaternion));
    const fn = new Vector3(0, 0, 1).applyQuaternion(new Quaternion(...f.quaternion));
    assert.ok(en.dot(fn) < -.999999);
  }
});

test('manual assembly gates wrong parts, hardware preparation, seating and confirmation', () => {
  const plan = createCabinetPlan();
  const original = JSON.stringify(plan.model);
  let state = initialCabinetState();
  assert.equal(selectCabinetPart(state, plan.parts[1].id, plan), state);
  assert.equal(confirmCabinetPart(state, 8), state);
  state = selectCabinetPart(state, plan.parts[0].id, plan);
  assert.equal(state.phase, 'hardware');
  assert.equal(placeCabinetPart(state), state);
  const paused = state;
  assert.equal(advanceCabinet(paused, 10, plan), paused);
  state = advanceCabinet({ ...state, playing: true }, 1, plan);
  assert.equal(state.phase, 'ready');
  state = placeCabinetPart(state);
  state = advanceCabinet(state, 2, plan);
  assert.equal(state.phase, 'check');
  state = confirmCabinetPart(state, 8);
  assert.equal(state.step, 1);
  assert.equal(state.phase, 'choose');
  assert.equal(JSON.stringify(plan.model), original, 'practice must not mutate the furniture model');
});

test('automatic full assembly is equal at 60fps and after one long frame', () => {
  const plan = createCabinetPlan();
  let short = { ...initialCabinetState(), automatic: true, playing: true };
  for (let i = 0; i < 60 * 120; i++) short = advanceCabinet(short, 1 / 60, plan);
  const long = advanceCabinet({ ...initialCabinetState(), automatic: true, playing: true }, 120, plan);
  assert.deepEqual(short, long);
  assert.equal(long.phase, 'complete');
  assert.equal(long.playing, false);
});

test('support and back panel share fixed-lower / spring-upper dowels after the top is installed', () => {
  const plan = createCabinetPlan(), top = plan.parts.find(p => p.box.kind === 'horizontal' && !p.feet);
  const rears = plan.parts.filter(p => p.pinCenters.length);
  assert.equal(rears.length, 2);
  for (const part of rears) {
    assert.ok(top.number < part.number);
    assert.equal(part.pinCenters.length, 2);
    assert.equal(part.hardware.length, 0, 'rear dowels must not use OVVO');
    const state = { ...initialCabinetState(), step: part.number - 1, phase: 'spring-press', progress: 1 };
    assert.equal(cabinetPinExtension(part, state), 0);
    const bottom = pose => new Vector3(0, -part.box.h / 2, 0).applyAxisAngle(new Vector3(1, 0, 0), pose.tilt).add(new Vector3(...pose.position));
    const a = bottom(cabinetPartPose(part, { ...state, phase: 'spring-seat', progress: 0 }));
    const b = bottom(cabinetPartPose(part, { ...state, phase: 'spring-seat', progress: .5 }));
    const c = bottom(cabinetPartPose(part, { ...state, phase: 'spring-seat', progress: 1 }));
    assert.ok(a.distanceTo(b) < 1e-8 && b.distanceTo(c) < 1e-8, 'lower fixed dowels remain the seating pivot');
    assert.equal(cabinetPinExtension(part, { ...state, phase: 'spring-lock' }), 5);
    assert.ok(top.displayBorings.some(h => h.id.includes(part.id)));
    assert.ok(!part.panel.manufacturingBoring?.borings.some(h => h.id.startsWith('display-')), 'illustrative holes must stay out of CNC data');
  }
});

test('the machined door retains two laminate skins and centered real bounds', () => {
  const plan = createCabinetPlan(), door = plan.parts.find(p => p.box.kind === 'door');
  const geometry = createCabinetPanelGeometry(door);
  try {
    const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
    const skins = new Set();
    for (let i = 0; i < positions.count; i += 3) {
      const z = [0, 1, 2].map(j => positions.getZ(i + j));
      if (isLaminateSkin(normals.getZ(i), z, door.box.d * 10)) skins.add(Math.sign(z[0]));
    }
    assert.deepEqual([...skins].sort(), [-1, 1]);
    geometry.computeBoundingBox();
    const size = geometry.boundingBox.getSize(new Vector3());
    assert.ok(size.distanceTo(new Vector3(door.box.w * 10, door.box.h * 10, door.box.d * 10)) < .01);
  } finally { geometry.dispose(); }
});

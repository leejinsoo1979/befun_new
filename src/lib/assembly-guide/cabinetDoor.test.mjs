import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
registerHooks({ resolve(s, c, next) {
  if (s.startsWith('@/')) return next(pathToFileURL(`${process.cwd()}/src/${s.slice(2)}${/\.[a-z]+$/i.test(s) ? '' : '.ts'}`).href, c);
  if (s.startsWith('.') && !/\.[a-z]+$/i.test(s)) return next(new URL(`${s}.ts`, c.parentURL).href, c);
  return next(s, c);
} });
const { createCabinetPlan, initialCabinetState, cabinetPartPose } = await import('./cabinet.ts');
const { cabinetFilmDuration, seekCabinetFilm } = await import('./cabinetFilm.ts');
const { cabinetDoorAngle, cabinetDoorGap, cabinetHingePress, cabinetDoorHinge, cabinetHingeTarget } = await import('./cabinetDoor.ts');

test('door stays open and supported through front hooking and the two separate rear clips', () => {
  const plan = createCabinetPlan(), door = plan.parts.at(-1), start = { ...initialCabinetState(), step: door.number - 1 };
  for (const phase of ['hinge-hook', 'hinge-top', 'hinge-bottom']) {
    assert.equal(cabinetDoorAngle(door, { ...start, phase }), Math.PI / 2);
    assert.equal(cabinetPartPose(door, { ...start, phase }).rotationProgress, 1);
  }
  assert.deepEqual(cabinetDoorGap(door, { ...start, phase: 'hinge-hook', progress: 1 }), [0, 0, 0]);
  assert.equal(cabinetHingePress({ ...start, phase: 'hinge-hook', progress: 1 }, 0, door), 0);
  assert.equal(cabinetHingePress({ ...start, phase: 'hinge-top', progress: .72 }, 0, door), 1);
  assert.equal(cabinetHingePress({ ...start, phase: 'hinge-top', progress: 1 }, 1, door), 0);
  assert.equal(cabinetHingePress({ ...start, phase: 'hinge-bottom', progress: 0 }, 0, door), 1);
  assert.equal(cabinetHingePress({ ...start, phase: 'hinge-bottom', progress: .72 }, 1, door), 1);
  assert.equal(cabinetDoorAngle(door, { ...start, phase: 'hinge-test', progress: 1 }), 0);
});
test('whole film contains hook, top/bottom lock and opening test in order, including after backward seeks', () => {
  const plan = createCabinetPlan(), phases = [];
  for (let t = 0; t < cabinetFilmDuration(plan); t += .025) {
    const state = seekCabinetFilm(plan, t);
    if (state.phase.startsWith('hinge-') && phases.at(-1) !== state.phase) phases.push(state.phase);
  }
  assert.deepEqual(phases, ['hinge-hook', 'hinge-top', 'hinge-bottom', 'hinge-test']);
  const a = seekCabinetFilm(plan, 52); seekCabinetFilm(plan, 56);
  assert.deepEqual(seekCabinetFilm(plan, 52), a);
});
test('hinge targets follow actual common mounting plates and preserve their top/bottom order', () => {
  const plan = createCabinetPlan(), door = plan.parts.at(-1), { hinge, order } = cabinetDoorHinge(plan, door);
  assert.equal(hinge.hinge, '71B3790'); assert.equal(hinge.plate, '174H7100E');
  assert.ok(hinge.mounts[order[0]].position[1] > hinge.mounts[order[1]].position[1]);
  assert.ok(cabinetHingeTarget(plan, door).y > cabinetHingeTarget(plan, door, true).y);
  assert.equal(plan.manufacturingApproved, false);
});

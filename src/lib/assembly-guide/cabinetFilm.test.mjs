import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
registerHooks({ resolve(s, c, next) {
  if (s.startsWith('@/')) return next(pathToFileURL(`${process.cwd()}/src/${s.slice(2)}${/\.[a-z]+$/i.test(s) ? '' : '.ts'}`).href, c);
  if (s.startsWith('.') && !/\.[a-z]+$/i.test(s)) return next(new URL(`${s}.ts`, c.parentURL).href, c);
  return next(s, c);
} });
const { createCabinetPlan } = await import('./cabinet.ts');
const { cabinetFilmDuration, cabinetFilmElapsed, seekCabinetFilm, cabinetFilmShot } = await import('./cabinetFilm.ts');

test('one complete movie includes both rear locks and a final reveal, and seeking is reversible', () => {
  const plan = createCabinetPlan(), duration = cabinetFilmDuration(plan), phases = new Set();
  for (let t = 0; t < duration; t += .1) {
    const state = seekCabinetFilm(plan, t);
    assert.ok(Math.abs(cabinetFilmElapsed(plan, state) - t) < 1e-6);
    if (plan.parts[state.step].pinCenters.length) phases.add(`${state.step}-${state.phase}`);
  }
  for (const part of plan.parts.filter(p => p.pinCenters.length)) for (const phase of ['spring-press', 'spring-seat', 'spring-lock']) assert.ok(phases.has(`${part.number - 1}-${phase}`));
  assert.equal(seekCabinetFilm(plan, duration).phase, 'complete');
  assert.equal(seekCabinetFilm(plan, duration - 1).phase, 'reveal');
  const sample = seekCabinetFilm(plan, 12);
  assert.deepEqual(seekCabinetFilm(plan, 12), sample);
  assert.equal(sample.playing, false);
});

test('cinematic camera is finite, pause deterministic, and continuous across all phase boundaries', () => {
  const plan = createCabinetPlan(), duration = cabinetFilmDuration(plan);
  for (const aspect of [390 / 480, 1488 / 670]) {
    let previous;
    for (let t = 0; t <= duration; t += .02) {
      const state = seekCabinetFilm(plan, t), shot = cabinetFilmShot(plan, state, aspect);
      assert.ok([...shot.position, ...shot.target, shot.fov].every(Number.isFinite));
      assert.deepEqual(cabinetFilmShot(plan, state, aspect), shot);
      if (previous) {
        const distance = Math.hypot(...shot.position.map((v, i) => v - previous.position[i]));
        assert.ok(distance < 350, `camera jump at ${t.toFixed(2)}s/${state.phase}: ${distance.toFixed(1)}mm`);
      }
      previous = shot;
    }
  }
});

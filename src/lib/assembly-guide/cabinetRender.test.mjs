import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { VSMShadowMap } from 'three';
registerHooks({ resolve(s, c, next) {
  if (s.startsWith('@/')) return next(pathToFileURL(`${process.cwd()}/src/${s.slice(2)}${/\.[a-z]+$/i.test(s) ? '' : '.ts'}`).href, c);
  if (s.startsWith('.') && !/\.[a-z]+$/i.test(s)) return next(new URL(`${s}.ts`, c.parentURL).href, c);
  return next(s, c);
} });
const { createCabinetPlan } = await import('./cabinet.ts');
const { cabinetRender, cabinetShadowBounds } = await import('./cabinetRender.ts');
test('shadow bounds fit the cabinet layout once with valid light depth and deterministic non-stochastic filtering', () => {
  const plan = createCabinetPlan(), fit = cabinetShadowBounds(plan);
  assert.deepEqual(cabinetShadowBounds(plan), fit);
  assert.ok(Object.values(fit).flat().every(Number.isFinite));
  assert.ok(fit.right > fit.left && fit.top > fit.bottom && fit.far > fit.near && fit.near > 0);
  assert.ok((fit.right - fit.left) / cabinetRender.mapSize < 1.2);
  assert.equal(cabinetRender.shadowType, VSMShadowMap);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return next(new URL(`${specifier}.ts`, context.parentURL).href, context);
  return next(specifier, context);
} });
const { ovvoPartPairing, sampleOvvoAssembly, sampleOvvoRelease, ovvoRRelease } = await import('./ovvoMotion.ts');
const scene = { openGapMm: 80, alignedGapMm: 20, assemblySlideMm: 7 };

test('official P and R part pairings keep face receiver and central connector separate', () => {
  assert.deepEqual(ovvoPartPairing['V-1230P'], { endHousing: 'V-1230PH', faceHousing: 'V-1230PH', connector: 'V-1230PC', releaseSupported: false });
  assert.deepEqual(ovvoPartPairing['V-1230R'], { endHousing: 'V-1230PH', faceHousing: 'V-1230RH', connector: 'V-1230RC', releaseSupported: true });
});

test('assembly displacement comes from the input contract; 15 mm release never substitutes for unknown movement', () => {
  const unknown = sampleOvvoAssembly('V-1230R', 'slide', .5, { ...scene, assemblySlideMm: null });
  assert.equal(unknown.motionReady, false);
  assert.equal(unknown.slideOffsetMm, null);
  assert.equal(sampleOvvoAssembly('V-1230R', 'slide', 0, scene).slideOffsetMm, 7);
  assert.equal(sampleOvvoAssembly('V-1230R', 'slide', 1, scene).slideOffsetMm, 0);
  assert.equal(ovvoRRelease.distanceMm, 15);
});

test('P presses without a slide and refuses the R release operation', () => {
  for (const phase of ['prepare', 'align', 'insert', 'check']) for (const p of [0, .5, 1]) assert.equal(sampleOvvoAssembly('V-1230P', phase, p, { ...scene, assemblySlideMm: null }).slideOffsetMm, 0);
  assert.throws(() => sampleOvvoAssembly('V-1230P', 'slide', 0, scene), /no slide/);
  assert.throws(() => sampleOvvoRelease('V-1230P', 'release-slide', 1, 80), /permanent/);
});

test('R inserts before assembly sliding and completes release sliding before lifting', () => {
  for (const p of [0, .25, .75, 1]) {
    const insert = sampleOvvoAssembly('V-1230R', 'insert', p, scene);
    assert.equal(insert.slideOffsetMm, 7);
    assert.equal(sampleOvvoAssembly('V-1230R', 'slide', p, scene).normalGapMm, 0);
    assert.equal(sampleOvvoRelease('V-1230R', 'release-slide', p, 80).normalGapMm, 0);
    assert.equal(sampleOvvoRelease('V-1230R', 'lift', p, 80).slideOffsetMm, 15);
  }
  assert.deepEqual(sampleOvvoAssembly('V-1230R', 'insert', 1, scene), sampleOvvoAssembly('V-1230R', 'slide', 0, scene));
  assert.deepEqual(sampleOvvoRelease('V-1230R', 'release-slide', 1, 80), sampleOvvoRelease('V-1230R', 'lift', 0, 80));
  assert.deepEqual(sampleOvvoRelease('V-1230R', 'lift', .4, 80), sampleOvvoRelease('V-1230R', 'lift', .4, 80));
});

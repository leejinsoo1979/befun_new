import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Texture } from 'three';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return next(new URL(`${specifier}.ts`, context.parentURL).href, context);
  return next(specifier, context);
} });
const { releasePose, releaseSteps, canConfirmRelease } = await import('./disassembly.ts');
const { mapPanelEdgeUvs, panelFaceMaterials, createGuidePanelMaterials, disposeGuidePanelMaterials, isLaminateSkin } = await import('./panelMaterials.ts');

test('release keeps panels seated until the full official 15 mm slide, then lifts', () => {
  for (const p of [0, .25, .5, .75, 1]) {
    assert.equal(releasePose(1, p).panelGap, 0);
    assert.equal(releasePose(2, p).panelSlide, 15);
    for (const pose of [releasePose(1, p), releasePose(2, p)]) {
      assert.equal(pose.baseHousingOffset, 0);
      assert.equal(pose.endHousingOffset, 0);
      assert.equal(pose.connectorOffset, 0);
      assert.equal(pose.connectorsVisible, true);
    }
  }
  assert.equal(releasePose(1, 1).panelSlide, 15);
  assert.equal(releasePose(2, 1).panelGap, 80);
});

test('chapter transitions, backward seeks and replay preserve absolute poses', () => {
  for (let i = 0; i < releaseSteps.length - 1; i++) {
    const a = releasePose(i, 1), b = releasePose(i + 1, 0);
    for (const key of ['panelGap', 'panelSlide', 'connectorOffset', 'endHousingOffset']) assert.equal(a[key], b[key]);
  }
  const atHalf = releasePose(1, .5);
  releasePose(3, 1);
  assert.deepEqual(releasePose(1, .5), atHalf);
  assert.equal(releasePose(0, 0).panelSlide, 0);
});

test('laminate covers both opposing broad faces for horizontal, upright and back panels', () => {
  for (const axis of [0, 1, 2]) {
    const faces = panelFaceMaterials('laminate', 'birch', axis);
    assert.equal(faces.filter(value => value === 'laminate').length, 2);
    assert.equal(faces[axis * 2], 'laminate');
    assert.equal(faces[axis * 2 + 1], 'laminate');
  }
});

test('plywood layers span thickness once and remain continuous through the split board', () => {
  const lower = mapPanelEdgeUvs(new BoxGeometry(100, 5.5, 300), 1, 18, -18, [0, -15.25, 0]);
  const upper = mapPanelEdgeUvs(new BoxGeometry(100, 12.5, 300), 1, 18, -18, [0, -6.25, 0]);
  for (const geometry of [lower, upper]) {
    const p = geometry.attributes.position, uv = geometry.attributes.uv;
    for (let i = 0; i < 4; i++) {
      const y = p.getY(i) + (geometry === lower ? -15.25 : -6.25);
      assert.ok(Math.abs(uv.getX(i) - (y + 18) / 18) < 1e-6);
    }
    geometry.dispose();
  }
});

test('follow mode cannot confirm lifting before the release step is confirmed', () => {
  assert.equal(canConfirmRelease(2, 1, new Set([0])), false);
  assert.equal(canConfirmRelease(2, .5, new Set([0, 1])), false);
  assert.equal(canConfirmRelease(2, 1, new Set([0, 1])), true);
});

test('repeated opaque/inside/axis changes release owned materials and textures, preserving the loader source', () => {
  const source = new Texture();
  source.repeat.set(2, 3);
  let sourceDisposed = 0, disposedMaterials = 0, disposedTextures = 0;
  source.addEventListener('dispose', () => sourceDisposed++);
  for (let i = 0; i < 18; i++) {
    const result = createGuidePanelMaterials(source, i % 3, i % 2 === 0);
    assert.notEqual(result.texture, source);
    result.texture.repeat.set(1, 1);
    result.texture.addEventListener('dispose', () => disposedTextures++);
    for (const material of [result.laminate, result.birch]) material.addEventListener('dispose', () => disposedMaterials++);
    disposeGuidePanelMaterials(result);
  }
  assert.equal(disposedMaterials, 36);
  assert.equal(disposedTextures, 18);
  assert.equal(sourceDisposed, 0);
  assert.deepEqual(source.repeat.toArray(), [2, 3]);
  source.dispose();
});

test('the two laminate skins exclude parallel bore floors and inner cut surfaces', () => {
  assert.equal(isLaminateSkin(1, [9, 9, 9], 18), true);
  assert.equal(isLaminateSkin(-1, [-9, -9, -9], 18), true);
  assert.equal(isLaminateSkin(1, [5, 5, 5], 18), false);
  assert.equal(isLaminateSkin(1, [9, 9, 5], 18), false);
  assert.equal(isLaminateSkin(0, [9, 9, 9], 18), false);
});

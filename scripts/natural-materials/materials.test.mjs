import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import * as THREE from 'three';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';

registerHooks({ load(url, context, next) {
  if (url.endsWith('.json')) return { format: 'module', shortCircuit: true, source: `export default ${fs.readFileSync(new URL(url), 'utf8')}` };
  return next(url, context);
} });
installTestLoader({ mockServices: false });
const { IMPORTED_NATURAL_TEXTURES } = await import('../../src/lib/three/natural-textures.ts');
const { createNaturalMaterialsForColor } = await import('../../src/lib/three/natural-materials.ts');
const { disposeMaterialSet } = await import('../../src/lib/three/materials.ts');
const { befunColorLook, befunMaterialSwatches } = await import('../../src/lib/optimizer/befun/colors.ts');
const { parseSavedDesign } = await import('../../src/components/storefront/savedDesign.ts');
const { encodeDesignToURL, decodeDesignFromURL } = await import('../../src/lib/sharing.ts');
const evidence = JSON.parse(fs.readFileSync(new URL('../../docs/handoffs/natural-materials/assets.json', import.meta.url), 'utf8'));

test('Both source packs produce bounded, local, decodable maps matching their recorded bytes', async () => {
  assert.deepEqual(Object.keys(IMPORTED_NATURAL_TEXTURES), ['N_Wood_W4', 'N_Wood_W2']);
  for (const pack of evidence) {
    assert.ok(pack.webBytes < pack.sourceMapBytes * .05, pack.key);
    for (const asset of pack.assets) {
      const bytes = fs.readFileSync(new URL('../../public' + asset.url, import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
      const metadata = await sharp(bytes).metadata();
      assert.equal(metadata.format, 'webp');
      assert.equal(metadata.width, asset.width);
      assert.equal(metadata.height, asset.height);
      const max = asset.url.endsWith('/base.webp') ? 2048 : 1024;
      assert.ok(Math.max(metadata.width, metadata.height) <= max);
    }
  }
});

test('GPU map colour spaces, independent ownership and disposal survive repeated material changes', async () => {
  const original = THREE.TextureLoader.prototype.loadAsync;
  THREE.TextureLoader.prototype.loadAsync = async function () { return new THREE.Texture(); };
  try {
    for (const key of Object.keys(IMPORTED_NATURAL_TEXTURES)) {
      const first = await createNaturalMaterialsForColor(key);
      const second = await createNaturalMaterialsForColor(key);
      const maps = Object.values(first).flatMap(material => [material.map, material.normalMap, material.roughnessMap]);
      assert.equal(new Set(maps).size, 15);
      for (const face of Object.keys(first)) {
        assert.equal(first[face].map.colorSpace, THREE.SRGBColorSpace);
        assert.equal(first[face].normalMap.colorSpace, THREE.NoColorSpace);
        assert.equal(first[face].roughnessMap.colorSpace, THREE.NoColorSpace);
        assert.notEqual(first[face].map, second[face].map);
      }
      let disposed = 0;
      for (const texture of maps) texture.addEventListener('dispose', () => disposed++);
      disposeMaterialSet(first);
      assert.equal(disposed, 15);
      assert.ok(second.verticalBase.map);
      disposeMaterialSet(second);
    }
  } finally { THREE.TextureLoader.prototype.loadAsync = original; }
});

test('Natural identifiers preserve local/URL restore and optimizer material identity', () => {
  for (const [key, texture] of Object.entries(IMPORTED_NATURAL_TEXTURES)) {
    const config = { style: 'grid', density: 50, width: 90, height: 92, depth: 32, hasBackPanel: true,
      color: key, colorCategory: 'natural', rowHeights: [28,28,28], numRows: 3,
      doorsCreatedLayers: [], drawersCreatedLayers: [] };
    const saved = parseSavedDesign(JSON.stringify({ version: 1, name: texture.label, config }));
    assert.equal(saved.config.color, key);
    const restored = decodeDesignFromURL(encodeDesignToURL(config, 'http://localhost/configurator'));
    assert.equal(restored.color, key);
    assert.equal(restored.colorCategory, 'natural');
    const look = befunColorLook(key);
    assert.equal(look.category, 'natural');
    assert.equal(look.surface, texture.surface);
    assert.ok(befunMaterialSwatches().some(item => item.name === look.swatchName));
  }
});

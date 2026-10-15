import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';
import { installTestLoader } from '../../storefront-save-validation/loader.mjs';

registerHooks({ load(url, context, next) { if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true }; return next(url, context); } });
installTestLoader({ mockServices: false });
registerHooks({ resolve(specifier, context, next) { if (specifier.startsWith('@/') && /\.(js|json)$/.test(specifier) && fs.existsSync(path.resolve('src', specifier.slice(2)))) return { url: pathToFileURL(path.resolve('src', specifier.slice(2))).href, shortCircuit: true }; return next(specifier, context); } });
const { calculateSource, sourceInitialState, readSourceState } = await import('../../../src/lib/catalog-entry/source-designs/engine.ts');
const { sourceProduct } = await import('../../../src/lib/catalog-entry/source-designs/server.ts');
const { catalogThumbnailStart } = await import('../../../src/lib/catalog-entry/starts.ts');
const { downloadedItems } = await import('../../../src/lib/catalog-expansion/server.ts');
const { DOWNLOADED_CATEGORIES } = await import('../../../src/lib/catalog-expansion/categories.ts');
const { introVariants } = await import('../../../src/components/storefront/introVariants.ts');
const { sourceFabric } = await import('../../../src/lib/sofa/source-model.ts');
const catalogue = JSON.parse(fs.readFileSync('src/lib/catalog-entry/source-designs/products.json'));
const sofaAssets = JSON.parse(fs.readFileSync('src/lib/sofa/source-assets.json'));
const furnitureAssets = JSON.parse(fs.readFileSync('src/lib/bookcase/data/assets.json'));
const sofaCatalogue = JSON.parse(fs.readFileSync('src/lib/sofa-catalog/catalog.json'));
const sourceDirectory = 'docs/handoffs/thumbnail-configurators/raw';
const panels = ['walls', 'slabs', 'backs', 'doors', 'drawers'];
const sofaGroups = ['seaters', 'armrests', 'chaise_longues', 'chaise_longue_armrests', 'corners', 'open_ends', 'footrests', 'cushions'];
const coordinates = entries => entries.map(part => ['x1', 'x2', 'y1', 'y2', 'z1', 'z2'].map(key => Math.round((part[key] ?? 0) * 1000) / 1000).join(',')).sort();
const sofaIdentity = entries => (entries ?? []).map(part => JSON.stringify(['id', 'x1', 'x2', 'y1', 'y2', 'z1', 'z2', 'rotation_z', 'module_direction', 'material', 'material_backrest', 'material_cushion', 'replaceable_covers'].map(key => part[key]))).sort();

test('All 891 Edge/Tone/Uff/Smooth source identities load their own configurations and exact outside dimensions', () => {
  const errors = [];
  for (const key of Object.keys(catalogue)) {
    try {
      const product = sourceProduct(key);
      const state = sourceInitialState(product);
      const snapshot = calculateSource(product, state);
      const source = JSON.parse(fs.readFileSync(`${sourceDirectory}/${key}.json`));
      for (const dimension of ['width', 'height', 'depth']) assert.equal(snapshot.geometry[dimension], source[dimension], `${key}/${dimension}`);
      if (key.endsWith(',w')) {
        for (const group of panels) assert.deepEqual(coordinates(snapshot.geometry[group]), coordinates(source[group]), `${key}/${group}`);
        for (const group of snapshot.schema.filter(group => !['openings', 'hovers', 'dimensions'].includes(group.key))) for (const segment of group.children) for (const part of segment.geometries) if (part.asset !== 'roundedPanel') assert.ok(furnitureAssets[part.asset] && fs.existsSync(`public${furnitureAssets[part.asset].url}`), `${key}/${part.asset}/file`);
      }
      else {
        for (const group of sofaGroups) assert.deepEqual(sofaIdentity(snapshot.geometry[group]), sofaIdentity(source[group]), `${key}/${group}`);
        for (const segment of snapshot.schema.find(group => group.key === 'sofaParts').children) for (const part of segment.geometries) {
        assert.ok(sofaAssets[part.asset], `${key}/${part.asset}`);
        assert.ok(fs.existsSync(`public${sofaAssets[part.asset].local}`), `${key}/${part.asset}/file`);
        if (part.material?.name !== 'paintedMetal') {
          const model = source.shelf_type === 12 ? 'uff' : 'smooth';
          const fabric = Array.from({ length: model === 'uff' ? 15 : 28 }, (_, id) => sourceFabric(model, id)).find(fabric => fabric?.color === part.material.colors.primary);
          assert.ok(fabric, `${key}/${part.material.colors.primary}`);
          const gi = model === 'uff' ? `${part.asset}_512` : part.asset.includes('_FR_') || part.asset.includes('_AR_') ? 'FOOT_AO_GI' : 'SEAT_AO_GI';
          for (const id of [fabric.color, fabric.normal, gi, ...(fabric.sheenMap ? [fabric.sheenMap] : [])]) assert.ok(sofaAssets[id] && fs.existsSync(`public${sofaAssets[id].local}`), `${key}/${id}`);
        }
      }
      }
      const entry = catalogThumbnailStart(key);
      assert.ok(entry, key);
      if (entry.kind === 'furniture') assert.ok(entry.href.startsWith('/reference-product/wardrobe-'));
      else assert.equal(new URL(entry.href, 'http://localhost').searchParams.get('product'), String(source.id));
      assert.equal(state.key, key);
    } catch (error) { errors.push({ key, error: String(error) }); }
  }
  fs.writeFileSync('docs/handoffs/thumbnail-configurators/verification.json', JSON.stringify({ total: Object.keys(catalogue).length, errors }, null, 2));
  assert.equal(errors.length, 0, JSON.stringify(errors.slice(0, 12)));
  assert.equal(Object.keys(catalogue).length, 891);
});

test('All category duplicates and colour variants retain exact product entry; all newly supported intro photographs are connected', () => {
  let count = 0;
  for (const category of DOWNLOADED_CATEGORIES) for (const item of downloadedItems(category.key)) if (catalogue[item.productKey]) {
    assert.equal(item.editorHref, catalogThumbnailStart(item.productKey).href, `${category.key}/${item.productKey}`);
    count++;
  }
  for (const variants of Object.values(introVariants)) for (const item of variants) if (item.sourceProductKey.endsWith(',w') || item.sourceProductKey.endsWith(',s')) assert.ok(catalogThumbnailStart(item.sourceProductKey), item.sourceProductKey);
  for (const product of sofaCatalogue) for (const variant of product.variants) assert.ok(catalogue[`${variant.id},s`] && catalogThumbnailStart(`${variant.id},s`), `sofa catalogue/${variant.id}`);
  assert.ok(count > 900);
});

test('Edits, restoration and alternating lineups never replace the selected product or contaminate another family', () => {
  for (const key of ['1964243,w', '540446,w', '1934084,w', '92332,w', '657092,w', '315996,s', '113433,s', '321398,s', '316601,s']) {
    const product = sourceProduct(key);
    const initial = sourceInitialState(product);
    const original = calculateSource(product, initial);
    const originalMaterial = original.configuration.values.material;
    const nextMaterial = (key.endsWith(',s') ? originalMaterial.material : originalMaterial) === 1 ? 0 : 1;
    const material = key.endsWith(',s') ? { material: nextMaterial, material_backrest: nextMaterial, material_cushion: nextMaterial } : nextMaterial;
    const changed = calculateSource(product, initial, { material });
    assert.deepEqual(changed.configuration.values.material, material, `${key}/material change`);
    const restored = readSourceState(JSON.stringify({ ...initial, preset: changed.preset }), product);
    assert.deepEqual(calculateSource(product, restored).preset, changed.preset, key);
    assert.deepEqual(calculateSource(product, initial).geometry, original.geometry, key);
    assert.throws(() => readSourceState(JSON.stringify({ ...initial, key: 'wrong,w' }), product));
  }
  assert.equal(sourceProduct('__proto__'), null);
  assert.equal(catalogThumbnailStart('__proto__'), null);
  assert.equal(catalogThumbnailStart('constructor'), null);
});

test('TYPE25 keeps its outside width after size edits and shared-state restoration', () => {
  const product = sourceProduct('658264,w');
  assert.equal(product.shelfType, 8);
  const initial = sourceInitialState(product);
  const changed = calculateSource(product, initial, { width: 160 });
  assert.equal(changed.geometry.width, 1600);
  const restored = readSourceState(JSON.stringify({ ...initial, preset: changed.preset }), product);
  assert.equal(calculateSource(product, restored).geometry.width, 1600);
  assert.equal(calculateSource(product, initial).geometry.width, product.width);
});

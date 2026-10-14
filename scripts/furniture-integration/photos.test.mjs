import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({mockServices:false});
const {furniturePhotoSets,furniturePhotosFor}=await import('../../src/components/storefront/furnitureProductPhotos.ts');
const {catalogFurnitureDesign}=await import('../../src/lib/furniture/catalog-design.ts');
const evidence=JSON.parse(fs.readFileSync(new URL('../../docs/handoffs/furniture-details/source-photos.json',import.meta.url),'utf8'));

test('All six editable catalog products use their observed original gallery bytes locally',()=>{
  assert.equal(furniturePhotoSets.length,6);
  for(const photos of furniturePhotoSets){
    const observed=evidence.find(item=>item.id===photos.id);
    assert.equal(photos.source,observed.source);
    assert.deepEqual(photos.images,observed.assets.map(item=>item.localUrl));
    assert.equal(photos.images.length,photos.id==='wardrobe-1'?7:8);
    assert.equal(new Set(photos.images).size,photos.images.length);
    for(const asset of observed.assets){
      const bytes=fs.readFileSync(new URL('../../public'+asset.localUrl,import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
    }
  }
});

test('Edited dimensions and restored family/colours choose the correct catalog gallery',()=>{
  for(const photos of furniturePhotoSets){
    const design=catalogFurnitureDesign(photos.id);
    assert.equal(furniturePhotosFor(design).id,photos.id);
    design.config.widthMm+=10;
    assert.equal(furniturePhotosFor(JSON.parse(JSON.stringify(design))).id,photos.id);
    assert.equal(furniturePhotosFor(design).family,design.family);
  }
});

test('A colour without captured photos keeps examples within its actual family',()=>{
  for(const photos of furniturePhotoSets){
    const design=catalogFurnitureDesign(photos.id);
    design.color='uncaptured';
    assert.equal(furniturePhotosFor(design,photos.id).id,photos.id);
    assert.equal(furniturePhotosFor(design).family,design.family);
  }
});

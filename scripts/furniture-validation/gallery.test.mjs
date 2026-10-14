import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {load} from './load-ts.mjs';
const {galleryMaterials}=load('src/components/storefront/galleryMaterials.ts');
const reference=JSON.parse(fs.readFileSync('docs/tylko-reference/cases/gallery-materials-001.json','utf8'));
test('12 gallery materials retain all 96 observed URLs and swatches',()=>{
 assert.equal(galleryMaterials.length,12);assert.equal(new Set(galleryMaterials.map(m=>m.id)).size,12);
 for(const material of galleryMaterials){const r=reference.materials.find(r=>r.swatch===material.swatch);assert.ok(r,material.id);assert.equal(material.images.length,8);assert.deepEqual(material.images,r.images);}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { registerHooks } from 'node:module';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
import { Texture, SRGBColorSpace, NoColorSpace, RGFormat, ShaderLib } from 'three';
import { read } from 'three/examples/jsm/libs/ktx-parse.module.js';
installTestLoader({mockServices:false});
registerHooks({load(url,context,next){if(url.endsWith('.json'))return{format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return next(url,context);}});
const {sourceFabric,sofaSourceAssets}=await import('../../src/lib/sofa/source-model.ts');
const {createSourceMaterial}=await import('../../src/lib/sofa/source-material.ts');
const {SOFA_FABRICS,smoothSwatch,fabricMaterialIds}=await import('../../src/lib/sofa/materials.ts');
function sources(){return Array.from({length:4},()=>{const t=new Texture();t.colorSpace=SRGBColorSpace;return t;});}
function dispose(m){new Set([m.map,m.normalMap,m.lightMap,m.sheenRoughnessMap]).forEach(t=>t?.dispose());m.dispose();}
test('sRGB-marked leather and chenille normal source data must be sampled without gamma conversion',()=>{
 for(const id of [15,19]) {
  const f=sourceFabric('smooth',id);
  const file=read(fs.readFileSync('public'+sofaSourceAssets[f.normal].local));
  assert.equal(file.dataFormatDescriptor[0].transferFunction,2,'regression fixture is sRGB-marked');
  const input=sources(),m=createSourceMaterial(f,input,16);
  assert.equal(m.normalMap.colorSpace,NoColorSpace);assert.equal(m.map.colorSpace,SRGBColorSpace);
  assert.equal(m.lightMap.colorSpace,NoColorSpace);assert.equal(m.sheenRoughnessMap.colorSpace,NoColorSpace);
  assert.equal(input[1].colorSpace,SRGBColorSpace,'cached source must not be mutated');dispose(m);
 }
});
test('source weave orientation is applied consistently, and leather has no artificial clearcoat',()=>{
 for(const [id,rotation] of [[0,Math.PI/2],[7,0],[15,0],[19,Math.PI/2],[24,Math.PI/2],[26,Math.PI/2]]) {
  const m=createSourceMaterial(sourceFabric('smooth',id),sources(),16);
  assert.equal(m.map.rotation,rotation);assert.equal(m.normalMap.rotation,rotation);
  if(id===15){assert.equal(m.clearcoat,0);assert.equal(m.roughness,.63);assert.equal(m.sheen,0);}
  if(id===26)assert.deepEqual(m.normalMap.repeat.toArray(),[15,15]);dispose(m);
 }
});
test('all original fabric profiles compile shader overrides against installed Three shader markers',()=>{
 for(const model of ['smooth','uff'])for(let id=0;id<(model==='smooth'?28:15);id++) {
  const f=sourceFabric(model,id);if(!f)continue;
  const input=sources();input[1].format=RGFormat;
  const m=createSourceMaterial(f,input,16),shader={uniforms:{},fragmentShader:ShaderLib.physical.fragmentShader};
  m.onBeforeCompile(shader);
  assert.equal(m.defines.USE_PACKED_NORMALMAP,'');
  assert.ok(shader.fragmentShader.includes('vec3( lightMapTexel.g ) * giScale'));
  assert.ok(shader.fragmentShader.includes('sheenFresnelTerm'));
  if(model==='uff'&&id<9)assert.ok(shader.fragmentShader.includes('hexTilingSampleNormal( normalMap, vNormalMapUv )'));
  else assert.ok(shader.fragmentShader.includes('mapN.z = sqrt('));
  assert.ok(!shader.fragmentShader.includes('#include <normal_fragment_maps>'));dispose(m);
 }
});
test('every selectable Smooth material uses its own original swatch and keeps saved IDs stable',()=>{
 const ids=SOFA_FABRICS.flatMap(f=>fabricMaterialIds(f,'smooth'));
 assert.equal(new Set(ids).size,27);assert.ok(!ids.includes(25));
 assert.deepEqual(fabricMaterialIds(SOFA_FABRICS.find(f=>f.id==='leather'),'smooth'),[15,16,18,17]);
 assert.ok(smoothSwatch(17).image.includes('oat_beige'));assert.ok(smoothSwatch(18).image.includes('willow_green'));
 const provenance=JSON.parse(fs.readFileSync('docs/tylko-reference/sofa-smooth-swatches.json'));
 for(const id of ids){const swatch=smoothSwatch(id),record=provenance.find(r=>r.material===id);assert.equal(swatch.image,record.local);assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public'+swatch.image)).digest('hex'),record.sha256);}
});

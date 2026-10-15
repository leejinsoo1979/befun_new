import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { registerHooks } from 'node:module';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({mockServices:false});
registerHooks({load(url,context,next){if(url.endsWith('.json'))return{format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return next(url,context);}});
const { sourceModule, sourceFabric, sofaSourceAssets } = await import('../../src/lib/sofa/source-model.ts');
const { sofaModules, DEFAULT_SOFA, DEFAULT_UFF } = await import('../../src/lib/sofa/design.ts');
const manifest=JSON.parse(fs.readFileSync('src/lib/sofa/source-assets.json','utf8'));
function bounds(id) {
 const b=fs.readFileSync(`public${sofaSourceAssets[id].local}`);
 const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
 const accessors=gltf.meshes.flatMap(m=>m.primitives.map(p=>gltf.accessors[p.attributes.POSITION]));
 return [0,1,2].map(axis=>Math.max(...accessors.map(a=>a.max[axis]))-Math.min(...accessors.map(a=>a.min[axis])));
}
test('every catalog module has native geometry and matching GI, with catalog-oriented footrests',()=>{
 for(const model of ['uff','smooth']) for(const sofaModule of sofaModules(model)) for(const direction of ['left','right']) {
  const part={module:sofaModule,index:sofaModule.key.startsWith('AR_')?-1:0,armrest:sofaModule.key.startsWith('AR_'),x:0,z:0};
  const result=sourceModule(part,{...(model==='uff'?DEFAULT_UFF:DEFAULT_SOFA),direction});
  assert.ok(result.ids.length>0);
  const size=bounds(result.ids[0]);
  const actualWidth=result.rotation?size[2]:size[0],actualDepth=result.rotation?size[0]:size[2];
  assert.ok(Math.abs(actualWidth-sofaModule.width/1000)<.09,`${model}/${sofaModule.key}: native width ${actualWidth}`);
  assert.ok(Math.abs(actualDepth-sofaModule.depth/1000)<.09,`${model}/${sofaModule.key}: native depth ${actualDepth}`);
  assert.ok(sofaSourceAssets[result.gi]);
 }
});
test('left/right Uff arms and integrated chaise use distinct original geometry and matching lightmaps',()=>{
 for(const key of ['AR_D850_W300','AR_D950_W300','CA_D1500_W1050','CA_D1500_W1150']) {
  const sofaModule=sofaModules('uff').find(m=>m.key===key),armrest=key.startsWith('AR_');
  const part={module:sofaModule,index:armrest?-1:0,armrest,x:0,z:0};
  const left=sourceModule(part,{...DEFAULT_UFF,direction:'left'}),right=sourceModule(part,DEFAULT_UFF);
  assert.notEqual(left.ids[0],right.ids[0]);
  assert.equal(left.gi,`${left.ids[0]}_512`);assert.equal(right.gi,`${right.ids[0]}_512`);
 }
});
test('all defined fabric IDs map to source textures; missing Smooth 25 is never silently substituted',()=>{
 for(const model of ['smooth','uff'])for(let i=0;i<(model==='uff'?15:28);i++) {
  const fabric=sourceFabric(model,i);
  if(model==='smooth'&&i===25){assert.equal(fabric,null);continue;}
  for(const id of [fabric.color,fabric.normal,...(fabric.sheenMap?[fabric.sheenMap]:[])])assert.ok(sofaSourceAssets[id],id);
 }
});
test('local assets retain source bytes, valid format and recorded SHA-256',()=>{
 for(const a of Object.values(manifest)) {
  const b=fs.readFileSync(`public${a.local}`);
  assert.equal(b.length,a.bytes,a.id);
  assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256,a.id);
  assert.equal(b.subarray(0,4).toString('hex'),a.filePath.endsWith('.glb')?'676c5446':'ab4b5458',a.id);
 }
});

test('native feet cover every Smooth/Uff module without fabricated positions or height offsets', async()=>{
 const {sourceFeet}=await import('../../src/lib/sofa/source-feet.ts');
 for(const model of ['smooth','uff']) for(const m of sofaModules(model)) {
  const part={module:m,index:0,x:0,z:0,armrest:m.key.startsWith('AR_')};
  const feet=sourceFeet(part,model);
  assert.ok(fs.existsSync(`public${sofaSourceAssets[feet.asset].local}`));
  assert.equal(feet.positions.length,part.armrest?2:model==='smooth'&&m.id==='S01_FR_D08_W09'?0:model==='smooth'&&m.key.startsWith('FR_')?6:4);
  assert.ok(feet.positions.every(p=>p.every(Number.isFinite)&&p[1]===0));
 }
 const smooth=sofaModules('smooth').find(m=>m.key==='ST_D1000_W875');
 assert.deepEqual(sourceFeet({module:smooth,index:0,x:0,z:0},'smooth').positions,[[.329,0,.386],[.329,0,-.374],[-.329,0,-.374],[-.329,0,.386]]);
 const uff=sofaModules('uff').find(m=>m.key==='ST_D1000_W900');
 assert.deepEqual(sourceFeet({module:uff,index:0,x:0,z:0},'uff').positions,[[.32,0,.37],[-.32,0,.37],[.32,0,-.37],[-.32,0,-.37]]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({mockServices:false});
registerHooks({load(url,context,next){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return next(url,context);}});
const h=await import('../../src/lib/furniture/wardrobe-hinges.ts');
const fixture=JSON.parse(fs.readFileSync(new URL('./hinge-source-fixtures.json',import.meta.url),'utf8'));
const compact=parts=>parts.map(p=>Object.fromEntries(['x1','x2','y1','y2','z1','z2','direction'].map(k=>[k,p[k]])));
test('109 legacy Tone source cases: quantity thresholds, direction and obstacle adjustments',()=>{
 for(const [index,{model,input,expected}]of fixture.fixtures.entries()){
 if(model!=='tone')continue;
 const result=h.generateToneHingeEnvelopes(input);
 assert.deepEqual(compact(result),expected,`source fixture ${index} ${model}`);
 }
});
test('Tone rejects absent raw door offsets',()=>{
 const input=structuredClone(fixture.fixtures.find(f=>f.model==='tone').input);delete input.doors[0].offset;
 assert.throws(()=>h.generateToneHingeEnvelopes(input),/original top\/bottom/);
});
test('closed-pose wings and wall anchors remain separate and use source axes',()=>{
 const source=fixture.fixtures.at(-1).input;
 const hinges=h.generateToneHingeEnvelopes(source);
 const first=source.doors[0],wall={x1:first.x1-9,x2:first.x1+9,y1:0,y2:2400,z1:0,z2:585};
 const out=h.resolveWardrobeHingePlacements('tone',source.doors,[wall],hinges);
 const wing=out.find(p=>p.asset==='hingeWing'&&p.doorIndex===0),anchor=out.find(p=>p.asset==='hingeAnchor'&&p.sourceIndex===wing.sourceIndex);
 assert.ok(wing&&anchor);assert.equal(wing.position[0],(first.x1+20)/10);assert.equal(wing.position[2],((first.z1+first.z2)/2-8)/10);assert.equal(wing.rotationZ,Math.PI);
 assert.equal(anchor.position[0],(wall.x2+20)/10);assert.equal(anchor.rotationZ,Math.PI);assert.equal(anchor.doorIndex,null);assert.equal(anchor.wallIndex,0);
 assert.equal(wing.position[1],anchor.position[1]);
});

test('local reference assets preserve all source vertices and original cm anchors',async()=>{
 const {GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');
 const {wardrobeHingeGeometryFromGltf}=await import('../../src/lib/furniture/wardrobe-hinge-assets.ts');
 const expected={hingeWing:{name:'hinge-wing',count:7735,bounds:[[-2.01356299,-2.84996387,-.32282076],[1.67638920,2.84996275,1.27715925]]},hingeAnchor:{name:'hinge-anchor',count:6152,bounds:[[-1.48688545,-.83748996,-6.70273826],[2.14477628,.83748968,.71339812]]}};
 for(const [asset,spec]of Object.entries(expected)){
  const file=fs.readFileSync(new URL(`../../public/models/wardrobe/${spec.name}.glb`,import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
  const original=gltf.scene.children[0].geometry;
  let disposed=false;original.addEventListener('dispose',()=>{disposed=true;});
  const originalPositions=Array.from(original.getAttribute('position').array);
  const geometry=wardrobeHingeGeometryFromGltf(gltf,asset);
  try{
   assert.ok(disposed,'loaded source geometry is released after cloning');
   assert.equal(geometry.getAttribute('position').count,spec.count);
   const actual=geometry.getAttribute('position').array;
   for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]-originalPositions[i]*100)<1e-6,'every reference vertex survives unit conversion');
   for(const [actualBound,bound]of [[geometry.boundingBox.min.toArray(),spec.bounds[0]],[geometry.boundingBox.max.toArray(),spec.bounds[1]]])
    actualBound.forEach((v,i)=>assert.ok(Math.abs(v-bound[i])<1e-6));
  }finally{geometry.dispose();}
 }
});


test('648 current Edge source configurations reproduce visible hinge bounds',async()=>{
 const {generateEdgeSourceGeometry}=await import('../../src/lib/furniture/wardrobe/edge.ts');
 const cases=JSON.parse(fs.readFileSync(new URL('./edge-hinge-current-source.json',import.meta.url),'utf8'));
 const rounded=parts=>compact(parts).map(p=>Object.fromEntries(Object.entries(p).map(([key,value])=>[key,Math.round(value)])));
 for(const entry of cases.fixtures??cases.cases??cases){
  assert.deepEqual(rounded(generateEdgeSourceGeometry(entry.input).hinges),rounded(entry.expected),JSON.stringify(entry.input));
 }
});

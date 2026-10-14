import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({mockServices:false});
const {wardrobeFullHandleGeometryFromGltf}=await import('../../src/lib/furniture/wardrobe-hardware.ts');
const {resolveEdgeDrawer}=await import('../../src/lib/furniture/wardrobe/drawers.ts');
const bytes=fs.readFileSync(new URL('../../public/models/wardrobe/horizontal-handle-50.glb',import.meta.url));
for(const widthCm of [10,30,60,90])test(`full top handle ${widthCm} cm preserves original section and rigid ends`,async()=>{
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 let source;gltf.scene.traverse(o=>{if(o.isSkinnedMesh)source=o;});
 const p=source.geometry.getAttribute('position'),si=source.geometry.getAttribute('skinIndex'),sw=source.geometry.getAttribute('skinWeight');
 const expected=Array.from({length:p.count},(_,i)=>{
  let dx=0;
  for(let k=0;k<4;k++){
   const b=source.skeleton.bones[si.getComponent(i,k)];
   if(b.name==='left'||b.name==='right')dx+=sw.getComponent(i,k)*((widthCm/100-.002)/2*(b.name==='left'?-1:1)-b.position.x);
  }
  return [(p.getX(i)+dx)*100,p.getY(i)*100,p.getZ(i)*100];
 });
 let disposed=false;source.geometry.addEventListener('dispose',()=>{disposed=true;});
 const g=wardrobeFullHandleGeometryFromGltf(gltf,widthCm);
 try{
  assert.ok(disposed);const actual=g.getAttribute('position');assert.equal(actual.count,expected.length);
  expected.forEach((v,i)=>v.forEach((n,k)=>assert.ok(Math.abs(actual.getComponent(i,k)-n)<.00001)));
  assert.ok(Math.abs(g.boundingBox.max.x-g.boundingBox.min.x-widthCm)<.00001);
  assert.ok(Math.abs(g.boundingBox.min.y+2)<.00001);assert.ok(Math.abs(g.boundingBox.max.y-3)<.00001);
  assert.equal(g.getAttribute('skinIndex'),undefined);assert.ok(g.getAttribute('normal'));assert.ok(g.getAttribute('uv'));
 }finally{g.dispose();}
});
test('external Edge handle follows front upper edge; inlay drawers have no top handle',()=>{
 for(const subtype of ['d','e']){
  const source={x1:0,x2:580,y1:30,y2:180,z1:50,z2:565,subtype};
  const drawer=resolveEdgeDrawer(source,[source],[],'one',0),f=drawer.front;
  if(subtype==='d')assert.equal(f.handle,null);
  else assert.deepEqual(f.handle,{asset:'fullHandleTop',x:f.x,y:f.y+f.h/2,z:f.z,height:null});
 }
});

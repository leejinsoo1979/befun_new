import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Box3,Vector3} from 'three';
import {load} from '../furniture-validation/load-ts.mjs';
const {selectBefunMovento,moventoCadPose}=load('src/lib/three/blum/moventoPlacement.ts');
const {selectMoventoDepth}=load('src/lib/three/blum/moventoDepth.ts');
const {calculateReferenceDrawerPlacement}=load('src/lib/three/reference-hardware.ts');
test('400mm external cabinet does not accept 400mm runner requiring403mm',()=>{
 const selected=selectMoventoDepth({application:'standard',availableInstallationDepthMm:400,requestedDrawerLengthMm:400});
 assert.ok(selected.candidates.every(c=>c.nominalLengthMm<400));
 assert.equal(selectBefunMovento(38.4,2,35).partNumber,'760H3500S');
 assert.equal(selectBefunMovento(30.4,2,27),null);
 assert.equal(selectBefunMovento(35.2,0,34),null);
 assert.equal(selectBefunMovento(35.3,0,34).nominalLengthMm,350);
});
test('real reference drawer has installation room for350 and both material families consume it',()=>{
 for(const family of ['type01','type02']) {
  const p=calculateReferenceDrawerPlacement({family,width:52.8,height:28.2,x:0,y:16,rowIndex:0},40);
  const front=p.reference.parts.find(x=>x.name==='front'),side=p.reference.parts.find(x=>x.name==='side-left');
  assert.equal(selectBefunMovento(p.z+front.z-front.d/2,2,side.d).nominalLengthMm,350);
 }
});
test('supplier originals unchanged; scene unit conversion100 renders full350mm rail, no stretch',async()=>{
 const manifest=JSON.parse(fs.readFileSync('public/models/blum/movento/manifest.json'));
 for(const hand of ['left','right']) {
  const rel=`350/${hand}/model.glb`,buf=fs.readFileSync(`public/models/blum/movento/${rel}`);
  assert.equal(createHash('sha256').update(buf).digest('hex'),manifest.sha256[rel]);
  const gltf=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
  const pose=moventoCadPose(528,32,384,hand);
  gltf.scene.scale.multiplyScalar(pose.scale);gltf.scene.position.set(...pose.position);gltf.scene.updateMatrixWorld(true);
  const bounds=new Box3().setFromObject(gltf.scene),size=bounds.getSize(new Vector3());
  assert.ok(size.z>30&&size.z<39,`${hand} ${size.z}cm`);
  assert.ok(bounds.min.z>=2,`${hand} rear ${bounds.min.z}`);
  assert.ok(bounds.max.z<=40,`${hand} front ${bounds.max.z}`);
 }
});

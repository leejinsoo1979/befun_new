import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({ mockServices: false });
const {createWardrobePanelMaterials,disposeWardrobePanelMaterials,wardrobeCleafUv}=await import('../../src/lib/furniture/wardrobe-panel-materials.ts');
const fixture=JSON.parse(fs.readFileSync(new URL('./cleaf-uv-source.json',import.meta.url),'utf8'));
function materials(){
 const map=new THREE.Texture(),bumpMap=new THREE.Texture();
 const make=()=>{const m=new THREE.MeshStandardMaterial({map,bumpMap});m.userData.wardrobeCleaf=true;return m;};
 return {verticalBase:make(),verticalEdge:make(),horizontalBase:make(),horizontalEdge:make(),backPanel:make()};
}
const cases=[
 {kind:'horizontal',panel:{w:80,h:1.8,d:60,matType:'horizontalBase'},plane:[1.7777777777777777,1.3333333333333333,0,1/6],edge:[42,1.26,0,.32],rotation:Math.PI/2,planes:[2,3]},
 {kind:'vertical',panel:{w:1.8,h:198,d:60,matType:'verticalBase'},plane:[1.3333333333333333,4.4,1/6,0],edge:[138.6,1.26,0,.32],rotation:0,planes:[0,1]},
 {kind:'front',panel:{w:59.6,h:194,d:1.8,matType:'backPanel'},plane:[1.3244444444444443,4.311111111111111,.16888888888888892,0],edge:[135.8,1.26,0,.32],rotation:0,planes:[4,5]},
];
test('Cleaf meter repeats, atlas face orientation and bump UV match source panel corners',()=>{
 const shared=materials();
 for(const c of cases){
  const faces=createWardrobePanelMaterials(shared,c.panel);
  assert.equal(faces.length,6);
  for(let face=0;face<6;face++){
   const params=c.planes.includes(face)?c.plane:c.edge;
   const reference=new THREE.Matrix3().setUvTransform(params[2],params[3],params[0],params[1],c.rotation,0,0);
   const mat=faces[face];
   assert.equal(mat.map.flipY,false);assert.equal(mat.map.matrixAutoUpdate,false);
   assert.deepEqual(mat.map.matrix.elements,mat.bumpMap.matrix.elements);
   const unwrapInverse=reference.clone().invert();
   for(const [corner,sourceUV] of Object.entries(fixture.faces[c.kind][face])){
    const actual=new THREE.Vector2(Number(corner[0]),Number(corner[1])).applyMatrix3(mat.map.matrix).applyMatrix3(unwrapInverse);
    // Original edge quads have slight UV skew; four-corner affine fit error is bounded.
    assert.ok(actual.distanceTo(new THREE.Vector2(...sourceUV))<0.000025,`${c.kind} face${face} ${corner}: ${actual.toArray()} != ${sourceUV}`);
   }
  }
  disposeWardrobePanelMaterials(faces);
 }
});
test('UV changes with physical dimensions while original textures remain untouched',()=>{
 const shared=materials();const original=shared.horizontalBase.map;
 const a=createWardrobePanelMaterials(shared,{w:80,h:1.8,d:60,matType:'horizontalBase'});
 const b=createWardrobePanelMaterials(shared,{w:160,h:1.8,d:60,matType:'horizontalBase'});
 assert.equal(b[2].map.repeat.x,a[2].map.repeat.x*2);
 assert.deepEqual(original.repeat.toArray(),[1,1]);assert.deepEqual(original.offset.toArray(),[0,0]);assert.equal(original.matrixAutoUpdate,true);
 assert.notEqual(a[2].map,b[2].map);assert.equal(a[2].map.source,original.source);
 disposeWardrobePanelMaterials(a);disposeWardrobePanelMaterials(b);
});
test('Owned materials and both texture maps dispose once without disposing shared textures',()=>{
 const shared=materials();let sharedDisposals=0,ownedDisposals=0;
 shared.horizontalBase.map.addEventListener('dispose',()=>sharedDisposals++);
 shared.horizontalBase.bumpMap.addEventListener('dispose',()=>sharedDisposals++);
 const faces=createWardrobePanelMaterials(shared,cases[0].panel);
 for(const mat of faces)for(const obj of [mat,mat.map,mat.bumpMap])obj.addEventListener('dispose',()=>ownedDisposals++);
 disposeWardrobePanelMaterials([...faces,...faces]);disposeWardrobePanelMaterials(faces);
 disposeWardrobePanelMaterials(Object.values(shared));disposeWardrobePanelMaterials(null);
 assert.equal(ownedDisposals,18);assert.equal(sharedDisposals,0);
});
test('Non Cleaf remains on the legacy path; invalid Cleaf sizes fail explicitly',()=>{
 const shared=materials();shared.horizontalBase.userData.wardrobeCleaf=false;
 assert.equal(createWardrobePanelMaterials(shared,cases[0].panel),null);
 shared.horizontalBase.userData.wardrobeCleaf=true;
 assert.throws(()=>createWardrobePanelMaterials(shared,{...cases[0].panel,w:NaN}),RangeError);
 const short=wardrobeCleafUv({w:20,h:1.8,d:60,matType:'horizontalBase'});
 assert.equal(short.offset[1],0);assert.ok(Math.abs(short.offset[0]-7/18)<1e-12);
});

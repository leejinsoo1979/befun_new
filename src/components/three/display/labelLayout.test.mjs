import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Group, Mesh, PlaneGeometry, MeshBasicMaterial, Quaternion, Vector3 } from 'three';
import { partLabelLayout } from './labelLayout.ts';
import { assembledClone } from './assembledClone.ts';

const part={id:'panel-0',anchor:[0,20,16],floor:[50,0,100],footprint:[38,32],stage:0,order:0,label:'세로판'};
test('stickers lie on the broad upward face for horizontal, either upright face, and rear panels',()=>{
 for(const [rotation,size] of [[[0,0,0],[90,2,32]],[[0,0,Math.PI/2],[2,38,32]],[[0,0,-Math.PI/2],[2,38,32]],[[Math.PI/2,0,0],[90,38,2]]]) {
  const layout=partLabelLayout({...part,rotation,size});
  const local=new Quaternion(...layout.quaternion);
  const floor=new Quaternion().setFromEuler(new Euler(...rotation));
  const normal=new Vector3(0,0,1).applyQuaternion(local);
  assert.ok(new Vector3(0,0,1).applyQuaternion(floor.clone().multiply(local)).distanceTo(new Vector3(0,1,0))<1e-8);
  for(const x of [-layout.width/2,layout.width/2]) for(const y of [-layout.height/2,layout.height/2]) {
   const corner=new Vector3(x,y,0).applyQuaternion(local).add(new Vector3(...layout.position)).toArray();
   for(let axis=0;axis<3;axis++) {
    if(Math.abs(normal.getComponent(axis))>.99) assert.ok(Math.abs(Math.abs(corner[axis])-size[axis]/2-.035)<1e-8);
    else assert.ok(Math.abs(corner[axis])<size[axis]/2);
   }
  }
 }
});
test('presentation labels preserve the existing panel index and do not invent door or manufacturing labels',()=>{
 assert.equal(partLabelLayout({...part,id:'panel-12',rotation:[0,0,0],size:[90,2,32]}).code,'P13');
 assert.equal(partLabelLayout({...part,id:'door-0',rotation:[0,0,0],size:[42,28,2]}),null);
});
test('AR clone excludes stickers without disposing or altering the live scene',()=>{
 const root=new Group();
 const label=new Mesh(new PlaneGeometry(12,4),new MeshBasicMaterial());
 label.userData={displayDecor:true,displayPartLabel:true};
 root.add(label);
 assert.equal(assembledClone(root).children.length,0);
 assert.equal(root.children[0],label);
 label.geometry.dispose();label.material.dispose();
});

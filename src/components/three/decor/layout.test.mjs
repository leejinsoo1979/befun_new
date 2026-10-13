import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { decorSlots, arrangeDecor } from './layout.ts';
import { assembledClone } from '../display/assembledClone.ts';
const board=(x,y,w,h,d,matType,z=16)=>({x,y,z,w,h,d,matType,castShadow:true,receiveShadow:true});
const shelf=(width=120,height=28,depth=32)=>[
 board(0,1,width,2,depth,'horizontalBase',depth/2),board(0,height+3,width,2,depth,'horizontalBase',depth/2),
 ...[-width/2+1,0,width/2-1].map(x=>board(x,height/2+2,2,height,depth,'verticalBase',depth/2)),
 board(0,height/2+2,width-4,height,2,'backPanel',1),
];
test('decor rests on real floors, clears walls, ceiling and back boards across dimensions',()=>{
 for(const width of [40,60,90,120,232,450]) for(const height of [18,28,38]) for(const depth of [24,32,40]) {
  const slots=decorSlots(shelf(width,height,depth),[],[]),layout=arrangeDecor(slots);
  assert.deepEqual(layout,arrangeDecor(slots));
  for(const p of layout) {
   const s=slots.find(s=>p.id===`decor-${s.row}-${s.index}`);
   assert.equal(p.position[1],s.bottom);
   assert.ok(p.position[0]-p.size[0]/2>=s.left-1e-6&&p.position[0]+p.size[0]/2<=s.right+1e-6);
   assert.ok(p.position[2]-p.size[2]/2>=s.back-1e-6&&p.position[2]+p.size[2]/2<=s.front+1e-6);
   assert.ok(p.size[1]<=s.height);
  }
 }
});
test('shrinking changes book count rather than stretching objects',()=>{
 const slot={left:0,right:30,bottom:2,height:28,back:2,front:30,row:0,index:0};
 const wide=arrangeDecor([slot])[0],narrow=arrangeDecor([{...slot,right:15}])[0];
 assert.equal(wide.kind,'books');assert.equal(narrow.kind,'books');
 assert.ok(narrow.count<wide.count);assert.equal(wide.size[1],narrow.size[1]);assert.equal(wide.size[2],narrow.size[2]);
 assert.equal(arrangeDecor([{...slot,right:7}]).length,0);
});
test('doors and drawers leave occupied cells empty, including open fronts',()=>{
 const panels=shelf();
 const doors=[{x:-30,pivotOffsetX:0,y:16,width:58,height:28}];
 const drawers=[{x:30,y:16,compartmentWidth:58,rowHeight:28}];
 assert.equal(decorSlots(panels,doors,drawers).length,0);
 assert.ok(decorSlots(panels,doors,[]).every(s=>s.left>0));
});
test('split shelves merge, floating dividers limit height and removed floors cannot support decor',()=>{
 const panels=[board(-30,1,60,2,32,'horizontalBase'),board(30,1,60,2,32,'horizontalBase'),board(0,41,120,2,32,'horizontalBase'),board(0,25,2,30,32,'verticalBase')];
 const slots=decorSlots(panels,[],[]);
 assert.ok(slots.length>=2);assert.ok(slots.every(s=>s.right<0||s.left>0));
 assert.equal(decorSlots(panels.filter(p=>p.y!==1),[],[]).length,0);
});
test('AR export excludes props without changing the viewer',()=>{
 const root=new Group(),decor=new Group();decor.userData.displayDecor=true;root.add(decor);
 const m=new Mesh(new BoxGeometry(),new MeshStandardMaterial());decor.add(m);
 assert.equal(assembledClone(root).children.length,0);assert.equal(root.children.length,1);
 m.geometry.dispose();m.material.dispose();
});

test('next-row staggered uprights do not split the usable space below the shelf',()=>{
 const base=shelf(120,28,32);
 const above=board(-25,46,2,28,32,'verticalBase');
 assert.deepEqual(decorSlots([...base,above],[],[]),decorSlots(base,[],[]));
});

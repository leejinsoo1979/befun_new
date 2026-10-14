import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { decorSlots, arrangeDecor, arrangeTopDecor, arrangeShelfDecor } from './layout.ts';
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

test('standing book groups sit at a compartment side, never centered',()=>{
 const slots=Array.from({length:20},(_,i)=>({left:0,right:70,bottom:2,height:28,back:2,front:30,row:i,index:i%4}));
 const books=arrangeDecor(slots).filter(p=>p.kind==='books');assert.ok(books.length>2);
 for(const p of books){assert.ok(p.bookSide==='left'||p.bookSide==='right');assert.ok(Math.min(Math.abs(p.position[0]-p.size[0]/2),Math.abs(70-p.position[0]-p.size[0]/2))<1e-6);}
});

test('one house bird keeps real scale and disappears when the opening becomes too short',()=>{
 const slot={left:0,right:45,bottom:2,height:38,back:2,front:30,row:1,index:0};
 const bird=arrangeDecor([slot]).find(p=>p.kind==='bird');assert.ok(bird);assert.deepEqual(bird.size,[27.8,32.4,15]);
 const bare=arrangeDecor([{...slot,height:30}]).find(p=>p.kind==='bird');assert.deepEqual(bare.size,[27.8,27.6,8.5]);
 assert.equal(arrangeDecor([{...slot,height:26}]).some(p=>p.kind==='bird'),false);
 assert.equal(arrangeDecor(Array.from({length:30},(_,i)=>({...slot,row:i,index:0}))).filter(p=>p.kind==='bird').length,1);
});

test('speaker and dome lamp fit without stretching and survive the large-shelf budget',()=>{
 const slots=Array.from({length:60},(_,i)=>({left:0,right:48,bottom:i*40,height:36,back:0,front:30,row:i,index:0}));
 const layout=arrangeDecor(slots);assert.ok(layout.length<=14);
 for(const kind of ['speaker','lamp','bird'])assert.equal(layout.filter(p=>p.kind===kind).length,1,kind);
 assert.deepEqual(layout.find(p=>p.kind==='speaker').size,[12,34,15]);
 assert.deepEqual(layout.find(p=>p.kind==='lamp').size,[18,25,18]);
 const short=arrangeDecor(slots.map(s=>({...s,height:18})));assert.ok(short.every(p=>p.kind!=='speaker'&&p.kind!=='lamp'));
});

test('low wide tops keep full-size objects supported and the middle clear',()=>{
 for(const w of [100,120,179,180,232,450]) for(const d of [24,32,40]) {
  const panels=shelf(w,58,d),items=arrangeTopDecor(panels);
  assert.equal(items.length,w>=180?3:2);
  for(const p of items){
   assert.equal(p.position[1],62);
   assert.ok(p.position[0]-p.size[0]/2>=-w/2+3);
   assert.ok(p.position[0]+p.size[0]/2<=w/2-3);
   assert.ok(p.position[2]-p.size[2]/2>=3);
   assert.ok(p.position[2]+p.size[2]/2<=d-3);
   assert.ok(p.position[0]+p.size[0]/2<=-w*.1 || p.position[0]-p.size[0]/2>=w*.1);
  }
  assert.deepEqual(items.find(p=>p.kind==='lamp').size,[18,25,18]);
  const combined=arrangeShelfDecor(panels,[],[]);
  for(const k of ['bird','lamp'])assert.equal(combined.filter(p=>p.kind===k).length,1);
  assert.ok(combined.length<=14);
 }
});
test('tall narrow shallow and unsupported tops do not receive forced scaled props',()=>{
 assert.equal(arrangeTopDecor(shelf(90,58,32)).length,0);
 assert.equal(arrangeTopDecor(shelf(200,108,32)).length,0);
 assert.equal(arrangeTopDecor(shelf(100,90,32)).length,0);
 assert.equal(arrangeTopDecor(shelf(150,58,12)).length,0);
 const split=[board(-50,61,20,2,32,'horizontalBase'),board(50,61,20,2,32,'horizontalBase'),board(0,1,120,2,32,'horizontalBase')];
 assert.equal(arrangeTopDecor(split).length,0);
 assert.deepEqual(arrangeTopDecor([]),[]);
});

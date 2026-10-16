import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { cinematicShot, cinematicAssemblyTime, CINEMATIC_HOLD } from './cinematic.ts';

const input={phase:'assembling',progress:0,outro:0,width:240,height:160,depth:40,aspect:1.6,focus:[0,65,20],stage:{width:400,height:240,depth:500,center:[0,100,250]}};
test('cinematic shots are finite and frame both portrait and wide furniture',()=>{
 for(const aspect of [.46,1,2]) for(const width of [40,240,450]) for(const phase of ['assembling','disassembling']) {
  for(let i=0;i<=100;i++) {
   const shot=cinematicShot({...input,aspect,width,phase,progress:i/100});
   assert.ok([...shot.position,...shot.target].every(Number.isFinite));
   assert.ok(shot.position[1]>shot.target[1]);
   assert.ok(shot.position[2]>shot.target[2]);
  }
 }
});
test('continuous opening and closing shots; closing target is the full furniture centre',()=>{
 let prior;
 for(let i=0;i<=1000;i++) {
  const shot=cinematicShot({...input,progress:i/1000});
  if(prior) assert.ok(Math.hypot(...shot.position.map((v,j)=>v-prior.position[j]))<10);
  prior=shot;
 }
 const last=cinematicShot({...input,progress:1,outro:1});
 assert.deepEqual(last.target,[0,80,20]);
 const repeat=cinematicShot({...input,progress:1,outro:1});
 assert.deepEqual(last,repeat,'pause/re-render must not advance camera');
});


test('cinematic pacing adds a true settling pause and preserves timeline endpoints',()=>{
  const start=.7+1.65;
  assert.equal(cinematicAssemblyTime(start+.05,5),start);
  assert.equal(cinematicAssemblyTime(start+.10,5),start);
  assert.ok(Math.abs(cinematicAssemblyTime(10+4*CINEMATIC_HOLD,5)-10)<1e-8);
  let previous=0;
  for(let t=0;t<15;t+=.01) {const mapped=cinematicAssemblyTime(t,5);assert.ok(mapped>=previous-1e-9);previous=mapped;}
});


test('closing hero shot keeps the entire furniture inside portrait and desktop frames',()=>{
 for(const aspect of [.46,1,2]) for(const width of [40,240,450]) {
  const shot=cinematicShot({...input,aspect,width,progress:1,outro:1});
  const camera=new PerspectiveCamera(40,aspect,.1,10000);
  camera.position.set(...shot.position);camera.lookAt(new Vector3(...shot.target));camera.updateMatrixWorld();
  for(const x of [-width/2,width/2]) for(const y of [0,input.height]) for(const z of [0,input.depth]) {
   const ndc=new Vector3(x,y,z).project(camera);
   assert.ok(Math.abs(ndc.x)<.95&&Math.abs(ndc.y)<.95,`${aspect}/${width}: ${ndc.toArray()}`);
  }
 }
});

test('working camera follows left/right connectors and reveals the rear brace',()=>{
 const left=cinematicShot({...input,progress:.5,focus:[-90,65,20],kind:'upright'});
 const right=cinematicShot({...input,progress:.5,focus:[90,65,20],kind:'upright'});
 assert.ok(left.target[0]<right.target[0]);
 assert.ok(left.position[0]>left.target[0]);
 assert.ok(right.position[0]<right.target[0]);
 const back=cinematicShot({...input,progress:.5,kind:'back'});
 assert.ok(back.position[2]<back.target[2],'show the rear face for brace fastening');
});

test('disassembly follows individual pieces and ends with the floor layout instead of an isometric preset',()=>{
 const left=cinematicShot({...input,phase:'disassembling',progress:.4,elapsed:8,focus:[-80,90,30],extent:[2,38,32]});
 const right=cinematicShot({...input,phase:'disassembling',progress:.4,elapsed:8,focus:[80,90,30],extent:[2,38,32]});
 assert.equal(left.target[0],-80);
 assert.equal(right.target[0],80);
 const opening=cinematicShot({...input,phase:'disassembling',progress:0,elapsed:0});
 assert.deepEqual(opening.target,[0,80,20]);
 const closing=cinematicShot({...input,phase:'disassembling',progress:1,elapsed:30,outro:1});
 assert.deepEqual(closing.target,[0,5,250]);
 assert.deepEqual(closing,cinematicShot({...input,phase:'disassembling',progress:1,elapsed:30,outro:1}));
});

test('disassembly closing shot frames every floor-layout corner on desktop and 390px',()=>{
 for(const aspect of [.46,.91,1.6,2.5]) {
  const shot=cinematicShot({...input,phase:'disassembling',aspect,progress:1,outro:1});
  const camera=new PerspectiveCamera(40,aspect,1,5000);
  camera.position.set(...shot.position);camera.lookAt(new Vector3(...shot.target));camera.updateMatrixWorld();
  for(const x of [-200,200]) for(const y of [0,10]) for(const z of [0,500]) {
   const ndc=new Vector3(x,y,z).project(camera);
   assert.ok(Math.abs(ndc.x)<.95&&Math.abs(ndc.y)<.95&&ndc.z<1,`${aspect}: ${ndc.toArray()}`);
  }
 }
});

test('working shots keep the actual rotated part inside the frame in both directions',()=>{
 for(const phase of ['assembling','disassembling']) for(const aspect of [.46,1,2]) {
  for(const extent of [[2,38,32],[90,2,32],[180,2,40],[2,2,150]]) {
   const shot=cinematicShot({...input,phase,aspect,elapsed:8,progress:.5,extent});
   const camera=new PerspectiveCamera(40,aspect,1,5000);
   camera.position.set(...shot.position);camera.lookAt(new Vector3(...shot.target));camera.updateMatrixWorld();
   for(const x of [-extent[0]/2,extent[0]/2]) for(const y of [-extent[1]/2,extent[1]/2]) for(const z of [-extent[2]/2,extent[2]/2]) {
    const ndc=new Vector3(input.focus[0]+x,input.focus[1]+y,input.focus[2]+z).project(camera);
    assert.ok(Math.abs(ndc.x)<.95&&Math.abs(ndc.y)<.95&&ndc.z<1,`${phase}/${aspect}/${extent}: ${ndc.toArray()}`);
   }
  }
 }
});

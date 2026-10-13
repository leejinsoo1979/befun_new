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

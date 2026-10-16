import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssemblyPlan, partProgress } from './assemblyPlan.ts';
import { playbackTiming, DISASSEMBLY_OUTRO, CINEMATIC_OUTRO } from './cinematic.ts';
import { useDisplayStore } from './displayStore.ts';

const board=(x,y,w,h,matType)=>({x,y,z:16,w,h,d:32,matType,castShadow:true,receiveShadow:true});
const plan=createAssemblyPlan([
 board(0,1,90,2,'horizontalBase'),board(-44,21,2,38,'verticalBase'),
 board(44,21,2,38,'verticalBase'),board(0,41,90,2,'horizontalBase'),
],[],[],90,42,32,2);

test('cinematic disassembly releases one piece at a time, top to bottom, with exact endpoints',()=>{
 const end=playbackTiming(plan,'disassembling',true,0).duration;
 for(let t=0;t<=end;t+=.01) {
  const timing=playbackTiming(plan,'disassembling',true,t);
  const progress=plan.parts.map(p=>partProgress(p,plan,'disassembling',timing.partTime,timing.disassemblyInterval));
  assert.ok(progress.filter(p=>p>0&&p<1).length<=1);
  plan.parts.forEach((part,i)=>{
   if(progress[i]<1) for(const later of plan.parts.filter(p=>p.stage>part.stage)) {
    assert.equal(partProgress(later,plan,'disassembling',timing.partTime,timing.disassemblyInterval),0);
   }
  });
 }
 const timing=playbackTiming(plan,'disassembling',true,end);
 assert.equal(timing.outro,1);
 for(const part of plan.parts) assert.equal(partProgress(part,plan,'disassembling',timing.partTime,timing.disassemblyInterval),0);
});

test('both cinematic directions include a closing shot; fixed camera retains the fast layout timing',()=>{
 for(const phase of ['assembling','disassembling']) {
  const timing=playbackTiming(plan,phase,true,0);
  assert.ok(Math.abs(timing.duration-timing.baseDuration-(phase==='assembling'?CINEMATIC_OUTRO:DISASSEMBLY_OUTRO))<1e-9);
  assert.equal(playbackTiming(plan,phase,true,timing.baseDuration).outro,0);
  const closing=playbackTiming(plan,phase,true,timing.duration);
  assert.equal(closing.outro,1);
  for(const part of plan.parts) assert.equal(partProgress(part,plan,phase,closing.partTime,closing.disassemblyInterval),phase==='assembling'?1:0);
 }
 assert.equal(playbackTiming(plan,'disassembling',false,0).duration,plan.disassemblyDuration);
});

test('each new playback restores cinematic perspective after manual orbit or an isometric projection',()=>{
 useDisplayStore.getState().resetAssembly();
 useDisplayStore.setState({cinematic:false,freeOrbit:true,projection:'orthographic'});
 useDisplayStore.getState().toggleExploded();
 assert.equal(useDisplayStore.getState().cinematic,true);
 assert.equal(useDisplayStore.getState().projection,'perspective');
 assert.equal(useDisplayStore.getState().freeOrbit,false);
 const id=useDisplayStore.getState().playbackId;
 useDisplayStore.getState().toggleExploded();
 assert.equal(useDisplayStore.getState().playbackId,id,'ignore a repeated start while moving');
 useDisplayStore.setState({phase:'laidOut',cinematic:false,freeOrbit:true});
 useDisplayStore.getState().toggleExploded();
 assert.equal(useDisplayStore.getState().phase,'assembling');
 assert.equal(useDisplayStore.getState().cinematic,true);
 useDisplayStore.getState().resetAssembly();
 assert.equal(useDisplayStore.getState().exploded,false);
 assert.equal(useDisplayStore.getState().progress,0);
 useDisplayStore.getState().replay();
 assert.equal(useDisplayStore.getState().autoAssemble,true);
 useDisplayStore.getState().resetAssembly();
});

test('reduced motion is respected on every new playback',()=>{
 const previous=globalThis.window;
 globalThis.window={matchMedia:()=>({matches:true})};
 try {
  useDisplayStore.getState().resetAssembly();
  useDisplayStore.getState().toggleExploded();
  assert.equal(useDisplayStore.getState().cinematic,false);
  useDisplayStore.getState().resetAssembly();
  useDisplayStore.getState().replay();
  assert.equal(useDisplayStore.getState().cinematic,false);
 } finally {
  if(previous===undefined) delete globalThis.window;
  else globalThis.window=previous;
  useDisplayStore.getState().resetAssembly();
 }
});

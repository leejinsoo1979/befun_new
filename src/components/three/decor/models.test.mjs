import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { buildDecor } from './models.ts';
// Geometry regression only; actual texture typography is reviewed in Chrome.
const context={fillRect(){},strokeRect(){},fillText(){},save(){},restore(){},translate(){},rotate(){}};
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
test('detailed asset geometry stays inside its promised real-world footprint',()=>{
 const catalog=[['books',[20.6,24,17],7],['books',[9.4,16,12],3],['stack',[22,7.2,15],3],['vase',[12,25,12],1],['plant',[17,26,17],1],['boxes',[26,13,18],1],['bird',[27.8,32.4,15],1],['speaker',[12,24,15],1],['speaker',[12,34,15],1],['lamp',[18,25,18],1]];
 for(const [kind,size,count] of catalog) for(let variant=0;variant<8;variant++) for(const bookSide of ['left','right']) {
  const p={kind,size,count,variant,id:'test',position:[0,0,0],bookSide};
  const model=buildDecor([p]);const b=new Box3().setFromObject(model.root);
  assert.ok(b.min.y>=-.01,`${kind} sinks below the floor: ${b.min.y}`);
  assert.ok(b.max.y<=size[1]+.01,`${kind} is taller than reserved: ${b.max.y}`);
  assert.ok(Math.max(Math.abs(b.min.x),Math.abs(b.max.x))<=size[0]/2+.01,`${kind} exceeds width`);
  assert.ok(Math.max(Math.abs(b.min.z),Math.abs(b.max.z))<=size[2]/2+.01,`${kind} exceeds depth`);
  assert.ok(b.getSize(new Vector3()).length()>0);model.dispose();
 }
});
test('large arrangements batch meshes by material instead of multiplying draw calls',()=>{
 const list=Array.from({length:14},(_,i)=>({kind:'books',size:[20.6,24,17],count:7,variant:i%8,id:`book-${i}`,position:[i*25,0,0]}));
 const model=buildDecor(list);assert.ok(model.root.children.length<=12);model.dispose();
});

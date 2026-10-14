import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculateDeskGeometry } from '../../src/lib/furniture/desk/index.ts';
const sort=a=>a.sort((x,y)=>JSON.stringify(x).localeCompare(JSON.stringify(y)));
for(const family of ['type01','type02']){
 const fixtures=JSON.parse(fs.readFileSync(new URL(`./cable-${family}-fixtures.json`,import.meta.url)));
 for(const [i,f]of fixtures.entries())test(`${family} Desk cable source case ${i}`,()=>{
  const result=calculateDeskGeometry(f.input);
  assert.deepEqual(sort(result.cableOpenings.map(h=>[h.columnIndex,h.storageIndex,h.surface,h.x,h.y,h.z,h.radius])),f.cableOpenings);
  assert.deepEqual(result.cableOpeningAvailability,f.availability);
  assert.equal(f.ignoresLocalEdge,true);
  for(const h of result.cableOpenings){
   const p=result.panels[h.panelIndex];assert.ok(p);
   assert.equal(p.matType,h.surface==='top'?'horizontalBase':'backPanel');
   assert.ok(h.x-h.radius>=p.x-p.w/2 && h.x+h.radius<=p.x+p.w/2,'full circular cutout stays inside host width');
   if(h.surface==='back')assert.ok(h.y-h.radius>=p.y-p.h/2 && h.y+h.radius<=p.y+p.h/2,'back cutout stays within host height');
   else assert.ok(h.z-h.radius>=p.z-p.d/2 && h.z+h.radius<=p.z+p.d/2,'top cutout stays within host depth');
  }
  assert.deepEqual(result.panels,calculateDeskGeometry({...f.input,cableManagement:'off',channels:f.input.channels.map(c=>({...c,cableOpenings:false}))}).panels,'cable options preserve board boundaries');
 });
}

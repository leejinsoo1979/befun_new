import test from 'node:test';
import assert from 'node:assert/strict';
import modernFixtures from './source-fixtures.json' with { type: 'json' };
import classicFixtures from './type01-source-fixtures.json' with { type: 'json' };
const fixtures = [...modernFixtures, ...classicFixtures];
import { calculateDeskGeometry, availableStorageColumns } from '../../src/lib/furniture/desk/index.ts';
const sorted=a=>a.map(x=>x.map(v=>typeof v==='number'?Math.round(v*1e5)/1e5:v)).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
const panels=a=>sorted(a.map(p=>[p.x,p.y,p.z,p.w,p.h,p.d,p.matType]));
for(const [i,c] of fixtures.entries())test(`Desk source geometry ${i+1}`,()=>{
 const r=calculateDeskGeometry(c.input);
 assert.deepEqual(panels(r.panels),c.panels,'panel dimensions/segmentation');
 assert.deepEqual(panels(r.beams),c.beams,'desk support beam');
 assert.deepEqual(sorted(r.fronts.map(f=>[f.x,f.y,f.width,f.height,f.type,f.hingeSide])),c.fronts,'door/drawer bounds and direction');
 assert.deepEqual(sorted(r.feet.map(f=>[f.x,f.y,f.z])),c.feet,'feet anchors');
 assert.equal(r.bodyHeight+r.footOffset,r.totalHeight);
});
test('Desk rejects unsupported widths and storage counts',()=>{
 assert.deepEqual(availableStorageColumns(899),[]);assert.deepEqual(availableStorageColumns(2401),[]);
 assert.throws(()=>calculateDeskGeometry({widthMm:900,depthMm:400,storageColumns:5,legroomPosition:0,family:'type02',hasBackPanel:false}),RangeError);
});

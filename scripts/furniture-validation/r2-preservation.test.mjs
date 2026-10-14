import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load-ts.mjs';
const { reapplyConnectorSelection } = load('src/lib/optimizer/connectors/reapply.ts');
const { replaceManufacturingBlocks } = load('src/lib/optimizer/connectors/blocks.ts');
const { exportBoringData } = load('src/lib/optimizer/upstream/domain/boring/exporters/index.ts');
const ovvo = { system: 'ovvo', body: 'V-1230P' };
const clip = { ...ovvo, system: 'tylko-clip' };
const boxes = [
  {panelId:'a',kind:'vertical',w:1.8,h:38,d:32,x:0,y:20.8,z:16,frame:{u:2,v:1,n:0}},
  {panelId:'b',kind:'horizontal',w:40,h:1.8,d:32,x:0,y:.9,z:16,frame:{u:0,v:2,n:1}},
];
function fixture() {
  return reapplyConnectorSelection(boxes.map(b => ({id:b.panelId,name:b.kind,width:320,height:380,thickness:18,quantity:1,material:'PB',grain:'N'})), boxes, ovvo).panels;
}
test('R2-QA-01 repeated roundtrip preserves IDs, custom hole/slot and external producer block', () => {
  let panels=fixture();
  const hole={id:'user:r2-hole',type:'custom',face:'top',x:150,y:150,diameter:3,depth:2};
  const slot={id:'user:r2-slot',face:'top',x1:150,y1:250,x2:170,y2:250,width:3,depth:2};
  panels[0].manufacturingBoring.borings.push(hole);
  panels[0].manufacturingBoring.connectorSlots.push(slot);
  replaceManufacturingBlocks(panels[0].manufacturingBoring,'qa-external',['QA external reason']);
  const original=structuredClone(panels);
  for(let i=0;i<3;i++) {
    panels=reapplyConnectorSelection(panels,boxes,clip).panels;
    panels=reapplyConnectorSelection(panels,boxes,ovvo).panels;
    assert.deepEqual(panels.map(p=>p.id),original.map(p=>p.id));
    const data=panels[0].manufacturingBoring;
    assert.deepEqual(data.borings.find(h=>h.id===hole.id),hole);
    assert.deepEqual(data.connectorSlots.find(s=>s.id===slot.id),slot);
    assert.equal(data.manufacturingReady,false);
    assert.ok(data.manufacturingBlockReasons.includes('QA external reason'));
    assert.ok(!data.manufacturingBlockReasons.some(r=>r.includes('클립')));
  }
});
test('R2-QA-02 unattributed manufacturing block remains through connector roundtrip',()=>{
  let panels=fixture(); const data=panels[0].manufacturingBoring;
  data.manufacturingReady=false; delete data.manufacturingBlockReasons; delete data.manufacturingBlockOwnership;
  panels=reapplyConnectorSelection(panels,boxes,clip).panels;
  panels=reapplyConnectorSelection(panels,boxes,ovvo).panels;
  assert.equal(panels[0].manufacturingBoring.manufacturingReady,false);
});
for(const format of ['csv','dxf','mpr','cix']) test(`R2-QA-03 single unconfirmed clip ${format} blocks output`,()=>{
  const panels=reapplyConnectorSelection(fixture(),boxes,clip).panels;
  const result=exportBoringData([panels[0].manufacturingBoring],format);
  assert.equal(result.success,false); assert.deepEqual(result.files,[]);
});
test('QA-R2-02 JSON roundtrip preserves ownership and user machining',()=>{
  let panels=fixture();
  const hole={id:'user:json',type:'custom',face:'top',x:150,y:150,diameter:3,depth:2};
  panels[0].manufacturingBoring.borings.push(hole);
  replaceManufacturingBlocks(panels[0].manufacturingBoring,'other-producer',['External JSON reason']);
  panels=reapplyConnectorSelection(panels,boxes,clip).panels;
  panels=JSON.parse(JSON.stringify(panels));
  panels=reapplyConnectorSelection(panels,boxes,ovvo).panels;
  assert.deepEqual(panels[0].manufacturingBoring.borings.find(h=>h.id===hole.id),hole);
  assert.deepEqual(panels[0].manufacturingBoring.manufacturingBlockOwnership.reasons['other-producer'],['External JSON reason']);
  assert.ok(!panels[0].manufacturingBoring.manufacturingBlockReasons.some(r=>r.includes('클립')));
});
test('QA-R2-04/05 collision blocks export then no connector clears only its collision',()=>{
  let panels=fixture(); const p=panels[1],slot=p.manufacturingBoring.connectorSlots[0];
  const hole={id:'user:collision',type:'custom',face:slot.face,x:(slot.x1+slot.x2)/2,y:(slot.y1+slot.y2)/2,diameter:5,depth:8};
  p.manufacturingBoring.borings.push(hole);
  replaceManufacturingBlocks(p.manufacturingBoring,'other-producer',['Keep unrelated']);
  panels=reapplyConnectorSelection(panels,boxes,ovvo).panels;
  const blocked=panels[1].manufacturingBoring;
  assert.equal(blocked.manufacturingReady,false);
  assert.ok(blocked.manufacturingBlockReasons.some(r=>r.includes('중첩')));
  assert.equal(exportBoringData([blocked],'mpr').success,false);
  panels=reapplyConnectorSelection(panels,boxes,{system:'ovvo'}).panels;
  const cleared=panels[1].manufacturingBoring;
  assert.deepEqual(cleared.manufacturingBlockReasons,['Keep unrelated']);
  assert.deepEqual(cleared.borings.find(h=>h.id===hole.id),hole);
  assert.ok(!cleared.connectorSlots.some(s=>s.id.startsWith('connector:')));
});

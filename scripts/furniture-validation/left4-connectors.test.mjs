import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from './load-ts.mjs';
const {applyConnectors}=load('src/lib/optimizer/connectors/apply.ts');
const {loadConnectorSelection,saveConnectorSelection}=load('src/lib/optimizer/connectors/settings.ts');
const {exportBoringData}=load('src/lib/optimizer/upstream/domain/boring/exporters/index.ts');
const {CLIP_SPEC_PENDING}=load('src/types/connectors.ts');
const ovvo={system:'ovvo',body:'V-1230P',toolNumbers:{'V-1230P':4}},clip={...ovvo,system:'tylko-clip'};
function pair(){
 const boxes=[{panelId:'a',kind:'vertical',w:1.8,h:38,d:32,x:0,y:20.8,z:16,frame:{u:2,v:1,n:0}}, {panelId:'b',kind:'horizontal',w:40,h:1.8,d:32,x:0,y:.9,z:16,frame:{u:0,v:2,n:1}}];
 const panels=boxes.map(b=>({id:b.panelId,name:b.kind,width:(b.kind==='vertical'?b.d:b.w)*10,height:(b.kind==='vertical'?b.h:b.d)*10,thickness:18,quantity:1,material:'PB',grain:'N'}));
 return {panels,boxes};
}
test('QA-L4-01 real settings save/load keeps clip and remembered OVVO tooling',()=>{
 const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 try{saveConnectorSelection(ovvo);saveConnectorSelection(clip);assert.deepEqual(loadConnectorSelection(),clip);saveConnectorSelection(ovvo);assert.deepEqual(loadConnectorSelection(),ovvo);}finally{delete globalThis.localStorage;}
});
test('QA-L4-02 generated cuts removed, custom holes/hinge holes/custom slots unchanged',()=>{
 const {panels,boxes}=pair();applyConnectors(panels,boxes,ovvo);
 const data=panels[0].manufacturingBoring;
 const holes=[{id:'user:42',type:'custom',face:'top',x:12,y:20,diameter:3,depth:2},{id:'blum-hinge:1',type:'hinge',face:'top',x:20,y:150,diameter:5,depth:8}];
 const slot={id:'user:slot',face:'top',x1:12,y1:250,x2:22,y2:250,width:3,depth:2};
 data.borings.push(...holes);data.connectorSlots.push(slot);
 applyConnectors(panels,boxes,clip);
 assert.deepEqual(data.borings,holes);assert.deepEqual(data.connectorSlots,[slot]);
 for(const p of panels){assert.equal(p.manufacturingBoring.manufacturingReady,false);assert.ok(p.manufacturingBoring.manufacturingBlockReasons.includes(CLIP_SPEC_PENDING));}
});
for(const format of ['csv','dxf','mpr','cix'])test(`QA-L4-03 unconfirmed clip ${format} rejects whole mixed batch`,()=>{
 const {panels,boxes}=pair();applyConnectors(panels,boxes,clip);
 const blocked=panels[0].manufacturingBoring,clean={...blocked,panelId:'clean',manufacturingReady:undefined,manufacturingBlockReasons:undefined};
 const result=exportBoringData([clean,blocked],format);
 assert.equal(result.success,false);assert.deepEqual(result.files,[]);assert.ok(result.error.includes(CLIP_SPEC_PENDING));
});
test('QA-L4-04 reapplying OVVO to same panels should clear ONLY obsolete clip block',()=>{
 const {panels,boxes}=pair();applyConnectors(panels,boxes,ovvo);const baseline=structuredClone(panels);
 applyConnectors(panels,boxes,clip);applyConnectors(panels,boxes,ovvo);
 assert.deepEqual(panels,baseline);
});
const {buildBefunShelfModel}=load('src/lib/optimizer/befun/model.ts');
const {toCncPanels}=load('src/lib/optimizer/befun/toCncPanels.ts');
test('QA-L4-05 actual snapshot regeneration returns to identical OVVO plan for six styles',()=>{
 for(const style of ['grid','slant','pattern','mosaic','pixel','gradient']){
 const design={width:171,height:92,depth:32,thickness:2,style,density:63,rowHeights:[28,28,28],numRows:3,hasBackPanel:false,doorsCreatedLayers:[0],drawersCreatedLayers:[],hardwareRowStyles:{},color:'S_Teracotta',colorCategory:'solid'};
 const run=connectors=>toCncPanels(design,buildBefunShelfModel(design),{bodyMaterial:'PB',connectors});
 const first=run(ovvo),middle=run(clip),last=run(ovvo);
 assert.deepEqual(last,first);
 const hingeIds=r=>r.panels.flatMap(p=>(p.manufacturingBoring?.borings??[]).filter(b=>!b.id.startsWith('connector:')).map(b=>[p.id,b]));
 assert.ok(hingeIds(first).length>0, `${style}: hinge fixture must be nonempty`);
 assert.deepEqual(hingeIds(middle),hingeIds(first));
 assert.ok(middle.panels.every(p=>!(p.manufacturingBoring?.connectorSlots??[]).some(s=>s.id.startsWith('connector:'))));
 }
});
test('QA-L4-06 shared hardware anchor and assembly motion agree before entry and after slide',()=>{
 const {clipExample,tylkoClipPose}=load('src/lib/assembly-guide/tylkoClip.ts');
 const {pinPositionInClip,isManufacturingReady}=load('src/components/three/furniture-hardware/connectors/clipContract.ts');
 assert.equal(isManufacturingReady(clipExample.clip,clipExample.pin),false);
 assert.deepEqual(tylkoClipPose(2,1).pinInClip,pinPositionInClip(clipExample.clip,'entered'));
 assert.deepEqual(tylkoClipPose(3,1).pinInClip,pinPositionInClip(clipExample.clip,'locked'));
 assert.deepEqual(tylkoClipPose(4,1).panelOffset,[0,0,0]);
 for(let i=0;i<=100;i++){
 const t=i/100,entry=tylkoClipPose(2,t),slide=tylkoClipPose(3,t);
 assert.equal(entry.pinInClip[0],0);assert.equal(slide.pinInClip[2],0);
 assert.equal(slide.pinInClip[0]+slide.panelOffset[0],clipExample.clip.travelMm);
 }
});

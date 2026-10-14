// Integration regression: real generator → CNC parts, no browser state.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const root=process.cwd(), cache=new Map();
function load(file){let p=path.resolve(root,file);if(!fs.existsSync(p))p+='.ts';if(p.endsWith('.json'))return JSON.parse(fs.readFileSync(p));if(cache.has(p))return cache.get(p).exports;const m={exports:{}};cache.set(p,m);const code=ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const req=id=>id.startsWith('@/')?load('src/'+id.slice(2)):id.startsWith('.')?load(path.resolve(path.dirname(p),id)):require(require.resolve(id,{paths:[root]}));vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:p})(req,m,m.exports);return m.exports;}

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const {connectorPositions,applyConnectors}=load('src/lib/optimizer/connectors/apply.ts');
const {findConnector,OVVO_CONNECTORS}=load('src/lib/optimizer/connectors/ovvo.ts');
const {validateConnectorMachining}=load('src/lib/optimizer/connectors/validation.ts');
const {buildBefunShelfModel}=load('src/lib/optimizer/befun/model.ts');
const {toCncPanels}=load('src/lib/optimizer/befun/toCncPanels.ts');
const spec=findConnector('V-1230P');
test('two panel connector systems are distinct and survive saved JSON',()=>{
 const {PANEL_CONNECTOR_SYSTEMS}=load('src/types/connectors.ts');
 assert.deepEqual(PANEL_CONNECTOR_SYSTEMS.map(s=>s.id),['ovvo','tylko-clip']);
 const saved=JSON.parse(JSON.stringify({system:'tylko-clip',body:'V-1230P',toolNumbers:{'V-1230P':4}}));
 const {panels,boxes}=pair();const report=applyConnectors(panels,boxes,saved);
 assert.equal(report.joints.length,0);assert.deepEqual(report.connectorCount,{});
 assert.ok(panels.every(p=>p.manufacturingBoring.manufacturingReady===false));
 assert.ok(panels.every(p=>!(p.manufacturingBoring.connectorSlots??[]).length));
 const old=pair(),explicit=pair();
 assert.deepEqual(applyConnectors(old.panels,old.boxes,{body:'V-1230P'}),applyConnectors(explicit.panels,explicit.boxes,{system:'ovvo',body:'V-1230P'}));
});
test('switching an existing OVVO plan to clip removes OVVO cuts but preserves custom holes',()=>{
 const {panels,boxes}=pair();applyConnectors(panels,boxes,{body:'V-1230P'});
 panels[0].manufacturingBoring.borings.push({id:'custom-hole',type:'custom',face:'top',x:20,y:20,diameter:3,depth:2});
 applyConnectors(panels,boxes,{system:'tylko-clip',body:'V-1230P'});
 assert.deepEqual(panels[0].manufacturingBoring.borings.map(b=>b.id),['custom-hole']);
 assert.ok(panels.every(p=>(p.manufacturingBoring.connectorSlots??[]).length===0));
 const unknown=pair();applyConnectors(unknown.panels,unknown.boxes,{system:'unknown-system',body:'V-1230P'});
 assert.ok(unknown.panels.every(p=>p.manufacturingBoring.manufacturingReady===false));
});
const panelData=(extra={})=>({panelId:'p',furnitureId:'befun',furnitureName:'Befun',panelName:'test',panelType:'shelf',width:400,height:320,thickness:18,material:'PB',grain:'N',borings:[],...extra});
const slot=(id,face,y=50)=>({id,face,x1:80,y1:y,x2:100,y2:y,width:9.4,depth:12.5,connector:'V-1230P',toolNumber:1});
function pair(){
 const boxes=[{panelId:'a',meshName:'vertical',kind:'vertical',w:1.8,h:38,d:32,x:0,y:20.8,z:16,frame:{u:2,v:1,n:0}},
 {panelId:'b',meshName:'horizontal',kind:'horizontal',w:40,h:1.8,d:32,x:0,y:.9,z:16,frame:{u:0,v:2,n:1}}];
 const panels=boxes.map(b=>({id:b.panelId,name:b.meshName,width:(b.kind==='vertical'?b.d:b.w)*10,height:(b.kind==='vertical'?b.h:b.d)*10,thickness:18,quantity:1,material:'PB',grain:'N'}));
 return {panels,boxes};
}
test('short joints never violate minimum edge distance; infeasible edge maximum is rejected',()=>{
 assert.deepEqual(connectorPositions(50,spec),[]);assert.deepEqual(connectorPositions(200,spec),[]);
 assert.deepEqual(connectorPositions(160,spec),[80]);assert.deepEqual(connectorPositions(220,spec),[35,185]);
 assert.deepEqual(connectorPositions(NaN,spec),[]);
});
test('all catalog spacing output obeys every spacing constraint over 1..1200 mm',()=>{
 for(const s of OVVO_CONNECTORS)for(let length=1;length<=1200;length++){
  const ps=connectorPositions(length,s);if(!ps.length)continue;
  const gaps=ps.slice(1).map((p,i)=>p-ps[i]);
  assert.ok(ps[0]>=s.spacing.edgeMin-1e-7 && length-ps.at(-1)>=s.spacing.edgeMin-1e-7);
  if(s.spacing.edgeMax!==undefined)assert.ok(ps[0]<=s.spacing.edgeMax+1e-7 && length-ps.at(-1)<=s.spacing.edgeMax+1e-7);
  assert.ok(gaps.every(g=>g>=s.spacing.ccMin-1e-7 && g<=s.spacing.ccMax+1e-7));
 }
});
test('paired end/face slots share world centre lines and survive repeat application',()=>{
 const {panels,boxes}=pair();const custom={id:'hinge-existing',type:'custom',face:'top',x:5,y:5,diameter:3,depth:2};
 panels[0].manufacturingBoring=panelData({panelId:'a',borings:[custom],manufacturingReady:false,manufacturingBlockReasons:['existing issue']});
 const r=applyConnectors(panels,boxes,{body:'V-1230P'});assert.equal(r.joints.length,1);assert.equal(r.joints[0].positionsMm.length,2);
 const world=(box,op,endpoint)=>{
  const p=[0,0,0],size=[box.w,box.h,box.d],center=[box.x,box.y,box.z];
  p[box.frame.u]=op['x'+endpoint];p[box.frame.v]=op['y'+endpoint];p[box.frame.n]=op.face==='top'?18:op.face==='bottom'?0:op.z;
  return p.map((v,i)=>v+(center[i]-size[i]/2)*10);
 };
 const a=panels[0].manufacturingBoring.connectorSlots,b=panels[1].manufacturingBoring.connectorSlots;
 for(let i=0;i<a.length;i++)for(const end of [1,2])assert.deepEqual(world(boxes[0],a[i],end).map(x=>+x.toFixed(4)),world(boxes[1],b[i],end).map(x=>+x.toFixed(4)));
 applyConnectors(panels,boxes,{body:'V-1230P'});
 assert.equal(panels[0].manufacturingBoring.connectorSlots.length,2);assert.equal(panels[0].manufacturingBoring.borings[0],custom);
 assert.equal(panels[0].manufacturingBoring.manufacturingReady,false);
 applyConnectors(panels,boxes,{});assert.equal(panels[0].manufacturingBoring.connectorSlots.length,0);assert.equal(panels[0].manufacturingBoring.borings.length,1);
});
test('both mating boards are blocked when thickness is changed without rebuilding geometry',()=>{
 const {panels,boxes}=pair();panels[0].thickness=20;
 const r=applyConnectors(panels,boxes,{body:'V-1230P'});assert.equal(r.joints.length,0);assert.ok(panels.every(p=>p.manufacturingBoring.manufacturingReady===false));
});
test('opposing blind slots cannot meet through an 18 mm board',()=>{
 assert.match(validateConnectorMachining(panelData({connectorSlots:[slot('connector:J1-1-1','top'),slot('connector:J2-1-1','bottom')]})).join(),/양면/);
 assert.deepEqual(validateConnectorMachining(panelData({connectorSlots:[slot('connector:J1-1-1','top'),slot('connector:J2-1-1','bottom',100)]})),[]);
});
test('hinge holes colliding with connector slot travel are found, including crossing paths',()=>{
 const s=slot('connector:J1-1-1','top');
 assert.match(validateConnectorMachining(panelData({connectorSlots:[s],borings:[{id:'blum-hole',face:'top',x:90,y:50,diameter:5,depth:8}]})).join(),/중첩/);
 assert.match(validateConnectorMachining(panelData({connectorSlots:[s,{...slot('connector:J2-1-1','top'),x1:90,y1:30,x2:90,y2:70}]})).join(),/중첩/);
});
test('slot radius and edge plane are validated, not just its endpoints',()=>{
 assert.match(validateConnectorMachining(panelData({connectorSlots:[{...slot('connector:J1-1-1','top'),x1:1}]})).join(),/외곽/);
 assert.match(validateConnectorMachining(panelData({connectorSlots:[{...slot('connector:J1-1-1','left'),z:9}]})).join(),/마구리/);
});
test('intentional two-hole connector housing is not reported as a collision',()=>{
 assert.deepEqual(validateConnectorMachining(panelData({borings:[{id:'connector:J1-1-1-h1',face:'top',x:80,y:50,diameter:10,depth:10},{id:'connector:J1-1-1-h2',face:'top',x:88,y:50,diameter:10,depth:10}]})),[]);
});
test('real generator pipeline marks conflicting machining as non-production',()=>{
 const d={width:232,height:132,depth:32,thickness:2,style:'grid',density:69,rowHeights:[38,28,28,28],numRows:4,hasBackPanel:false,doorsCreatedLayers:[],drawersCreatedLayers:[],hardwareRowStyles:{},color:'S_Teracotta',colorCategory:'solid'};
 const result=toCncPanels(d,buildBefunShelfModel(d),{bodyMaterial:'PB',connectors:{body:'V-1230P',toolNumbers:{'V-1230P':1}}});
 assert.ok(result.connectorReport.joints.length>0);
 const conflicting=result.panels.filter(p=>p.manufacturingBoring?.manufacturingBlockReasons?.some(r=>r.includes('양면')));
 assert.ok(conflicting.length>0);assert.ok(conflicting.every(p=>p.manufacturingBoring.manufacturingReady===false));
});
test('all six styles preserve paired connector coordinates at held-out sizes',()=>{
 for(const style of ['grid','slant','pattern','mosaic','pixel','gradient'])for(const width of [93,237,393])for(const depth of [24,32,40]){
  const d={width,height:92,depth,thickness:2,style,density:63,rowHeights:[28,28,28],numRows:3,hasBackPanel:false,doorsCreatedLayers:[],drawersCreatedLayers:[],hardwareRowStyles:{},color:'S_Teracotta',colorCategory:'solid'};
  const result=toCncPanels(d,buildBefunShelfModel(d),{bodyMaterial:'PB',connectors:{body:'V-1230P'}});
  const world=(box,panel,s,end)=>{
   const values=[0,0,0];values[box.frame.u]=s['x'+end];values[box.frame.v]=s['y'+end];
   values[box.frame.n]=s.face==='top'?panel.thickness:s.face==='bottom'?0:s.z;
   return values.map((v,i)=>v+([box.x,box.y,box.z][i]-[box.w,box.h,box.d][i]/2)*10);
  };
  for(const j of result.connectorReport.joints){
   const a=result.panels.find(p=>p.id===j.endPanelId),b=result.panels.find(p=>p.id===j.facePanelId);
   const ba=result.boxes.find(p=>p.panelId===a.id),bb=result.boxes.find(p=>p.panelId===b.id);
   for(let ci=1;ci<=j.positionsMm.length;ci++){
    const sa=a.manufacturingBoring.connectorSlots.find(s=>s.id===`connector:${j.id}-${ci}-1`);
    const sb=b.manufacturingBoring.connectorSlots.find(s=>s.id===`connector:${j.id}-${ci}-2`);
    assert.ok(sa&&sb);
    for(const end of [1,2]){
     const wa=world(ba,a,sa,end),wb=world(bb,b,sb,end);
     assert.ok(wa.every((v,i)=>Math.abs(v-wb[i])<=0.101),`${style} ${width}/${depth} ${j.id}: ${wa} != ${wb}`);
    }
   }
  }
 }
});
test('production MPR gate rejects a detected connector collision',()=>{
 const {validateMprProduction}=load('src/lib/optimizer/upstream/domain/boring/mprProduction.ts');
 const data=panelData({manufacturingReady:false,manufacturingBlockReasons:['양면 가공이 판재 내부에서 만남']});
 assert.ok(validateMprProduction([data]).some(e=>e.includes('양면')));
});

test('connector blocks survive JSON and clear without removing unrelated restrictions',()=>{
 const {panels,boxes}=pair();applyConnectors(panels,boxes,{body:'V-1230P'});
 panels[0].manufacturingBoring.manufacturingReady=false;
 panels[0].manufacturingBoring.manufacturingBlockReasons=['공장 확인 필요'];
 applyConnectors(panels,boxes,{system:'tylko-clip'});
 const saved=JSON.parse(JSON.stringify(panels));
 applyConnectors(saved,boxes,{body:'V-1230P'});
 assert.equal(saved[0].manufacturingBoring.manufacturingReady,false);
 assert.deepEqual(saved[0].manufacturingBoring.manufacturingBlockReasons,['공장 확인 필요']);
 assert.equal(saved[1].manufacturingBoring.manufacturingReady,undefined);
});
test('an unexplained pre-existing manufacturing block is not cleared by switching',()=>{
 const {panels,boxes}=pair();applyConnectors(panels,boxes,{body:'V-1230P'});
 panels[0].manufacturingBoring.manufacturingReady=false;
 applyConnectors(panels,boxes,{system:'tylko-clip'});
 applyConnectors(panels,boxes,{body:'V-1230P'});
 assert.equal(panels[0].manufacturingBoring.manufacturingReady,false);
});
test('reapply keeps edited panel data and custom machining over repeated settings changes',()=>{
 const {reapplyConnectorSelection}=load('src/lib/optimizer/connectors/reapply.ts');
 const {panels,boxes}=pair();applyConnectors(panels,boxes,{body:'V-1230P'});
 const hole={id:'user:retained',type:'custom',face:'top',x:12,y:120,diameter:3,depth:2};
 const customSlot={id:'user:slot',face:'top',x1:12,y1:160,x2:22,y2:160,width:3,depth:2,connector:'manual'};
 panels[0].name='사용자 판재';panels[0].quantity=3;
 panels[0].manufacturingBoring.borings.push(hole);
 panels[0].manufacturingBoring.connectorSlots.push(customSlot);
 const input=structuredClone(panels);
 let current=panels;
 for(const system of ['tylko-clip','ovvo','tylko-clip','ovvo']){
  current=reapplyConnectorSelection(current,boxes,{system,body:'V-1230P'}).panels;
  assert.equal(current[0].name,'사용자 판재');assert.equal(current[0].quantity,3);
  assert.deepEqual(current[0].manufacturingBoring.borings.find(b=>b.id===hole.id),hole);
  assert.deepEqual(current[0].manufacturingBoring.connectorSlots.find(s=>s.id===customSlot.id),customSlot);
 }
 assert.deepEqual(panels,input);
});
test('collision validation is recalculated when connector settings change',()=>{
 const {reapplyConnectorSelection}=load('src/lib/optimizer/connectors/reapply.ts');
 const {panels,boxes}=pair();applyConnectors(panels,boxes,{body:'V-1230P'});
 const data=panels[1].manufacturingBoring,s=data.connectorSlots[0];
 data.borings.push({id:'user:collision',type:'custom',face:s.face,x:(s.x1+s.x2)/2,y:(s.y1+s.y2)/2,diameter:3,depth:2});
 const blocked=reapplyConnectorSelection(panels,boxes,{body:'V-1230P'});
 assert.equal(blocked.panels[1].manufacturingBoring.manufacturingReady,false);
 assert.ok(blocked.panels[1].manufacturingBoring.manufacturingBlockOwnership.reasons['connector-validation'].length);
 const cleared=reapplyConnectorSelection(blocked.panels,boxes,{});
 assert.equal(cleared.panels[1].manufacturingBoring.manufacturingReady,undefined);
 assert.equal(cleared.panels[1].manufacturingBoring.borings[0].id,'user:collision');
});

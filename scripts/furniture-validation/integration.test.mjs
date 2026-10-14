import test from 'node:test';import assert from 'node:assert/strict';import {load} from './load-ts.mjs';
const {buildBefunShelfModel}=load('src/lib/optimizer/befun/model.ts');
const {toCncPanels}=load('src/lib/optimizer/befun/toCncPanels.ts');
const {createAssemblyPlan,footPanelIndex}=load('src/components/three/display/assemblyPlan.ts');
const {calculateShortFeet}=load('src/lib/three/reference-feet.ts');
const {parseSavedDesign}=load('src/components/storefront/savedDesign.ts');
const {restoreSavedConfiguration,currentConfiguration}=load('src/components/storefront/configuration.ts');
const {useShelfStore:shelf}=load('src/stores/useShelfStore.ts');
const {serializeDesignConfig,deserializeDesignConfig}=load('src/lib/sharing.ts');
const fixture={width:393,height:72,depth:40,thickness:2,style:'pattern',density:66,rowHeights:[38,28],numRows:2,hasBackPanel:false,doorsCreatedLayers:[0],drawersCreatedLayers:[0],hardwareRowStyles:{0:22},color:'S_Teracotta',colorCategory:'solid'};
for(const style of ['grid','slant','pattern','mosaic','pixel','gradient']) for(const width of [90,232,393]) test(`${style}/${width}: same generated boards reach assembly and CNC; feet assigned`,()=>{
 const d={...fixture,style,width};const model=buildBefunShelfModel(d), before=structuredClone(model);
 const assembly=createAssemblyPlan(model.panels,model.doors,model.drawers,d.width,d.height,d.depth,d.thickness),cnc=toCncPanels(d,model);
 assert.equal(assembly.parts.length,model.panels.length+model.doors.length+model.drawers.length);
 // Match board geometry as a multiset, not by array order or a fabricated stable ID.
 const key=p=>[p.x,p.y,p.z,p.w,p.h,p.d].map(n=>Math.round(n*1e7)/1e7).join('/');
 assert.deepEqual(cnc.boxes.filter(b=>!['door','drawer'].includes(b.kind)).map(key).sort(),model.panels.map(key).sort());
 const anchors=assembly.parts.filter(p=>p.id.startsWith('panel-')).map(p=>p.anchor.join('/')).sort();
 assert.deepEqual(anchors,model.panels.map(p=>[p.x,p.y,p.z].join('/')).sort());
 // CNC exporter rounds to 0.1 mm (toCncPanels.ts:9): max rounding error 0.05 mm; not a manufacturing tolerance.
 const byId=new Map(cnc.panels.map(p=>[p.id,p]));
 for(const box of cnc.boxes){const p=byId.get(box.panelId),dims=[box.w,box.h,box.d];assert.ok(p);assert.ok(Math.abs(p.width-dims[box.frame.u]*10)<=0.05+1e-8);assert.ok(Math.abs(p.height-dims[box.frame.v]*10)<=0.05+1e-8);}
 assert.equal(cnc.boxes.filter(b=>b.kind==='door').length,model.doors.length);
 assert.equal(cnc.boxes.filter(b=>b.kind==='drawer').length,model.drawers.reduce((n,p)=>n+(p.reference?.parts.length??5),0));
 for(const pos of calculateShortFeet(model.panels,d.depth,['mosaic','pixel'].includes(style))){const owner=footPanelIndex(model.panels,pos);assert.ok(owner>=0);const p=model.panels[owner];assert.ok(Math.abs(pos[0]-p.x)<=p.w/2+1e-7);assert.ok(Math.abs(pos[2]-p.z)<=p.d/2+1e-7);}
 assert.deepEqual(model,before,'consumers must not mutate generated model');
});
test('local parser / JSON save / actual store restoration preserve hardware and geometry',()=>{
 const parsed=parseSavedDesign(JSON.stringify({version:1,name:'R1-QA synthetic',config:fixture}));assert.ok(parsed);
 const saved=deserializeDesignConfig(serializeDesignConfig(parsed.config));restoreSavedConfiguration(saved);
 const actual=currentConfiguration();assert.deepEqual(actual,saved);
 assert.deepEqual(buildBefunShelfModel({...actual,thickness:2}),buildBefunShelfModel({...saved,thickness:2}));
 shelf.getState().setWidth(200);shelf.getState().setWidth(saved.width);assert.deepEqual(currentConfiguration(),saved);
});
test('width and density edit order yields same existing shelf output',()=>{
 restoreSavedConfiguration(fixture);shelf.getState().setWidth(232);shelf.getState().setDensity(45);const a=buildBefunShelfModel({...currentConfiguration(),thickness:2});
 restoreSavedConfiguration(fixture);shelf.getState().setDensity(45);shelf.getState().setWidth(232);assert.deepEqual(buildBefunShelfModel({...currentConfiguration(),thickness:2}),a);
});

import test from 'node:test';
import {registerHooks} from 'node:module';
import fs from 'node:fs';
registerHooks({load(url,context,next){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return next(url,context);}});
import assert from 'node:assert/strict';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({mockServices:false});
const {createFurnitureDesign,parseFurnitureDesign,furnitureDesignHref}=await import('../../src/lib/furniture/design.ts');
const {applyDeskIntent,deskPanelView}=await import('../../src/lib/furniture/desk-panel.ts');
const {applyWardrobeIntent,wardrobePanelView}=await import('../../src/lib/furniture/wardrobe-panel.ts');
const {generateWardrobe}=await import('../../src/lib/furniture/wardrobe/index.ts');
const {calculateDeskGeometry}=await import('../../src/lib/furniture/desk/index.ts');
const G={scope:'global'};
const edit=(d,id,value,target=G)=>(d.kind==='desk'?applyDeskIntent:applyWardrobeIntent)(d,{type:'set',controlId:id,value,target});
const geometry=d=>d.kind==='desk'?calculateDeskGeometry(d.config):generateWardrobe(d.config);
for(const family of ['desk-classic','desk-modern','wardrobe-edge','wardrobe-tone'])test(`${family}: edits, URL and saved JSON reproduce the same complete geometry`,()=>{
 let d=createFurnitureDesign(family);
 d=edit(d,'width',d.kind==='desk'?217:314);
 if(d.kind==='desk'){
  d=edit(d,'cableManagement','right');d=edit(d,'legSpace',0);
  d=edit(d,'storageKind','door-drawer',{scope:'section',sectionId:d.sectionIds[0]});
 }else{
  const target={scope:'section',sectionId:d.config.sections[0].id};
  if(d.config.model==='edge'){
   d=edit(d,'facade','middle-open',target);d=edit(d,'sectionDepth','450',target);d=edit(d,'topEdge','off');
  }else{
   d=applyWardrobeIntent(d,{type:'heightMode',controlId:'height',target:G,to:'extended'});
   d=edit(d,'height',279);d=edit(d,'drawerStyle','external',target);d=edit(d,'innerColor','T_Misty');
  }
 }
 const restored=parseFurnitureDesign(JSON.stringify(d));assert.ok(restored);assert.deepEqual(restored,d);assert.deepEqual(geometry(restored),geometry(d));
 const url=new URL(furnitureDesignHref(d),'http://localhost');assert.deepEqual(parseFurnitureDesign(url.searchParams.get('design')),d);
});
test('Wardrobe stale section and invalid option writes cannot reset another section',()=>{
 const d=createFurnitureDesign('wardrobe-edge');
 for(const [id,value]of [['height',1.5],['width',NaN],['depth','530'],['color','S_Gray'],['layout','made-up']])assert.equal(edit(d,id,value),d);
 assert.equal(edit(d,'facade','open',{scope:'section',sectionId:'removed'}),d);
 const tone=createFurnitureDesign('wardrobe-tone');assert.equal(edit(tone,'height','nonsense'),tone);
 const restored=applyWardrobeIntent(applyWardrobeIntent(tone,{type:'heightMode',controlId:'height',target:G,to:'extended'}),{type:'heightMode',controlId:'height',target:G,to:'standard'});
 assert.equal(restored.config.heightMm,2370);
});
test('Family identity and malformed saved states fail closed',()=>{
 for(const family of ['desk-classic','desk-modern','wardrobe-edge','wardrobe-tone']){
  const d=createFurnitureDesign(family);
  for(const bad of [{...d,version:2},{...d,family:'nonexistent'},{...d,color:'missing-material'},{...d,config:{...d.config,widthMm:Infinity}}])assert.equal(parseFurnitureDesign(JSON.stringify(bad)),null);
 }
 const d=createFurnitureDesign('desk-modern');d.config.cableManagement='invalid';assert.equal(parseFurnitureDesign(JSON.stringify(d)),null);
 assert.equal(parseFurnitureDesign('{'),null);
});
test('Every exposed wardrobe layout has finite geometry and remains selectable after restore',()=>{
 for(const family of ['wardrobe-edge','wardrobe-tone']){
  const d=createFurnitureDesign(family),id=d.config.sections[0].id;
  const layouts=wardrobePanelView(d,id).tabs[1].controls.find(c=>c.id==='layout');
  for(const option of layouts.options){
   const next=edit(d,'layout',option.id,{scope:'section',sectionId:id});
   assert.ok(parseFurnitureDesign(JSON.stringify(next)));
   for(const p of geometry(next).panels)for(const key of ['x','y','z','w','h','d'])assert.ok(Number.isFinite(p[key]));
  }
 }
});
test('Wardrobe geometry preserves saved stable IDs across every editable part',()=>{
 for(const family of ['wardrobe-edge','wardrobe-tone']){
  let d=edit(createFurnitureDesign(family),'width',312);
  d.config.sections=d.config.sections.map((s,i)=>({...s,id:`saved-section-${i+20}`}));
  const g=geometry(d),ids=new Set(d.config.sections.map(s=>s.id));
  for(const part of [...g.sections,...g.fronts,...g.bars,...g.openings,...(g.drawers??[])])assert.ok(ids.has(part.id)&&g.sections.includes(part)||ids.has(part.sectionId),`lost section id: ${JSON.stringify(part)}`);
 }
});

test('Restore rejects wardrobe states that silently add sections or replace explicit options',()=>{
 for(const family of ['wardrobe-edge','wardrobe-tone']){
  const d=createFurnitureDesign(family);d.config.widthMm=6000;
  assert.equal(parseFurnitureDesign(JSON.stringify(d)),null);
  for(const id of ['', '  ']){
   const invalid=createFurnitureDesign(family);invalid.config.sections[0].id=id;
   assert.equal(parseFurnitureDesign(JSON.stringify(invalid)),null);
  }
 }
 for(const change of [
  d=>d.config.toneWidthPattern='222222222222',
  d=>d.config.sections[0].facade='open',
  d=>d.config.sections[0].widthMm=123,
  d=>{d.config.widthMm=500;d.config.depthMm=400;},
 ]){
  const d=createFurnitureDesign('wardrobe-tone');change(d);
  assert.equal(parseFurnitureDesign(JSON.stringify(d)),null);
 }
});
test('Every visible Desk color restores only in its family; blank storage IDs fail closed',()=>{
 for(const family of ['desk-classic','desk-modern']){
  const d=createFurnitureDesign(family);
  const colors=deskPanelView(d,null).tabs[0].controls.find(c=>c.id==='color').options;
  for(const color of colors)assert.ok(parseFurnitureDesign(JSON.stringify({...d,color:color.id})),color.id);
  for(const color of family==='desk-classic'?['S_White','W_Olive']:['C_Yellow','W_Olive','S_Black']){
   assert.equal(parseFurnitureDesign(JSON.stringify({...d,color})),null);
  }
  for(const id of ['', '  '])assert.equal(parseFurnitureDesign(JSON.stringify({...d,sectionIds:[id]})),null);
 }
});
test('Tone paired single doors display their actual fixed hinge and reject direction edits',()=>{
 const d=edit(createFurnitureDesign('wardrobe-tone'),'width',110);
 assert.equal(d.config.sections.length,2);
 const fronts=geometry(d).fronts;
 for(const [i,section] of d.config.sections.entries()){
  const control=wardrobePanelView(d,section.id).tabs[1].controls.find(c=>c.id==='doorDirection');
  assert.ok(control);assert.equal(control.enabled,false);
  assert.equal(control.value,i===0?'left':'right');
  assert.equal(control.value,fronts.find(f=>f.sectionId===section.id).hingeSide);
  assert.equal(edit(d,'doorDirection',i===0?'right':'left',{scope:'section',sectionId:section.id}),d);
 }
});
test('Tone editable single-door direction updates the global source direction from any section',()=>{
 let d=edit(createFurnitureDesign('wardrobe-tone'),'width',220);
 assert.equal(d.config.toneWidthPattern,'221');
 const sectionId=d.config.sections[2].id;
 const next=edit(d,'doorDirection','right',{scope:'section',sectionId});
 assert.notDeepEqual(next,d);
 assert.ok(next.config.sections.every(s=>s.doorDirection==='right'));
 assert.ok(geometry(next).fronts.filter(f=>f.type==='door'&&f.sectionId===sectionId).every(f=>f.hingeSide==='right')); 
 assert.deepEqual(parseFurnitureDesign(JSON.stringify(next)),next);
 assert.equal(wardrobePanelView(next,sectionId).tabs[1].controls.find(c=>c.id==='doorDirection').value,'right');
});

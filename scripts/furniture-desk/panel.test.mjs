import test from 'node:test';
import assert from 'node:assert/strict';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({ mockServices: false });
const { createFurnitureDesign, parseFurnitureDesign } = await import('../../src/lib/furniture/design.ts');
const { deskPanelView, applyDeskIntent } = await import('../../src/lib/furniture/desk-panel.ts');
const globalTarget = { scope: 'global' };
const set = (d,controlId,value,target=globalTarget) => applyDeskIntent(d,{type:'set',controlId,value,target});

test('Desk width/count/legroom transitions preserve storage identities and reject stale section writes',()=>{
 let d=createFurnitureDesign('desk-modern');
 const initial=structuredClone(d),originalId=d.sectionIds[0];
 d=set(d,'width',240);assert.equal(d.config.widthMm,2400);assert.equal(d.config.storageColumns,2);assert.equal(d.sectionIds[0],originalId);
 d=set(d,'storageSections',3);const secondId=d.sectionIds[1],thirdId=d.sectionIds[2];
 d=set(d,'storageKind','some-door',{scope:'section',sectionId:secondId});
 d=set(d,'legSpace',3);assert.equal(d.config.channels[1].kind,'some-door');assert.equal(d.sectionIds[1],secondId);
 d=set(d,'width',90);assert.equal(d.config.storageColumns,1);assert.equal(d.config.legroomPosition,1);
 assert.equal(set(d,'storageKind','drawers',{scope:'section',sectionId:thirdId}),d);
 assert.deepEqual(initial,createFurnitureDesign('desk-modern'),'initial design was not mutated');
 assert.deepEqual(parseFurnitureDesign(JSON.stringify(d)),d);
});

test('Desk view uses observed global order and stable selected ID',()=>{
 let d=createFurnitureDesign('desk-modern');d=set(d,'width',180);d=set(d,'storageSections',3);
 const view=deskPanelView(d,d.sectionIds[1]);
 assert.deepEqual(view.tabs[0].controls.map(c=>c.id),['width','height','depth','storageSections','legSpace','backPanel','cableManagement','color']);
 assert.equal(view.selectedSectionId,d.sectionIds[1]);
 assert.ok(view.tabs[1].controls.every(c=>c.target.scope==='section'&&c.target.sectionId===d.sectionIds[1]));
 assert.equal(view.tabs[1].controls[0].options.length,8);
 assert.equal(deskPanelView(d,'deleted-section').selectedSectionId,d.sectionIds[0]);
});

test('Desk intent guards match enabled controls and valid options',()=>{
 let d=createFurnitureDesign('desk-modern');
 for(const [key,value]of [['width',NaN],['depth',32],['storageSections',5],['legSpace',.5],['color','C_Blue']])assert.equal(set(d,key,value),d);
 d=set(d,'storageKind','door',{scope:'section',sectionId:d.sectionIds[0]});
 assert.equal(set(d,'backPanel','off'),d);
 d=set(d,'width',180);d=set(d,'storageSections',1);
 const direction=deskPanelView(d,d.sectionIds[0]).tabs[1].controls.find(c=>c.id==='doorDirection');
 assert.equal(direction.enabled,false,'wide paired doors cannot switch both hinges to one side');
 assert.equal(set(d,'doorDirection','left',{scope:'section',sectionId:d.sectionIds[0]}),d);
 const classic=createFurnitureDesign('desk-classic');
 assert.equal(deskPanelView(classic,null).tabs[0].controls.find(c=>c.id==='backPanel').kind,'notice');
 assert.equal(set(classic,'backPanel','off'),classic);
 assert.equal(set(classic,'color','S_Gray'),classic);
 assert.equal(set(classic,'color','C_Blue').color,'C_Blue');
});

test('Both Desk families keep 570mm clear openings single and split wider fronts',()=>{
 for(const family of ['desk-classic','desk-modern']){
  let d=createFurnitureDesign(family);d=set(d,'width',178.4);d=set(d,'storageSections',1);d=set(d,'legSpace',0);
  const target={scope:'section',sectionId:d.sectionIds[0]};d=set(d,'storageKind','door',target);
  const direction=()=>deskPanelView(d,d.sectionIds[0]).tabs[1].controls.find(c=>c.id==='doorDirection');
  assert.equal(direction().enabled,true);
  d=set(d,'width',178.5);assert.equal(direction().enabled,false);
 }
});


test('Modern Desk offers the observed twelve colours, including the two-colour combination',()=>{
 const d=createFurnitureDesign('desk-modern');
 const options=deskPanelView(d,null).tabs[0].controls.find(c=>c.id==='color').options;
 assert.deepEqual(options.map(o=>o.id),['S_White','S_Gray','Sand+Midnight Blue','S_Olive Green','S_Sage Green','S_Butter Yellow','S_Cotton','S_Teracotta','S_Stone Gray','S_Reisinger Pink','S_Lilac','S_Dark Brown']);
 assert.equal(set(d,'color','S_Black'),d);
 assert.equal(set(d,'color','Sand+Midnight Blue').color,'Sand+Midnight Blue');
});

test('Desk cable selection preserves per-storage state while availability follows backs and drawers',()=>{
 let d=createFurnitureDesign('desk-modern');
 const target={scope:'section',sectionId:d.sectionIds[0]};
 d=set(d,'cableManagement','left');assert.equal(d.config.cableManagement,'left');
 assert.equal(set(d,'cableManagement','middle'),d);
 d=set(d,'cableOpenings','on',target);assert.equal(d.config.channels[0].cableOpenings,true);
 d=set(d,'storageKind','drawers',target);
 let control=deskPanelView(d,target.sectionId).tabs[1].controls.find(c=>c.id==='cableOpenings');
 assert.equal(control.visible,false);assert.equal(set(d,'cableOpenings','off',target),d);
 d=set(d,'storageKind','opening',target);d=set(d,'backPanel','off');
 control=deskPanelView(d,target.sectionId).tabs[1].controls.find(c=>c.id==='cableOpenings');assert.equal(control.visible,false);
 d=set(d,'backPanel','on');
 control=deskPanelView(d,target.sectionId).tabs[1].controls.find(c=>c.id==='cableOpenings');assert.equal(control.visible,true);assert.equal(control.value,'on');
 assert.deepEqual(parseFurnitureDesign(JSON.stringify(d)),d);
});

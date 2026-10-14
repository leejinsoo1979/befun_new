import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import fs from 'node:fs';
registerHooks({load(url,context,next){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return next(url,context);}});
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({mockServices:false});
const {createFurnitureDesign,parseFurnitureDesign}=await import('../../src/lib/furniture/design.ts');
const {deskPanelView,applyDeskIntent}=await import('../../src/lib/furniture/desk-panel.ts');
const {calculateDeskGeometry}=await import('../../src/lib/furniture/desk/index.ts');
const globalTarget={scope:'global'};
for(const family of ['desk-classic','desk-modern']) {
 test(`${family}: global controls and column edits remain distinct`,()=>{
  const d=createFurnitureDesign(family),view=deskPanelView(d,d.sectionIds[0]);
  assert.equal(view.layout,'single');
  assert.deepEqual(view.tabs[0].controls.map(c=>c.id),['width','height','depth','storageSections','legSpace','backPanel','color']);
  const next=applyDeskIntent(d,{type:'set',target:globalTarget,controlId:'cableManagement',value:'right'});
  assert.equal(next.config.cableManagement,'right');
  assert.deepEqual(parseFurnitureDesign(JSON.stringify(next)),next);
 });
 test(`${family}: back-panel switch removes only optional open-storage backs`,()=>{
  let d=createFurnitureDesign(family);
  d=applyDeskIntent(d,{type:'set',target:{scope:'section',sectionId:d.sectionIds[0]},controlId:'storageKind',value:'drawer'});
  const before=calculateDeskGeometry(d.config);
  const next=applyDeskIntent(d,{type:'set',target:globalTarget,controlId:'backPanel',value:'off'});
  const after=calculateDeskGeometry(next.config);
  assert.equal(next.config.hasBackPanel,false);
  assert.deepEqual(before.fronts,after.fronts);
  assert.deepEqual(before.columns,after.columns);
  assert.ok(after.panels.filter(p=>p.matType==='backPanel').length<before.panels.filter(p=>p.matType==='backPanel').length);
  assert.ok(after.panels.some(p=>p.matType==='supportPanel'));
  assert.deepEqual(parseFurnitureDesign(JSON.stringify(next)),next);
 });
}

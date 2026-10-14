import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registerHooks} from 'node:module';
import {installTestLoader} from '../storefront-save-validation/loader.mjs';
registerHooks({load(url,context,next){if(url.endsWith('.json'))return{format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return next(url,context);}});
installTestLoader({mockServices:false});
const {createFurnitureDesign,parseFurnitureDesign}=await import('../../src/lib/furniture/design.ts');
const {applyWardrobeIntent,wardrobePanelView}=await import('../../src/lib/furniture/wardrobe-panel.ts');
const {generateWardrobe}=await import('../../src/lib/furniture/wardrobe/index.ts');
const edit=(d,id,value,target={scope:'global'})=>applyWardrobeIntent(d,{type:'set',controlId:id,value,target});
test('Cleaf finishes preserve exact wood family and round fronts across restore',()=>{
 let d=edit(createFurnitureDesign('wardrobe-edge'),'finish','wood');
 assert.equal(d.color,'E_LightCleaf');assert.equal(d.config.edgeVeneer,true);
 const wood=generateWardrobe(d.config);assert.ok(wood.fronts.length);assert.ok(wood.fronts.every(f=>f.handle?.asset==='ringHandle'));
 d=edit(d,'color','E_DarkCleaf');const restored=parseFurnitureDesign(JSON.stringify(d));assert.deepEqual(restored,d);
 assert.deepEqual(generateWardrobe(restored.config),generateWardrobe(d.config));
 d=edit(d,'finish','paint');assert.equal(d.config.edgeVeneer,false);assert.ok(generateWardrobe(d.config).fronts.every(f=>f.handle?.asset.startsWith('fullHandle')));
});
test('Rear cable selections cut only selected source levels and survive restore',()=>{
 let d=createFurnitureDesign('wardrobe-edge');const id=d.config.sections[0].id,target={scope:'section',sectionId:id};
 const controls=wardrobePanelView(d,id).tabs.flatMap(t=>t.controls).filter(c=>c.id.startsWith('cable-'));
 assert.ok(controls.length);d=edit(d,controls[0].id,'on',target);
 const source=generateWardrobe(d.config).sourceGeometryMm;assert.equal(source.cable_management.length,1);assert.equal(source.cable_management[0].radius,30);
 assert.deepEqual(parseFurnitureDesign(JSON.stringify(d)),d);
 d=edit(d,controls[0].id,'off',target);assert.equal(generateWardrobe(d.config).sourceGeometryMm.cable_management.length,0);
});
test('Tone crossbars appear in layout glyph even when neither crosses column center',()=>{
 const d=createFurnitureDesign('wardrobe-tone');d.config.depthMm=400;
 const layouts=wardrobePanelView(d,d.config.sections[0].id).tabs.flatMap(t=>t.controls).find(c=>c.id==='layout');
 assert.ok(layouts.options.some(o=>o.glyph?.rails.length));
 for(const option of layouts.options)assert.equal(new Set(option.glyph?.rails).size,option.glyph?.rails.length);
});

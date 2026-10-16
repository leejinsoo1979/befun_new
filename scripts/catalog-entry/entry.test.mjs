import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registerHooks} from 'node:module';
import {installTestLoader} from '../storefront-save-validation/loader.mjs';
registerHooks({load(url,context,next){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return next(url,context);}});
installTestLoader({mockServices:false});
const {catalogThumbnailStart}=await import('../../src/lib/catalog-entry/starts.ts');
const {introVariants}=await import('../../src/components/storefront/introVariants.ts');
const {downloadedItem,downloadedItems}=await import('../../src/lib/catalog-expansion/server.ts');
const {DOWNLOADED_CATEGORIES}=await import('../../src/lib/catalog-expansion/categories.ts');
const {catalogFurnitureDesign}=await import('../../src/lib/furniture/catalog-design.ts');
const {parseFurnitureDesign}=await import('../../src/lib/furniture/design.ts');
const presets=JSON.parse(fs.readFileSync(new URL('../../src/lib/three/catalog-presets.json',import.meta.url),'utf8'));
const starts=JSON.parse(fs.readFileSync(new URL('../../src/lib/catalog-entry/starts.json',import.meta.url),'utf8'));
const nativeStarts=['tone-start','edge-start','tone-wall-start','tone-1964607-start','bedside-start'].map(name=>JSON.parse(fs.readFileSync(new URL(`../../src/lib/bookcase/data/${name}.json`,import.meta.url),'utf8')));
test('Every intro photograph resolves its own downloaded product, with exact original image pair',()=>{
 let count=0;
 for(const variants of Object.values(introVariants))for(const v of variants){
  const [, ,category,sequence]=v.referenceHref.split('/');const item=v.referenceHref.startsWith('/bookcase-configurator')?downloadedItems('all').find(item=>item.productKey===v.sourceProductKey):downloadedItem(category,Number(sequence));
  assert.ok(item,v.referenceHref);assert.equal(item.productKey,v.sourceProductKey);assert.equal(item.source,v.source);
  assert.equal(item.thumbnail,v.thumbnail);assert.equal(item.studio,v.studio);count++;
 }
 assert.equal(count,79);
});
test('Ready source keys target validated exact shelf or furniture entries, never a family default',()=>{
 for(const [key,start]of Object.entries(starts)){
  if(start.kind==='bookcase'){
   const product=Number(new URL(start.href,'http://localhost').searchParams.get('product'));
   const source=nativeStarts.find(item=>item.sourceId===product);
   assert.ok(source,`missing native source for ${key}`);assert.equal(`${source.sourceId},w`,key);
  }
  else if(start.kind==='shelf')assert.equal(`${presets[start.id].sourceId},${presets[start.id].sourceType==='watty'?'w':'j'}`,key);
  else {const design=catalogFurnitureDesign(start.id);assert.ok(design);assert.deepEqual(parseFurnitureDesign(JSON.stringify(design)),design);}
  assert.ok(!['/configurator','/sofa-configurator','/furniture-design/wardrobe-edge'].includes(start.href));
 }
 for(const key of ['__proto__','constructor','9281730,j','0,w','0,s'])assert.equal(catalogThumbnailStart(key),null);
});
test('All duplicate category memberships inherit the same ready entry; missing starts stay explicitly unassigned',()=>{
 let ready=0;
 for(const c of DOWNLOADED_CATEGORIES)for(const item of downloadedItems(c.key)){
  assert.equal(item.editorHref,catalogThumbnailStart(item.productKey)?.href);
  assert.ok(item.source.startsWith('https://tylko.com/'));if(item.editorHref)ready++;
 }
 assert.equal(ready,1035);
 assert.equal(downloadedItem('desk',1).editorHref,'/reference-product/desk-1');
 assert.equal(downloadedItem('sideboard',1).editorHref,undefined);
});

test('New category actions open the matching source family and preserve existing Classic/Modern entry', async()=>{
 const {categoryConfiguratorHref}=await import('../../src/lib/catalog-entry/category-targets.ts');
 const expected={bookcase:1964243,wallstorage:1964423,wallunits:1964607,bedside_table:657092};
 for(const [category,id] of Object.entries(expected)){
  assert.equal(new URL(categoryConfiguratorHref(category),'http://localhost').searchParams.get('product'),String(id));
 }
 assert.equal(new URL(categoryConfiguratorHref('wallstorage','7'),'http://localhost').searchParams.get('product'),'540446');
 for(const code of ['3','6'])assert.ok(categoryConfiguratorHref('bookcase',code).startsWith('/configurator-intro'));
 assert.ok(categoryConfiguratorHref('wardrobe').startsWith('/configurator-intro'));
 for(const category of ['bedside_table','storage','all'])assert.equal(downloadedItems(category).filter(item=>item.productKey==='657092,w').length,1);
 assert.equal(downloadedItem('bookcase',3).editorHref,starts['1964243,w'].href);
 assert.equal(downloadedItem('wallstorage',4).editorHref,starts['540446,w'].href);
 assert.equal(downloadedItem('wallstorage',7).editorHref,starts['1964423,w'].href);
 assert.equal(new URL(downloadedItem('storage',7).editorHref,'http://localhost').searchParams.get('product'),'1964589','1964589 must open its own exact configuration, never 1964607');
});

test('Sofa new-design entry follows product identity across all downloaded collections', async () => {
 const {catalogNewDesigns}=await import('../../src/lib/catalog-entry/design-targets.ts');
 const broken=downloadedItem('all',8);
 assert.equal(broken.productKey,'113433,s');
 assert.deepEqual(catalogNewDesigns(broken),[['Uff','/sofa-configurator?model=uff'],['Smooth','/sofa-configurator?model=smooth']]);
 let count=0;
 for(const category of DOWNLOADED_CATEGORIES)for(const item of downloadedItems(category.key))if(/^\d+,s$/.test(item.productKey)){
  assert.ok(catalogNewDesigns(item).every(([,href])=>href.startsWith('/sofa-configurator?model=')));count++;
 }
 assert.ok(count>100);
 assert.deepEqual(catalogNewDesigns({productKey:'123,j',categoryKey:'all'}),[['Befun','/configurator']]);
 assert.equal(catalogNewDesigns(downloadedItem('desk',1))[0][1],'/furniture-design/desk-classic');
});

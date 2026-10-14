import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import fs from 'node:fs';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
registerHooks({load(url,context,next){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return next(url,context);}});
installTestLoader({mockServices:false});
const {catalogFurnitureDesign}=await import('../../src/lib/furniture/catalog-design.ts');
const {parseFurnitureDesign,furnitureDesignHref}=await import('../../src/lib/furniture/design.ts');
const {calculateDeskGeometry}=await import('../../src/lib/furniture/desk/index.ts');
const {referenceCatalog}=await import('../../src/components/storefront/referenceCatalog.ts');
const {generateWardrobe}=await import('../../src/lib/furniture/wardrobe/index.ts');
const {applyWardrobeIntent}=await import('../../src/lib/furniture/wardrobe-panel.ts');

test('Every catalog desk opens a valid, independently editable and restorable desk design',()=>{
  for(const product of referenceCatalog.filter(p=>p.category==='desk')){
    const design=catalogFurnitureDesign(product.id);
    assert.equal(design?.kind,'desk',product.id);
    const url=new URL(furnitureDesignHref(design),'http://localhost');
    const restored=parseFurnitureDesign(url.searchParams.get('design'));
    assert.deepEqual(restored,design);
    assert.deepEqual(calculateDeskGeometry(restored.config),calculateDeskGeometry(design.config));
    design.config.channels[0].kind='door';
    assert.notDeepEqual(catalogFurnitureDesign(product.id),design);
  }
});
test('Catalog starts preserve observed widths, depths and legroom positions instead of the intro defaults',()=>{
  const expected=[[2000,600,2,1],[2400,500,4,0],[1600,500,2,1]];
  for(let index=0;index<expected.length;index++){
    const c=catalogFurnitureDesign(`desk-${index+1}`).config;
    assert.deepEqual([c.widthMm,c.depthMm,c.storageColumns,c.legroomPosition],expected[index]);
  }
  assert.equal(catalogFurnitureDesign('missing'),null);
});

for (const number of ['001','002','003']) {
  const evidence=JSON.parse(fs.readFileSync(new URL(`../../docs/tylko-reference/cases/wardrobe-catalog-${number}.json`,import.meta.url),'utf8'));
  test(`${evidence.catalogId}: observed source state opens without substituting an intro design`,()=>{
    const design=catalogFurnitureDesign(evidence.catalogId);
    assert.deepEqual(design,evidence.initialDesign);
    assert.equal(referenceCatalog.find(p=>p.id===evidence.catalogId).source,evidence.sourceUrl);
    const restored=parseFurnitureDesign(new URL(furnitureDesignHref(design),'http://localhost').searchParams.get('design'));
    assert.deepEqual(restored,design);
    const geometry=generateWardrobe(design.config);
    assert.deepEqual(geometry.unsupported,evidence.geometryLimitations);
    assert.deepEqual(geometry.sections.map(s=>s.id),design.config.sections.map(s=>s.id));
    assert.ok(geometry.panels.length>0);
    assert.deepEqual(generateWardrobe(restored.config),geometry);
    design.config.sections[0].seriesId='unsupported';
    assert.deepEqual(catalogFurnitureDesign(evidence.catalogId),evidence.initialDesign);
  });
  test(`${evidence.catalogId}: an option edit survives local serialization and URL restore with stable section IDs`,()=>{
    const initial=catalogFurnitureDesign(evidence.catalogId);
    const edited=applyWardrobeIntent(initial,{type:'set',controlId:'width',target:{scope:'global'},value:initial.config.widthMm/10+1});
    assert.equal(edited.config.widthMm,initial.config.widthMm+10);
    assert.deepEqual(edited.config.sections.map(s=>s.id),initial.config.sections.map(s=>s.id));
    const local=parseFurnitureDesign(JSON.stringify(edited));
    const url=parseFurnitureDesign(new URL(furnitureDesignHref(edited),'http://localhost').searchParams.get('design'));
    assert.deepEqual(local,edited);
    assert.deepEqual(url,edited);
    assert.deepEqual(generateWardrobe(url.config).unsupported,evidence.geometryLimitations);
  });
}

test('Unknown wardrobe IDs never fall back to a default Edge design',()=>{
  for(const id of ['wardrobe-0','wardrobe-4','__proto__','constructor']) assert.equal(catalogFurnitureDesign(id),null);
});

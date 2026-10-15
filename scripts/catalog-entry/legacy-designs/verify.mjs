import fs from 'node:fs';
import assert from 'node:assert/strict';
import F from '../../../src/lib/catalog-entry/legacy-designs/upstream/engine.js';
import { PricingCore } from '../../../src/lib/catalog-entry/legacy-designs/upstream/pricing.js';
const products=JSON.parse(fs.readFileSync('src/lib/catalog-entry/legacy-designs/products.json'));
const pricing=new PricingCore(JSON.parse(fs.readFileSync('src/lib/commerce/data/tylko-coefficients-20261014.json')),{priceeee:1,priceeel:'€',regionName:'de'});
const result=[];
for(const source of Object.values(products)){
 const dna=JSON.parse(fs.readFileSync(`src/lib/catalog-entry/legacy-designs/dna/${source.dnaKey}.json`));
 const engine=new F().withDNA(dna);engine.loadPreset(source.preset);
 const price=()=>pricing.calculateJettyPrice({...engine.getGeometry(),shelf_category:source.category},true);
 assert.equal(price(),source.eur,source.key); assert.deepEqual([engine.getGeometry().width,engine.getGeometry().height,engine.getGeometry().depth],[source.width,source.height,source.depth]);
 const config=engine.getConfiguration();const width=config.values.width+1;engine.changeConfiguration({width});assert.equal(engine.getGeometry().width,width*10);assert.ok(price()>0);
 const saved=JSON.parse(JSON.stringify(engine.getPreset()));const edited=JSON.stringify(engine.getGeometry());engine.loadPreset(saved);assert.equal(JSON.stringify(engine.getGeometry()),edited);
 if(source.category==='dressing_table'){engine.changeConfiguration({depth:50});assert.equal(engine.getGeometry().depth,500);assert.equal(engine.getGeometry().height,730);assert.ok(price()>0);}
 else for(const option of config.parameters.furnitureStyle.options.filter(x=>!x.disabled)){engine.loadPreset(source.preset);engine.changeConfiguration({furnitureStyle:option.value});assert.ok(Number.isFinite(price())&&price()>0,source.key+' '+option.value);}
 result.push({key:source.key,initialEur:source.eur,editedEur:price(),saveRoundTrip:true});
}
fs.writeFileSync('docs/handoffs/legacy-priority/edit-verification.json',JSON.stringify(result,null,2));console.log('PASS: 100 exact dimensions/prices, width edits, save round trips; dressing depths and vinyl styles');

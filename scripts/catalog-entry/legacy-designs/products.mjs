import fs from 'node:fs';
import F from '../../../src/lib/catalog-entry/legacy-designs/upstream/engine.js';
import {PricingCore} from '../../../src/lib/catalog-entry/legacy-designs/upstream/pricing.js';
import {renderLegacy} from '../../../src/lib/catalog-entry/legacy-designs/upstream/renderer.js';
const root='src/lib/catalog-entry/legacy-designs';const products={},entries={},audit=[];const assets=new Set();
const price=new PricingCore(JSON.parse(fs.readFileSync('src/lib/commerce/data/tylko-coefficients-20261014.json')),{priceeee:1,priceeel:'€',regionName:'de'});
for(const filename of fs.readdirSync('docs/handoffs/legacy-priority/raw').filter(x=>x.endsWith('.json'))){
 const raw=JSON.parse(fs.readFileSync('docs/handoffs/legacy-priority/raw/'+filename));const key=filename.slice(0,-5);const desk=raw.shelf_category==='dressing_table'; const dnaKey=`${desk?'desk':'bookcase'}-${raw.shelf_type}`;
 const dna=JSON.parse(fs.readFileSync(`${root}/dna/${dnaKey}.json`)); const e=new F().withDNA(dna);e.loadPresetFromJetty(raw);const geometry=e.getGeometry();const eur=price.calculateJettyPrice({...geometry,shelf_category:raw.shelf_category,digital_product_version:raw.digital_product_version},true);
 for(const group of renderLegacy(geometry,raw.shelf_type))for(const segment of group.children)for(const p of segment.geometries)assets.add(p.asset);
 products[key]={key,id:raw.id,shelfType:raw.shelf_type,category:raw.shelf_category,line:raw.shelf_type===0?'classic':'modern',dnaKey,preset:e.getPreset(),width:raw.width,height:raw.height,depth:raw.depth,eur:Number(raw.region_price_in_euro),color:raw.color_name,coversOnly:false,preview:raw.preview_webp??raw.preview,geometry};
 entries[key]={id:`legacy-${key}`,kind:'furniture',href:`/legacy-configurator?product=${raw.id}`};audit.push({key,expected:Number(raw.region_price_in_euro),calculated:eur,dimensions:[geometry.width,geometry.height,geometry.depth],original:[raw.width,raw.height,raw.depth]});
}
fs.writeFileSync(root+'/products.json',JSON.stringify(products));fs.writeFileSync(root+'/entries.json',JSON.stringify(entries));fs.writeFileSync('docs/handoffs/legacy-priority/initial-audit.json',JSON.stringify(audit,null,2));console.log('Products',audit.length,'price differences',audit.filter(x=>x.expected!==x.calculated),'dimension differences',audit.filter(x=>JSON.stringify(x.dimensions)!==JSON.stringify(x.original)));console.log('assets',[...assets]);

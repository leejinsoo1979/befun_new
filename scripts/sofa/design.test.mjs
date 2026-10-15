import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({mockServices:false});
registerHooks({load(url,context,next){if(url.endsWith('.json'))return{format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return next(url,context);}});
const { DEFAULT_SOFA, parseSofaDesign, sofaGeometry, sofaQuote, SOFA_MODULES } = await import('../../src/lib/sofa/design.ts');
const { eurToMarket } = await import('../../src/lib/commerce/eur-quote.ts');
const { quoteSofa } = await import('../../src/lib/commerce/reference-sofa-pricing.ts');
const { shelfQuote } = await import('../../src/lib/commerce/shelf-quote.ts');
const { products,productPrice }=await import('../../src/components/storefront/catalog.ts');

test('observed DE sofa 734: 173cm and €1963, same fixture components',()=>{
 const source=JSON.parse(fs.readFileSync('docs/tylko-reference/pricing-20261014/sofa-734.json'));
 assert.equal(sofaGeometry(DEFAULT_SOFA).width,1730);
 assert.equal(sofaQuote(DEFAULT_SOFA).regularEur,1963);
 assert.equal(quoteSofa(source.seaters).regularEur,Number(source.region_price_in_euro));
});
test('restoration validates module/depth/placement and strips unknown fields',()=>{
 assert.deepEqual(parseSofaDesign(JSON.parse(JSON.stringify(DEFAULT_SOFA))),DEFAULT_SOFA);
 for(const patch of [{seats:[]},{seats:[{key:'fake'}]},{material:NaN},{material:99},{armrests:'all'},{footrest:'ST_D1000_W875'}, {seats:[{key:'ST_D1000_W875'},{key:'ST_D1125_W875'}]}]) assert.equal(parseSofaDesign({...DEFAULT_SOFA,...patch}),null);
 assert.equal(parseSofaDesign({...DEFAULT_SOFA,price:1}).price,undefined);
});
test('every selectable module/fabric has an actual coefficient; missing parts never free',()=>{
 for(const m of SOFA_MODULES) for(const material of [0,7,15,19,24]) assert.equal(quoteSofa([{id:m.id,material}]).status,'available',`${m.id}/${material}`);
 assert.equal(quoteSofa([{id:'S01_FAKE',material:8}]).status,'unavailable');
});
test('arms and footrest change geometry AND price; direction mirrors, not reprices',()=>{
 const withArms={...DEFAULT_SOFA,armrests:'both'};
 assert.equal(sofaGeometry(withArms).width,2210);
 assert.ok(sofaQuote(withArms).regularEur>1963);
 const withFoot={...withArms,footrest:'FR_D625_W875'};
 assert.equal(sofaGeometry(withFoot).totalDepth,2000);
 assert.ok(sofaQuote(withFoot).regularEur>sofaQuote(withArms).regularEur);
 assert.equal(sofaQuote({...withFoot,direction:'left'}).regularEur,sofaQuote(withFoot).regularEur);
 const r=sofaGeometry(withFoot),l=sofaGeometry({...withFoot,direction:'left'});
 assert.ok(r.placed.every((p,i)=>p.x===-l.placed[i].x));
});
test('EUR is canonical; destination currency rounding only once',()=>{
 assert.equal(eurToMarket(1963,'EU'),1963);
 assert.equal(eurToMarket(1963,'KR'),2946090);
 assert.equal(eurToMarket(1963,'US'),2196.20);
 assert.equal(eurToMarket(1963,'JP'),347274);
 assert.throws(()=>eurToMarket(NaN,'EU'));
});
test('observed DE bookcase 9268349: €2646 regular; no invented Club discount',()=>{
 const p=products.find(p=>p.id==='bookcase-brown');
 const price=productPrice(p);
 assert.equal(price.regularEur,2646);
 assert.equal(price.discountRate,0);
 assert.equal(price.finalPrice,price.originalPrice);
});
test('catalogue and edited shelf configurations produce finite quotes',()=>{
 for(const p of products) assert.ok(productPrice(p).regularEur>0,p.id);
 for(const style of ['grid','slant','pattern','mosaic','pixel','gradient']) {
  const input={width:220,height:62,depth:32,thickness:2,density:50,rowHeights:[28,28],numRows:2,hasBackPanel:false,color:'C_White'};
  const base=shelfQuote(style,input,'classic');
  assert.ok(base.regularEur>0);
  assert.ok(shelfQuote(style,{...input,hasBackPanel:true},'classic').regularEur>=base.regularEur);
 }
});

test('observed Uff 316001 uses its own modules, overlap and fixed-cover price',async()=>{
 const {DEFAULT_UFF,sofaModules}=await import('../../src/lib/sofa/design.ts');
 assert.equal(sofaGeometry(DEFAULT_UFF).width,3145);
 assert.equal(sofaGeometry(DEFAULT_UFF).depth,1500);
 assert.equal(sofaGeometry(DEFAULT_UFF).height,730);
 assert.equal(sofaQuote(DEFAULT_UFF).regularEur,2841);
 assert.equal(sofaGeometry(DEFAULT_UFF).placed.filter(p=>p.armrest).length,1);
 const source=JSON.parse(fs.readFileSync('docs/tylko-reference/pricing-20261014/sofa-316001.json'));
 assert.equal(quoteSofa([...source.armrests,...source.seaters,...source.chaise_longue_armrests]).regularEur,Number(source.region_price_in_euro));
 assert.ok(sofaQuote({...DEFAULT_UFF,replaceableCovers:true}).regularEur>2841);
 assert.deepEqual(parseSofaDesign(DEFAULT_UFF),DEFAULT_UFF);
 for(const m of sofaModules('uff')) for(const material of [0,9]) for(const covers of [false,true]) assert.equal(quoteSofa([{id:m.id,material}],covers).status,'available',m.id);
 assert.equal(parseSofaDesign({...DEFAULT_UFF,material:15}),null);
 assert.equal(parseSofaDesign({...DEFAULT_UFF,armrests:'none'}),null);
 assert.equal(quoteSofa([{id:'S01_ST_D1000_W875',material:0},{id:'S02_ST_D10_W09',material:0}]).status,'unavailable');
});

test('Uff assembled joints include arm overlap and seat binding in both directions',async()=>{
 const {DEFAULT_UFF,uffRenderGeometry}=await import('../../src/lib/sofa/design.ts');
 const geometry=uffRenderGeometry(DEFAULT_UFF);
 const arm=geometry.placed.find(p=>p.index===-1);
 const seat=geometry.placed.find(p=>p.index===0);
 const second=geometry.placed.find(p=>p.index===1);
 // Separate arm is seated 50mm into the seat and tightened by 15mm.
 assert.equal((arm.x+arm.module.width/2)-(seat.x-seat.module.width/2),65);
 assert.equal((seat.x+seat.module.width/2)-(second.x-second.module.width/2),20);
 assert.equal(geometry.width,3145);
 const mirrored=uffRenderGeometry({...DEFAULT_UFF,direction:'left'}).placed;
 assert.ok(geometry.placed.every((p,i)=>p.x===-mirrored[i].x));
});

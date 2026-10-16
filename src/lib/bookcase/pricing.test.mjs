import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const load=async file=>{
 const code=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,import.meta.url)}'${p.endsWith('.json')?' with {type:"json"}':''}`);
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
};
const {toneEuro,hasTonePricing}=await load('./pricing.ts');
const {calculate,initialDesign,switchBedsideStyle,readDesign}=await load('./engine.ts');
test('Tone live reference: 314 × 224 × 39 cm pistachio is EUR 4722',()=>{
 const source=read('./fixtures/tone-price-4722.json');
 assert.equal(toneEuro(source.geometry),source.regularEur);
 const local=calculate({version:1,start:'tone',preset:source.preset});
 assert.equal(toneEuro(local.geometry),4722);
 assert.equal(toneEuro(calculate({version:1,start:'tone',preset:source.preset},{material:5}).geometry),5018,'premium matte verified in the original live UI');
});
test('Tone original regular product quotes and edited width match live source',()=>{
 for(const [start,expected] of [['tone',3237],['tone-wall',3921],['tone-1964607',2569]])assert.equal(toneEuro(calculate(initialDesign(start)).geometry),expected,start);
 assert.equal(toneEuro(calculate(initialDesign('tone'),{width:314}).geometry),4463,'original live UI after width change');
});
test('Tone saved edited configurations retain the same canonical EUR price',()=>{
 const design=initialDesign('tone-wall');
 const edited=calculate(design,{width:320,material:4});
 const price=toneEuro(edited.geometry);
 assert.notEqual(price,toneEuro(calculate(design).geometry));
 const restored=calculate(JSON.parse(JSON.stringify({...design,preset:edited.preset})));
 assert.equal(toneEuro(restored.geometry),price);
});

test('All 91 captured minimal, hanging and legs products match original EUR quotes',()=>{
 const products=read('../catalog-entry/source-designs/products.json');
 const counts={6:0,7:0,8:0};
 for(const product of Object.values(products)) {
  if(!Object.hasOwn(counts,product.shelfType))continue;
  counts[product.shelfType]++;
  assert.equal(toneEuro(product.geometry),product.eur,product.key);
 }
 assert.deepEqual(counts,{6:19,7:64,8:8});
});
test('Tone style switching recalculates and shared designs retain the same price',()=>{
 let design=initialDesign('bedside');
 design={...design,preset:calculate(design,{height:65,width:165}).preset};
 const prices=[];
 for(const style of [6,7,8,6]) {
  design=switchBedsideStyle(design,style);
  const snapshot=calculate(design);
  const price=toneEuro(snapshot.geometry);
  assert.ok(price>0);
  assert.equal(snapshot.geometry.shelf_type,style);
  assert.equal(toneEuro(calculate(readDesign(JSON.stringify(design))).geometry),price);
  const wider=calculate(design,{width:180});
  assert.notEqual(toneEuro(wider.geometry),price,'edited width updates quote');
  prices.push(price);
 }
 assert.equal(new Set(prices.slice(0,3)).size,3,'each style uses its own source calculator');
 assert.deepEqual(prices,[3618,3800,4008,3618],'Tylko live UI regular EUR: 657092, width 165, body height 65, depth 36 (2026-10-15)');
 assert.equal(prices[0],prices[3],'returning to original style restores price');
});
test('Unknown product types and malformed geometry cannot produce a substitute price',()=>{
 assert.equal(hasTonePricing(4),false);
 assert.equal(hasTonePricing(undefined),false);
 assert.throws(()=>toneEuro({...calculate(initialDesign('tone')).geometry,shelf_type:4}),/Unsupported/);
 assert.throws(()=>toneEuro({...calculate(initialDesign('bedside')).geometry,width:NaN}),/Invalid/);
});

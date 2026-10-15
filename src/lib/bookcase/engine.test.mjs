import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const url=p=>new URL(p,import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(url(p),'utf8'));
// Compile only the TS wrapper; execute the same unmodified vendor engine as the app.
const code=ts.transpileModule(fs.readFileSync(url('./engine.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from '(\.\/[^']+)'/g,(_,path)=>`from '${url(path)}'${path.endsWith('.json')?' with {type:"json"}':''}`);
const {calculate,initialDesign,readDesign,observedEuro,switchBedsideStyle}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const sorted=items=>items.map(item=>JSON.stringify(canonical(item))).sort();
for(const start of ['tone','tone-wall','tone-1964607','edge']){
 test(`${start}: panel and door coordinates match the captured original product`,()=>{
  const expected=read(`./fixtures/${start}.json`), actual=calculate(initialDesign(start)).geometry;
  for(const dimension of ['width','height','depth'])assert.equal(actual[dimension],expected[dimension],dimension);
  for(const part of ['walls','slabs','doors','backs','hinges'])assert.deepEqual(sorted(actual[part]),sorted(expected[part]),part);
 });
 test(`${start}: editing, serializing and interleaving lineups preserve configuration`,()=>{
  const before=initialDesign(start);const initial=calculate(before);
  const after=calculate(before,{width:initial.configuration.values.width+5});
  assert.notEqual(after.geometry.width,initial.geometry.width);
  const design={...before,preset:after.preset};
  assert.deepEqual(calculate(readDesign(JSON.stringify(design))).geometry,after.geometry);
  calculate(initialDesign(start==='edge'?'tone':'edge'));
  assert.deepEqual(calculate(before).geometry,initial.geometry);
  assert.equal(observedEuro(design),null,'never quote the initial price for a different size');
  assert.ok(observedEuro(before)>0);
 });
}
test('invalid shared designs are rejected',()=>{
 for(const raw of ['null','{}','{"version":1,"start":"__proto__","preset":{}}','x'.repeat(50001)])assert.throws(()=>readDesign(raw));
});

test('320 cm Tone: original two-piece top and 14 support placements survive rendering',()=>{
 const snapshot=calculate(read('./fixtures/tone-wide-design.json'));
 const topY=Math.max(...snapshot.geometry.slabs.map(p=>p.y2));
 const top=snapshot.geometry.slabs.filter(p=>p.y2===topY);
 assert.deepEqual(top.map(p=>[p.x1,p.x2]).sort((a,b)=>a[0]-b[0]),[[-1582,10],[10,1582]]);
 const feet=snapshot.schema.find(g=>g.key==='legs').children;
 assert.equal(feet.length,14);
 assert.equal(feet.flatMap(s=>s.geometries).filter(p=>p.asset==='planeLeg').length,14);
 assert.equal(new Set(feet.map(s=>`${s.position.x},${s.position.z}`)).size,14);
 assert.ok(feet.every(s=>s.position.y===0),'source feet sit on ground');
 assert.equal(feet[0].position.x,-1.559,'keep original outer-foot inset');
});

test('1964607: unequal heights, premium finish, feet and source price are preserved',()=>{
 const design=initialDesign('tone-1964607');const snapshot=calculate(design);
 assert.deepEqual([snapshot.geometry.width,snapshot.geometry.height,snapshot.geometry.depth],[2550,1340,450]);
 assert.deepEqual(Object.values(snapshot.configuration.values.channels).map(c=>c.local_height),[134,44,44]);
 assert.equal(snapshot.configuration.values.material,1);
 assert.equal(observedEuro(design),2569,'regular EUR price; Club 1593 is not an unconditional quote');
 const expected=read('./fixtures/tone-1964607.json');
 assert.deepEqual(sorted(snapshot.geometry.legs),sorted(expected.legs));
 const changed=calculate(design,{channels:{'2':{local_height:74}}});
 assert.deepEqual(Object.values(changed.configuration.values.channels).map(c=>c.local_height),[134,74,44]);
 assert.deepEqual(calculate(readDesign(JSON.stringify({...design,preset:changed.preset}))).geometry,changed.geometry);
 const palette=read('./data/palette.json'), colors=read('./data/colors.json');
 for(const p of [...palette.tone,...palette.toneMatte]){
  const variant=calculate(design,{material:p.id});
  const walls=variant.schema.find(g=>g.key==='walls').children.flatMap(s=>s.geometries);
  assert.ok(walls.some(part=>part.material?.colors.primary===p.colors.primary),`source mapping ${p.id}`);
  assert.ok(Number.isInteger(colors[p.colors.primary]),`captured renderer RGB ${p.colors.primary}`);
 }
});


test('657092: source bedside geometry and drawer travel remain exact',()=>{
 const design=initialDesign('bedside');const s=calculate(design);const expected=read('./fixtures/bedside.json');
 assert.deepEqual([s.geometry.width,s.geometry.height,s.geometry.depth],[600,250,360]);
 for(const part of ['walls','slabs','backs','drawers','legs'])assert.deepEqual(sorted(s.geometry[part]),sorted(expected[part]),part);
 const drawer=s.schema.find(g=>g.key==='drawers').children[0];
 assert.equal(drawer.name,'drawer');assert.ok(Math.abs(drawer.segmentTag.motion.open-drawer.segmentTag.motion.close-.2926)<1e-8);
 assert.equal(s.schema.find(g=>g.key==='legs').children.length,4);
 assert.equal(s.configuration.parameters.shelfType.options.find(o=>o.value===7).disabled,true);
 assert.equal(observedEuro(design),602);
});
test('657092: resize, colours, drawer layouts and share restoration use source rules',()=>{
 const design=initialDesign('bedside');const s=calculate(design,{width:120,height:65,depth:46,material:2});
 assert.deepEqual([s.geometry.width,s.geometry.height,s.geometry.depth],[1200,650,460]);
 const edited={...design,preset:s.preset};assert.deepEqual(calculate(readDesign(JSON.stringify(edited))).geometry,s.geometry);
 assert.equal(observedEuro(edited),null);assert.ok(s.thumbnails.length>1);
 assert.equal(s.schema.find(g=>g.key==='walls').children[0].geometries[0].material.colors.primary,'pistachioGreen');
 calculate(initialDesign('tone'));assert.deepEqual(JSON.parse(JSON.stringify(calculate(design).geometry)),read('./fixtures/bedside.json'));
});

test('bedside: style migration preserves width, material and drawers through save/reload',()=>{
 let design=initialDesign('bedside');
 design={...design,preset:calculate(design,{width:165,height:65,material:1}).preset};
 const before=calculate(design).configuration.values;
 for(const [style,height] of [[7,62],[8,72],[6,65]]){
  design=switchBedsideStyle(design,style);
  const result=calculate(design);
  assert.equal(result.geometry.shelf_type,style);
  assert.equal(result.configuration.values.height,height);
  for(const key of ['width','depth','material','channels'])assert.deepEqual(result.configuration.values[key],before[key],key);
  const restored=readDesign(JSON.stringify(design));
  assert.deepEqual(calculate(restored),result);
  assert.equal(restored.bedsideStyle,style);
  if(style===8){
   let edited=restored;
   for(let i=0;i<5;i++){edited={...edited,preset:calculate(edited,{depth:i%2?36:46}).preset};assert.equal(calculate(edited).configuration.values.width,165);}
  }
  if(style!==6)assert.equal(observedEuro(design),null);
 }
});
test('bedside: source restrictions and invalid saved styles are rejected',()=>{
 assert.throws(()=>switchBedsideStyle(initialDesign('bedside'),7));
 assert.throws(()=>readDesign(JSON.stringify({...initialDesign('bedside'),bedsideStyle:9})));
 assert.equal(calculate(readDesign(JSON.stringify(initialDesign('bedside')))).geometry.shelf_type,6);
});

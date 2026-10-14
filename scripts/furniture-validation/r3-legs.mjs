import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {load} from './load-ts.mjs';
const files=['src/lib/three/furniture-base.ts','src/components/three/FurnitureLegs.tsx','src/stores/useShelfStore.ts','src/components/storefront/configuration.ts','src/components/storefront/savedDesign.ts','src/lib/three/styles/grid.ts','src/lib/three/styles/pattern.ts','src/lib/three/styles/mosaic.ts','scripts/furniture-validation/left4-connectors.test.mjs','docs/tylko-reference/cases/legs-001.json'];
const hashes=()=>Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const before=hashes();
const {planFurnitureLegs,baseHeight}=load('src/lib/three/furniture-base.ts');
const cases=[['R3-QA-LEG-01','grid',110,32,50,[28,28]],['R3-QA-LEG-01-alt','grid',110,32,50,[28,32]],['R3-QA-LEG-02-a','pattern',89,32,37,[28,32]],['R3-QA-LEG-02-b','pattern',90,40,37,[28,32]],['R3-QA-LEG-03','mosaic',181,40,61,[18,38]]];
const results=cases.map(([id,style,width,depth,density,rowHeights])=>{
 const height=rowHeights.reduce((a,b)=>a+b,0)+2*(rowHeights.length+1);
 const input={width,depth,density,rowHeights,height,thickness:2,numRows:rowHeights.length,hasBackPanel:false,family:'type02'};
 const calc=load(`src/lib/three/styles/${style}.ts`)[`calculate${style[0].toUpperCase()+style.slice(1)}Panels`];
 const {panels}=calc(input);const legs=planFurnitureLegs(panels,depth,style);
 const bottoms=panels.filter(p=>p.matType==='horizontalBase');const floor=Math.min(...bottoms.map(p=>p.y-p.h/2));
 const bases=bottoms.filter(p=>Math.abs(p.y-p.h/2-floor)<1e-6);
 const axes=panels.filter(p=>p.matType==='verticalBase'&&bases.some(b=>Math.abs(p.y-p.h/2-(b.y+b.h/2))<1e-6)).map(p=>p.x);
 let status='pass',error=null;
 try{
  assert.ok(legs.length>=4);assert.equal(legs.length%2,0);
  assert.equal(new Set(legs.map(l=>l.position.join(','))).size,legs.length);
  for(const leg of legs){assert.ok(axes.some(x=>Math.abs(x-leg.position[0])<1e-5));assert.ok(bases.some(b=>leg.position[0]>=b.x-b.w/2&&leg.position[0]<=b.x+b.w/2));assert.ok(Math.abs(leg.position[1]+11-floor)<1e-5);}
  for(let i=0;i<legs.length;i+=2){assert.equal(legs[i].position[0],legs[i+1].position[0]);assert.deepEqual([legs[i].position[2],legs[i+1].position[2]],[.9,depth-.9]);}
 }catch(e){status='fail';error=e.message;}
 return {id,input,units:'cm; rotations radians',expectedSource:'Documented Befun support contract: each leg on bottom vertical axis, unique front/back pair, bottom horizontal support; not a Tylko count oracle',expectedReferenceCount:null,actual:{bodyHeight:height,standardHeight:height+baseHeight('standard'),legsHeight:height+baseHeight('legs'),axes,legs},status,error,referenceParity:'unknown',manufacturing:'unknown'};
});
const report={generatedAt:new Date().toISOString(),scope:'New independent cases only; code consistency is not reference equality',results,fingerprintsBefore:before,fingerprintsAfter:hashes()};
fs.writeFileSync('scripts/furniture-validation/r3-legs-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(results.map(r=>({id:r.id,status:r.status,legs:r.actual.legs.length,heights:[r.actual.standardHeight,r.actual.legsHeight],error:r.error})),null,2));
process.exitCode=results.some(r=>r.status==='fail')?1:0;

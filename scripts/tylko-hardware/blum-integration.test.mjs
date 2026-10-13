// Integration regression: real generator → CNC parts, no browser state.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const root=process.cwd(), cache=new Map();
function load(file){let p=path.resolve(root,file);if(!fs.existsSync(p))p+='.ts';if(p.endsWith('.json'))return JSON.parse(fs.readFileSync(p));if(cache.has(p))return cache.get(p).exports;const m={exports:{}};cache.set(p,m);const code=ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const req=id=>id.startsWith('@/')?load('src/'+id.slice(2)):id.startsWith('.')?load(path.resolve(path.dirname(p),id)):require(require.resolve(id,{paths:[root]}));vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:p})(req,m,m.exports);return m.exports;}
const {buildBefunShelfModel}=load('src/lib/optimizer/befun/model.ts'),{toCncPanels}=load('src/lib/optimizer/befun/toCncPanels.ts');

const {createBlumShelfPlans}=load('src/lib/three/blum/boring.ts');
for(const style of ['grid','slant','pattern','mosaic','pixel','gradient']) {
 const d={width:232,height:92,depth:32,thickness:2,style,density:66,rowHeights:[28,28,28],numRows:3,hasBackPanel:false,doorsCreatedLayers:[0],drawersCreatedLayers:[],hardwareRowStyles:{0:13},color:'S_White',colorCategory:'solid'};
 const model=buildBefunShelfModel(d);const plans=createBlumShelfPlans(model.doors,model.panels,d.thickness);
 const cnc=toCncPanels(d,model);const doorPanels=cnc.panels.filter(p=>p.isDoor);
 plans.forEach((plan,i)=>{
  require('assert').equal(doorPanels[i].manufacturingBoring.borings.length,plan.holes.length);
  if(plan.issues.length) require('assert').equal(doorPanels[i].manufacturingBoring.manufacturingReady,false);
  else {
   const cup=doorPanels[i].manufacturingBoring.borings.find(b=>b.type==='hinge-cup');
   require('assert').equal(cup.face,'bottom');require('assert').equal(cup.diameter,35);require('assert').equal(cup.depth,13);
   require('assert').ok(Math.abs(cup.x-(plan.cups[0][0]+model.doors[i].width*5))<1e-4);
  }
 });
 const bodyHoles=cnc.panels.filter(p=>!p.isDoor).flatMap(p=>p.manufacturingBoring?.borings??[]).filter(b=>b.id.startsWith('blum-'));
 require('assert').equal(bodyHoles.length,plans.reduce((s,p)=>s+p.mounts.length*2,0));
 console.log(`${style}: ${plans.length} doors, ${bodyHoles.length} matching body holes, CNC coordinates verified`);
}

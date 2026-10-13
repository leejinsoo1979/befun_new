// Integration regression: real generator → CNC parts, no browser state.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const root=process.cwd(), cache=new Map();
function load(file){let p=path.resolve(root,file);if(!fs.existsSync(p))p+='.ts';if(p.endsWith('.json'))return JSON.parse(fs.readFileSync(p));if(cache.has(p))return cache.get(p).exports;const m={exports:{}};cache.set(p,m);const code=ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const req=id=>id.startsWith('@/')?load('src/'+id.slice(2)):id.startsWith('.')?load(path.resolve(path.dirname(p),id)):require(require.resolve(id,{paths:[root]}));vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:p})(req,m,m.exports);return m.exports;}
import assert from 'node:assert/strict';
const {buildBefunShelfModel}=load('src/lib/optimizer/befun/model.ts');
const {decorSlots,arrangeDecor}=load('src/components/three/decor/layout.ts');
let cases=0,objects=0;
for(const style of ['grid','slant','pattern','mosaic','pixel','gradient'])
for(const width of [40,90,232,450]) for(const density of [0,50,100]) for(const rh of [18,28,38]) for(const color of ['S_White','C_White']) {
 const d={width,height:rh*3+8,depth:32,thickness:2,style,density,rowHeights:[rh,rh,rh],numRows:3,hasBackPanel:false,doorsCreatedLayers:[0],drawersCreatedLayers:[],hardwareRowStyles:{0:13},color,colorCategory:'solid'};
 const model=buildBefunShelfModel(d);
 const layout=arrangeDecor(decorSlots(model.panels,model.doors,model.drawers));
 for(const p of layout) {
  const min=[p.position[0]-p.size[0]/2,p.position[1]+.02,p.position[2]-p.size[2]/2];
  const max=[p.position[0]+p.size[0]/2,p.position[1]+p.size[1],p.position[2]+p.size[2]/2];
  for(const b of model.panels) {
   const overlap=[b.x,b.y,b.z].every((v,i)=>min[i]<v+[b.w,b.h,b.d][i]/2-.03&&max[i]>v-[b.w,b.h,b.d][i]/2+.03);
   assert.ok(!overlap,`${style}/${width}/${density}/${rh}/${color}: ${p.id} intersects ${b.matType}`);
  }
 }
 cases++;objects+=layout.length;
}
assert.ok(objects>500);console.log(`${cases} real-style configurations / ${objects} accessory placements: no board intersections`);

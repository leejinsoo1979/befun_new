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
const d={width:393,height:62,depth:32,thickness:2,style:'slant',density:66,rowHeights:[28,28],numRows:2,hasBackPanel:false,doorsCreatedLayers:[],drawersCreatedLayers:[],hardwareRowStyles:{},color:'S_Teracotta',colorCategory:'solid'};
// Public complete Slant geometry + module1502: cuts2088/2296/2296mm from left.
const m=buildBefunShelfModel(d),c=toCncPanels(d,m);const h=c.boxes.filter(b=>b.kind==='horizontal');require('assert').deepStrictEqual(h.map(b=>b.w).sort((a,b)=>a-b),[163.4,163.4,184.2,208.8,229.6,229.6]);require('assert').equal(c.panels.filter(p=>p.name.startsWith('가로판')).length,6);
const result={slant393:{horizontalCm:h.map(b=>({x:b.x,y:b.y,w:b.w})),cncHorizontalMm:c.panels.filter(p=>p.name.startsWith('가로판')).map(p=>p.width)}};
for(const style of ['pattern','mosaic']){const t={...d,width:232,style,density:69,rowHeights:[38,28,28,28],numRows:4,height:132,doorsCreatedLayers:[0],hardwareRowStyles:{0:13}};const model=buildBefunShelfModel(t),cnc=toCncPanels(t,model);require('assert').ok(cnc.panels.filter(p=>p.name.startsWith('도어')).every(p=>p.thickness===16));result[style]={doors:model.doors.length,frontThicknessMm:16};}

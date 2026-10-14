// Read-only adapter lifecycle repro. Run from repository cwd; no browser/WebGL required.
// Real React + R3F reconciler, unchanged LongLeg transpiled in memory, real GLB.
// Only useGLTF is substituted to control synchronous versus suspended asset delivery.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(process.cwd()+'/package.json');
const url=id=>pathToFileURL(require.resolve(id)).href;
const ts=(await import(url('typescript'))).default;
const React=(await import(url('react'))).default;
const THREE=await import(url('three'));
const {GLTFLoader}=await import(url('three/examples/jsm/loaders/GLTFLoader.js'));
const {createRoot,extend,act}=await import(url('@react-three/fiber'));
const base=process.cwd()+'/src/components/three/furniture-hardware/legs/';
const file=fs.readFileSync('public/models/furniture/long-leg.glb');
globalThis.__qaScene=(await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.length),'')).scene;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.requestAnimationFrame=()=>0;
let source=ts.transpileModule(fs.readFileSync(base+'LongLeg.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
source=source.replaceAll('"react/jsx-runtime"',JSON.stringify(url('react/jsx-runtime'))).replace("'react'",JSON.stringify(url('react'))).replace("'@react-three/drei'",JSON.stringify('data:text/javascript,export function useGLTF(){if(!globalThis.__qaReady)throw globalThis.__qaLoad;return {scene:globalThis.__qaScene}}')).replace("'./longLegContract'",JSON.stringify(pathToFileURL(base+'longLegContract.ts').href)).replace("'./longLegInstance'",JSON.stringify(pathToFileURL(base+'longLegInstance.ts').href));
const {LongLeg}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
extend(THREE);
const findings=[];
for(const suspended of [false,true]) for(const strict of [false,true]) {
 globalThis.__qaReady=!suspended;
 let resolveLoad;
 globalThis.__qaLoad=new Promise(r=>resolveLoad=r);
 const scene=new THREE.Scene();
 const root=createRoot({});
 await root.configure({scene,gl:{render(){},setSize(){},setPixelRatio(){},xr:{isPresenting:false}},frameloop:'never',size:{width:300,height:300,top:0,left:0},dpr:1});
 const wrap=child=>React.createElement(strict?React.StrictMode:React.Fragment,null,React.createElement(React.Suspense,{fallback:null},child));
 const leg=unit=>React.createElement(LongLeg,{unit});
 const stats=stage=>{let meshes=0;scene.traverse(o=>{if(o.isMesh)meshes++});const result={suspended,strict,stage,meshes,groupChildren:scene.children[0]?.children.length??0};findings.push(result);console.log(JSON.stringify(result));};
 await act(async()=>root.render(wrap(leg('mm'))));
 if(suspended) await act(async()=>{globalThis.__qaReady=true;resolveLoad();await globalThis.__qaLoad;});
 stats('initial-loaded');
 await act(async()=>root.render(wrap(null)));
 await act(async()=>root.render(wrap(leg('mm'))));
 stats('remounted');
 await act(async()=>root.render(wrap(leg('cm'))));
 stats('unit-updated');
 await act(async()=>root.unmount());
}
assert.equal(findings.find(x=>!x.suspended&&!x.strict&&x.stage==='initial-loaded').meshes,1,'normal control must render');
const defect=findings.filter(x=>x.strict&&x.meshes===0);
console.log(JSON.stringify({defectReproduced:defect.length>0,emptyMeshCases:defect.length,note:'Adapter lifecycle harness, not browser E2E; useGLTF is controlled, React/R3F/GLB/LongLeg are real.'}));

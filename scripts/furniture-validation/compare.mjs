import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
// Validation-only boundary; does not invent or replace the leader's product contract.
// Each input: {unit:'mm', parts:[{id,role,connections:[],positionMm:[x,y,z],sizeMm:[w,h,d]}]}.
export function compare(reference, generated, tolerance) {
 const result={status:'unknown',missing:[],extra:[],differences:[],unknown:[]};
 if(reference?.unit!=='mm'||generated?.unit!=='mm') {result.unknown.push('Explicit mm units required on both inputs');return result;}
 if(!Array.isArray(reference.parts)||!Array.isArray(generated.parts)) {result.unknown.push('Measured reference and generated parts required');return result;}
 if(!Number.isFinite(tolerance?.mm)||tolerance.mm<0||!tolerance.source) {result.unknown.push('Measured tolerance with source required');return result;}
 const index=(parts,side)=>{const map=new Map(); for(const p of parts){if(!p.id||map.has(p.id)){result.unknown.push(`${side}: missing/duplicate stable ID`);continue;}map.set(p.id,p);}return map;};
 const r=index(reference.parts,'reference'),g=index(generated.parts,'generated');
 for(const [id,a] of r) {
  const b=g.get(id);if(!b){result.missing.push(id);continue;}
  if(!a.role||!b.role)result.unknown.push(`${id}: role unknown`);
  else if(a.role!==b.role)result.differences.push({id,field:'role',reference:a.role,generated:b.role});
  if(!Array.isArray(a.connections)||!Array.isArray(b.connections))result.unknown.push(`${id}: connections unknown`);
  else if(JSON.stringify([...a.connections].sort())!==JSON.stringify([...b.connections].sort()))result.differences.push({id,field:'connections',reference:a.connections,generated:b.connections});
  for(const field of ['positionMm','sizeMm']) {
   if(!Array.isArray(a[field])||!Array.isArray(b[field])||a[field].length!==3||b[field].length!==3||[...a[field],...b[field]].some(v=>!Number.isFinite(v))) {result.unknown.push(`${id}: ${field} unmeasured`);continue;}
   const deltaMm=a[field].map((v,i)=>b[field][i]-v);
   if(deltaMm.some(v=>Math.abs(v)>tolerance.mm)) result.differences.push({id,field,deltaMm});
  }
 }
 for(const id of g.keys())if(!r.has(id))result.extra.push(id);
 result.status=result.missing.length||result.extra.length||result.differences.length?'fail':result.unknown.length?'unknown':'pass';
 return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const [ref,gen,tol]=process.argv.slice(2);
 if(!ref||!gen||!tol)throw new Error('Usage: node compare.mjs reference.json generated.json tolerance.json');
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const result=compare(read(ref),read(gen),read(tol));console.log(JSON.stringify(result,null,2));process.exitCode=result.status==='fail'?1:result.status==='unknown'?2:0;
}

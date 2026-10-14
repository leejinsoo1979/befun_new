import test from 'node:test';import assert from 'node:assert/strict';import {compare} from './compare.mjs';
const a={id:'bottom',role:'panel',connections:['foot-1'],positionMm:[0,10,160],sizeMm:[900,20,320]};
const b={id:'foot-1',role:'leg',connections:['bottom'],positionMm:[-400,0,160],sizeMm:[20,10,20]};
const ref={unit:'mm',parts:[a,b]},tol={mm:0,source:'Synthetic exact-coordinate example, NOT a manufacturing tolerance'};
test('stable IDs match reordered components',()=>assert.equal(compare(ref,{unit:'mm',parts:[b,a]},tol).status,'pass'));
test('extra, missing and numeric error stay separate',()=>{const r=compare(ref,{unit:'mm',parts:[{...a,positionMm:[1,10,160]},{...b,id:'extra'}]},tol);assert.equal(r.status,'fail');assert.deepEqual(r.missing,['foot-1']);assert.deepEqual(r.extra,['extra']);assert.deepEqual(r.differences[0].deltaMm,[1,0,0]);});
test('null geometry and absent tolerance cannot pass',()=>{assert.equal(compare(ref,{unit:'mm',parts:[{...a,positionMm:null},b]},tol).status,'unknown');assert.equal(compare(ref,ref,null).status,'unknown');});
test('connections and roles matter independently of coordinates',()=>assert.equal(compare(ref,{unit:'mm',parts:[{...a,connections:[]},b]},tol).status,'fail'));
test('centimeters are never silently treated as mm',()=>assert.equal(compare(ref,{...ref,unit:'cm'},tol).status,'unknown'));

import test from 'node:test';
import assert from 'node:assert/strict';
import {adapt,auditRecord} from './reference-audit.mjs';
const model={model:'Original',sourceUrl:'https://tylko.com/de-de/mobel/regalsystem/123,j',initialState:{presetId:123,publicPreset:{id:123}},steps:['open'],optionUiSnapshot:'width',screenshots:[{path:'screenshots/a.png',status:'loading-preview-only'}]};
test('inventory adapter gives pass to matching identity, not loading preview',()=>{
 const [r]=adapt({caseId:'category-test',models:[model]},'case.json');const c=auditRecord(r,()=>true);
 assert.equal(c.find(x=>x.field==='presetIdentity').status,'pass');
 assert.equal(c.find(x=>x.field.startsWith('visualEvidence')).status,'unknown');
});
test('wrong preset and missing screenshot fail',()=>{
 const [r]=adapt({caseId:'category-test',models:[{...model,initialState:{presetId:456}}]},'case.json');const c=auditRecord(r,()=>false);
 assert.equal(c.find(x=>x.field==='presetIdentity').status,'fail');assert.equal(c.find(x=>x.field.startsWith('screenshot:')).status,'fail');
});
test('wardrobe edited null cannot be filled with initial preset',()=>{
 const [r]=adapt({caseId:'category-wardrobe-edge-001',sourceUrl:model.sourceUrl,initialState:{preset:{id:123,width:1180}},currentInternalParameters:null},'case.json');
 assert.equal(r.current,null);assert.equal(auditRecord(r).find(x=>x.field==='editedInternalState').status,'unknown');
});
test('derived result file not counted as observed reference',()=>assert.equal(adapt({counts:34},'results.json')[0].kind,'derived-artifact'));

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { chapters, chapterById, samplePose, canComplete } from '../../src/lib/assembly-guide/tylko-manual/chapters.ts';
import { savedConnectorSystem, resolveGuideSystem } from '../../src/lib/assembly-guide/tylko-manual/selection.ts';
const assets=JSON.parse(fs.readFileSync(new URL('../../src/lib/assembly-guide/tylko-manual/assets.json',import.meta.url)));
const root=new URL('../../public/',import.meta.url);
const exists=src=>assert.ok(fs.existsSync(new URL(decodeURIComponent(src.split('#')[0]).replace(/^\//,''),root)),src);
test('All 144 supplied files have their original byte count and SHA256',()=>{
 assert.equal(assets.files.length,144);
 for(const f of assets.files){const bytes=fs.readFileSync(new URL('assembly/tylko/'+f.file,root));assert.equal(bytes.length,f.bytes,f.file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256,f.file);}
});
test('All 14 PDFs, 18 video pairs, 79 images and 10 guides have local targets',()=>{
 assert.equal(assets.pdfs.length+assets.guides.length,14);assert.equal(assets.videos.length,18);assert.equal(assets.images.length,79);
 for(const p of assets.pdfs)exists(p.src);
 for(const g of assets.guides){exists(g.pdf);for(const b of g.blocks)if(b.kind==='image')exists(b.src);}
 for(const v of assets.videos){exists(v.src);exists(v.poster);}
 for(const i of assets.images)exists(i.url);
});
test('17 chapters reference existing sources and collectively cover all videos',()=>{
 assert.equal(chapters.length,17);assert.equal(new Set(chapters.map(c=>c.id)).size,17);
 for(const c of chapters){exists(c.source);for(const id of c.videos)assert.ok(assets.videos.some(v=>v.id===id),id);for(const n of c.images)assert.ok(assets.images.some(i=>i.file.startsWith(`images/${String(n).padStart(3,'0')}_`)),n);}
 assert.deepEqual(new Set(chapters.flatMap(c=>c.videos)),new Set(assets.videos.map(v=>v.id)));
});
test('Seeking every chapter is deterministic, finite and continuous across steps',()=>{
 for(const c of chapters)for(let i=0;i<c.steps.length;i++){
  for(const t of [-1,0,.3,1,2,NaN])for(const n of Object.values(samplePose(c,i,t)))assert.ok(Number.isFinite(n));
  const end=samplePose(c,i,1);const start=samplePose(c,i+1,0);
  if(i+1<c.steps.length)for(const key of new Set([...Object.keys(end),...Object.keys(start)]))assert.ok(Math.abs((end[key]??0)-(start[key]??0))<1e-10,`${c.id}:${i}:${key}`);
  assert.deepEqual(samplePose(c,i,.5),samplePose(c,i,.5));
 }
});
test('Panel clip normal entry precedes long-axis slide; release reverses that order',()=>{
 const assembly=chapterById('clip-assemble');assert.equal(samplePose(assembly,2,1).gap,0);assert.equal(samplePose(assembly,2,1).slide,11);assert.equal(samplePose(assembly,3,1).slide,0);
 const release=chapterById('clip-release');assert.equal(samplePose(release,1,1).gap,0);assert.ok(samplePose(release,1,1).slide>0);assert.ok(samplePose(release,2,1).gap>0);
});
test('Checklist cannot skip earlier steps or confirm an unfinished motion',()=>{
 assert.equal(canComplete(0,.5,new Set()),false);assert.equal(canComplete(0,1,new Set()),true);assert.equal(canComplete(2,1,new Set([1])),false);assert.equal(canComplete(2,1,new Set([0,1])),true);
});
test('Saved admin choice and legacy choices resolve without accepting invalid payloads',()=>{
 for(const v of [null,'oops','null','[]','42','{"system":"other"}'])assert.equal(savedConnectorSystem(v),null);
 assert.equal(savedConnectorSystem('{"body":"V-1230R"}'),'ovvo');assert.equal(savedConnectorSystem('{"system":"tylko-clip"}'),'tylko-clip');
 assert.equal(resolveGuideSystem(undefined,undefined,'ovvo'),'ovvo');assert.equal(resolveGuideSystem(undefined,undefined,'tylko-clip'),'tylko-clip');assert.equal(resolveGuideSystem('ovvo',undefined,'tylko-clip'),'ovvo');assert.equal(resolveGuideSystem(undefined,'connector','tylko-clip'),'ovvo');assert.equal(resolveGuideSystem(undefined,'legs','ovvo'),'tylko-clip');
});

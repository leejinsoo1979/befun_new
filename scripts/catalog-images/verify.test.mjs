import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
registerHooks({resolve(specifier,context,next){return next(specifier.endsWith('/identity')?specifier+'.ts':specifier,context)},load(url,context,next){return next(url,url.endsWith('.json')?{...context,importAttributes:{type:'json'}}:context)}});
const {downloadedCardEntries:entries,getDownloadedCardImages,sourceProductKey,existingCardImages}=await import('../../src/lib/catalog-images/index.ts');
test('all 31 category memberships and their exceptional counts are preserved',()=>{
 const counts=new Map();for(const e of entries)counts.set(e.category,(counts.get(e.category)??0)+1);
 assert.equal(entries.length,1442);assert.equal(counts.size,31);
 for(const [category,count] of counts)assert.equal(count,({'담요':5,'북엔드':16,'생활 소품 전체':21})[category]??50);
 assert.equal(new Set(entries.map(e=>`${e.category}:${e.sequence}:${e.productNumber}`)).size,1442);
});
test('every local image exists and equals its declared content hash',()=>{
 const paths=new Set(entries.flatMap(e=>[e.thumbnail,e.studio]));
 for(const path of paths){assert.match(path,/^\/imgs\/product-cards\/[a-f0-9]{64}\.(webp|jpg|jpeg|png)$/);const bytes=readFileSync(new URL('../../public'+path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),path.split('/').at(-1).split('.')[0]);}
});
test('URL identities preserve collection suffixes and accessory families',()=>{
 assert.equal(sourceProductKey('https://tylko.com/de-de/mobel/sideboard/1430077,w,grosses-schwarz'), '1430077,w');
 assert.notEqual(sourceProductKey('https://tylko.com/x/123,j'),sourceProductKey('https://tylko.com/x/123,w'));
 assert.equal(sourceProductKey('https://tylko.com/de-de/wohnaccessoires/decke/10'),'blanket:10');
 assert.equal(sourceProductKey('https://tylko.com/en-uk/accessories/bookend/10'),'bookend:10');
 assert.equal(sourceProductKey('not a URL'),null);
});
test('category-specific reversal cannot silently be paired by global product ID',()=>{
 const url='https://tylko.com/en-uk/furniture/desk/3716771,j';
 assert.equal(getDownloadedCardImages(url),null);
 const desk=getDownloadedCardImages(url,'책상'),all=getDownloadedCardImages(url,'전체 상품');
 assert.ok(desk&&all);assert.equal(desk.thumbnail,all.studio);assert.equal(desk.studio,all.thumbnail);
 assert.equal(getDownloadedCardImages(url,'북엔드'),null);
});
test('every existing-card mapping corresponds to one verified product pair',()=>{
 assert.equal(Object.keys(existingCardImages).length,31);
 for(const m of Object.values(existingCardImages))assert.ok(entries.some(e=>e.productKey===m.productKey&&e.thumbnail===m.thumbnail&&e.studio===m.studio));
 assert.equal(existingCardImages['sideboard-terra'],undefined);
});

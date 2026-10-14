import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({resolve(specifier,context,next){
  if(specifier.endsWith('/markets'))return next(specifier+'.ts',context);
  return next(specifier,context);
},load(url,context,next){
  if(url.endsWith('.json'))return next(url,{...context,importAttributes:{type:'json'}});
  return next(url,context);
}});
const {MARKETS,formatMoney,isMarket,isEuropeanCountry}=await import('../../src/lib/commerce/markets.ts');
const {convertedUnitPrice,convertedCartTotal,marketCheckoutAvailable,FX_SNAPSHOT}=await import('../../src/lib/commerce/quote.ts');
test('markets bind the requested language and currency',()=>{
 assert.deepEqual(Object.values(MARKETS).map(x=>[x.language,x.currency]),[['ko','KRW'],['en','USD'],['ja','JPY'],['en','EUR']]);
 assert.equal(isMarket('DE'),false);assert.equal(isEuropeanCountry('DE'),true);assert.equal(isEuropeanCountry('__proto__'),false);
});
test('conversion starts from canonical KRW and never compounds on market changes',()=>{
 const price=150081;
 assert.equal(convertedUnitPrice(price,'EU'),100);assert.equal(convertedUnitPrice(price,'US'),111.88);assert.equal(convertedUnitPrice(price,'JP'),17691);assert.equal(convertedUnitPrice(price,'KR'),price);
 assert.equal(FX_SNAPSHOT.date,'2026-10-13');
});
test('cart totals sum rounded display units across all markets',()=>{
 const items=[{price:374400,quantity:3},{price:244000,quantity:2}];
 for(const market of Object.keys(MARKETS)) {
  const scale=10**MARKETS[market].fractionDigits;
  assert.equal(convertedCartTotal(items,market),items.reduce((s,i)=>s+Math.round(convertedUnitPrice(i.price,market)*scale)*i.quantity,0)/scale);
 }
});
test('reject invalid amounts and quantities',()=>{
 for(const value of [NaN,Infinity,-1])assert.throws(()=>convertedUnitPrice(value,'JP'));
 assert.throws(()=>convertedCartTotal([{price:10,quantity:0}],'US'));
});
test('display currency and precision differ, but estimates cannot become foreign payments',()=>{
 assert.match(formatMoney(1234,'JP'),/1,234/);assert.doesNotMatch(formatMoney(1234,'JP'),/\.00/);
 assert.match(formatMoney(1234.5,'US'),/1,234\.50/);
 assert.equal(marketCheckoutAvailable('KR','KRW'),true);
 for(const m of ['US','JP','EU'])assert.equal(marketCheckoutAvailable(m,MARKETS[m].currency),false);
 assert.equal(marketCheckoutAvailable('KR','USD'),false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';
installTestLoader({ mockServices: false });
registerHooks({ load(url, context, next) {
  if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true };
  return next(url, context);
} });
const { calculateShortFeet } = await import('../../src/lib/three/reference-feet.ts');
// Captured 9281730 bottom-row bounds (mm): full-depth walls and recessed inserts.
const walls = [
  [-1195,-1177,18,400,0,400], [-717,-699,18,400,0,400],
  [-9,9,18,400,0,400], [584,602,18,400,0,400], [1177,1195,18,400,0,400],
  [-481,-463,18,400,18,370], [-245,-227,18,400,18,370],
];
const panels = [
  {matType:'horizontalBase', x:0,y:.9,z:20,w:239,h:1.8,d:40},
  ...walls.map(([x0,x1,y0,y1,z0,z1])=>({matType:'verticalBase',
    x:(x0+x1)/20,y:(y0+y1)/20,z:(z0+z1)/20,w:(x1-x0)/10,h:(y1-y0)/10,d:(z1-z0)/10})),
];
test('9281730: recessed inserts do not add feet, while wide bay retains its midpoint support', () => {
  const feet = calculateShortFeet(panels,40);
  const xs = feet.filter(f=>f[2]===2.5).map(f=>f[0]);
  assert.deepEqual(xs,[-117,-70.8,-35.4,0,59.3,117]);
  assert.equal(feet.length,12);
  assert.ok(!xs.includes(-47.2) && !xs.includes(-23.6));
  assert.deepEqual(feet,calculateShortFeet(panels.filter(p=>p.matType!=='verticalBase'||p.d===40),40));
  for(let i=1;i<xs.length;i++) assert.ok(xs[i]-xs[i-1]<=60);
});
test('insert depth and position do not affect feet across supported cabinet depths',()=>{
  for(const depth of [24,32,40]) {
    const base={matType:'horizontalBase',x:0,y:1,z:depth/2,w:120,h:2,d:depth};
    const main=[-59,0,59].map(x=>({matType:'verticalBase',x,y:21,z:depth/2,w:2,h:38,d:depth}));
    const expected=calculateShortFeet([base,...main],depth);
    for(const inset of [1,2,3]) {
      const insert={...main[0],x:-30,z:depth/2,d:depth-inset*2};
      assert.deepEqual(calculateShortFeet([base,...main,insert],depth),expected);
    }
  }
});

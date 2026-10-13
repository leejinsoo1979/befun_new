import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
import data from './source-fixtures.json' with { type: 'json' };

registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return next(specifier + '.ts', context);
    throw error;
  }
} });
const { calculateGridPanels } = await import('../../src/lib/three/styles/grid.ts');
const { calculateSlantPanels } = await import('../../src/lib/three/styles/slant.ts');
const calculate = { grid: calculateGridPanels, slant: calculateSlantPanels };
const round = value => Math.round(value * 1e5) / 1e5;
const envelope = p => [p.x-p.width/2,p.x+p.width/2,p.y-p.height/2,p.y+p.height/2].map(v=>round(v*10));
const digest = records => ({ count: records.length, sha256: createHash('sha256').update(JSON.stringify(records.sort())).digest('hex') });

// Expected digests were frozen from the public Type02 decoder plus its final
// manufacturing split, without importing Befun's geometry into the oracle.
// Numeric rules are production data; the public application bundle is not shipped.
for (const [index, fixture] of data.fixtures.entries()) {
  test(`${fixture.style} source geometry/fronts/openings ${index}: ${fixture.input.width}cm / ${fixture.input.density}%`, () => {
    const result = calculate[fixture.style](fixture.input);
    const geometry = result.panels.map(p=>[p.matType,...[p.x-p.w/2,p.x+p.w/2,p.y-p.h/2,p.y+p.h/2,p.z-p.d/2,p.z+p.d/2].map(v=>round(v*10))].join('|'));
    const fronts = result.fronts.map(p=>[p.type,...envelope(p),p.hingeSide??'right',p.parity??'single'].join('|'));
    const openings = result.openings.map(p=>envelope(p).join('|'));
    assert.deepEqual(digest(geometry), fixture.expected.geometry, 'physical panels including real manufacturing splits');
    assert.deepEqual(digest(fronts), fixture.expected.fronts, 'front envelopes, hinge direction, single/paired parity');
    assert.deepEqual(digest(openings), fixture.expected.openings, 'actual clear openings before dimension-label filtering');
    assert.ok(result.panels.every(p=>p.w>0&&p.h>0&&p.d>0));
    assert.ok(result.panels.filter(p=>p.matType==='horizontalBase').every(p=>p.w<=240+1e-8));
  });
}

test('Slant 393cm real source split boundaries, density66, 2×28cm rows', () => {
  const result=calculateSlantPanels({width:393,height:63,depth:32,thickness:2,density:66,rowHeights:[28,28],numRows:2,hasBackPanel:false});
  const horizontal=result.panels.filter(p=>p.matType==='horizontalBase');
  assert.deepEqual(horizontal.map(p=>round(p.w)).sort((a,b)=>a-b),[163.4,163.4,184.2,208.8,229.6,229.6]);
  assert.deepEqual(horizontal.filter(p=>p.x<0).map(p=>[round(p.y),round(p.x+p.w/2)]).sort((a,b)=>a[0]-b[0]),[[0.9,12.3],[30.9,33.1],[60.9,33.1]]);
});

test('Slant 263.3cm source retains small unlabelled 3cm side wings', () => {
  const result=calculateSlantPanels({width:263.3,height:163,depth:32,thickness:2,density:100,rowHeights:[38,38,38,38],numRows:4,hasBackPanel:false});
  assert.deepEqual(result.openings.filter(o=>o.rowIndex===0).map(o=>round(o.width)),[26.2,44.7,44.7,44.6,44.7,44.6,3]);
  assert.equal(result.openings.filter(o=>o.width<6).length,4);
});

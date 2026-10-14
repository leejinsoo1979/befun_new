import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
import data from './type01-source-fixtures.json' with { type: 'json' };
import heldout from './type01-heldout-fixtures.json' with { type: 'json' };

registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return next(specifier + '.ts', context);
    throw error;
  }
} });
const { calculateGridPanels } = await import('../../src/lib/three/styles/grid.ts');
const calculate = { grid: calculateGridPanels };
const round = value => Math.round(value * 1e5) / 1e5;
const envelope = p => [p.x-p.width/2,p.x+p.width/2,p.y-p.height/2,p.y+p.height/2].map(v=>round(v*10));
const digest = records => ({ count: records.length, sha256: createHash('sha256').update(JSON.stringify(records.sort())).digest('hex') });

// Expected digests were frozen from the public Type01 decoder plus its final
// manufacturing split, without importing Befun's geometry into the oracle.
// Numeric rules are production data; the public application bundle is not shipped.
for (const [index, fixture] of [...data.fixtures, ...heldout.fixtures].entries()) {
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


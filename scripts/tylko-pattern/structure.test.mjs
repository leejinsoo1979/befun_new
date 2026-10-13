import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import fixtures from './structure-fixtures.json' with { type: 'json' };
import { calculatePatternPanels } from '../../src/lib/three/styles/pattern.ts';

// Expected signatures were captured from the reference decoder, independently
// of Befun before manufacturing splits. Rejoin only touching horizontal pieces
// to compare the occupied structure; physical joints have their own oracle tests.
// Coordinates are compared as multisets at 0.001 mm precision.
const key = values => values.map(x => Math.round(x * 1000) / 1000).join(',');
function signature(panels) {
  const horizontals = panels.filter(p => p.matType === 'horizontalBase').sort((a,b) => a.y-b.y || a.x-b.x);
  const joined = [];
  for (const panel of horizontals) {
    const prior = joined[joined.length-1];
    if (prior && prior.y === panel.y && prior.h === panel.h && prior.d === panel.d && prior.z === panel.z &&
      Math.abs(prior.x+prior.w/2-panel.x+panel.w/2)<1e-8) {
      const left=prior.x-prior.w/2, right=panel.x+panel.w/2;
      prior.x=(left+right)/2;
      prior.w=right-left;
    } else joined.push({...panel});
  }
  const parts = [...panels.filter(p=>p.matType!=='horizontalBase'), ...joined].map(p => {
    if (p.matType === 'horizontalBase') return key([0, (p.x - p.w / 2) * 10, (p.x + p.w / 2) * 10, p.y * 10 - 9, p.y * 10 - 9]);
    if (p.matType === 'verticalBase') return key([1, p.x * 10, p.x * 10, (p.y - p.h / 2) * 10 - 9, (p.y + p.h / 2) * 10 - 9]);
    assert.equal(p.matType, 'supportPanel');
    return key([2, (p.x - p.w / 2) * 10, (p.x + p.w / 2) * 10, (p.y - p.h / 2) * 10 - 9, (p.y + p.h / 2) * 10 - 9]);
  }).sort();
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

test('Type02 open Pattern: 3,636 independently captured structure fixtures', () => {
  for (const { width, density, rowHeights, sha256 } of fixtures.fixtures) {
    const input = { width, density, rowHeights, numRows: rowHeights.length,
      height: rowHeights.reduce((sum, h) => sum + h + 2, 2), depth: 40, thickness: 2, hasBackPanel: false };
    assert.equal(signature(calculatePatternPanels(input).panels), sha256,
      JSON.stringify({ width, density, rowHeights }));
  }
});

test('returning to density restores geometry without hidden local history', () => {
  const input = { width: 317, density: 23, rowHeights: [18, 28, 38], numRows: 3,
    height: 92, depth: 32, thickness: 2, hasBackPanel: false };
  const original = calculatePatternPanels(input);
  calculatePatternPanels({ ...input, density: 99 });
  assert.deepEqual(calculatePatternPanels(input), original);
  assert.ok(original.openings.every(c => c.width > 0 && c.height > 0));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateMosaicPanels } from '../../src/lib/three/styles/mosaic.ts';
const base = { width: 232, height: 202, depth: 32, thickness: 2, density: 69.2,
  rowHeights: [38, 38, 38, 38, 38], numRows: 5, hasBackPanel: false };

function overlaps(a, b) {
  return ['x','y','z'].every((axis, i) => {
    const extent = ['w','h','d'][i];
    return Math.min(a[axis] + a[extent] / 2, b[axis] + b[extent] / 2) -
      Math.max(a[axis] - a[extent] / 2, b[axis] - b[extent] / 2) > 1e-7;
  });
}

test('mosaic-001: default partial backs, merged opening and split shelf match observed row', () => {
  const { panels, cells, panelCount } = calculateMosaicPanels(base);
  assert.equal(panelCount - 1, 6);
  assert.equal(panels.filter(p => p.matType === 'supportPanel').length, 0);
  assert.equal(panels.filter(p => p.matType === 'backPanel').length, 10);
  const bottom = cells.filter(c => c.rowIndex === 0);
  assert.deepEqual(bottom.map(c => Math.floor(c.width + 1e-8)), [40,40,29,29,29,40,40,40]);
  assert.deepEqual(bottom.map(c => Math.floor(c.height + 1e-8)), [78,38,38,18,18,38,18,18]);
  assert.deepEqual(bottom.map(c => c.hasBack), [true,false,false,true,true,false,true,true]);
  const structural = panels.filter(p => ['horizontalBase','verticalBase'].includes(p.matType));
  for (const p of structural) assert.equal(p.matType === 'horizontalBase' ? p.h : p.w, 1.8);
  for (let i = 0; i < structural.length; i++) for (let j = i + 1; j < structural.length; j++) {
    assert.ok(!overlaps(structural[i], structural[j]), `overlapping structural boards ${i},${j}`);
  }
  for (const c of cells) assert.ok(!structural.some(p => Math.abs(p.x - c.x) < p.w / 2 && Math.abs(p.y - c.y) < p.h / 2), 'cell center must be open');
});

test('variable rows and width boundaries retain positive boards and deterministic partial backs', () => {
  for (const width of [30, 56.7, 58.6, 60, 77.8, 77.9, 173, 232, 450]) for (const density of [0, 1, 46, 50, 54, 99, 100]) {
    const input = { ...base, width, density, rowHeights:[38,28,18], numRows:3 };
    const output = calculateMosaicPanels(input);
    for (const p of output.panels) {
      assert.ok(p.w > 0 && p.h > 0 && p.d > 0);
      assert.ok(p.x - p.w / 2 >= -width / 2 - 1e-7);
      assert.ok(p.x + p.w / 2 <= width / 2 + 1e-7);
      assert.ok(p.y - p.h / 2 >= -1e-7);
      assert.ok(p.y + p.h / 2 <= output.bodyHeight + 1e-7);
    }
    const closed = calculateMosaicPanels({ ...input, hasBackPanel:true });
    assert.ok(closed.cells.every(c => c.hasBack));
    assert.deepEqual(calculateMosaicPanels(input), output);
  }
});

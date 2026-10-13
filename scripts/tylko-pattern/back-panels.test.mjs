import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePatternPanels } from '../../src/lib/three/styles/pattern.ts';

const base = {
  width: 30, height: 42, depth: 40, thickness: 2, density: 2,
  rowHeights: [38], numRows: 1, hasBackPanel: false,
};

test('pattern-006: selecting a back closes the 26 × 38 cm opening', () => {
  const open = calculatePatternPanels(base);
  const closed = calculatePatternPanels({ ...base, hasBackPanel: true });
  const backs = closed.panels.filter(p => p.matType === 'backPanel');
  assert.equal(backs.length, 1);
  assert.ok(Math.abs(backs[0].w - 26.4) < 1e-8);
  assert.ok(Math.abs(backs[0].h - 38.2) < 1e-8);
  assert.ok(Math.abs(backs[0].x - backs[0].w / 2 + 13.2) < 1e-8);
  assert.ok(Math.abs(backs[0].x + backs[0].w / 2 - 13.2) < 1e-8);
  assert.ok(Math.abs(backs[0].y - backs[0].h / 2 - 1.8) < 1e-8);
  assert.equal(backs[0].y + backs[0].h / 2, 40);
  assert.deepEqual(closed.panels.filter(p => p.matType === 'verticalBase' || p.matType === 'horizontalBase'),
    open.panels.filter(p => p.matType === 'verticalBase' || p.matType === 'horizontalBase'));
  // Overlapped supports are hidden by Befun; manufacturing equivalence is pending.
  assert.deepEqual(calculatePatternPanels(base), open);
});

test('narrow inputs: back panels fit each opening across narrow widths, heights, depths', () => {
  for (const width of [31, 37, 43]) {
    for (const depth of [24, 32, 40]) {
      const rowHeights = [18, 28, 38];
      const output = calculatePatternPanels({ ...base, width, depth, rowHeights,
        numRows: 3, height: 92, density: 77, hasBackPanel: true });
      const backs = output.panels.filter(p => p.matType === 'backPanel');
      assert.equal(backs.length, 3);
      let floorTop = 1.8;
      for (let i = 0; i < 3; i++) {
        const p = backs[i];
        assert.ok(Math.abs(p.w - (width - 3.6)) < 1e-8);
        assert.ok(Math.abs(p.h - rowHeights[i] - 0.2) < 1e-8);
        assert.ok(Math.abs(p.y - p.h / 2 - floorTop) < 1e-8);
        assert.equal(p.z - p.d / 2, 0);
        assert.ok(p.z + p.d / 2 <= depth);
        floorTop += rowHeights[i] + 2;
      }
    }
  }
});

test('row hardware requests a back only for its own row', () => {
  const output = calculatePatternPanels({ ...base, width: 37, rowHeights: [18, 28, 38],
    numRows: 3, height: 92, hardwareLayers: [1] });
  const backs = output.panels.filter(p => p.matType === 'backPanel');
  assert.equal(backs.length, 1);
  assert.ok(Math.abs(backs[0].h - 28.2) < 1e-8);
  assert.ok(Math.abs(backs[0].y - backs[0].h / 2 - 21.8) < 1e-8);
});

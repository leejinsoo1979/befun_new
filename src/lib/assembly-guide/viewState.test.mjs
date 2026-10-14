import test from 'node:test';
import assert from 'node:assert/strict';
const { panelInside } = await import('./viewState.ts');

test('manual transparent/solid choice persists through every assembly and release chapter', () => {
  for (const topic of ['connector', 'back-panel', 'tylko-clip']) for (const action of ['assemble', 'disassemble']) for (let step = 0; step < 8; step++) {
    assert.equal(panelInside(topic, step, action, 'transparent'), true);
    assert.equal(panelInside(topic, step, action, 'solid'), false);
  }
});

test('automatic choreography remains separate from explicit views and static leg inspection', () => {
  assert.equal(panelInside('connector', 6, 'assemble', 'auto'), true);
  assert.equal(panelInside('connector', 7, 'assemble', 'auto'), false);
  assert.equal(panelInside('connector', 1, 'disassemble', 'auto'), true);
  assert.equal(panelInside('legs', 1, 'disassemble', 'transparent'), false);
});

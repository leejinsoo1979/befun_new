import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSavedDesign } from './savedDesign.ts';

const design = {
  version: 1, name: '행별 구성 테스트', config: {
    style: 'pattern', width: 111, height: 99999, depth: 40, density: 41,
    color: 'S_Midnight Blue', colorCategory: 'solid', hasBackPanel: true,
    rowHeights: [28, 38], numRows: 2, doorsCreatedLayers: [0], drawersCreatedLayers: [1],
    hardwareRowStyles: { 0: 13, 1: 31 },
  },
};
describe('saved design links', () => {
  it('restores style, density and per-row hardware while deriving the height from the rows', () => {
    const restored = parseSavedDesign(JSON.stringify(design));
    assert.deepEqual(restored?.config, { ...design.config, height: 72 });
  });
  for (const patch of [
    { width: 451 }, { depth: 50 }, { density: -1 }, { style: 'unknown' },
    { numRows: 3 }, { rowHeights: [28, -38] }, { rowHeights: [] },
    { doorsCreatedLayers: [2] }, { doorsCreatedLayers: [0, 0] },
    { hardwareRowStyles: { '-1': 13 } }, { hardwareRowStyles: { 0: 99 } },
    { hardwareRowStyles: { 0: 31 } }, { hardwareRowStyles: { 1: 13 } },
    { color: '<script>' }, { colorCategory: 'unknown' },
  ]) it(`rejects invalid configuration ${JSON.stringify(patch)}`, () => {
    assert.equal(parseSavedDesign(JSON.stringify({ ...design, config: { ...design.config, ...patch } })), null);
  });
  it('rejects broken JSON and unsupported versions', () => {
    assert.equal(parseSavedDesign('{'), null);
    assert.equal(parseSavedDesign(JSON.stringify({ ...design, version: 2 })), null);
  });
});

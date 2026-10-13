import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Load the real stores, resolving Next's TS path aliases without a browser.
const root = process.cwd();
const require = createRequire(path.join(root, 'package.json'));
const modules = new Map();
function loadStoreModule(filename) {
  const absolute = path.resolve(root, filename);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const loadedModule = { exports: {} };
  modules.set(absolute, loadedModule);
  const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (id) => {
    if (id.startsWith('@/')) return loadStoreModule(`src/${id.slice(2)}.ts`);
    if (id.startsWith('.')) return loadStoreModule(path.resolve(path.dirname(absolute), `${id}.ts`));
    return require(id);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: absolute })(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const { useShelfStore: shelf } = loadStoreModule('src/stores/useShelfStore.ts');
const { useHardwareStore: hardware } = loadStoreModule('src/stores/useHardwareStore.ts');

beforeEach(() => {
  shelf.setState(shelf.getInitialState());
  hardware.getState().reset();
});

function assertHardware(doors, drawers, styles) {
  const state = hardware.getState();
  assert.deepEqual(state.doorsCreatedLayers, doors);
  assert.deepEqual(state.drawersCreatedLayers, drawers);
  assert.deepEqual(state.rowStyles, styles);
}

test('height shrink clears removed row modes and open state before rows are added again', () => {
  hardware.setState({ doorsCreatedLayers: [0, 2], drawersCreatedLayers: [3],
    rowStyles: { 0: 12, 2: 13, 3: 31, 9: 22 }, openDoors: { 2: true }, openDrawers: { 3: true } });
  shelf.getState().setHeight(62);
  assert.equal(shelf.getState().numRows, 2);
  assertHardware([0], [], { 0: 12 });
  assert.deepEqual(hardware.getState().openDoors, {});
  assert.deepEqual(hardware.getState().openDrawers, {});
  shelf.getState().setHeight(122);
  assert.equal(shelf.getState().numRows, 4);
  assertHardware([0], [], { 0: 12 });
  hardware.getState().setMode(2, 'drawers', 'some');
  assertHardware([0], [2], { 0: 12, 2: 21 });
});

test('explicit row-count slider cleanup keeps cached row heights but removes deleted hardware', () => {
  hardware.getState().restore([0, 3], [2], { 0: 12, 2: 31, 3: 13 });
  shelf.setState({ numRows: 1, rowHeights: [28, 32, 32, 32], height: 32 });
  shelf.getState().reconcileHardware();
  assertHardware([0], [], { 0: 12 });
  assert.deepEqual(shelf.getState().rowHeights, [28, 32, 32, 32]);
  shelf.setState({ numRows: 4, height: 134 });
  shelf.getState().reconcileHardware();
  assertHardware([0], [], { 0: 12 });
});

test('shortening a mixed row removes doors permanently while preserving allowed drawers', () => {
  hardware.getState().restore([0], [0], { 0: 22 });
  shelf.getState().setRowHeight(0, 18);
  assertHardware([], [0], { 0: 21 });
  shelf.getState().setRowHeight(0, 38);
  assertHardware([], [0], { 0: 21 });
});

test('changing a lower row height removes a drawer pushed above the allowed elevation', () => {
  shelf.setState({ rowHeights: [28, 38, 38, 38], numRows: 4, height: 152 });
  hardware.getState().restore([], [3], { 3: 31 });
  shelf.getState().setRowHeight(0, 38);
  assert.deepEqual(hardware.getState().drawersCreatedLayers, []);
  shelf.getState().setRowHeight(0, 28);
  assert.deepEqual(hardware.getState().drawersCreatedLayers, []);
  assert.equal(hardware.getState().rowStyles[3], undefined);
});

test('reducing depth removes drawer modes and restoring depth does not restore old drawers', () => {
  hardware.getState().restore([0], [0, 1], { 0: 22, 1: 31 });
  shelf.getState().setDepth(24);
  assert.deepEqual(hardware.getState().doorsCreatedLayers, [0]);
  assert.deepEqual(hardware.getState().drawersCreatedLayers, []);
  assert.equal(hardware.getState().rowStyles[0], 12);
  shelf.getState().setDepth(32);
  assertHardware([0], [], { 0: 12 });
});

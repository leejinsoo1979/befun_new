import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { installTestLoader } from './loader.mjs';

installTestLoader({ mockServices: false });
const { currentConfiguration, restoreSavedConfiguration } = await import('../../src/components/storefront/configuration.ts');
const { parseSavedDesign, saveLocalDesign, localDesignKey } = await import('../../src/components/storefront/savedDesign.ts');
const { encodeDesignToURL, decodeDesignFromURL, serializeDesignConfig, deserializeDesignConfig } = await import('../../src/lib/sharing.ts');
const { useShelfStore } = await import('../../src/stores/useShelfStore.ts');
const { useMaterialStore } = await import('../../src/stores/useMaterialStore.ts');
const { useHardwareStore } = await import('../../src/stores/useHardwareStore.ts');

const fixture = {
  baseType: 'legs', legFinish: 'black', style: 'pattern', density: 41,
  width: 163, height: 122, depth: 40, hasBackPanel: true,
  color: 'S_Midnight Blue', colorCategory: 'solid', rowHeights: [28, 38, 18, 28], numRows: 4,
  doorsCreatedLayers: [0, 3], drawersCreatedLayers: [1, 3], hardwareRowStyles: { 0: 13, 1: 31, 3: 22 },
};
const parsed = config => parseSavedDesign(JSON.stringify({ version: 1, name: 'R3 저장 검증', config }));
function scramble() {
  useShelfStore.setState({ height: 32, numRows: 1, rowHeights: [28], style: 'pixel', depth: 24, baseType: 'standard', legFinish: 'silver' });
  useMaterialStore.getState().setColor('C_White', 'classic');
  useHardwareStore.getState().reset();
}
function browserStorage() {
  const values = new Map();
  const events = new EventTarget();
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  globalThis.window = {
    location: { origin: 'http://localhost:3003' },
    dispatchEvent: event => events.dispatchEvent(event),
  };
  return values;
}

for (const baseType of ['standard', 'legs']) test(`R3-SAVE-01: ${baseType} local save/list/restore/resave`, () => {
  browserStorage();
  const expected = parsed({ ...fixture, baseType });
  scramble();
  assert.equal(restoreSavedConfiguration(expected.config), true);
  const snapshot = currentConfiguration();
  assert.deepEqual(snapshot, expected.config);
  const url = saveLocalDesign({ ...expected, config: snapshot });
  const entries = JSON.parse(localStorage.getItem(localDesignKey));
  assert.equal(entries.length, 1);
  const saved = parseSavedDesign(entries[0]);
  assert.deepEqual(saved.config, expected.config);
  assert.deepEqual(saved, parseSavedDesign(new URL(url).searchParams.get('design')));
  scramble();
  assert.equal(restoreSavedConfiguration(saved.config), true);
  assert.deepEqual(currentConfiguration(), snapshot);
  saveLocalDesign({ ...saved, config: currentConfiguration() });
  assert.equal(JSON.parse(localStorage.getItem(localDesignKey)).length, 1);
});

for (const style of ['pattern', 'mosaic']) test(`R3-SAVE-02: ${style} varied rows and per-row door/drawer modes`, () => {
  const saved = parsed({ ...fixture, style });
  scramble();
  assert.equal(restoreSavedConfiguration(saved.config), true);
  assert.deepEqual(currentConfiguration(), saved.config);
  assert.equal(useShelfStore.getState().numRows, 4);
  assert.deepEqual(useHardwareStore.getState().rowStyles, fixture.hardwareRowStyles);
  const json = serializeDesignConfig(currentConfiguration());
  scramble();
  restoreSavedConfiguration(deserializeDesignConfig(json));
  assert.deepEqual(currentConfiguration(), saved.config);
});

test('snapshot owns hardware arrays/maps and derives body height from active rows', () => {
  restoreSavedConfiguration(fixture);
  useShelfStore.setState({ height: 999, rowHeights: [...fixture.rowHeights, 28, 28] });
  const saved = currentConfiguration();
  assert.equal(saved.height, 122);
  assert.deepEqual(saved.rowHeights, fixture.rowHeights);
  saved.doorsCreatedLayers.push(2);
  saved.drawersCreatedLayers.push(2);
  saved.hardwareRowStyles[0] = 12;
  saved.rowHeights[0] = 18;
  assert.deepEqual(useHardwareStore.getState().doorsCreatedLayers, fixture.doorsCreatedLayers);
  assert.deepEqual(useHardwareStore.getState().drawersCreatedLayers, fixture.drawersCreatedLayers);
  assert.equal(useHardwareStore.getState().rowStyles[0], 13);
  assert.equal(useShelfStore.getState().rowHeights[0], 28);
});

for (const [color, colorCategory] of [['C_White', 'classic'], ['N_Walnut', 'natural'], ['S_White', 'solid'], ['Sand+Midnight Blue', 'edgeMix']]) {
  test(`R3-SAVE-03: legacy and new URL ${colorCategory}`, () => {
    const config = parsed({ ...fixture, color, colorCategory }).config;
    const url = encodeDesignToURL(config, 'http://localhost:3003/configurator?source=r3#design');
    assert.equal(new URL(url).searchParams.get('source'), 'r3');
    assert.equal(new URL(url).hash, '#design');
    assert.deepEqual(decodeDesignFromURL(url), config);
    const old = JSON.parse(new URL(url).searchParams.get('state'));
    delete old.baseType; delete old.legFinish; delete old.colorCategoryURL; delete old.heightURL;
    const legacy = `http://localhost:3003/configurator?state=${encodeURIComponent(JSON.stringify(old))}`;
    const decoded = decodeDesignFromURL(legacy);
    assert.deepEqual(decoded, { ...config, baseType: 'standard', legFinish: 'silver' });
    scramble(); restoreSavedConfiguration(decoded);
    assert.deepEqual(currentConfiguration(), decoded);
    assert.deepEqual(decodeDesignFromURL(`http://localhost:3003/configurator?state=${encodeURIComponent(encodeURIComponent(JSON.stringify(old)))}`), decoded);
  });
}

test('R3-SAVE-03: old local records acquire standard/silver and canonical hardware before storage', () => {
  browserStorage();
  const old = { ...fixture, height: 999, baseType: undefined, legFinish: undefined, hardwareRowStyles: undefined };
  const expected = parsed(old);
  localStorage.setItem(localDesignKey, JSON.stringify([JSON.stringify({ ...expected, config: old })]));
  saveLocalDesign(expected);
  const list = JSON.parse(localStorage.getItem(localDesignKey));
  assert.equal(list.length, 1);
  assert.deepEqual(JSON.parse(list[0]), expected);
});

for (const invalid of [{ style: 'pixel' }, { depth: 24 }]) {
  test(`R3-SAVE-04: unsupported legs ${JSON.stringify(invalid)}`, () => {
    const config = { ...fixture, ...invalid };
    const normalized = parsed(config).config;
    assert.equal(normalized.baseType, 'standard');
    scramble(); assert.equal(restoreSavedConfiguration(config), true);
    assert.equal(useShelfStore.getState().baseType, 'standard');
    assert.equal(currentConfiguration().legFinish, 'black');
  });
}
test('R3-SAVE-04: latest Classic/Natural legs support retains silver/black finishes', () => {
  for (const [color, colorCategory] of [['C_White', 'classic'], ['N_Walnut', 'natural']]) {
    for (const legFinish of ['silver', 'black']) {
      const config = parsed({ ...fixture, color, colorCategory, legFinish }).config;
      assert.equal(config.baseType, 'legs');
      scramble(); restoreSavedConfiguration(config);
      assert.deepEqual(currentConfiguration(), config);
    }
  }
});

test('R3-SAVE-04: invalid enums rejected in parser/JSON/URL/restore without changing current stores', () => {
  restoreSavedConfiguration(fixture);
  const before = currentConfiguration();
  for (const invalid of [{ baseType: 'unknown' }, { legFinish: 'chrome' }, { style: 'fake' }]) {
    const config = { ...fixture, ...invalid };
    assert.equal(parsed(config), null);
    assert.throws(() => deserializeDesignConfig(JSON.stringify(config)));
    assert.equal(restoreSavedConfiguration(config), false);
    assert.deepEqual(currentConfiguration(), before);
    const data = JSON.parse(new URL(encodeDesignToURL(fixture, 'http://localhost:3003/configurator')).searchParams.get('state'));
    Object.assign(data, invalid.style ? { variantURL: invalid.style } : invalid);
    assert.equal(decodeDesignFromURL(`http://localhost:3003/configurator?state=${encodeURIComponent(JSON.stringify(data))}`), null);
  }
});

test('restoration reconciles hardware unsupported by short rows/depth', () => {
  const config = { ...fixture, depth: 24, rowHeights: [18, 38, 18, 28] };
  restoreSavedConfiguration(config);
  assert.deepEqual(useHardwareStore.getState().doorsCreatedLayers, [3]);
  assert.deepEqual(useHardwareStore.getState().drawersCreatedLayers, []);
  const snapshot = currentConfiguration();
  restoreSavedConfiguration(snapshot);
  assert.deepEqual(currentConfiguration(), snapshot);
});

test('R3-SAVE-06: restore/resave/reload and color order resolve base against target color', () => {
  const target = parsed(fixture).config;
  scramble(); restoreSavedConfiguration(target);
  assert.deepEqual(currentConfiguration(), target);
  const reloaded = deserializeDesignConfig(serializeDesignConfig(currentConfiguration()));
  scramble(); restoreSavedConfiguration(reloaded);
  assert.deepEqual(currentConfiguration(), target);
  useMaterialStore.getState().setColor('C_White', 'classic');
  assert.equal(currentConfiguration().baseType, 'legs');
  useMaterialStore.getState().setColor('S_White', 'solid');
  assert.equal(currentConfiguration().baseType, 'legs');
  useShelfStore.getState().setDepth(24);
  assert.equal(currentConfiguration().baseType, 'standard');
  useShelfStore.getState().setDepth(40);
  assert.equal(currentConfiguration().baseType, 'standard');
  restoreSavedConfiguration(target);
  assert.deepEqual(currentConfiguration(), target);
});

// Exercise the actual share click handler body with actual stores; rendering/network is separate browser QA.
function shareHandler(source, config, routes) {
  const file = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let declaration;
  function find(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'handleLoadDesign') declaration = node;
    ts.forEachChild(node, find);
  }
  find(file);
  assert.ok(declaration, 'share handler exists');
  const script = ts.transpileModule(`const ${declaration.getText(file)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function('design', 'router', 'useShelfStore', 'useMaterialStore', 'useHardwareStore', 'restoreSavedConfiguration', 'setError', `${script}; return handleLoadDesign;`)(
    { config }, { push: path => routes.push(path) }, useShelfStore, useMaterialStore, useHardwareStore, restoreSavedConfiguration,
    () => assert.fail('valid share should restore'),
  );
}
test('share page restores all rows/base/hardware independent of previous height', () => {
  const source = readFileSync(new URL('../../src/app/share/[code]/page.tsx', import.meta.url), 'utf8');
  scramble();
  const routes = [];
  shareHandler(source, fixture, routes)();
  assert.deepEqual(currentConfiguration(), parsed(fixture).config);
  assert.deepEqual(routes, ['/configurator']);
});

test('SAVE-CONSUMER-PATCH: padded inactive rows from manual configurator DTO fail validation; canonical snapshot restores', () => {
  restoreSavedConfiguration(fixture);
  useShelfStore.getState().recalculateRows();
  const shelf = useShelfStore.getState();
  const snapshot = currentConfiguration();
  const manual = { ...snapshot, rowHeights: shelf.rowHeights };
  assert.equal(shelf.rowHeights.length, 12);
  assert.equal(parsed(manual), null);
  assert.deepEqual(parsed(snapshot).config, parsed(fixture).config);
});

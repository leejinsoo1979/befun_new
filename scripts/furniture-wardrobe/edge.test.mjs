import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const root = path.resolve('src/lib/furniture/wardrobe');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'befun-wardrobe-test-'));
try {
  for (const file of fs.readdirSync(root)) {
    if (file.endsWith('.json')) fs.copyFileSync(path.join(root, file), path.join(output, file));
    if (file.endsWith('.ts')) {
      const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
        .replace(/from '(\.\/[^']+)'/g, (_, name) => `from '${name.endsWith('.json') ? name : name + '.mjs'}'${name.endsWith('.json') ? ' with {type:"json"}' : ''}`);
      fs.writeFileSync(path.join(output, file.replace('.ts', '.mjs')), source);
    }
  }
  const { generateEdgeSourceGeometry, normalizeEdgeWardrobe, getEdgeColumnCounts } = await import(pathToFileURL(path.join(output, 'edge.mjs')).href);
  const { resolveEdgeDrawer } = await import(pathToFileURL(path.join(output, 'drawers.mjs')).href);
  const { generateEdgeWardrobe } = await import(pathToFileURL(path.join(output, 'edge.mjs')).href);
  const { validateWardrobeInput, createWardrobeInput } = await import(pathToFileURL(path.join(output, 'initial.mjs')).href);
  const { resolveToneDrawer } = await import(pathToFileURL(path.join(output, 'tone-drawers.mjs')).href);
  const fixtures = JSON.parse(fs.readFileSync('scripts/furniture-wardrobe/edge-source-fixtures.json', 'utf8'));
  const keys = ['x1', 'x2', 'y1', 'y2', 'z1', 'z2', 'subtype', 'direction', 'handle', 'handle_type'];
  const fingerprint = parts => parts.map(part => JSON.stringify(Object.fromEntries(keys.filter(key => part[key] !== undefined).map(key => [key, part[key]])))).sort();
  for (const [index, fixture] of fixtures.entries()) {
    const result = generateEdgeSourceGeometry(fixture.input);
    for (const key of ['slabs', 'walls', 'backs', 'doors', 'drawers', 'bars']) assert.deepEqual(fingerprint(result[key]), fingerprint(fixture.expected[key]), `Edge source case ${index}, ${key}`);
  }
  const drawerFixtures = JSON.parse(fs.readFileSync('scripts/furniture-wardrobe/edge-drawer-fixtures.json', 'utf8'));
  for (const fixture of drawerFixtures) {
    const result = resolveEdgeDrawer(fixture.drawer, fixture.drawers, fixture.doors, '1', fixture.index);
    const panels = [result.front, ...result.parts];
    for (let i = 0; i < 5; i++) for (const key of ['x', 'y', 'z', 'w', 'h', 'd']) assert.ok(Math.abs(panels[i][key] - fixture.expected[i][key]) < 1e-8, `Drawer panel ${i} ${key}`);
    assert.ok(Math.abs(result.travelCm - fixture.travelCm) < 1e-8);
  }
  for (const width of [400, 508, 509, 1035, 1036, 1553, 1554, 2070, 4072, 6000]) assert.ok(getEdgeColumnCounts(width).length);
  const input = fixtures[0].input;
  assert.equal(normalizeEdgeWardrobe({ ...input, heightMm: 1990 }).heightMm, 1980);
  assert.equal(normalizeEdgeWardrobe({ ...input, heightMm: 2450 }).heightMm, 2450);
  assert.equal(normalizeEdgeWardrobe({ ...input, sections: [{ ...input.sections[0], facade: 'open' }] }).sections[0].seriesId.startsWith('Open_'), true);
  const valid = createWardrobeInput('edge');
  assert.deepEqual(validateWardrobeInput(valid), []);
  for (const change of [{model:'bad'}, {sections:[]}, {heightMm:2281}, {lighting:'yes'}, {drawerStyle:'bad'}, {topEdge:1}, {sections:[{id:'x',seriesId:'unknown'}]}, {sections:valid.sections.map(s=>({...s,id:'same'}))}, {sections:valid.sections.map(s=>({...s,widthMm:NaN}))}, {sections:valid.sections.map(s=>({...s,facade:'bad'}))}, {sections:valid.sections.map(s=>({...s,doorDirection:'bad'}))}]) assert.ok(validateWardrobeInput({...valid,...change}).length);
  const stable = generateEdgeWardrobe({...valid,sections:valid.sections.map((s,i)=>({...s,id:`stable-${i}`}))});
  for(const item of [...stable.sections,...stable.fronts,...stable.drawers,...stable.bars,...stable.openings]) assert.ok((item.sectionId ?? item.id).startsWith('stable-'));
  const toneDrawers = JSON.parse(fs.readFileSync('scripts/furniture-wardrobe/tone-drawer-fixtures.json','utf8'));
  let tonePanelCount=0;
  for(const fixture of toneDrawers) for(const [index,drawer] of fixture.drawers.entries()) {
    const result=resolveToneDrawer(drawer,fixture.drawers,fixture.faces,'1',index);
    assert.ok(result);
    for(const [i,panel] of [result.front,...result.parts].entries()) {
      const expected=fixture.expected[index][i];
      for(const [center,size,low,high] of [['x','w','x1','x2'],['y','h','y1','y2'],['z','d','z1','z2']]) {
        assert.ok(Math.abs((panel[center]-panel[size]/2)*10-expected[low])<=1+1e-8);
        assert.ok(Math.abs((panel[center]+panel[size]/2)*10-expected[high])<=1+1e-8);
      }
      tonePanelCount++;
    }
  }
  console.log(`PASS Tone ${toneDrawers.length} drawer cases / ${tonePanelCount} panels, <=1mm source rounding; strict save validation; stable IDs`);
  console.log(`PASS Edge ${fixtures.length} frozen source geometry cases + ${drawerFixtures.length} physical drawer cases + option boundaries`);
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}

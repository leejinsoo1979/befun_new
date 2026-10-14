import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const filename = new URL('../../src/lib/furniture/wardrobe/fronts.ts', import.meta.url);
const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { resolveWardrobeDoor } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const fixtures = JSON.parse(fs.readFileSync(new URL('./front-source-fixtures.json', import.meta.url)));
for (const [index, fixture] of fixtures.cases.entries()) {
  test(`physical ${fixture.model} door ${index}`, () => {
    const doors = fixture.doors;
    const actual = resolveWardrobeDoor(doors[0], doors, fixture.model, 'one', index);
    assert.ok(actual);
    for (const [key, value] of Object.entries(fixture.expected)) {
      assert.ok(Math.abs(actual[key] - value) < 1e-8, `${key}: ${actual[key]} vs ${value}`);
    }
  });
}

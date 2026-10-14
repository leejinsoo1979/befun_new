import fs from 'node:fs';
import assert from 'node:assert/strict';
import { loadToneCore, fingerprintTone } from './tone-test-loader.mjs';
const { core, cleanup } = await loadToneCore();
try {
  const fixtures = JSON.parse(fs.readFileSync('scripts/furniture-wardrobe/tone-source-fixtures.json', 'utf8'));
  for (const fixture of fixtures) {
    const actual = core.generateToneSourceGeometry(fixture.input);
    for (const key of Object.keys(fixture.expected)) assert.deepEqual(fingerprintTone(actual[key] ?? []), fingerprintTone(fixture.expected[key]), `${fixture.id} ${key}`);
    const restored = JSON.parse(JSON.stringify(core.normalizeToneWardrobe(fixture.input)));
    for (const key of Object.keys(fixture.expected)) assert.deepEqual(fingerprintTone(core.generateToneSourceGeometry(restored)[key] ?? []), fingerprintTone(fixture.expected[key]), `${fixture.id} restored ${key}`);
  }
  const input = { model: 'tone', widthMm: 1500, heightMm: 2000, depthMm: 530, sections: [{ id: 'persistent-one', seriesId: 3739 }, { id: 'persistent-two', seriesId: 3747 }] };
  assert.equal(core.toneWardrobeLayoutOptions().length, 12);
  assert.deepEqual(core.getToneWidthOptions(input).map(o => o.id), ['12', '11', '21']);
  assert.equal(core.normalizeToneWardrobe({ ...input, widthMm: 5090 }).sections.length, 6);
  assert.equal(core.normalizeToneWardrobe({ ...input, widthMm: 1060, depthMm: 440 }).sections[0].seriesId, 3749);
  assert.deepEqual(core.generateToneWardrobe(input).sections.map(s => s.id), ['persistent-one', 'persistent-two']);
  const flipped = core.normalizeToneWardrobe({ ...input, sections: [input.sections[0], { ...input.sections[1], doorDirection: 'right' }] });
  assert.ok(flipped.sections.every(s => s.doorDirection === 'right'));
  console.log(`PASS Tone ${fixtures.length} independent source cases, JSON restore, stable IDs, width/fallback/direction boundaries`);
} finally { cleanup(); }

import fs from 'node:fs';
import assert from 'node:assert/strict';
import { toneOracle, compactToneGeometry, geometryKeys } from './tone-oracle.mjs';
import { loadToneCore, fingerprintTone } from './tone-test-loader.mjs';
const { core, cleanup } = await loadToneCore();
const cases = [], failures = [];
let checked = 0;
try {
  for (let i = 0; i < 720; i++) {
    const widthMm = 400 + (i * 137 % 561) * 10;
    const heightMm = [2000, 2370, 2380, 2700, 2710, 2740, 2990, 3000, 3190, 3400, 3600][i % 11];
    const depthMm = [400, 440, 450, 470, 480, 500, 510, 520, 530, 590, 720, 730, 800][i % 13];
    const input = { model: 'tone', widthMm, heightMm, depthMm, drawerStyle: i % 2 ? 'internal' : 'external', lighting: i % 3 === 0,
      sections: Array.from({ length: 6 }, (_, j) => ({ id: String(j + 1), seriesId: 3738 + (i + j * 3) % 12, doorDirection: i % 4 === 0 ? 'right' : 'left' })) };
    const options = core.getToneWidthOptions(input);
    if (options.length) input.toneWidthPattern = options[i % options.length].id;
    const expected = compactToneGeometry(toneOracle(input).geometry), actual = core.generateToneSourceGeometry(input);
    const differences = geometryKeys.filter(key => {
      try { assert.equal(JSON.stringify(fingerprintTone(actual[key] ?? [])), JSON.stringify(fingerprintTone(expected[key]))); return false; }
      catch { return true; }
    });
    checked++;
    if (differences.length) failures.push({ input, differences, actual: compactToneGeometry(actual), expected });
    if (i < 120 || i % 17 === 0) cases.push({ id: `tone-heldout-${String(i).padStart(3, '0')}`, input, expected });
  }
  fs.writeFileSync('/tmp/tone-heldout-failures.json', JSON.stringify(failures, null, 2));
  console.log({ checked, failures: failures.length, sample: failures.slice(0, 8).map(f => ({ input: f.input, differences: f.differences })) });
  if (!failures.length) {
    fs.writeFileSync('scripts/furniture-wardrobe/tone-source-fixtures.json', JSON.stringify(cases) + '\n');
    fs.writeFileSync('scripts/furniture-wardrobe/tone-verification.json', JSON.stringify({ source: 'legacy wardrobe engine1888, DNA Wardrobe Type03 v4, mesh2321', checked, failed: 0, savedFixtures: cases.length, compared: geometryKeys, maxCoordinateToleranceMm: 1e-7 }, null, 2) + '\n');
  }
} finally { cleanup(); }

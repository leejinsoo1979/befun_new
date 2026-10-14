import assert from 'node:assert/strict';

const base = process.argv[2] ?? 'http://localhost:3003';
const mode = process.argv[3] ?? '--unconfigured';
assert.ok(['--unconfigured', '--round-trip'].includes(mode), 'Use --unconfigured or --round-trip');
const config = {
  style: 'grid', density: 50, width: 90, height: 122, depth: 32,
  hasBackPanel: true, color: 'S_Midnight Blue', colorCategory: 'solid',
  rowHeights: [28, 28, 28, 28], numRows: 4,
  doorsCreatedLayers: [], drawersCreatedLayers: [], hardwareRowStyles: {},
};

async function check(path, expected, body) {
  const response = await fetch(new URL(path, base), body === undefined ? undefined : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
  });
  assert.equal(response.status, expected, `${body === undefined ? 'GET' : 'POST'} ${path}`);
  if (path.startsWith('/api/designs') && expected >= 400) {
    const codes = { 400: 'INVALID_DESIGN', 401: 'AUTH_REQUIRED', 404: 'DESIGN_NOT_FOUND', 503: 'DESIGN_STORAGE_UNAVAILABLE' };
    assert.equal((await response.clone().json()).code, codes[expected]);
  }
  console.log(`${response.status} ${body === undefined ? 'GET' : 'POST'} ${path}`);
  return response;
}

// Check the server mode before POST so an unconfigured-mode run cannot create a real design.
const unavailable = await check('/api/designs/R2MISS01', mode === '--unconfigured' ? 503 : 404);
if (mode === '--unconfigured') {
  assert.equal((await unavailable.json()).code, 'DESIGN_STORAGE_UNAVAILABLE');
}
await check('/api/designs', 400, '{}');
await check('/api/designs', 400, '{');
await check('/api/designs', 400, 'null');
await check('/api/designs', 401);
await check('/api/auth/session', 200);
await check('/api/orders', 401);
await check('/login', 200);
await check('/configurator', 200);

const saved = await check('/api/designs', mode === '--unconfigured' ? 503 : 200, JSON.stringify({ config }));
if (mode === '--unconfigured') {
  assert.equal((await saved.json()).code, 'DESIGN_STORAGE_UNAVAILABLE');
  console.log('PASS: unconfigured service, input/auth regressions, import-safe consumers');
  console.log('BLOCKED: real database save/fetch round-trip (DATABASE_URL not configured)');
} else {
  const data = await saved.json();
  assert.equal(typeof data.id, 'string');
  assert.equal(data.shareCode.length, 8);
  const fetched = await check(`/api/designs/${data.shareCode}`, 200);
  assert.deepEqual((await fetched.json()).config, config);
  console.log(`PASS: real database save/fetch round-trip; test shareCode ${data.shareCode}`);
  // The test design remains in the configured DB. No deletion/migration is performed.
}
